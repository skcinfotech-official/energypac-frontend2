import { useCallback, useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography, Button, Alert, CircularProgress,
    Chip, IconButton, Divider,
} from "@mui/material";
import {
    Close as CloseIcon,
    RequestQuote as QuoteIcon,
} from "@mui/icons-material";
import { getVendorQuotationById, updateQuotation } from "../../services/vendorQuotationService";

const LABEL = {
    fontSize: 10, fontWeight: 900, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.05em",
};
const VALUE = { fontSize: 13, fontWeight: 700, color: "#0f172a", mt: 0.25 };
const TH = {
    fontSize: 10, fontWeight: 900, color: "#475569", textTransform: "uppercase",
    letterSpacing: "0.05em", bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0",
    py: 1, whiteSpace: "nowrap",
};
const TD = { fontSize: 13, py: 1, borderBottom: "1px solid #f1f5f9" };
const INPUT = {
    "& .MuiOutlinedInput-root": {
        borderRadius: 1, bgcolor: "white", fontSize: 13, fontWeight: 700,
        "& fieldset": { borderColor: "#dbeafe" },
    },
};

/** One label/value pair — the whole header is just a grid of these. */
function Field({ label, children }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography sx={LABEL}>{label}</Typography>
            <Box sx={VALUE}>{children || <Box component="span" sx={{ color: "#cbd5e1" }}>—</Box>}</Box>
        </Box>
    );
}

