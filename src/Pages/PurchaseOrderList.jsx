import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchPurchaseOrders, getPurchaseOrderReport, cancelPurchaseOrder, lockPurchaseOrder, getPurchaseOrder } from "../services/purchaseOrderService";
import { verificationService } from "../services/verificationService";
import {
    Box, Card, Typography, Button, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Tooltip, Dialog,
    DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl,
    InputLabel, CircularProgress, Chip, InputAdornment, RadioGroup, Radio,
    FormControlLabel, Menu, ListItemIcon, ListItemText
} from "@mui/material";
import {
    Visibility, FileDownload, Close, Search, Edit, Cancel, CheckCircle, Schedule, Error,
    MoreVert as MoreVertIcon
} from "@mui/icons-material";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PurchaseOrderModal from "../components/purchaseOrder/PurchaseOrderModal";
import EditPurchaseOrderModal from "../components/purchaseOrder/EditPurchaseOrderModal";
import VendorSelector from "../components/common/VendorSelector";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PasswordConfirmModal from "../components/ui/PasswordConfirmModal";

const formatCurrency = (amount, curr = 'INR') => {
    const c = curr?.toString().trim().toUpperCase() || 'INR';
    try {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: c,
            maximumFractionDigits: 2
        }).replace('US$', '$');
    } catch (e) {
        return `${c} ${Number(amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }
};

const PurchaseOrderList = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const [verificationStatuses, setVerificationStatuses] = useState({});

    // Pagination State
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editPOData, setEditPOData] = useState(null);
    const [page, setPage] = useState(1);
    const [confirm, setConfirm] = useState({ open: false, action: null });

    // Row action menu (kebab)
    const [actionMenu, setActionMenu] = useState({ anchorEl: null, row: null });
    const openActionMenu = (e, row) => { e.stopPropagation(); setActionMenu({ anchorEl: e.currentTarget, row }); };
    const closeActionMenu = () => setActionMenu({ anchorEl: null, row: null });
    const runAction = (fn) => () => { const row = actionMenu.row; closeActionMenu(); fn(row); };
    const [passwordModal, setPasswordModal] = useState({ open: false, onConfirm: null, loading: false });

    // Search & Filter state
    const [searchText, setSearchText] = useState("");
    const [vendorFilter, setVendorFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    /* =========================
       REPORT STATE
       ========================= */
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState("date_range");
    const [reportParams, setReportParams] = useState({
        start_date: "",
        end_date: "",
        vendor_id: "",
        vendor_name: ""
    });

    const [downloading, setDownloading] = useState(false);

    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
    });

    /* =========================
       FETCH - accepts explicit pageNum
       ========================= */
    const loadData = async (pageNum = 1) => {
        setLoading(true);
        try {
            const res = await fetchPurchaseOrders(pageNum, searchText, vendorFilter, statusFilter);
            const data = res.data ? res.data : res;

            if (data && data.results) {
                setList(data.results);
                setCount(data.count || data.results.length);
                setNext(data.next);
                setPrevious(data.previous);

                // Fetch verification status for each PO
                fetchVerificationStatusesForPOs(data.results);
            } else if (Array.isArray(data)) {
                setList(data);
                setCount(data.length);
                setNext(null);
                setPrevious(null);

                // Fetch verification status for each PO
                fetchVerificationStatusesForPOs(data);
            } else {
                setList([]);
                setCount(0);
            }
            setPage(pageNum);

        } catch (err) {
            console.error(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to load purchase orders",
            });
            setList([]);
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       EFFECT: search change -> debounce + RESET to page 1
       ========================= */
    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText, vendorFilter, statusFilter]);

    // Check for view_id query param (deep linking from Dashboard)
    useEffect(() => {
        const viewId = searchParams.get("view_id");
        if (viewId && viewId.length === 36) {
            setSelectedPO({ id: viewId });
            setModalOpen(true);
        }
    }, [searchParams]);

    /* =========================
       REPORT HANDLER
       ========================= */
    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const params = {};
            let filenamePrefix = "PurchaseOrder_Report";

            if (reportType === "date_range") {
                if (!reportParams.start_date || !reportParams.end_date) {
                    setToast({ open: true, type: "error", message: "Please select start and end dates" });
                    setDownloading(false);
                    return;
                }
                params.start_date = reportParams.start_date;
                params.end_date = reportParams.end_date;
                filenamePrefix = `PO_Report_${params.start_date}_to_${params.end_date}`;

            } else if (reportType === "pending") {
                params.status = "PENDING";
                filenamePrefix = "Pending_PO_Report";

            } else if (reportType === "vendor") {
                if (!reportParams.vendor_id) {
                    setToast({ open: true, type: "error", message: "Please select a vendor" });
                    setDownloading(false);
                    return;
                }
                params.vendor = reportParams.vendor_id;
                const vName = reportParams.vendor_name || "Vendor";
                filenamePrefix = `PO_Report_${vName.replace(/\s+/g, '_')}`;
            }

            const res = await getPurchaseOrderReport(params);
            const data = res.data;
            const reportData = data.purchase_orders || [];

            const wb = XLSX.utils.book_new();

            const finalSheetData = [
                [data.report_type || "Purchase Order Report"],
                ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()],
                [],
                ["SUMMARY"],
                ["Total POs:", data.summary?.total_purchase_orders || 0],
                ["Total Value:", data.summary?.total_value || 0],
                ["Pending POs:", data.summary?.pending_pos || 0],
                ["Partially Received:", data.summary?.partially_received_pos || 0],
                ["Completed POs:", data.summary?.completed_pos || 0],
                [],
                ["PO Number", "Date", "Vendor Name", "Vendor Code", "Req No", "Total Amount", "Status", "Item Code", "Item Name", "Quantity", "Rate", "Amount", "Purchased"]
            ];

            reportData.forEach(po => {
                if (po.items && po.items.length > 0) {
                    po.items.forEach(item => {
                        finalSheetData.push([
                            po.po_number, po.po_date, po.vendor_name, po.vendor_code,
                            po.requisition_number, po.total_amount, po.status,
                            item.product_code, item.product_name, item.quantity,
                            item.rate, item.amount, item.is_received ? "Yes" : "No"
                        ]);
                    });
                } else {
                    finalSheetData.push([
                        po.po_number, po.po_date, po.vendor_name, po.vendor_code,
                        po.requisition_number, po.total_amount, po.status,
                        "-", "-", "-", "-", "-", "-"
                    ]);
                }
            });

            const worksheet = XLSX.utils.aoa_to_sheet(finalSheetData);
            XLSX.utils.book_append_sheet(wb, worksheet, "PO Report");

            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
            saveAs(blob, `${filenamePrefix}.xlsx`);

            setShowReportModal(false);
            setToast({ open: true, type: "success", message: "Report downloaded successfully" });

        } catch (err) {
            console.error("Download failed", err);
            setToast({ open: true, type: "error", message: "Failed to download report" });
        } finally {
            setDownloading(false);
        }
    };

    const handleView = (row) => {
        setSelectedPO(row);
        setModalOpen(true);
    };

    const handleEditClick = async (row) => {
        setLoading(true);
        try {
            await lockPurchaseOrder(row.id);
            const fullPO = await getPurchaseOrder(row.id);
            setEditPOData(fullPO);
            setEditModalOpen(true);
        } catch (err) {
            console.error("Lock sequence failed:", err);
            const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.message || "This Purchase Order is currently locked by another user.";
            setToast({
                open: true,
                type: "error",
                message: errorMsg
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelPO = (poId) => {
        const po = list.find(p => p.id === poId);
        setConfirm({
            open: true,
            title: "Cancel Purchase Order?",
            description: `Are you sure you want to cancel Purchase Order "${po?.po_number}"? This action cannot be undone.`,
            action: () => {
                setConfirm(prev => ({ ...prev, open: false }));
                setPasswordModal({
                    open: true,
                    loading: false,
                    onConfirm: async (password) => {
                        setPasswordModal(prev => ({ ...prev, loading: true }));
                        try {
                            const res = await cancelPurchaseOrder(poId, { confirm_password: password });
                            setToast({
                                open: true,
                                type: "success",
                                message: res.data?.message || res.message || "Purchase Order cancelled successfully",
                            });
                            loadData(page);
                            setPasswordModal({ open: false });
                        } catch (err) {
                            console.error("Cancellation Error:", err);
                            const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.message || "Failed to cancel Purchase Order";
                            setToast({ open: true, type: "error", message: errorMsg });
                            setPasswordModal(prev => ({ ...prev, loading: false }));
                        }
                    }
                });
            }
        });
    };

    const fetchVerificationStatusesForPOs = async (pos) => {
        const statuses = {};
        for (const po of pos) {
            const status = await verificationService.getPOVerificationStatus(po.id);
            statuses[po.id] = status;
        }
        setVerificationStatuses(statuses);
    };

    const getVerificationStatusChip = (poId) => {
        let status = verificationStatuses[poId]?.status || 'NOT_SENT';
        // Normalize NOT_STARTED to NOT_SENT
        if (status === 'NOT_STARTED') status = 'NOT_SENT';

        let label, color, icon;

        switch (status) {
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

    const getStatusChip = (row) => {
        const allReceived = row.items && row.items.length > 0 && row.items.every(i => i.is_received);
        const someReceived = row.items && row.items.length > 0 && row.items.some(i => i.is_received);

        let displayStatus = row.status;
        if (allReceived) displayStatus = 'COMPLETED';
        else if (someReceived) displayStatus = 'PARTIALLY_RECEIVED';

        let statusText = displayStatus;
        let chipColor = 'default';

        if (displayStatus === 'PENDING') {
            statusText = 'Pending';
            chipColor = 'warning';
        } else if (displayStatus === 'PARTIALLY_RECEIVED') {
            statusText = 'Partially Received';
            chipColor = 'info';
        } else if (displayStatus === 'COMPLETED') {
            statusText = 'Completed';
            chipColor = 'success';
        } else if (displayStatus === 'CANCELLED') {
            statusText = 'Cancelled';
            chipColor = 'error';
        }

        return <Chip label={statusText} color={chipColor} size="small" />;
    };

    return (
        <Box>
            <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'grey.200', boxShadow: 1, overflow: 'hidden' }}>
                {/* HEADER */}
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'grey.800' }}>
                            Purchase Orders
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'grey.500', fontWeight: 600 }}>
                            Total: {count}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<FileDownload />}
                        onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                            setReportParams(prev => ({ ...prev, start_date: firstDay, end_date: today }));
                            setShowReportModal(true);
                        }}
                        sx={{
                            bgcolor: 'success.dark',
                            '&:hover': { bgcolor: 'success.main' },
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2
                        }}
                    >
                        Download Report
                    </Button>
                </Box>

                {/* SEARCH & FILTERS */}
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'grey.100', bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
                        {/* Search */}
                        <Box sx={{ flex: 1, minWidth: 220 }}>
                            <TextField
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search by PO ..."
                                label="Search PO"
                                size="small"
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ color: 'grey.400' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        {/* Vendor Filter */}
                        <Box sx={{ width: 256 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'grey.600', mb: 0.5, display: 'block' }}>
                                Filter by Vendor
                            </Typography>
                            <VendorSelector
                                value={vendorFilter}
                                onChange={(val) => setVendorFilter(val)}
                                placeholder="Select Vendor"
                            />
                        </Box>

                        {/* Status Filter */}
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                label="Status"
                            >
                                <MenuItem value="">All Status</MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="PARTIALLY_RECEIVED">Partial</MenuItem>
                                <MenuItem value="COMPLETED">Completed</MenuItem>
                                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>

                {/* TABLE */}
                <TableContainer>
                    <Table sx={{
                        '& .MuiTableCell-root': { fontSize: '0.78rem' },
                        '& .MuiTypography-body2': { fontSize: '0.78rem' },
                        '& .MuiTypography-caption': { fontSize: '0.66rem' },
                    }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'primary.50' }}>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: 13, color: 'grey.800', textTransform: 'uppercase', letterSpacing: 1 }}>PO No</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: 13, color: 'grey.800', textTransform: 'uppercase', letterSpacing: 1 }}>Req No</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: 13, color: 'grey.800', textTransform: 'uppercase', letterSpacing: 1 }}>Vendor</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: 13, color: 'grey.800', textTransform: 'uppercase', letterSpacing: 1 }}>PO Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: 13, color: 'grey.800', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right' }}>Total Amount</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: 13, color: 'grey.800', textTransform: 'uppercase', letterSpacing: 1 }}>PO Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: 13, color: 'grey.800', textTransform: 'uppercase', letterSpacing: 1 }}>Verification</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', fontSize: 13, color: 'grey.800', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'grey.500' }}>
                                        <CircularProgress size={24} sx={{ mr: 1 }} />
                                        Loading purchase orders...
                                    </TableCell>
                                </TableRow>
                            ) : list.length > 0 ? (
                                list.map((row, index) => (
                                    <TableRow
                                        key={row.id}
                                        sx={{
                                            bgcolor: index % 2 === 0 ? 'grey.100' : 'white',
                                            '&:hover': { bgcolor: 'grey.200' },
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <TableCell sx={{ px: 3, py: 2 }}>
                                            <Typography
                                                component="span"
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    color: 'primary.main',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    '&:hover': { textDecoration: 'underline' }
                                                }}
                                                onClick={() => handleView(row)}
                                            >
                                                {row.po_number}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ px: 3, py: 2, color: 'grey.700' }}>
                                            {row.requisition_number}
                                        </TableCell>
                                        <TableCell sx={{ px: 3, py: 2, color: 'grey.700' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.vendor_name}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ px: 3, py: 2, color: 'grey.600', fontWeight: 600 }}>
                                            {new Date(row.po_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell sx={{ px: 3, py: 2, textAlign: 'right' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'grey.800' }}>
                                                {formatCurrency(row.total_amount, row.currency)}
                                            </Typography>
                                            {row.conversion_rate && row.currency !== 'INR' && (
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'success.dark', fontWeight: 600, fontSize: 10 }}>
                                                    1 {row.currency} = &#8377;{parseFloat(row.conversion_rate)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ px: 3, py: 2 }}>
                                            {getStatusChip(row)}
                                        </TableCell>
                                        <TableCell sx={{ px: 3, py: 2 }}>
                                            {getVerificationStatusChip(row.id)}
                                        </TableCell>
                                        <TableCell sx={{ px: 3, py: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                <Tooltip title="Actions">
                                                    <IconButton size="small" onClick={(e) => openActionMenu(e, row)} sx={{ color: 'grey.600', '&:hover': { bgcolor: 'grey.100' } }}>
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: 'grey.500' }}>
                                        No purchase orders found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* PAGINATION */}
                <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Button
                        onClick={() => previous && loadData(page - 1)}
                        disabled={!previous}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: 'none' }}
                    >
                        &larr; Previous
                    </Button>

                    <Typography variant="caption" sx={{ color: 'grey.400' }}>
                        Page {page}
                    </Typography>

                    <Button
                        onClick={() => next && loadData(page + 1)}
                        disabled={!next}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: 'none' }}
                    >
                        Next &rarr;
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
                PaperProps={{ sx: { borderRadius: 2, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}
            >
                <MenuItem onClick={runAction((row) => handleView(row))}>
                    <ListItemIcon><Visibility fontSize="small" sx={{ color: 'primary.main' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>View</ListItemText>
                </MenuItem>
                <MenuItem
                    disabled={actionMenu.row?.status === 'CANCELLED'}
                    onClick={runAction((row) => handleEditClick(row))}
                >
                    <ListItemIcon><Edit fontSize="small" sx={{ color: 'primary.main' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Edit PO</ListItemText>
                </MenuItem>
                <MenuItem
                    disabled={actionMenu.row?.status === 'COMPLETED' || actionMenu.row?.status === 'CANCELLED'}
                    onClick={runAction((row) => handleCancelPO(row.id))}
                >
                    <ListItemIcon><Cancel sx={{ fontSize: 16, color: 'error.main' }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: 'error.main' }}>Cancel PO</ListItemText>
                </MenuItem>
            </Menu>

            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />

            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                message={confirm.description}
                confirmText={confirm.confirmText || "Confirm"}
                onConfirm={confirm.action}
                onCancel={() => setConfirm({ ...confirm, open: false })}
            />

            <PasswordConfirmModal
                open={passwordModal.open}
                loading={passwordModal.loading}
                title="Confirm Cancellation"
                message={`Please enter your password to cancel this Purchase Order.`}
                onConfirm={passwordModal.onConfirm}
                onCancel={() => setPasswordModal({ open: false })}
            />

            <PurchaseOrderModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                data={selectedPO}
                onShowAlert={(type, message) => setToast({ open: true, type, message })}
                onUpdate={() => loadData(page)}
            />

            <EditPurchaseOrderModal
                open={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false);
                    setEditPOData(null);
                }}
                poData={editPOData}
                onUpdate={() => loadData(page)}
            />

            {/* REPORT MODAL */}
            <Dialog
                open={showReportModal}
                onClose={() => setShowReportModal(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'grey.100' }}>
                    <FileDownload sx={{ color: 'success.dark' }} />
                    <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', color: 'grey.800' }}>
                        Export PO Report
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 3, pb: 2 }}>
                    <Typography variant="body2" sx={{ color: 'grey.600', fontWeight: 500, mb: 2, mt: 1 }}>
                        Select Report Type:
                    </Typography>

                    <RadioGroup
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                    >
                        {/* Date Range Option */}
                        <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 1.5, mb: 1.5, '&:hover': { bgcolor: 'grey.50' }, cursor: 'pointer' }}>
                            <FormControlLabel
                                value="date_range"
                                control={<Radio />}
                                label={<Typography variant="body2" sx={{ fontWeight: 600, color: 'grey.700' }}>Date Range</Typography>}
                            />
                            {reportType === "date_range" && (
                                <Box sx={{ pl: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
                                    <TextField
                                        type="date"
                                        size="small"
                                        value={reportParams.start_date}
                                        onChange={(e) => setReportParams({ ...reportParams, start_date: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                        label="Start Date"
                                    />
                                    <TextField
                                        type="date"
                                        size="small"
                                        value={reportParams.end_date}
                                        onChange={(e) => setReportParams({ ...reportParams, end_date: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                        label="End Date"
                                    />
                                </Box>
                            )}
                        </Box>

                        {/* Pending PO Option */}
                        <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 1.5, mb: 1.5, '&:hover': { bgcolor: 'grey.50' }, cursor: 'pointer' }}>
                            <FormControlLabel
                                value="pending"
                                control={<Radio />}
                                label={<Typography variant="body2" sx={{ fontWeight: 600, color: 'grey.700' }}>Pending Purchase Orders</Typography>}
                            />
                        </Box>

                        {/* Vendor Option */}
                        <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 1.5, mb: 1.5, '&:hover': { bgcolor: 'grey.50' }, cursor: 'pointer' }}>
                            <FormControlLabel
                                value="vendor"
                                control={<Radio />}
                                label={<Typography variant="body2" sx={{ fontWeight: 600, color: 'grey.700' }}>Specific Vendor</Typography>}
                            />
                            {reportType === "vendor" && (
                                <Box sx={{ pl: 4, mt: 1 }}>
                                    <VendorSelector
                                        value={reportParams.vendor_id}
                                        onChange={(id) => setReportParams({ ...reportParams, vendor_id: id })}
                                        placeholder="Search and Select Vendor"
                                    />
                                </Box>
                            )}
                        </Box>
                    </RadioGroup>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'grey.100', bgcolor: 'grey.50' }}>
                    <Button
                        onClick={() => setShowReportModal(false)}
                        sx={{ fontWeight: 600, textTransform: 'none', color: 'grey.600' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleDownloadReport}
                        disabled={downloading}
                        startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <FileDownload />}
                        sx={{
                            bgcolor: 'success.dark',
                            '&:hover': { bgcolor: 'success.main' },
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2
                        }}
                    >
                        {downloading ? "Downloading..." : "Download Excel"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PurchaseOrderList;
