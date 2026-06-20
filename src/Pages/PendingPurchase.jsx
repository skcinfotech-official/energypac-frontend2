import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import {
    Box, Card, Typography, Chip, CircularProgress, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Accordion, AccordionSummary, AccordionDetails,
    ToggleButton, ToggleButtonGroup, Button, Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { getPendingPurchasePIs } from "../services/salesService";
import AlertToast from "../components/ui/AlertToast";

const SOURCES = [
    { value: "DIRECT", label: "Direct PIs" },
    { value: "REQUISITION", label: "Requisition PIs" },
    { value: "STOCK_SALE", label: "Stock PIs" },
];

const ITEM_STATUS = {
    NOT_ORDERED: { label: "Not Ordered", bg: "#fee2e2", c: "#b91c1c" },
    PARTIAL: { label: "Partial", bg: "#fef3c7", c: "#b45309" },
    ORDERED: { label: "Ordered", bg: "#e0e7ff", c: "#4338ca" },
    RECEIVED: { label: "Received", bg: "#d1fae5", c: "#047857" },
};
const OVERALL_STATUS = {
    NOT_STARTED: { label: "Not Started", bg: "#fee2e2", c: "#b91c1c" },
    PARTIAL: { label: "Partial", bg: "#fef3c7", c: "#b45309" },
    COMPLETE: { label: "Complete", bg: "#d1fae5", c: "#047857" },
};

const PendingPurchase = () => {
    const [searchParams] = useSearchParams();
    const [source, setSource] = useState("DIRECT");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });

    const fetchData = useCallback(async (src) => {
        setLoading(true);
        try {
            const data = await getPendingPurchasePIs(src);
            setRows(data?.results || []);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, type: "error", message: "Failed to load pending purchases" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(source); }, [source, fetchData]);

    const highlightPi = searchParams.get("pi");
    const totalPendingItems = rows.reduce((a, r) => a + (r.pending_items || 0), 0);

    return (
        <Box sx={{ width: "100%", py: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header */}
            <Card variant="outlined" sx={{ p: 3, borderRadius: 3, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <AssignmentLateIcon sx={{ color: "#d97706" }} />
                        Pending Purchase
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        PI items that don't have a purchase order yet — these still need to be bought.
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <Box sx={{ textAlign: "right" }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pending Items</Typography>
                        <Typography sx={{ fontSize: "1.4rem", fontWeight: 900, color: "#b45309", lineHeight: 1.1 }}>{totalPendingItems}</Typography>
                    </Box>
                </Box>
            </Card>

            {/* Source tabs */}
            <ToggleButtonGroup
                exclusive
                value={source}
                onChange={(_, v) => v && setSource(v)}
                sx={{
                    alignSelf: "flex-start", bgcolor: "#f1f5f9", borderRadius: 2.5, p: 0.5,
                    "& .MuiToggleButton-root": {
                        textTransform: "none", fontWeight: 800, fontSize: "0.8rem", px: 2.2, py: 0.7,
                        border: "none", borderRadius: "9px !important", color: "#64748b",
                        "&.Mui-selected": { bgcolor: "#fff", color: "#1565C0", boxShadow: "0 1px 4px rgba(0,0,0,0.12)", "&:hover": { bgcolor: "#fff" } },
                    },
                }}
            >
                {SOURCES.map((s) => <ToggleButton key={s.value} value={s.value}>{s.label}</ToggleButton>)}
            </ToggleButtonGroup>

            {loading ? (
                <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress /></Box>
            ) : rows.length === 0 ? (
                <Card variant="outlined" sx={{ p: 6, borderRadius: 3, textAlign: "center", color: "text.disabled" }}>
                    <Inventory2Icon sx={{ fontSize: 44, mb: 1, color: "#cbd5e1" }} />
                    <Typography sx={{ fontWeight: 700 }}>Nothing pending — all items for these PIs are on a purchase order.</Typography>
                </Card>
            ) : (
                rows.map((pi) => {
                    const ov = OVERALL_STATUS[pi.overall_status] || OVERALL_STATUS.PARTIAL;
                    return (
                        <Accordion key={pi.pi_id} defaultExpanded={highlightPi === pi.pi_id}
                            sx={{ borderRadius: 3, border: "1px solid #e2e8f0", "&:before": { display: "none" }, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: highlightPi === pi.pi_id ? "#fffbeb" : "#fff" }}>
                                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, width: "100%", pr: 2 }}>
                                    <Typography sx={{ fontFamily: "monospace", fontWeight: 800, color: "#1565C0" }}>{pi.pi_number}</Typography>
                                    <Chip label={ov.label} size="small" sx={{ bgcolor: ov.bg, color: ov.c, fontWeight: 800, fontSize: 10, height: 22, textTransform: "uppercase" }} />
                                    <Typography sx={{ fontSize: 13, color: "text.secondary", flex: 1, minWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {pi.applicant_importer || pi.consignee || "—"}
                                    </Typography>
                                    {pi.requisition_number && (
                                        <Tooltip title="Auto-created requisition backing this PI">
                                            <Chip size="small" label={`REQ ${pi.requisition_number}`} sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: 10, height: 22, bgcolor: "#eef2ff", color: "#4338ca" }} />
                                        </Tooltip>
                                    )}
                                    <Chip label={`${pi.pending_items} pending`} size="small" sx={{ bgcolor: "#fff7ed", color: "#c2410c", fontWeight: 800, fontSize: 10, height: 22 }} />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0, borderTop: "1px solid #f1f5f9" }}>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                                {["Item", "Required", "Ordered", "Received", "Pending", "Status"].map((h, i) => (
                                                    <TableCell key={h} align={i === 0 ? "left" : "right"} sx={{ fontWeight: 800, fontSize: 10, color: "#64748b", textTransform: "uppercase" }}>{h}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pi.items.map((it) => {
                                                const st = ITEM_STATUS[it.status] || ITEM_STATUS.NOT_ORDERED;
                                                return (
                                                    <TableRow key={it.pi_item_id} hover>
                                                        <TableCell>
                                                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{it.item_name}</Typography>
                                                            <Typography sx={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{it.item_code}</Typography>
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontSize: 12 }}>{it.required_qty} {it.unit}</TableCell>
                                                        <TableCell align="right" sx={{ fontSize: 12 }}>{it.ordered_qty}</TableCell>
                                                        <TableCell align="right" sx={{ fontSize: 12 }}>{it.received_qty}</TableCell>
                                                        <TableCell align="right" sx={{ fontSize: 12, fontWeight: 800, color: it.pending_qty > 0 ? "#dc2626" : "#059669" }}>{it.pending_qty}</TableCell>
                                                        <TableCell align="right">
                                                            <Chip label={st.label} size="small" sx={{ bgcolor: st.bg, color: st.c, fontWeight: 800, fontSize: 9, height: 20, textTransform: "uppercase" }} />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f1f5f9" }}>
                                    <Button
                                        component={RouterLink}
                                        to="/vendor-assignment"
                                        size="small"
                                        variant="contained"
                                        endIcon={<ArrowForwardIcon />}
                                        startIcon={<ShoppingCartIcon />}
                                        sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#1565C0", borderRadius: 2 }}
                                    >
                                        Start Procurement
                                    </Button>
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    );
                })
            )}

            <AlertToast open={alert.open} type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, open: false })} />
        </Box>
    );
};

export default PendingPurchase;
