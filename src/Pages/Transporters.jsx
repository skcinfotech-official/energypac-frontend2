import { useState, useEffect, useCallback } from "react";
import {
    Box, Card, Typography, TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Tooltip, Chip, CircularProgress, InputAdornment,
    Dialog, Button, Divider, Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import Groups2Icon from "@mui/icons-material/Groups2";

import {
    getTransporters, createTransporter, updateTransporter, getTransporterLedger,
} from "../services/transportService";
import AlertToast from "../components/ui/AlertToast";

const f2 = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const EMPTY = { name: "", contact_person: "", phone: "", email: "", address: "", gst_number: "", pan_number: "", is_active: true };

const Transporters = () => {
    const [search, setSearch] = useState("");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });

    const [form, setForm] = useState({ open: false, mode: "create", id: null, data: EMPTY, submitting: false });
    const [ledger, setLedger] = useState({ open: false, loading: false, data: null });

    const fetchData = useCallback(async (q) => {
        setLoading(true);
        try {
            const res = await getTransporters({ search: q });
            setRows(res?.results || res || []);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, type: "error", message: "Failed to load transporters" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { const t = setTimeout(() => fetchData(search), 350); return () => clearTimeout(t); }, [search, fetchData]);

    const openCreate = () => setForm({ open: true, mode: "create", id: null, data: EMPTY, submitting: false });
    const openEdit = (r) => setForm({ open: true, mode: "edit", id: r.id, data: { ...EMPTY, ...r }, submitting: false });

    const submitForm = async (e) => {
        e.preventDefault();
        if (!form.data.name?.trim()) { setAlert({ open: true, type: "error", message: "Name is required" }); return; }
        setForm((f) => ({ ...f, submitting: true }));
        try {
            if (form.mode === "create") await createTransporter(form.data);
            else await updateTransporter(form.id, form.data);
            setAlert({ open: true, type: "success", message: `Transporter ${form.mode === "create" ? "added" : "updated"}` });
            setForm((f) => ({ ...f, open: false, submitting: false }));
            fetchData(search);
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.detail || "Save failed";
            setAlert({ open: true, type: "error", message: msg });
            setForm((f) => ({ ...f, submitting: false }));
        }
    };

    const openLedger = async (r) => {
        setLedger({ open: true, loading: true, data: null });
        try {
            const data = await getTransporterLedger(r.id);
            setLedger({ open: true, loading: false, data });
        } catch (err) {
            console.error(err);
            setLedger({ open: false, loading: false, data: null });
            setAlert({ open: true, type: "error", message: "Failed to load ledger" });
        }
    };

    const setField = (k, v) => setForm((f) => ({ ...f, data: { ...f.data, [k]: v } }));

    return (
        <Box sx={{ maxWidth: 1100, mx: "auto", py: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <Card variant="outlined" sx={{ p: 3, borderRadius: 3, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Groups2Icon sx={{ color: "#0ea5e9" }} /> Transporters
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Master list of transporters / carriers with a per-transporter ledger
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <TextField size="small" placeholder="Search name / code / GST..." value={search} onChange={(e) => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ minWidth: 250 }} />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ fontWeight: 800, textTransform: "uppercase", borderRadius: 2 }}>Add</Button>
                </Box>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                    <Table size="small" sx={{ "& .MuiTableCell-root": { fontSize: "0.78rem" } }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                {["Code", "Name", "Contact", "Phone", "GST", "Shipments", "Status", "Actions"].map((h, i) => (
                                    <TableCell key={h} align={i === 5 ? "center" : i === 7 ? "center" : "left"}
                                        sx={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", color: "text.secondary" }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={8} sx={{ textAlign: "center", py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
                            ) : rows.length === 0 ? (
                                <TableRow><TableCell colSpan={8} sx={{ textAlign: "center", py: 6, fontStyle: "italic", color: "text.disabled" }}>No transporters yet</TableCell></TableRow>
                            ) : rows.map((r) => (
                                <TableRow key={r.id} hover>
                                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 800, color: "#0ea5e9" }}>{r.transporter_code}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{r.name}</TableCell>
                                    <TableCell>{r.contact_person || "—"}</TableCell>
                                    <TableCell>{r.phone || "—"}</TableCell>
                                    <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>{r.gst_number || "—"}</TableCell>
                                    <TableCell align="center">{r.entry_count}</TableCell>
                                    <TableCell>
                                        <Chip label={r.is_active ? "Active" : "Inactive"} size="small"
                                            sx={{ fontSize: 9, height: 20, fontWeight: 800, bgcolor: r.is_active ? "#ecfdf5" : "#f1f5f9", color: r.is_active ? "#047857" : "#64748b" }} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Ledger"><IconButton size="small" onClick={() => openLedger(r)} sx={{ color: "#7c3aed" }}><ReceiptLongIcon fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(r)} sx={{ color: "#0ea5e9" }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Create / Edit form */}
            <Dialog open={form.open} onClose={() => setForm((f) => ({ ...f, open: false }))} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
                <Box sx={{ bgcolor: "#0f172a", color: "#fff", p: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}>
                        <LocalShippingIcon sx={{ color: "#34d399" }} /> {form.mode === "create" ? "Add Transporter" : "Edit Transporter"}
                    </Typography>
                    <IconButton onClick={() => setForm((f) => ({ ...f, open: false }))} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
                </Box>
                <Box component="form" onSubmit={submitForm} sx={{ p: 4, bgcolor: "#f8fafc" }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}><TextField fullWidth size="small" label="Name *" value={form.data.name} onChange={(e) => setField("name", e.target.value)} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Contact Person" value={form.data.contact_person} onChange={(e) => setField("contact_person", e.target.value)} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" value={form.data.phone} onChange={(e) => setField("phone", e.target.value)} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Email" value={form.data.email} onChange={(e) => setField("email", e.target.value)} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="GST Number" value={form.data.gst_number} onChange={(e) => setField("gst_number", e.target.value)} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="PAN" value={form.data.pan_number} onChange={(e) => setField("pan_number", e.target.value)} /></Grid>
                        <Grid item xs={12}><TextField fullWidth size="small" label="Address" multiline minRows={2} value={form.data.address} onChange={(e) => setField("address", e.target.value)} /></Grid>
                    </Grid>
                    <Box sx={{ display: "flex", gap: 1.5, pt: 3 }}>
                        <Button onClick={() => setForm((f) => ({ ...f, open: false }))} sx={{ flex: 1, fontWeight: 800, textTransform: "uppercase", fontSize: 12, color: "#64748b" }}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={form.submitting} sx={{ flex: 2, py: 1.3, bgcolor: "#059669", fontWeight: 800, textTransform: "uppercase", fontSize: 12, borderRadius: 2, "&:hover": { bgcolor: "#047857" } }}>
                            {form.submitting ? "Saving..." : "Save"}
                        </Button>
                    </Box>
                </Box>
            </Dialog>

            {/* Ledger modal */}
            <Dialog open={ledger.open} onClose={() => setLedger({ open: false, loading: false, data: null })} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
                <Box sx={{ bgcolor: "#0f172a", color: "#fff", p: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}><ReceiptLongIcon sx={{ color: "#a78bfa" }} /> Transporter Ledger</Typography>
                        <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, mt: 0.5 }}>{ledger.data?.transporter?.transporter_code} · {ledger.data?.transporter?.name}</Typography>
                    </Box>
                    <IconButton onClick={() => setLedger({ open: false, loading: false, data: null })} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
                </Box>
                <Box sx={{ p: 3, bgcolor: "#f8fafc" }}>
                    {ledger.loading ? (
                        <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
                    ) : ledger.data ? (
                        <>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 2 }}>
                                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
                                    <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Buy Payable Balance</Typography>
                                    <Typography sx={{ fontSize: "1.05rem", fontWeight: 900, color: "#b91c1c" }}>{f2(ledger.data.summary.buy_balance)}</Typography>
                                    <Typography sx={{ fontSize: 11, color: "#64748b" }}>Billed {f2(ledger.data.summary.buy_billed)} · Paid {f2(ledger.data.summary.buy_paid)}</Typography>
                                </Box>
                                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                                    <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Sell Recoverable Balance</Typography>
                                    <Typography sx={{ fontSize: "1.05rem", fontWeight: 900, color: "#1d4ed8" }}>{f2(ledger.data.summary.sell_balance)}</Typography>
                                    <Typography sx={{ fontSize: 11, color: "#64748b" }}>Billed {f2(ledger.data.summary.sell_billed)} · Recd {f2(ledger.data.summary.sell_paid)}</Typography>
                                </Box>
                                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                    <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Shipments</Typography>
                                    <Typography sx={{ fontSize: "1.05rem", fontWeight: 900, color: "#1e293b" }}>{(ledger.data.entries || []).length}</Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ mb: 1 }} />
                            <TableContainer>
                                <Table size="small" sx={{ "& .MuiTableCell-root": { fontSize: "0.74rem" } }}>
                                    <TableHead>
                                        <TableRow>
                                            {["Transport No", "Side", "Reference", "Dispatch", "Freight", "Paid", "Balance", "Status"].map((h, i) => (
                                                <TableCell key={h} align={[4, 5, 6].includes(i) ? "right" : "left"} sx={{ fontWeight: 800, fontSize: 10, textTransform: "uppercase", color: "#64748b" }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(ledger.data.entries || []).length === 0 ? (
                                            <TableRow><TableCell colSpan={8} sx={{ textAlign: "center", py: 4, color: "text.disabled", fontStyle: "italic" }}>No shipments</TableCell></TableRow>
                                        ) : ledger.data.entries.map((e) => (
                                            <TableRow key={e.transport_number}>
                                                <TableCell sx={{ fontFamily: "monospace", fontWeight: 700 }}>{e.transport_number}</TableCell>
                                                <TableCell>
                                                    <Chip label={e.direction} size="small" sx={{ fontSize: 9, height: 18, fontWeight: 800, bgcolor: e.direction === "BUY" ? "#fef2f2" : "#eff6ff", color: e.direction === "BUY" ? "#b91c1c" : "#1d4ed8" }} />
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>{e.reference}</TableCell>
                                                <TableCell>{e.dispatch_date || "—"}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>{f2(e.total_cost)}</TableCell>
                                                <TableCell align="right" sx={{ color: "#047857" }}>{f2(e.amount_paid)}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: Number(e.balance) > 0 ? "#dc2626" : "#059669" }}>{f2(e.balance)}</TableCell>
                                                <TableCell sx={{ fontSize: 10, fontWeight: 700 }}>{(e.payment_status || "").replace("_", " ")}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    ) : null}
                </Box>
            </Dialog>

            <AlertToast open={alert.open} type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, open: false })} />
        </Box>
    );
};

export default Transporters;
