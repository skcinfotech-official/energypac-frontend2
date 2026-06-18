import { useRef, useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Button, IconButton, Grid, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter,
    Checkbox, Paper, CircularProgress, Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import BusinessIcon from "@mui/icons-material/Business";
import InventoryIcon from "@mui/icons-material/Inventory";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArticleIcon from "@mui/icons-material/Article";
import PrintIcon from "@mui/icons-material/Print";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import VerifyIcon from "@mui/icons-material/CheckCircle";
import { pdf } from "@react-pdf/renderer";
import PurchaseOrderPDF from "./PurchaseOrderPDF";
import { markItemPurchased, getPurchaseOrder, lockPurchaseOrder } from "../../services/purchaseOrderService";
import AlertToast from "../ui/AlertToast";
import { apiGet } from "../../services/api";
import ConfirmDialog from "../ui/ConfirmDialog";
import EditPurchaseOrderModal from "./EditPurchaseOrderModal";
import ObjectAuditHistoryModal from "../audit/ObjectAuditHistoryModal";
import POVerificationModal from "./POVerificationModal";

const PRIMARY = "#1565C0";
const BG = "#FAFBFC";

const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode?.toString().toUpperCase()) {
        case "USD": return "$";
        case "INR": return "₹";
        case "EUR": return "€";
        case "GBP": return "£";
        case "JPY": return "¥";
        case "CAD": return "C$";
        case "AUD": return "A$";
        default: return currencyCode || "₹";
    }
};

