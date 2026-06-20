import React, { useEffect, useState } from "react";
import {
    Box, Card, Typography, Button, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Tooltip, CircularProgress,
    Chip, InputAdornment, Select, MenuItem, FormControl, InputLabel, LinearProgress,
    Menu, ListItemIcon, ListItemText
} from "@mui/material";
import {
    Visibility as ViewIcon,
    Search as SearchIcon,
    Payment as PaymentIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    History as HistoryIcon,
    ChevronLeft as PrevIcon,
    ChevronRight as NextIcon,
    MoreVert as MoreVertIcon,
    CheckCircle,
    Schedule,
    Error
} from "@mui/icons-material";
import { fetchFinancePurchaseOrders } from "../services/financeService";
import { verificationService } from "../services/verificationService";
import AlertToast from "../components/ui/AlertToast";
import VendorSelector from "../components/common/VendorSelector";
import FinancePOModal from "../components/purchaseOrder/FinancePOModal";
import POItemsModal from "../components/purchaseOrder/POItemsModal";
import RecordPaymentModal from "../components/purchaseOrder/RecordPaymentModal";
import PaymentHistoryModal from "../components/purchaseOrder/PaymentHistoryModal";

const FinancePOList = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [verificationStatuses, setVerificationStatuses] = useState({});

    // Modal States
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [itemsModalOpen, setItemsModalOpen] = useState(false);
    const [selectedPOId, setSelectedPOId] = useState(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);

    // Row action menu (kebab)
    const [actionMenu, setActionMenu] = useState({ anchorEl: null, po: null });
    const openActionMenu = (e, po) => { e.stopPropagation(); setActionMenu({ anchorEl: e.currentTarget, po }); };
    const closeActionMenu = () => setActionMenu({ anchorEl: null, po: null });
    const runAction = (fn) => (e) => { e.stopPropagation(); const po = actionMenu.po; closeActionMenu(); fn(po); };

    // Filters
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [vendor, setVendor] = useState("");
    const [ordering, setOrdering] = useState("-po_date"); // Default ordering

    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
    });

    const fetchVerificationStatusesForPOs = async (pos) => {
        const statuses = {};
        for (const po of pos) {
            const status = await verificationService.getPOVerificationStatus(po.id);
            statuses[po.id] = status;
        }
        setVerificationStatuses(statuses);
    };

    const loadData = async (pageNum = 1) => {
        setLoading(true);
        try {
            const params = {
                page: pageNum,
                search: search,
                status: status,
                vendor: vendor,
                ordering: ordering
            };
            const data = await fetchFinancePurchaseOrders(params);

            setList(data.results || []);
            setCount(data.count || 0);
            setNext(data.next);
            setPage(pageNum);

            // Fetch verification status for each PO
            fetchVerificationStatusesForPOs(data.results || []);
        } catch (err) {
            console.error("Failed to fetch finance POs", err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to load purchase orders",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(page);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, status, vendor, ordering, page]);


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
        const c = curr?.toString().trim().toUpperCase() || 'INR';
        const num = Number(amount || 0);
        const locale = c === 'INR' ? 'en-IN' : 'en-US';
        return `${getCurrencySymbol(c)} ${num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getStatusChipProps = (status) => {
        switch (status) {
            case 'PENDING':
                return { color: 'warning', sx: { fontWeight: 700, fontSize: '0.625rem', letterSpacing: '0.05em', textTransform: 'uppercase' } };
            case 'COMPLETED':
                return { color: 'success', sx: { fontWeight: 700, fontSize: '0.625rem', letterSpacing: '0.05em', textTransform: 'uppercase' } };
            case 'CANCELLED':
                return { color: 'error', sx: { fontWeight: 700, fontSize: '0.625rem', letterSpacing: '0.05em', textTransform: 'uppercase' } };
            case 'PARTIALLY_RECEIVED':
                return { color: 'info', sx: { fontWeight: 700, fontSize: '0.625rem', letterSpacing: '0.05em', textTransform: 'uppercase' } };
            default:
                return { color: 'default', sx: { fontWeight: 700, fontSize: '0.625rem', letterSpacing: '0.05em', textTransform: 'uppercase' } };
        }
    };

    const getVerificationStatusChip = (poId) => {
        let verStatus = verificationStatuses[poId]?.status || 'NOT_SENT';
        // Normalize NOT_STARTED to NOT_SENT
        if (verStatus === 'NOT_STARTED') verStatus = 'NOT_SENT';

        let label, color, icon;

        switch (verStatus) {
            case 'VERIFIED':
                label = 'Verified';
                color = 'success';
                icon = <CheckCircle sx={{ mr: 0.5, fontSize: 16 }} />;
                break;
            case 'PENDING':
                label = 'Pending';
                color = 'warning';
                icon = <Schedule sx={{ mr: 0.5, fontSize: 16 }} />;
                break;
            case 'REJECTED':
                label = 'Rejected';
                color = 'error';
                icon = <Error sx={{ mr: 0.5, fontSize: 16 }} />;
                break;
            default:
                label = 'Not Sent';
                color = 'default';
                icon = null;
        }

        return <Chip icon={icon} label={label} color={color} size="small" variant="outlined" />;
    };

    const thSx = {
        fontSize: '0.625rem',
        fontWeight: 700,
        color: 'text.secondary',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        py: 1.25,
        px: 1.25,
        whiteSpace: 'nowrap',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'grey.50',
    };

    const tdSx = {
        py: 1.25,
        px: 1.25,
        borderBottom: '1px solid',
        borderColor: 'grey.100',
    };

    return (
        <>
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Header */}
                <Card
                    variant="outlined"
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { md: 'center' },
                        justifyContent: 'space-between',
                        gap: 2,
                        p: 3,
                        borderRadius: 4,
                    }}
                >
                    <Box>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                color: 'text.primary',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                            }}
                        >
                            <PaymentIcon sx={{ color: 'success.main' }} />
                            Purchase Orders (Finance View)
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Track payments, balances, and financial status of all purchase orders
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            bgcolor: 'grey.50',
                            px: 2,
                            py: 1,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography
                                sx={{
                                    fontSize: '0.625rem',
                                    textTransform: 'uppercase',
                                    fontWeight: 700,
                                    color: 'text.disabled',
                                    letterSpacing: '0.08em',
                                }}
                            >
                                Total Orders
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {count}
                            </Typography>
                        </Box>
                    </Box>
                </Card>

                {/* Filters */}
                <Card variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 2fr' },
                            gap: 3,
                        }}
                    >
                        {/* Search */}
                        <Box>
                            <Typography
                                sx={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    color: 'text.secondary',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    mb: 1,
                                }}
                            >
                                Search PO
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="PO Number..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                        bgcolor: 'grey.50',
                                    },
                                }}
                            />
                        </Box>

                        {/* Status Filter */}
                        <Box>
                            <Typography
                                sx={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    color: 'text.secondary',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    mb: 1,
                                }}
                            >
                                Status
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={status}
                                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                                    displayEmpty
                                    sx={{
                                        borderRadius: 3,
                                        bgcolor: 'grey.50',
                                    }}
                                >
                                    <MenuItem value="">All Statuses</MenuItem>
                                    <MenuItem value="PENDING">Pending</MenuItem>
                                    <MenuItem value="COMPLETED">Completed</MenuItem>
                                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                                    <MenuItem value="PARTIALLY_RECEIVED">Partially Received</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Vendor Filter */}
                        <Box>
                            <Typography
                                sx={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    color: 'text.secondary',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    mb: 1,
                                }}
                            >
                                Vendor
                            </Typography>
                            <VendorSelector
                                value={vendor}
                                onChange={(id) => { setVendor(id); setPage(1); }}
                                placeholder="All Vendors"
                            />
                        </Box>
                    </Box>
                </Card>

                {/* Table */}
                <Card variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table sx={{
                            '& .MuiTableCell-root': { fontSize: '0.72rem' },
                            '& .MuiTypography-body2': { fontSize: '0.72rem' },
                            '& .MuiTypography-caption': { fontSize: '0.62rem' },
                        }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={thSx}>PO Details</TableCell>
                                    <TableCell sx={thSx}>Vendor Info</TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            ...thSx,
                                            cursor: 'pointer',
                                            '&:hover': { color: 'success.main' },
                                        }}
                                        onClick={() => setOrdering(ordering === '-total_amount' ? 'total_amount' : '-total_amount')}
                                    >
                                        Total Amount
                                    </TableCell>
                                    <TableCell align="right" sx={thSx}>Paid</TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            ...thSx,
                                            cursor: 'pointer',
                                            '&:hover': { color: 'success.main' },
                                        }}
                                        onClick={() => setOrdering(ordering === '-balance' ? 'balance' : '-balance')}
                                    >
                                        Due Balance
                                    </TableCell>
                                    <TableCell align="center" sx={thSx}>PO Status</TableCell>
                                    <TableCell align="center" sx={thSx}>Verification</TableCell>
                                    <TableCell align="center" sx={thSx}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && list.length === 0 ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={8} sx={{ px: 3, py: 4 }}>
                                                <Box
                                                    sx={{
                                                        height: 16,
                                                        bgcolor: 'grey.100',
                                                        borderRadius: 1,
                                                        width: '100%',
                                                        animation: 'pulse 1.5s ease-in-out infinite',
                                                        '@keyframes pulse': {
                                                            '0%, 100%': { opacity: 1 },
                                                            '50%': { opacity: 0.4 },
                                                        },
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : list.length > 0 ? (
                                    list.map((po) => (
                                        <TableRow
                                            key={po.id}
                                            hover
                                            sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                                            onClick={() => {
                                                setSelectedPO(po);
                                                setDetailsModalOpen(true);
                                            }}
                                        >
                                            {/* PO Details */}
                                            <TableCell sx={tdSx}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography
                                                        component="span"
                                                        sx={{
                                                            fontFamily: 'monospace',
                                                            fontWeight: 700,
                                                            fontSize: '0.75rem',
                                                            color: 'success.dark',
                                                            bgcolor: 'success.50',
                                                            px: 1,
                                                            py: 0.25,
                                                            borderRadius: 1,
                                                            border: '1px solid',
                                                            borderColor: 'success.100',
                                                            alignSelf: 'flex-start',
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        {po.po_number}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: 'text.secondary',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.75,
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        <CalendarIcon sx={{ fontSize: 12 }} />
                                                        {new Date(po.po_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            {/* Vendor Info */}
                                            <TableCell sx={tdSx}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: 'text.primary',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.75,
                                                        }}
                                                    >
                                                        <PersonIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                                        {po.vendor_name}
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            fontSize: '0.6875rem',
                                                            color: 'text.secondary',
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        GST: {po.vendor_gst || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>

                                            {/* Total Amount */}
                                            <TableCell align="right" sx={tdSx}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                    {formatCurrency(po.total_amount, po.currency)}
                                                </Typography>
                                                {po.currency && po.currency !== 'INR' && po.conversion_rate && (
                                                    <Typography sx={{ fontSize: '0.625rem', color: 'info.main', fontWeight: 700 }}>
                                                        1 {po.currency} = {"₹"}{parseFloat(po.conversion_rate)}
                                                    </Typography>
                                                )}
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.625rem',
                                                        color: 'text.disabled',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    Items: {po.total_items_count}
                                                </Typography>
                                            </TableCell>

                                            {/* Paid */}
                                            <TableCell align="right" sx={tdSx}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                                                    {formatCurrency(po.amount_paid, po.currency)}
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.625rem',
                                                        color: 'text.disabled',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {po.payment_count} Payments
                                                </Typography>
                                            </TableCell>

                                            {/* Due Balance */}
                                            <TableCell align="right" sx={tdSx}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: po.balance > 0 ? 'error.main' : 'success.main',
                                                    }}
                                                >
                                                    {formatCurrency(po.balance, po.currency)}
                                                </Typography>
                                                {po.balance > 0 && (
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={Math.min(100, (po.balance / po.total_amount) * 100)}
                                                            sx={{
                                                                width: 64,
                                                                height: 4,
                                                                borderRadius: 2,
                                                                bgcolor: 'grey.100',
                                                                '& .MuiLinearProgress-bar': {
                                                                    bgcolor: 'error.main',
                                                                    borderRadius: 2,
                                                                },
                                                            }}
                                                        />
                                                    </Box>
                                                )}
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell align="center" sx={tdSx}>
                                                <Chip
                                                    label={po.status}
                                                    size="small"
                                                    variant="outlined"
                                                    {...getStatusChipProps(po.status)}
                                                />
                                            </TableCell>

                                            {/* Verification Status */}
                                            <TableCell align="center" sx={tdSx}>
                                                {getVerificationStatusChip(po.id)}
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell align="center" sx={tdSx}>
                                                <Tooltip title="Actions" arrow>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => openActionMenu(e, po)}
                                                        sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'grey.100' } }}
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} sx={{ px: 3, py: 10, textAlign: 'center' }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                <Box
                                                    sx={{
                                                        width: 64,
                                                        height: 64,
                                                        bgcolor: 'grey.100',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <SearchIcon sx={{ fontSize: 28, color: 'grey.300' }} />
                                                </Box>
                                                <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                                    No purchase orders found matching your criteria
                                                </Typography>
                                                <Button
                                                    variant="text"
                                                    color="success"
                                                    sx={{ fontWeight: 700, mt: 1 }}
                                                    onClick={() => { setSearch(""); setStatus(""); setVendor(""); setPage(1); }}
                                                >
                                                    Clear all filters
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    <Box
                        sx={{
                            px: 3,
                            py: 2,
                            bgcolor: 'grey.50',
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Showing{' '}
                            <Box component="span" sx={{ color: 'text.primary' }}>{list.length}</Box>
                            {' '}of{' '}
                            <Box component="span" sx={{ color: 'text.primary' }}>{count}</Box>
                            {' '}entries
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PrevIcon />}
                                disabled={!previous}
                                onClick={() => previous && loadData(page - 1)}
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    borderColor: 'divider',
                                    color: 'text.secondary',
                                }}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                endIcon={<NextIcon />}
                                disabled={!next}
                                onClick={() => next && loadData(page + 1)}
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    borderColor: 'divider',
                                    color: 'text.secondary',
                                }}
                            >
                                Next
                            </Button>
                        </Box>
                    </Box>
                </Card>
            </Box>

            {/* Row action menu */}
            <Menu
                anchorEl={actionMenu.anchorEl}
                open={Boolean(actionMenu.anchorEl)}
                onClose={closeActionMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}
            >
                <MenuItem onClick={runAction((po) => {
                    setItemsModalOpen(false); setPaymentModalOpen(false); setHistoryModalOpen(false);
                    setSelectedPO(po); setDetailsModalOpen(true);
                })}>
                    <ListItemIcon><ViewIcon fontSize="small" sx={{ color: 'primary.main' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>View Details</ListItemText>
                </MenuItem>
                <MenuItem onClick={runAction((po) => {
                    setDetailsModalOpen(false); setItemsModalOpen(false); setHistoryModalOpen(false);
                    setSelectedPO(po); setPaymentModalOpen(true);
                })}>
                    <ListItemIcon><PaymentIcon fontSize="small" sx={{ color: 'success.main' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Record Payment</ListItemText>
                </MenuItem>
                <MenuItem onClick={runAction((po) => {
                    setDetailsModalOpen(false); setItemsModalOpen(false); setPaymentModalOpen(false);
                    setSelectedPOId(po.id); setHistoryModalOpen(true);
                })}>
                    <ListItemIcon><HistoryIcon fontSize="small" sx={{ color: 'warning.main' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Payment History</ListItemText>
                </MenuItem>
            </Menu>

            <FinancePOModal
                open={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                data={selectedPO}
                onViewItems={(id) => {
                    setSelectedPOId(id);
                    setItemsModalOpen(true);
                }}
                onRecordPayment={(data) => {
                    setSelectedPO(data);
                    setPaymentModalOpen(true);
                }}
                onShowHistory={(id) => {
                    setSelectedPOId(id);
                    setHistoryModalOpen(true);
                }}
            />
            <POItemsModal
                open={itemsModalOpen}
                onClose={() => setItemsModalOpen(false)}
                poId={selectedPOId}
            />

            <RecordPaymentModal
                open={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                poData={selectedPO}
                onSuccess={(msg) => {
                    setToast({ open: true, type: "success", message: msg });
                    loadData(page);
                }}
            />

            <PaymentHistoryModal
                open={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                poId={selectedPOId}
            />

            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />
        </>
    );
};

export default FinancePOList;
