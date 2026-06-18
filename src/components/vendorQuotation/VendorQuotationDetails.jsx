import { useState, useEffect } from "react";
import { z } from "zod";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, TextField, Select, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, Grid, Card, CardContent, CircularProgress, IconButton
} from "@mui/material";
import { Close as CloseIcon, Search as SearchIcon, AttachMoney as MoneyIcon } from "@mui/icons-material";
import { getQuotationItems, createQuotation } from "../../services/vendorQuotationService";
import { getCurrencies } from "../../services/currencyService";
import RequisitionSelector from "../common/RequisitionSelector";
import VendorSelector from "../common/VendorSelector";
import AlertToast from "../ui/AlertToast";

const VendorQuotationDetails = ({ open, onClose, onSuccess }) => {
  const [contextData, setContextData] = useState(null);
  const [items, setItems] = useState([]);
  const [currency, setCurrency] = useState("INR");
  const [currencies, setCurrencies] = useState([]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    if (open) {
      getCurrencies({ isActive: true }).then((res) => {
        const results = res.data?.results || res.results || res.data || [];
        setCurrencies(results);
        if (results.length > 0) {
          const inr = results.find((c) => c.code === "INR");
          setCurrency(inr ? "INR" : results[0].code);
        }
      }).catch((err) => console.error("Failed to load currencies", err));
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setContextData(null);
      setItems([]);
      setHasSearched(false);
      setSelectedRequisition(null);
      setSelectedVendor(null);
      setReferenceNumber("");
      setValidityDate("");
      setPaymentTerms("");
      setDeliveryTerms("");
      setRemarks("");
    }
  }, [open]);

  const handleSearch = async () => {
    if (!selectedRequisition || !selectedVendor) {
      setToast({ open: true, type: "error", message: "Please select both Requisition and Vendor" });
      return;
    }
    setLoading(true);
    setHasSearched(true);
    setContextData(null);
    setItems([]);
    try {
      const data = await getQuotationItems(selectedRequisition, selectedVendor);
      if (data) {
        setContextData(data);
        const rawItems = data.items || [];
        setItems(rawItems.map(item => ({ ...item, quoted_rate: item.quoted_rate || "" })));
      }
    } catch (err) {
      console.error(err);
      setToast({ open: true, type: "error", message: "Failed to load quotation details" });
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (index, value) => {
    const newItems = [...items];
    newItems[index].quoted_rate = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!contextData) return;

    setSubmitting(true);
    const payload = {
      requisition: selectedRequisition,
      vendor: selectedVendor,
      currency: currency,
      reference_number: referenceNumber,
      validity_date: validityDate,
      payment_terms: paymentTerms || null,
      delivery_terms: deliveryTerms || null,
      remarks: remarks || null,
      items: items.map(item => ({
        vendor_item: item.vendor_item_id || item.vendor_item || item.id,
        quoted_rate: item.quoted_rate === "" ? 0 : parseFloat(item.quoted_rate)
      }))
    };

    const schema = z.object({
      requisition: z.string().uuid("Invalid Requisition"),
      vendor: z.string().uuid("Invalid Vendor"),
      currency: z.string().min(1, "Currency is required"),
      reference_number: z.string().min(1, "Reference Number is required"),
      validity_date: z.string().min(1, "Validity Date is required"),
      items: z.array(z.object({
        vendor_item: z.any(),
        quoted_rate: z.number().min(0, "Rate must be 0 or greater")
      }))
    });

    try {
      schema.parse(payload);
      await createQuotation(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstError = err.errors[0]?.message || "Please check all required fields";
        setToast({ open: true, type: "error", message: firstError });
      } else {
        console.error("Submission Error:", err);
        let errorMsg = "Failed to submit quotation";
        if (err.response?.data) {
          const data = err.response.data;
          if (typeof data === "string") {
            errorMsg = data;
          } else if (data?.error) {
            errorMsg = data.error;
          } else if (data?.detail) {
            errorMsg = data.detail;
          } else if (data?.message) {
            errorMsg = data.message;
          } else if (typeof data === "object") {
            const firstKey = Object.keys(data)[0];
            if (firstKey) {
              const val = data[firstKey];
              errorMsg = Array.isArray(val) ? val[0] : val;
            }
          }
        }
        setToast({ open: true, type: "error", message: errorMsg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.quoted_rate) || 0;
    return sum + (qty * rate);
  }, 0);

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth disableEnforceFocus PaperProps={{ sx: { borderRadius: 3, maxHeight: "95vh" } }}>
        {/* HEADER */}
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#1a1a2e", color: "white", py: 2.5, px: 3, fontWeight: 900 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <MoneyIcon sx={{ color: "#0ea5e9", fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase" }}>Create Vendor Quotation</Typography>
              <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: "9px", textTransform: "uppercase" }}>Provide quotation details and item rates</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "#cbd5e1", "&:hover": { color: "white" } }}><CloseIcon /></IconButton>
        </DialogTitle>

        {/* CONTENT */}
        <DialogContent sx={{ bgcolor: "#f1f5f9", p: 4, overflowY: "auto" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 0.5 }}>
            {/* SEARCH FILTERS */}
            <Paper sx={{ p: 3.5, bgcolor: "white", border: "2px solid #dbeafe", borderRadius: 2.5, background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)", boxShadow: "0 2px 8px rgba(30, 64, 175, 0.08)" }}>
              <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 3 }}>🔍 Search & Select</Typography>
              <Grid container spacing={3} alignItems="flex-end">
                <Grid item xs={12} sm={5}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em" }}>📋 Requisition</Typography>
                    <RequisitionSelector
                      value={selectedRequisition}
                      onChange={(id) => {
                        setSelectedRequisition(id);
                        setSelectedVendor(null);
                      }}
                      placeholder="Search Requisition..."
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em" }}>🏢 Vendor</Typography>
                    <VendorSelector
                      value={selectedVendor}
                      onChange={(id) => setSelectedVendor(id)}
                      requisitionId={selectedRequisition}
                      disabled={!selectedRequisition}
                      placeholder={selectedRequisition ? "Search Vendor..." : "Select Requisition First"}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button onClick={handleSearch} variant="contained" fullWidth startIcon={<SearchIcon />} sx={{ bgcolor: "#1e40af", color: "white", textTransform: "uppercase", fontWeight: 900, py: 1.6, borderRadius: 1.5, "&:hover": { bgcolor: "#1e3a8a" } }}>
                    Load
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* SEARCH RESULT SCREEN */}
            {loading ? (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 3 }}>
                <CircularProgress size={45} sx={{ color: "#0ea5e9" }} />
                <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Loading items...</Typography>
              </Box>
            ) : !hasSearched ? (
              <Box sx={{ p: 8, textAlign: "center", bgcolor: "white", border: "2px dashed #dbeafe", borderRadius: 2.5, boxShadow: "0 1px 3px rgba(30, 64, 175, 0.05)" }}>
                <SearchIcon sx={{ fontSize: 52, color: "#cbd5e1", mb: 2 }} />
                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", lineHeight: 1.6 }}>Select a Requisition and Vendor to retrieve assigned items.</Typography>
              </Box>
            ) : !contextData ? (
              <Box sx={{ p: 4, textAlign: "center", bgcolor: "#fee2e2", border: "2px solid #fca5a5", borderRadius: 2.5, boxShadow: "0 1px 3px rgba(220, 38, 38, 0.1)" }}>
                <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#dc2626", letterSpacing: "0.02em" }}>⚠️ No items could be loaded. Please check vendor assignments.</Typography>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {/* QUOTATION HEADER FIELDS */}
                <Card sx={{ border: "2px solid #fef08a", bgcolor: "#fffbeb", boxShadow: "0 2px 8px rgba(180, 83, 9, 0.1)", borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.05em", mb: 3.5, pb: 2.5, borderBottom: "2px solid #fde68a" }}>📝 Quotation Details</Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>Reference Number *</Typography>
                          <TextField fullWidth size="small" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="e.g. VENDOR-REF-123" required sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "white", "& fieldset": { borderColor: "#fed7aa" } } }} />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>Validity Date *</Typography>
                          <TextField fullWidth type="date" size="small" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} required sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "white", "& fieldset": { borderColor: "#fed7aa" } } }} />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>Currency *</Typography>
                          <Select fullWidth size="small" value={currency} onChange={(e) => setCurrency(e.target.value)} sx={{ borderRadius: 1.5, bgcolor: "white", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" } }}>
                            {currencies.map((c) => (
                              <MenuItem key={c.id} value={c.code}>{c.code} ({c.symbol})</MenuItem>
                            ))}
                            {currencies.length === 0 && <MenuItem value="INR">INR (₹)</MenuItem>}
                          </Select>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>Payment Terms</Typography>
                          <TextField fullWidth size="small" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. 30 days" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "white", "& fieldset": { borderColor: "#fed7aa" } } }} />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>Delivery Terms</Typography>
                          <TextField fullWidth size="small" value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} placeholder="e.g. Ex-works" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "white", "& fieldset": { borderColor: "#fed7aa" } } }} />
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>Remarks</Typography>
                          <TextField fullWidth multiline rows={2.5} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Prices valid for 30 days" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "white", "& fieldset": { borderColor: "#fed7aa" } } }} />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* ITEMS ENTRY */}
                <Card sx={{ border: "2px solid #c7d2fe", bgcolor: "#f0f4ff", boxShadow: "0 2px 8px rgba(99, 102, 241, 0.1)", borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3.5, pb: 2.5, borderBottom: "2px solid #dbeafe" }}>
                      <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em" }}>📊 Quotation Items ({items.length})</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, bgcolor: "white", px: 2.5, py: 1.2, borderRadius: 2, border: "2px solid #dbeafe", boxShadow: "0 1px 3px rgba(30, 64, 175, 0.08)" }}>
                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>Total:</Typography>
                        <Typography sx={{ fontSize: "15px", fontWeight: 900, color: "#0ea5e9", fontFamily: "monospace" }}>{currency} {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                      </Box>
                    </Box>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, border: "1px solid #dbeafe", bgcolor: "white", boxShadow: "0 1px 4px rgba(30, 64, 175, 0.05)" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "#eff6ff", borderBottom: "2px solid #dbeafe" }}>
                            <TableCell sx={{ fontWeight: 900, color: "#1e40af", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", py: 1.8 }}>Product</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: "#1e40af", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", py: 1.8 }}>Qty</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: "#1e40af", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", py: 1.8 }}>Quoted Rate ({currency}) *</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: "#1e40af", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", py: 1.8 }}>Amount ({currency})</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody sx={{ "& .MuiTableRow-root:hover": { bgcolor: "#f0f9ff" } }}>
                          {items.map((item, idx) => (
                            <TableRow key={item.vendor_item_id || item.id || idx} sx={{ borderBottom: "1px solid #dbeafe", bgcolor: idx % 2 === 0 ? "white" : "#f8fbff" }}>
                              <TableCell sx={{ py: 2 }}>
                                <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: "13px" }}>{item.product_name}</Typography>
                                <Typography sx={{ fontSize: "10px", fontFamily: "monospace", color: "#64748b", mt: 0.3 }}>{item.product_code}</Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: "#475569", fontSize: "12px", py: 2 }}>
                                {Number(item.quantity).toFixed(2)} <span style={{ fontSize: "10px", color: "#94a3b8" }}>{item.unit}</span>
                              </TableCell>
                              <TableCell align="right" sx={{ py: 2 }}>
                                <TextField type="number" min="0" step="0.01" size="small" placeholder="0.00" required value={item.quoted_rate || ""} onChange={(e) => handleRateChange(idx, e.target.value)} sx={{ width: "120px", "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "white", "& fieldset": { borderColor: "#bfdbfe" } } }} />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 900, color: "#0ea5e9", fontSize: "13px", fontFamily: "monospace", py: 2 }}>
                                {((parseFloat(item.quantity) || 0) * (parseFloat(item.quoted_rate) || 0)).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </DialogContent>

        {/* FOOTER */}
        {hasSearched && contextData && (
          <DialogActions sx={{ bgcolor: "#ffffff", px: 4, py: 3, borderTop: "2px solid #e2e8f0", gap: 2, justifyContent: "flex-end" }}>
            <Button onClick={onClose} disabled={submitting} sx={{ textTransform: "uppercase", fontWeight: 900, color: "#64748b", "&:hover": { bgcolor: "#f1f5f9" } }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="contained" disabled={submitting || items.length === 0} startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ bgcolor: "#0ea5e9", color: "white", textTransform: "uppercase", fontWeight: 900, borderRadius: 1.5, py: 1.2, px: 3, "&:hover": { bgcolor: "#0284c7" } }}>
              {submitting ? "Saving..." : "Submit Quotation"}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      <AlertToast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
    </>
  );
};

export default VendorQuotationDetails;
