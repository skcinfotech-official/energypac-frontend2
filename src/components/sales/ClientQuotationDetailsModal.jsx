import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Paper,
    Grid,
    Card,
    CardContent,
    Typography,
    Chip,
    Table,
    TableContainer,
    TableHead,
    TableBody,
    TableFooter,
    TableRow,
    TableCell,
    CircularProgress,
    Stack,
    Divider,
} from "@mui/material";
import {
    Close as CloseIcon,
    Description as InvoiceIcon,
    Public as GlobeIcon,
    Anchor as AnchorIcon,
    Notes as NotesIcon,
    Print as PrintIcon,
    Inventory as InventoryIcon,
    CheckCircle as VerifyIcon,
} from "@mui/icons-material";
import { getProformaInvoiceById } from "../../services/salesService";
import { apiGet } from "../../services/api";
import { pdf } from "@react-pdf/renderer";
import ClientQuotationPDF from "./ClientQuotationPDF";
import PIVerificationModal from "../signature/PIVerificationModal";

const ClientQuotationDetailsModal = ({ isOpen, onClose, invoice }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [verificationModalOpen, setVerificationModalOpen] = useState(false);
    const [verifStatus, setVerifStatus] = useState(null);

    const loadVerifStatus = async (id) => {
        try {
            const vs = await apiGet(`/api/pi/${id}/verification-status/`);
            setVerifStatus(vs?.current_status || 'NOT_STARTED');
        } catch {
            setVerifStatus('NOT_STARTED');
        }
    };
    // Verification already in-flight or done -> hide the "Send for Verification" button.
    const verificationLocked = verifStatus === 'PENDING' || verifStatus === 'VERIFIED';

    const lcNumber = details?.lc_number || details?.lc || "";
    const requisitionNumber = details?.requisition_number || details?.requisition || details?.requisition_no || "";
    const handlingNotes = details?.notes || details?.handling_notes || "";

    useEffect(() => {
        if (isOpen && invoice?.id) {
            const fetchDetails = async () => {
                setLoading(true);
                try {
                    const data = await getProformaInvoiceById(invoice.id);
                    setDetails(data);
                } catch (err) {
                    console.error("Failed to fetch proforma invoice details", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchDetails();
            loadVerifStatus(invoice.id);
        } else {
            setDetails(null);
            setVerifStatus(null);
        }
    }, [isOpen, invoice]);

    const handlePrint = async () => {
        if (!details) return;
        setGeneratingPdf(true);
        try {
            // Fetch verification data (with signatures) if available
            let verificationData = null;
            try {
                verificationData = await apiGet(`/api/pi/${details.id}/verification-status/`);
            } catch (err) {
                // Verification data not available, continue without it
            }

            const blob = await pdf(<ClientQuotationPDF quotation={details} verification={verificationData} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (err) {
            console.error("Failed to generate PDF", err);
            alert("Failed to generate print document");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const getStatusColor = (status) => {
        const s = (status || "DRAFT").toUpperCase();
        switch (s) {
            case "DRAFT":
                return "default";
            case "SENT":
                return "primary";
            case "ACCEPTED":
                return "success";
            case "CANCELLED":
                return "error";
            default:
                return "default";
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { maxHeight: "90vh" } }}>
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <InvoiceIcon sx={{ color: "primary.main" }} />
                    <Typography variant="h6">Proforma Invoice Details</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {details && details.status !== "CANCELLED" && (
                        verificationLocked ? (
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
                                startIcon={<VerifyIcon />}
                                onClick={() => setVerificationModalOpen(true)}
                                disabled={generatingPdf}
                                variant="outlined"
                                size="small"
                                sx={{ color: "#10b981", borderColor: "#10b981", "&:hover": { bgcolor: "#D1FAE5" } }}
                            >
                                Send for Verification
                            </Button>
                        )
                    )}
                    {details && (
                        <Button
                            startIcon={<PrintIcon />}
                            onClick={handlePrint}
                            disabled={generatingPdf}
                            variant="contained"
                            size="small"
                        >
                            {generatingPdf ? "Generating PDF..." : "Print Invoice"}
                        </Button>
                    )}
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ overflow: "auto", maxHeight: "calc(90vh - 120px)" }}>
                {loading ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8 }}>
                        <CircularProgress />
                        <Typography sx={{ mt: 2, color: "text.secondary" }}>Fetching detailed invoice sheet...</Typography>
                    </Box>
                ) : details ? (
                    <Stack spacing={3}>
                        {/* TOP IDENTIFIERS */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", pb: 2, borderBottom: "1px solid #e0e0e0", gap: 2 }}>
                            <Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
                                    <Typography variant="h6" sx={{ fontFamily: "monospace" }}>
                                        {details.pi_number || `#${details.id?.substring(0, 8) || "N/A"}`}
                                    </Typography>
                                    {lcNumber && <Chip label={`L/C: ${lcNumber}`} variant="outlined" color="primary" size="small" />}
                                    <Chip label={`STATUS: ${(details.status || "DRAFT").toUpperCase()}`} color={getStatusColor(details.status)} size="small" />
                                </Box>
                                {details.is_stock_sale ? (
                                    <Chip icon={<InventoryIcon />} label="STOCK SALE (Direct)" variant="outlined" color="warning" size="small" />
                                ) : requisitionNumber ? (
                                    <Chip label={`REQ: ${requisitionNumber}`} variant="outlined" size="small" />
                                ) : null}
                            </Box>
                            <Box sx={{ textAlign: "right" }}>
                                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold" }}>
                                    PI Issued Date
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                                    {details.pi_date}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold", display: "block" }}>
                                    Payment Due
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                    {details.payment_due_date || "N/A"}
                                </Typography>
                            </Box>
                        </Box>

                        {/* PARTIES CARDS */}
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold", display: "block", mb: 0.5 }}>
                                            Exporter Beneficiary
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                                            {details.exporter_beneficiary}
                                        </Typography>
                                        {details.exporter_reference && (
                                            <Typography variant="caption" sx={{ fontFamily: "monospace", display: "block" }}>
                                                Ref: {details.exporter_reference}
                                            </Typography>
                                        )}
                                        {details.gst_number && (
                                            <Typography variant="caption" sx={{ fontFamily: "monospace", display: "block" }}>
                                                GSTIN: {details.gst_number}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold", display: "block", mb: 1 }}>
                                            Consignee
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                            {details.consignee}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold", display: "block", mb: 1 }}>
                                            Applicant Importer
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                            {details.applicant_importer}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* PORT & LOGISTICS */}
                        <Paper sx={{ p: 3, backgroundColor: "#f0f4ff", border: "1px solid #e3f2fd" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, pb: 1, borderBottom: "1px solid #e3f2fd" }}>
                                <AnchorIcon sx={{ color: "primary.main" }} fontSize="small" />
                                <Typography variant="subtitle2" sx={{ textTransform: "uppercase", fontWeight: "bold", color: "primary.main" }}>
                                    Logistics & Shipping
                                </Typography>
                            </Box>
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold", display: "block" }}>
                                        Port of Loading
                                    </Typography>
                                    <Typography variant="body2">{details.port_of_loading || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold", display: "block" }}>
                                        Port of Discharge
                                    </Typography>
                                    <Typography variant="body2">{details.port_of_discharge || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold", display: "block" }}>
                                        Pre-carriage By
                                    </Typography>
                                    <Typography variant="body2">{details.pre_carriage_by || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold", display: "block" }}>
                                        Place of Receipt
                                    </Typography>
                                    <Typography variant="body2">{details.place_of_receipt || "N/A"}</Typography>
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold", display: "block" }}>
                                        Country of Origin
                                    </Typography>
                                    <Typography variant="body2">{details.country_of_origin || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold", display: "block" }}>
                                        Final Destination
                                    </Typography>
                                    <Typography variant="body2">{details.final_destination || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold", display: "block" }}>
                                        Terms of Delivery
                                    </Typography>
                                    <Typography variant="body2">{details.terms_of_delivery || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: "bold", display: "block" }}>
                                        Terms of Payment
                                    </Typography>
                                    <Typography variant="body2">{details.terms_of_payment || "N/A"}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* CURRENCY INFO */}
                        <Paper sx={{ p: 2, backgroundColor: "#ecf5e9", border: "1px solid #c8e6c9", display: "flex", alignItems: "center", gap: 1 }}>
                            <GlobeIcon sx={{ color: "success.main" }} />
                            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                Currency: <strong>{details.currency}</strong> | Conversion Rate: <strong>1 {details.currency} = {details.conversion_rate} INR</strong>
                            </Typography>
                        </Paper>

                        {/* ITEMS TABLE */}
                        <Box>
                            <Typography variant="subtitle2" sx={{ textTransform: "uppercase", fontWeight: "bold", mb: 2 }}>
                                Item Breakdown
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                                        <TableRow>
                                            <TableCell align="center" width="5%">
                                                #
                                            </TableCell>
                                            <TableCell>Product</TableCell>
                                            <TableCell align="center" width="15%">
                                                HSN Code
                                            </TableCell>
                                            <TableCell align="right" width="12%">
                                                Quantity
                                            </TableCell>
                                            <TableCell align="right" width="15%">
                                                Unit Price ({details.currency})
                                            </TableCell>
                                            <TableCell align="right" width="15%">
                                                Total ({details.currency})
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {details.items?.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell align="center">{idx + 1}</TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                            {item.product_name || item.item_name || "Product"}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                                                            {item.product}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center" sx={{ fontFamily: "monospace" }}>
                                                    {item.hsn_code}
                                                </TableCell>
                                                <TableCell align="right">{Number(item.quantity || 0).toFixed(2)}</TableCell>
                                                <TableCell align="right">{Number(item.unit_price || 0).toFixed(2)}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                                    {Number(item.amount || Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    {details.items && details.items.length > 0 && (
                                        <TableFooter sx={{ backgroundColor: "#f5f5f5" }}>
                                            <TableRow>
                                                <TableCell colSpan={5} align="right" sx={{ fontWeight: "bold" }}>
                                                    Subtotal Amount:
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: "bold", color: "primary.main" }}>
                                                    {details.currency}{" "}
                                                    {details.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell colSpan={5} align="right" sx={{ fontWeight: "bold" }}>
                                                    Grand Total:
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: "bold", color: "primary.main" }}>
                                                    {details.currency} {Number(details.grand_total || 0).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                            {Number(details.amount_received || 0) > 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="right" sx={{ fontWeight: "bold" }}>
                                                        Amount Received:
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: "bold", color: "success.main" }}>
                                                        {details.currency} {Number(details.amount_received || 0).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {Number(details.balance || 0) > 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="right" sx={{ fontWeight: "bold" }}>
                                                        Balance Due:
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: "bold", color: "error.main" }}>
                                                        {details.currency} {Number(details.balance || 0).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableFooter>
                                    )}
                                </Table>
                            </TableContainer>
                        </Box>

                        {/* TERMS & NOTES */}
                        <Grid container spacing={3}>
                            {/* Terms & Conditions */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                    <NotesIcon fontSize="small" sx={{ color: "text.secondary" }} />
                                    <Typography variant="subtitle2" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>
                                        Terms & Conditions
                                    </Typography>
                                </Box>
                                <Paper variant="outlined" sx={{ overflow: "hidden" }}>
                                    <Box sx={{ backgroundColor: "#fafafa" }}>
                                        {details.terms_and_conditions && details.terms_and_conditions.length > 0 ? (
                                            details.terms_and_conditions.map((term, index) => {
                                                let key = "";
                                                let value = "";
                                                let bold = false;
                                                if (term && typeof term === "object") {
                                                    key = term.key || "";
                                                    value = term.value || "";
                                                    bold = !!term.bold;
                                                } else {
                                                    const termStr = String(term);
                                                    const colonIdx = termStr.indexOf(":");
                                                    value = termStr;
                                                    if (colonIdx !== -1) {
                                                        key = termStr.substring(0, colonIdx).trim();
                                                        value = termStr.substring(colonIdx + 1).trim();
                                                    }
                                                }
                                                return (
                                                    <Box key={index} sx={{ px: 2, py: 1.5, borderBottom: "1px solid #e0e0e0", "&:last-child": { borderBottom: "none" } }}>
                                                        <Typography variant="caption" sx={{ display: "flex", justifyContent: "space-between", fontWeight: bold ? 700 : 400 }}>
                                                            <span>
                                                                {key ? <strong>{key}:</strong> : <span>Term #{index + 1}:</span>}
                                                            </span>
                                                            <span style={{ textAlign: "right", fontWeight: bold ? 700 : 400 }}>{value}</span>
                                                        </Typography>
                                                    </Box>
                                                );
                                            })
                                        ) : (
                                            <Box sx={{ px: 2, py: 2 }}>
                                                <Typography variant="caption" sx={{ fontStyle: "italic", color: "text.secondary" }}>
                                                    No specific terms and conditions declared
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Handling Notes */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                    <NotesIcon fontSize="small" sx={{ color: "text.secondary" }} />
                                    <Typography variant="subtitle2" sx={{ textTransform: "uppercase", fontWeight: "bold" }}>
                                        Handling Notes
                                    </Typography>
                                </Box>
                                <Paper variant="outlined" sx={{ p: 2, minHeight: "120px", backgroundColor: "#fafafa" }}>
                                    <Typography variant="body2">
                                        {handlingNotes || (
                                            <span style={{ fontStyle: "italic", color: "#999" }}>No additional handling notes provided.</span>
                                        )}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Stack>
                ) : (
                    <Typography sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                        Failed to display invoice details sheet
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">
                    Close
                </Button>
            </DialogActions>

            {details && (
                <PIVerificationModal
                    open={verificationModalOpen}
                    onClose={() => setVerificationModalOpen(false)}
                    piId={details.id}
                    piNumber={details.pi_number}
                    onSuccess={() => {
                        setVerificationModalOpen(false);
                        // Refresh status so the button flips to a "Sent" chip
                        loadVerifStatus(details.id);
                    }}
                />
            )}
        </Dialog>
    );
};

export default ClientQuotationDetailsModal;