const VendorQuotationEditModal = ({ open, onClose, quotationId, onSuccess }) => {
    const [data, setData] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [currency, setCurrency] = useState("INR");

    const loadDetails = useCallback(async (id) => {
        setLoading(true);
        setError("");
        try {
            const res = await getVendorQuotationById(id);
            setData(res);
            setCurrency(res.currency || "INR");

            setItems((res.items || []).map((item) => ({
                ...item,
                quoted_rate: item.quoted_rate ?? "",
                remarks: item.remarks || "",
            })));
        } catch (err) {
            console.error(err);
            setError("Failed to load quotation details.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open && quotationId) {
            loadDetails(quotationId);
        } else {
            setData(null);
            setItems([]);
        }
    }, [open, quotationId, loadDetails]);

    const updateItem = (index, field, value) =>
        setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));

    const rowAmount = (item) => (parseFloat(item.quantity) || 0) * (parseFloat(item.quoted_rate) || 0);
    const totalAmount = items.reduce((sum, item) => sum + rowAmount(item), 0);
    const isForeign = currency !== "INR";
    const symbol = isForeign ? `${currency} ` : "₹";

    const money = (v) => `${symbol}${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const unpriced = items.filter((i) => !(Number(i.quoted_rate) > 0)).length;

    const handleSubmit = async () => {
        setSubmitting(true);
        setError("");
        try {
            const payload = {
                items: items.map((item) => ({
                    id: item.id,
                    vendor_item: item.vendor_item,
                    quoted_rate: parseFloat(item.quoted_rate) || 0,
                    remarks: item.remarks || "",
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

    const vendorGst = data?.gst_number || data?.vendor?.gst_number;
    const vendorPan = data?.pan_number || data?.vendor?.pan_number;
    const bankName = data?.bank_name || data?.vendor?.bank_name;
    const bankAcct = data?.bank_account_number || data?.vendor?.bank_account_number || data?.account_number || data?.vendor?.account_number;
    const bankIfsc = data?.ifsc_code || data?.vendor?.ifsc_code;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, height: "88vh", display: "flex", flexDirection: "column" } }}
        >
            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <DialogTitle sx={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                bgcolor: "#1a1a2e", color: "white", py: 1.75, px: 2.5, flexShrink: 0,
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                    <QuoteIcon sx={{ color: "#0ea5e9", fontSize: 22 }} />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 16, textTransform: "uppercase" }}>
                            Edit Quotation
                        </Typography>
                        <Typography sx={{ color: "#cbd5e1", fontSize: 10, fontFamily: "monospace" }}>
                            {data?.quotation_number || "Draft"} {data?.vendor_name ? `· ${data.vendor_name}` : ""}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                        label={currency}
                        size="small"
                        sx={{
                            fontWeight: 900, fontSize: 10,
                            bgcolor: isForeign ? "#1d4ed8" : "rgba(255,255,255,0.12)",
                            color: "white",
                        }}
                    />
                    <IconButton onClick={onClose} size="small" sx={{ color: "#cbd5e1", "&:hover": { color: "white" } }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            {/* ── BODY ───────────────────────────────────────────────────── */}
            <DialogContent sx={{ p: 2, bgcolor: "#f8fafc", flex: 1, overflowY: "auto" }}>
                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={32} /></Box>
                ) : !data ? (
                    <Typography sx={{ textAlign: "center", py: 8, color: "#94a3b8", fontSize: 13 }}>No data found</Typography>
                ) : (
                    <>
                        {/* Details — a plain grid, no cards nested in cards */}
                        <Box sx={{
                            p: 2, mb: 2, bgcolor: "white",
                            border: "1px solid #e2e8f0", borderRadius: 2,
                        }}>
                            <Box sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
                                gap: 2,
                            }}>
                                <Field label="Quotation No.">
                                    <Box component="span" sx={{ fontFamily: "monospace" }}>{data.quotation_number}</Box>
                                </Field>
                                <Field label="Requisition">
                                    <Box component="span" sx={{ fontFamily: "monospace" }}>{data.requisition_number}</Box>
                                </Field>
                                <Field label="Quoted On">{data.quotation_date}</Field>
                                <Field label="Valid Until">{data.validity_date}</Field>

                                <Field label="Vendor">
                                    {data.vendor_name}
                                    {data.vendor_code && (
                                        <Typography component="span" sx={{ ml: 0.75, fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>
                                            {data.vendor_code}
                                        </Typography>
                                    )}
                                </Field>
                                <Field label="Vendor Ref No.">{data.reference_number}</Field>
                                <Field label="GST">
                                    {vendorGst && <Box component="span" sx={{ fontFamily: "monospace", fontSize: 12 }}>{vendorGst}</Box>}
                                </Field>
                                <Field label="PAN">
                                    {vendorPan && <Box component="span" sx={{ fontFamily: "monospace", fontSize: 12 }}>{vendorPan}</Box>}
                                </Field>
                            </Box>

                            {(bankName || bankAcct || bankIfsc) && (
                                <>
                                    <Divider sx={{ my: 1.75 }} />
                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
                                        <Field label="Bank">{bankName}</Field>
                                        <Field label="Account No.">
                                            {bankAcct && <Box component="span" sx={{ fontFamily: "monospace", fontSize: 12 }}>{bankAcct}</Box>}
                                        </Field>
                                        <Field label="IFSC">
                                            {bankIfsc && <Box component="span" sx={{ fontFamily: "monospace", fontSize: 12 }}>{bankIfsc}</Box>}
                                        </Field>
                                    </Box>
                                </>
                            )}

                            {(data.payment_terms || data.delivery_terms || data.remarks) && (
                                <>
                                    <Divider sx={{ my: 1.75 }} />
                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
                                        <Field label="Payment Terms">{data.payment_terms}</Field>
                                        <Field label="Delivery Terms">{data.delivery_terms}</Field>
                                        <Field label="Remarks">{data.remarks}</Field>
                                    </Box>
                                </>
                            )}
                        </Box>

                        {/* Items */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Item Rates ({items.length})
                            </Typography>
                            {unpriced > 0 && (
                                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#b45309" }}>
                                    {unpriced} item{unpriced > 1 ? "s" : ""} without a rate
                                </Typography>
                            )}
                        </Box>

                        <TableContainer sx={{ bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ ...TH, width: 40 }}>#</TableCell>
                                        <TableCell sx={TH}>Product</TableCell>
                                        <TableCell sx={TH} align="right">Qty</TableCell>
                                        <TableCell sx={TH} align="right">Rate ({currency}) *</TableCell>
                                        <TableCell sx={TH} align="right">Amount ({currency})</TableCell>
                                        <TableCell sx={TH}>Remarks</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((item, idx) => {
                                        const amount = rowAmount(item);
                                        const missing = !(Number(item.quoted_rate) > 0);
                                        return (
                                            <TableRow key={item.id} hover>
                                                <TableCell sx={{ ...TD, color: "#94a3b8", fontWeight: 800 }}>{idx + 1}</TableCell>
                                                <TableCell sx={TD}>
                                                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                                        {item.product_name}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>
                                                        {item.product_code}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ ...TD, fontWeight: 700 }} align="right">
                                                    {Number(item.quantity).toFixed(2)}
                                                    <Typography component="span" sx={{ ml: 0.5, fontSize: 10, color: "#94a3b8" }}>
                                                        {item.unit}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ ...TD, width: 130 }} align="right">
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={item.quoted_rate}
                                                        onChange={(e) => updateItem(idx, "quoted_rate", e.target.value)}
                                                        inputProps={{ min: "0", step: "0.01", style: { textAlign: "right" } }}
                                                        error={missing}
                                                        sx={{ ...INPUT, width: 110 }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ ...TD, fontWeight: 800 }} align="right">{money(amount)}</TableCell>
                                                <TableCell sx={{ ...TD, minWidth: 160 }}>
                                                    <TextField
                                                        size="small"
                                                        placeholder="—"
                                                        value={item.remarks}
                                                        onChange={(e) => updateItem(idx, "remarks", e.target.value)}
                                                        sx={{ ...INPUT, width: "100%", "& .MuiOutlinedInput-root": { ...INPUT["& .MuiOutlinedInput-root"], fontWeight: 400 } }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </DialogContent>

            {/* ── FOOTER: total sits with the buttons, always visible ────── */}
            <DialogActions sx={{
                px: 2.5, py: 1.75, bgcolor: "white", borderTop: "1px solid #e2e8f0",
                gap: 1.5, justifyContent: "space-between", flexShrink: 0,
            }}>
                <Box>
                    <Typography sx={LABEL}>Total</Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
                        {money(totalAmount)}
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button onClick={onClose} disabled={submitting}
                        sx={{ textTransform: "uppercase", fontWeight: 900, fontSize: 12, color: "#64748b" }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={submitting || !data}
                        startIcon={submitting ? <CircularProgress size={15} color="inherit" /> : undefined}
                        sx={{
                            bgcolor: "#0ea5e9", textTransform: "uppercase", fontWeight: 900,
                            fontSize: 12, borderRadius: 1.5, px: 3, "&:hover": { bgcolor: "#0284c7" },
                        }}
                    >
                        {submitting ? "Updating…" : "Update Quotation"}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default VendorQuotationEditModal;
