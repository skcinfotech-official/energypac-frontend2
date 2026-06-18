import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Paper,
    Grid,
    Typography,
    Table,
    TableContainer,
    TableHead,
    TableBody,
    TableFooter,
    TableRow,
    TableCell,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    ToggleButton,
    ToggleButtonGroup,
    Stack,
    Divider,
    Chip,
} from "@mui/material";
import {
    Close as CloseIcon,
    FileDownload as FileDownloadIcon,
    Print as PrintIcon,
    Description as DescriptionIcon,
    Business as BusinessIcon,
    Info as InfoIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getBillById } from "../../services/salesService";
import { pdf } from "@react-pdf/renderer";
import BillPDF from "./BillPDF";
import { toast } from "react-hot-toast";

const getCurrencySymbol = (code) => {
    switch (code?.toUpperCase()) {
        case "USD": return "$";
        case "EUR": return "€";
        case "GBP": return "£";
        case "JPY": return "¥";
        case "CAD": return "C$";
        case "AUD": return "A$";
        case "INR": return "₹";
        default: return code || "₹";
    }
};

const BillDetailsModal = ({ isOpen, onClose, loading, details }) => {
    const [viewCurrency, setViewCurrency] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    if (!isOpen) return null;

    const billCurrency = details?.currency || 'INR';
    const convRate = parseFloat(details?.conversion_rate || 1);
    const activeCurrency = viewCurrency || billCurrency;

    const formatCurrency = (amount, currency) => {
        const curr = currency || activeCurrency;
        const num = Number(amount || 0);
        const locale = curr?.toUpperCase() === 'INR' ? 'en-IN' : 'en-US';
        return `${getCurrencySymbol(curr)} ${num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const toView = (val) => {
        const num = Number(val || 0);
        if (activeCurrency === billCurrency) return num;
        if (activeCurrency === 'INR' && billCurrency !== 'INR') return num * convRate;
        return num;
    };

    const handlePrint = async () => {
        if (!details) return;
        setGeneratingPdf(true);
        try {
            const blob = await pdf(<BillPDF details={details} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const handleExport = async () => {
        if (!details || !details.id) return;
        setExporting(true);
        try {
            const data = await getBillById(details.id);

            const wb = XLSX.utils.book_new();

            const wsData = [
                ["BILL DETAILED REPORT"],
                ["Generated At:", new Date().toLocaleString()],
                [],
                // BILL INFO
                ["BILL INFORMATION"],
                ["Bill Number", data.bill_number],
                ["Bill Date", data.bill_date],
                ["Status", data.status],
                ["Created By", data.created_by],
                [],
                // PROFORMA INVOICE INFO
                ["PROFORMA INVOICE DETAILS"],
                ["PI Number", data.proforma_invoice?.pi_number],
                ["PI Date", data.proforma_invoice?.pi_date],
                ["PI Status", data.proforma_invoice?.status],
                [],
                // CLIENT INFO
                ["CLIENT INFORMATION"],
                ["Client Name", data.client_details?.name],
                ["Contact Person", data.client_details?.contact_person],
                ["Phone", data.client_details?.phone],
                ["Email", data.client_details?.email],
                ["Address", data.client_details?.address],
                [],
                // ITEMS
                ["BILL ITEMS"],
                ["Item Code", "Item Name", "Description", "HSN Code", "Unit", "Ordered Qty", "Previously Delivered", "Current Delivered", "Pending Qty", "Rate", "Amount", "Remarks"],
            ];

            // Add Items
            (data.items || []).forEach(item => {
                wsData.push([
                    item.product_code || item.item_code,
                    item.item_name,
                    item.description,
                    item.hsn_code,
                    item.unit,
                    item.ordered_quantity !== undefined && item.ordered_quantity !== null ? item.ordered_quantity : (item.quantity || 0),
                    item.previously_delivered !== undefined && item.previously_delivered !== null ? item.previously_delivered : 0,
                    item.delivered_quantity !== undefined && item.delivered_quantity !== null ? item.delivered_quantity : (item.quantity || 0),
                    item.pending_quantity !== undefined && item.pending_quantity !== null ? item.pending_quantity : 0,
                    item.rate,
                    item.amount,
                    item.remarks
                ]);
            });

            wsData.push([]);

            // FINANCIALS
            wsData.push(["FINANCIAL SUMMARY"]);
            const financials = data.financial || {};
            wsData.push(["Subtotal", financials.subtotal]);

            if (financials.cgst?.amount > 0) {
                wsData.push([`CGST (${financials.cgst.percentage}%)`, financials.cgst.amount]);
            }
            if (financials.sgst?.amount > 0) {
                wsData.push([`SGST (${financials.sgst.percentage}%)`, financials.sgst.amount]);
            }
            if (financials.igst?.amount > 0) {
                wsData.push([`IGST (${financials.igst.percentage}%)`, financials.igst.amount]);
            }

            wsData.push(["Total Tax", financials.total_tax]);
            wsData.push(["Total Amount", financials.total_amount]);
            wsData.push(["Advance Deducted", financials.advance_deducted]);
            wsData.push(["Net Payable", financials.net_payable]);
            wsData.push(["Amount Paid", financials.amount_paid]);
            wsData.push(["Balance Due", financials.balance]);

            // REMARKS
            wsData.push([]);
            wsData.push(["Remarks", data.remarks]);


            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Col Widths
            ws['!cols'] = [
                { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 10 }, { wch: 8 },
                { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
                { wch: 15 }, { wch: 20 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, "Bill Details");

            const filename = `Bill_Details_${data.bill_number.replace(/\//g, '-')}.xlsx`;
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
            saveAs(blob, filename);

            toast.success("Bill detailed report downloaded successfully");

        } catch (error) {
            console.error("Failed to export bill details", error);
            toast.error("Failed to export bill details");
        } finally {
            setExporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { maxHeight: "90vh" } }}>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <DescriptionIcon sx={{ color: "primary.main", fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            Bill Details
                        </Typography>
                        {details && (
                            <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                                {details.bill_number}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    {details && (
                        <>
                            <Button
                                startIcon={<PrintIcon />}
                                onClick={handlePrint}
                                disabled={generatingPdf}
                                variant="outlined"
                                size="small"
                                title="Print / Preview PDF"
                            >
                                {generatingPdf ? "PDF..." : "Print"}
                            </Button>
                            <Button
                                startIcon={<FileDownloadIcon />}
                                onClick={handleExport}
                                disabled={exporting}
                                variant="outlined"
                                color="success"
                                size="small"
                                title="Export to Excel"
                            >
                                {exporting ? "Exporting..." : "Excel"}
                            </Button>
                        </>
                    )}
                    <Button
                        onClick={onClose}
                        variant="text"
                        size="small"
                        sx={{ minWidth: "auto", p: 1 }}
                    >
                        <CloseIcon />
                    </Button>
                </Box>
            </DialogTitle>

            {/* View Toggle */}
            {!loading && details && billCurrency !== 'INR' && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 1.5, px: 2, backgroundColor: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
                    <ToggleButtonGroup
                        value={activeCurrency}
                        exclusive
                        onChange={(e, newCurrency) => {
                            if (newCurrency !== null) setViewCurrency(newCurrency);
                        }}
                        size="small"
                    >
                        <ToggleButton value={billCurrency}>{billCurrency} View</ToggleButton>
                        <ToggleButton value="INR">INR View</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            )}

            {/* Exchange Rate Info */}
            {!loading && details && billCurrency !== 'INR' && convRate > 0 && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 1, px: 2, backgroundColor: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
                    <Typography variant="caption" sx={{ color: "primary.main", fontWeight: "bold" }}>
                        1 {billCurrency} = ₹{convRate.toFixed(2)}
                    </Typography>
                </Box>
            )}

            <DialogContent dividers sx={{ overflow: "auto", maxHeight: "calc(90vh - 200px)", backgroundColor: "#fafafa" }}>
                {loading ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8 }}>
                        <CircularProgress />
                        <Typography sx={{ mt: 2, color: "text.secondary" }}>Loading Bill Details...</Typography>
                    </Box>
                ) : details ? (
                    <Stack spacing={3}>

                        {/* Status & Dates Banner */}
                        <Paper sx={{ p: 2, backgroundColor: "#f0f4ff", border: "1px solid #e3f2fd" }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm="auto">
                                    <Chip
                                        label={details.status}
                                        color={
                                            details.status === 'GENERATED' ? 'primary' :
                                            details.status === 'PAID' ? 'success' : 'default'
                                        }
                                        variant="filled"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", display: "block" }}>
                                        Bill Date
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                        {details.bill_date}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", display: "block" }}>
                                        Proforma Invoice
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: "bold", fontFamily: "monospace" }}>
                                        {details.pi_number}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", display: "block" }}>
                                        Bill Type
                                    </Typography>
                                    <Chip
                                        label={details.bill_type || 'DOMESTIC'}
                                        color={details.bill_type === 'INTERNATIONAL' ? 'warning' : 'default'}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm="auto" sx={{ textAlign: { sm: "right" } }}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", display: "block" }}>
                                        Created By
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                        {details.created_by_name}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Client Info Card */}
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, pb: 1.5, borderBottom: "1px solid #e0e0e0" }}>
                                    <BusinessIcon sx={{ color: "primary.main" }} fontSize="small" />
                                    <Typography variant="subtitle2" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>
                                        Client Information
                                    </Typography>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", display: "block" }}>
                                            Client Name
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                            {details.client_name}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", display: "block" }}>
                                            Contact Person
                                        </Typography>
                                        <Typography variant="body2">
                                            {details.contact_person || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", display: "block" }}>
                                            Phone
                                        </Typography>
                                        <Typography variant="body2">
                                            {details.phone || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", display: "block" }}>
                                            Email
                                        </Typography>
                                        <Typography variant="body2">
                                            {details.email || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={8}>
                                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", display: "block" }}>
                                            Address
                                        </Typography>
                                        <Typography variant="body2">
                                            {details.address || 'N/A'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Items Table */}
                        <Box>
                            <Typography variant="subtitle2" sx={{ textTransform: "uppercase", fontWeight: "bold", mb: 2 }}>
                                Bill Items
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: "bold" }}>Product Details</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: "bold" }}>HSN</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: "bold" }}>Qty</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: "bold" }}>Rate ({activeCurrency})</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: "bold" }}>Amount ({activeCurrency})</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {details.items?.map((item, idx) => (
                                            <TableRow key={item.id || idx} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                            {item.item_name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary", display: "block" }}>
                                                            {item.product_code || item.item_code}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                            {item.description}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                                                    {item.hsn_code}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                        {Number(item.delivered_quantity !== undefined && item.delivered_quantity !== null ? item.delivered_quantity : item.quantity || 0).toFixed(2)} <span style={{ fontSize: "0.75rem" }}>{item.unit}</span>
                                                    </Typography>
                                                    {item.ordered_quantity !== undefined && item.ordered_quantity !== null && (
                                                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                                                            Order: {Number(item.ordered_quantity).toFixed(2)}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                                                    {formatCurrency(toView(item.rate), activeCurrency)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: "monospace" }}>
                                                    {formatCurrency(toView(item.amount), activeCurrency)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter sx={{ backgroundColor: "#f5f5f5" }}>
                                        <TableRow>
                                            <TableCell colSpan={4} align="right" sx={{ fontWeight: "bold" }}>
                                                Total Items Amount ({activeCurrency})
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: "bold", fontFamily: "monospace" }}>
                                                {formatCurrency(toView(details.subtotal), activeCurrency)}
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </TableContainer>
                        </Box>

                        {/* Bottom Section: Remarks & Financials */}
                        <Grid container spacing={3}>
                            {/* Left Side: Remarks & Summary */}
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, pb: 1.5, borderBottom: "1px solid #e0e0e0" }}>
                                            <InfoIcon sx={{ color: "primary.main" }} fontSize="small" />
                                            <Typography variant="subtitle2" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>
                                                Remarks
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ color: "text.secondary", minHeight: "60px" }}>
                                            {details.remarks || "No remarks provided."}
                                        </Typography>
                                    </CardContent>
                                </Card>
                                <Paper sx={{ mt: 2, p: 2, backgroundColor: "#e3f2fd", border: "1px solid #bbdefb" }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: "primary.main", fontWeight: "bold", display: "block" }}>
                                                Total Items
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold" }}>
                                                {details.total_items || details.items?.length || 0}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sx={{ textAlign: "right" }}>
                                            <Typography variant="caption" sx={{ color: "error.main", fontWeight: "bold", display: "block" }}>
                                                Balance Due ({activeCurrency})
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: "error.main", fontWeight: "bold" }}>
                                                {formatCurrency(toView(details.balance), activeCurrency)}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* Right Side: Financial Summary */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2.5, backgroundColor: "#f5f5f5" }}>
                                    <Stack spacing={1.5}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                Subtotal ({activeCurrency})
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: "bold" }}>
                                                {formatCurrency(toView(details.subtotal), activeCurrency)}
                                            </Typography>
                                        </Box>
                                        <Divider />
                                        {parseFloat(details.cgst_amount) > 0 && (
                                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                    CGST ({details.cgst_percentage}%)
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                                                    {formatCurrency(toView(details.cgst_amount), activeCurrency)}
                                                </Typography>
                                            </Box>
                                        )}
                                        {parseFloat(details.sgst_amount) > 0 && (
                                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                    SGST ({details.sgst_percentage}%)
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                                                    {formatCurrency(toView(details.sgst_amount), activeCurrency)}
                                                </Typography>
                                            </Box>
                                        )}
                                        {parseFloat(details.igst_amount) > 0 && (
                                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                    IGST ({details.igst_percentage}%)
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                                                    {formatCurrency(toView(details.igst_amount), activeCurrency)}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                                            <Typography variant="body2">Total GST</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                                {formatCurrency(toView(details.total_gst), activeCurrency)}
                                            </Typography>
                                        </Box>
                                        <Divider />
                                        <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "primary.main" }}>
                                            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                Total Amount ({activeCurrency})
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: "bold" }}>
                                                {formatCurrency(toView(details.total_amount), activeCurrency)}
                                            </Typography>
                                        </Box>
                                        {parseFloat(details.discount_amount) > 0 && (
                                            <Box sx={{ display: "flex", justifyContent: "space-between", color: "error.main" }}>
                                                <Typography variant="body2">Less: Discount</Typography>
                                                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                                    - {formatCurrency(toView(details.discount_amount), activeCurrency)}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box sx={{ display: "flex", justifyContent: "space-between", color: "success.main" }}>
                                            <Typography variant="body2">Amount Paid ({activeCurrency})</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                                {formatCurrency(toView(details.amount_paid), activeCurrency)}
                                            </Typography>
                                        </Box>
                                        <Divider />
                                        <Box sx={{ display: "flex", justifyContent: "space-between", backgroundColor: "#fff", p: 1.5, borderRadius: 1, border: "1px solid #e0e0e0" }}>
                                            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                Net Payable ({activeCurrency})
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: "bold", color: "primary.main" }}>
                                                {formatCurrency(toView(details.net_payable), activeCurrency)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>
                        </Grid>

                    </Stack>
                ) : (
                    <Alert severity="error">Failed to load bill details.</Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default BillDetailsModal;