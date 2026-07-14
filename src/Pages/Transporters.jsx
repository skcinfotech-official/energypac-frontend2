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
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GridOnIcon from "@mui/icons-material/GridOn";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";

import {
    getTransporters, createTransporter, updateTransporter, getTransporterLedger,
} from "../services/transportService";
import TransporterLedgerPDF from "../components/transport/TransporterLedgerPDF";
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

    // Build a safe file name stem from the transporter
    const ledgerFileStem = () => {
        const t = ledger.data?.transporter || {};
        const stem = `Ledger_${t.transporter_code || t.name || "transporter"}`;
        return stem.replace(/[^a-zA-Z0-9_-]/g, "_");
    };

    const exportLedgerPdf = async () => {
        if (!ledger.data) return;
        try {
            const blob = await pdf(<TransporterLedgerPDF ledger={ledger.data} />).toBlob();
            saveAs(blob, `${ledgerFileStem()}.pdf`);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, type: "error", message: "Failed to generate PDF" });
        }
    };

    // Styled Excel that mirrors the PDF — same colour bands, summary cards,
    // bordered table. Uses exceljs (xlsx can't apply cell colours/borders).
    const exportLedgerExcel = async () => {
        if (!ledger.data) return;
        try {
            const { default: ExcelJS } = await import("exceljs");
            const t = ledger.data.transporter || {};
            const sum = ledger.data.summary || {};
            const entries = ledger.data.entries || [];
            const n2 = (v) => Number(v || 0);
            const fdate = (d) =>
                d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet("Ledger", { views: [{ showGridLines: false }] });
            ws.columns = [
                { width: 22 }, { width: 12 }, { width: 26 }, { width: 16 },
                { width: 14 }, { width: 14 }, { width: 14 }, { width: 13 },
            ];

            const thin = { style: "thin", color: { argb: "FF000000" } };
            const allBorders = { top: thin, left: thin, bottom: thin, right: thin };
            const center = { vertical: "middle", horizontal: "center" };
            const right = { vertical: "middle", horizontal: "right" };
            const setFill = (cell, argb) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } }; };
            const mergeRow = (r) => ws.mergeCells(`A${r}:H${r}`);

            // ── Company header ──────────────────────────────────────────────
            ws.addRow(["ENERGYPAC ENGINEERING LIMITED"]);
            ws.addRow(["KB-22 'BHAKTA TOWER', 4TH FL, SECTOR-III, SALT LAKE, KOLKATA - 700 106."]);
            ws.addRow(["GSTIN: 19AABCE4975G1ZE"]);
            mergeRow(1); mergeRow(2); mergeRow(3);
            ws.getCell("A1").font = { bold: true, size: 14 };
            ws.getCell("A1").alignment = center;
            ws.getCell("A2").font = { size: 9 }; ws.getCell("A2").alignment = center;
            ws.getCell("A3").font = { size: 9 }; ws.getCell("A3").alignment = center;

            // ── Title band (dark like the PDF) ──────────────────────────────
            ws.addRow([]);
            ws.addRow(["TRANSPORTER LEDGER"]);
            mergeRow(5);
            const titleCell = ws.getCell("A5");
            titleCell.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
            titleCell.alignment = center;
            setFill(titleCell, "FF0F172A");
            ws.getRow(5).height = 24;

            // ── Transporter info ────────────────────────────────────────────
            ws.addRow([]);
            const infoRow = ws.addRow([
                "Code", t.transporter_code || "—", "Transporter", t.name || "—",
                "Contact", t.contact_person || t.phone || "—", "GSTIN", t.gst_number || "—",
            ]);
            [1, 3, 5, 7].forEach((c) => {
                const cell = infoRow.getCell(c);
                cell.font = { bold: true, size: 8, color: { argb: "FF475569" } };
                setFill(cell, "FFF1F5F9");
            });
            infoRow.eachCell((cell) => { cell.border = allBorders; });

            // ── Summary cards (colour-coded like the PDF) ───────────────────
            ws.addRow([]);
            const buy = ws.addRow(["Buy Payable Balance", n2(sum.buy_balance), "", `Billed ${n2(sum.buy_billed)}  ·  Paid ${n2(sum.buy_paid)}`]);
            const sell = ws.addRow(["Sell Recoverable Balance", n2(sum.sell_balance), "", `Billed ${n2(sum.sell_billed)}  ·  Recd ${n2(sum.sell_paid)}`]);
            const ship = ws.addRow(["Shipments", entries.length]);
            const cardRows = [
                { row: buy, fill: "FFFEF2F2", valColor: "FFB91C1C" },
                { row: sell, fill: "FFEFF6FF", valColor: "FF1D4ED8" },
                { row: ship, fill: "FFF8FAFC", valColor: "FF1E293B" },
            ];
            cardRows.forEach(({ row, fill, valColor }) => {
                for (let c = 1; c <= 8; c++) { const cell = row.getCell(c); setFill(cell, fill); cell.border = allBorders; }
                row.getCell(1).font = { bold: true, size: 9, color: { argb: "FF475569" } };
                row.getCell(2).font = { bold: true, size: 12, color: { argb: valColor } };
                row.getCell(2).numFmt = "#,##0.00";
                row.getCell(2).alignment = { horizontal: "left" };
                row.getCell(4).font = { size: 8, color: { argb: "FF64748B" } };
            });
            // Shipments count shouldn't carry a decimal money format
            ship.getCell(2).numFmt = "0";
            ship.getCell(2).font = { bold: true, size: 12, color: { argb: "FF1E293B" } };

            // ── Shipment Entries heading ────────────────────────────────────
            ws.addRow([]);
            const headingRow = ws.addRow(["Shipment Entries"]);
            mergeRow(headingRow.number);
            headingRow.getCell(1).font = { bold: true, size: 10 };

            // ── Table header ────────────────────────────────────────────────
            const head = ws.addRow(["Transport No", "Side", "Reference", "Dispatch", "Freight", "Paid", "Balance", "Status"]);
            head.eachCell((cell, c) => {
                cell.font = { bold: true, size: 9, color: { argb: "FF334155" } };
                setFill(cell, "FFF1F5F9");
                cell.border = allBorders;
                cell.alignment = [5, 6, 7].includes(c) ? right : { vertical: "middle", horizontal: "left" };
            });

            // ── Table rows ──────────────────────────────────────────────────
            if (entries.length === 0) {
                const empty = ws.addRow(["No shipments"]);
                mergeRow(empty.number);
                empty.getCell(1).alignment = center;
                empty.getCell(1).font = { italic: true, color: { argb: "FF94A3B8" } };
                empty.getCell(1).border = allBorders;
            } else {
                entries.forEach((e) => {
                    const r = ws.addRow([
                        e.transport_number, e.direction, e.reference || "—", fdate(e.dispatch_date),
                        n2(e.total_cost), n2(e.amount_paid), n2(e.balance),
                        (e.payment_status || "").replace(/_/g, " "),
                    ]);
                    r.eachCell((cell) => { cell.border = allBorders; cell.font = { size: 9 }; });
                    // Side chip colour
                    const sideCell = r.getCell(2);
                    sideCell.alignment = center;
                    if (e.direction === "BUY") { setFill(sideCell, "FFFEF2F2"); sideCell.font = { size: 9, bold: true, color: { argb: "FFB91C1C" } }; }
                    else { setFill(sideCell, "FFEFF6FF"); sideCell.font = { size: 9, bold: true, color: { argb: "FF1D4ED8" } }; }
                    r.getCell(4).alignment = center;
                    [5, 6, 7].forEach((c) => { r.getCell(c).numFmt = "#,##0.00"; r.getCell(c).alignment = right; });
                    // Balance: red if outstanding, green if cleared
                    r.getCell(7).font = { size: 9, bold: true, color: { argb: n2(e.balance) > 0 ? "FFDC2626" : "FF059669" } };
                    r.getCell(8).alignment = center;
                    r.getCell(8).font = { size: 8, bold: true };
                });
            }

            // ── Footer ──────────────────────────────────────────────────────
            ws.addRow([]);
            const footer = ws.addRow([`Generated on ${fdate(new Date())}  ·  ENERGYPAC ENGINEERING LIMITED  ·  All amounts in INR`]);
            mergeRow(footer.number);
            footer.getCell(1).font = { size: 8, italic: true, color: { argb: "FF94A3B8" } };
            footer.getCell(1).alignment = center;

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${ledgerFileStem()}.xlsx`);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, type: "error", message: "Failed to generate Excel" });
        }
    };

    return (
        <Box sx={{ width: "100%", py: 1, display: "flex", flexDirection: "column", gap: 3 }}>
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
                                <TableRow key={r.id} hover onClick={() => openLedger(r)} sx={{ cursor: "pointer" }}>
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
                                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Button onClick={exportLedgerPdf} disabled={!ledger.data} startIcon={<PictureAsPdfIcon />}
                            variant="contained" size="small" sx={{ bgcolor: "#dc2626", fontWeight: 800, textTransform: "uppercase", fontSize: 11, borderRadius: 2, "&:hover": { bgcolor: "#b91c1c" } }}>PDF</Button>
                        <Button onClick={exportLedgerExcel} disabled={!ledger.data} startIcon={<GridOnIcon />}
                            variant="contained" size="small" sx={{ bgcolor: "#059669", fontWeight: 800, textTransform: "uppercase", fontSize: 11, borderRadius: 2, "&:hover": { bgcolor: "#047857" } }}>Excel</Button>
                        <IconButton onClick={() => setLedger({ open: false, loading: false, data: null })} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
                    </Box>
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
