import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Checkbox, Chip } from "@mui/material";
import { Close as CloseIcon, Info as InfoIcon } from "@mui/icons-material";
import { createVendorAssignment, updateVendorAssignment, getVendorAssignment } from "../../services/vendorAssignment";
import { getRequisitionItems } from "../../services/requisition";
import VendorSelector from "../common/VendorSelector";
import RequisitionSelector from "../common/RequisitionSelector";
import AlertToast from "../ui/AlertToast";

// Merge requisition items with what THIS assignment already holds so the user
// can tick which items (and how much) go to this vendor.
//
// Assigning an item to a vendor means "please quote it", not "allocate this much
// of the buy" — so the same item can go to any number of vendors at full qty
// (competitive quoting) and can also be split (subset / reduced qty) per vendor.
// There is deliberately no per-item quantity ceiling. `assigned_qty` from the API
// is shown only as an info hint ("also requested from other vendors").
const buildRows = (reqItems, assignmentItems = [], defaultAllSelected = false) => {
  const assignedMap = {};
  assignmentItems.forEach((ai) => {
    assignedMap[String(ai.requisition_item)] = Number(ai.quantity);
  });
  return reqItems.map((it) => {
    const rid = String(it.id);
    const inThis = Object.prototype.hasOwnProperty.call(assignedMap, rid);
    return {
      requisition_item: rid,
      product: it.product,
      product_name: it.product_name || `Product ${it.product}`,
      unit: it.unit || "",
      requisitionQty: Number(it.quantity),
      requestedElsewhere: Number(it.assigned_qty != null ? it.assigned_qty : 0),
      selected: inThis || defaultAllSelected,
      assignQty: inThis ? assignedMap[rid] : Number(it.quantity),
    };
  });
};

// Fallback when we can't fetch requisition items (e.g. view-only) — build from
// the assignment's own lines so at least the assigned items are shown.
const rowsFromAssignment = (assignmentItems = []) =>
  assignmentItems.map((ai) => ({
    requisition_item: String(ai.requisition_item),
    product: ai.product,
    product_name: ai.product_name || `Product ${ai.product}`,
    unit: ai.unit || "",
    requisitionQty: Number(ai.quantity),
    requestedElsewhere: 0,
    selected: true,
    assignQty: Number(ai.quantity),
  }));

