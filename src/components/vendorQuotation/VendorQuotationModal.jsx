import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Box, Typography, Paper, CircularProgress, ToggleButton, ToggleButtonGroup,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Divider
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

  const labelSx = { fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.5 };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: "95vh" } }}>
        {/* HEADER */}
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#1a1a2e", color: "white", py: 2.5, px: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "rgba(14,165,233,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MoneyIcon sx={{ color: "#0ea5e9", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1.2 }}>Create Vendor Quotation</Typography>
              <Typography sx={{ color: "#94a3b8", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Provide quotation details and item rates</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "#94a3b8", "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.08)" } }}><CloseIcon /></IconButton>
        </DialogTitle>

        {/* CONTENT */}
        <DialogContent sx={{ bgcolor: "#f8fafc", p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
            {/* Vendor + Currency in a single aligned row */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 2.5, alignItems: "stretch" }}>
              {/* Vendor Info Card */}
              {items.length > 0 && items[0].vendor_name ? (
                <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "white", borderColor: "#e2e8f0", borderRadius: 2 }}>
                  <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#0ea5e9", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>Vendor Details</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(2, 1fr)" }, columnGap: 3, rowGap: 2 }}>
                    <Box>
                      <Typography sx={labelSx}>Vendor</Typography>
                      <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{items[0].vendor_name}</Typography>
                      <Typography sx={{ fontSize: "10px", fontFamily: "monospace", color: "#94a3b8" }}>{items[0].vendor_code}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={labelSx}>GST</Typography>
                      <Typography sx={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 600, color: "#1e293b", wordBreak: "break-all" }}>{items[0].gst_number || "—"}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={labelSx}>PAN</Typography>
                      <Typography sx={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 600, color: "#1e293b" }}>{items[0].pan_number || "—"}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={labelSx}>Bank A/C</Typography>
                      <Typography sx={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 600, color: "#1e293b", wordBreak: "break-all" }}>{items[0].bank_account_number || "—"}</Typography>
                    </Box>
                  </Box>
                </Paper>
              ) : <Box />}

              {/* Currency Selection */}
              <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "white", borderColor: "#e2e8f0", borderRadius: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#0ea5e9", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1 }}>Currency</Typography>
                  <ToggleButtonGroup value={currency} exclusive fullWidth onChange={(e, newCurrency) => newCurrency && setCurrency(newCurrency)} size="small">
                    {["INR", "USD"].map((curr) => (
                      <ToggleButton key={curr} value={curr} sx={{ py: 0.75, fontSize: "13px", fontWeight: 900, textTransform: "uppercase", "&.Mui-selected": { bgcolor: "#0ea5e9", color: "white", "&:hover": { bgcolor: "#0284c7" } } }}>
                        {curr}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>

                {currency === "USD" && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#eff6ff", border: "1px solid #bfdbfe", p: 1.25, borderRadius: 1.5, mt: "auto" }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: "9px", fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Exchange Rate</Typography>
                      <Typography sx={{ fontSize: "15px", fontWeight: 900, color: "#0c4a6e", lineHeight: 1.2 }}>1 USD = ₹{Number(exchangeRate).toFixed(2)}</Typography>
                    </Box>
                    <IconButton size="small" onClick={loadExchangeRate} disabled={rateLoading} sx={{ color: "#0ea5e9" }}>
                      <RefreshIcon fontSize="small" sx={{ animation: rateLoading ? "spin 1s linear infinite" : "none", "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } } }} />
                    </IconButton>
                  </Box>
                )}
              </Paper>
            </Box>

            {/* Items Table */}
            {loading ? (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, gap: 2 }}>
                <CircularProgress size={40} sx={{ color: "#0ea5e9" }} />
                <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Loading items...</Typography>
              </Box>
            ) : items.length > 0 ? (
              <Paper variant="outlined" sx={{ borderColor: "#e2e8f0", borderRadius: 2, overflow: "hidden", bgcolor: "white" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 1.5, bgcolor: "white" }}>
                  <InfoIcon sx={{ fontSize: 18, color: "#0ea5e9" }} />
                  <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Enter Rates for Items</Typography>
                  <Box sx={{ ml: "auto", bgcolor: "#e0f2fe", color: "#0c4a6e", px: 1.5, py: 0.5, borderRadius: 1, fontSize: "11px", fontWeight: 900 }}>{items.length} ITEMS</Box>
                </Box>
                <Divider />

                <TableContainer>
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
              </Paper>
            ) : (
              <Paper variant="outlined" sx={{ textAlign: "center", py: 6, borderColor: "#e2e8f0", borderRadius: 2, bgcolor: "white" }}>
                <Typography sx={{ color: "#94a3b8", fontStyle: "italic" }}>No items found</Typography>
              </Paper>
            )}
          </Box>
        </DialogContent>

        {/* FOOTER */}
        <DialogActions sx={{ bgcolor: "#ffffff", px: 3, py: 2, borderTop: "1px solid #e2e8f0", gap: 1.5 }}>
          <Button onClick={onClose} disabled={submitting} sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "12px", px: 2.5 }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disableElevation disabled={submitting || loading || items.length === 0} startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ bgcolor: "#0ea5e9", textTransform: "uppercase", fontWeight: 800, fontSize: "12px", px: 3, py: 1, borderRadius: 1.5, "&:hover": { bgcolor: "#0284c7" } }}>
            {submitting ? "Submitting..." : "Submit Quotation"}
          </Button>
        </DialogActions>
      </Dialog>

      <AlertToast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
    </>
  );
};

export default VendorQuotationModal;
