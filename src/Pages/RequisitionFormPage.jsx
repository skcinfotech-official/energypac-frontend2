import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Container, Paper, Typography, Button, TextField, IconButton,
  Card, CardContent, Grid, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, CircularProgress, Alert
} from "@mui/material";
import { Add as AddIcon, Delete as TrashIcon, ArrowBack as BackIcon, Save as SaveIcon } from "@mui/icons-material";
import { createRequisition } from "../services/requisition";
import ProductSelector from "../components/common/ProductSelector";
import AlertToast from "../components/ui/AlertToast";

const emptyItem = { product: "", product_name: "", product_code: "", quantity: "", remarks: "", unit: "" };

const RequisitionFormPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    requisition_date: new Date().toISOString().split("T")[0],
    remarks: "",
    items: [{ ...emptyItem }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "error", message: "" });

  const updateItem = (index, updates) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, ...updates } : item),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [{ ...emptyItem }, ...prev.items],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: items.length ? items : [{ ...emptyItem }] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.some(item => !item.product || !item.quantity)) {
      setToast({ open: true, type: "error", message: "Please select product and specify quantity for all items" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        requisition_date: form.requisition_date,
        remarks: form.remarks,
        items: form.items.map(item => ({
          product_id: item.product,
          product: item.product,
          quantity: Number(item.quantity),
          remarks: item.remarks || "",
        })),
      };
      await createRequisition(payload);
      setToast({ open: true, type: "success", message: "Requisition created successfully!" });
      setTimeout(() => navigate("/requisition"), 1500);
    } catch (err) {
      const detail = err.response?.data?.error || err.response?.data?.detail || "Failed to create requisition";
      setToast({ open: true, type: "error", message: `Error: ${detail}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* HEADER */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate("/requisition")} sx={{ color: "#64748b" }}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#1a1a2e", textTransform: "uppercase" }}>
              📋 Create New Requisition
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#94a3b8", mt: 0.5 }}>
              Add items and create a new purchase requisition
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button onClick={() => navigate("/requisition")} variant="outlined" sx={{ textTransform: "uppercase", fontWeight: 900 }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} variant="contained" startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} sx={{ bgcolor: "#0ea5e9", textTransform: "uppercase", fontWeight: 900, py: 1.2, px: 3 }}>
            {submitting ? "Saving..." : "Create Requisition"}
          </Button>
        </Box>
      </Box>

      {/* FORM */}
      <Box component="form" onSubmit={handleSubmit}>
        {/* REQUISITION INFO SECTION */}
        <Paper sx={{ p: 4, mb: 4, bgcolor: "white", border: "2px solid #dbeafe", borderRadius: 2.5, boxShadow: "0 2px 8px rgba(30, 64, 175, 0.08)" }}>
          <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 3 }}>
            📅 Requisition Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                  Requisition Date
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  value={form.requisition_date}
                  onChange={(e) => setForm({ ...form, requisition_date: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "white", "& fieldset": { borderColor: "#dbeafe" } } }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                  Remarks
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={1}
                  placeholder="Internal notes..."
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "white", "& fieldset": { borderColor: "#dbeafe" } } }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* ITEMS SECTION */}
        <Paper sx={{ p: 4, bgcolor: "white", border: "2px solid #e0f2fe", borderRadius: 2.5, boxShadow: "0 2px 8px rgba(30, 64, 175, 0.06)" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, pb: 2.5, borderBottom: "2px solid #dbeafe" }}>
            <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              📦 Items ({form.items.length})
            </Typography>
            <Button
              onClick={addItem}
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ bgcolor: "#10b981", textTransform: "uppercase", fontWeight: 900, py: 1.2, px: 2.5 }}
            >
              Add Item
            </Button>
          </Box>

          {/* ITEMS TABLE */}
          <TableContainer sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f0f9ff", borderBottom: "2px solid #dbeafe" }}>
                  <TableCell sx={{ fontWeight: 900, color: "#1e40af", fontSize: "10px", textTransform: "uppercase", py: 1, width: "50%" }}>
                    Product
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, color: "#1e40af", fontSize: "10px", textTransform: "uppercase", py: 1, width: "80px" }}>
                    Unit
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, color: "#1e40af", fontSize: "10px", textTransform: "uppercase", py: 1, width: "90px" }}>
                    Qty
                  </TableCell>
                  <TableCell sx={{ fontWeight: 900, color: "#1e40af", fontSize: "10px", textTransform: "uppercase", py: 1, width: "140px" }}>
                    Remarks
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, color: "#1e40af", fontSize: "10px", textTransform: "uppercase", py: 1, width: "50px" }}>
                    Del
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form.items.map((item, idx) => (
                  <TableRow key={idx} sx={{ borderBottom: "1px solid #dbeafe", bgcolor: idx % 2 === 0 ? "white" : "#f8fbff" }}>
                    <TableCell sx={{ py: 1, pr: 1.5 }}>
                      <ProductSelector
                        value={item.product}
                        excludeIds={form.items.filter((_, i) => i !== idx).map(it => it.product)}
                        onChange={(val, productObj) => {
                          if (productObj) {
                            updateItem(idx, {
                              product: val,
                              unit: productObj.unit || "PCS",
                              product_name: productObj.item_name,
                              product_code: productObj.item_code,
                            });
                          } else {
                            updateItem(idx, { product: val });
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1 }}>
                      <TextField
                        size="small"
                        value={item.unit || ""}
                        onChange={(e) => updateItem(idx, { unit: e.target.value })}
                        placeholder="UNIT"
                        sx={{ width: "100%", "& .MuiOutlinedInput-root": { borderRadius: 0.8, bgcolor: "white", fontSize: "12px", "& fieldset": { borderColor: "#dbeafe" } } }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1 }}>
                      <TextField
                        type="number"
                        size="small"
                        placeholder="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                        sx={{ width: "70px", "& .MuiOutlinedInput-root": { borderRadius: 0.8, bgcolor: "white", "& fieldset": { borderColor: "#dbeafe" } } }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1, pr: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Notes"
                        value={item.remarks}
                        onChange={(e) => updateItem(idx, { remarks: e.target.value })}
                        sx={{ width: "100%", "& .MuiOutlinedInput-root": { borderRadius: 0.8, bgcolor: "white", fontSize: "12px", "& fieldset": { borderColor: "#dbeafe" } } }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1 }}>
                      <IconButton
                        onClick={() => removeItem(idx)}
                        size="small"
                        sx={{ color: "white", bgcolor: "#dc2626", p: 0.5, borderRadius: 0.6, "&:hover": { bgcolor: "#b91c1c" } }}
                      >
                        <TrashIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {form.items.length === 0 && (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography sx={{ color: "#94a3b8", fontStyle: "italic" }}>
                No items added yet. Click "Add Item" to start.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <AlertToast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Container>
  );
};

export default RequisitionFormPage;
