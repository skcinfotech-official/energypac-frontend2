import { useState, useEffect, useCallback } from "react";
import {
    Box, Card, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Tooltip, Chip, CircularProgress,
    Dialog, Button, LinearProgress, ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import { getPendingDispatch, getDispatchTracker } from "../services/transportService";
import AlertToast from "../components/ui/AlertToast";

const STATE = {
    NOT_DISPATCHED: { bg: "#fee2e2", c: "#b91c1c", label: "Not Dispatched" },
    PARTIALLY_DISPATCHED: { bg: "#fef3c7", c: "#b45309", label: "Partial" },
    FULLY_DISPATCHED: { bg: "#d1fae5", c: "#047857", label: "Fully Dispatched" },
};

const DispatchBoard = () => {
    const [side, setSide] = useState("BUY");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [tracker, setTracker] = useState({ open: false, loading: false, data: null });

    const fetchData = useCallback(async (s) => {
        setLoading(true);
        try {
            const res = await getPendingDispatch(s);
            setData(res);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, type: "error", message: "Failed to load pending dispatch board" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(side); }, [side, fetchData]);

    const openTracker = async (row) => {
        setTracker({ open: true, loading: true, data: null });
        try {
            const params = row.kind === "PO" ? { purchase_order: row.id } : { proforma_invoice: row.id };
            const res = await getDispatchTracker(params);
            setTracker({ open: true, loading: false, data: res });
        } catch (err) {
            console.error(err);
            setTracker({ open: false, loading: false, data: null });
            setAlert({ open: true, type: "error", message: "Failed to load dispatch tracker" });
        }
    };

    const pending = data?.pending || [];

    return (
        <Box sx={{ width: "100%", py: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <Card variant="outlined" sx={{ p: 3, borderRadius: 3, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Inventory2Icon sx={{ color: "#f59e0b" }} /> Pending Dispatch Board
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Orders with items still to ship — track partial shipments line by line
                    </Typography>
                </Box>
                <ToggleButtonGroup value={side} exclusive size="small" onChange={(e, v) => v && setSide(v)}>
                    <ToggleButton value="BUY" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 12, px: 3 }}>Inbound (PO)</ToggleButton>
                    <ToggleButton value="SELL" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 12, px: 3 }}>Outbound (PI)</ToggleButton>
                </ToggleButtonGroup>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                    <Table size="small" sx={{ "& .MuiTableCell-root": { fontSize: "0.78rem" } }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                {["Reference", side === "BUY" ? "Vendor" : "Client", "Ordered Qty", "Shipped Qty", "Pending Lines", "Progress", "Action"].map((h, i) => (
                                    <TableCell key={h} align={[2, 3].includes(i) ? "right" : i === 6 ? "center" : "left"}
                                        sx={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", color: "text.secondary" }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} sx={{ textAlign: "center", py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
                            ) : pending.length === 0 ? (
                                <TableRow><TableCell colSpan={7} sx={{ textAlign: "center", py: 6, fontStyle: "italic", color: "text.disabled" }}>Nothing pending — all items dispatched 🎉</TableCell></TableRow>
                            ) : pending.map((r) => {
                                const pct = r.total_ordered_qty > 0 ? Math.min(100, (r.total_shipped_qty / r.total_ordered_qty) * 100) : 0;
                                return (
                                    <TableRow key={r.id} hover>
                                        <TableCell sx={{ fontFamily: "monospace", fontWeight: 800, color: "#0ea5e9" }}>{r.reference}</TableCell>
                                        <TableCell>{r.party}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>{r.total_ordered_qty}</TableCell>
                                        <TableCell align="right" sx={{ color: "#047857", fontWeight: 700 }}>{r.total_shipped_qty}</TableCell>
                                        <TableCell><Chip label={`${r.pending_lines}/${r.total_lines}`} size="small" sx={{ fontSize: 10, height: 20, fontWeight: 800, bgcolor: "#fff7ed", color: "#c2410c" }} /></TableCell>
                                        <TableCell sx={{ minWidth: 120 }}>
                                            <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4, bgcolor: "#e2e8f0", "& .MuiLinearProgress-bar": { bgcolor: pct >= 100 ? "#059669" : "#f59e0b" } }} />
                                            <Typography sx={{ fontSize: 9, color: "#64748b", mt: 0.3 }}>{Math.round(pct)}% shipped</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="View dispatch tracker"><IconButton size="small" onClick={() => openTracker(r)} sx={{ color: "#7c3aed" }}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Tracker detail modal */}
            <Dialog open={tracker.open} onClose={() => setTracker({ open: false, loading: false, data: null })} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
                <Box sx={{ bgcolor: "#0f172a", color: "#fff", p: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}><Inventory2Icon sx={{ color: "#fbbf24" }} /> Dispatch Tracker</Typography>
                        <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, mt: 0.5, fontFamily: "monospace" }}>{tracker.data?.reference}</Typography>
                    </Box>
                    <IconButton onClick={() => setTracker({ open: false, loading: false, data: null })} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
                </Box>
                <Box sx={{ p: 3, bgcolor: "#f8fafc" }}>
                    {tracker.loading ? (
                        <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
                    ) : tracker.data ? (
                        <>
                            <Box sx={{ mb: 2 }}>
                                {(() => { const x = STATE[tracker.data.dispatch_state] || STATE.NOT_DISPATCHED; return <Chip label={x.label} sx={{ bgcolor: x.bg, color: x.c, fontWeight: 800, textTransform: "uppercase", fontSize: 11 }} />; })()}
                            </Box>
                            <TableContainer>
                                <Table size="small" sx={{ "& .MuiTableCell-root": { fontSize: "0.78rem" } }}>
                                    <TableHead>
                                        <TableRow>
                                            {["Item", "Code", "Unit", "Ordered", "Shipped", "Pending", "Status"].map((h, i) => (
                                                <TableCell key={h} align={[3, 4, 5].includes(i) ? "right" : "left"} sx={{ fontWeight: 800, fontSize: 10, textTransform: "uppercase", color: "#64748b" }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(tracker.data.items || []).map((it) => (
                                            <TableRow key={it.item_id}>
                                                <TableCell sx={{ fontWeight: 700 }}>{it.product_name}</TableCell>
                                                <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>{it.product_code}</TableCell>
                                                <TableCell>{it.unit}</TableCell>
                                                <TableCell align="right">{it.ordered_qty}</TableCell>
                                                <TableCell align="right" sx={{ color: "#047857", fontWeight: 700 }}>{it.shipped_qty}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: it.pending_qty > 0 ? "#dc2626" : "#059669" }}>{it.pending_qty}</TableCell>
                                                <TableCell>
                                                    <Chip label={it.fully_shipped ? "Done" : "Pending"} size="small"
                                                        sx={{ fontSize: 9, height: 18, fontWeight: 800, bgcolor: it.fully_shipped ? "#ecfdf5" : "#fff7ed", color: it.fully_shipped ? "#047857" : "#c2410c" }} />
                                                </TableCell>
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

export default DispatchBoard;
