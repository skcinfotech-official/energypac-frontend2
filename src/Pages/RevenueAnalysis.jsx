import React, { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Chip,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    LinearProgress,
    Skeleton,
    Tooltip,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SyncIcon from "@mui/icons-material/Sync";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloseIcon from "@mui/icons-material/Close";
import { getProfitLossList, getProfitLossItems, getRevenueAnalytics, getEnterpriseOverview } from "../services/financeService";
import RequisitionSelector from "../components/common/RequisitionSelector";
import AlertToast from "../components/ui/AlertToast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
    ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RTooltip, Legend, PieChart, Pie, Cell, BarChart,
} from "recharts";

const PRIMARY = "#1565C0";
const C_REV = "#1565C0", C_COST = "#ef5350", C_PROFIT = "#2e7d32";
const PIE_COLORS = ["#1565C0", "#7c3aed", "#0e7490", "#d97706", "#059669"];
const compactINR = (v) => {
    const n = Number(v || 0);
    if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
    if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
    if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}k`;
    return `₹${n.toFixed(0)}`;
};

export default function RevenueAnalysis() {
    const [pnlList, setPnlList] = useState([]);
    const [pnlSummary, setPnlSummary] = useState(null);
    const [pnlLoading, setPnlLoading] = useState(false);
    const [filterRequisition, setFilterRequisition] = useState("");
    const [filterFY, setFilterFY] = useState("");
    const [itemModal, setItemModal] = useState({ open: false, reqNumber: "", items: [], loading: false, transport: 0 });
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });
    const [analytics, setAnalytics] = useState(null);
    const [overview, setOverview] = useState(null);

    const generateFYOptions = () => {
        const now = new Date();
        const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        const options = [];
        for (let y = currentYear; y >= currentYear - 5; y--) {
            options.push({ value: `${y}-${y + 1}`, label: `FY ${y}-${String(y + 1).slice(2)}` });
        }
        return options;
    };

    const fetchPnlData = async () => {
        setPnlLoading(true);
        try {
            const params = {};
            if (filterRequisition) params.requisition = filterRequisition;
            if (filterFY) params.fy = filterFY;
            const data = await getProfitLossList(params);
            setPnlList(data.requisitions || []);
            setPnlSummary(data.summary || null);
        } catch {
            setToast({ open: true, type: "error", message: "Failed to fetch P&L data" });
        } finally {
            setPnlLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const params = {};
            if (filterFY) params.fy = filterFY;
            setAnalytics(await getRevenueAnalytics(params));
        } catch {
            setAnalytics(null);
        }
    };

    const fetchOverview = async () => {
        try {
            const params = {};
            if (filterFY) params.fy = filterFY;
            setOverview(await getEnterpriseOverview(params));
        } catch {
            setOverview(null);
        }
    };

    useEffect(() => { fetchPnlData(); }, [filterRequisition, filterFY]);
    useEffect(() => { fetchAnalytics(); fetchOverview(); }, [filterFY]);

    const openItemModal = async (reqId, reqNumber) => {
        setItemModal({ open: true, reqNumber, items: [], loading: true, transport: 0 });
        try {
            const data = await getProfitLossItems(reqId);
            setItemModal(prev => ({ ...prev, items: data.items || [], transport: data.total_transport_cost || 0, loading: false }));
        } catch {
            setToast({ open: true, type: "error", message: "Failed to load item breakdown" });
            setItemModal(prev => ({ ...prev, loading: false }));
        }
    };

    const closeItemModal = () => setItemModal({ open: false, reqNumber: "", items: [], loading: false, transport: 0 });

    const fmt = (v) => Number(v || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    const fmtD = (v) => Number(v || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

    const s = pnlSummary || {};
    const totalRevenue = s.total_revenue || 0;
    const totalPurchases = s.total_purchase_cost || 0;
    const totalTransport = s.total_transport_cost || 0;
    const totalProfit = s.total_profit_loss || 0;
    const overallMargin = s.overall_margin || 0;
    const profitCount = pnlList.filter(i => (i.profit_loss_inr || 0) > 0).length;
    const lossCount = pnlList.filter(i => (i.profit_loss_inr || 0) < 0).length;

    const handleExport = () => {
        const wb = XLSX.utils.book_new();
        const rows = [
            ["REVENUE & PROFITABILITY ANALYSIS"], ["Generated:", new Date().toLocaleString()], [],
            ["Requisition", "Purchase", "Transport", "Freight Recovered", "Total Cost", "Revenue", "P&L", "Margin %", "Status"]
        ];
        pnlList.forEach(i => rows.push([i.requisition_number, i.purchase_cost_inr, i.transport_cost_inr, i.transport_recovered_inr || 0, i.total_cost_inr, i.sales_revenue_inr, i.profit_loss_inr, i.margin_percentage, i.alert || "NORMAL"]));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "P&L");
        saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]), `Revenue_${new Date().toISOString().split('T')[0]}.xlsx`);
        setToast({ open: true, type: "success", message: "Exported" });
    };

    const MarginBadge = ({ margin }) => {
        const m = Number(margin);
        const color = m >= 20 ? "success" : m >= 10 ? "warning" : "error";
        return (
            <Chip
                label={`${m.toFixed(1)}%`}
                size="small"
                color={color}
                variant="outlined"
                sx={{ fontWeight: 900, fontSize: "0.7rem", height: 24 }}
            />
        );
    };

    const StatusBadge = ({ alert, revenue }) => {
        if (alert === 'LOSS') return <Chip label="Loss" size="small" color="error" sx={{ fontWeight: 900, fontSize: "0.65rem", textTransform: "uppercase", height: 24 }} />;
        if (alert === 'LOW_MARGIN') return <Chip label="Low" size="small" color="warning" sx={{ fontWeight: 900, fontSize: "0.65rem", textTransform: "uppercase", height: 24 }} />;
        if (revenue > 0) return <Chip label="Healthy" size="small" color="success" sx={{ fontWeight: 900, fontSize: "0.65rem", textTransform: "uppercase", height: 24 }} />;
        return <Chip label="Pending" size="small" sx={{ fontWeight: 900, fontSize: "0.65rem", textTransform: "uppercase", height: 24, bgcolor: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0" }} />;
    };

    const summaryCards = [
        { label: "Revenue", value: fmt(totalRevenue), icon: <ShowChartIcon fontSize="small" />, iconBg: "#e3f2fd", iconColor: "#1565c0" },
        { label: "Purchases", value: fmt(totalPurchases), icon: <ShoppingCartIcon fontSize="small" />, iconBg: "#ffebee", iconColor: "#c62828" },
        { label: "Transport", value: fmt(totalTransport), subValue: (s.total_transport_recovered || 0) > 0 ? `−${fmt(s.total_transport_recovered)} recovered` : null, icon: <LocalShippingIcon fontSize="small" />, iconBg: "#fff8e1", iconColor: "#e65100" },
        {
            label: "Net P&L",
            value: fmt(totalProfit),
            icon: totalProfit >= 0 ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />,
            iconBg: totalProfit >= 0 ? "#e8f5e9" : "#ffebee",
            iconColor: totalProfit >= 0 ? "#2e7d32" : "#c62828",
            valueColor: totalProfit >= 0 ? "#2e7d32" : "#c62828",
            cardBg: totalProfit >= 0 ? "#e8f5e9" : "#ffebee",
            cardBorder: totalProfit >= 0 ? "#c8e6c9" : "#ffcdd2",
        },
    ];

    // Modal summary calculations
    const modalTotals = itemModal.items.length > 0 ? (() => {
        const tCost = itemModal.items.reduce((a, i) => a + parseFloat(i.total_cost_inr || 0), 0);
        const tRev = itemModal.items.reduce((a, i) => a + parseFloat(i.selling_amount_inr || 0), 0);
        const tPL = tRev - tCost;
        return { tCost, tRev, tPL };
    })() : null;

    // ── Enterprise analytics derived data ──────────────────────────────────
    const SRC_LABEL = { REQUISITION: "Requisition", STOCK_SALE: "Stock", DIRECT: "Direct" };
    const kpi = analytics?.kpis;
    const sourceData = analytics
        ? Object.entries(analytics.by_source).filter(([, v]) => v.revenue > 0)
            .map(([k, v]) => ({ name: SRC_LABEL[k] || k, value: Math.round(v.revenue) }))
        : [];
    const tradeData = analytics
        ? Object.entries(analytics.by_trade_type)
            .map(([k, v]) => ({ name: k === "DOMESTIC" ? "Domestic" : "International", Revenue: Math.round(v.revenue), Profit: Math.round(v.profit) }))
        : [];
    const monthlyData = (analytics?.monthly || []).map(m => ({
        ...m,
        label: new Date(`${m.month}-01`).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
    }));
    const topRows = analytics ? (analytics.top_profit || []) : [];

    const kpiCard = (label, value, color) => (
        <Grid size={{ xs: 6, md: 2.4 }} key={label}>
            <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height: "100%" }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography sx={{ fontSize: "0.55rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 900, letterSpacing: "0.05em", mb: 0.5 }}>{label}</Typography>
                    <Typography sx={{ fontSize: "1.15rem", fontWeight: 900, color: color || "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</Typography>
                </CardContent>
            </Card>
        </Grid>
    );
    const chartCard = (title, node) => (
        <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height: "100%" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5 }}>{title}</Typography>
                {node}
            </CardContent>
        </Card>
    );

    return (
        <>
            <Box sx={{ width: "100%", py: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Header */}
                <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <CardContent sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, justifyContent: "space-between", gap: 2, p: 3, "&:last-child": { pb: 3 } }}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 1.5 }}>
                                <ReceiptLongIcon sx={{ color: "#2e7d32" }} /> Revenue & Profitability
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5, fontWeight: 500 }}>
                                Requisition-wise P&L with transport allocation
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<FileDownloadIcon />}
                                onClick={handleExport}
                                disabled={pnlList.length === 0}
                                sx={{
                                    bgcolor: "#2e7d32",
                                    "&:hover": { bgcolor: "#388e3c" },
                                    fontWeight: 900,
                                    fontSize: "0.65rem",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    borderRadius: 2,
                                }}
                            >
                                Export
                            </Button>
                            <IconButton onClick={fetchPnlData} size="small" sx={{ bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#e2e8f0" }, borderRadius: 2 }}>
                                <SyncIcon fontSize="small" sx={{ color: "#475569" }} />
                            </IconButton>
                        </Box>
                    </CardContent>
                </Card>

                {/* Enterprise money-movement overview */}
                {overview && (
                    <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
                                Enterprise Overview — Money Movement (INR{overview.fy !== "ALL" ? ` · ${overview.fy}` : ""})
                            </Typography>
                            <Grid container spacing={1.5}>
                                {/* Money IN */}
                                <Grid size={{ xs: 12, md: 5 }}>
                                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ecfdf5", border: "1px solid #a7f3d0", height: "100%" }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                            <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "#047857", textTransform: "uppercase" }}>Money In (received)</Typography>
                                            <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, color: "#047857" }}>{fmt(overview.total_in)}</Typography>
                                        </Box>
                                        {[["Goods Sales", overview.money_in.goods_sales], ["Service", overview.money_in.service], ["Client Advances", overview.money_in.advances], ["Freight Recovered", overview.money_in.freight_recovered]].map(([l, v]) => (
                                            <Box key={l} sx={{ display: "flex", justifyContent: "space-between", py: 0.3 }}>
                                                <Typography sx={{ fontSize: "0.72rem", color: "#334155" }}>{l}</Typography>
                                                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, fontFamily: "monospace", color: "#065f46" }}>{fmtD(v)}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Grid>
                                {/* Money OUT */}
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#fef2f2", border: "1px solid #fecaca", height: "100%" }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                            <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "#b91c1c", textTransform: "uppercase" }}>Money Out (paid)</Typography>
                                            <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, color: "#b91c1c" }}>{fmt(overview.total_out)}</Typography>
                                        </Box>
                                        {[["Purchases (vendors)", overview.money_out.purchases], ["Freight Paid", overview.money_out.freight_paid]].map(([l, v]) => (
                                            <Box key={l} sx={{ display: "flex", justifyContent: "space-between", py: 0.3 }}>
                                                <Typography sx={{ fontSize: "0.72rem", color: "#334155" }}>{l}</Typography>
                                                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, fontFamily: "monospace", color: "#991b1b" }}>{fmtD(v)}</Typography>
                                            </Box>
                                        ))}
                                        <Box sx={{ mt: 1, pt: 1, borderTop: "1px dashed #fca5a5", display: "flex", justifyContent: "space-between" }}>
                                            <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "#7c2d12", textTransform: "uppercase" }}>Net Cash</Typography>
                                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 900, color: overview.net_cash >= 0 ? "#047857" : "#b91c1c" }}>{fmt(overview.net_cash)}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                {/* Outstanding */}
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#fff7ed", border: "1px solid #fed7aa", height: "100%" }}>
                                        <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "#c2410c", textTransform: "uppercase", mb: 1 }}>Outstanding</Typography>
                                        {[["To collect (clients)", overview.outstanding.receivable_from_clients], ["To pay (vendors)", overview.outstanding.payable_to_vendors], ["Freight payable", overview.outstanding.freight_payable]].map(([l, v]) => (
                                            <Box key={l} sx={{ display: "flex", justifyContent: "space-between", py: 0.3 }}>
                                                <Typography sx={{ fontSize: "0.7rem", color: "#334155" }}>{l}</Typography>
                                                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, fontFamily: "monospace", color: "#9a3412" }}>{fmtD(v)}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {/* Summary Cards */}
                <Grid container spacing={1.5}>
                    {summaryCards.map((c, i) => (
                        <Grid size={{ xs: 6, lg: 2.4 }} key={i}>
                            <Card
                                variant="outlined"
                                sx={{
                                    borderRadius: 3,
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                    bgcolor: c.cardBg || "#fff",
                                    borderColor: c.cardBorder || undefined,
                                    height: "100%",
                                }}
                            >
                                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                                        <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: c.iconBg, color: c.iconColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {c.icon}
                                        </Box>
                                        <Typography sx={{ fontSize: "0.55rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 900, letterSpacing: "0.05em" }}>
                                            {c.label}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: "1.15rem", fontWeight: 900, color: c.valueColor || "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {c.value}
                                    </Typography>
                                    {c.subValue && (
                                        <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, color: "#2e7d32", mt: 0.25 }}>
                                            {c.subValue}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {/* Margin card */}
                    <Grid size={{ xs: 6, lg: 2.4 }}>
                        <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height: "100%" }}>
                            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                                    <Typography sx={{ fontSize: "0.55rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 900, letterSpacing: "0.05em" }}>
                                        Margin
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 0.75 }}>
                                        <Typography sx={{ fontSize: "0.5rem", fontWeight: 900, color: "#2e7d32" }}>{profitCount}P</Typography>
                                        <Typography sx={{ fontSize: "0.5rem", fontWeight: 900, color: "#c62828" }}>{lossCount}L</Typography>
                                    </Box>
                                </Box>
                                <Typography sx={{ fontSize: "1.3rem", fontWeight: 900, color: overallMargin >= 10 ? "#2e7d32" : overallMargin >= 0 ? "#e65100" : "#c62828" }}>
                                    {Number(overallMargin).toFixed(1)}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={Math.min(100, Math.max(0, overallMargin))}
                                    sx={{
                                        mt: 0.75,
                                        height: 4,
                                        borderRadius: 2,
                                        bgcolor: "#f1f5f9",
                                        "& .MuiLinearProgress-bar": {
                                            borderRadius: 2,
                                            bgcolor: overallMargin >= 20 ? "#4caf50" : overallMargin >= 10 ? "#ff9800" : "#ef5350",
                                        },
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* ── Enterprise analytics ───────────────────────────────── */}
                {analytics && kpi && (
                    <>
                        <Grid container spacing={1.5}>
                            {kpiCard("Gross Profit", fmt(kpi.profit), kpi.profit >= 0 ? "#2e7d32" : "#c62828")}
                            {kpiCard("Avg Deal Size", fmt(kpi.avg_deal))}
                            {kpiCard("Deals", kpi.deals)}
                            {kpiCard("Best Margin", `${Number(kpi.best_margin).toFixed(1)}%`, "#2e7d32")}
                            {kpiCard("Worst Margin", `${Number(kpi.worst_margin).toFixed(1)}%`, "#c62828")}
                        </Grid>

                        {analytics.transport && (
                            <Grid container spacing={1.5}>
                                {kpiCard("Freight Paid (Buy)", fmt(analytics.transport.freight_paid_buy), "#c62828")}
                                {kpiCard("Freight Paid (Sell)", fmt(analytics.transport.freight_paid_sell), "#c62828")}
                                {kpiCard("Freight Recovered", fmt(analytics.transport.freight_recovered_sell), "#2e7d32")}
                                {kpiCard("Net Freight Cost", fmt(analytics.transport.net_freight_cost), "#e65100")}
                                {kpiCard("Total Freight Paid", fmt(analytics.transport.freight_paid_total), "#475569")}
                            </Grid>
                        )}

                        {analytics.service && (
                            <Box>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.75, mt: 0.5 }}>
                                    Service Revenue (INR · separate from goods margin)
                                </Typography>
                                <Grid container spacing={1.5}>
                                    {kpiCard("Service Invoices", analytics.service.invoices, "#7c3aed")}
                                    {kpiCard("Service Billed", fmt(analytics.service.billed), "#1565c0")}
                                    {kpiCard("Service Received", fmt(analytics.service.received), "#2e7d32")}
                                    {kpiCard("Service Outstanding", fmt(analytics.service.outstanding), "#c2410c")}
                                </Grid>
                            </Box>
                        )}

                        <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, lg: 8 }}>
                                {chartCard("Monthly Revenue · Cost · Profit", (
                                    <Box sx={{ height: 280 }}>
                                        {monthlyData.length === 0 ? (
                                            <Typography sx={{ color: "#94a3b8", fontSize: 13, py: 6, textAlign: "center" }}>No data for the selected period</Typography>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={monthlyData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                                    <YAxis tickFormatter={compactINR} tick={{ fontSize: 11 }} width={60} />
                                                    <RTooltip formatter={(v) => fmt(v)} />
                                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                                    <Bar dataKey="revenue" name="Revenue" fill={C_REV} radius={[4, 4, 0, 0]} barSize={18} />
                                                    <Bar dataKey="cost" name="Cost" fill={C_COST} radius={[4, 4, 0, 0]} barSize={18} />
                                                    <Line dataKey="profit" name="Profit" stroke={C_PROFIT} strokeWidth={2.5} dot={{ r: 3 }} />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        )}
                                    </Box>
                                ))}
                            </Grid>
                            <Grid size={{ xs: 12, lg: 4 }}>
                                {chartCard("Revenue by Source", (
                                    <Box sx={{ height: 280 }}>
                                        {sourceData.length === 0 ? (
                                            <Typography sx={{ color: "#94a3b8", fontSize: 13, py: 6, textAlign: "center" }}>No revenue yet</Typography>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                                                        {sourceData.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                    </Pie>
                                                    <RTooltip formatter={(v) => fmt(v)} />
                                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </Box>
                                ))}
                            </Grid>
                            <Grid size={{ xs: 12, lg: 6 }}>
                                {chartCard("Domestic vs International", (
                                    <Box sx={{ height: 260 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={tradeData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f6" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                                <YAxis tickFormatter={compactINR} tick={{ fontSize: 11 }} width={60} />
                                                <RTooltip formatter={(v) => fmt(v)} />
                                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                                <Bar dataKey="Revenue" fill={C_REV} radius={[4, 4, 0, 0]} barSize={40} />
                                                <Bar dataKey="Profit" fill={C_PROFIT} radius={[4, 4, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                ))}
                            </Grid>
                            <Grid size={{ xs: 12, lg: 6 }}>
                                {chartCard("Top Performers", (
                                    <Box sx={{ height: 260, overflowY: "auto" }}>
                                        {topRows.length === 0 ? (
                                            <Typography sx={{ color: "#94a3b8", fontSize: 13, py: 6, textAlign: "center" }}>No deals yet</Typography>
                                        ) : topRows.map((r, i) => (
                                            <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, borderBottom: "1px solid #f1f5f9" }}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</Typography>
                                                    <Typography sx={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                                                        {r.trade_type === "INTERNATIONAL" ? "Intl" : "Domestic"} · {SRC_LABEL[r.source] || r.source} · {Number(r.margin).toFixed(1)}%
                                                    </Typography>
                                                </Box>
                                                <Typography sx={{ fontFamily: "monospace", fontWeight: 900, fontSize: 13, color: r.profit >= 0 ? "#2e7d32" : "#c62828", flexShrink: 0, ml: 1 }}>
                                                    {r.profit >= 0 ? "+" : ""}{fmt(r.profit)}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                ))}
                            </Grid>
                        </Grid>
                    </>
                )}

                {/* Filters */}
                <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <CardContent sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "flex-end" }, gap: 1.5, flexWrap: "wrap", p: 2, "&:last-child": { pb: 2 } }}>
                        <FormControl size="small" sx={{ width: 176 }}>
                            <InputLabel sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Financial Year</InputLabel>
                            <Select
                                value={filterFY}
                                onChange={(e) => setFilterFY(e.target.value)}
                                label="Financial Year"
                                sx={{ borderRadius: 2, fontSize: "0.875rem", fontWeight: 700, bgcolor: "#f8fafc" }}
                            >
                                <MenuItem value="">All Years</MenuItem>
                                {generateFYOptions().map(fy => <MenuItem key={fy.value} value={fy.value}>{fy.label}</MenuItem>)}
                            </Select>
                        </FormControl>

                        <Box sx={{ flex: 1, maxWidth: 384 }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                    Filter Requisition
                                </Typography>
                                {filterRequisition && (
                                    <Button
                                        size="small"
                                        onClick={() => setFilterRequisition("")}
                                        startIcon={<CloseIcon sx={{ fontSize: "10px !important" }} />}
                                        sx={{ fontSize: "0.55rem", fontWeight: 900, color: "#ef5350", textTransform: "uppercase", minWidth: "auto", p: 0 }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </Box>
                            <RequisitionSelector value={filterRequisition} onChange={setFilterRequisition} placeholder="Select requisition..." />
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 0.5 }}>
                            {(filterFY || filterRequisition) && (
                                <Button
                                    size="small"
                                    onClick={() => { setFilterFY(""); setFilterRequisition(""); }}
                                    startIcon={<CloseIcon sx={{ fontSize: "10px !important" }} />}
                                    sx={{ fontSize: "0.55rem", fontWeight: 900, color: "#ef5350", textTransform: "uppercase", minWidth: "auto", p: 0 }}
                                >
                                    Clear All
                                </Button>
                            )}
                            <Typography sx={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                {pnlList.length} record{pnlList.length !== 1 ? 's' : ''}{filterFY && ` · ${filterFY}`}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                    <TableContainer>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Requisition</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Purchase</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Transport</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Total Cost</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Revenue</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>P&L</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Margin</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Status</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pnlLoading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={9} sx={{ py: 3 }}>
                                                <Skeleton variant="rectangular" height={12} sx={{ borderRadius: 1 }} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : pnlList.length > 0 ? pnlList.map((item, idx) => {
                                    const profit = parseFloat(item.profit_loss_inr || 0);
                                    const margin = parseFloat(item.margin_percentage || 0);
                                    const revenue = parseFloat(item.sales_revenue_inr || 0);
                                    return (
                                        <TableRow
                                            key={item.requisition_id || idx}
                                            hover
                                            sx={{
                                                "&:hover .view-btn": { opacity: 1 },
                                                "& td": { borderBottom: "1px solid #f1f5f9" },
                                            }}
                                        >
                                            <TableCell sx={{ py: 1.75 }}>
                                                <Chip
                                                    label={item.requisition_number}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        fontFamily: "monospace",
                                                        fontWeight: 700,
                                                        fontSize: "0.75rem",
                                                        borderRadius: 1,
                                                        ...(item.is_stock_sale
                                                            ? { color: "#b45309", bgcolor: "#fffbeb", borderColor: "#fde68a" }
                                                            : { color: PRIMARY, bgcolor: "#eff6ff", borderColor: "#bfdbfe" }),
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: "0.875rem", color: "#475569" }}>{fmtD(item.purchase_cost_inr)}</TableCell>
                                            <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: "0.875rem", color: "#64748b" }}>
                                                {fmtD(item.transport_cost_inr)}
                                                {Number(item.transport_recovered_inr) > 0 && (
                                                    <Typography component="div" sx={{ fontFamily: "monospace", fontSize: "0.6rem", fontWeight: 700, color: "#2e7d32" }}>
                                                        −{fmtD(item.transport_recovered_inr)} recd
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>{fmtD(item.total_cost_inr)}</TableCell>
                                            <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: "0.875rem", fontWeight: 700 }}>
                                                {revenue > 0
                                                    ? <Typography component="span" sx={{ fontFamily: "monospace", fontSize: "0.875rem", fontWeight: 700, color: PRIMARY }}>{fmtD(revenue)}</Typography>
                                                    : <Typography component="span" sx={{ fontFamily: "monospace", fontSize: "0.875rem", color: "#94a3b8" }}>No sale</Typography>
                                                }
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: "0.875rem", fontWeight: 900, color: profit >= 0 ? "#2e7d32" : "#c62828" }}>
                                                {profit >= 0 ? '+' : ''}{fmtD(profit)}
                                            </TableCell>
                                            <TableCell align="center"><MarginBadge margin={margin} /></TableCell>
                                            <TableCell align="center"><StatusBadge alert={item.alert} revenue={revenue} /></TableCell>
                                            <TableCell align="center" sx={{ py: 1.5 }}>
                                                {item.requisition_id ? (
                                                    <Tooltip title="Item Breakdown" arrow>
                                                        <IconButton
                                                            className="view-btn"
                                                            size="small"
                                                            onClick={() => openItemModal(item.requisition_id, item.requisition_number)}
                                                            sx={{
                                                                bgcolor: "#f1f5f9",
                                                                color: "#64748b",
                                                                opacity: 0.6,
                                                                transition: "all 0.2s",
                                                                "&:hover": { bgcolor: PRIMARY, color: "#fff" },
                                                                borderRadius: 1.5,
                                                            }}
                                                        >
                                                            <VisibilityIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Typography sx={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 700 }}>N/A</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={9} sx={{ py: 8, textAlign: "center" }}>
                                            <ReceiptLongIcon sx={{ fontSize: 32, color: "#e2e8f0", mb: 1 }} />
                                            <Typography sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
                                                No P&L records found
                                            </Typography>
                                            {filterRequisition && (
                                                <Button
                                                    size="small"
                                                    onClick={() => setFilterRequisition("")}
                                                    sx={{ color: PRIMARY, fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase", mt: 0.5 }}
                                                >
                                                    Show All
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            </Box>

            {/* Item Breakdown Modal */}
            <Dialog
                open={itemModal.open}
                onClose={closeItemModal}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        maxHeight: "90vh",
                        overflow: "hidden",
                    },
                }}
            >
                {/* Modal Header */}
                <DialogTitle
                    sx={{
                        bgcolor: "#0f172a",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 2,
                        px: 3,
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            Item P&L — {itemModal.reqNumber}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>
                            Transport Allocated: {fmtD(itemModal.transport)}
                        </Typography>
                    </Box>
                    <IconButton onClick={closeItemModal} size="small" sx={{ color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }, ml: 1 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                {/* Summary Strip */}
                {!itemModal.loading && modalTotals && (
                    <Box sx={{ bgcolor: "#f8fafc", px: 3, py: 1.5, borderBottom: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: 2.5 }}>
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {itemModal.items.length} Items
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Cost: <Box component="span" sx={{ color: "#1e293b" }}>{fmtD(modalTotals.tCost)}</Box>
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Revenue: <Box component="span" sx={{ color: PRIMARY }}>{fmtD(modalTotals.tRev)}</Box>
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            P&L: <Box component="span" sx={{ color: modalTotals.tPL >= 0 ? "#2e7d32" : "#c62828" }}>{modalTotals.tPL >= 0 ? '+' : ''}{fmtD(modalTotals.tPL)}</Box>
                        </Typography>
                    </Box>
                )}

                {/* Modal Body */}
                <DialogContent sx={{ p: 0, overflow: "auto" }}>
                    {itemModal.loading ? (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 8 }}>
                            <CircularProgress size={28} sx={{ color: PRIMARY }} />
                        </Box>
                    ) : itemModal.items.length > 0 ? (
                        <TableContainer>
                            <Table sx={{ minWidth: 750 }} size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f8fafc", "& th": { borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 1, bgcolor: "#f8fafc" } }}>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Buy Qty</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Buy Amt</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Transport</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Cost</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sell Qty</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sell Amt</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>P&L</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Margin</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {itemModal.items.map((it, i) => {
                                        const pl = parseFloat(it.profit_loss_inr || 0);
                                        const mg = parseFloat(it.margin_percentage || 0);
                                        return (
                                            <TableRow key={i} hover sx={{ "& td": { borderBottom: "1px solid #f1f5f9" } }}>
                                                <TableCell sx={{ py: 1.5 }}>
                                                    <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.875rem" }}>{it.product_name}</Typography>
                                                    <Typography sx={{ fontSize: "0.625rem", color: "#94a3b8", fontFamily: "monospace" }}>{it.product_code} · {it.unit}</Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#475569" }}>{it.purchase_qty}</TableCell>
                                                <TableCell align="right" sx={{ fontFamily: "monospace", color: "#475569" }}>
                                                    {fmtD(it.purchase_amount_inr)}
                                                    {it.purchase_currency && it.purchase_currency !== 'INR' && (
                                                        <Typography sx={{ fontSize: "0.625rem", color: PRIMARY, mt: 0.25 }}>
                                                            {it.purchase_currency} {Number(it.purchase_amount_original || 0).toFixed(2)} @{it.purchase_conversion_rate}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontFamily: "monospace", color: "#94a3b8" }}>{fmtD(it.allocated_transport_inr)}</TableCell>
                                                <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>{fmtD(it.total_cost_inr)}</TableCell>
                                                <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#475569" }}>{it.selling_qty}</TableCell>
                                                <TableCell align="right" sx={{ fontFamily: "monospace", color: "#475569" }}>
                                                    {fmtD(it.selling_amount_inr)}
                                                    {it.selling_currency && it.selling_currency !== 'INR' && (
                                                        <Typography sx={{ fontSize: "0.625rem", color: "#2e7d32", mt: 0.25 }}>
                                                            {it.selling_currency} {Number(it.selling_amount_original || 0).toFixed(2)} @{it.selling_conversion_rate}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 900, color: pl >= 0 ? "#2e7d32" : "#c62828" }}>
                                                    {pl >= 0 ? '+' : ''}{fmtD(pl)}
                                                </TableCell>
                                                <TableCell align="center"><MarginBadge margin={mg} /></TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Box sx={{ py: 8, textAlign: "center" }}>
                            <Typography sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
                                No item data
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                {/* Modal Footer */}
                <DialogActions sx={{ bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0", px: 3, py: 1.5 }}>
                    <Button
                        onClick={closeItemModal}
                        variant="contained"
                        sx={{
                            bgcolor: "#e2e8f0",
                            color: "#475569",
                            fontWeight: 700,
                            borderRadius: 2,
                            boxShadow: "none",
                            "&:hover": { bgcolor: "#cbd5e1", boxShadow: "none" },
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            <AlertToast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
        </>
    );
}
