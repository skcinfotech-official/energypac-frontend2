import { useEffect, useState } from "react";
import {
    Box, Card, Typography, Button, TextField, Select, MenuItem, FormControl,
    InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, CircularProgress, Chip, InputAdornment
} from "@mui/material";
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Public as GlobeIcon, Search as SearchIcon,
    ChevronLeft as PrevIcon, ChevronRight as NextIcon,
} from "@mui/icons-material";

import CurrencyModal from "../components/currencies/CurrencyModal";
import CurrencyViewModal from "../components/currencies/CurrencyViewModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AlertToast from "../components/ui/AlertToast";
import PasswordConfirmModal from "../components/ui/PasswordConfirmModal";
import { getCurrencies, deleteCurrency, getCurrency } from "../services/currencyService";

export default function Currency() {
    const [currencies, setCurrencies] = useState([]);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);

    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editCurrency, setEditCurrency] = useState(null);

    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [passwordModal, setPasswordModal] = useState({ open: false, onConfirm: null, loading: false });

    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewCurrency, setViewCurrency] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState(""); // "" | "active" | "inactive"

    // Page state
    const [page, setPage] = useState(1);

    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
    });

    /* =========================
       FETCH — accepts explicit pageNum
       ========================= */
    const fetchCurrencies = async (pageNum = 1) => {
        try {
            setLoading(true);

            // Build URL with page number when not on page 1
            const pageUrl = pageNum > 1 ? `/api/currencies?page=${pageNum}` : undefined;

            const res = await getCurrencies({
                url: pageUrl,
                search: searchText,
                isActive:
                    statusFilter === "active"
                        ? true
                        : statusFilter === "inactive"
                            ? false
                            : null,
            });

            // Handle standard paginated response vs raw list response
            const results = res.data?.results || res.results || res.data || [];
            const totalCount = res.data?.count ?? res.count ?? results.length;
            const nextUrl = res.data?.next ?? res.next ?? null;
            const prevUrl = res.data?.previous ?? res.previous ?? null;

            setCurrencies(results);
            setCount(totalCount);
            setNext(nextUrl);
            setPrevious(prevUrl);

            setPage(pageNum);
        } catch (err) {
            console.error(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to load currencies",
            });
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       EFFECT: search/filter change → debounce + RESET to page 1
       ========================= */
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCurrencies(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText, statusFilter]);

    /* =========================
       PAGINATION HANDLER
       ========================= */
    const handlePageChange = (newPage) => {
        fetchCurrencies(newPage);
    };

    /* =========================
       ACTION HANDLERS
       ========================= */
    const handleAddCurrency = () => {
        setEditCurrency(null);
        setOpenModal(true);
    };

    const handleEdit = (currency) => {
        setEditCurrency(currency);
        setOpenModal(true);
    };

    const handleDelete = (currency) => {
        setSelectedCurrency(currency);
        setShowConfirm(true);
    };

    const handleView = async (currency) => {
        setViewModalOpen(true);
        setViewLoading(true);
        setViewCurrency(null);
        try {
            const res = await getCurrency(currency.id);
            setViewCurrency(res.data);
        } catch (err) {
            console.error(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to load currency details",
            });
            setViewModalOpen(false);
        } finally {
            setViewLoading(false);
        }
    };

    const handleCurrencySuccess = (mode) => {
        setToast({
            open: true,
            type: "success",
            message:
                mode === "edit"
                    ? "Currency updated successfully"
                    : "Currency added successfully",
        });
        fetchCurrencies(mode === "edit" ? page : 1);
    };

    const confirmDelete = () => {
        setShowConfirm(false);
        setPasswordModal({
            open: true,
            loading: false,
            onConfirm: async (password) => {
                setPasswordModal(prev => ({ ...prev, loading: true }));
                try {
                    const res = await deleteCurrency(selectedCurrency.id, { confirm_password: password });
                    setToast({
                        open: true,
                        type: "success",
                        message: res.data?.message || res.message || "Currency deleted successfully",
                    });
                    fetchCurrencies(1);
                    setPasswordModal({ open: false });
                } catch (err) {
                    console.error(err);
                    const errorMsg = err.response?.data?.message || err.response?.data?.detail || "Failed to delete currency";
                    setToast({
                        open: true,
                        type: "error",
                        message: errorMsg,
                    });
                    setPasswordModal(prev => ({ ...prev, loading: false }));
                } finally {
                    setSelectedCurrency(null);
                }
            }
        });
    };

    return (
        <Box>
            <Card>
                {/* HEADER */}
                <Box sx={{
                    px: 2.5, py: 2,
                    borderBottom: '1px solid', borderColor: 'divider',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 1
                }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GlobeIcon sx={{ color: '#1565C0', fontSize: '1.3rem' }} /> Currencies
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Total: {count}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddCurrency}
                            sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' } }}
                        >
                            Add Currency
                        </Button>
                    </Box>
                </Box>

                {/* SEARCH & FILTER */}
                <Box sx={{
                    px: 2.5, py: 2,
                    borderBottom: '1px solid', borderColor: 'divider',
                    bgcolor: '#FAFBFC',
                    display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end'
                }}>
                    <TextField
                        size="small"
                        placeholder="Search by code, name, symbol"
                        label="Search Currency"
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
                                <TableCell sx={{ fontWeight: 700, color: '#1565C0' }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#1565C0' }}>Currency Name</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#1565C0' }}>Symbol</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#1565C0' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#1565C0' }} align="center">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            )}

                            {!loading && currencies.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No currencies found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}

                            {!loading && currencies.map((c) => (
                                <TableRow key={c.id} hover onClick={() => handleView(c)} sx={{ cursor: 'pointer' }}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1565C0' }}>
                                            {c.code}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {c.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>
                                            {c.symbol || "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={c.is_active ? "Active" : "Inactive"}
                                            color={c.is_active ? "success" : "error"}
                                            variant="outlined"
                                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                        />
                                    </TableCell>
                                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => handleEdit(c)} color="primary">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={() => handleDelete(c)} color="error">
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
                <Box sx={{
                    px: 2.5, py: 1.5,
                    borderTop: '1px solid', borderColor: 'divider',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <Button
                        size="small"
                        startIcon={<PrevIcon />}
                        disabled={!previous}
                        onClick={() => handlePageChange(page - 1)}
                        sx={{ fontWeight: 600 }}
                    >
                        Previous
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                        Page {page}
                    </Typography>
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

            {/* MODALS */}
            <CurrencyModal
                key={editCurrency ? editCurrency.id : "add"}
                open={openModal}
                onClose={() => setOpenModal(false)}
                mode={editCurrency ? "edit" : "add"}
                currency={editCurrency}
                onSuccess={handleCurrencySuccess}
            />

            <CurrencyViewModal
                open={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                data={viewCurrency}
                loading={viewLoading}
            />

            {/* CONFIRM DELETE */}
            <ConfirmDialog
                open={showConfirm}
                title="Delete Currency"
                message={`Are you sure you want to delete "${selectedCurrency?.name}" (${selectedCurrency?.code})?`}
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
                message={`Please enter your password to delete "${selectedCurrency?.name}".`}
                onConfirm={passwordModal.onConfirm}
                onCancel={() => setPasswordModal({ open: false })}
            />
        </Box>
    );
}
