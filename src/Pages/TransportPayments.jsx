import { useState, useEffect, useCallback } from "react";
import {
    Box, Card, Typography, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Tooltip, Chip, CircularProgress, InputAdornment,
    Menu, MenuItem, ListItemIcon, ListItemText, Dialog, Button, Divider,
    ToggleButton, ToggleButtonGroup, Select, FormControl,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PaymentIcon from "@mui/icons-material/Payment";
import HistoryIcon from "@mui/icons-material/History";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";

import {
    getTransportPaymentsFinance, recordTransportPayment,
    getTransportPaymentHistory, getTransportNote,
} from "../services/transportService";
import TransportNoteSheetPDF from "../components/transport/TransportNoteSheetPDF";
import PasswordConfirmModal from "../components/ui/PasswordConfirmModal";
import AlertToast from "../components/ui/AlertToast";
import { useAuth } from "../context/AuthContext";

const f2 = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAY_STATUS = {
    UNPAID: { bg: "#fee2e2", c: "#b91c1c" },
    PARTIALLY_PAID: { bg: "#fef3c7", c: "#b45309" },
    PAID: { bg: "#d1fae5", c: "#047857" },
};
const payChip = (st) => {
    const x = PAY_STATUS[st] || PAY_STATUS.UNPAID;
    return <Chip label={(st || "").replace("_", " ")} size="small" sx={{ bgcolor: x.bg, color: x.c, fontWeight: 800, fontSize: 10, height: 22, textTransform: "uppercase" }} />;
};

const PAYMENT_MODES = [
    ["NEFT", "NEFT"], ["RTGS", "RTGS"], ["IMPS", "IMPS"], ["UPI", "UPI"],
    ["CHEQUE", "Cheque"], ["CASH", "Cash"], ["TT", "Telegraphic Transfer"], ["OTHER", "Other"],
];

const TransportPayments = () => {
    const { user } = useAuth();
    // Recording a payment is a Finance-department action; transport users get read-only.
    const canRecord = user?.role === "ADMIN" ||
        !!(user?.permissions || []).find((p) => p.module === "FINANCE" && (p.can_write || p.can_read));

    const [side, setSide] = useState("BUY"); // BUY | SELL | ALL
    const [search, setSearch] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });

    const [actionMenu, setActionMenu] = useState({ anchorEl: null, row: null });
    const openActionMenu = (e, row) => { e.stopPropagation(); setActionMenu({ anchorEl: e.currentTarget, row }); };
    const closeActionMenu = () => setActionMenu({ anchorEl: null, row: null });
    const runAction = (fn) => () => { const row = actionMenu.row; closeActionMenu(); fn(row); };

    const [payModal, setPayModal] = useState({ open: false, row: null, amount: "", payment_date: "", payment_mode: "NEFT", reference_number: "", remarks: "" });
    const [pwModal, setPwModal] = useState({ open: false, onConfirm: null, loading: false });
    const [history, setHistory] = useState({ open: false, loading: false, data: null });

    const fetchData = useCallback(async (s) => {
        setLoading(true);
        try {
            const params = s === "ALL" ? {} : { side: s };
            const res = await getTransportPaymentsFinance(params);
            setData(res);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, type: "error", message: "Failed to load transport payments" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(side); }, [side, fetchData]);

    const rows = (data?.entries || []).filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [r.transport_number, r.reference, r.party, r.transporter_name].some((v) => (v || "").toLowerCase().includes(q));
    });

    const openPay = (row) => {
        const bal = Number(row.balance) > 0 ? Number(row.balance).toFixed(2) : "0.00";
        setPayModal({ open: true, row, amount: bal, payment_date: new Date().toISOString().split("T")[0], payment_mode: "NEFT", reference_number: "", remarks: "" });
    };

    const submitPayment = (e) => {
        e.preventDefault();
        setPwModal({
            open: true, loading: false,
            onConfirm: async (password) => {
                setPwModal((p) => ({ ...p, loading: true }));
                try {
                    const res = await recordTransportPayment(payModal.row.id, {
                        confirm_password: password,
                        amount: Number(parseFloat(payModal.amount).toFixed(2)),
                        payment_date: payModal.payment_date,
                        payment_mode: payModal.payment_mode,
                        reference_number: payModal.reference_number,
                        remarks: payModal.remarks,
                    });
                    setAlert({ open: true, type: "success", message: res.message || "Payment recorded" });
                    setPayModal({ open: false, row: null, amount: "", payment_date: "", payment_mode: "NEFT", reference_number: "", remarks: "" });
                    setPwModal({ open: false });
                    fetchData(side);
                } catch (err) {
                    const msg = err.response?.data?.error || err.response?.data?.detail || "Failed to record payment";
                    setAlert({ open: true, type: "error", message: msg });
                    setPwModal((p) => ({ ...p, loading: false }));
                }
            },
        });
    };

    const openHistory = async (row) => {
        setHistory({ open: true, loading: true, data: null });
        try {
            const d = await getTransportPaymentHistory(row.id);
            setHistory({ open: true, loading: false, data: { ...d, party: row.party, reference: row.reference } });
        } catch (err) {
            console.error(err);
            setHistory({ open: false, loading: false, data: null });
            setAlert({ open: true, type: "error", message: "Failed to load history" });
        }
    };

    const handleNotePdf = async (row) => {
        try {
            const note = await getTransportNote(row.id);
            const blob = await pdf(<TransportNoteSheetPDF note={note} />).toBlob();
            saveAs(blob, `${(note.transport_number || "transport").replace(/\//g, "_")}_note.pdf`);
        } catch (err) { console.error(err); toast.error("Failed to generate transport note"); }
    };

    // Summary cards depend on side
    const buy = data?.buy || {};
    const sell = data?.sell || {};
    const isSell = side === "SELL";
    const active = isSell ? sell : buy;
    const cards = side === "ALL"
        ? [
            { label: "Buy Freight (Payable)", value: data ? f2(buy.billed) : "—", color: "#b91c1c", bg: "#fef2f2", bd: "#fecaca" },
            { label: "Buy Paid", value: data ? f2(buy.paid) : "—", color: "#047857", bg: "#ecfdf5", bd: "#a7f3d0" },
            { label: "Sell Freight (Recoverable)", value: data ? f2(sell.billed) : "—", color: "#1d4ed8", bg: "#eff6ff", bd: "#bfdbfe" },
            { label: "Net Cost to Co.", value: data ? f2(data.net_cost_to_company) : "—", color: "#7c2d12", bg: "#fff7ed", bd: "#fed7aa" },
        ]
        : [
            { label: "Shipments", value: data ? active.count : "—", color: "#1e293b", bg: "#f8fafc", bd: "#e2e8f0" },
            { label: isSell ? "Recoverable" : "Total Payable", value: data ? f2(active.billed) : "—", color: "#1d4ed8", bg: "#eff6ff", bd: "#bfdbfe" },
            { label: isSell ? "Received" : "Paid", value: data ? f2(active.paid) : "—", color: "#047857", bg: "#ecfdf5", bd: "#a7f3d0" },
            { label: "Outstanding", value: data ? f2(active.balance) : "—", color: "#c2410c", bg: "#fff7ed", bd: "#fed7aa" },
        ];

    return (
        <Box sx={{ maxWidth: 1180, mx: "auto", py: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header */}
            <Card variant="outlined" sx={{ p: 3, borderRadius: 3, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <LocalShippingIcon sx={{ color: "#0ea5e9" }} />
                        Transport Payments
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Freight we pay transporters on purchases (Buy) and freight we recover from clients on sales (Sell)
                        {!canRecord && (
                            <Chip label="View only" size="small" sx={{ ml: 1, height: 18, fontSize: 9, fontWeight: 800, bgcolor: "#f1f5f9", color: "#64748b" }} />
                        )}
                    </Typography>
                </Box>
                <TextField size="small" placeholder="Search TRN / Ref / Party / Transporter..." value={search} onChange={(e) => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ minWidth: 300 }} />
            </Card>

            {/* Side toggle */}
            <ToggleButtonGroup value={side} exclusive size="small" onChange={(e, v) => v && setSide(v)} sx={{ alignSelf: "flex-start" }}>
                <ToggleButton value="BUY" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 12, px: 3 }}>Buy (PO)</ToggleButton>
                <ToggleButton value="SELL" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 12, px: 3 }}>Sell (PI)</ToggleButton>
                <ToggleButton value="ALL" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 12, px: 3 }}>All</ToggleButton>
            </ToggleButtonGroup>

            {/* Summary cards */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
                {cards.map((c) => (
                    <Box key={c.label} sx={{ p: 2, borderRadius: 3, bgcolor: c.bg, border: "1px solid", borderColor: c.bd }}>
                        <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>{c.label}</Typography>
                        <Typography sx={{ fontSize: "1.05rem", fontWeight: 900, color: c.color, lineHeight: 1.2 }}>{c.value}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Table */}
            <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                    <Table size="small" sx={{ "& .MuiTableCell-root": { fontSize: "0.74rem" } }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                {["Transport No", "Side", "Reference", "Party", "Transporter", "Freight", "Paid", "Balance", "Status", "Actions"].map((h, i) => (
                                    <TableCell key={h} align={[5, 6, 7].includes(i) ? "right" : i === 9 ? "center" : "left"}
                                        sx={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", color: "text.secondary" }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={10} sx={{ textAlign: "center", py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
                            ) : rows.length === 0 ? (
                                <TableRow><TableCell colSpan={10} sx={{ textAlign: "center", py: 6, fontStyle: "italic", color: "text.disabled" }}>No transport entries found</TableCell></TableRow>
                            ) : rows.map((r) => (
                                <TableRow key={r.id} hover>
                                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 800, color: "#0ea5e9" }}>{r.transport_number}</TableCell>
                                    <TableCell>
                                        <Chip label={r.direction === "BUY" ? "BUY" : "SELL"} size="small"
                                            sx={{ fontSize: 9, height: 18, fontWeight: 800, bgcolor: r.direction === "BUY" ? "#fef2f2" : "#eff6ff", color: r.direction === "BUY" ? "#b91c1c" : "#1d4ed8" }} />
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>{r.reference}</TableCell>
                                    <TableCell sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.party}</TableCell>
                                    <TableCell sx={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.transporter_name}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{f2(r.total_cost)}</TableCell>
                                    <TableCell align="right" sx={{ color: "#047857", fontWeight: 700 }}>{f2(r.amount_paid)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: Number(r.balance) > 0 ? "#dc2626" : "#059669" }}>{f2(r.balance)}</TableCell>
                                    <TableCell>{payChip(r.payment_status)}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Actions"><IconButton size="small" onClick={(e) => openActionMenu(e, r)}><MoreVertIcon fontSize="small" /></IconButton></Tooltip>
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
                PaperProps={{ sx: { borderRadius: 2, minWidth: 220, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" } }}
            >
                {canRecord && (
                    <MenuItem
                        disabled={actionMenu.row?.payment_status === "PAID" || actionMenu.row?.status === "CANCELLED"}
                        onClick={runAction((row) => openPay(row))}
                    >
                        <ListItemIcon><PaymentIcon fontSize="small" sx={{ color: "#059669" }} /></ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>
                            {actionMenu.row?.direction === "SELL" ? "Record Receipt" : "Record Payment"}
                        </ListItemText>
                    </MenuItem>
                )}
                <MenuItem onClick={runAction((row) => openHistory(row))}>
                    <ListItemIcon><HistoryIcon fontSize="small" sx={{ color: "#d97706" }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Payment History</ListItemText>
                </MenuItem>
                <MenuItem onClick={runAction((row) => handleNotePdf(row))}>
                    <ListItemIcon><PictureAsPdfIcon fontSize="small" sx={{ color: "#b91c1c" }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Transport Note PDF</ListItemText>
                </MenuItem>
            </Menu>

            {/* Record payment modal */}
            <Dialog open={payModal.open} onClose={() => setPayModal((p) => ({ ...p, open: false }))} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
                <Box sx={{ bgcolor: "#0f172a", color: "#fff", p: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}>
                            <PaymentIcon sx={{ color: "#34d399" }} /> {payModal.row?.direction === "SELL" ? "Record Receipt" : "Record Payment"}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, mt: 0.5, fontFamily: "monospace" }}>
                            {payModal.row?.transport_number} · {payModal.row?.transporter_name}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                        <Typography sx={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Balance Due</Typography>
                        <Typography sx={{ fontSize: "1.4rem", fontWeight: 900, color: "#f87171" }}>{f2(payModal.row?.balance)}</Typography>
                    </Box>
                </Box>
                <Box component="form" onSubmit={submitPayment} sx={{ p: 4, bgcolor: "#f8fafc", display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <Box>
                        <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 1 }}>Amount (INR) *</Typography>
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
                            <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 1 }}>Mode *</Typography>
                            <FormControl fullWidth>
                                <Select value={payModal.payment_mode} onChange={(e) => setPayModal((p) => ({ ...p, payment_mode: e.target.value }))}
                                    sx={{ borderRadius: 2, bgcolor: "#fff", fontWeight: 700 }}>
                                    {PAYMENT_MODES.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 1 }}>Reference</Typography>
                        <TextField fullWidth value={payModal.reference_number}
                            onChange={(e) => setPayModal((p) => ({ ...p, reference_number: e.target.value }))}
                            placeholder="UTR / Cheque no" InputProps={{ sx: { borderRadius: 2, bgcolor: "#fff" } }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748b", textTransform: "uppercase", mb: 1 }}>Remarks</Typography>
                        <TextField fullWidth multiline minRows={2} value={payModal.remarks}
                            onChange={(e) => setPayModal((p) => ({ ...p, remarks: e.target.value }))}
                            InputProps={{ sx: { borderRadius: 2, bgcolor: "#fff" } }} />
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, pt: 1, borderTop: "1px solid #e2e8f0" }}>
                        <Button onClick={() => setPayModal((p) => ({ ...p, open: false }))} sx={{ flex: 1, fontWeight: 800, textTransform: "uppercase", fontSize: 12, color: "#64748b" }}>Cancel</Button>
                        <Button type="submit" variant="contained" sx={{ flex: 2, py: 1.4, bgcolor: "#059669", fontWeight: 800, textTransform: "uppercase", fontSize: 12, borderRadius: 2, "&:hover": { bgcolor: "#047857" } }}>Confirm</Button>
                    </Box>
                </Box>
            </Dialog>

            {/* History modal */}
            <Dialog open={history.open} onClose={() => setHistory({ open: false, loading: false, data: null })} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
                <Box sx={{ bgcolor: "#0f172a", color: "#fff", p: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}><HistoryIcon sx={{ color: "#fbbf24" }} /> Payment History</Typography>
                        <Typography sx={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, mt: 0.5, fontFamily: "monospace" }}>{history.data?.transport_number} · {history.data?.party}</Typography>
                    </Box>
                    <IconButton onClick={() => setHistory({ open: false, loading: false, data: null })} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
                </Box>
                <Box sx={{ p: 3, bgcolor: "#f8fafc" }}>
                    {history.loading ? (
                        <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
                    ) : history.data ? (
                        <>
                            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 2 }}>
                                <Typography sx={{ fontSize: 13 }}>Freight: <b>{f2(history.data.total_cost)}</b></Typography>
                                <Typography sx={{ fontSize: 13, color: "#047857" }}>Paid: <b>{f2(history.data.amount_paid)}</b></Typography>
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
                                                <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>{p.payment_number}</TableCell>
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
                title="Confirm Transport Payment"
                message="Enter your password to record this payment."
                loading={pwModal.loading}
                onConfirm={pwModal.onConfirm}
                onCancel={() => setPwModal({ open: false })}
            />
            <AlertToast open={alert.open} type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, open: false })} />
        </Box>
    );
};

export default TransportPayments;
