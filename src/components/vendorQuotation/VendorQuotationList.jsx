import { useEffect, useState } from "react";
import {
    Box, Card, Typography, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Tooltip,
    CircularProgress, Chip
} from "@mui/material";
import {
    Visibility as ViewIcon,
    Edit as EditIcon,
    ReceiptLong as InvoiceIcon,
    Add as AddIcon,
    ChevronLeft as PrevIcon,
    ChevronRight as NextIcon,
} from "@mui/icons-material";

import { getVendorQuotationsList } from "../../services/vendorQuotationService";
import VendorQuotationViewModal from "./VendorQuotationViewModal";
import VendorQuotationEditModal from "./VendorQuotationEditModal";
import AlertToast from "../ui/AlertToast";
import RequisitionSelector from "../common/RequisitionSelector";
import VendorSelector from "../common/VendorSelector";

const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode?.toString().toUpperCase()) {
        case "USD": return "$";
        case "INR": return "₹";
        case "EUR": return "€";
        case "GBP": return "£";
        case "JPY": return "¥";
        case "CAD": return "C$";
        case "AUD": return "A$";
        default: return currencyCode || "₹";
    }
};

const formatAmount = (amount, currencyCode) => {
    const num = Number(amount) || 0;
    const locale = currencyCode?.toString().toUpperCase() === "INR" ? "en-IN" : "en-US";
    return num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const VendorQuotationList = ({ initialViewId, onNewQuotation }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });

    // Filter States
    const [selectedRequisition, setSelectedRequisition] = useState(null);
    const [selectedVendor, setSelectedVendor] = useState(null);

    // View Modal State
    const [viewId, setViewId] = useState(null);
    const [openView, setOpenView] = useState(false);

    // Edit Modal State
    const [editId, setEditId] = useState(null);
    const [openEdit, setOpenEdit] = useState(false);

    const loadData = async (url = null, reqId = selectedRequisition, vendId = selectedVendor) => {
        setLoading(true);
        try {
            // Fetch quotations matching the conditional filters
            const res = await getVendorQuotationsList(url, reqId, vendId);
            setData(res.results || []);
            setCount(res.count || 0);
            setNext(res.next);
            setPrevious(res.previous);
        } catch (err) {
            console.error("Failed to load quotations list", err);
            setToast({ open: true, type: "error", message: "Failed to load quotations" });
        } finally {
            setLoading(false);
        }
    };

    // Reload list when requisition or vendor filters change
    useEffect(() => {
        loadData(null, selectedRequisition, selectedVendor);
    }, [selectedRequisition, selectedVendor]);

    useEffect(() => {
        if (initialViewId) {
            handleView(initialViewId);
        }
    }, [initialViewId]);

    const handleView = (id) => {
        setViewId(id);
        setOpenView(true);
    };

    const handleEdit = (id) => {
        setEditId(id);
        setOpenEdit(true);
    };

    const handleEditSuccess = () => {
        loadData(); // Refresh list to show updated totals if any
        setToast({ open: true, type: "success", message: "Quotation updated successfully" });
    };

    return (
        <Box>
            <Card>
                {/* HEADER / TOOLBAR */}
                <Box sx={{
                    px: 2.5, py: 2,
                    borderBottom: '1px solid', borderColor: 'divider',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 1,
                    bgcolor: '#FAFBFC'
                }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InvoiceIcon sx={{ color: '#1565C0', fontSize: '1.3rem' }} />
                            Vendor Quotations
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                            Total: {count}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => loadData()}
                            sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'none' }}
                        >
                            Refresh
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={onNewQuotation}
                            sx={{
                                bgcolor: '#1565C0',
                                '&:hover': { bgcolor: '#0D47A1' },
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                textTransform: 'none'
                            }}
                        >
                            New Quotation
                        </Button>
                    </Box>
                </Box>

                {/* SEARCH & FILTER */}
                <Box sx={{
                    px: 2.5, py: 2,
                    borderBottom: '1px solid', borderColor: 'divider',
                    bgcolor: '#FAFBFC'
                }}>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: 2
                    }}>
                        <Box sx={{ position: 'relative', zIndex: 30 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, ml: 0.5, display: 'block' }}>
                                Filter by Requisition
                            </Typography>
                            <RequisitionSelector
                                value={selectedRequisition}
                                onChange={(id) => setSelectedRequisition(id)}
                                placeholder="All Requisitions"
                            />
                        </Box>
                        <Box sx={{ position: 'relative', zIndex: 20 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, ml: 0.5, display: 'block' }}>
                                Filter by Vendor
                            </Typography>
                            <VendorSelector
                                value={selectedVendor}
                                onChange={(id) => setSelectedVendor(id)}
                                placeholder="All Vendors"
                            />
                        </Box>
                    </Box>
                </Box>

                {/* TABLE */}
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                                <TableCell sx={{ fontWeight: 700, color: '#334155', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', py: 1.5 }}>
                                    Quotation No
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', py: 1.5 }}>
                                    Requisition
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', py: 1.5 }}>
                                    Vendor
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', py: 1.5 }}>
                                    Date
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', py: 1.5, textAlign: 'right' }}>
                                    Total Amount
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', py: 1.5, textAlign: 'center' }}>
                                    Items
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#334155', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', py: 1.5, textAlign: 'center' }}>
                                    Action
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No quotations found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row, index) => (
                                    <TableRow
                                        key={row.id}
                                        hover
                                        sx={{
                                            bgcolor: index % 2 === 0 ? '#F8FAFC' : '#FFFFFF',
                                            '&:hover': { bgcolor: '#E2E8F0' }
                                        }}
                                    >
                                        <TableCell sx={{ py: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
                                                {row.quotation_number || (
                                                    <Typography component="span" variant="body2" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                                                        Draft
                                                    </Typography>
                                                )}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1 }}>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#334155' }}>
                                                {row.requisition_number}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                                {row.vendor_name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748B' }}>
                                                    {row.vendor_code}
                                                </Typography>
                                                {row.gst_number && (
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1565C0', fontFamily: 'monospace' }}>
                                                        GST: {row.gst_number}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ py: 1 }}>
                                            <Typography variant="body2" sx={{ color: '#334155' }}>
                                                {row.quotation_date}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1, textAlign: 'right' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                                {getCurrencySymbol(row.currency)} {formatAmount(row.total_amount, row.currency)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1, textAlign: 'center' }}>
                                            <Chip
                                                size="small"
                                                label={row.total_items}
                                                variant="outlined"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '0.8rem',
                                                    color: '#334155',
                                                    borderColor: '#CBD5E1',
                                                    bgcolor: '#F1F5F9'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ py: 1, textAlign: 'center' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                                <Tooltip title="View Details">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleView(row.id)}
                                                        sx={{
                                                            color: '#94A3B8',
                                                            '&:hover': { color: '#1565C0', bgcolor: '#EFF6FF' }
                                                        }}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit Quotation">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEdit(row.id)}
                                                        sx={{
                                                            color: '#3B82F6',
                                                            '&:hover': { color: '#1565C0', bgcolor: '#EFF6FF' }
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* PAGINATION */}
                <Box sx={{
                    px: 2.5, py: 1.5,
                    borderTop: '1px solid', borderColor: 'divider',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    bgcolor: '#FAFBFC'
                }}>
                    <Button
                        size="small"
                        startIcon={<PrevIcon />}
                        disabled={!previous}
                        onClick={() => previous && loadData(previous)}
                        sx={{ fontWeight: 600 }}
                    >
                        Previous
                    </Button>
                    <Button
                        size="small"
                        endIcon={<NextIcon />}
                        disabled={!next}
                        onClick={() => next && loadData(next)}
                        sx={{ fontWeight: 600 }}
                    >
                        Next
                    </Button>
                </Box>
            </Card>

            {/* VIEW MODAL */}
            <VendorQuotationViewModal
                open={openView}
                onClose={() => setOpenView(false)}
                quotationId={viewId}
            />

            {/* EDIT MODAL */}
            <VendorQuotationEditModal
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                quotationId={editId}
                onSuccess={handleEditSuccess}
            />

            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />
        </Box>
    );
};

export default VendorQuotationList;
