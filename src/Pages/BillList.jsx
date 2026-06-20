import React, { useState, useEffect } from "react";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import BillDetailsModal from "../components/sales/BillDetailsModal";
import { getBills, getBillsSummary, getBillById, markBillAsPaid, cancelBill, getBillReport, getOutstandingReport, getBillPaymentHistory } from "../services/salesService";
import PasswordConfirmModal from "../components/ui/PasswordConfirmModal";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useSearchParams } from "react-router-dom";

// MUI Components
import {
    Box,
    Card,
    Typography,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Chip,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    RadioGroup,
    Radio,
    FormControlLabel,
    LinearProgress,
    Skeleton,
    Paper,
    ToggleButton,
    ToggleButtonGroup,
    Menu,
    ListItemIcon,
    ListItemText
} from "@mui/material";

// MUI Icons
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PaymentIcon from "@mui/icons-material/Payment";
import CancelIcon from "@mui/icons-material/Cancel";
import DescriptionIcon from "@mui/icons-material/Description";
import HistoryIcon from "@mui/icons-material/History";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PublicIcon from "@mui/icons-material/Public";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const SOURCES = [
    { value: "", label: "All Sources" },
    { value: "REQUISITION", label: "Requisition" },
    { value: "STOCK_SALE", label: "Stock" },
    { value: "DIRECT", label: "Direct" },
];