const formatAmount = (amount, currencyCode) => {
    const num = Number(amount) || 0;
    const locale = currencyCode?.toString().toUpperCase() === "INR" ? "en-IN" : "en-US";
    return num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const labelSx = {
    fontSize: "10px",
    fontWeight: 700,
    color: "grey.500",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "block",
    mb: 0.5,
};

const valueSx = {
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "grey.800",
};

const sectionBoxSx = {
    bgcolor: "#F8FAFC",
    p: 2.5,
    borderRadius: 2,
    border: "1px solid",
    borderColor: "grey.200",
};

const PurchaseOrderModal = ({ open, onClose, data, onShowAlert, onUpdate }) => {
    const [items, setItems] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [processing, setProcessing] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [auditHistoryOpen, setAuditHistoryOpen] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showPaymentWarning, setShowPaymentWarning] = useState(false);
    const [poData, setPoData] = useState(null);
    const [verificationModalOpen, setVerificationModalOpen] = useState(false);
    const [verifStatus, setVerifStatus] = useState(null);

    const loadVerifStatus = async (id) => {
        try {
            const vs = await apiGet(`/api/po/${id}/verification-status/`);
            setVerifStatus(vs?.current_status || 'NOT_STARTED');
        } catch {
            setVerifStatus('NOT_STARTED');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (data && data.id) {
                try {
                    const fullData = await getPurchaseOrder(data.id);
                    setPoData(fullData);
                    setItems(fullData.items || []);
                } catch (error) {
                    console.error("Failed to fetch PO details", error);
                    setPoData(data);
                    setItems(data.items || []);
                }
                loadVerifStatus(data.id);
            } else if (data) {
                setPoData(data);
                setItems(data.items || []);
            }
        };

        if (open) {
            fetchData();
        }
    }, [data, open]);

    // Verification already in-flight or done -> hide the "Send for Verification" button.
    const verificationLocked = verifStatus === 'PENDING' || verifStatus === 'VERIFIED';

    const handleCheckboxChange = (itemId) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedIds(newSelected);
    };

    const handleProceed = () => {
        if (selectedIds.size === 0) {
            onShowAlert("error", "Select items to mark as received");
            return;
        }
        const vendorNotPaid = poData && parseFloat(poData.amount_paid || 0) === 0;
        if (vendorNotPaid) {
            setShowPaymentWarning(true);
        } else {
            setShowConfirm(true);
        }
    };

    const handlePaymentWarningConfirm = () => {
        setShowPaymentWarning(false);
        setShowConfirm(true);
    };

    const processBatchPurchase = async () => {
        setProcessing(true);
        let successCount = 0;
        let errors = 0;

        const newItems = [...items];

        for (const itemId of selectedIds) {
            try {
                await markItemPurchased(data.id, itemId);
                const idx = newItems.findIndex(i => i.id === itemId);
                if (idx !== -1) {
                    newItems[idx] = { ...newItems[idx], is_received: true };
                }
                successCount++;
            } catch (err) {
                console.error(err);
                errors++;
            }
        }

        setItems(newItems);
        setSelectedIds(new Set());
        setProcessing(false);
        setShowConfirm(false);

        if (errors === 0) {
            onShowAlert("success", `${successCount} items marked as purchased successfully.`);
            if (onUpdate) onUpdate();
        } else {
            onShowAlert("warning", `Marked ${successCount} items. Failed: ${errors}`);
            if (successCount > 0 && onUpdate) onUpdate();
        }
    };

    const handlePrint = async () => {
        if (!poData) return;
        setGeneratingPdf(true);
        try {
            // Fetch verification data (with signatures) if available
            let verificationData = null;
            try {
                verificationData = await apiGet(`/api/po/${poData.id}/verification-status/`);
            } catch (err) {
                // Verification data not available, continue without it
            }

            const blob = await pdf(<PurchaseOrderPDF details={poData} verification={verificationData} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error generating PDF:", error);
            if (onShowAlert) onShowAlert("error", "Failed to generate PDF");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const handleEditPO = async () => {
        setProcessing(true);
        try {
            await lockPurchaseOrder(poData.id);
            setEditOpen(true);
        } catch (err) {
            console.error("Failed to lock PO in detail modal:", err);
            const msg = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.message || "This Purchase Order is currently locked by another user.";
            if (onShowAlert) onShowAlert("error", msg);
        } finally {
            setProcessing(false);
        }
    };

    const refreshPOData = async () => {
        try {
            const fullData = await getPurchaseOrder(poData.id);
            setPoData(fullData);
            setItems(fullData.items || []);
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Failed to refresh PO data:", err);
        }
    };

    if (!open || !data) return null;

    const getStatusChip = () => {
        const allReceived = items && items.length > 0 && items.every(i => i.is_received);
        const someReceived = items && items.length > 0 && items.some(i => i.is_received);

        let displayStatus = poData?.status;
        if (allReceived) displayStatus = 'COMPLETED';
        else if (someReceived) displayStatus = 'PARTIALLY_RECEIVED';

        let statusText = displayStatus;
        if (displayStatus === 'PENDING') statusText = 'Pending';
        else if (displayStatus === 'PARTIALLY_RECEIVED') statusText = 'Partially Received';
        else if (displayStatus === 'COMPLETED') statusText = 'Completed';
        else if (displayStatus === 'CANCELLED') statusText = 'Cancelled';

        const colorMap = {
            'PENDING': { bg: '#FEF9C3', color: '#854D0E', border: '#FDE68A' },
            'PARTIALLY_RECEIVED': { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' },
            'COMPLETED': { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
            'CANCELLED': { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
        };
        const colors = colorMap[displayStatus] || { bg: '#F1F5F9', color: '#334155', border: '#E2E8F0' };

        return (
            <Chip
                label={statusText}
                size="small"
                sx={{
                    bgcolor: colors.bg,
                    color: colors.color,
                    border: `1px solid ${colors.border}`,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                }}
            />
        );
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        maxHeight: "90vh",
                        overflow: "hidden",
                    }
                }}
            >
                {/* HEADER */}
                <DialogTitle
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: "#F8FAFC",
                        borderBottom: "1px solid",
                        borderColor: "grey.200",
                        py: 2,
                        px: 3,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ bgcolor: "#DBEAFE", color: PRIMARY, p: 1, borderRadius: 2, display: "flex" }}>
                            <DescriptionIcon />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "grey.800" }}>
                                Purchase Order Details
                            </Typography>
                            <Typography variant="caption" sx={{ color: "grey.500", fontFamily: "monospace" }}>
                                {poData?.po_number || data?.po_number}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        {poData && poData.status !== 'CANCELLED' && (
                            <>
                                {verificationLocked ? (
                                    <Chip
                                        icon={<VerifyIcon sx={{ fontSize: 16 }} />}
                                        label={verifStatus === 'VERIFIED' ? 'Verified' : 'Sent for Verification'}
                                        size="small"
                                        color={verifStatus === 'VERIFIED' ? 'success' : 'warning'}
                                        variant="outlined"
                                        sx={{ fontWeight: 600 }}
                                    />
                                ) : (
                                    <Button
                                        onClick={() => setVerificationModalOpen(true)}
                                        disabled={processing}
                                        variant="outlined"
                                        size="small"
                                        startIcon={<VerifyIcon />}
                                        sx={{
                                            color: "#10b981",
                                            borderColor: "#10b981",
                                            "&:hover": { bgcolor: "#D1FAE5" },
                                            textTransform: "none",
                                            fontWeight: 600,
                                            fontSize: "0.8rem",
                                            borderRadius: 2,
                                        }}
                                    >
                                        Send for Verification
                                    </Button>
                                )}
                                <Button
                                    onClick={handleEditPO}
                                    disabled={processing}
                                    variant="contained"
                                    size="small"
                                    startIcon={<EditIcon />}
                                    sx={{
                                        bgcolor: PRIMARY,
                                        "&:hover": { bgcolor: "#0D47A1" },
                                        textTransform: "none",
                                        fontWeight: 600,
                                        fontSize: "0.8rem",
                                        borderRadius: 2,
                                    }}
                                >
                                    Edit PO
                                </Button>
                            </>
                        )}
                        <IconButton
                            onClick={handlePrint}
                            disabled={generatingPdf}
                            title="Print / Preview PDF"
                            sx={{ color: "grey.600", "&:hover": { color: PRIMARY, bgcolor: "#E3F2FD" } }}
                        >
                            {generatingPdf ? <CircularProgress size={20} /> : <PrintIcon />}
                        </IconButton>
                        <IconButton
                            onClick={onClose}
                            sx={{ color: "grey.500", "&:hover": { color: "error.main", bgcolor: "#FEE2E2" } }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                {/* SCROLLABLE CONTENT */}
                <DialogContent sx={{ bgcolor: BG, p: 3 }}>
                    {!poData ? (
                        <Box sx={{ textAlign: "center", py: 6, color: "grey.500" }}>
                            <CircularProgress size={32} sx={{ mb: 2 }} />
                            <Typography>Loading details...</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
                            {/* GENERAL DETAILS */}
                            <Box sx={sectionBoxSx}>
                                <Typography sx={{ ...labelSx, borderBottom: "1px solid", borderColor: "grey.200", pb: 1, mb: 2 }}>
                                    General PO &amp; Project Info
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography sx={labelSx}>Project Name</Typography>
                                        <Typography sx={valueSx}>{poData.project_name || "N/A"}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography sx={labelSx}>Subject</Typography>
                                        <Typography sx={{ ...valueSx, fontWeight: 600 }}>{poData.subject || "N/A"}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography sx={labelSx}>Requisition Number</Typography>
                                        <Typography sx={valueSx}>{poData.requisition_number}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography sx={labelSx}>PO Date</Typography>
                                        <Typography sx={{ ...valueSx, fontWeight: 600 }}>{poData.po_date ? new Date(poData.po_date).toLocaleDateString() : "N/A"}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography sx={labelSx}>Created By</Typography>
                                        <Typography sx={{ ...valueSx, fontWeight: 600 }}>{poData.created_by_name || "N/A"}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography sx={labelSx}>Revision</Typography>
                                        <Typography sx={{ ...valueSx, fontWeight: 600 }}>
                                            {poData.revision_number} {poData.is_revised && <Typography component="span" sx={{ fontSize: "0.75rem", color: "error.main", fontWeight: 700, ml: 0.5 }}>(Revised)</Typography>}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography sx={labelSx}>Currency</Typography>
                                        <Typography sx={{ ...valueSx, fontFamily: "monospace", color: PRIMARY }}>{poData.currency || "INR"}</Typography>
                                    </Grid>
                                    {poData.conversion_rate && poData.currency !== 'INR' && (
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography sx={labelSx}>Conversion Rate</Typography>
                                            <Typography sx={{ ...valueSx, fontFamily: "monospace", color: "#059669" }}>1 {poData.currency} = {"₹"}{parseFloat(poData.conversion_rate)}</Typography>
                                        </Grid>
                                    )}
                                    {poData.payment_due_date && (
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography sx={labelSx}>Payment Due Date</Typography>
                                            <Typography sx={{ ...valueSx, fontWeight: 600 }}>{new Date(poData.payment_due_date).toLocaleDateString()}</Typography>
                                        </Grid>
                                    )}
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography sx={labelSx}>Status</Typography>
                                        {getStatusChip()}
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* VENDOR & BANK DETAILS */}
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={sectionBoxSx}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid", borderColor: "grey.200", pb: 1, mb: 2 }}>
                                            <BusinessIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                                            <Typography sx={{ ...labelSx, mb: 0 }}>Vendor Information</Typography>
                                        </Box>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Typography sx={labelSx}>Vendor Name</Typography>
                                                <Typography sx={valueSx}>{poData.vendor_name}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography sx={labelSx}>Phone</Typography>
                                                <Typography sx={{ ...valueSx, fontWeight: 600, color: "grey.700" }}>{poData.vendor_details?.phone || "N/A"}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography sx={labelSx}>Email</Typography>
                                                <Typography sx={{ ...valueSx, fontWeight: 600, color: "grey.700" }}>{poData.vendor_details?.email || "N/A"}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography sx={labelSx}>GST Number</Typography>
                                                <Typography sx={{ ...valueSx, fontFamily: "monospace" }}>{poData.vendor_details?.gst_number || poData.vendor_details?.gst_no || "N/A"}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography sx={labelSx}>PAN Number</Typography>
                                                <Typography sx={{ ...valueSx, fontFamily: "monospace" }}>{poData.vendor_details?.pan_number || poData.vendor_details?.pan_no || "N/A"}</Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography sx={labelSx}>Address</Typography>
                                                <Typography sx={{ fontSize: "0.875rem", color: "grey.600", fontWeight: 500, lineHeight: 1.6 }}>{poData.vendor_details?.address || "N/A"}</Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Box sx={sectionBoxSx}>
                                        <Typography sx={{ ...labelSx, borderBottom: "1px solid", borderColor: "grey.200", pb: 1, mb: 2 }}>
                                            {"🏦"} Bank Account Details
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Typography sx={labelSx}>Account Name</Typography>
                                                <Typography sx={valueSx}>{poData.vendor_details?.account_name || "N/A"}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography sx={labelSx}>Bank Name</Typography>
                                                <Typography sx={{ ...valueSx, fontWeight: 600, color: "grey.700" }}>{poData.vendor_details?.bank_name || "N/A"}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography sx={labelSx}>Account Number</Typography>
                                                <Typography sx={{ ...valueSx, fontFamily: "monospace" }}>{poData.vendor_details?.bank_account_number || "N/A"}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography sx={labelSx}>IFSC Code</Typography>
                                                <Typography sx={{ ...valueSx, fontFamily: "monospace" }}>{poData.vendor_details?.ifsc_code || "N/A"}</Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* BILLING & SHIPPING DETAILS */}
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={sectionBoxSx}>
                                        <Typography sx={labelSx}>Bill To</Typography>
                                        <Typography sx={{ fontSize: "0.875rem", color: "grey.700", fontWeight: 500, whiteSpace: "pre-line", lineHeight: 1.6 }}>{poData.bill_to || "N/A"}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={sectionBoxSx}>
                                        <Typography sx={labelSx}>Ship To</Typography>
                                        <Typography sx={{ fontSize: "0.875rem", color: "grey.700", fontWeight: 500, whiteSpace: "pre-line", lineHeight: 1.6 }}>{poData.ship_to || "N/A"}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* ITEMS TABLE */}
                            <Box>
                                <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "grey.700", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5 }}>
                                    Order Items ({poData.items?.length || 0})
                                </Typography>
                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                                <TableCell sx={{ fontWeight: 600, color: "grey.600" }}>Product</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: "grey.600" }}>HSN</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: "grey.600" }}>Quantity</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: "grey.600" }}>Rate</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: "grey.600" }}>Amount</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: "grey.600" }}>Purchase</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {items.map((item, index) => (
                                                <TableRow key={item.id} sx={{ bgcolor: index % 2 === 0 ? "#F8FAFC" : "white", "&:hover": { bgcolor: "#F1F5F9" } }}>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 500, color: "grey.800", fontSize: "0.875rem" }}>{item.product_name}</Typography>
                                                        <Typography sx={{ fontSize: "0.75rem", color: "grey.500", fontFamily: "monospace" }}>{item.product_code}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">{item.hsn_code}</TableCell>
                                                    <TableCell align="right">
                                                        {Number(item.quantity).toFixed(2)} <Typography component="span" sx={{ fontSize: "0.75rem", color: "grey.400" }}>{item.unit}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                                        {getCurrencySymbol(poData.currency)} {formatAmount(item.rate, poData.currency)}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700, color: "grey.800", fontFamily: "monospace" }}>
                                                        {getCurrencySymbol(poData.currency)} {formatAmount(item.amount, poData.currency)}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Checkbox
                                                            size="small"
                                                            disabled={item.is_received || processing}
                                                            checked={item.is_received || selectedIds.has(item.id)}
                                                            onChange={() => !item.is_received && handleCheckboxChange(item.id)}
                                                            sx={{
                                                                color: item.is_received ? "success.main" : "grey.400",
                                                                "&.Mui-checked": {
                                                                    color: item.is_received ? "success.main" : PRIMARY,
                                                                },
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!poData.items || poData.items.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: "grey.400" }}>
                                                        No items in this order.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                                <TableCell colSpan={4} align="right" sx={{ color: "grey.500", fontWeight: 500 }}>Items Total (Sub Total):</TableCell>
                                                <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                                                    {getCurrencySymbol(poData.currency)} {formatAmount(poData.items_total || (parseFloat(poData.total_amount) - parseFloat(poData.freight_cost || 0)), poData.currency)}
                                                </TableCell>
                                                <TableCell />
                                            </TableRow>
                                            {parseFloat(poData.discount_amount) > 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="right" sx={{ color: "error.main", fontWeight: 500 }}>Discount:</TableCell>
                                                    <TableCell align="right" sx={{ color: "error.dark", fontFamily: "monospace", fontWeight: 700 }}>
                                                        -{getCurrencySymbol(poData.currency)} {formatAmount(poData.discount_amount, poData.currency)}
                                                    </TableCell>
                                                    <TableCell />
                                                </TableRow>
                                            )}
                                            {parseFloat(poData.cgst_amount) > 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="right" sx={{ color: "grey.500", fontWeight: 500 }}>CGST ({poData.cgst_percentage}%):</TableCell>
                                                    <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                                                        {getCurrencySymbol(poData.currency)} {formatAmount(poData.cgst_amount, poData.currency)}
                                                    </TableCell>
                                                    <TableCell />
                                                </TableRow>
                                            )}
                                            {parseFloat(poData.sgst_amount) > 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="right" sx={{ color: "grey.500", fontWeight: 500 }}>SGST ({poData.sgst_percentage}%):</TableCell>
                                                    <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                                                        {getCurrencySymbol(poData.currency)} {formatAmount(poData.sgst_amount, poData.currency)}
                                                    </TableCell>
                                                    <TableCell />
                                                </TableRow>
                                            )}
                                            {parseFloat(poData.igst_amount) > 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="right" sx={{ color: "grey.500", fontWeight: 500 }}>IGST ({poData.igst_percentage}%):</TableCell>
                                                    <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                                                        {getCurrencySymbol(poData.currency)} {formatAmount(poData.igst_amount, poData.currency)}
                                                    </TableCell>
                                                    <TableCell />
                                                </TableRow>
                                            )}
                                            {parseFloat(poData.freight_cost) > 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="right" sx={{ color: "grey.500", fontWeight: 500 }}>Freight Cost:</TableCell>
                                                    <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                                                        {getCurrencySymbol(poData.currency)} {formatAmount(poData.freight_cost, poData.currency)}
                                                    </TableCell>
                                                    <TableCell />
                                                </TableRow>
                                            )}
                                            <TableRow sx={{ bgcolor: "#F1F5F9" }}>
                                                <TableCell colSpan={4} align="right" sx={{ fontWeight: 700, fontSize: "1rem" }}>Total Amount:</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: "1.1rem", color: PRIMARY, fontFamily: "monospace" }}>
                                                    {getCurrencySymbol(poData.currency)} {formatAmount(poData.total_amount, poData.currency)}
                                                </TableCell>
                                                <TableCell />
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </TableContainer>
                            </Box>

                            {/* REMARKS & CANCELLATION DETAILS */}
                            {(poData.remarks || poData.status === 'CANCELLED') && (
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    {poData.remarks && (
                                        <Box sx={sectionBoxSx}>
                                            <Typography sx={labelSx}>Remarks</Typography>
                                            <Typography sx={{ fontSize: "0.875rem", color: "grey.700", fontWeight: 500, whiteSpace: "pre-line", lineHeight: 1.6 }}>{poData.remarks}</Typography>
                                        </Box>
                                    )}
                                    {poData.status === 'CANCELLED' && (
                                        <Box sx={{ ...sectionBoxSx, bgcolor: "#FEF2F2", borderColor: "#FECACA" }}>
                                            <Typography sx={{ ...labelSx, color: "error.main" }}>Cancellation Info</Typography>
                                            <Typography sx={{ fontSize: "0.875rem", color: "#991B1B", fontWeight: 700, lineHeight: 1.6 }}>Reason: {poData.cancellation_reason || "No reason specified"}</Typography>
                                            <Typography sx={{ fontSize: "10px", color: "error.main", fontWeight: 500 }}>Cancelled By: {poData.cancelled_by_name || "System"} on {poData.cancelled_at ? new Date(poData.cancelled_at).toLocaleDateString() : "N/A"}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {/* TERMS & CONDITIONS */}
                            <Box sx={sectionBoxSx}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid", borderColor: "grey.200", pb: 1, mb: 2 }}>
                                    <Typography sx={{ ...labelSx, mb: 0 }}>Terms &amp; Conditions</Typography>
                                </Box>
                                {(() => {
                                    const termsList = poData?.terms_and_conditions || [];
                                    if (termsList.length === 0) {
                                        return (
                                            <Typography sx={{ fontSize: "0.75rem", color: "grey.400", fontStyle: "italic" }}>No terms and conditions specified for this Purchase Order.</Typography>
                                        );
                                    }
                                    return (
                                        <Grid container spacing={2}>
                                            {termsList.map((term, index) => {
                                                let label = `Term #${index + 1}`;
                                                let value = term;
                                                if (typeof term === 'string') {
                                                    const colonIdx = term.indexOf(':');
                                                    if (colonIdx !== -1) {
                                                        label = term.substring(0, colonIdx).trim();
                                                        value = term.substring(colonIdx + 1).trim();
                                                    }
                                                } else if (term && typeof term === 'object') {
                                                    if (term.type || term.key || term.label) {
                                                        label = term.type || term.key || term.label;
                                                        value = term.value || '';
                                                    } else {
                                                        const keys = Object.keys(term);
                                                        if (keys.length > 0) {
                                                            label = keys[0];
                                                            value = term[keys[0]];
                                                        }
                                                    }
                                                }
                                                return (
                                                    <Grid item xs={12} md={6} key={index}>
                                                        <Box sx={{ p: 1.75, bgcolor: "white", borderRadius: 2, border: "1px solid", borderColor: "grey.100", "&:hover": { borderColor: "grey.300" } }}>
                                                            <Typography sx={{ ...labelSx, mb: 0.5 }}>{label}</Typography>
                                                            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "grey.700", lineHeight: 1.6 }}>{value}</Typography>
                                                        </Box>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    );
                                })()}
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                {/* FOOTER */}
                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "grey.200", bgcolor: "#F8FAFC", justifyContent: "flex-end", gap: 1.5 }}>
                    <Button
                        onClick={onClose}
                        disabled={processing}
                        variant="outlined"
                        sx={{
                            color: "grey.700",
                            borderColor: "grey.300",
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                            "&:hover": { bgcolor: "#F8FAFC" },
                        }}
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleProceed}
                        disabled={processing || selectedIds.size === 0}
                        variant="contained"
                        sx={{
                            bgcolor: PRIMARY,
                            "&:hover": { bgcolor: "#0D47A1" },
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                        }}
                    >
                        {processing ? "Processing..." : "Proceed"}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={showPaymentWarning}
                title="Vendor Payment Pending"
                message={`The vendor "${poData?.vendor_name || ''}" for this Purchase Order has not been paid yet. Are you sure you want to mark items as purchased?`}
                confirmText="Yes, Continue"
                onCancel={() => setShowPaymentWarning(false)}
                onConfirm={handlePaymentWarningConfirm}
                icon={WarningAmberIcon}
                confirmButtonClass="bg-amber-600 hover:bg-amber-700"
                iconBgClass="bg-amber-100 text-amber-600"
            />

            <ConfirmDialog
                open={showConfirm}
                title="Mark Items as Purchased"
                message={`Are you sure you want to mark ${selectedIds.size} selected items as purchased/received?`}
                confirmText="Confirm Purchase"
                loading={processing}
                onCancel={() => setShowConfirm(false)}
                onConfirm={processBatchPurchase}
                icon={CheckCircleIcon}
                confirmButtonClass="bg-blue-600 hover:bg-blue-750"
                iconBgClass="bg-blue-100 text-blue-600"
            />

            <EditPurchaseOrderModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                poData={poData}
                onUpdate={refreshPOData}
            />

            {poData && (
                <ObjectAuditHistoryModal
                    open={auditHistoryOpen}
                    onClose={() => setAuditHistoryOpen(false)}
                    modelName="PurchaseOrder"
                    objectId={poData.id}
                />
            )}

            {poData && (
                <POVerificationModal
                    open={verificationModalOpen}
                    onClose={() => setVerificationModalOpen(false)}
                    poId={poData.id}
                    poNumber={poData.po_number}
                    onSuccess={() => {
                        if (onUpdate) onUpdate();
                        refreshPOData();
                        loadVerifStatus(poData.id);
                    }}
                />
            )}
        </>
    );
};

export default PurchaseOrderModal;
