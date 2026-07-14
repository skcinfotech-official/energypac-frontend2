import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    getProformaInvoices,
    getProformaInvoiceById,
    sendProformaInvoice,
    acceptProformaInvoice,
    cancelProformaInvoice
} from "../services/salesService";
import { verificationService } from "../services/verificationService";
import {
    Box, Card, Typography, Button, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton,
    Tooltip, CircularProgress, Chip, InputAdornment,
    Menu, MenuItem, ListItemIcon, ListItemText
} from "@mui/material";
import {
    Add as AddIcon,
    Search as SearchIcon,

    Edit as EditIcon,
    Send as SendIcon,
    Check as CheckIcon,
    Cancel as CancelIcon,
    Close as CloseIcon,
    Inventory2 as StockIcon,
    Bolt as BoltIcon,
    ReceiptLong as CommercialIcon,
    ChevronLeft as PrevIcon,
    ChevronRight as NextIcon,
    MoreVert as MoreVertIcon,
    CheckCircle,
    Schedule,
    Error
} from "@mui/icons-material";
import ClientQuotationDetailsModal from "../components/sales/ClientQuotationDetailsModal";
import CommercialInvoiceModal from "../components/commercial/CommercialInvoiceModal";
import PackingListModal from "../components/commercial/PackingListModal";
import { getCommercialInvoices } from "../services/commercialService";
import TaxInvoiceModal from "../components/domestic/TaxInvoiceModal";
import { getTaxInvoices } from "../services/domesticService";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PasswordConfirmModal from "../components/ui/PasswordConfirmModal";

