import { useEffect, useState } from "react";
import {
    Box, Card, Typography, Button, TextField, MenuItem, Select, FormControl,
    InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent,
    DialogActions, RadioGroup, FormControlLabel, Radio, InputAdornment
} from "@mui/material";
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    FileDownload as ExcelIcon,
    Search as SearchIcon,
    ChevronLeft as PrevIcon, ChevronRight as NextIcon,
} from "@mui/icons-material";

import VendorModal from "../components/vendors/VendorModal";
import VendorViewModal from "../components/vendors/VendorViewModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AlertToast from "../components/ui/AlertToast";
import { getVendors, deleteVendor, getVendor, getVendorPerformanceReport } from "../services/vendorService";
import PasswordConfirmModal from "../components/ui/PasswordConfirmModal";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


export default function Vendors() {
    const [vendors, setVendors] = useState([]);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);

    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editVendor, setEditVendor] = useState(null);

    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [passwordModal, setPasswordModal] = useState({ open: false, onConfirm: null, loading: false });

    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewVendor, setViewVendor] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    // "" | "active" | "inactive"

    // Page state
    const [page, setPage] = useState(1);

    /* =========================
       REPORT STATE
       ========================= */
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState("date_range"); // "date_range", "vendor"
    const [reportDates, setReportDates] = useState({ start: "", end: "" });
    const [selectedVendorId, setSelectedVendorId] = useState("");
    const [allVendors, setAllVendors] = useState([]);
    const [downloading, setDownloading] = useState(false);

    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
    });

    /* =========================
       FETCH
       ========================= */
    const fetchVendors = async (pageNum = 1) => {
        try {
            setLoading(true);

            const pageUrl = pageNum > 1 ? `/api/vendors?page=${pageNum}` : null;

            const res = await getVendors({
                url: pageUrl,
                search: searchText,
                isActive:
                    statusFilter === "active"
                        ? true
                        : statusFilter === "inactive"
                            ? false
                            : null,
            });

            setVendors(res.results);
            setCount(res.count);
            setNext(res.next);
            setPrevious(res.previous);

            setPage(pageNum);
        } catch (err) {
            console.log(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to load vendors",
            });
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       EFFECT: search/filter change
       ========================= */
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVendors(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText, statusFilter]);

    /* =========================
       PAGINATION HANDLER
       ========================= */
    const handlePageChange = (newPage) => {
        fetchVendors(newPage);
    };

    /* =========================
       ACTION HANDLERS
       ========================= */
    const handleAddVendor = () => {
        setEditVendor(null);
        setOpenModal(true);
    };

    const handleEdit = (vendor) => {
        setEditVendor(vendor);
        setOpenModal(true);
    };

    const handleDelete = (vendor) => {
        setSelectedVendor(vendor);
        setShowConfirm(true);
    };

    const handleView = async (vendor) => {
        setViewModalOpen(true);
        setViewLoading(true);
        setViewVendor(null);
        try {
            const res = await getVendor(vendor.id);
            setViewVendor(res.data);
        } catch (err) {
            console.error(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to load vendor details",
            });
            setViewModalOpen(false);
        } finally {
            setViewLoading(false);
        }
    };

    const handleVendorSuccess = (mode) => {
        setToast({
            open: true,
            type: "success",
            message:
                mode === "edit"
                    ? "Vendor updated successfully"
                    : "Vendor added successfully",
        });
        fetchVendors(mode === "edit" ? page : 1);
    };

    const confirmDelete = () => {
        setShowConfirm(false);
        setPasswordModal({
            open: true,
            loading: false,
            onConfirm: async (password) => {
                setPasswordModal(prev => ({ ...prev, loading: true }));
                try {
                    const res = await deleteVendor(selectedVendor.id, { confirm_password: password });
                    setToast({
                        open: true,
                        type: "success",
                        message: res.data?.message || res.message || "Vendor deleted successfully",
                    });
                    fetchVendors(1);
                    setPasswordModal({ open: false });
                } catch (err) {
                    console.log(err);
                    const errorMsg = err.response?.data?.message || err.response?.data?.detail || "Failed to delete vendor";
                    setToast({
                        open: true,
                        type: "error",
                        message: errorMsg,
                    });
                    setPasswordModal(prev => ({ ...prev, loading: false }));
                } finally {
                    setSelectedVendor(null);
                }
            }
        });
    };

    const handleDownloadReport = async () => {
        if (reportType === "date_range") {
            if (!reportDates.start || !reportDates.end) {
                setToast({ open: true, type: "error", message: "Please select start and end dates" });
                return;
            }
        }

        setDownloading(true);
        try {
            const params = {
                start_date: reportDates.start,
                end_date: reportDates.end
            };

            if (reportType === "vendor") {
                if (!selectedVendorId) {
                    setToast({ open: true, type: "error", message: "Please select a vendor" });
                    setDownloading(false);
                    return;
                }
                params.vendor = selectedVendorId;
            }

            const res = await getVendorPerformanceReport(params);
            const data = res.data;
            const vendors = data.vendors || [];

            if (vendors.length === 0) {
                setToast({ open: true, type: "info", message: "No data found for the selected range" });
            }

            const wb = XLSX.utils.book_new();

            const sheetData = [
                [data.report_type || "Vendor Performance Report"],
                ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()],
                ["Date Range:", `${data.date_range?.start_date} to ${data.date_range?.end_date}`],
                [],
                ["SUMMARY"],
                ["Total Vendors:", data.total_vendors || 0],
                [],
                [
                    "Vendor Code", "Vendor Name", "Contact Person", "Phone", "Email",
                    "Quotations Submitted", "Quotations Selected", "Selection Rate (%)",
                    "Purchase Orders", "Completed POs", "Completion Rate (%)",
                    "Total Business Value", "Avg Quotation Value"
                ]
            ];

            vendors.forEach(v => {
                const p = v.performance || {};
                sheetData.push([
                    v.vendor_code,
                    v.vendor_name,
                    v.contact_person,
                    v.phone,
                    v.email,
                    p.quotations_submitted || 0,
                    p.quotations_selected || 0,
                    p.selection_rate || 0,
                    p.purchase_orders || 0,
                    p.completed_orders || 0,
                    p.completion_rate || 0,
                    p.total_business_value || 0,
                    p.average_quotation_value || 0
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(sheetData);
            XLSX.utils.book_append_sheet(wb, ws, "Performance Report");

            const filename = `Vendor_Performance_${params.start_date}_to_${params.end_date}.xlsx`;
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
            saveAs(blob, filename);

            setShowReportModal(false);
            setToast({ open: true, type: "success", message: "Report downloaded successfully" });

        } catch (err) {
            console.error("Report download failed", err);
            setToast({ open: true, type: "error", message: "Failed to download report" });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Box>
            <Card>
                {/* HEADER */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Vendors</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Total: {count}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<ExcelIcon />}
                            onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                                setReportDates({ start: firstDay, end: today });
                                setShowReportModal(true);
                            }}
                        >
                            Download Report
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddVendor}
                            sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' } }}
                        >
                            Add Vendor
                        </Button>
                    </Box>
                </Box>

                {/* SEARCH & FILTER */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#FAFBFC', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
                    <TextField
                        size="small"
                        placeholder="Search by name, code, phone"
                        label="Search Vendor"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        sx={{ flex: 1, minWidth: 220 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
                                </InputAdornment>
                            )
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* TABLE */}
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Vendor Name</TableCell>
                                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Contact Person</TableCell>
                                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Phone</TableCell>
                                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>GST</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Action</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            )}

                            {!loading && vendors.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">No vendors found</Typography>
                                    </TableCell>
                                </TableRow>
                            )}

                            {!loading && vendors.map((v, index) => (
                                <TableRow
                                    key={v.id}
                                    onClick={() => handleView(v)}
                                    sx={{
                                        cursor: 'pointer',
                                        bgcolor: index % 2 === 0 ? '#F8FAFC' : '#FFFFFF',
                                        '&:hover': { bgcolor: '#EBF0F5' },
                                        transition: 'background-color 0.15s'
                                    }}
                                >
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#1565C0' }}>
                                            {v.vendor_code}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {v.vendor_name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {v.contact_person || "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {v.phone || "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {v.email || "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {v.gst_number || "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => handleEdit(v)} color="primary">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={() => handleDelete(v)} color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* PAGINATION */}
                <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Button
                        size="small"
                        startIcon={<PrevIcon />}
                        disabled={!previous}
                        onClick={() => handlePageChange(page - 1)}
                        sx={{ fontWeight: 600 }}
                    >
                        Previous
                    </Button>

                    <Typography variant="caption" color="text.secondary">Page {page}</Typography>

                    <Button
                        size="small"
                        endIcon={<NextIcon />}
                        disabled={!next}
                        onClick={() => handlePageChange(page + 1)}
                        sx={{ fontWeight: 600 }}
                    >
                        Next
                    </Button>
                </Box>
            </Card>

            {/* MODAL */}
            <VendorModal
                key={editVendor ? editVendor.id : "add"}
                open={openModal}
                onClose={() => setOpenModal(false)}
                mode={editVendor ? "edit" : "add"}
                vendor={editVendor}
                onSuccess={handleVendorSuccess}
            />

            <VendorViewModal
                open={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                data={viewVendor}
                loading={viewLoading}
            />

            {/* CONFIRM DELETE */}
            <ConfirmDialog
                open={showConfirm}
                title="Delete Vendor"
                message={`Are you sure you want to delete "${selectedVendor?.vendor_name}"?`}
                confirmText="Delete"
                loading={deleting}
                onCancel={() => setShowConfirm(false)}
                onConfirm={confirmDelete}
            />

            {/* TOAST */}
            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />

            <PasswordConfirmModal
                open={passwordModal.open}
                loading={passwordModal.loading}
                title="Confirm Delete"
                message={`Please enter your password to delete "${selectedVendor?.vendor_name}".`}
                onConfirm={passwordModal.onConfirm}
                onCancel={() => setPasswordModal({ open: false })}
            />

            {/* REPORT MODAL */}
            <Dialog open={showReportModal} onClose={() => setShowReportModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ExcelIcon sx={{ color: 'success.main' }} /> Performance Report
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                        Select Report Type:
                    </Typography>

                    <RadioGroup value={reportType} onChange={(e) => {
                        const val = e.target.value;
                        setReportType(val);
                        if (val === "vendor" && allVendors.length === 0) {
                            getVendors({ isActive: true }).then(res => {
                                setAllVendors(res.results || []);
                            });
                        }
                    }}>
                        {/* Date Range Option */}
                        <FormControlLabel
                            value="date_range"
                            control={<Radio size="small" />}
                            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Date Range</Typography>}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                mx: 0,
                                mb: 1,
                                px: 1,
                                '&:hover': { bgcolor: '#FAFBFC' }
                            }}
                        />
                        {reportType === "date_range" && (
                            <Box sx={{ pl: 4, pt: 1, pb: 2, display: 'flex', gap: 2 }}>
                                <TextField
                                    type="date"
                                    label="Start Date"
                                    size="small"
                                    value={reportDates.start}
                                    onChange={(e) => setReportDates({ ...reportDates, start: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    type="date"
                                    label="End Date"
                                    size="small"
                                    value={reportDates.end}
                                    onChange={(e) => setReportDates({ ...reportDates, end: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ flex: 1 }}
                                />
                            </Box>
                        )}

                        {/* Specific Vendor Option */}
                        <FormControlLabel
                            value="vendor"
                            control={<Radio size="small" />}
                            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Specific Vendor</Typography>}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                mx: 0,
                                px: 1,
                                '&:hover': { bgcolor: '#FAFBFC' }
                            }}
                        />
                        {reportType === "vendor" && (
                            <Box sx={{ pl: 4, pt: 1, pb: 2 }}>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Select Vendor</InputLabel>
                                    <Select
                                        value={selectedVendorId}
                                        label="Select Vendor"
                                        onChange={(e) => setSelectedVendorId(e.target.value)}
                                    >
                                        <MenuItem value="">-- Choose Vendor --</MenuItem>
                                        {allVendors.map(v => (
                                            <MenuItem key={v.id} value={v.id}>
                                                {v.vendor_name} ({v.vendor_code})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                    </RadioGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowReportModal(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDownloadReport}
                        disabled={downloading}
                        variant="contained"
                        color="success"
                        startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <ExcelIcon />}
                    >
                        {downloading ? "Downloading..." : "Download Excel"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
