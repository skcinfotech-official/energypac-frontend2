import { useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
    Typography, Button, Alert, CircularProgress, Grid, Chip, TableContainer, Paper
} from "@mui/material";
import {
    Close as CloseIcon, Info as InfoIcon, FilePresent as FileIcon
} from "@mui/icons-material";
import { getVendorQuotationById } from "../../services/vendorQuotationService";

const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode?.toString().toUpperCase()) {
        case "USD": return "$";
        case "INR": return "₹";
        case "EUR": return "€";
        case "GBP": return "£";
        case "JPY": return "¥";
        default: return currencyCode || "₹";
    }
};

const formatAmount = (amount, currencyCode) => {
    const num = Number(amount) || 0;
    const locale = currencyCode?.toString().toUpperCase() === "INR" ? "en-IN" : "en-US";
    return num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const VendorQuotationViewModal = ({ open, onClose, quotationId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open && quotationId) {
            loadDetails();
        } else {
            setData(null);
        }
    }, [open, quotationId]);

    const loadDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getVendorQuotationById(quotationId);
            setData(res);
        } catch (err) {
            console.error(err);
            setError("Failed to load quotation details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            sx={{ zIndex: 9999 }}
            PaperProps={{ sx: { borderRadius: 3, maxHeight: "95vh", zIndex: 9999 } }}
            BackdropProps={{ sx: { zIndex: 9998 } }}
        >
            {/* HEADER */}
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "#1a1a2e",
                    color: "white",
                    py: 2.5,
                    px: 3,
                    fontWeight: 900,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <FileIcon sx={{ color: "#0ea5e9", fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                            Quotation Details
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            View quotation summary and items
                        </Typography>
                    </Box>
                </Box>
                <Button onClick={onClose} sx={{ minWidth: "auto", color: "#cbd5e1", "&:hover": { color: "white" } }}>
                    <CloseIcon />
                </Button>
            </DialogTitle>

            {/* CONTENT */}
            <DialogContent sx={{ bgcolor: "#f1f5f9", p: 3, overflowY: "auto" }}>
                {error && (
                    <Alert severity="error" icon={<InfoIcon />} sx={{ borderRadius: 2, mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 2 }}>
                        <CircularProgress size={40} sx={{ color: "#0ea5e9" }} />
                        <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                            Loading quotation...
                        </Typography>
                    </Box>
                ) : data ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {/* General Info Card */}
                        <Card sx={{ border: "1px solid #e2e8f0", bgcolor: "white" }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 2, pb: 2, borderBottom: "1px solid #e2e8f0" }}>
                                    Quotation Info
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>
                                            Quotation Number
                                        </Typography>
                                        <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                                            {data.quotation_number || "Draft"}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>
                                            Requisition
                                        </Typography>
                                        <Typography sx={{ fontSize: "13px", fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>
                                            {data.requisition_number}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>
                                            Date
                                        </Typography>
                                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                                            {data.quotation_date}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>
                                            Currency
                                        </Typography>
                                        <Chip label={data.currency} size="small" color="primary" sx={{ fontWeight: 900 }} />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Vendor Info Card */}
                        <Card sx={{ border: "1px solid #e2e8f0", bgcolor: "white" }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 2, pb: 2, borderBottom: "1px solid #e2e8f0" }}>
                                    Vendor Details
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>
                                            Vendor Name
                                        </Typography>
                                        <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                                            {data.vendor_name}
                                        </Typography>
                                        <Typography sx={{ fontSize: "10px", fontFamily: "monospace", color: "#64748b", mt: 0.5 }}>
                                            {data.vendor_code}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>
                                            GST Number
                                        </Typography>
                                        <Typography sx={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>
                                            {data.gst_number || data?.vendor?.gst_number || "N/A"}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>
                                            PAN Number
                                        </Typography>
                                        <Typography sx={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>
                                            {data.pan_number || data?.vendor?.pan_number || "N/A"}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>
                                            Bank Name
                                        </Typography>
                                        <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>
                                            {data.bank_name || data?.vendor?.bank_name || "N/A"}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>
                                            Account Name
                                        </Typography>
                                        <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>
                                            {data.account_name || data?.vendor?.account_name || "N/A"}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", mb: 0.5 }}>
                                            Account Number
                                        </Typography>
                                        <Typography sx={{ fontSize: "11px", fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>
                                            {data.bank_account_number || data?.vendor?.bank_account_number || data?.account_number || "N/A"}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Items Table */}
                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, pb: 2, borderBottom: "1px solid #e2e8f0" }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: "#1e293b", textTransform: "uppercase", fontSize: "14px" }}>
                                    Quoted Items
                                </Typography>
                                <Box sx={{ ml: "auto", bgcolor: "#e0f2fe", color: "#0c4a6e", px: 1.5, py: 0.5, borderRadius: 1, fontSize: "11px", fontWeight: 900 }}>
                                    {data.items?.length || 0} ITEMS
                                </Box>
                            </Box>
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: "1px solid #e2e8f0", bgcolor: "white" }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#f1f5f9", borderBottom: "2px solid #e2e8f0" }}>
                                            <TableCell sx={{ fontWeight: 900, color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 900, color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Qty</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 900, color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rate</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 900, color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount</TableCell>
                                            <TableCell sx={{ fontWeight: 900, color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Remarks</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody sx={{ "& .MuiTableRow-root:hover": { bgcolor: "#f8fafc" } }}>
                                        {data.items && data.items.length > 0 ? (
                                            data.items.map((item, idx) => (
                                                <TableRow key={item.id || idx} sx={{ borderBottom: "1px solid #e2e8f0", bgcolor: idx % 2 === 0 ? "white" : "#f9fafb" }}>
                                                    <TableCell sx={{ py: 1.5 }}>
                                                        <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: "13px" }}>{item.product_name}</Typography>
                                                        <Typography sx={{ fontSize: "10px", fontFamily: "monospace", color: "#64748b" }}>{item.product_code}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600, color: "#475569", fontSize: "12px" }}>
                                                        {Number(item.quantity).toFixed(2)} <span style={{ fontSize: "10px", color: "#94a3b8" }}>{item.unit}</span>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ color: "#475569", fontWeight: 700, fontSize: "12px" }}>
                                                        {parseFloat(item.quoted_rate) === 0 ? "N/A" : `${getCurrencySymbol(data.currency)} ${formatAmount(item.quoted_rate, data.currency)}`}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 900, color: "#059669", fontSize: "13px" }}>
                                                        {getCurrencySymbol(data.currency)} {formatAmount(item.amount, data.currency)}
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", maxWidth: "200px" }}>
                                                        {item.remarks || "-"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#94a3b8", fontStyle: "italic" }}>
                                                    No items found in this quotation
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    {data.items && data.items.length > 0 && (
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "#f1f5f9", borderTop: "2px solid #e2e8f0" }}>
                                                <TableCell colSpan={3} align="right" sx={{ fontWeight: 900, color: "#64748b", fontSize: "11px", textTransform: "uppercase", py: 1.5 }}>
                                                    Total Amount:
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 900, color: "#0ea5e9", fontSize: "14px", py: 1.5 }}>
                                                    {getCurrencySymbol(data.currency)} {formatAmount(data.total_amount, data.currency)}
                                                </TableCell>
                                                <TableCell sx={{ py: 1.5 }}></TableCell>
                                            </TableRow>
                                        </TableHead>
                                    )}
                                </Table>
                            </TableContainer>
                        </Box>

                        {/* Meta Footer */}
                        {data.created_by_name && (
                            <Typography variant="caption" sx={{ textAlign: "right", color: "#64748b", fontStyle: "italic" }}>
                                Created by {data.created_by_name} on {new Date(data.created_at).toLocaleString()}
                            </Typography>
                        )}
                    </Box>
                ) : (
                    <Box sx={{ textAlign: "center", py: 6 }}>
                        <Typography sx={{ color: "#94a3b8", fontStyle: "italic" }}>
                            No data found
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            {/* FOOTER */}
            <DialogActions sx={{ bgcolor: "#ffffff", px: 3, py: 2, borderTop: "1px solid #e2e8f0" }}>
                <Button onClick={onClose} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VendorQuotationViewModal;
