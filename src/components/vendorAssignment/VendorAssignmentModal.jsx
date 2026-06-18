import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from "@mui/material";
import { Close as CloseIcon, Info as InfoIcon } from "@mui/icons-material";
import { createVendorAssignment, updateVendorAssignment, getVendorAssignment } from "../../services/vendorAssignment";
import { getRequisitionItems } from "../../services/requisition";
import VendorSelector from "../common/VendorSelector";
import RequisitionSelector from "../common/RequisitionSelector";
import AlertToast from "../ui/AlertToast";

const VendorAssignmentModal = ({ open, onClose, editData, onSuccess, viewOnly = false }) => {
  const [form, setForm] = useState({ requisition: "", vendor: "", remarks: "", items: [] });
  const [displayData, setDisplayData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [isQuoted, setIsQuoted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "error", message: "" });

  useEffect(() => {
    const initData = async () => {
      if (editData) {
        setDisplayData(editData);
        if (editData.id) {
          setLoadingData(true);
          try {
            const { data } = await getVendorAssignment(editData.id);
            setDisplayData(data);
            const hasQuotation = data.quotations && data.quotations.length > 0;
            setIsQuoted(hasQuotation);
            setIsCompleted(data.status === "Completed");
            setForm({ requisition: data.requisition, vendor: data.vendor, remarks: data.remarks || "", items: data.items || [] });
          } catch (err) {
            console.error("Failed to fetch assignment details", err);
          } finally {
            setLoadingData(false);
          }
        }
        setForm(() => ({ requisition: editData.requisition, vendor: editData.vendor, remarks: editData.remarks || "", items: editData.items || [] }));
      } else {
        setDisplayData(null);
        setForm({ requisition: "", vendor: "", remarks: "", items: [] });
        setIsQuoted(false);
        setIsCompleted(false);
      }
    };
    if (open) initData();
  }, [editData, open]);

  if (!open) return null;

  const handleRequisitionChange = async (val) => {
    if (!val) {
      setForm({ ...form, requisition: "", items: [] });
      return;
    }
    try {
      const res = await getRequisitionItems(val);
      const items = res.data.items || res.data || [];
      setForm((prev) => ({ ...prev, requisition: val, items }));
    } catch (err) {
      console.error("Failed to fetch requisition items", err);
      setForm((prev) => ({ ...prev, requisition: val, items: [] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewOnly || isQuoted || isCompleted) return;
    if (!form.requisition) {
      setToast({ open: true, type: "error", message: "Please select a Requisition" });
      return;
    }
    if (!form.vendor) {
      setToast({ open: true, type: "error", message: "Please select a Vendor" });
      return;
    }
    if (!form.items || form.items.length === 0) {
      setToast({ open: true, type: "error", message: "At least one item is required" });
      return;
    }

    setSubmitting(true);
    const payload = {
      requisition: form.requisition,
      vendor: form.vendor,
      remarks: form.remarks,
      items: form.items.map((item) => ({ requisition_item: item.requisition_item || item.id, quantity: Number(item.quantity) })),
    };

    try {
      editData ? await updateVendorAssignment(editData.id, payload) : await createVendorAssignment(payload);
      onSuccess();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      const errorMsg = err.response?.status === 400
        ? (data?.non_field_errors?.[0] || data?.message || data?.error || data?.detail || "Validation error")
        : (data?.error || data?.detail || data?.message || "Failed to save assignment");
      setToast({ open: true, type: "error", message: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const defaultRequisitionItem = displayData ? { id: displayData.requisition, requisition_number: displayData.requisition_number } : null;
  const defaultVendorItem = displayData && displayData.vendor_details ? { id: displayData.vendor, vendor_name: displayData.vendor_details.vendor_name, vendor_code: displayData.vendor_details.vendor_code } : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: "95vh" } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#1a1a2e", color: "white", py: 2.5, px: 3, fontWeight: 900 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase" }}>{viewOnly || isQuoted || isCompleted ? "View Assignment" : editData ? "Edit Vendor Assignment" : "Assign Vendor"}</Typography>
          <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: "9px", textTransform: "uppercase" }}>{viewOnly || isQuoted || isCompleted ? isCompleted ? "Assignment is Completed - View only" : isQuoted ? "Quotation already created - View only" : "Viewing assignment details" : editData ? "Update the vendor assignment details" : "Create a new vendor assignment"}</Typography>
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
                <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 1 }}>Requisition</Typography>
                <RequisitionSelector value={form.requisition} onChange={(val) => handleRequisitionChange(val)} disabled={!!editData || viewOnly || isQuoted || isCompleted} defaultItem={defaultRequisitionItem} placeholder="Select a requisition..." />
              </Box>

              <Box>
                <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 1 }}>Vendor</Typography>
                <Box sx={{ opacity: viewOnly || isQuoted || isCompleted ? 0.6 : 1, pointerEvents: viewOnly || isQuoted || isCompleted ? "none" : "auto" }}>
                  <VendorSelector value={form.vendor} onChange={(val) => setForm({ ...form, vendor: val })} defaultItem={defaultVendorItem} placeholder="Select a vendor..." />
                </Box>
              </Box>

              <Box>
                <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 1 }}>Remarks</Typography>
                <TextField fullWidth multiline rows={3} placeholder="Any internal notes or remarks..." value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} disabled={viewOnly || isQuoted || isCompleted} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "white" } }} />
              </Box>

              <Box>
                <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 1 }}>Item Preview</Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #e2e8f0" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                        <TableCell sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Product</TableCell>
                        <TableCell sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Unit</TableCell>
                        <TableCell sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Qty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {form.items.length > 0 ? (
                        form.items.map((i, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>{i.product_name || `Product ${i.product}`}</TableCell>
                            <TableCell sx={{ color: "#475569" }}>{i.unit}</TableCell>
                            <TableCell sx={{ color: "#475569" }}>{Number(i.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 3, color: "#94a3b8", fontStyle: "italic" }}>No items loaded from requisition</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ bgcolor: "#ffffff", px: 3, py: 2, borderTop: "1px solid #e2e8f0", gap: 2 }}>
        <Button onClick={onClose} disabled={submitting}>{viewOnly || isQuoted || isCompleted ? "Close" : "Cancel"}</Button>
        {!(viewOnly || isQuoted || isCompleted) && (
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