const BillList = () => {
    const [searchParams] = useSearchParams();
    // Data State
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);

    // Filter State
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPI, setFilterPI] = useState("");
    const [tab, setTab] = useState("DOMESTIC");        // DOMESTIC | INTERNATIONAL
    const [sourceFilter, setSourceFilter] = useState(""); // "" = all PI sources
    const [summary, setSummary] = useState(null);

    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [confirm, setConfirm] = useState({ open: false, title: "", description: "", action: null });

    // Payment Modal State
    const [paymentModal, setPaymentModal] = useState({ open: false, bill: null, amount: "", currency: "INR", payment_date: "", payment_mode: "CASH", reference_number: "", remarks: "" });
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);
    const [passwordModal, setPasswordModal] = useState({ open: false, onConfirm: null, title: "", message: "", loading: false });

    // Details Modal State
    const [selectedBillId, setSelectedBillId] = useState(null);
    const [billDetails, setBillDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Payment History Modal State
    const [historyModal, setHistoryModal] = useState({ open: false, data: null, loading: false });

    // Row action menu (kebab)
    const [actionMenu, setActionMenu] = useState({ anchorEl: null, bill: null });
    const openActionMenu = (e, bill) => { e.stopPropagation(); setActionMenu({ anchorEl: e.currentTarget, bill }); };
    const closeActionMenu = () => setActionMenu({ anchorEl: null, bill: null });
    const runAction = (fn) => () => { const bill = actionMenu.bill; closeActionMenu(); fn(bill); };

    // Report State
    const [showReportModal, setShowReportModal] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [reportType, setReportType] = useState("bills");
    const [reportParams, setReportParams] = useState({
        start_date: "",
        end_date: "",
        status: "",
        aging: false
    });

    // Handle deep linking
    useEffect(() => {
        const id = searchParams.get("id");
        if (id) {
            handleViewDetails(id);
        }
    }, [searchParams]);

    const fetchBills = async (pageNum = 1) => {
        setLoading(true);
        try {
            const data = await getBills(pageNum, searchQuery, filterPI, tab, sourceFilter);
            if (data) {
                setBills(data.results || []);
                setTotalCount(data.count || 0);
                setNext(data.next);
                setPrevious(data.previous);
                setPage(pageNum);
            }
        } catch (error) {
            console.error("Failed to fetch bills", error);
            setAlert({ open: true, type: "error", message: "Failed to load bills" });
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const data = await getBillsSummary(searchQuery, tab, sourceFilter);
            setSummary(data);
        } catch (error) {
            console.error("Failed to fetch bills summary", error);
            setSummary(null);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchBills(page);
            fetchSummary();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, filterPI, page, tab, sourceFilter]);

    const handleTabChange = (_, newTab) => {
        if (!newTab || newTab === tab) return;
        setTab(newTab);
        setSourceFilter("");
        setPage(1);
    };

    const handleSourceChange = (val) => {
        setSourceFilter(val);
        setPage(1);
    };

    const handleNext = () => { if (next) setPage(p => p + 1); };
    const handlePrev = () => { if (previous) setPage(p => Math.max(1, p - 1)); };

    const handleViewDetails = async (id) => {
        setPaymentModal(prev => ({ ...prev, open: false }));
        setHistoryModal(prev => ({ ...prev, open: false }));
        setSelectedBillId(id);
        setDetailsLoading(true);
        try {
            const data = await getBillById(id);
            setBillDetails(data);
        } catch (error) {
            console.error("Failed to fetch bill details", error);
            setAlert({ open: true, type: "error", message: "Failed to load bill details" });
            setSelectedBillId(null);
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetailsModal = () => {
        setSelectedBillId(null);
        setBillDetails(null);
    };

    const handleCancelBill = (billId) => {
        setConfirm({
            open: true,
            title: "Cancel Bill?",
            description: "Are you sure you want to cancel this bill? This action cannot be undone.",
            action: () => {
                setConfirm(prev => ({ ...prev, open: false }));
                setPasswordModal({
                    open: true,
                    title: "Confirm Cancellation",
                    message: "Please enter your password to cancel this bill.",
                    loading: false,
                    onConfirm: async (password) => {
                        setPasswordModal(prev => ({ ...prev, loading: true }));
                        try {
                            const res = await cancelBill(billId, { confirm_password: password });
                            setAlert({ open: true, type: "success", message: res.message || "Bill cancelled successfully" });
                            fetchBills(page);
                            setPasswordModal({ open: false });
                        } catch (error) {
                            console.error("Failed to cancel bill", error);
                            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to cancel bill";
                            setAlert({ open: true, type: "error", message: errorMsg });
                            setPasswordModal(prev => ({ ...prev, loading: false }));
                        }
                    }
                });
            }
        });
    };

    const openPaymentModal = (bill) => {
        closeDetailsModal();
        setHistoryModal(prev => ({ ...prev, open: false }));
        const defaultAmount = parseFloat(bill.balance) > 0 ? bill.balance : "0.00";
        setPaymentModal({
            open: true,
            bill,
            amount: defaultAmount,
            currency: bill.currency || "INR",
            payment_date: new Date().toISOString().split("T")[0],
            payment_mode: "CASH",
            reference_number: "",
            remarks: ""
        });
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        setPasswordModal({
            open: true,
            title: "Confirm Payment",
            message: `Please enter your password to record this ${paymentModal.currency} payment.`,
            loading: false,
            onConfirm: async (password) => {
                setPasswordModal(prev => ({ ...prev, loading: true }));
                try {
                    const payload = {
                        confirm_password: password,
                        amount_paid: Number(parseFloat(paymentModal.amount).toFixed(2)),
                        payment_date: paymentModal.payment_date
                    };
                    const res = await markBillAsPaid(paymentModal.bill.id, payload);
                    setAlert({ open: true, type: "success", message: res.message || "Payment recorded successfully" });
                    setPaymentModal({ open: false, bill: null, amount: "", currency: "INR", payment_date: "", payment_mode: "CASH", reference_number: "", remarks: "" });
                    fetchBills(page);
                    setPasswordModal({ open: false });
                } catch (error) {
                    console.error("Payment failed", error);
                    const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to record payment";
                    setAlert({ open: true, type: "error", message: errorMsg });
                    setPasswordModal(prev => ({ ...prev, loading: false }));
                }
            }
        });
    };

    const handleViewHistory = async (bill) => {
        closeDetailsModal();
        setPaymentModal(prev => ({ ...prev, open: false }));
        setHistoryModal({ open: true, data: null, loading: true });
        try {
            const data = await getBillPaymentHistory(bill.id);
            setHistoryModal({ open: true, data: data, loading: false });
        } catch (error) {
            console.error("Failed to fetch history", error);
            setAlert({ open: true, type: "error", message: "Failed to fetch payment history" });
            setHistoryModal({ open: false, data: null, loading: false });
        }
    };

    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const wb = XLSX.utils.book_new();
            if (reportType === "outstanding") {
                const params = { aging: reportParams.aging };
                const data = await getOutstandingReport(params);
                const summary = data.summary || {};
                const billsList = data.bills || [];
                const sheetData = [
                    ["OUTSTANDING PAYMENTS REPORT"],
                    ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()],
                    [],
                    ["Summary: Total Quantity", summary.total_outstanding_bills || 0],
                    ["Summary: Total Amount", summary.total_outstanding_amount || 0],
                    [],
                    ["Bill Number", "Date", "PI Number", "Client Name", "Contact Person", "Phone", "Email", "Total Amount", "Paid Amount", "Balance Due", "Days Outstanding", "Status"]
                ];
                billsList.forEach(b => sheetData.push([b.bill_number, b.bill_date, b.pi_number, b.client_name, b.contact_person, b.phone, b.email, b.total_amount, b.amount_paid, b.balance, b.days_outstanding, b.status]));
                const ws = XLSX.utils.aoa_to_sheet(sheetData);
                XLSX.utils.book_append_sheet(wb, ws, "Outstanding");
            } else {
                const params = { ...reportParams };
                const data = await getBillReport(params);
                const summary = data.summary || {};
                const billsList = data.bills || [];
                const sheetData = [
                    ["PI BILL REPORT"],
                    ["Date Range:", `${data.date_range?.start_date} to ${data.date_range?.end_date}`],
                    ["Summary: Total Records", summary.total_bills],
                    ["Summary: Total Amount", summary.total_amount],
                    [],
                    ["Bill Number", "Date", "PI Number", "Client Name", "Amount", "Paid", "Balance", "Status"]
                ];
                billsList.forEach(b => sheetData.push([b.bill_number, b.bill_date, b.pi_number, b.client_name, b.total_amount, b.amount_paid, b.balance, b.status]));
                const ws = XLSX.utils.aoa_to_sheet(sheetData);
                XLSX.utils.book_append_sheet(wb, ws, "Bills");
            }
            const filename = `Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, filename);
            setShowReportModal(false);
            setAlert({ open: true, type: "success", message: "Report generated successfully" });
        } catch (error) {
            console.error("Failed to download report", error);
            setAlert({ open: true, type: "error", message: "Failed to download report" });
        } finally {
            setDownloading(false);
        }
    };

    const getCurrencySymbol = (code) => {
        switch (code?.toUpperCase()) {
            case "USD": return "$";
            case "EUR": return "€";
            case "GBP": return "£";
            case "JPY": return "¥";
            case "CAD": return "C$";
            case "AUD": return "A$";
            case "INR": return "₹";
            default: return code || "₹";
        }
    };

    const formatCurrency = (amount, curr = 'INR') => {
        const num = Number(amount || 0);
        const locale = curr?.toUpperCase() === 'INR' ? 'en-IN' : 'en-US';
        return `${getCurrencySymbol(curr)} ${num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split("-");
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${day} ${monthNames[parseInt(month, 10) - 1]} ${year}`;
        }
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString();
    };

    const getStatusChipProps = (status) => {
        switch (status) {
            case 'GENERATED':
                return { sx: { bgcolor: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 900, fontSize: '0.625rem', letterSpacing: '0.05em', textTransform: 'uppercase' } };
            case 'PAID':
                return { sx: { bgcolor: '#d1fae5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 900, fontSize: '0.625rem', letterSpacing: '0.05em', textTransform: 'uppercase' } };
            case 'CANCELLED':
                return { sx: { bgcolor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', fontWeight: 900, fontSize: '0.625rem', letterSpacing: '0.05em', textTransform: 'uppercase' } };
            default:
                return { sx: { bgcolor: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', fontWeight: 900, fontSize: '0.625rem', letterSpacing: '0.05em', textTransform: 'uppercase' } };
        }
    };

    return (
        <>
            <Box sx={{ width: '100%', py: 0.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Header */}
                <Card variant="outlined" sx={{ p: 3, borderRadius: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <ReceiptLongIcon sx={{ color: '#059669' }} />
                            PI Bills (Finance)
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontWeight: 500 }}>
                            Track client billing, outstanding balances, and financial records for all active proforma invoices
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<DescriptionIcon />}
                            onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
                                setReportParams({ start_date: thirtyDaysAgo, end_date: today, status: "", aging: false });
                                setReportType("bills");
                                setShowReportModal(true);
                            }}
                            sx={{
                                bgcolor: '#059669',
                                '&:hover': { bgcolor: '#10b981' },
                                fontWeight: 900,
                                fontSize: '0.75rem',
                                borderRadius: 3,
                                textTransform: 'uppercase',
                                px: 2.5,
                                py: 1.25,
                                boxShadow: '0 4px 14px 0 rgba(5,150,105,0.2)'
                            }}
                        >
                            Generate Report
                        </Button>
                        <Box sx={{ bgcolor: '#f8fafc', px: 2.5, py: 1, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                            <Typography sx={{ fontSize: '0.625rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Total Bills
                            </Typography>
                            <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', lineHeight: 1.2 }}>
                                {totalCount}
                            </Typography>
                        </Box>
                    </Box>
                </Card>

                {/* Category tabs + PI source filter + summary cards */}
                <Card variant="outlined" sx={{ p: 3, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        {/* Domestic / International tabs */}
                        <ToggleButtonGroup
                            exclusive
                            value={tab}
                            onChange={handleTabChange}
                            sx={{
                                bgcolor: '#f1f5f9', borderRadius: 3, p: 0.5,
                                '& .MuiToggleButton-root': {
                                    textTransform: 'none', fontWeight: 800, fontSize: '0.8rem', px: 2.5, py: 0.8, gap: 0.75,
                                    border: 'none', borderRadius: '10px !important', color: '#64748b',
                                    '&.Mui-selected': {
                                        bgcolor: '#fff', color: '#059669', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                                        '&:hover': { bgcolor: '#fff' },
                                    },
                                },
                            }}
                        >
                            <ToggleButton value="DOMESTIC"><HomeWorkIcon sx={{ fontSize: 18 }} />Domestic</ToggleButton>
                            <ToggleButton value="INTERNATIONAL"><PublicIcon sx={{ fontSize: 18 }} />International</ToggleButton>
                        </ToggleButtonGroup>

                        {/* PI source chips */}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {SOURCES.map((s) => {
                                const active = sourceFilter === s.value;
                                return (
                                    <Chip
                                        key={s.value || 'all'}
                                        label={s.label}
                                        clickable
                                        onClick={() => handleSourceChange(s.value)}
                                        sx={{
                                            fontWeight: 800, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                                            borderRadius: 2, height: 30,
                                            bgcolor: active ? '#059669' : '#fff',
                                            color: active ? '#fff' : '#475569',
                                            border: '1px solid', borderColor: active ? '#059669' : '#e2e8f0',
                                            '&:hover': { bgcolor: active ? '#047857' : '#f1f5f9' },
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>

                    {/* Summary cards */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                        {[
                            { label: 'Bills', value: summary ? summary.count : '—', color: '#1e293b', bg: '#f8fafc', bd: '#e2e8f0' },
                            { label: 'Total Billed', value: summary ? formatCurrency(summary.total_billed, 'INR') : '—', color: '#1d4ed8', bg: '#eff6ff', bd: '#bfdbfe' },
                            { label: 'Received', value: summary ? formatCurrency(summary.total_received, 'INR') : '—', color: '#047857', bg: '#ecfdf5', bd: '#a7f3d0' },
                            { label: 'Outstanding', value: summary ? formatCurrency(summary.total_outstanding, 'INR') : '—', color: '#c2410c', bg: '#fff7ed', bd: '#fed7aa' },
                        ].map((c) => (
                            <Box key={c.label} sx={{ p: 2, borderRadius: 3, bgcolor: c.bg, border: '1px solid', borderColor: c.bd }}>
                                <Typography sx={{ fontSize: '0.625rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                                    {c.label}
                                </Typography>
                                <Typography sx={{ fontSize: '1.15rem', fontWeight: 900, color: c.color, lineHeight: 1.2 }}>
                                    {c.value}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                    {tab === 'INTERNATIONAL' && (
                        <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, fontStyle: 'italic' }}>
                            * International totals shown as INR equivalent (converted at each bill's PI conversion rate).
                        </Typography>
                    )}
                </Card>

                {/* Filters */}
                <Card variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 2fr' }, gap: 3 }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
                                Search Bill No. / Client
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="E.g. BILL/2026/001..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                        bgcolor: '#f8fafc',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        '&:hover fieldset': { borderColor: '#059669' },
                                        '&.Mui-focused fieldset': { borderColor: '#059669' },
                                    }
                                }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                            {searchQuery && (
                                <Button
                                    size="small"
                                    startIcon={<CloseIcon sx={{ fontSize: 12 }} />}
                                    onClick={() => { setFilterPI(""); setSearchQuery(""); setPage(1); }}
                                    sx={{
                                        color: '#ef4444',
                                        fontSize: '0.625rem',
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        mb: 1,
                                        '&:hover': { color: '#dc2626', bgcolor: 'transparent' }
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Card>

                {/* Table Area */}
                <Card variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table sx={{
                            '& .MuiTableCell-root': { fontSize: '0.78rem' },
                            '& .MuiTypography-body2': { fontSize: '0.78rem' },
                            '& .MuiTypography-caption': { fontSize: '0.66rem' },
                        }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'rgba(248,250,252,0.8)' }}>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bill Reference</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Info</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Balance</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && bills.length === 0 ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={7} sx={{ py: 5 }}>
                                                <Skeleton variant="rectangular" height={16} sx={{ borderRadius: 1 }} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : bills.length > 0 ? (
                                    bills.map((bill) => (
                                        <TableRow key={bill.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <TableCell sx={{ py: 2 }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography
                                                        component="span"
                                                        sx={{
                                                            fontFamily: 'monospace',
                                                            fontWeight: 700,
                                                            color: '#047857',
                                                            bgcolor: '#ecfdf5',
                                                            px: 1,
                                                            py: 0.25,
                                                            borderRadius: 1,
                                                            border: '1px solid #a7f3d0',
                                                            alignSelf: 'flex-start',
                                                            fontSize: '0.75rem',
                                                            mb: 0.5
                                                        }}
                                                    >
                                                        {bill.bill_number}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        PI: <Box component="span" sx={{ color: '#475569' }}>{bill.pi_number}</Box>
                                                    </Typography>
                                                    {bill.pi_source_display && (
                                                        <Chip
                                                            label={bill.pi_source_display}
                                                            size="small"
                                                            sx={{ alignSelf: 'flex-start', mt: 0.5, height: 18, fontSize: '0.5625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', bgcolor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}
                                                        />
                                                    )}
                                                    <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                                                        <CalendarTodayIcon sx={{ fontSize: 10 }} />
                                                        {bill.bill_date}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                        <PersonIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                                                        {bill.client_name}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 500 }}>
                                                        {bill.contact_person}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 2 }}>
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                                                    {formatCurrency(bill.total_amount, bill.currency)}
                                                </Typography>
                                                {bill.currency && bill.currency !== 'INR' && bill.conversion_rate && (
                                                    <Typography sx={{ fontSize: '0.625rem', color: '#2563eb', fontWeight: 700 }}>
                                                        1 {bill.currency} = {"₹"}{parseFloat(bill.conversion_rate)}
                                                    </Typography>
                                                )}
                                                <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.025em' }}>
                                                    Net Payable
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 2 }}>
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#059669' }}>
                                                    {formatCurrency(bill.amount_paid, bill.currency)}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.025em' }}>
                                                    Total Collected
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 2 }}>
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 900, color: parseFloat(bill.balance) > 0 ? '#dc2626' : '#059669' }}>
                                                    {formatCurrency(bill.balance, bill.currency)}
                                                </Typography>
                                                {parseFloat(bill.balance) > 0 && (
                                                    <Box sx={{ width: 64, height: 4, bgcolor: '#f1f5f9', borderRadius: 2, mt: 0.75, ml: 'auto', overflow: 'hidden' }}>
                                                        <Box sx={{ height: '100%', bgcolor: '#f87171', width: `${Math.min(100, (bill.balance / bill.total_amount) * 100)}%` }} />
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 2 }}>
                                                <Chip
                                                    label={bill.status}
                                                    size="small"
                                                    {...getStatusChipProps(bill.status)}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                    <Tooltip title="Actions" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => openActionMenu(e, bill)}
                                                            sx={{ color: '#475569', '&:hover': { bgcolor: '#f1f5f9' }, borderRadius: 2 }}
                                                        >
                                                            <MoreVertIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} sx={{ py: 10, textAlign: 'center' }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 80, height: 80, bgcolor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                                    <SearchIcon sx={{ fontSize: 40 }} />
                                                </Box>
                                                <Typography sx={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.875rem' }}>
                                                    No billing records found
                                                </Typography>
                                                <Button
                                                    onClick={() => { setSearchQuery(""); setPage(1); }}
                                                    sx={{
                                                        color: '#059669',
                                                        fontWeight: 900,
                                                        textTransform: 'uppercase',
                                                        fontSize: '0.625rem',
                                                        letterSpacing: '0.1em',
                                                        mt: 1,
                                                        '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' }
                                                    }}
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

                    {/* Pagination */}
                    <Box sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Showing <Box component="span" sx={{ color: '#1e293b' }}>{bills.length}</Box> of <Box component="span" sx={{ color: '#1e293b' }}>{totalCount}</Box> records
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ChevronLeftIcon />}
                                onClick={handlePrev}
                                disabled={!previous}
                                sx={{
                                    borderColor: '#e2e8f0',
                                    color: '#475569',
                                    fontWeight: 900,
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    borderRadius: 3,
                                    px: 2.5,
                                    '&:hover': { bgcolor: '#f8fafc', borderColor: '#e2e8f0' },
                                    '&.Mui-disabled': { opacity: 0.5 }
                                }}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                endIcon={<ChevronRightIcon />}
                                onClick={handleNext}
                                disabled={!next}
                                sx={{
                                    borderColor: '#e2e8f0',
                                    color: '#475569',
                                    fontWeight: 900,
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    borderRadius: 3,
                                    px: 2.5,
                                    '&:hover': { bgcolor: '#f8fafc', borderColor: '#e2e8f0' },
                                    '&.Mui-disabled': { opacity: 0.5 }
                                }}
                            >
                                Next Page
                            </Button>
                        </Box>
                    </Box>
                </Card>
            </Box>

            {/* Modals outside the animated container */}
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

            <PasswordConfirmModal
                open={passwordModal.open}
                title={passwordModal.title}
                message={passwordModal.message}
                loading={passwordModal.loading}
                onConfirm={passwordModal.onConfirm}
                onCancel={() => setPasswordModal({ open: false })}
            />

            {selectedBillId && (
                <BillDetailsModal
                    isOpen={!!selectedBillId}
                    onClose={closeDetailsModal}
                    loading={detailsLoading}
                    details={billDetails}
                />
            )}

            {/* Row action menu */}
            <Menu
                anchorEl={actionMenu.anchorEl}
                open={Boolean(actionMenu.anchorEl)}
                onClose={closeActionMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 210, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}
            >
                <MenuItem onClick={runAction((bill) => handleViewDetails(bill.id))}>
                    <ListItemIcon><VisibilityIcon sx={{ fontSize: 18, color: '#2563eb' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Quick View</ListItemText>
                </MenuItem>
                <MenuItem onClick={runAction((bill) => handleViewHistory(bill))}>
                    <ListItemIcon><HistoryIcon sx={{ fontSize: 18, color: '#d97706' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Collection History</ListItemText>
                </MenuItem>
                <MenuItem
                    disabled={actionMenu.bill?.status === 'PAID' || actionMenu.bill?.status === 'CANCELLED'}
                    onClick={runAction((bill) => openPaymentModal(bill))}
                >
                    <ListItemIcon><PaymentIcon sx={{ fontSize: 18, color: '#059669' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Record Payment</ListItemText>
                </MenuItem>
                <MenuItem
                    disabled={actionMenu.bill?.status === 'PAID' || actionMenu.bill?.status === 'CANCELLED'}
                    onClick={runAction((bill) => handleCancelBill(bill.id))}
                >
                    <ListItemIcon><CancelIcon sx={{ fontSize: 18, color: '#dc2626' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>Void Bill</ListItemText>
                </MenuItem>
            </Menu>

            {/* Payment Collection Modal */}
            <Dialog
                open={paymentModal.open}
                onClose={() => setPaymentModal({ open: false, bill: null, amount: "", payment_date: "", payment_mode: "NEFT", reference_number: "", remarks: "" })}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
            >
                <Box sx={{ bgcolor: '#0f172a', color: '#fff', p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PaymentIcon sx={{ color: '#34d399' }} /> Record Collection
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', pt: 2 }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, mb: 0.5 }}>
                                Bill Reference
                            </Typography>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#34d399' }}>
                                {paymentModal.bill?.bill_number}
                            </Typography>
                            <Typography sx={{ fontSize: '0.625rem', color: '#64748b', fontWeight: 700, mt: 0.5 }}>
                                Currency: <Box component="span" sx={{ color: '#60a5fa' }}>{paymentModal.bill?.currency || "INR"}</Box>
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, mb: 0.5 }}>
                                Due Balance
                            </Typography>
                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#f87171' }}>
                                {formatCurrency(paymentModal.bill?.balance, paymentModal.bill?.currency)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                <Box component="form" onSubmit={handlePaymentSubmit} sx={{ p: 4, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.625rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
                            Collected Amount ({paymentModal.bill?.currency || "INR"}) *
                        </Typography>
                        <TextField
                            fullWidth
                            type="number"
                            required
                            inputProps={{ step: "0.01", min: "0" }}
                            value={paymentModal.amount}
                            onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Typography sx={{ fontWeight: 700, color: '#94a3b8' }}>
                                            {getCurrencySymbol(paymentModal.bill?.currency)}
                                        </Typography>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    bgcolor: '#fff',
                                    fontSize: '1.25rem',
                                    fontWeight: 900,
                                    '&.Mui-focused fieldset': { borderColor: '#059669' },
                                }
                            }}
                        />
                        {paymentModal.bill?.currency && paymentModal.bill.currency !== 'INR' && paymentModal.bill?.conversion_rate && (
                            <Typography sx={{ mt: 1, fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontStyle: 'italic' }}>
                                Approx. {"₹"}{(parseFloat(paymentModal.amount || 0) * parseFloat(paymentModal.bill.conversion_rate)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (1 {paymentModal.bill.currency} = {"₹"}{parseFloat(paymentModal.bill.conversion_rate)})
                            </Typography>
                        )}
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.625rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
                            Collection Date *
                        </Typography>
                        <TextField
                            fullWidth
                            type="date"
                            required
                            value={paymentModal.payment_date}
                            onChange={(e) => setPaymentModal({ ...paymentModal, payment_date: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    bgcolor: '#fff',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    '&.Mui-focused fieldset': { borderColor: '#059669' },
                                }
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                        <Button
                            onClick={() => setPaymentModal({ open: false, bill: null, amount: "", payment_date: "", payment_mode: "CASH", reference_number: "", remarks: "" })}
                            sx={{
                                flex: 1,
                                py: 1.5,
                                fontSize: '0.75rem',
                                fontWeight: 900,
                                color: '#64748b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                borderRadius: 3,
                                '&:hover': { bgcolor: '#f1f5f9' }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={paymentSubmitting}
                            sx={{
                                flex: 2,
                                py: 1.75,
                                bgcolor: '#059669',
                                fontSize: '0.75rem',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                borderRadius: 3,
                                '&:hover': { bgcolor: '#047857' },
                                boxShadow: '0 4px 14px 0 rgba(5,150,105,0.2)'
                            }}
                        >
                            {paymentSubmitting ? "Processing..." : "Confirm Collection"}
                        </Button>
                    </Box>
                </Box>
            </Dialog>

            {/* History Modal */}
            <Dialog
                open={historyModal.open}
                onClose={() => setHistoryModal({ open: false, data: null, loading: false })}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column' } }}
            >
                <Box sx={{ bgcolor: '#0f172a', color: '#fff', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HistoryIcon sx={{ color: '#fbbf24' }} /> Collection Tracking
                        </Typography>
                        <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            History for {historyModal.data?.bill_number}
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setHistoryModal({ open: false, data: null, loading: false })} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box sx={{ p: 3, flex: 1, overflowY: 'auto', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {historyModal.loading ? (
                        <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
                            <CircularProgress sx={{ color: '#059669' }} />
                        </Box>
                    ) : historyModal.data ? (
                        <>
                            {/* Summary Cards */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
                                <Card variant="outlined" sx={{ p: 2, borderRadius: 3, '&:hover': { boxShadow: 2 } }}>
                                    <Typography sx={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.05em', mb: 0.5 }}>
                                        Net Bill Amount
                                    </Typography>
                                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                                        {formatCurrency(historyModal.data.net_payable, historyModal.data.currency)}
                                    </Typography>
                                </Card>
                                <Card variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#ecfdf5', borderColor: '#a7f3d0', '&:hover': { boxShadow: 2 } }}>
                                    <Typography sx={{ fontSize: '0.625rem', color: '#059669', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.05em', mb: 0.5 }}>
                                        Total Collected
                                    </Typography>
                                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: '#047857' }}>
                                        {formatCurrency(historyModal.data.total_paid, historyModal.data.currency)}
                                    </Typography>
                                </Card>
                                <Card variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#fff7ed', borderColor: '#fed7aa', '&:hover': { boxShadow: 2 } }}>
                                    <Typography sx={{ fontSize: '0.625rem', color: '#ea580c', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.05em', mb: 0.5 }}>
                                        Current Balance
                                    </Typography>
                                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: '#c2410c' }}>
                                        {formatCurrency(historyModal.data.balance, historyModal.data.currency)}
                                    </Typography>
                                </Card>
                                <Card variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#eff6ff', borderColor: '#bfdbfe', '&:hover': { boxShadow: 2 } }}>
                                    <Typography sx={{ fontSize: '0.625rem', color: '#2563eb', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.05em', mb: 0.5 }}>
                                        Payment Count
                                    </Typography>
                                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: '#1d4ed8' }}>
                                        {historyModal.data.payments?.length || 0}{' '}
                                        <Box component="span" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.025em' }}>Collections</Box>
                                    </Typography>
                                </Card>
                            </Box>

                            {/* Payments Table */}
                            <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #f1f5f9', bgcolor: 'rgba(248,250,252,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PaymentIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                                        <Typography sx={{ fontSize: '0.625rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            Collection Breakdown
                                        </Typography>
                                    </Box>
                                </Box>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'rgba(248,250,252,0.5)' }}>
                                                <TableCell sx={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date</TableCell>
                                                <TableCell sx={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mode</TableCell>
                                                <TableCell sx={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reference</TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Amount Collected</TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Balance After</TableCell>
                                                <TableCell sx={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recorded By</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {historyModal.data.payments?.map((payment, idx) => (
                                                <TableRow key={idx} hover sx={{ '&:hover': { bgcolor: 'rgba(248,250,252,0.5)' } }}>
                                                    <TableCell sx={{ py: 2 }}>
                                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 0.75, whiteSpace: 'nowrap' }}>
                                                            <CalendarTodayIcon sx={{ fontSize: 12, color: '#cbd5e1' }} />
                                                            {formatDate(payment.payment_date || payment.created_at)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 2 }}>
                                                        <Chip
                                                            label={payment.payment_mode_display}
                                                            size="small"
                                                            sx={{
                                                                fontSize: '0.625rem',
                                                                fontWeight: 900,
                                                                color: '#64748b',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.1em',
                                                                bgcolor: '#f1f5f9',
                                                                height: 24
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ py: 2 }}>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                            <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>
                                                                {payment.reference_number || "N/A"}
                                                            </Typography>
                                                            {payment.remarks && (
                                                                <Tooltip title={payment.remarks} arrow>
                                                                    <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 500, fontStyle: 'italic', mt: 0.25, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                        {payment.remarks}
                                                                    </Typography>
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 2 }}>
                                                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 900, color: '#1e293b' }}>
                                                            {formatCurrency(payment.amount, historyModal.data.currency)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 2 }}>
                                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                                                            {formatCurrency(payment.balance_after, historyModal.data.currency)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 2 }}>
                                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 0.75, whiteSpace: 'nowrap' }}>
                                                            <EditIcon sx={{ fontSize: 12, color: '#cbd5e1' }} />
                                                            {payment.recorded_by_name}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        </>
                    ) : null}
                </Box>
            </Dialog>

            {/* Report Selection Modal */}
            <Dialog
                open={showReportModal}
                onClose={() => setShowReportModal(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
            >
                <Box sx={{ bgcolor: '#0f172a', color: '#fff', p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionIcon sx={{ color: '#34d399' }} /> Export Financial Report
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Select report parameters
                    </Typography>
                </Box>
                <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <RadioGroup value={reportType} onChange={(e) => setReportType(e.target.value)}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box
                                sx={{
                                    p: 2,
                                    border: '2px solid',
                                    borderColor: reportType === 'bills' ? 'rgba(5,150,105,0.5)' : '#f1f5f9',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    '&:hover': { borderColor: 'rgba(5,150,105,0.5)', bgcolor: 'rgba(5,150,105,0.02)' },
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setReportType('bills')}
                            >
                                <FormControlLabel
                                    value="bills"
                                    control={<Radio sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#059669' } }} />}
                                    label={
                                        <Box>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                Comprehensive Bill Report
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, mt: 0.25 }}>
                                                Transaction history & tax summaries
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{ m: 0, width: '100%' }}
                                />
                            </Box>
                            <Box
                                sx={{
                                    p: 2,
                                    border: '2px solid',
                                    borderColor: reportType === 'outstanding' ? 'rgba(5,150,105,0.5)' : '#f1f5f9',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    '&:hover': { borderColor: 'rgba(5,150,105,0.5)', bgcolor: 'rgba(5,150,105,0.02)' },
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setReportType('outstanding')}
                            >
                                <FormControlLabel
                                    value="outstanding"
                                    control={<Radio sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#059669' } }} />}
                                    label={
                                        <Box>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                Outstanding Collection Report
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, mt: 0.25 }}>
                                                Pending balances & aging analysis
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{ m: 0, width: '100%' }}
                                />
                            </Box>
                        </Box>
                    </RadioGroup>
                    {reportType === "bills" && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <Box>
                                <Typography sx={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
                                    From
                                </Typography>
                                <TextField
                                    fullWidth
                                    type="date"
                                    size="small"
                                    value={reportParams.start_date}
                                    onChange={(e) => setReportParams({ ...reportParams, start_date: e.target.value })}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            bgcolor: '#f8fafc',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            '&.Mui-focused fieldset': { borderColor: '#059669' },
                                        }
                                    }}
                                />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.625rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
                                    To
                                </Typography>
                                <TextField
                                    fullWidth
                                    type="date"
                                    size="small"
                                    value={reportParams.end_date}
                                    onChange={(e) => setReportParams({ ...reportParams, end_date: e.target.value })}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            bgcolor: '#f8fafc',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            '&.Mui-focused fieldset': { borderColor: '#059669' },
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                    )}
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleDownloadReport}
                        disabled={downloading}
                        startIcon={downloading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <DescriptionIcon />}
                        sx={{
                            py: 2,
                            bgcolor: '#059669',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            borderRadius: 4,
                            '&:hover': { bgcolor: '#047857' },
                            boxShadow: '0 10px 25px -5px rgba(5,150,105,0.3)'
                        }}
                    >
                        {downloading ? "Generating..." : "Download Excel Report"}
                    </Button>
                </Box>
            </Dialog>
        </>
    );
};

export default BillList;
