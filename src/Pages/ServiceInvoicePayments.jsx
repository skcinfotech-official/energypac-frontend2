import { useState, useEffect, useCallback } from "react";
import {
    Box, Card, Typography, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Tooltip, Chip, CircularProgress, InputAdornment,
    Menu, MenuItem, ListItemIcon, ListItemText, Dialog, Button, Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PaymentIcon from "@mui/icons-material/Payment";
import HistoryIcon from "@mui/icons-material/History";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";

import {
    getTaxInvoices, getServiceInvoiceSummary,
    recordServiceInvoicePayment, getServiceInvoicePaymentHistory,
} from "../services/domesticService";
import TaxInvoiceDocPDF from "../components/domestic/TaxInvoiceDocPDF";
import PasswordConfirmModal from "../components/ui/PasswordConfirmModal";
import AlertToast from "../components/ui/AlertToast";

const f2 = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS = {
    GENERATED: { bg: "#dbeafe", c: "#1d4ed8" },
    PARTIALLY_PAID: { bg: "#fef3c7", c: "#b45309" },
    PAID: { bg: "#d1fae5", c: "#047857" },
    CANCELLED: { bg: "#fee2e2", c: "#b91c1c" },
    DRAFT: { bg: "#f1f5f9", c: "#475569" },
};
const statusChip = (st) => {
    const x = STATUS[st] || STATUS.DRAFT;
    return <Chip label={(st || "").replace("_", " ")} size="small" sx={{ bgcolor: x.bg, color: x.c, fontWeight: 800, fontSize: 10, height: 22, textTransform: "uppercase" }} />;
};

const ServiceInvoicePayments = () => {
    const [search, setSearch] = useState("");
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });

    const [actionMenu, setActionMenu] = useState({ anchorEl: null, ti: null });
    const openActionMenu = (e, ti) => { e.stopPropagation(); setActionMenu({ anchorEl: e.currentTarget, ti }); };
    const closeActionMenu = () => setActionMenu({ anchorEl: null, ti: null });
    const runAction = (fn) => () => { const ti = actionMenu.ti; closeActionMenu(); fn(ti); };

    const [payModal, setPayModal] = useState({ open: false, ti: null, amount: "", payment_date: "", payment_mode: "NEFT", reference_number: "", remarks: "" });
    const [pwModal, setPwModal] = useState({ open: false, onConfirm: null, loading: false });
    const [history, setHistory] = useState({ open: false, loading: false, data: null });

    const fetchData = useCallback(async (q = "") => {
        setLoading(true);
        try {
            const [list, sum] = await Promise.all([
                getTaxInvoices({ search: q, kind: "SERVICE" }),
                getServiceInvoiceSummary(q),
            ]);
            setRows(list?.results || list || []);
            setSummary(sum);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, type: "error", message: "Failed to load service invoices" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { const t = setTimeout(() => fetchData(search), 350); return () => clearTimeout(t); }, [search, fetchData]);

    const handlePdf = async (ti) => {
        try {
            const blob = await pdf(<TaxInvoiceDocPDF ti={ti} />).toBlob();
            saveAs(blob, `${ti.ti_number.replace(/\//g, "_")}.pdf`);
        } catch (err) { console.error(err); toast.error("Failed to generate PDF"); }
    };

    const openPay = (ti) => {
        const bal = Number(ti.balance) > 0 ? Number(ti.balance).toFixed(2) : "0.00";
        setPayModal({ open: true, ti, amount: bal, payment_date: new Date().toISOString().split("T")[0], payment_mode: "NEFT", reference_number: "", remarks: "" });
    };

    const submitPayment = (e) => {
        e.preventDefault();
        setPwModal({
            open: true, loading: false,
            onConfirm: async (password) => {
                setPwModal((p) => ({ ...p, loading: true }));
                try {
                    const res = await recordServiceInvoicePayment(payModal.ti.id, {
                        confirm_password: password,
                        amount: Number(parseFloat(payModal.amount).toFixed(2)),
                        payment_date: payModal.payment_date,
                        payment_mode: payModal.payment_mode,
                        reference_number: payModal.reference_number,
                        remarks: payModal.remarks,
                    });
                    setAlert({ open: true, type: "success", message: res.message || "Payment recorded" });
                    setPayModal({ open: false, ti: null, amount: "", payment_date: "", payment_mode: "NEFT", reference_number: "", remarks: "" });
                    setPwModal({ open: false });
                    fetchData(search);
                } catch (err) {
                    const msg = err.response?.data?.error || err.response?.data?.detail || "Failed to record payment";
                    setAlert({ open: true, type: "error", message: msg });
                    setPwModal((p) => ({ ...p, loading: false }));
                }
            },
        });
    };

    const openHistory = async (ti) => {
        setHistory({ open: true, loading: true, data: null });
        try {
            const data = await getServiceInvoicePaymentHistory(ti.id);
            setHistory({ open: true, loading: false, data });
        } catch (err) { console.error(err); setHistory({ open: false, loading: false, data: null }); setAlert({ open: true, type: "error", message: "Failed to load history" }); }
    };

    const cards = [
        { label: "Invoices", value: summary ? summary.count : "—", color: "#1e293b", bg: "#f8fafc", bd: "#e2e8f0" },
        { label: "Total Billed", value: summary ? f2(summary.total_billed) : "—", color: "#1d4ed8", bg: "#eff6ff", bd: "#bfdbfe" },
        { label: "Received", value: summary ? f2(summary.total_received) : "—", color: "#047857", bg: "#ecfdf5", bd: "#a7f3d0" },
        { label: "Outstanding", value: summary ? f2(summary.total_outstanding) : "—", color: "#c2410c", bg: "#fff7ed", bd: "#fed7aa" },
    ];

    return (
        <Box sx={{ width: "100%", py: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header */}
            <Card variant="outlined" sx={{ p: 3, borderRadius: 3, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <ReceiptLongIcon sx={{ color: "#7c3aed" }} />
                        Service Invoice Payments
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Record and track collections against standalone Service Tax Invoices (GST, INR)
                    </Typography>
                </Box>
                <TextField size="small" placeholder="Search TI / Invoice / Party..." value={search} onChange={(e) => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ minWidth: 280 }} />
            </Card>

            {/* Summary cards */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
                {cards.map((c) => (
                    <Box key={c.label} sx={{ p: 2, borderRadius: 3, bgcolor: c.bg, border: "1px solid", borderColor: c.bd }}>
                        <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>{c.label}</Typography>
                        <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, color: c.color, lineHeight: 1.2 }}>{c.value}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Table */}
            <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                    <Table size="small" sx={{ "& .MuiTableCell-root": { fontSize: "0.74rem" } }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                {["TI Number", "Invoice No", "Bill To", "After Tax", "Paid", "Balance", "Status", "Actions"].map((h, i) => (
                                    <TableCell key={h} align={[3, 4, 5].includes(i) ? "right" : i === 7 ? "center" : "left"}
                                        sx={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", color: "text.secondary" }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={8} sx={{ textAlign: "center", py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
                            ) : rows.length === 0 ? (
                                <TableRow><TableCell colSpan={8} sx={{ textAlign: "center", py: 6, fontStyle: "italic", color: "text.disabled" }}>No service invoices found</TableCell></TableRow>
                            ) : rows.map((ti) => (
                                <TableRow key={ti.id} hover>
                                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 800, color: "#7c3aed" }}>{ti.ti_number}</TableCell>
                                    <TableCell>{ti.invoice_no || "—"}</TableCell>
                                    <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ti.bill_to_name || "—"}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{f2(ti.total_amount_after_tax)}</TableCell>
                                    <TableCell align="right" sx={{ color: "#047857", fontWeight: 700 }}>{f2(ti.amount_paid)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: Number(ti.balance) > 0 ? "#dc2626" : "#059669" }}>{f2(ti.balance)}</TableCell>
                                    <TableCell>{statusChip(ti.status)}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Actions"><IconButton size="small" onClick={(e) => openActionMenu(e, ti)}><MoreVertIcon fontSize="small" /></IconButton></Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Action menu */}
            <Menu
                anchorEl={actionMenu.anchorEl}
                open={Boolean(actionMenu.anchorEl)}
                onClose={closeActionMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" } }}
            >
                <MenuItem
                    disabled={actionMenu.ti?.status === "PAID" || actionMenu.ti?.status === "CANCELLED"}
                    onClick={runAction((ti) => openPay(ti))}
                >
                    <ListItemIcon><PaymentIcon fontSize="small" sx={{ color: "#059669" }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Record Payment</ListItemText>
                </MenuItem>
                <MenuItem onClick={runAction((ti) => openHistory(ti))}>
                    <ListItemIcon><HistoryIcon fontSize="small" sx={{ color: "#d97706" }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Collection History</ListItemText>
                </MenuItem>
                <MenuItem onClick={runAction((ti) => handlePdf(ti))}>
                    <ListItemIcon><PictureAsPdfIcon fontSize="small" sx={{ color: "#b91c1c" }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Download PDF</ListItemText>
                </MenuItem>
            </Menu>

            {/* Record payment modal */}
            <Dialog open={payModal.open} onClose={() => setPayModal((p) => ({ ...p, open: false }))} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
                <Box sx={{ bgcolor: "#0f172a", color: "#fff", p: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}><PaymentIcon sx={{ color: "#34d399" }} /> Record Collection</Typography>
                        <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, mt: 0.5, fontFamily: "monospace" }}>{payModal.ti?.ti_number}</Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                        <Typography sx={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Balance Due</Typography>
                        <Typography sx={{ fontSize: "1.4rem", fontWeight: 900, color: "#f87171" }}>{f2(payModal.ti?.balance)}</Typography>
                    </Box>
                </Box>
                <Box component="form" onSubmit={submitPayment} sx={{ p: 4, bgcolor: "#f8fafc", display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <Box>
                        <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 1 }}>Collected Amount (INR) *</Typography>
                        <TextField fullWidth type="number" required inputProps={{ step: "0.01", min: "0" }} value={payModal.amount}
                            onChange={(e) => setPayModal((p) => ({ ...p, amount: e.target.value }))}
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, sx: { borderRadius: 2, bgcolor: "#fff", fontWeight: 800, fontSize: "1.1rem" } }} />
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 1 }}>Date *</Typography>
                            <TextField fullWidth type="date" required value={payModal.payment_date}
                                onChange={(e) => setPayModal((p) => ({ ...p, payment_date: e.target.value }))}
                                InputProps={{ sx: { borderRadius: 2, bgcolor: "#fff", fontWeight: 700 } }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 1 }}>Reference</Typography>
                            <TextField fullWidth value={payModal.reference_number}
                                onChange={(e) => setPayModal((p) => ({ ...p, reference_number: e.target.value }))}
                                placeholder="UTR / Cheque no" InputProps={{ sx: { borderRadius: 2, bgcolor: "#fff" } }} />
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, pt: 1, borderTop: "1px solid #e2e8f0" }}>
                        <Button onClick={() => setPayModal((p) => ({ ...p, open: false }))} sx={{ flex: 1, fontWeight: 800, textTransform: "uppercase", fontSize: 12, color: "#64748b" }}>Cancel</Button>
                        <Button type="submit" variant="contained" sx={{ flex: 2, py: 1.4, bgcolor: "#059669", fontWeight: 800, textTransform: "uppercase", fontSize: 12, borderRadius: 2, "&:hover": { bgcolor: "#047857" } }}>Confirm Collection</Button>
                    </Box>
                </Box>
            </Dialog>

            {/* History modal */}
            <Dialog open={history.open} onClose={() => setHistory({ open: false, loading: false, data: null })} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
                <Box sx={{ bgcolor: "#0f172a", color: "#fff", p: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}><HistoryIcon sx={{ color: "#fbbf24" }} /> Collection History</Typography>
                        <Typography sx={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, mt: 0.5, fontFamily: "monospace" }}>{history.data?.ti_number}</Typography>
                    </Box>
                    <IconButton onClick={() => setHistory({ open: false, loading: false, data: null })} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
                </Box>
                <Box sx={{ p: 3, bgcolor: "#f8fafc" }}>
                    {history.loading ? (
                        <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
                    ) : history.data ? (
                        <>
                            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 2 }}>
                                <Typography sx={{ fontSize: 13 }}>Billed: <b>{f2(history.data.total_amount_after_tax)}</b></Typography>
                                <Typography sx={{ fontSize: 13, color: "#047857" }}>Received: <b>{f2(history.data.total_paid)}</b></Typography>
                                <Typography sx={{ fontSize: 13, color: "#c2410c" }}>Balance: <b>{f2(history.data.balance)}</b></Typography>
                            </Box>
                            <Divider sx={{ mb: 1 }} />
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            {["#", "Date", "Mode", "Reference", "Amount", "Balance After", "By"].map((h, i) => (
                                                <TableCell key={h} align={[4, 5].includes(i) ? "right" : "left"} sx={{ fontWeight: 800, fontSize: 10, textTransform: "uppercase", color: "#64748b" }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(history.data.payments || []).length === 0 ? (
                                            <TableRow><TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "text.disabled", fontStyle: "italic" }}>No payments yet</TableCell></TableRow>
                                        ) : history.data.payments.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell>{p.payment_number}</TableCell>
                                                <TableCell>{p.payment_date}</TableCell>
                                                <TableCell><Chip label={p.payment_mode_display} size="small" sx={{ fontSize: 9, height: 18, fontWeight: 700 }} /></TableCell>
                                                <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{p.reference_number || "—"}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800 }}>{f2(p.amount)}</TableCell>
                                                <TableCell align="right" sx={{ color: "#94a3b8" }}>{f2(p.balance_after)}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{p.recorded_by_name}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    ) : null}
                </Box>
            </Dialog>

            <PasswordConfirmModal
                open={pwModal.open}
                title="Confirm Payment"
                message="Enter your password to record this collection."
                loading={pwModal.loading}
                onConfirm={pwModal.onConfirm}
                onCancel={() => setPwModal({ open: false })}
            />
            <AlertToast open={alert.open} type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, open: false })} />
        </Box>
    );
};

export default ServiceInvoicePayments;