const ClientQuotation = () => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState("");
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [verificationStatuses, setVerificationStatuses] = useState({});

    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);

    // Row action menu (kebab)
    const [actionMenu, setActionMenu] = useState({ anchorEl: null, item: null });
    const openActionMenu = (e, item) => { e.stopPropagation(); setActionMenu({ anchorEl: e.currentTarget, item }); };
    const closeActionMenu = () => setActionMenu({ anchorEl: null, item: null });
    const runAction = (fn) => () => { const item = actionMenu.item; closeActionMenu(); fn(item); };

    // Commercial Invoice / Packing List modal state
    const [ciModal, setCiModal] = useState({ open: false, piId: null, ciId: null });
    const [plModal, setPlModal] = useState({ open: false, ciId: null, plId: null });

    const openCommercialInvoice = async (item) => {
        // If a Commercial Invoice already exists for this PI, open it for edit
        // instead of creating a duplicate.
        try {
            const data = await getCommercialInvoices({ proforma_invoice: item.id });
            const list = data?.results || data || [];
            const existing = list.find(ci => ci.status !== "CANCELLED");
            if (existing) {
                setCiModal({ open: true, piId: item.id, ciId: existing.id });
                return;
            }
        } catch (err) {
            console.error("Failed to check existing CI", err);
        }
        setCiModal({ open: true, piId: item.id, ciId: null });
    };
    const openPackingListForCI = (ci) => {
        setCiModal({ open: false, piId: null, ciId: null });
        setPlModal({ open: true, ciId: ci.id, plId: null });
    };

    // Domestic Tax Invoice
    const [tiModal, setTiModal] = useState({ open: false, piId: null, tiId: null });
    const openTaxInvoice = async (item) => {
        try {
            const data = await getTaxInvoices({ proforma_invoice: item.id });
            const list = data?.results || data || [];
            const existing = list.find(ti => ti.status !== "CANCELLED");
            if (existing) {
                setTiModal({ open: true, piId: item.id, tiId: existing.id });
                return;
            }
        } catch (err) {
            console.error("Failed to check existing tax invoice", err);
        }
        setTiModal({ open: true, piId: item.id, tiId: null });
    };

    // Alert State
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });

    // Dialog and Password Modal States
    const [confirm, setConfirm] = useState({
        open: false,
        title: "",
        message: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        loading: false,
        confirmButtonClass: "error",
        iconBgClass: "error",
        icon: undefined,
        action: null
    });
    const [passwordModal, setPasswordModal] = useState({
        open: false,
        onConfirm: null,
        title: "",
        message: "",
        loading: false
    });

    const [searchParams] = useSearchParams();

    const getStatusChipProps = (status) => {
        switch (status) {
            case 'DRAFT': return { color: 'default', variant: 'outlined' };
            case 'SENT': return { color: 'info', variant: 'outlined' };
            case 'ACCEPTED': return { color: 'success', variant: 'outlined' };
            case 'CANCELLED': return { color: 'error', variant: 'outlined' };
            default: return { color: 'default', variant: 'outlined' };
        }
    };

    const getVerificationStatusChip = (piId) => {
        let verStatus = verificationStatuses[piId]?.status || 'NOT_SENT';
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

    const handleSendInvoice = (id) => {
        setConfirm({
            open: true,
            title: "Send Proforma Invoice?",
            message: "Are you sure you want to send this proforma invoice? This will move its status from DRAFT to SENT.",
            confirmText: "Send",
            confirmButtonClass: "info",
            iconBgClass: "info",
            icon: SendIcon,
            action: async () => {
                setConfirm(prev => ({ ...prev, loading: true }));
                try {
                    await sendProformaInvoice(id);
                    setAlert({ open: true, type: "success", message: "Proforma invoice sent successfully" });
                    fetchInvoices(currentPage, searchText);
                } catch (error) {
                    console.error("Failed to send proforma invoice", error);
                    const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to send proforma invoice";
                    setAlert({ open: true, type: "error", message: errorMsg });
                } finally {
                    setConfirm({ open: false });
                }
            }
        });
    };

    const handleAcceptInvoice = (id) => {
        setConfirm({
            open: true,
            title: "Accept Proforma Invoice?",
            message: "Are you sure you want to accept this proforma invoice? This will move its status from SENT to ACCEPTED and lock all further editing.",
            confirmText: "Accept",
            confirmButtonClass: "green",
            iconBgClass: "green",
            icon: CheckIcon,
            action: async () => {
                setConfirm(prev => ({ ...prev, loading: true }));
                try {
                    await acceptProformaInvoice(id);
                    setAlert({ open: true, type: "success", message: "Proforma invoice accepted successfully" });
                    fetchInvoices(currentPage, searchText);
                } catch (error) {
                    console.error("Failed to accept proforma invoice", error);
                    const respData = error.response?.data;
                    let errorMsg = respData?.error || respData?.detail || respData?.message || "Failed to accept proforma invoice";
                    if (respData?.insufficient_items && Array.isArray(respData.insufficient_items)) {
                        const itemList = respData.insufficient_items.map(
                            i => `${i.product} (stock: ${i.available}, need: ${i.required})`
                        ).join("; ");
                        errorMsg = `Insufficient stock: ${itemList}`;
                    }
                    setAlert({ open: true, type: "error", message: errorMsg });
                } finally {
                    setConfirm({ open: false });
                }
            }
        });
    };

    const handleCancelInvoice = (id) => {
        setConfirm({
            open: true,
            title: "Cancel Proforma Invoice?",
            message: "Are you sure you want to cancel this proforma invoice? This action cannot be undone and requires password authentication.",
            confirmText: "Proceed",
            confirmButtonClass: "error",
            iconBgClass: "error",
            icon: CloseIcon,
            action: () => {
                setConfirm(prev => ({ ...prev, open: false }));
                setPasswordModal({
                    open: true,
                    title: "Confirm Cancellation",
                    message: "Please enter your password to cancel this proforma invoice.",
                    loading: false,
                    onConfirm: async (password) => {
                        setPasswordModal(prev => ({ ...prev, loading: true }));
                        try {
                            await cancelProformaInvoice(id, { confirm_password: password });
                            setAlert({ open: true, type: "success", message: "Proforma invoice cancelled successfully" });
                            fetchInvoices(currentPage, searchText);
                            setPasswordModal({ open: false });
                        } catch (error) {
                            console.error("Failed to cancel proforma invoice", error);
                            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to cancel proforma invoice";
                            setAlert({ open: true, type: "error", message: errorMsg });
                            setPasswordModal(prev => ({ ...prev, loading: false }));
                        }
                    }
                });
            }
        });
    };

    useEffect(() => {
        const viewId = searchParams.get("view_id");
        if (viewId) {
            const fetchInvoice = async () => {
                try {
                    const data = await getProformaInvoiceById(viewId);
                    if (data) {
                        setSelectedInvoice(data);
                        setViewModalOpen(true);
                    }
                } catch (err) {
                    console.error("Failed to load invoice details", err);
                }
            };
            fetchInvoice();
        }
    }, [searchParams]);

    const fetchVerificationStatusesForPIs = async (pis) => {
        const statuses = {};
        for (const pi of pis) {
            const status = await verificationService.getPIVerificationStatus(pi.id);
            statuses[pi.id] = status;
        }
        setVerificationStatuses(statuses);
    };

    const fetchInvoices = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const data = await getProformaInvoices(page, search);
            setInvoices(data.results || []);
            setTotalCount(data.count || 0);
            setNextPage(data.next);
            setPrevPage(data.previous);

            // Fetch verification status for each PI
            fetchVerificationStatusesForPIs(data.results || []);
        } catch (error) {
            console.error("Failed to fetch proforma invoices", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices(currentPage, searchText);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText, currentPage]);

    const handleSearch = (e) => {
        setSearchText(e.target.value);
        setCurrentPage(1);
    };

    const handleNext = () => {
        if (nextPage) setCurrentPage((prev) => prev + 1);
    };

    const handlePrev = () => {
        if (prevPage) setCurrentPage((prev) => prev - 1);
    };

    const handleEdit = (item) => {
        // Lock is acquired by the form page itself.
        navigate(`/sales/proforma-invoice/${item.id}/edit`);
    };

    return (
        <Box sx={{ p: { xs: 0.5, sm: 1 } }}>
            <Card>
                {/* HEADER */}
                <Box sx={{
                    px: 2.5, py: 2,
                    borderBottom: '1px solid', borderColor: 'divider',
                    display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1.5
                }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            Proforma Invoices
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Total Records: {totalCount}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/sales/proforma-invoice/create')}
                            sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' }, fontWeight: 700 }}
                        >
                            New Proforma Invoice
                        </Button>
                    </Box>
                </Box>

                {/* SEARCH BAR */}
                <Box sx={{
                    px: 2.5, py: 2,
                    borderBottom: '1px solid', borderColor: 'divider',
                    bgcolor: '#FAFBFC'
                }}>
                    <Box sx={{ maxWidth: 400 }}>
                        <Typography variant="caption" sx={{
                            fontWeight: 700, color: 'text.secondary',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            mb: 0.5, display: 'block'
                        }}>
                            Search Invoices
                        </Typography>
                        <TextField
                            size="small"
                            fullWidth
                            value={searchText}
                            onChange={handleSearch}
                            placeholder="Search by exporter, consignee, applicant..."
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Box>
                </Box>

                {/* TABLE LIST */}
                <TableContainer>
                    <Table size="small" sx={{ "& .MuiTableCell-root": { fontSize: "0.74rem" } }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    PI Number / Ref
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    PI Date
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Applicant Importer
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                                    Total Amount
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                                    PI Status
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                                    Verification
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                            <CircularProgress size={28} />
                                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                Loading proforma invoices...
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : invoices.length > 0 ? (
                                invoices.map((item) => {
                                    const status = (item.status || "DRAFT").toUpperCase();
                                    return (
                                        <TableRow
                                            key={item.id}
                                            hover
                                            onClick={() => { setSelectedInvoice(item); setViewModalOpen(true); }}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1565C0' }}>
                                                    {item.pi_number || `#${item.id?.substring(0, 8) || "N/A"}`}
                                                </Typography>
                                                {item.source === "STOCK_SALE" || (item.source === undefined && item.is_stock_sale) ? (
                                                    <Chip
                                                        icon={<StockIcon sx={{ fontSize: '0.7rem' }} />}
                                                        label="STOCK SALE"
                                                        size="small"
                                                        sx={{
                                                            mt: 0.5,
                                                            height: 18,
                                                            fontSize: '0.6rem',
                                                            fontWeight: 700,
                                                            bgcolor: '#FFF8E1',
                                                            color: '#F57F17',
                                                            border: '1px solid #FFE082',
                                                            '& .MuiChip-icon': { color: '#F57F17', fontSize: '0.7rem' }
                                                        }}
                                                    />
                                                ) : item.source === "DIRECT" ? (
                                                    <Chip
                                                        icon={<BoltIcon sx={{ fontSize: '0.7rem' }} />}
                                                        label="DIRECT PI"
                                                        size="small"
                                                        sx={{
                                                            mt: 0.5,
                                                            height: 18,
                                                            fontSize: '0.6rem',
                                                            fontWeight: 700,
                                                            bgcolor: '#F5F3FF',
                                                            color: '#6D28D9',
                                                            border: '1px solid #DDD6FE',
                                                            '& .MuiChip-icon': { color: '#6D28D9', fontSize: '0.7rem' }
                                                        }}
                                                    />
                                                ) : item.requisition_number ? (
                                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.25, fontFamily: 'monospace', color: 'text.disabled', fontSize: '0.65rem' }}>
                                                        Req: {item.requisition_number}
                                                    </Typography>
                                                ) : null}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                    {item.pi_date}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 200 }}>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {item.applicant_importer}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                                                    <Typography variant="caption" sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, mr: 0.75 }}>
                                                        {item.currency}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                                        {Number(item.grand_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                                <Chip
                                                    size="small"
                                                    label={status}
                                                    {...getStatusChipProps(status)}
                                                    sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                {getVerificationStatusChip(item.id)}
                                            </TableCell>
                                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                    <Tooltip title="Actions">
                                                        <IconButton size="small" onClick={(e) => openActionMenu(e, item)}>
                                                            <MoreVertIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontStyle: 'italic' }}>
                                            No proforma invoices found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* PAGINATION */}
                <Box sx={{
                    px: 2.5, py: 1.5,
                    borderTop: '1px solid', borderColor: 'divider',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <Button
                        size="small"
                        startIcon={<PrevIcon />}
                        disabled={!prevPage}
                        onClick={handlePrev}
                        sx={{ fontWeight: 600 }}
                    >
                        Previous
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        Page {currentPage}
                    </Typography>
                    <Button
                        size="small"
                        endIcon={<NextIcon />}
                        disabled={!nextPage}
                        onClick={handleNext}
                        sx={{ fontWeight: 600 }}
                    >
                        Next
                    </Button>
                </Box>
            </Card>

            {/* Row action menu */}
            <Menu
                anchorEl={actionMenu.anchorEl}
                open={Boolean(actionMenu.anchorEl)}
                onClose={closeActionMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 230, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}
            >
                {(() => {
                    const it = actionMenu.item;
                    if (!it) return null;
                    const st = it.status;
                    return [
                        <MenuItem key="edit" disabled={st === 'ACCEPTED' || st === 'CANCELLED'} onClick={runAction((x) => handleEdit(x))}>
                            <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Edit Proforma Invoice</ListItemText>
                        </MenuItem>,
                        <MenuItem key="send" disabled={st !== 'DRAFT'} onClick={runAction((x) => handleSendInvoice(x.id))}>
                            <ListItemIcon><SendIcon sx={{ fontSize: '1rem', color: '#3949AB' }} /></ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Send Proforma Invoice</ListItemText>
                        </MenuItem>,
                        <MenuItem key="accept" disabled={st !== 'SENT'} onClick={runAction((x) => handleAcceptInvoice(x.id))}>
                            <ListItemIcon><CheckIcon sx={{ fontSize: '1rem' }} color="success" /></ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Accept Proforma Invoice</ListItemText>
                        </MenuItem>,
                        <MenuItem key="cancel" disabled={st !== 'SENT'} onClick={runAction((x) => handleCancelInvoice(x.id))}>
                            <ListItemIcon><CancelIcon fontSize="small" color="error" /></ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: st === 'SENT' ? 'error.main' : undefined }}>Cancel Proforma Invoice</ListItemText>
                        </MenuItem>,
                        it.trade_type === 'INTERNATIONAL' && (
                            <MenuItem key="ci" onClick={runAction((x) => openCommercialInvoice(x))}>
                                <ListItemIcon><CommercialIcon fontSize="small" sx={{ color: '#0E7490' }} /></ListItemIcon>
                                <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Commercial Invoice &amp; Packing List</ListItemText>
                            </MenuItem>
                        ),
                        it.trade_type === 'DOMESTIC' && (
                            <MenuItem key="ti" onClick={runAction((x) => openTaxInvoice(x))}>
                                <ListItemIcon><CommercialIcon fontSize="small" sx={{ color: '#1565C0' }} /></ListItemIcon>
                                <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Tax Invoice (GST)</ListItemText>
                            </MenuItem>
                        ),
                    ];
                })()}
            </Menu>

            {/* CREATE / EDIT MODAL */}
            {/* COMMERCIAL INVOICE MODAL (International PI) */}
            {ciModal.open && (
                <CommercialInvoiceModal
                    isOpen={ciModal.open}
                    onClose={() => setCiModal({ open: false, piId: null, ciId: null })}
                    proformaInvoiceId={ciModal.piId}
                    ciId={ciModal.ciId}
                    onGeneratePackingList={openPackingListForCI}
                    onSuccess={() => setAlert({ open: true, type: "success", message: "Commercial Invoice saved" })}
                />
            )}

            {/* PACKING LIST MODAL */}
            {plModal.open && (
                <PackingListModal
                    isOpen={plModal.open}
                    onClose={() => setPlModal({ open: false, ciId: null, plId: null })}
                    commercialInvoiceId={plModal.ciId}
                    plId={plModal.plId}
                    onSuccess={() => setAlert({ open: true, type: "success", message: "Packing List saved" })}
                />
            )}

            {/* TAX INVOICE MODAL (Domestic PI) */}
            {tiModal.open && (
                <TaxInvoiceModal
                    isOpen={tiModal.open}
                    onClose={() => setTiModal({ open: false, piId: null, tiId: null })}
                    proformaInvoiceId={tiModal.piId}
                    tiId={tiModal.tiId}
                    onSuccess={() => setAlert({ open: true, type: "success", message: "Tax Invoice saved" })}
                />
            )}

            {/* DETAILS MODAL */}
            <ClientQuotationDetailsModal
                isOpen={viewModalOpen}
                onClose={() => {
                    setViewModalOpen(false);
                    setSelectedInvoice(null);
                }}
                invoice={selectedInvoice}
            />

            {/* CONFIRM DIALOG */}
            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                message={confirm.message}
                confirmText={confirm.confirmText}
                cancelText={confirm.cancelText}
                loading={confirm.loading}
                onConfirm={confirm.action}
                onCancel={() => setConfirm({ ...confirm, open: false })}
                icon={confirm.icon}
                confirmButtonClass={confirm.confirmButtonClass}
                iconBgClass={confirm.iconBgClass}
            />

            {/* PASSWORD CONFIRM MODAL */}
            <PasswordConfirmModal
                open={passwordModal.open}
                title={passwordModal.title}
                message={passwordModal.message}
                loading={passwordModal.loading}
                onConfirm={passwordModal.onConfirm}
                onCancel={() => setPasswordModal({ open: false })}
            />

            {/* ALERT TOAST */}
            <AlertToast
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ ...alert, open: false })}
            />
        </Box>
    );
};

export default ClientQuotation;
