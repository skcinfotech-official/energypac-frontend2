import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Box, Typography, Paper, CircularProgress, Chip, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert
} from "@mui/material";
import {
  Close as CloseIcon, Add as AddIcon, Delete as TrashIcon,
  GetApp as DownloadIcon, Edit as EditIcon, Sync as SyncIcon
} from "@mui/icons-material";
import { createRequisition, updateRequisition, getRequisition } from "../../services/requisition";
import ProductSelector from "../common/ProductSelector";
import { pdf } from "@react-pdf/renderer";
import RequisitionPDF from "./RequisitionPDF";
import AlertToast from "../ui/AlertToast";

const emptyItem = { product: "", quantity: "", remarks: "", unit: "" };

const LABEL = {
  fontSize: "10px", fontWeight: 900, color: "#64748b",
  textTransform: "uppercase", letterSpacing: "0.02em", mb: 0.5,
};
const TH = {
  fontSize: 10, fontWeight: 900, color: "#475569", textTransform: "uppercase",
  letterSpacing: "0.05em", bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0", py: 1,
};
const TD = { fontSize: 13, py: 1, borderBottom: "1px solid #f1f5f9" };
const INPUT = {
  "& .MuiOutlinedInput-root": { borderRadius: 1, bgcolor: "white", fontSize: "13px", "& fieldset": { borderColor: "#dbeafe" } },
};

