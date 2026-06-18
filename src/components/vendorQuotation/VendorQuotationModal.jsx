import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Box, Typography, Grid, Paper, CircularProgress, ToggleButton, ToggleButtonGroup, Card, CardContent,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton
} from "@mui/material";
import { Close as CloseIcon, Refresh as RefreshIcon, AttachMoney as MoneyIcon, Info as InfoIcon } from "@mui/icons-material";
import { getQuotationItems, createQuotation } from "../../services/vendorQuotationService";
import { exchangeRateService } from "../../services/exchangeRateService";
import AlertToast from "../ui/AlertToast";

const VendorQuotationModal = ({ open, onClose, onSuccess, requisitionId, vendorId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [rateLoading, setRateLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "error", message: "" });

  useEffect(() => {
    if (open && requisitionId && vendorId) {
      loadItems();
    }
  }, [open, requisitionId, vendorId]);

  const loadItems = async () => {
    setLoading(true);
    try {
      console.log("Loading items for", { requisitionId, vendorId });
      const data = await getQuotationItems(requisitionId, vendorId);
      console.log("Items loaded:", data);
      const rawItems = data.items || [];
      console.log("Raw items:", rawItems);
      setItems(rawItems.map((item) => ({ ...item, quoted_rate: "" })));
    } catch (err) {
      console.error("Error loading items:", err);
      setToast({ open: true, type: "error", message: `Failed to load items: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const loadExchangeRate = async () => {
    setRateLoading(true);
    try {
      const data = await exchangeRateService.getCurrentRate();
      setExchangeRate(data.rate);
    } catch (err) {
      console.error(err);
      setToast({ open: true, type: "error", message: "Failed to fetch exchange rate." });
    } finally {
      setRateLoading(false);
    }
  };

  useEffect(() => {
    if (currency === "USD") {
      loadExchangeRate();
    } else {
      setExchangeRate(1.0);
    }
  }, [currency]);

  const handleRateChange = (index, val) => {
    const newItems = [...items];
    newItems[index].quoted_rate = val;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (items.some(item => !item.quoted_rate || Number(item.quoted_rate) <= 0)) {
      setToast({ open: true, type: "error", message: "Please provide valid rates for all items." });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        requisition: requisitionId,
        vendor: vendorId,
        currency: currency,
        items: items.map((i) => ({ vendor_item: i.id, quoted_rate: Number(i.quoted_rate || 0) })),
      };
      await createQuotation(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setToast({ open: true, type: "error", message: "Failed to create quotation." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const totalAmountOriginal = items.reduce((sum, i) => sum + Number(i.quoted_rate || 0) * Number(i.quantity || 0), 0);
  const totalAmountINR = currency === "USD" ? totalAmountOriginal * exchangeRate : totalAmountOriginal;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: "95vh" } }}>
        {/* HEADER */}
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#1a1a2e", color: "white", py: 2.5, px: 3, fontWeight: 900 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <MoneyIcon sx={{ color: "#0ea5e9", fontSize: 24 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase" }}>Create Vendor Quotation</Typography>
              <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: "9px", textTransform: "uppercase" }}>Provide quotation details and item rates</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "#cbd5e1", "&:hover": { color: "white" } }}><CloseIcon /></IconButton>
        </DialogTitle>

        {/* CONTENT */}
        <DialogContent sx={{ bgcolor: "#f1f5f9", p: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
            {/* Vendor Info Card */}
            {items.length > 0 && items[0].vendor_name && (
              <Card sx={{ border: "1px solid #e2e8f0", bgcolor: "white" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>Vendor</Typography>
                      <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{items[0].vendor_name}</Typography>
                      <Typography sx={{ fontSize: "10px", fontFamily: "monospace", color: "#64748b", mt: 0.5 }}>{items[0].vendor_code}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>GST</Typography>
                      <Typography sx={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 600, color: "#1e293b" }}>{items[0].gst_number || "N/A"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>PAN</Typography>
                      <Typography sx={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 600, color: "#1e293b" }}>{items[0].pan_number || "N/A"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>Bank A/C</Typography>
                      <Typography sx={{ fontSize: "11px", fontFamily: "monospace", fontWeight: 600, color: "#1e293b" }}>{items[0].bank_account_number || "N/A"}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Currency Selection */}
            <Paper sx={{ p: 2.5, bgcolor: "white", border: "1px solid #e2e8f0" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 1 }}>Select Currency</Typography>
                  <ToggleButtonGroup value={currency} exclusive onChange={(e, newCurrency) => newCurrency && setCurrency(newCurrency)} size="small">
                    {["INR", "USD"].map((curr) => (
                      <ToggleButton key={curr} value={curr} sx={{ px: 3, py: 1, fontSize: "13px", fontWeight: 900, textTransform: "uppercase", "&.Mui-selected": { bgcolor: "#0ea5e9", color: "white" } }}>
                        {curr}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>

                {currency === "USD" && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ bgcolor: "#dbeafe", border: "1px solid #bfdbfe", p: 1.5, borderRadius: 1 }}>
                      <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#1e40af", textTransform: "uppercase" }}>Exchange Rate</Typography>
                      <Typography sx={{ fontSize: "14px", fontWeight: 900, color: "#0c4a6e" }}>1 USD = ₹{Number(exchangeRate).toFixed(2)}</Typography>
                    </Box>
                    <IconButton onClick={loadExchangeRate} disabled={rateLoading} sx={{ color: "#0ea5e9" }}>
                      <RefreshIcon sx={{ animation: rateLoading ? "spin 1s linear infinite" : "none" }} />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Items Table */}
            {loading ? (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, gap: 2 }}>
                <CircularProgress size={40} sx={{ color: "#0ea5e9" }} />
                <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Loading items...</Typography>
              </Box>
            ) : items.length > 0 ? (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, pb: 2, borderBottom: "1px solid #e2e8f0" }}>
                  <InfoIcon sx={{ fontSize: 18, color: "#0ea5e9" }} />
                  <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#1e293b", textTransform: "uppercase" }}>Enter Rates for Items</Typography>
                  <Box sx={{ ml: "auto", bgcolor: "#e0f2fe", color: "#0c4a6e", px: 1.5, py: 0.5, borderRadius: 1, fontSize: "11px", fontWeight: 900 }}>{items.length} ITEMS</Box>
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: "1px solid #e2e8f0" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f1f5f9", borderBottom: "2px solid #e2e8f0" }}>
                        <TableCell sx={{ fontWeight: 900, color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rate ({currency})</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount ({currency})</TableCell>
                        {currency === "USD" && <TableCell align="right" sx={{ fontWeight: 900, color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount (INR)</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody sx={{ "& .MuiTableRow-root:hover": { bgcolor: "#f8fafc" } }}>
                      {items.map((item, idx) => (
                        <TableRow key={idx} sx={{ borderBottom: "1px solid #e2e8f0", bgcolor: idx % 2 === 0 ? "white" : "#f9fafb" }}>
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: "13px" }}>{item.product_name}</Typography>
                            <Typography sx={{ fontSize: "10px", fontFamily: "monospace", color: "#64748b" }}>{item.product_code}</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: "#475569", fontSize: "12px" }}>
                            {Number(item.quantity).toFixed(2)} <span style={{ fontSize: "10px", color: "#94a3b8" }}>{item.unit}</span>
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.5 }}>
                            <TextField type="number" size="small" placeholder="0.00" value={item.quoted_rate} onChange={(e) => handleRateChange(idx, e.target.value)} sx={{ width: "110px", "& .MuiOutlinedInput-root": { borderRadius: 1, bgcolor: "white", fontSize: "0.875rem", "& fieldset": { borderColor: "#e2e8f0" } } }} />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900, color: "#0ea5e9", fontSize: "13px" }}>
                            {currency === "USD" ? "$" : "₹"} {(Number(item.quoted_rate || 0) * Number(item.quantity || 0)).toFixed(2)}
                          </TableCell>
                          {currency === "USD" && <TableCell align="right" sx={{ fontWeight: 700, color: "#059669", fontSize: "12px" }}>₹ {(Number(item.quoted_rate || 0) * Number(item.quantity || 0) * exchangeRate).toFixed(2)}</TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f1f5f9", borderTop: "2px solid #e2e8f0" }}>
                        <TableCell colSpan={3} align="right" sx={{ fontWeight: 900, color: "#64748b", fontSize: "11px", textTransform: "uppercase", py: 1.5 }}>Total Amount:</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: "#0ea5e9", fontSize: "14px", py: 1.5 }}>
                          {currency === "USD" ? "$" : "₹"} {totalAmountOriginal.toFixed(2)}
                        </TableCell>
                        {currency === "USD" && <TableCell align="right" sx={{ fontWeight: 700, color: "#059669", fontSize: "12px", py: 1.5 }}>₹ {totalAmountINR.toFixed(2)}</TableCell>}
                      </TableRow>
                    </TableHead>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography sx={{ color: "#94a3b8", fontStyle: "italic" }}>No items found</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        {/* FOOTER */}
        <DialogActions sx={{ bgcolor: "#ffffff", px: 3, py: 2, borderTop: "1px solid #e2e8f0", gap: 2 }}>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting || loading || items.length === 0} startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ bgcolor: "#0ea5e9", textTransform: "uppercase", fontWeight: 900 }}>
            {submitting ? "Submitting..." : "Submit Quotation"}
          </Button>
        </DialogActions>
      </Dialog>

      <AlertToast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
    </>
  );
};

export default VendorQuotationModal;
