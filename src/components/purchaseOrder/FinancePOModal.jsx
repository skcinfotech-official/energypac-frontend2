import { useCallback, useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button,
    IconButton, Chip, Divider, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import {
    Close as CloseIcon,
    Print as PrintIcon,
    History as HistoryIcon,
    Payments as PaymentsIcon,
    ShoppingCart as PoIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { pdf } from "@react-pdf/renderer";
import PurchaseOrderPDF from "./PurchaseOrderPDF";
import { toast } from "react-hot-toast";
import { getPurchaseOrder } from "../../services/purchaseOrderService";

const LABEL = {
    fontSize: 10, fontWeight: 900, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.05em",
};
const VALUE = { fontSize: 13, fontWeight: 700, color: "#0f172a", mt: 0.25, wordBreak: "break-word" };
const TH = {
    fontSize: 10, fontWeight: 900, color: "#475569", textTransform: "uppercase",
    letterSpacing: "0.05em", bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0",
    py: 1, whiteSpace: "nowrap",
};
const TD = { fontSize: 13, py: 1, borderBottom: "1px solid #f1f5f9" };

/** How many terms are shown before "Read more". */
const TERMS_PREVIEW = 2;

const STATUS_STYLE = {
    PENDING: { bgcolor: "#fffbeb", color: "#b45309" },
    PARTIALLY_RECEIVED: { bgcolor: "#eff6ff", color: "#1d4ed8" },
    COMPLETED: { bgcolor: "#ecfdf5", color: "#047857" },
    CANCELLED: { bgcolor: "#fef2f2", color: "#b91c1c" },
};

/** Label/value pair — the whole header is a grid of these, no nested cards. */
function Field({ label, children, mono }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography sx={LABEL}>{label}</Typography>
            <Box sx={{ ...VALUE, ...(mono ? { fontFamily: "monospace" } : {}) }}>
                {children || <Box component="span" sx={{ color: "#cbd5e1", fontFamily: "inherit" }}>—</Box>}
            </Box>
        </Box>
    );
}

/** One line of the money breakdown. */
function Line({ label, value, strong, color, small }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", py: 0.4 }}>
            <Typography sx={{ fontSize: small ? 11 : 12.5, color: color || "#64748b", fontWeight: strong ? 800 : 500 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: small ? 11 : 13, fontFamily: "monospace", fontWeight: strong ? 900 : 700, color: color || "#0f172a" }}>
                {value}
            </Typography>
        </Box>
    );
}

/** Terms are stored either as "Key: value" strings or as {key, value} objects. */
function readTerm(term, index) {
    let label = `Term ${index + 1}`;
    let value = "";
    if (typeof term === "string") {
        const colon = term.indexOf(":");
        if (colon !== -1) {
            label = term.slice(0, colon).trim();
            value = term.slice(colon + 1).trim();
        } else {
            value = term;
        }
    } else if (term && typeof term === "object") {
        label = term.type || term.key || term.label || label;
        value = term.value ?? "";
        if (!term.type && !term.key && !term.label) {
            const keys = Object.keys(term);
            if (keys.length) {
                label = keys[0];
                value = term[keys[0]];
            }
        }
    }
    return { label, value };
}

