
import React, { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Chip,
    Avatar,
    Paper,
    Divider,
    LinearProgress,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningIcon from "@mui/icons-material/Warning";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PublicIcon from "@mui/icons-material/Public";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import { getFinanceDashboard, getFinanceReceivables } from "../services/financeService";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RECV_SOURCES = [
    { value: "", label: "All Sources" },
    { value: "REQUISITION", label: "Requisition" },
    { value: "STOCK_SALE", label: "Stock" },
    { value: "DIRECT", label: "Direct" },
];

const FinanceDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Client receivables breakdown (Domestic/International + PI source)
    const [recvTab, setRecvTab] = useState("DOMESTIC");
    const [recvSource, setRecvSource] = useState("");
    const [receivables, setReceivables] = useState(null);

    useEffect(() => {
        let active = true;
        getFinanceReceivables(recvTab, recvSource)
            .then((d) => { if (active) setReceivables(d); })
            .catch((e) => { console.error("Failed to load receivables", e); if (active) setReceivables(null); });
        return () => { active = false; };
    }, [recvTab, recvSource]);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const data = await getFinanceDashboard();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch finance dashboard:", err);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const getCurrencySymbol = (code) => {
        switch (code?.toUpperCase()) {
            case "USD": return "$";
            case "EUR": return "€";
            case "GBP": return "£";
            case "JPY": return "¥";
            case "INR": return "₹";
            default: return code || "₹";
        }
    };

    const formatCurrency = (amount, curr = 'INR') => {
        const c = (curr || 'INR').toString().trim().toUpperCase();
        const locale = c === 'INR' ? 'en-IN' : 'en-US';
        return `${getCurrencySymbol(c)} ${Number(amount || 0).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={40} sx={{ color: "primary.main" }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                sx={{
                    p: 4,
                    textAlign: "center",
                    bgcolor: "#fef2f2",
                    borderRadius: 4,
                    border: "1px solid #fee2e2",
                    maxWidth: 600,
                    mx: "auto",
                    mt: 5,
                }}
            >
                <WarningIcon sx={{ color: "error.main", fontSize: 48, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#991b1b", mb: 1 }}>
                    Error Loading Dashboard
                </Typography>
                <Typography sx={{ color: "#dc2626", mb: 3, fontSize: 14 }}>{error}</Typography>
                <Button
                    variant="contained"
                    color="error"
                    onClick={() => window.location.reload()}
                    sx={{
                        px: 3,
                        py: 1,
                        borderRadius: 3,
                        fontWeight: 700,
                        textTransform: "none",
                        boxShadow: 3,
                    }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4, p: 0.5 }}>
            {/* HEADER */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { md: "center" },
                    justifyContent: "space-between",
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
                        Finance Overview
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", fontSize: 13 }}>
                        Welcome back, {user?.full_name || "User"}. Monitoring cash flow and accounts.
                    </Typography>
                </Box>
            </Box>

            {/* MAIN STATS GRID */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <StatCard
                        title="Total Inflow (INR)"
                        value={formatCurrency(stats?.cash_flow?.total_inflow)}
                        change="Payments Received"
                        icon={<ArrowUpwardIcon />}
                        color="emerald"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <StatCard
                        title="Total Outflow (INR)"
                        value={formatCurrency(stats?.cash_flow?.total_outflow)}
                        change="Vendor Payments"
                        icon={<ArrowDownwardIcon />}
                        color="orange"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <StatCard
                        title="Net Cash Flow (INR)"
                        value={formatCurrency(stats?.cash_flow?.net_flow)}
                        change="Current Liquidity"
                        icon={<AccountBalanceWalletIcon />}
                        color="blue"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <StatCard
                        title="Purchased Value (INR)"
                        value={formatCurrency(stats?.purchase_items?.purchased_value)}
                        change={`${stats?.purchase_items?.purchased_items} Items Purchased`}
                        icon={<Inventory2Icon />}
                        color="indigo"
                    />
                </Grid>
            </Grid>

            {/* CLIENT RECEIVABLES BY CATEGORY */}
            <Card sx={{ borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b" }}>
                            Client Receivables by Category
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                            Incoming PI value, received & outstanding — INR equivalent
                        </Typography>
                    </Box>
                    <ToggleButtonGroup
                        exclusive
                        value={recvTab}
                        onChange={(_, v) => { if (v) { setRecvTab(v); setRecvSource(""); } }}
                        sx={{
                            bgcolor: "#f1f5f9", borderRadius: 2.5, p: 0.5,
                            "& .MuiToggleButton-root": {
                                textTransform: "none", fontWeight: 800, fontSize: "0.78rem", px: 2.2, py: 0.6, gap: 0.6,
                                border: "none", borderRadius: "9px !important", color: "#64748b",
                                "&.Mui-selected": { bgcolor: "#fff", color: "#1565C0", boxShadow: "0 1px 4px rgba(0,0,0,0.12)", "&:hover": { bgcolor: "#fff" } },
                            },
                        }}
                    >
                        <ToggleButton value="DOMESTIC"><HomeWorkIcon sx={{ fontSize: 17 }} />Domestic</ToggleButton>
                        <ToggleButton value="INTERNATIONAL"><PublicIcon sx={{ fontSize: 17 }} />International</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* source chips */}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {RECV_SOURCES.map((s) => {
                        const active = recvSource === s.value;
                        return (
                            <Chip
                                key={s.value || "all"}
                                label={s.label}
                                clickable
                                onClick={() => setRecvSource(s.value)}
                                sx={{
                                    fontWeight: 800, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em",
                                    borderRadius: 2, height: 28,
                                    bgcolor: active ? "#1565C0" : "#fff",
                                    color: active ? "#fff" : "#475569",
                                    border: "1px solid", borderColor: active ? "#1565C0" : "#e2e8f0",
                                    "&:hover": { bgcolor: active ? "#1256a3" : "#f1f5f9" },
                                }}
                            />
                        );
                    })}
                </Box>

                {/* stat cards */}
                <Grid container spacing={2}>
                    {[
                        { label: `PIs (${recvTab === "INTERNATIONAL" ? "Intl" : "Domestic"})`, value: receivables ? receivables.pi_count : "—", color: "#1e293b", bg: "#f8fafc", bd: "#e2e8f0" },
                        { label: "Total Billed", value: receivables ? formatCurrency(receivables.total_value) : "—", color: "#1d4ed8", bg: "#eff6ff", bd: "#bfdbfe" },
                        { label: "Received", value: receivables ? formatCurrency(receivables.total_received) : "—", color: "#047857", bg: "#ecfdf5", bd: "#a7f3d0" },
                        { label: "Outstanding", value: receivables ? formatCurrency(receivables.outstanding) : "—", color: "#c2410c", bg: "#fff7ed", bd: "#fed7aa" },
                        { label: "Advance Remaining", value: receivables ? formatCurrency(receivables.advance_remaining) : "—", color: "#b45309", bg: "#fffbeb", bd: "#fde68a" },
                    ].map((c) => (
                        <Grid size={{ xs: 6, md: 4, lg: 2.4 }} key={c.label}>
                            <Box sx={{ p: 2, borderRadius: 3, bgcolor: c.bg, border: "1px solid", borderColor: c.bd, height: "100%" }}>
                                <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
                                    {c.label}
                                </Typography>
                                <Typography sx={{ fontSize: "1.05rem", fontWeight: 900, color: c.color, lineHeight: 1.2 }}>
                                    {c.value}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Card>

            {/* DETAILED CARDS ROW */}
            <Grid container spacing={4}>
                {/* Incoming (Client Payments) Card */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Card
                        sx={{
                            borderRadius: 4,
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                bgcolor: "rgba(248,250,252,0.5)",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    color: "#1e293b",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    fontSize: 15,
                                }}
                            >
                                <VolunteerActivismIcon sx={{ color: "#4f46e5", fontSize: 20 }} />
                                {stats?.incoming?.label}
                                <Typography component="span" sx={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>
                                    (INR)
                                </Typography>
                            </Typography>
                            <Button
                                component={Link}
                                to="/finance/pi-bills"
                                endIcon={<ArrowForwardIcon sx={{ fontSize: "10px !important" }} />}
                                sx={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#4f46e5",
                                    textTransform: "none",
                                    "&:hover": { color: "#4338ca", bgcolor: "transparent" },
                                    p: 0,
                                    minWidth: "auto",
                                }}
                            >
                                MANAGE BILLS
                            </Button>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: 10,
                                                    color: "#94a3b8",
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.1em",
                                                    mb: 0.5,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                Total Outstanding
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: { xs: 24, sm: 30 },
                                                    fontWeight: 700,
                                                    color: "#0f172a",
                                                    wordBreak: "break-all",
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {formatCurrency(stats?.incoming?.outstanding)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Chip
                                                label={`${stats?.incoming?.pending_count} Bills Pending`}
                                                size="small"
                                                sx={{
                                                    bgcolor: "#eef2ff",
                                                    color: "#4338ca",
                                                    fontSize: 10,
                                                    fontWeight: 900,
                                                    textTransform: "uppercase",
                                                    height: 22,
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 1.5, height: "100%" }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#64748b", fontStyle: "italic" }}>
                                                Collection Progress
                                            </Typography>
                                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#4f46e5" }}>
                                                {Math.round((stats?.incoming?.total_received / stats?.incoming?.total_value) * 100) || 0}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(stats?.incoming?.total_received / stats?.incoming?.total_value) * 100 || 0}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                bgcolor: "#f1f5f9",
                                                "& .MuiLinearProgress-bar": {
                                                    borderRadius: 4,
                                                    bgcolor: "#6366f1",
                                                    transition: "transform 1s ease",
                                                },
                                            }}
                                        />
                                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: 10,
                                                    color: "#94a3b8",
                                                    fontWeight: 700,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                REC: {formatCurrency(stats?.incoming?.total_received)}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: 10,
                                                    color: "#94a3b8",
                                                    fontWeight: 700,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                TOTAL: {formatCurrency(stats?.incoming?.total_value)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Outgoing (Vendor Payments) Card */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Card
                        sx={{
                            borderRadius: 4,
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                bgcolor: "rgba(248,250,252,0.5)",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    color: "#1e293b",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    fontSize: 15,
                                }}
                            >
                                <ShoppingCartIcon sx={{ color: "#ea580c", fontSize: 20 }} />
                                {stats?.outgoing?.label}
                                <Typography component="span" sx={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>
                                    (INR)
                                </Typography>
                            </Typography>
                            <Button
                                component={Link}
                                to="/finance/purchase-orders"
                                endIcon={<ArrowForwardIcon sx={{ fontSize: "10px !important" }} />}
                                sx={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#ea580c",
                                    textTransform: "none",
                                    "&:hover": { color: "#c2410c", bgcolor: "transparent" },
                                    p: 0,
                                    minWidth: "auto",
                                }}
                            >
                                MANAGE POS
                            </Button>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: 10,
                                                    color: "#94a3b8",
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.1em",
                                                    mb: 0.5,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                To Be Paid
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: { xs: 24, sm: 30 },
                                                    fontWeight: 700,
                                                    color: "#0f172a",
                                                    wordBreak: "break-all",
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {formatCurrency(stats?.outgoing?.outstanding)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Chip
                                                label={`${stats?.outgoing?.pending_count} POs Pending`}
                                                size="small"
                                                sx={{
                                                    bgcolor: "#fff7ed",
                                                    color: "#c2410c",
                                                    fontSize: 10,
                                                    fontWeight: 900,
                                                    textTransform: "uppercase",
                                                    height: 22,
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 1.5, height: "100%" }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#64748b", fontStyle: "italic" }}>
                                                Payment Progress
                                            </Typography>
                                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#ea580c" }}>
                                                {Math.round((stats?.outgoing?.total_paid / stats?.outgoing?.total_value) * 100) || 0}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(stats?.outgoing?.total_paid / stats?.outgoing?.total_value) * 100 || 0}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                bgcolor: "#f1f5f9",
                                                "& .MuiLinearProgress-bar": {
                                                    borderRadius: 4,
                                                    bgcolor: "#f97316",
                                                    transition: "transform 1s ease",
                                                },
                                            }}
                                        />
                                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: 10,
                                                    color: "#94a3b8",
                                                    fontWeight: 700,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                PAID: {formatCurrency(stats?.outgoing?.total_paid)}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: 10,
                                                    color: "#94a3b8",
                                                    fontWeight: 700,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                TOTAL: {formatCurrency(stats?.outgoing?.total_value)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* TRANSACTIONS SECTION */}
            <Grid container spacing={4}>
                {/* Recent Client Payments (Incoming) */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Card
                        sx={{
                            borderRadius: 4,
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    color: "#1e293b",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    fontSize: 15,
                                }}
                            >
                                <AccessTimeIcon sx={{ color: "#6366f1", fontSize: 20 }} /> Recent Client Collections
                            </Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "rgba(248,250,252,0.5)" }}>
                                        <TableCell
                                            sx={{
                                                color: "#64748b",
                                                textTransform: "uppercase",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: "0.1em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Date / Bill
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                color: "#64748b",
                                                textTransform: "uppercase",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: "0.1em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Client Info
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                color: "#64748b",
                                                textTransform: "uppercase",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: "0.1em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Amount
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                color: "#64748b",
                                                textTransform: "uppercase",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: "0.1em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Status
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stats?.recent_incoming?.length > 0 ? (
                                        stats.recent_incoming.slice(0, 5).map((item) => (
                                            <TableRow
                                                key={item.id}
                                                sx={{ "&:hover": { bgcolor: "#f8fafc" }, transition: "background-color 0.15s" }}
                                            >
                                                <TableCell sx={{ px: 3, py: 2, borderBottom: "1px solid #f1f5f9" }}>
                                                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                                                        {formatDate(item.payment_date)}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 10, fontFamily: "monospace", color: "#4f46e5", fontWeight: 700 }}>
                                                        {item.bill_number}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ px: 3, py: 2, borderBottom: "1px solid #f1f5f9" }}>
                                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                                                        {item.client_name}
                                                    </Typography>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                                        <Chip
                                                            label={item.payment_mode_display}
                                                            size="small"
                                                            sx={{
                                                                fontSize: 9,
                                                                bgcolor: "#f1f5f9",
                                                                color: "#64748b",
                                                                fontWeight: 900,
                                                                textTransform: "uppercase",
                                                                height: 18,
                                                                "& .MuiChip-label": { px: 1 },
                                                            }}
                                                        />
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" sx={{ px: 3, py: 2, borderBottom: "1px solid #f1f5f9" }}>
                                                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>
                                                        {formatCurrency(item.amount, item.currency)}
                                                    </Typography>
                                                    {item.currency && item.currency !== 'INR' && (
                                                        <Typography sx={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>
                                                            {item.currency}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="center" sx={{ px: 3, py: 2, borderBottom: "1px solid #f1f5f9" }}>
                                                    <Chip
                                                        label={item.payment_status}
                                                        size="small"
                                                        sx={{
                                                            fontSize: 10,
                                                            bgcolor: "#ecfdf5",
                                                            color: "#047857",
                                                            fontWeight: 900,
                                                            textTransform: "uppercase",
                                                            letterSpacing: "-0.025em",
                                                            height: 22,
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} sx={{ p: 5, textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>
                                                No recent incoming payments
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Grid>

                {/* Recent Vendor Payments (Outgoing) */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Card
                        sx={{
                            borderRadius: 4,
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    color: "#1e293b",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    fontSize: 15,
                                }}
                            >
                                <AccessTimeIcon sx={{ color: "#f97316", fontSize: 20 }} /> Recent Vendor Payments
                            </Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "rgba(248,250,252,0.5)" }}>
                                        <TableCell
                                            sx={{
                                                color: "#64748b",
                                                textTransform: "uppercase",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: "0.1em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Date / PO
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                color: "#64748b",
                                                textTransform: "uppercase",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: "0.1em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Vendor Info
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                color: "#64748b",
                                                textTransform: "uppercase",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: "0.1em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Amount
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                color: "#64748b",
                                                textTransform: "uppercase",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: "0.1em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Status
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stats?.recent_outgoing?.length > 0 ? (
                                        stats.recent_outgoing.slice(0, 5).map((item) => (
                                            <TableRow
                                                key={item.id}
                                                sx={{ "&:hover": { bgcolor: "#f8fafc" }, transition: "background-color 0.15s" }}
                                            >
                                                <TableCell sx={{ px: 3, py: 2, borderBottom: "1px solid #f1f5f9" }}>
                                                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                                                        {formatDate(item.payment_date)}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 10, fontFamily: "monospace", color: "#ea580c", fontWeight: 700 }}>
                                                        {item.po_number || "N/A"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ px: 3, py: 2, borderBottom: "1px solid #f1f5f9" }}>
                                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                                                        {item.vendor_name}
                                                    </Typography>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                                        <Chip
                                                            label={item.payment_mode_display}
                                                            size="small"
                                                            sx={{
                                                                fontSize: 9,
                                                                bgcolor: "#f1f5f9",
                                                                color: "#64748b",
                                                                fontWeight: 900,
                                                                textTransform: "uppercase",
                                                                height: 18,
                                                                "& .MuiChip-label": { px: 1 },
                                                            }}
                                                        />
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" sx={{ px: 3, py: 2, borderBottom: "1px solid #f1f5f9" }}>
                                                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#ea580c" }}>
                                                        {formatCurrency(item.amount, item.currency)}
                                                    </Typography>
                                                    {item.currency && item.currency !== 'INR' && (
                                                        <Typography sx={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>
                                                            {item.currency}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="center" sx={{ px: 3, py: 2, borderBottom: "1px solid #f1f5f9" }}>
                                                    <Chip
                                                        label={item.payment_status}
                                                        size="small"
                                                        sx={{
                                                            fontSize: 10,
                                                            bgcolor: "#ecfdf5",
                                                            color: "#047857",
                                                            fontWeight: 900,
                                                            textTransform: "uppercase",
                                                            letterSpacing: "-0.025em",
                                                            height: 22,
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} sx={{ p: 5, textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>
                                                No recent outgoing payments
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Grid>
            </Grid>

            {/* QUICK ACTIONS ROW */}
            <Paper
                sx={{
                    bgcolor: "#0f172a",
                    borderRadius: 4,
                    p: 3,
                    color: "white",
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 3,
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                        sx={{
                            bgcolor: "rgba(255,255,255,0.1)",
                            width: 48,
                            height: 48,
                            backdropFilter: "blur(8px)",
                        }}
                    >
                        <AccountBalanceWalletIcon sx={{ color: "#818cf8", fontSize: 24 }} />
                    </Avatar>
                    <Box>
                        <Typography sx={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.025em" }}>
                            Finance Operations
                        </Typography>
                        <Typography sx={{ color: "#94a3b8", fontSize: 12 }}>
                            Manage your bills, POs and record transactions effortlessly.
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                        component={Link}
                        to="/finance/pi-bills"
                        variant="contained"
                        sx={{
                            px: 2.5,
                            py: 1.25,
                            bgcolor: "#4f46e5",
                            "&:hover": { bgcolor: "#4338ca" },
                            borderRadius: 3,
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            boxShadow: "0 10px 15px -3px rgba(79,70,229,0.2)",
                            "&:active": { transform: "scale(0.95)" },
                            transition: "all 0.15s",
                        }}
                    >
                        RECIEVE PAYMENT
                    </Button>
                    <Button
                        component={Link}
                        to="/finance/purchase-orders"
                        variant="outlined"
                        sx={{
                            px: 2.5,
                            py: 1.25,
                            bgcolor: "#1e293b",
                            borderColor: "#334155",
                            color: "white",
                            "&:hover": { bgcolor: "#334155", borderColor: "#334155" },
                            borderRadius: 3,
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            "&:active": { transform: "scale(0.95)" },
                            transition: "all 0.15s",
                        }}
                    >
                        RECORD PO PAYMENT
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

function StatCard({ title, value, change, icon, color }) {
    const colorMap = {
        blue: { bgcolor: "#dbeafe", color: "#2563eb" },
        indigo: { bgcolor: "#e0e7ff", color: "#4f46e5" },
        emerald: { bgcolor: "#d1fae5", color: "#047857" },
        orange: { bgcolor: "#ffedd5", color: "#ea580c" },
    };

    const scheme = colorMap[color] || colorMap.blue;

    return (
        <Card
            sx={{
                p: 3,
                borderRadius: 4,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                "&:hover": { boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
                transition: "box-shadow 0.2s",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Avatar
                    sx={{
                        bgcolor: scheme.bgcolor,
                        color: scheme.color,
                        width: 44,
                        height: 44,
                        borderRadius: 3,
                        transition: "transform 0.2s",
                        "div:hover > div > &": { transform: "scale(1.1)" },
                    }}
                >
                    {icon}
                </Avatar>
                <Chip
                    label={change}
                    size="small"
                    sx={{
                        fontSize: 10,
                        fontWeight: 900,
                        bgcolor: "#f8fafc",
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "-0.025em",
                        height: 24,
                    }}
                />
            </Box>
            <Box>
                <Typography
                    sx={{
                        color: "#64748b",
                        fontSize: 10,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        mb: 0.5,
                    }}
                >
                    {title}
                </Typography>
                <Typography
                    sx={{
                        fontSize: { xs: 20, sm: 24 },
                        fontWeight: 900,
                        color: "#0f172a",
                        letterSpacing: "-0.025em",
                        wordBreak: "break-all",
                        lineHeight: 1.1,
                    }}
                >
                    {value}
                </Typography>
            </Box>
        </Card>
    );
}

export default FinanceDashboard;
