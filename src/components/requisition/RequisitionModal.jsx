import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Box, Typography, Grid, Paper, CircularProgress, Chip, IconButton
} from "@mui/material";
import { Close as CloseIcon, Add as AddIcon, Delete as TrashIcon, GetApp as DownloadIcon } from "@mui/icons-material";
import { createRequisition, updateRequisition, getRequisition } from "../../services/requisition";
import ProductSelector from "../common/ProductSelector";
import { pdf } from "@react-pdf/renderer";
import RequisitionPDF from "./RequisitionPDF";
import AlertToast from "../ui/AlertToast";

const emptyItem = { product: "", quantity: "", remarks: "", unit: "" };

const RequisitionModal = ({ open, onClose, editData, onSuccess, viewOnly = false }) => {
  const [form, setForm] = useState({ requisition_date: new Date().toISOString().split("T")[0], remarks: "", items: [{ ...emptyItem }] });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "error", message: "" });
  const [isAssigned, setIsAssigned] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if ((viewOnly || editData) && editData?.id) {
        try {
          const { data } = await getRequisition(editData.id);
          const items = data.items && Array.isArray(data.items)
            ? data.items.map((i) => ({ product: i.product, product_name: i.product_name || i.product_details?.item_name, product_code: i.product_code || i.product_details?.item_code, unit: i.unit || i.product_details?.unit || "UNIT", quantity: i.quantity, remarks: i.remarks || "" }))
            : [{ ...emptyItem }];
          setForm({ requisition_date: data.requisition_date, remarks: data.remarks || "", items });
          if (data.is_assigned !== undefined) setIsAssigned(data.is_assigned);
        } catch (error) {
          console.error("Failed to fetch details", error);
        }
      } else if (editData) {
        setForm({ requisition_date: editData.requisition_date, remarks: editData.remarks || "", items: editData.items?.map((i) => ({ product: i.product, product_name: i.product_name, quantity: i.quantity, remarks: i.remarks || "", unit: i.unit || i.product_details?.unit || "" })) || [{ ...emptyItem }] });
        setIsAssigned(editData.is_assigned || false);
      }
    };
    if (editData?.id) {
      setForm({ requisition_date: editData.requisition_date, remarks: editData.remarks || "", items: editData.items?.map((i) => ({ product: i.product, quantity: i.quantity, remarks: i.remarks || "", unit: i.unit || i.product_details?.unit || "" })) || [{ ...emptyItem }] });
      setIsAssigned(editData.is_assigned || false);
      fetchData();
    } else if (editData) {
      setForm({ requisition_date: editData.requisition_date, remarks: editData.remarks || "", items: editData.items?.map((i) => ({ product: i.product, quantity: i.quantity, remarks: i.remarks || "", unit: i.unit || i.product_details?.unit || "" })) || [{ ...emptyItem }] });
      setIsAssigned(editData.is_assigned || false);
    }
  }, [editData, open, viewOnly]);

  const updateItem = (index, updates) => setForm((prev) => ({ ...prev, items: prev.items.map((item, i) => i === index ? { ...item, ...updates } : item) }));
  const addItem = () => setForm({ ...form, items: [{ ...emptyItem }, ...form.items] });
  const removeItem = (index) => { const items = form.items.filter((_, i) => i !== index); setForm({ ...form, items: items.length ? items : [{ ...emptyItem }] }); };

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
      const payload = { requisition_date: form.requisition_date, remarks: form.remarks, items: form.items.map(item => ({ product_id: item.product, product: item.product, quantity: Number(item.quantity), remarks: item.remarks || "" })) };
      editData ? await updateRequisition(editData.id, payload) : await createRequisition(payload);
      onSuccess();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to save requisition";
      setToast({ open: true, type: "error", message: `Error: ${detail}` });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: "95vh" } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#1a1a2e", color: "white", py: 2.5, px: 3, fontWeight: 900 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase" }}>{viewOnly ? "View Requisition" : editData ? "Edit Requisition" : "New Requisition"}</Typography>
          <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: "9px", textTransform: "uppercase" }}>{viewOnly ? `Viewing ${editData?.requisition_number}` : editData ? `Editing ${editData.requisition_number}` : "Create a new request"}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isAssigned && <Chip label="Assigned" color="success" size="small" variant="outlined" />}
          {editData?.id && (
            <IconButton onClick={handleDownloadPdf} disabled={generatingPdf} sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
              {generatingPdf ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            </IconButton>
          )}
          <IconButton onClick={onClose} sx={{ color: "#cbd5e1", "&:hover": { color: "white" } }}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: "#f1f5f9", p: 4, overflowY: "auto" }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 0.5 }}>
          <Paper sx={{ p: 3.5, bgcolor: "white", border: "2px solid #dbeafe", borderRadius: 2.5, background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)", boxShadow: "0 2px 8px rgba(30, 64, 175, 0.08)" }}>
            <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 3 }}>📋 Requisition Info</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>Requisition Date</Typography>
                  <TextField type="date" fullWidth size="small" value={form.requisition_date} onChange={(e) => setForm({ ...form, requisition_date: e.target.value })} disabled={viewOnly} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "white", "& fieldset": { borderColor: "#dbeafe" } } }} />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>Remarks</Typography>
                  <TextField fullWidth size="small" placeholder="Internal notes..." value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} disabled={viewOnly} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "white", "& fieldset": { borderColor: "#dbeafe" } } }} />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3.5, pb: 2.5, borderBottom: "2px solid #dbeafe" }}>
              <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em" }}>📦 Item Details ({form.items.length})</Typography>
              {!viewOnly && (
                <Button startIcon={<AddIcon />} onClick={addItem} variant="contained" sx={{ textTransform: "uppercase", fontWeight: 900, fontSize: "11px", color: "white", bgcolor: "#10b981", borderRadius: 1.5, py: 1, px: 2.5, "&:hover": { bgcolor: "#059669" } }}>Add New Item</Button>
              )}
            </Box>

            {form.items.map((item, i) => (
              <Paper key={i} sx={{ p: 2.5, mb: 2.5, bgcolor: "white", border: "2px solid #dbeafe", borderRadius: 1.5, boxShadow: "0 1px 4px rgba(30, 64, 175, 0.06)" }}>
                <Box sx={{ mb: 1.5, pb: 1, borderBottom: "1px solid #dbeafe" }}>
                  <Typography sx={{ fontSize: "8px", fontWeight: 900, color: "#0c4a6e", textTransform: "uppercase", letterSpacing: "0.05em" }}>Item {i + 1}</Typography>
                </Box>

                {/* PRODUCT SELECTOR - FULL WIDTH & LARGER */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: "9px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.02em", mb: 1 }}>🏷️ Product Selection *</Typography>
                  <ProductSelector value={item.product} excludeIds={form.items.filter((_, idx) => idx !== i).map(it => it.product)} onChange={(val, productObj) => { if (productObj) updateItem(i, { product: val, unit: productObj.unit || "PCS", product_name: productObj.item_name, product_code: productObj.item_code }); else updateItem(i, { product: val }); }} disabled={viewOnly} />
                </Box>

                {/* UNIT, QTY, REMARKS - SIDE BY SIDE (HORIZONTAL) */}
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flex: "0 0 auto" }}>
                    <Typography sx={{ fontSize: "8px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>Unit</Typography>
                    <TextField size="small" value={item.unit || ""} onChange={(e) => updateItem(i, { unit: e.target.value })} disabled={viewOnly} placeholder="UNIT" sx={{ width: "80px", "& .MuiOutlinedInput-root": { borderRadius: 1, bgcolor: "white", fontSize: "12px", "& fieldset": { borderColor: "#dbeafe" } } }} />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flex: "0 0 auto" }}>
                    <Typography sx={{ fontSize: "8px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>Qty *</Typography>
                    <TextField type="number" size="small" placeholder="0" value={item.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })} disabled={viewOnly} sx={{ width: "90px", "& .MuiOutlinedInput-root": { borderRadius: 1, bgcolor: "white", fontSize: "12px", "& fieldset": { borderColor: "#dbeafe" } } }} />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flex: "1 1 auto" }}>
                    <Typography sx={{ fontSize: "8px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>Remarks</Typography>
                    <TextField fullWidth size="small" placeholder="Notes" value={item.remarks} onChange={(e) => updateItem(i, { remarks: e.target.value })} disabled={viewOnly} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1, bgcolor: "white", fontSize: "12px", "& fieldset": { borderColor: "#dbeafe" } } }} />
                  </Box>

                  {!viewOnly && <IconButton onClick={() => removeItem(i)} sx={{ color: "white", bgcolor: "#dc2626", p: 0.6, borderRadius: 0.8, minWidth: "36px", height: "36px", "&:hover": { bgcolor: "#b91c1c" }, flexShrink: 0 }}><TrashIcon sx={{ fontSize: 16 }} /></IconButton>}
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ bgcolor: "#ffffff", px: 4, py: 3, borderTop: "2px solid #e2e8f0", gap: 2, justifyContent: "flex-end" }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: "uppercase", fontWeight: 900, color: "#64748b", "&:hover": { bgcolor: "#f1f5f9" } }}>
          {viewOnly ? "Close" : "Cancel"}
        </Button>
        {!viewOnly && (
          <Button onClick={handleSubmit} variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ bgcolor: "#0ea5e9", color: "white", textTransform: "uppercase", fontWeight: 900, borderRadius: 1.5, py: 1.2, px: 3, "&:hover": { bgcolor: "#0284c7" } }}>
            {editData ? "Update" : "Create"}
          </Button>
        )}
      </DialogActions>

      <AlertToast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
    </Dialog>
  );
};

export default RequisitionModal;