const RequisitionModal = ({ open, onClose, editData, onSuccess, viewOnly = false }) => {
  const [form, setForm] = useState({ requisition_number: "", requisition_date: new Date().toISOString().split("T")[0], remarks: "", items: [{ ...emptyItem }] });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "error", message: "" });
  const [isAssigned, setIsAssigned] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  // View ⇄ Edit is switched inside the modal, so viewing never silently edits.
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if ((viewOnly || editData) && editData?.id) {
        try {
          const { data } = await getRequisition(editData.id);
          const items = data.items && Array.isArray(data.items)
            ? data.items.map((i) => ({ id: i.id, product: i.product, product_name: i.product_name || i.product_details?.item_name, product_code: i.product_code || i.product_details?.item_code, unit: i.unit || i.product_details?.unit || "UNIT", quantity: i.quantity, remarks: i.remarks || "" }))
            : [{ ...emptyItem }];
          setForm((prev) => ({
            ...prev,
            requisition_number: data.requisition_number || "",
            requisition_date: data.requisition_date,
            remarks: data.remarks || "",
            items,
          }));
          if (data.is_assigned !== undefined) setIsAssigned(data.is_assigned);
        } catch (error) {
          console.error("Failed to fetch details", error);
        }
      }
    };

    if (!open) return;

    if (editData?.id) {
      setForm((prev) => ({
        ...prev,
        requisition_number: editData.requisition_number || "",
        requisition_date: editData.requisition_date,
        remarks: editData.remarks || "",
        items: editData.items?.map((i) => ({ id: i.id, product: i.product, product_name: i.product_name, product_code: i.product_code, quantity: i.quantity, remarks: i.remarks || "", unit: i.unit || i.product_details?.unit || "" })) || [{ ...emptyItem }],
      }));
      setIsAssigned(editData.is_assigned || false);
      fetchData();
    } else {
      setForm({ requisition_number: "", requisition_date: new Date().toISOString().split("T")[0], remarks: "", items: [{ ...emptyItem }] });
      setIsAssigned(false);
    }

    // A new requisition always starts editable; an existing one opens in the
    // mode the caller asked for.
    setEditing(!editData ? true : !viewOnly);
  }, [editData, open, viewOnly]);

  // An assigned requisition stays editable — the backend mirrors every add/remove/
  // qty change into the vendor assignments (and their quotations).
  const readOnly = !editing;

  const updateItem = (index, updates) => setForm((prev) => ({ ...prev, items: prev.items.map((item, i) => i === index ? { ...item, ...updates } : item) }));
  const addItem = () => setForm((prev) => ({ ...prev, items: [{ ...emptyItem }, ...prev.items] }));
  const removeItem = (index) => setForm((prev) => {
    const items = prev.items.filter((_, i) => i !== index);
    return { ...prev, items: items.length ? items : [{ ...emptyItem }] };
  });

  const handleDownloadPdf = async () => {
    if (!editData?.id) return;
    setGeneratingPdf(true);
    try {
      const { data } = await getRequisition(editData.id);
      const formattedItems = (data.items || []).map((i) => ({ product_name: i.product_name || i.product_details?.item_name || "Unknown Product", product_code: i.product_code || i.product_details?.item_code || "N/A", unit: i.unit || i.product_details?.unit || "UNIT", quantity: i.quantity || 0, remarks: i.remarks || "" }));
      const pdfDetails = { requisition_number: data.requisition_number || editData.requisition_number, requisition_date: data.requisition_date, is_assigned: data.is_assigned, remarks: data.remarks, created_by_name: data.created_by_name || data.created_by?.name || "System Operator", items: formattedItems };
      const blob = await pdf(<RequisitionPDF details={pdfDetails} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error generating PDF:", error);
      setToast({ open: true, type: "error", message: "Failed to generate PDF." });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.some(item => !item.product || !item.quantity)) {
      setToast({ open: true, type: "error", message: "Please select a product and specify quantity for all items." });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        requisition_date: form.requisition_date,
        remarks: form.remarks,
        // `id` identifies an existing line — without it the backend would delete
        // and recreate every item, breaking the link to vendor assignments.
        items: form.items.map(item => ({
          ...(item.id ? { id: item.id } : {}),
          product_id: item.product,
          product: item.product,
          quantity: Number(item.quantity),
          remarks: item.remarks || "",
        })),
      };
      // On create: blank = auto-generate. On edit: blank = keep the current number.
      if ((form.requisition_number || "").trim()) {
        payload.requisition_number = form.requisition_number.trim();
      }
      editData ? await updateRequisition(editData.id, payload) : await createRequisition(payload);
      onSuccess();
      onClose();
    } catch (err) {
      const rd = err.response?.data;
      const reqNumErr = Array.isArray(rd?.requisition_number) ? rd.requisition_number[0] : rd?.requisition_number;
      const detail = reqNumErr || rd?.error || rd?.detail || rd?.message || err.message || "Failed to save requisition";
      setToast({ open: true, type: "error", message: `Error: ${detail}` });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const title = !editData ? "New Requisition" : readOnly ? "View Requisition" : "Edit Requisition";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, height: "88vh", display: "flex", flexDirection: "column" } }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#1a1a2e", color: "white", py: 1.75, px: 2.5, flexShrink: 0 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 16, textTransform: "uppercase" }}>{title}</Typography>
          <Typography sx={{ color: "#cbd5e1", fontSize: 10, fontFamily: "monospace" }}>
            {editData?.requisition_number || "Create a new request"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isAssigned && (
            <Chip label="Assigned" size="small"
              sx={{ bgcolor: "#065f46", color: "#d1fae5", fontWeight: 800, fontSize: 10 }} />
          )}

          {/* Edit lives here now — viewing can never silently turn into editing. */}
          {editData && readOnly && (
            <Tooltip title="Edit this requisition">
              <Button
                size="small"
                startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                onClick={() => setEditing(true)}
                sx={{
                  bgcolor: "#0ea5e9", color: "white", fontWeight: 900, fontSize: 11,
                  textTransform: "uppercase", px: 1.5, borderRadius: 1.5,
                  "&:hover": { bgcolor: "#0284c7" },
                }}
              >
                Edit
              </Button>
            </Tooltip>
          )}

          {editData && !readOnly && (
            <Button size="small" onClick={() => setEditing(false)}
              sx={{ color: "#cbd5e1", fontWeight: 800, fontSize: 11, textTransform: "uppercase", "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}>
              Cancel edit
            </Button>
          )}

          {editData?.id && (
            <Tooltip title="Download PDF">
              <IconButton onClick={handleDownloadPdf} disabled={generatingPdf} size="small" sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                {generatingPdf ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>
          )}
          <IconButton onClick={onClose} size="small" sx={{ color: "#cbd5e1", "&:hover": { color: "white" } }}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <DialogContent sx={{ bgcolor: "#f8fafc", p: 2, flex: 1, overflowY: "auto" }}>
        {isAssigned && !readOnly && (
          <Alert severity="warning" icon={<SyncIcon fontSize="small" />} sx={{ mb: 2, py: 0.5, fontSize: 12, borderRadius: 2 }}>
            This requisition is already assigned to vendor(s). Items you add, remove or re-quantify here
            will be applied to their assignments and quotations too. An item that already has a Purchase
            Order cannot be removed.
          </Alert>
        )}

        {/* Info card — one compact row */}
        <Paper variant="outlined" sx={{ p: 1.75, mb: 2, borderRadius: 2, borderColor: "#e2e8f0" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.5 }}>
            <Box>
              <Typography sx={LABEL}>
                Requisition No.{" "}
                <Box component="span" sx={{ color: "#94a3b8" }}>{editData ? "(must be unique)" : "(optional)"}</Box>
              </Typography>
              <TextField fullWidth size="small"
                placeholder={editData ? "" : "Auto-generate"}
                value={form.requisition_number || ""}
                onChange={(e) => setForm({ ...form, requisition_number: e.target.value })}
                disabled={readOnly}
                sx={{ ...INPUT, "& .MuiOutlinedInput-root": { ...INPUT["& .MuiOutlinedInput-root"], fontFamily: "monospace" } }} />
            </Box>
            <Box>
              <Typography sx={LABEL}>Requisition Date</Typography>
              <TextField type="date" fullWidth size="small" value={form.requisition_date || ""}
                onChange={(e) => setForm({ ...form, requisition_date: e.target.value })}
                disabled={readOnly} sx={INPUT} />
            </Box>
            <Box>
              <Typography sx={LABEL}>Remarks</Typography>
              <TextField fullWidth size="small" placeholder="Internal notes…" value={form.remarks || ""}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                disabled={readOnly} sx={INPUT} />
            </Box>
          </Box>
        </Paper>

        {/* Items */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Items ({form.items.length})
          </Typography>
          {!readOnly && (
            <Button startIcon={<AddIcon sx={{ fontSize: 16 }} />} onClick={addItem} size="small" variant="contained"
              sx={{ textTransform: "uppercase", fontWeight: 900, fontSize: 11, bgcolor: "#10b981", borderRadius: 1.5, px: 1.75, "&:hover": { bgcolor: "#059669" } }}>
              Add Item
            </Button>
          )}
        </Box>

        {readOnly ? (
          /* Read-only: a plain table — short, scannable, nothing clickable. */
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: "#e2e8f0" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...TH, width: 44 }}>#</TableCell>
                  <TableCell sx={TH}>Product</TableCell>
                  <TableCell sx={TH} align="center">Unit</TableCell>
                  <TableCell sx={TH} align="right">Qty</TableCell>
                  <TableCell sx={TH}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form.items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ ...TD, color: "#94a3b8", fontWeight: 800 }}>{i + 1}</TableCell>
                    <TableCell sx={TD}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.product_name || "—"}</Typography>
                      {item.product_code && (
                        <Typography sx={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{item.product_code}</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={TD} align="center">{item.unit || "—"}</TableCell>
                    <TableCell sx={{ ...TD, fontWeight: 800 }} align="right">{item.quantity}</TableCell>
                    <TableCell sx={{ ...TD, color: "#64748b" }}>{item.remarks || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          /* Edit: one compact line per item — the product dropdown stays in view. */
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {form.items.map((item, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 1, borderRadius: 2, borderColor: "#e2e8f0", bgcolor: "white" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: { xs: "wrap", md: "nowrap" } }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#94a3b8", width: 18, flexShrink: 0 }}>{i + 1}</Typography>

                  <Box sx={{ flex: "1 1 260px", minWidth: 200 }}>
                    <ProductSelector
                      value={item.product}
                      size="small"
                      defaultItem={item.product && item.product_name ? { id: item.product, item_name: item.product_name, item_code: item.product_code } : null}
                      excludeIds={form.items.filter((_, idx) => idx !== i).map(it => it.product)}
                      onChange={(val, productObj) => {
                        if (productObj) updateItem(i, { product: val, unit: productObj.unit || "PCS", product_name: productObj.item_name, product_code: productObj.item_code });
                        else updateItem(i, { product: val, product_name: "", product_code: "" });
                      }}
                    />
                  </Box>

                  <TextField size="small" value={item.unit || ""} onChange={(e) => updateItem(i, { unit: e.target.value })}
                    placeholder="Unit" sx={{ ...INPUT, width: 84, flexShrink: 0 }} />

                  <TextField type="number" size="small" value={item.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })}
                    placeholder="Qty" sx={{ ...INPUT, width: 84, flexShrink: 0 }} />

                  <TextField fullWidth size="small" value={item.remarks} onChange={(e) => updateItem(i, { remarks: e.target.value })}
                    placeholder="Remarks" sx={{ ...INPUT, flex: "1 1 140px", minWidth: 120 }} />

                  <Tooltip title="Remove item">
                    <IconButton onClick={() => removeItem(i)} size="small"
                      sx={{ color: "#dc2626", bgcolor: "#fef2f2", borderRadius: 1, flexShrink: 0, "&:hover": { bgcolor: "#fee2e2" } }}>
                      <TrashIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <DialogActions sx={{ bgcolor: "white", px: 2.5, py: 1.75, borderTop: "1px solid #e2e8f0", gap: 1.5, flexShrink: 0 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: "uppercase", fontWeight: 900, fontSize: 12, color: "#64748b", "&:hover": { bgcolor: "#f1f5f9" } }}>
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {!readOnly && (
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}
            startIcon={submitting ? <CircularProgress size={15} color="inherit" /> : undefined}
            sx={{ bgcolor: "#0ea5e9", color: "white", textTransform: "uppercase", fontWeight: 900, fontSize: 12, borderRadius: 1.5, py: 1, px: 3, "&:hover": { bgcolor: "#0284c7" } }}>
            {editData ? "Update" : "Create"}
          </Button>
        )}
      </DialogActions>

      <AlertToast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
    </Dialog>
  );
};

export default RequisitionModal;
