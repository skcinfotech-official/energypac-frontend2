import { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Card,
    CardContent,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Grid,
    Chip,
} from "@mui/material";
import {
    Close as CloseIcon,
    FilePresent as FileInvoiceDollarIcon,
    PersonOutlined as UserTieIcon,
    Inventory2Outlined as BoxOpenIcon,
    ChecklistOutlined as ClipboardListIcon,
    EventOutlined as CalendarAltIcon,
    Info as InformationCircleIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { getVendorQuotationById, updateQuotation } from "../../services/vendorQuotationService";
import { exchangeRateService } from "../../services/exchangeRateService";

const StyledDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialog-paper": {
        borderRadius: "16px",
        maxWidth: "90vw",
        width: "100%",
    },
}));

const StyledInput = styled(TextField)(({ theme }) => ({
    "& .MuiInputBase-root": {
        backgroundColor: "#ffffff",
        fontSize: "0.875rem",
    },
}));

const VendorQuotationEditModal = ({ open, onClose, quotationId, onSuccess }) => {
    const [data, setData] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [currency, setCurrency] = useState("INR");
    const [exchangeRate, setExchangeRate] = useState(1.0);
    const [rateLoading, setRateLoading] = useState(false);

    useEffect(() => {
        if (open && quotationId) {
            loadDetails();
        } else {
            setData(null);
            setItems([]);
        }
    }, [open, quotationId]);

    const loadDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getVendorQuotationById(quotationId);
            setData(res);
            setCurrency(res.currency || "INR");

            if (res.currency === "USD") {
                try {
                    const rateData = await exchangeRateService.getCurrentRate();
                    setExchangeRate(rateData.rate);
                } catch (e) {
                    console.error("Exchange rate fetch failed", e);
                }
            }

            if (res.items) {
                setItems(
                    res.items.map((item) => ({
                        ...item,
                        quoted_rate: item.quoted_rate || "",
                    }))
                );
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load quotation details.");
        } finally {
            setLoading(false);
        }
    };

    const handleRateChange = (index, value) => {
        const newItems = [...items];
        newItems[index].quoted_rate = value;
        setItems(newItems);
    };

    const calculateRowAmount = (qty, rate) => {
        const q = parseFloat(qty) || 0;
        const r = parseFloat(rate) || 0;
        return (q * r).toFixed(2);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity || 0) * parseFloat(item.quoted_rate || 0));
        }, 0);
    };

    const totalAmount = calculateTotal();
    const totalAmountINR = currency === "USD" ? totalAmount * exchangeRate : totalAmount;

    const handleSubmit = async () => {
        setSubmitting(true);
        setError("");
        try {
            const payload = {
                items: items.map((item) => ({
                    id: item.id,
                    vendor_item: item.vendor_item,
                    quoted_rate: parseFloat(item.quoted_rate) || 0,
                })),
            };

            await updateQuotation(quotationId, payload);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            const rd = err.response?.data;
            let msg = "Failed to update quotation.";
            if (rd) {
                if (typeof rd === "string") msg = rd;
                else if (rd.detail) msg = rd.detail;
                else if (Array.isArray(rd.items)) msg = rd.items[0];
                else if (rd.non_field_errors) msg = Array.isArray(rd.non_field_errors) ? rd.non_field_errors[0] : rd.non_field_errors;
            }
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ zIndex: 9999 }} PaperProps={{ sx: { borderRadius: 3, zIndex: 9999 } }} BackdropProps={{ sx: { zIndex: 9998 } }}>
            {/* HEADER */}
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#1a1a2e", color: "white", py: 2.5, px: 3, fontWeight: 900 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FileInvoiceDollarIcon sx={{ color: "#0ea5e9", fontSize: 24 }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                            Edit Quotation
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: "9px", textTransform: "uppercase" }}>Update quotation rates and details</Typography>
                    </Box>
                </Box>
                <Button size="small" onClick={onClose} sx={{ minWidth: "auto", color: "#cbd5e1", "&:hover": { color: "white" } }}>
                    <CloseIcon />
                </Button>
            </DialogTitle>

            {/* CONTENT */}
            <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2, bgcolor: "#f1f5f9" }}>
                {error && (
                    <Alert
                        severity="error"
                        icon={<InformationCircleIcon />}
                        sx={{ borderRadius: 2 }}
                    >
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                        <CircularProgress size={40} />
                    </Box>
                ) : data ? (
                    <>
                        {/* Top Card: Info */}
                        <Card sx={{ border: "1px solid #e5e7eb" }}>
                            <CardContent sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2 }}>
                                {/* Left: General Info */}
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937", mb: 1.5 }}>
                                        {data.quotation_number || "Draft Quotation"}
                                    </Typography>

                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <BoxOpenIcon sx={{ color: "#9ca3af", fontSize: 16 }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#6b7280" }}>
                                                Requisition:
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "#1f2937" }}>
                                                {data.requisition_number}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <UserTieIcon sx={{ color: "#9ca3af", fontSize: 16 }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#6b7280" }}>
                                                Vendor:
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "#1f2937" }}>
                                                {data.vendor_name}
                                            </Typography>
                                            <Chip
                                                label={data.vendor_code}
                                                size="small"
                                                variant="outlined"
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>

                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, pt: 0.5 }}>
                                            {(data.gst_number || data?.vendor?.gst_number) && (
                                                <Chip
                                                    label={`GST: ${data.gst_number || data?.vendor?.gst_number}`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: "0.75rem" }}
                                                />
                                            )}
                                            {(data.pan_number || data?.vendor?.pan_number) && (
                                                <Chip
                                                    label={`PAN: ${data.pan_number || data?.vendor?.pan_number}`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: "0.75rem" }}
                                                />
                                            )}
                                        </Box>

                                        {(data.bank_name || data?.vendor?.bank_name || data.bank_account_number || data?.vendor?.bank_account_number || data?.account_number || data?.vendor?.account_number) && (
                                            <Typography variant="caption" sx={{ fontStyle: "italic", color: "#6b7280", pt: 0.5 }}>
                                                {data.bank_name || data?.vendor?.bank_name} | {data.bank_account_number || data?.vendor?.bank_account_number || data?.account_number || data?.vendor?.account_number} | {data.ifsc_code || data?.vendor?.ifsc_code}
                                            </Typography>
                                        )}

                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pt: 1 }}>
                                            <CalendarAltIcon sx={{ color: "#9ca3af", fontSize: 16 }} />
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#6b7280" }}>
                                                Quoted Date:
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "#1f2937" }}>
                                                {data.quotation_date}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Right: Terms & Validity */}
                                <Box sx={{ textAlign: "right" }}>
                                    <Card sx={{ backgroundColor: "#fffbeb", border: "1px solid #fcd34d", p: 1.5, mb: 1.5 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#92400e" }}>
                                            Valid Until:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "#1f2937" }}>
                                            {data.validity_date}
                                        </Typography>
                                    </Card>

                                    <Typography variant="caption" sx={{ display: "block", color: "#6b7280", fontWeight: 600, mb: 1 }}>
                                        Ref No: {data.reference_number || "-"}
                                    </Typography>

                                    <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>
                                            Currency:
                                        </Typography>
                                        <Chip
                                            label={currency}
                                            color={currency === "USD" ? "primary" : "default"}
                                            size="small"
                                            sx={{
                                                fontWeight: 700,
                                                color: currency === "USD" ? "#ffffff" : "#1f2937",
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Items Table */}
                        <Card sx={{ border: "1px solid #e5e7eb" }}>
                            <Box sx={{ backgroundColor: "#f9fafb", px: 2, py: 1.5, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <ClipboardListIcon sx={{ fontSize: 18 }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                        Edit Rates
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1f2937" }}>
                                    Total Items: {items.length}
                                </Typography>
                            </Box>

                            <Box sx={{ overflowX: "auto" }}>
                                <Table sx={{ minWidth: 700 }}>
                                    <TableHead sx={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, color: "#4b5563", fontSize: "0.75rem", textTransform: "uppercase" }}>
                                                Product
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: "#4b5563", fontSize: "0.75rem", textTransform: "uppercase" }}>
                                                Quantity
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: "#4b5563", fontSize: "0.75rem", textTransform: "uppercase" }}>
                                                Rate ({currency})
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, color: "#4b5563", fontSize: "0.75rem", textTransform: "uppercase" }}>
                                                Amount ({currency})
                                            </TableCell>
                                            {currency === "USD" && (
                                                <TableCell align="right" sx={{ fontWeight: 700, color: "#4b5563", fontSize: "0.75rem", textTransform: "uppercase" }}>
                                                    Amount (INR)
                                                </TableCell>
                                            )}
                                            <TableCell sx={{ fontWeight: 700, color: "#4b5563", fontSize: "0.75rem", textTransform: "uppercase" }}>
                                                Remarks
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody sx={{ borderTop: "1px solid #e5e7eb" }}>
                                        {items.map((item, idx) => (
                                            <TableRow
                                                key={item.id}
                                                sx={{
                                                    backgroundColor: idx % 2 === 0 ? "#f9fafb" : "#ffffff",
                                                    "&:hover": { backgroundColor: "#f3f4f6" },
                                                }}
                                            >
                                                <TableCell sx={{ py: 1, fontSize: "0.875rem" }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1f2937" }}>
                                                        {item.product_name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#9ca3af" }}>
                                                        {item.product_code}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 1, fontWeight: 600, color: "#4b5563", fontSize: "0.875rem" }}>
                                                    {Number(item.quantity).toFixed(2)} <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{item.unit}</span>
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 1 }}>
                                                    <StyledInput
                                                        type="number"
                                                        inputProps={{ min: "0", step: "0.01" }}
                                                        size="small"
                                                        value={item.quoted_rate}
                                                        onChange={(e) => handleRateChange(idx, e.target.value)}
                                                        sx={{ width: "100px" }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right" sx={{ py: 1, fontWeight: 700, color: "#1f2937", fontSize: "0.875rem" }}>
                                                    {currency === "USD" ? "$" : "₹"} {calculateRowAmount(item.quantity, item.quoted_rate)}
                                                </TableCell>
                                                {currency === "USD" && (
                                                    <TableCell align="right" sx={{ py: 1, fontWeight: 700, color: "#2563eb", fontSize: "0.875rem" }}>
                                                        ₹ {(parseFloat(calculateRowAmount(item.quantity, item.quoted_rate)) * exchangeRate).toFixed(2)}
                                                    </TableCell>
                                                )}
                                                <TableCell sx={{ py: 1, color: "#6b7280", fontSize: "0.875rem", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", fontStyle: "italic" }}>
                                                    {item.remarks || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <Box
                                        component="tfoot"
                                        sx={{
                                            backgroundColor: "#f9fafb",
                                            fontWeight: 700,
                                            color: "#1f2937",
                                            display: "table-footer-group",
                                        }}
                                    >
                                        <TableRow>
                                            <TableCell colSpan={currency === "USD" ? "4" : "3"} align="right" sx={{ py: 1.5, fontSize: "0.75rem", textTransform: "uppercase", borderTop: "1px solid #e5e7eb", color: "#6b7280" }}>
                                                Total Amount
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 1.5, borderTop: "1px solid #e5e7eb" }}>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1f2937" }}>
                                                        {totalAmount.toLocaleString("en-IN", { style: "currency", currency: currency })}
                                                    </Typography>
                                                    {currency === "USD" && (
                                                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#2563eb" }}>
                                                            (Approx {totalAmountINR.toLocaleString("en-IN", { style: "currency", currency: "INR" })})
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ borderTop: "1px solid #e5e7eb" }}></TableCell>
                                        </TableRow>
                                    </Box>
                                </Table>
                            </Box>
                        </Card>
                    </>
                ) : (
                    <Typography sx={{ textAlign: "center", py: 4, color: "#9ca3af" }}>
                        No data found
                    </Typography>
                )}
            </DialogContent>

            {/* ACTIONS */}
            <DialogActions sx={{ p: 2, backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0", gap: 1 }}>
                <Button onClick={onClose} variant="outlined" disabled={submitting}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={submitting || !data}
                >
                    {submitting ? "Updating..." : "Update Quotation"}
                </Button>
            </DialogActions>
        </StyledDialog>
    );
};

export default VendorQuotationEditModal;