const FinancePOModal = ({ open, onClose, data, onViewItems, onRecordPayment, onShowHistory }) => {
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [fullPOData, setFullPOData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showAllTerms, setShowAllTerms] = useState(false);

    const load = useCallback(async (id, fallback) => {
        setLoading(true);
        try {
            setFullPOData(await getPurchaseOrder(id));
        } catch (error) {
            console.error("Failed to fetch full PO details", error);
            setFullPOData(fallback);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open && data?.id) {
            setShowAllTerms(false);
            load(data.id, data);
        }
    }, [open, data, load]);

    const po = fullPOData || data;

    const money = useCallback((amount, curr) => {
        const c = (curr || po?.currency || "INR").toString().trim().toUpperCase();
        try {
            return Number(amount || 0)
                .toLocaleString("en-IN", { style: "currency", currency: c, maximumFractionDigits: 2 })
                .replace("US$", "$");
        } catch {
            return `${c} ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }, [po?.currency]);

    const handlePrint = async () => {
        if (!po) return;
        setGeneratingPdf(true);
        try {
            const blob = await pdf(<PurchaseOrderPDF details={po} />).toBlob();
            window.open(URL.createObjectURL(blob), "_blank");
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setGeneratingPdf(false);
        }
    };

    // Hooks run on every render — the early exit lives after them.
    if (!open || !data || !po) return null;

    const vendor = po.vendor_details || {};
    const items = po.items || [];
    const terms = po.terms_and_conditions || [];
    const balance = Number(po.balance || 0);
    const isForeign = po.currency && po.currency !== "INR";
    const paymentCount = Number(po.payment_count ?? data.payment_count ?? 0);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, height: "90vh", display: "flex", flexDirection: "column" } }}
        >
            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <DialogTitle sx={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                bgcolor: "#1a1a2e", color: "white", py: 1.75, px: 2.5, flexShrink: 0, gap: 1,
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                    <PoIcon sx={{ color: "#0ea5e9", fontSize: 22 }} />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 16, textTransform: "uppercase" }}>
                            Purchase Order
                        </Typography>
                        <Typography sx={{ color: "#cbd5e1", fontSize: 10, fontFamily: "monospace" }}>
                            {po.po_number} · {po.vendor_name}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                        label={po.status}
                        size="small"
                        sx={{ fontWeight: 900, fontSize: 10, height: 22, ...(STATUS_STYLE[po.status] || { bgcolor: "#f1f5f9", color: "#475569" }) }}
                    />
                    <Button
                        size="small"
                        startIcon={<PrintIcon sx={{ fontSize: 15 }} />}
                        onClick={handlePrint}
                        disabled={generatingPdf}
                        sx={{ color: "#cbd5e1", fontWeight: 800, fontSize: 11, textTransform: "uppercase", "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "white" } }}
                    >
                        {generatingPdf ? "PDF…" : "Print"}
                    </Button>
                    <IconButton onClick={onClose} size="small" sx={{ color: "#cbd5e1", "&:hover": { color: "white" } }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            {/* ── BODY ───────────────────────────────────────────────────── */}
            <DialogContent sx={{ p: 2, bgcolor: "#f8fafc", flex: 1, overflowY: "auto" }}>
                {loading && !fullPOData ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={32} /></Box>
                ) : (
                    <>
                        {/* Money at a glance */}
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5, mb: 2 }}>
                            {[
                                { l: "Total Payable", v: money(po.total_amount), c: "#0f172a", bg: "white", bd: "#e2e8f0",
                                  sub: isForeign && po.conversion_rate ? `1 ${po.currency} = ₹${parseFloat(po.conversion_rate)}` : null },
                                { l: "Amount Paid", v: money(po.amount_paid), c: "#047857", bg: "#ecfdf5", bd: "#a7f3d0" },
                                { l: "Outstanding", v: money(po.balance), c: balance > 0 ? "#b91c1c" : "#047857",
                                  bg: balance > 0 ? "#fef2f2" : "#ecfdf5", bd: balance > 0 ? "#fecaca" : "#a7f3d0" },
                            ].map((c) => (
                                <Box key={c.l} sx={{ p: 1.5, bgcolor: c.bg, border: `1px solid ${c.bd}`, borderRadius: 2 }}>
                                    <Typography sx={LABEL}>{c.l}</Typography>
                                    <Typography sx={{ fontSize: 19, fontWeight: 900, color: c.c, lineHeight: 1.3, fontFamily: "monospace" }}>
                                        {c.v}
                                    </Typography>
                                    {c.sub && <Typography sx={{ fontSize: 10, color: "#7c3aed", fontWeight: 700 }}>{c.sub}</Typography>}
                                </Box>
                            ))}
                        </Box>

                        {/* PO + vendor — one flat grid */}
                        <Box sx={{ p: 2, mb: 2, bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
                                <Field label="PO No." mono>{po.po_number}</Field>
                                <Field label="PO Date">{po.po_date ? new Date(po.po_date).toLocaleDateString() : null}</Field>
                                <Field label="Requisition" mono>{po.requisition_number}</Field>
                                <Field label="Currency" mono>{po.currency || "INR"}</Field>

                                <Field label="Project">{po.project_name}</Field>
                                <Field label="Subject">{po.subject}</Field>
                                <Field label="Created By">{po.created_by_name}</Field>
                                <Field label="Revision">
                                    {po.revision_number}
                                    {po.is_revised && (
                                        <Typography component="span" sx={{ ml: 0.75, fontSize: 10, fontWeight: 900, color: "#b91c1c" }}>
                                            REVISED
                                        </Typography>
                                    )}
                                </Field>
                            </Box>

                            <Divider sx={{ my: 1.75 }} />

                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
                                <Field label="Vendor">{po.vendor_name}</Field>
                                <Field label="Phone">{vendor.phone || po.vendor_phone}</Field>
                                <Field label="Email">{vendor.email || po.vendor_email}</Field>
                                <Field label="GST" mono>{vendor.gst_number || vendor.gst_no || po.vendor_gst}</Field>

                                <Field label="PAN" mono>{vendor.pan_number || vendor.pan_no}</Field>
                                <Field label="Bank">{vendor.bank_name}</Field>
                                <Field label="Account No." mono>{vendor.bank_account_number}</Field>
                                <Field label="IFSC" mono>{vendor.ifsc_code}</Field>
                            </Box>

                            {(vendor.address || po.bill_to || po.ship_to) && (
                                <>
                                    <Divider sx={{ my: 1.75 }} />
                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
                                        <Field label="Vendor Address">
                                            <Box sx={{ whiteSpace: "pre-line", fontWeight: 500, fontSize: 12.5 }}>{vendor.address}</Box>
                                        </Field>
                                        <Field label="Bill To">
                                            <Box sx={{ whiteSpace: "pre-line", fontWeight: 500, fontSize: 12.5 }}>{po.bill_to}</Box>
                                        </Field>
                                        <Field label="Ship To">
                                            <Box sx={{ whiteSpace: "pre-line", fontWeight: 500, fontSize: 12.5 }}>{po.ship_to}</Box>
                                        </Field>
                                    </Box>
                                </>
                            )}

                            {po.remarks && (
                                <>
                                    <Divider sx={{ my: 1.75 }} />
                                    <Field label="Remarks">
                                        <Box sx={{ whiteSpace: "pre-line", fontWeight: 500, fontSize: 12.5 }}>{po.remarks}</Box>
                                    </Field>
                                </>
                            )}
                        </Box>

                        {po.status === "CANCELLED" && (
                            <Box sx={{ p: 1.75, mb: 2, bgcolor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2 }}>
                                <Typography sx={{ ...LABEL, color: "#b91c1c" }}>Cancelled</Typography>
                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#7f1d1d", mt: 0.25 }}>
                                    {po.cancellation_reason || "No reason specified"}
                                </Typography>
                                <Typography sx={{ fontSize: 11, color: "#b91c1c" }}>
                                    by {po.cancelled_by_name || "System"}
                                    {po.cancelled_at ? ` on ${new Date(po.cancelled_at).toLocaleDateString()}` : ""}
                                </Typography>
                            </Box>
                        )}

                        {/* Items (all of them) + money breakdown, side by side */}
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 300px" }, gap: 2, alignItems: "start" }}>
                            <Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Items ({items.length})
                                    </Typography>
                                    <Button size="small" onClick={() => onViewItems(po.id)}
                                        sx={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", color: "#1d4ed8" }}>
                                        Receipt status →
                                    </Button>
                                </Box>
                                <TableContainer sx={{ bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ ...TH, width: 36 }}>#</TableCell>
                                                <TableCell sx={TH}>Product</TableCell>
                                                <TableCell sx={TH} align="right">Qty</TableCell>
                                                <TableCell sx={TH} align="right">Rate</TableCell>
                                                <TableCell sx={TH} align="right">Amount</TableCell>
                                                <TableCell sx={TH} align="center">Received</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {items.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} sx={{ ...TD, textAlign: "center", color: "#94a3b8", py: 3 }}>
                                                        No items on this PO.
                                                    </TableCell>
                                                </TableRow>
                                            ) : items.map((it, i) => (
                                                <TableRow key={it.id || i} hover>
                                                    <TableCell sx={{ ...TD, color: "#94a3b8", fontWeight: 800 }}>{i + 1}</TableCell>
                                                    <TableCell sx={TD}>
                                                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{it.product_name}</Typography>
                                                        <Typography sx={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{it.product_code}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ ...TD, fontWeight: 700 }} align="right">
                                                        {Number(it.quantity).toFixed(2)}
                                                        <Typography component="span" sx={{ ml: 0.5, fontSize: 10, color: "#94a3b8" }}>{it.unit}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ ...TD, fontFamily: "monospace" }} align="right">{money(it.rate)}</TableCell>
                                                    <TableCell sx={{ ...TD, fontFamily: "monospace", fontWeight: 800 }} align="right">{money(it.amount)}</TableCell>
                                                    <TableCell sx={TD} align="center">
                                                        <Chip
                                                            label={it.is_received ? "YES" : "NO"}
                                                            size="small"
                                                            sx={{
                                                                fontSize: 9, fontWeight: 900, height: 19,
                                                                bgcolor: it.is_received ? "#ecfdf5" : "#f1f5f9",
                                                                color: it.is_received ? "#047857" : "#94a3b8",
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>

                            <Box sx={{ bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: 2, p: 2, position: { lg: "sticky" }, top: 0 }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
                                    Payment Breakdown
                                </Typography>

                                <Line label="Items Total" value={money(po.items_total)} />
                                {parseFloat(po.discount_amount) > 0 && (
                                    <Line small label="Less: Discount" value={`− ${money(po.discount_amount)}`} color="#b91c1c" />
                                )}
                                {parseFloat(po.cgst_amount) > 0 && <Line small label={`CGST ${po.cgst_percentage}%`} value={money(po.cgst_amount)} />}
                                {parseFloat(po.sgst_amount) > 0 && <Line small label={`SGST ${po.sgst_percentage}%`} value={money(po.sgst_amount)} />}
                                {parseFloat(po.igst_amount) > 0 && <Line small label={`IGST ${po.igst_percentage}%`} value={money(po.igst_amount)} />}

                                <Divider sx={{ my: 0.75 }} />
                                <Box sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 1.5, px: 1.5, py: 1, mb: 1 }}>
                                    <Line strong label="Net Amount" value={money(po.total_amount)} color="#1d4ed8" />
                                </Box>
                                <Line label="Paid" value={money(po.amount_paid)} color="#047857" />
                                <Box sx={{
                                    bgcolor: balance > 0 ? "#fef2f2" : "#ecfdf5",
                                    border: `1px solid ${balance > 0 ? "#fecaca" : "#a7f3d0"}`,
                                    borderRadius: 1.5, px: 1.5, py: 1, mt: 1,
                                }}>
                                    <Line strong label="Outstanding" value={money(po.balance)} color={balance > 0 ? "#b91c1c" : "#047857"} />
                                </Box>

                                {po.payment_due_date && (
                                    <Typography sx={{ fontSize: 10, color: "#94a3b8", mt: 1 }}>
                                        Due on <b>{new Date(po.payment_due_date).toLocaleDateString()}</b>
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Terms — only the first couple; the rest are behind Read more */}
                        {terms.length > 0 && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25 }}>
                                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Terms &amp; Conditions ({terms.length})
                                    </Typography>
                                    {terms.length > TERMS_PREVIEW && (
                                        <Button
                                            size="small"
                                            onClick={() => setShowAllTerms((v) => !v)}
                                            endIcon={showAllTerms ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                                            sx={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", color: "#1d4ed8" }}
                                        >
                                            {showAllTerms ? "Show less" : `Read more (${terms.length - TERMS_PREVIEW})`}
                                        </Button>
                                    )}
                                </Box>

                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.25 }}>
                                    {(showAllTerms ? terms : terms.slice(0, TERMS_PREVIEW)).map((term, i) => {
                                        const { label, value } = readTerm(term, i);
                                        return (
                                            <Box key={i} sx={{ display: "flex", gap: 1, fontSize: 12.5 }}>
                                                <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", minWidth: 96, flexShrink: 0 }}>
                                                    {label}
                                                </Typography>
                                                <Typography sx={{ fontSize: 12.5, color: "#334155", fontWeight: 500 }}>{value}</Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>

            {/* ── FOOTER ─────────────────────────────────────────────────── */}
            <DialogActions sx={{
                px: 2.5, py: 1.5, bgcolor: "white", borderTop: "1px solid #e2e8f0",
                justifyContent: "space-between", flexShrink: 0, gap: 1,
            }}>
                {/* payment_count only exists on the finance list payload, not on the
                    full PO fetch — read it from whichever has it. */}
                <Typography sx={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>
                    {paymentCount} payment{paymentCount === 1 ? "" : "s"} recorded
                </Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        size="small" startIcon={<HistoryIcon sx={{ fontSize: 15 }} />}
                        onClick={() => onShowHistory(po.id)}
                        sx={{ fontWeight: 900, fontSize: 11, textTransform: "uppercase", color: "#b45309" }}
                    >
                        History
                    </Button>
                    <Button
                        size="small" variant="contained" startIcon={<PaymentsIcon sx={{ fontSize: 15 }} />}
                        onClick={() => onRecordPayment(data)}
                        disabled={po.status === "CANCELLED"}
                        sx={{ fontWeight: 900, fontSize: 11, textTransform: "uppercase", bgcolor: "#059669", borderRadius: 1.5, "&:hover": { bgcolor: "#047857" } }}
                    >
                        Record Payment
                    </Button>
                    <Button
                        size="small" onClick={onClose}
                        sx={{ fontWeight: 900, fontSize: 11, textTransform: "uppercase", color: "#64748b" }}
                    >
                        Close
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default FinancePOModal;