const VendorAssignmentModal = ({ open, onClose, editData, onSuccess, viewOnly = false }) => {
  const [form, setForm] = useState({ requisition: "", vendor: "", remarks: "" });
  const [rows, setRows] = useState([]);
  const [displayData, setDisplayData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isQuoted, setIsQuoted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "error", message: "" });

  useEffect(() => {
    const initData = async () => {
      if (editData) {
        setDisplayData(editData);
        setLoadingData(true);
        try {
          const { data } = await getVendorAssignment(editData.id);
          setDisplayData(data);
          const hasQuotation = data.quotations && data.quotations.length > 0;
          setIsQuoted(hasQuotation);
          setIsCompleted(data.status === "Completed");
          setForm({ requisition: data.requisition, vendor: data.vendor, remarks: data.remarks || "" });
          // Load the requisition items with this assignment excluded from the tally
          try {
            const res = await getRequisitionItems(data.requisition, editData.id);
            const reqItems = res.data.items || res.data || [];
            setRows(buildRows(reqItems, data.items || []));
          } catch {
            setRows(rowsFromAssignment(data.items || []));
          }
        } catch (err) {
          console.error("Failed to fetch assignment details", err);
          setRows(rowsFromAssignment(editData.items || []));
        } finally {
          setLoadingData(false);
        }
      } else {
        setDisplayData(null);
        setForm({ requisition: "", vendor: "", remarks: "" });
        setRows([]);
        setIsQuoted(false);
        setIsCompleted(false);
      }
    };
    if (open) initData();
  }, [editData, open]);

  if (!open) return null;

  const locked = viewOnly || isQuoted || isCompleted;

  const handleRequisitionChange = async (val) => {
    if (!val) {
      setForm((prev) => ({ ...prev, requisition: "" }));
      setRows([]);
      return;
    }
    setForm((prev) => ({ ...prev, requisition: val }));
    setLoadingItems(true);
    try {
      const res = await getRequisitionItems(val);
      const reqItems = res.data.items || res.data || [];
      // New assignment: default every item ticked at full qty (the common
      // "ask this vendor to quote everything" case). Buyer un-ticks / edits
      // qty to split.
      setRows(buildRows(reqItems, [], true));
    } catch (err) {
      console.error("Failed to fetch requisition items", err);
      setRows([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const toggleRow = (idx) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, selected: !r.selected } : r)));
  };

  const changeQty = (idx, value) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, assignQty: value } : r)));
  };

  const selectedRows = rows.filter((r) => r.selected);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;
    if (!form.requisition) {
      setToast({ open: true, type: "error", message: "Please select a Requisition" });
      return;
    }
    if (!form.vendor) {
      setToast({ open: true, type: "error", message: "Please select a Vendor" });
      return;
    }
    if (selectedRows.length === 0) {
      setToast({ open: true, type: "error", message: "Tick at least one item to assign to this vendor" });
      return;
    }
    // Per-item quantity check (positive only — no upper cap, since the same item
    // can be requested from multiple vendors for competitive quoting).
    for (const r of selectedRows) {
      const qty = Number(r.assignQty);
      if (!qty || qty <= 0) {
        setToast({ open: true, type: "error", message: `Enter a quantity greater than 0 for ${r.product_name}` });
        return;
      }
    }

    setSubmitting(true);
    const payload = {
      requisition: form.requisition,
      vendor: form.vendor,
      remarks: form.remarks,
      items: selectedRows.map((r) => ({ requisition_item: r.requisition_item, quantity: Number(r.assignQty) })),
    };

    try {
      editData ? await updateVendorAssignment(editData.id, payload) : await createVendorAssignment(payload);
      onSuccess();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      const fieldErr = data?.items?.[0] || data?.items;
      const errorMsg = err.response?.status === 400
        ? (fieldErr || data?.non_field_errors?.[0] || data?.message || data?.error || data?.detail || "Validation error")
        : (data?.error || data?.detail || data?.message || "Failed to save assignment");
      setToast({ open: true, type: "error", message: typeof errorMsg === "string" ? errorMsg : "Validation error" });
    } finally {
      setSubmitting(false);
    }
  };

  const defaultRequisitionItem = displayData ? { id: displayData.requisition, requisition_number: displayData.requisition_number } : null;
  const defaultVendorItem = displayData && displayData.vendor_details ? { id: displayData.vendor, vendor_name: displayData.vendor_details.vendor_name, vendor_code: displayData.vendor_details.vendor_code } : null;

  const LABEL = { fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 1 };
  const TH = { fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", py: 1 };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: "95vh" } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#1a1a2e", color: "white", py: 2.5, px: 3, fontWeight: 900 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase" }}>{locked ? "View Assignment" : editData ? "Edit Vendor Assignment" : "Assign Vendor"}</Typography>
          <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: "9px", textTransform: "uppercase" }}>{locked ? (isCompleted ? "Assignment is Completed - View only" : isQuoted ? "Quotation already created - View only" : "Viewing assignment details") : "Pick the items this vendor should quote for — split items across vendors as needed"}</Typography>
        </Box>
        <Button onClick={onClose} sx={{ minWidth: "auto", p: 0.5 }}><CloseIcon sx={{ color: "#cbd5e1", fontSize: 20 }} /></Button>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: "#f1f5f9", p: 3 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {(isQuoted || isCompleted) && !viewOnly && (
            <Alert severity="warning" icon={<InfoIcon />} sx={{ borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 900, fontSize: "13px" }}>Editing Restricted</Typography>
              <Typography sx={{ fontSize: "12px", mt: 0.5 }}>{isCompleted ? "This assignment has been marked as Completed. Changes are no longer permitted." : "A vendor quotation has already been created for this assignment. Changes are no longer permitted."}</Typography>
            </Alert>
          )}

          {loadingData ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 4, gap: 1 }}>
              <CircularProgress size={30} />
              <Typography sx={{ fontSize: "12px", color: "#64748b" }}>Loading details...</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography sx={LABEL}>Requisition</Typography>
                <RequisitionSelector value={form.requisition} onChange={(val) => handleRequisitionChange(val)} disabled={!!editData || locked} defaultItem={defaultRequisitionItem} placeholder="Select a requisition..." />
              </Box>

              <Box>
                <Typography sx={LABEL}>Vendor</Typography>
                <Box sx={{ opacity: locked || !!editData ? 0.6 : 1, pointerEvents: locked || !!editData ? "none" : "auto" }}>
                  <VendorSelector value={form.vendor} onChange={(val) => setForm({ ...form, vendor: val })} defaultItem={defaultVendorItem} placeholder="Select a vendor..." />
                </Box>
              </Box>

              <Box>
                <Typography sx={LABEL}>Remarks</Typography>
                <TextField fullWidth multiline rows={2} placeholder="Any internal notes or remarks..." value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} disabled={locked} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "white" } }} />
              </Box>

              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography sx={{ ...LABEL, mb: 0 }}>{locked ? "Assigned Items" : "Items to Assign"}</Typography>
                  {!locked && rows.length > 0 && (
                    <Chip size="small" label={`${selectedRows.length} of ${rows.length} selected`} sx={{ height: 20, fontSize: "10px", fontWeight: 800, bgcolor: "#e0f2fe", color: "#0369a1" }} />
                  )}
                </Box>
                <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #e2e8f0" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                        {!locked && <TableCell padding="checkbox" sx={TH} />}
                        <TableCell sx={TH}>Product</TableCell>
                        <TableCell sx={TH}>Unit</TableCell>
                        {!locked && <TableCell align="right" sx={TH}>Req. Qty</TableCell>}
                        <TableCell align="right" sx={TH}>{locked ? "Qty" : "Assign Qty"}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loadingItems ? (
                        <TableRow><TableCell colSpan={locked ? 3 : 5} align="center" sx={{ py: 3 }}><CircularProgress size={22} /></TableCell></TableRow>
                      ) : rows.length > 0 ? (
                        (locked ? rows.filter((r) => r.selected) : rows).map((r) => {
                          const realIdx = rows.indexOf(r);
                          const qtyNum = Number(r.assignQty);
                          const invalid = r.selected && (!qtyNum || qtyNum <= 0);
                          return (
                            <TableRow key={r.requisition_item} sx={{ bgcolor: r.selected && !locked ? "#f8fafc" : "inherit" }}>
                              {!locked && (
                                <TableCell padding="checkbox">
                                  <Checkbox size="small" checked={r.selected} onChange={() => toggleRow(realIdx)} />
                                </TableCell>
                              )}
                              <TableCell sx={{ fontWeight: 600, color: "#1e293b", fontSize: "13px" }}>
                                {r.product_name}
                                {!locked && r.requestedElsewhere > 0 && (
                                  <Typography component="span" sx={{ fontSize: "10px", color: "#0369a1", ml: 1 }}>
                                    also requested from other vendor(s)
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ color: "#475569", fontSize: "12px" }}>{r.unit}</TableCell>
                              {!locked && (
                                <TableCell align="right" sx={{ color: "#475569", fontSize: "12px" }}>{r.requisitionQty.toFixed(2)}</TableCell>
                              )}
                              <TableCell align="right">
                                {locked ? (
                                  <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{Number(r.assignQty).toFixed(2)}</Typography>
                                ) : (
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={r.assignQty}
                                    onChange={(e) => changeQty(realIdx, e.target.value)}
                                    disabled={!r.selected}
                                    error={invalid}
                                    inputProps={{ min: 0, step: "any", style: { textAlign: "right", padding: "4px 8px", width: 70, fontSize: "13px" } }}
                                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "white" } }}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={locked ? 3 : 5} align="center" sx={{ py: 3, color: "#94a3b8", fontStyle: "italic" }}>{form.requisition ? "No items in this requisition" : "Select a requisition to load its items"}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {!locked && rows.length > 0 && (
                  <Typography sx={{ fontSize: "11px", color: "#64748b", mt: 1 }}>
                    All items are ticked by default — untick the ones this vendor should <b>not</b> quote, or lower a quantity to split it. The same item can be sent to several vendors for competing quotes.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ bgcolor: "#ffffff", px: 3, py: 2, borderTop: "1px solid #e2e8f0", gap: 2 }}>
        <Button onClick={onClose} disabled={submitting}>{locked ? "Close" : "Cancel"}</Button>
        {!locked && (
          <Button onClick={handleSubmit} variant="contained" disabled={submitting || loadingData} startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ bgcolor: "#0ea5e9", textTransform: "uppercase", fontWeight: 900 }}>
            {editData ? "Update" : "Assign"}
          </Button>
        )}
      </DialogActions>

      <AlertToast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
    </Dialog>
  );
};

export default VendorAssignmentModal;
