import React, { useState, useEffect } from "react";
import {
    Box, Card, Typography, Button, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Tooltip, Dialog,
    DialogTitle, DialogContent, DialogActions, CircularProgress, Chip,
    InputAdornment, Select, MenuItem, FormControl, InputLabel, Grid,
    ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import HomeWorkIcon from "@mui/icons-material/HomeWork";

const SOURCES = [
    { value: "", label: "All Sources" },
    { value: "REQUISITION", label: "Requisition" },
    { value: "STOCK_SALE", label: "Stock" },
    { value: "DIRECT", label: "Direct" },
];
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Add as AddIcon,
    Close as CloseIcon,
    CalendarToday as CalendarIcon,
    AttachMoney as MoneyIcon,
    Person as PersonIcon,
    SwapHoriz as SwapIcon,
    History as HistoryIcon,
    CheckCircle as CheckCircleIcon,
    ReceiptLong as InvoiceIcon,
    Toll as CoinsIcon,
    Info as InfoIcon,
    Paid as PaidIcon,
} from "@mui/icons-material";
import { getAdvancePayments, createAdvancePayment, adjustAdvancePayment } from "../services/salesService";
import PISelector from "../components/common/PISelector";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const PiAdvance = () => {
    // Data State
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [confirm, setConfirm] = useState({ open: false, title: "", description: "", action: null });

    // Filter State
    const [filterStatus, setFilterStatus] = useState("ACTIVE");
    const [filterPI, setFilterPI] = useState("");
    const [filterCurrency, setFilterCurrency] = useState("");
    const [tab, setTab] = useState("DOMESTIC");        // DOMESTIC | INTERNATIONAL
    const [sourceFilter, setSourceFilter] = useState(""); // "" = all PI sources

    // Create Modal State
    const [createModal, setCreateModal] = useState({
        open: false,
        proforma_invoice: "",
        client_name: "",
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_mode: "TT",
        reference_number: "",
        remarks: "",
        piCurrency: "INR",
        piConversionRate: 1
    });
    const [createLoading, setCreateLoading] = useState(false);

    // Adjust Modal State
    const [adjustModal, setAdjustModal] = useState({
        open: false,
        advanceId: null,
        advanceNumber: "",
        clientName: "",
        piNumber: "",
        remaining: 0,
        amount: "",
        currency: "INR"
    });
    const [adjustLoading, setAdjustLoading] = useState(false);

    // Fetch Advance Payments
    const fetchAdvances = async () => {
        setLoading(true);
        try {
            const params = {
                'proforma_invoice__trade_type': tab,
                ...(sourceFilter && { 'proforma_invoice__source': sourceFilter }),
                ...(filterStatus && { status: filterStatus }),
                ...(filterPI && { search: filterPI }),
                ...(filterCurrency && { currency: filterCurrency })
            };
            const data = await getAdvancePayments(params);
            setAdvances(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error("Failed to fetch advance payments:", error);
            setAlert({ open: true, type: "error", message: "Failed to load advance payments" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvances();
    }, [filterStatus, filterPI, filterCurrency, tab, sourceFilter]);

    const handleTabChange = (_, newTab) => {
        if (!newTab || newTab === tab) return;
        setTab(newTab);
        setSourceFilter("");
    };

    // Handle Create Advance Payment
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!createModal.proforma_invoice) {
            setAlert({ open: true, type: "error", message: "Please select a Proforma Invoice" });
            return;
        }
        if (!createModal.client_name?.trim()) {
            setAlert({ open: true, type: "error", message: "Client Name is required" });
            return;
        }
        if (!createModal.amount || parseFloat(createModal.amount) <= 0) {
            setAlert({ open: true, type: "error", message: "Amount must be greater than 0" });
            return;
        }
        if (!createModal.payment_date) {
            setAlert({ open: true, type: "error", message: "Payment Date is required" });
            return;
        }
        setCreateLoading(true);
        try {
            const payload = {
                proforma_invoice: createModal.proforma_invoice,
                client_name: createModal.client_name,
                amount: parseFloat(createModal.amount),
                payment_date: createModal.payment_date,
                payment_mode: createModal.payment_mode,
                reference_number: createModal.reference_number,
                remarks: createModal.remarks
            };
            await createAdvancePayment(payload);
            setAlert({ open: true, type: "success", message: "Advance payment recorded successfully" });
            setCreateModal({
                open: false,
                proforma_invoice: "",
                client_name: "",
                amount: "",
                payment_date: new Date().toISOString().split("T")[0],
                payment_mode: "TT",
                reference_number: "",
                remarks: "",
                piCurrency: "INR",
                piConversionRate: 1
            });
            fetchAdvances();
        } catch (error) {
            console.error("Failed to record advance payment:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to record advance payment";
            setAlert({ open: true, type: "error", message: errorMsg });
        } finally {
            setCreateLoading(false);
        }
    };

    // Handle Adjust Advance Payment
    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        const adjustAmt = parseFloat(adjustModal.amount);
        if (isNaN(adjustAmt) || adjustAmt <= 0) {
            setAlert({ open: true, type: "error", message: "Please enter a valid amount" });
            return;
        }
        if (adjustAmt > adjustModal.remaining) {
            setAlert({ open: true, type: "error", message: `Amount cannot exceed remaining balance of ${formatCurrency(adjustModal.remaining, adjustModal.currency)}` });
            return;
        }
        setAdjustLoading(true);
        try {
            await adjustAdvancePayment(adjustModal.advanceId, { amount: adjustAmt });
            setAlert({ open: true, type: "success", message: "Advance adjustment recorded successfully" });
            setAdjustModal({
                open: false,
                advanceId: null,
                advanceNumber: "",
                clientName: "",
                piNumber: "",
                remaining: 0,
                amount: "",
                currency: "INR"
            });
            fetchAdvances();
        } catch (error) {
            console.error("Failed to adjust advance:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to adjust advance payment";
            setAlert({ open: true, type: "error", message: errorMsg });
        } finally {
            setAdjustLoading(false);
        }
    };

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
        const sym = getCurrencySymbol(c);
        return `${sym} ${Number(amount || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getStatusChipProps = (status) => {
        switch (status) {
            case 'ACTIVE': return { color: "success", variant: "outlined" };
            case 'ADJUSTED': return { color: "primary", variant: "outlined" };
            case 'USED': return { color: "default", variant: "outlined" };
            default: return { color: "default", variant: "outlined" };
        }
    };

    // Derived Statistics
    const totalAdvanceAmount = advances.reduce((sum, item) => sum + parseFloat(item.amount_inr || item.amount || 0), 0);
    const totalRemainingAmount = advances.reduce((sum, item) => sum + parseFloat((item.remaining * (item.conversion_rate || 1)) || item.remaining || 0), 0);
    const totalUsedAmount = totalAdvanceAmount - totalRemainingAmount;

    const labelSx = {
        fontSize: "10px",
        fontWeight: 800,
        color: "text.secondary",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        mb: 1,
    };

    return (
        <>
            <Box sx={{ maxWidth: 1200, mx: "auto", py: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Header */}
                <Card
                    variant="outlined"
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        alignItems: { md: "center" },
                        justifyContent: "space-between",
                        gap: 2,
                        bgcolor: "#fff",
                    }}
                >
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary", display: "flex", alignItems: "center", gap: 1.5 }}>
                            <CoinsIcon sx={{ color: "#f59e0b" }} />
                            PI Advance Payments
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, fontWeight: 500 }}>
                            Record, track, and adjust client advance payments received against proforma invoices
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setCreateModal(prev => ({ ...prev, open: true }))}
                            sx={{
                                bgcolor: "#1565C0",
                                fontWeight: 900,
                                fontSize: "0.8rem",
                                borderRadius: 2.5,
                                textTransform: "uppercase",
                                px: 3,
                                py: 1.2,
                                boxShadow: "0 4px 14px rgba(21,101,192,0.25)",
                                "&:hover": { bgcolor: "#1256a3" },
                            }}
                        >
                            Record Advance
                        </Button>
                    </Box>
                </Card>

                {/* Domestic / International tabs + PI source filter */}
                <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: "#fff", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <ToggleButtonGroup
                        exclusive
                        value={tab}
                        onChange={handleTabChange}
                        sx={{
                            bgcolor: "#f1f5f9", borderRadius: 2.5, p: 0.5,
                            "& .MuiToggleButton-root": {
                                textTransform: "none", fontWeight: 800, fontSize: "0.8rem", px: 2.5, py: 0.7, gap: 0.75,
                                border: "none", borderRadius: "9px !important", color: "#64748b",
                                "&.Mui-selected": {
                                    bgcolor: "#fff", color: "#1565C0", boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                                    "&:hover": { bgcolor: "#fff" },
                                },
                            },
                        }}
                    >
                        <ToggleButton value="DOMESTIC"><HomeWorkIcon sx={{ fontSize: 18 }} />Domestic</ToggleButton>
                        <ToggleButton value="INTERNATIONAL"><PublicIcon sx={{ fontSize: 18 }} />International</ToggleButton>
                    </ToggleButtonGroup>

                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {SOURCES.map((s) => {
                            const active = sourceFilter === s.value;
                            return (
                                <Chip
                                    key={s.value || "all"}
                                    label={s.label}
                                    clickable
                                    onClick={() => setSourceFilter(s.value)}
                                    sx={{
                                        fontWeight: 800, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em",
                                        borderRadius: 2, height: 30,
                                        bgcolor: active ? "#1565C0" : "#fff",
                                        color: active ? "#fff" : "#475569",
                                        border: "1px solid", borderColor: active ? "#1565C0" : "#e2e8f0",
                                        "&:hover": { bgcolor: active ? "#1256a3" : "#f1f5f9" },
                                    }}
                                />
                            );
                        })}
                    </Box>
                </Card>

                {/* Statistics Cards */}
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} lg={3}>
                        <Card variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "#fff", "&:hover": { boxShadow: 2 }, transition: "box-shadow 0.2s" }}>
                            <Typography sx={{ fontSize: "10px", color: "text.secondary", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.1em", mb: 0.5 }}>
                                Total Advances Received
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: "text.primary" }}>
                                {formatCurrency(totalAdvanceAmount, 'INR')}
                            </Typography>
                            <Typography sx={{ fontSize: "10px", color: "text.secondary", fontWeight: 700, mt: 0.5, textTransform: "uppercase" }}>
                                INR Valuation
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                        <Card variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "#ecfdf5", borderColor: "#d1fae5", "&:hover": { boxShadow: 2 }, transition: "box-shadow 0.2s" }}>
                            <Typography sx={{ fontSize: "10px", color: "#059669", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.1em", mb: 0.5 }}>
                                Total Remaining Balance
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: "#047857" }}>
                                {formatCurrency(totalRemainingAmount, 'INR')}
                            </Typography>
                            <Typography sx={{ fontSize: "10px", color: "#10b981", fontWeight: 700, mt: 0.5, textTransform: "uppercase" }}>
                                Available to adjust
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                        <Card variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "#eff6ff", borderColor: "#dbeafe", "&:hover": { boxShadow: 2 }, transition: "box-shadow 0.2s" }}>
                            <Typography sx={{ fontSize: "10px", color: "#2563eb", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.1em", mb: 0.5 }}>
                                Total Used / Adjusted
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: "#1d4ed8" }}>
                                {formatCurrency(totalUsedAmount, 'INR')}
                            </Typography>
                            <Typography sx={{ fontSize: "10px", color: "#3b82f6", fontWeight: 700, mt: 0.5, textTransform: "uppercase" }}>
                                Injected into bills
                            </Typography>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                        <Card variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "#fffbeb", borderColor: "#fef3c7", "&:hover": { boxShadow: 2 }, transition: "box-shadow 0.2s" }}>
                            <Typography sx={{ fontSize: "10px", color: "#d97706", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.1em", mb: 0.5 }}>
                                Total Active Payments
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: "#b45309" }}>
                                {advances.length}
                            </Typography>
                            <Typography sx={{ fontSize: "10px", color: "#f59e0b", fontWeight: 700, mt: 0.5, textTransform: "uppercase" }}>
                                Tracking records
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>

                {/* Filters */}
                <Card variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "#fff" }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Typography sx={labelSx}>Filter by Status</Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    displayEmpty
                                    sx={{ borderRadius: 2.5, bgcolor: "#FAFBFC", fontWeight: 600, fontSize: "0.875rem" }}
                                >
                                    <MenuItem value="">All Statuses</MenuItem>
                                    <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                                    <MenuItem value="ADJUSTED">ADJUSTED</MenuItem>
                                    <MenuItem value="USED">USED</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography sx={labelSx}>Filter by Currency</Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={filterCurrency}
                                    onChange={(e) => setFilterCurrency(e.target.value)}
                                    displayEmpty
                                    sx={{ borderRadius: 2.5, bgcolor: "#FAFBFC", fontWeight: 600, fontSize: "0.875rem" }}
                                >
                                    <MenuItem value="">All Currencies</MenuItem>
                                    <MenuItem value="INR">INR</MenuItem>
                                    <MenuItem value="USD">USD</MenuItem>
                                    <MenuItem value="EUR">EUR</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 1 }}>
                                <Typography sx={{ ...labelSx, mb: 0 }}>Filter by Proforma Invoice</Typography>
                                {(filterPI || filterStatus || filterCurrency) && (
                                    <Button
                                        size="small"
                                        color="error"
                                        onClick={() => { setFilterPI(""); setFilterStatus("ACTIVE"); setFilterCurrency(""); }}
                                        startIcon={<CloseIcon sx={{ fontSize: 12 }} />}
                                        sx={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", minWidth: "auto", p: 0 }}
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </Box>
                            <TextField
                                fullWidth
                                size="small"
                                value={filterPI}
                                onChange={(e) => setFilterPI(e.target.value)}
                                placeholder="Search by PI Number or Client..."
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2.5, bgcolor: "#FAFBFC", fontWeight: 500, fontSize: "0.875rem" },
                                }}
                            />
                        </Grid>
                    </Grid>
                </Card>

                {/* Table */}
                <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", bgcolor: "#fff" }}>
                    <TableContainer>
                        <Table sx={{
                            "& .MuiTableCell-root": { fontSize: "0.78rem" },
                            "& .MuiTypography-body2": { fontSize: "0.78rem" },
                            "& .MuiTypography-caption": { fontSize: "0.66rem" },
                        }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: "#FAFBFC" }}>
                                    <TableCell sx={{ fontWeight: 700, fontSize: "11px", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>Advance Ref</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: "11px", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>Proforma Invoice</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: "11px", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>Client Info</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "11px", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Advance</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: "11px", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>Used & Remaining</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "11px", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>Payment Info</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "11px", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "11px", color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && advances.length === 0 ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={8} sx={{ py: 4 }}>
                                                <Box sx={{ height: 16, bgcolor: "#f1f5f9", borderRadius: 1, width: "100%", animation: "pulse 1.5s ease-in-out infinite", "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.5 } } }} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : advances.length > 0 ? (
                                    advances.map((item) => (
                                        <TableRow key={item.id} hover sx={{ "&:hover": { bgcolor: "#FAFBFC" } }}>
                                            <TableCell>
                                                <Chip
                                                    label={item.advance_number}
                                                    size="small"
                                                    sx={{
                                                        fontFamily: "monospace",
                                                        fontWeight: 700,
                                                        fontSize: "0.75rem",
                                                        bgcolor: "#fffbeb",
                                                        color: "#b45309",
                                                        border: "1px solid #fef3c7",
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontFamily: "monospace", fontWeight: 600, color: "text.primary", fontSize: "0.75rem" }}>
                                                    {item.pi_number}
                                                </Typography>
                                                {item.pi_source_display && (
                                                    <Chip
                                                        label={item.pi_source_display}
                                                        size="small"
                                                        sx={{ mt: 0.5, height: 18, fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", bgcolor: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe" }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <PersonIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                                    <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "text.primary" }}>
                                                        {item.client_name}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography sx={{ fontSize: "0.875rem", fontWeight: 900, color: "text.primary" }}>
                                                    {formatCurrency(item.amount, item.currency)}
                                                </Typography>
                                                {item.currency !== 'INR' && (
                                                    <Typography sx={{ fontSize: "10px", color: "#2563eb", fontWeight: 700 }}>
                                                        {formatCurrency(item.amount_inr || (item.amount * (item.conversion_rate || 1)), 'INR')}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669" }}>
                                                    Rem: {formatCurrency(item.remaining, item.currency)}
                                                </Typography>
                                                <Typography sx={{ fontSize: "10px", color: "text.disabled", fontWeight: 500, mt: 0.25 }}>
                                                    Used: {formatCurrency(item.amount_used || 0, item.currency)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                        <CalendarIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "text.secondary", whiteSpace: "nowrap" }}>
                                                            {item.payment_date}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={item.payment_mode}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            fontSize: "9px",
                                                            fontWeight: 800,
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.1em",
                                                            height: 20,
                                                        }}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={item.status}
                                                    size="small"
                                                    {...getStatusChipProps(item.status)}
                                                    sx={{
                                                        fontSize: "10px",
                                                        fontWeight: 800,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.1em",
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title={parseFloat(item.remaining) <= 0 ? "Advance Fully Adjusted" : "Adjust / Use Advance"}>
                                                    <span>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<SwapIcon sx={{ fontSize: 14 }} />}
                                                            disabled={item.status === 'ADJUSTED' || item.status === 'USED' || parseFloat(item.remaining) <= 0}
                                                            onClick={() => setAdjustModal({
                                                                open: true,
                                                                advanceId: item.id,
                                                                advanceNumber: item.advance_number,
                                                                clientName: item.client_name,
                                                                piNumber: item.pi_number,
                                                                remaining: item.remaining,
                                                                amount: "",
                                                                currency: item.currency || "INR"
                                                            })}
                                                            sx={{
                                                                fontSize: "0.75rem",
                                                                fontWeight: 700,
                                                                borderRadius: 2,
                                                                textTransform: "none",
                                                                borderColor: "#1565C0",
                                                                color: "#1565C0",
                                                                "&:hover": { bgcolor: "#1565C0", color: "#fff", borderColor: "#1565C0" },
                                                                "&.Mui-disabled": { borderColor: "#e2e8f0", color: "#cbd5e1" },
                                                            }}
                                                        >
                                                            Adjust
                                                        </Button>
                                                    </span>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} sx={{ py: 10 }}>
                                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                                                <Box sx={{ width: 80, height: 80, bgcolor: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <SearchIcon sx={{ fontSize: 36, color: "#cbd5e1" }} />
                                                </Box>
                                                <Typography sx={{ color: "text.secondary", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.875rem" }}>
                                                    No advance payments found
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    onClick={() => { setFilterPI(""); setFilterStatus(""); setFilterCurrency(""); }}
                                                    sx={{ color: "#1565C0", fontWeight: 800, textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.1em", mt: 1 }}
                                                >
                                                    Show All Records
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            </Box>

            {/* Create Modal */}
            <Dialog
                open={createModal.open}
                onClose={() => setCreateModal(prev => ({ ...prev, open: false }))}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
            >
                <DialogTitle
                    sx={{
                        bgcolor: "#0f172a",
                        color: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        p: 3,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <CoinsIcon sx={{ color: "#fbbf24" }} />
                        <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
                            Record Advance Payment
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, mt: 0.5, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Always created against a Proforma Invoice
                    </Typography>
                </DialogTitle>
                <form onSubmit={handleCreateSubmit}>
                    <DialogContent sx={{ p: 4, bgcolor: "#FAFBFC", display: "flex", flexDirection: "column", gap: 2.5, maxHeight: "70vh", overflowY: "auto" }}>
                        <Box>
                            <Typography sx={labelSx}>Select Proforma Invoice *</Typography>
                            <PISelector
                                value={createModal.proforma_invoice}
                                onChange={(id, selectedWO) => {
                                    setCreateModal(prev => ({
                                        ...prev,
                                        proforma_invoice: id,
                                        client_name: selectedWO ? selectedWO.client_name : prev.client_name,
                                        piCurrency: selectedWO?.currency || "INR",
                                        piConversionRate: selectedWO?.conversion_rate || 1
                                    }));
                                }}
                                placeholder="Search PI by Number or Client..."
                            />
                        </Box>

                        <Box>
                            <Typography sx={labelSx}>Client Name *</Typography>
                            <TextField
                                fullWidth
                                required
                                size="small"
                                value={createModal.client_name}
                                onChange={(e) => setCreateModal(prev => ({ ...prev, client_name: e.target.value }))}
                                placeholder="E.g. ABC International..."
                                InputProps={{ sx: { borderRadius: 2.5, bgcolor: "#fff", fontWeight: 700, fontSize: "0.875rem" } }}
                            />
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography sx={labelSx}>Amount ({createModal.piCurrency}) *</Typography>
                                <TextField
                                    fullWidth
                                    required
                                    size="small"
                                    type="number"
                                    inputProps={{ step: "0.01", min: "0" }}
                                    value={createModal.amount}
                                    onChange={(e) => setCreateModal(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="0.00"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Typography sx={{ fontWeight: 700, color: "text.secondary" }}>
                                                    {getCurrencySymbol(createModal.piCurrency)}
                                                </Typography>
                                            </InputAdornment>
                                        ),
                                        sx: { borderRadius: 2.5, bgcolor: "#fff", fontWeight: 700, fontSize: "0.875rem" },
                                    }}
                                />
                                {createModal.piCurrency !== 'INR' && parseFloat(createModal.piConversionRate) > 0 && createModal.amount && (
                                    <Typography sx={{ fontSize: "10px", color: "#2563eb", fontWeight: 700, mt: 0.5, fontStyle: "italic" }}>
                                        {"≈"} {"₹"}{(parseFloat(createModal.amount || 0) * parseFloat(createModal.piConversionRate)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={6}>
                                <Typography sx={labelSx}>Payment Mode *</Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={createModal.payment_mode}
                                        onChange={(e) => setCreateModal(prev => ({ ...prev, payment_mode: e.target.value }))}
                                        sx={{ borderRadius: 2.5, bgcolor: "#fff", fontWeight: 700, fontSize: "0.875rem" }}
                                    >
                                        <MenuItem value="TT">TT</MenuItem>
                                        <MenuItem value="CASH">CASH</MenuItem>
                                        <MenuItem value="NEFT">NEFT</MenuItem>
                                        <MenuItem value="CHEQUE">CHEQUE</MenuItem>
                                        <MenuItem value="BANK_TRANSFER">BANK TRANSFER</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography sx={labelSx}>Reference Number</Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={createModal.reference_number}
                                    onChange={(e) => setCreateModal(prev => ({ ...prev, reference_number: e.target.value }))}
                                    placeholder="E.g. TT-REF-001..."
                                    InputProps={{ sx: { borderRadius: 2.5, bgcolor: "#fff", fontWeight: 700, fontSize: "0.875rem" } }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography sx={labelSx}>Payment Date *</Typography>
                                <TextField
                                    fullWidth
                                    required
                                    size="small"
                                    type="date"
                                    value={createModal.payment_date}
                                    onChange={(e) => setCreateModal(prev => ({ ...prev, payment_date: e.target.value }))}
                                    InputProps={{ sx: { borderRadius: 2.5, bgcolor: "#fff", fontWeight: 700, fontSize: "0.875rem" } }}
                                />
                            </Grid>
                        </Grid>

                        <Box>
                            <Typography sx={labelSx}>Remarks</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                multiline
                                rows={3}
                                value={createModal.remarks}
                                onChange={(e) => setCreateModal(prev => ({ ...prev, remarks: e.target.value }))}
                                placeholder="Remarks or payment terms..."
                                InputProps={{ sx: { borderRadius: 2.5, bgcolor: "#fff", fontWeight: 700, fontSize: "0.875rem" } }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, borderTop: "1px solid #e2e8f0", gap: 1.5 }}>
                        <Button
                            onClick={() => setCreateModal(prev => ({ ...prev, open: false }))}
                            sx={{
                                flex: 1,
                                fontWeight: 800,
                                fontSize: "0.75rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: "text.secondary",
                                borderRadius: 2.5,
                                py: 1.2,
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={createLoading}
                            startIcon={createLoading ? <CircularProgress size={16} color="inherit" /> : null}
                            sx={{
                                flex: 2,
                                bgcolor: "#1565C0",
                                fontWeight: 800,
                                fontSize: "0.75rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                borderRadius: 2.5,
                                py: 1.4,
                                boxShadow: "0 4px 14px rgba(21,101,192,0.25)",
                                "&:hover": { bgcolor: "#1256a3" },
                            }}
                        >
                            {createLoading ? "Recording..." : "Record Advance"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Adjust Modal */}
            <Dialog
                open={adjustModal.open}
                onClose={() => setAdjustModal(prev => ({ ...prev, open: false }))}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
            >
                <DialogTitle
                    sx={{
                        bgcolor: "#0f172a",
                        color: "#fff",
                        p: 3,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <SwapIcon sx={{ color: "#60a5fa" }} />
                        <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
                            Adjust Advance Payment
                        </Typography>
                    </Box>
                    <Box sx={{ mt: 2, borderTop: "1px solid rgba(255,255,255,0.1)", pt: 2, display: "flex", flexDirection: "column", gap: 0.75 }}>
                        <Typography sx={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                            Advance Number: <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#fff" }}>{adjustModal.advanceNumber}</Box>
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                            Client: <Box component="span" sx={{ fontWeight: 700, color: "#fff" }}>{adjustModal.clientName}</Box>
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                            Proforma Invoice: <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#fff" }}>{adjustModal.piNumber}</Box>
                        </Typography>
                    </Box>
                </DialogTitle>
                <form onSubmit={handleAdjustSubmit}>
                    <DialogContent sx={{ p: 4, bgcolor: "#FAFBFC", display: "flex", flexDirection: "column", gap: 2.5 }}>
                        <Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography sx={labelSx}>Amount to Adjust ({adjustModal.currency}) *</Typography>
                                <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>
                                    Available: {formatCurrency(adjustModal.remaining, adjustModal.currency)}
                                </Typography>
                            </Box>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                inputProps={{ step: "0.01", min: "0.01", max: adjustModal.remaining }}
                                value={adjustModal.amount}
                                onChange={(e) => setAdjustModal(prev => ({ ...prev, amount: e.target.value }))}
                                placeholder="0.00"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Typography sx={{ fontWeight: 700, color: "text.secondary", fontSize: "1.1rem" }}>
                                                {getCurrencySymbol(adjustModal.currency)}
                                            </Typography>
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2.5, bgcolor: "#fff", fontWeight: 900, fontSize: "1.25rem" },
                                }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, borderTop: "1px solid #e2e8f0", gap: 1.5 }}>
                        <Button
                            onClick={() => setAdjustModal(prev => ({ ...prev, open: false }))}
                            sx={{
                                flex: 1,
                                fontWeight: 800,
                                fontSize: "0.75rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: "text.secondary",
                                borderRadius: 2.5,
                                py: 1.2,
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={adjustLoading}
                            startIcon={adjustLoading ? <CircularProgress size={16} color="inherit" /> : null}
                            sx={{
                                flex: 2,
                                bgcolor: "#1565C0",
                                fontWeight: 800,
                                fontSize: "0.75rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                borderRadius: 2.5,
                                py: 1.4,
                                boxShadow: "0 4px 14px rgba(21,101,192,0.25)",
                                "&:hover": { bgcolor: "#1256a3" },
                            }}
                        >
                            {adjustLoading ? "Adjusting..." : "Confirm Adjustment"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <AlertToast
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ ...alert, open: false })}
            />

            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                message={confirm.description}
                onConfirm={confirm.action}
                onCancel={() => setConfirm({ ...confirm, open: false })}
            />
        </>
    );
};

export default PiAdvance;
