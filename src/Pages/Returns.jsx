import { useState, useEffect } from "react";
import {
    Box, Card, Typography, Button, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Tooltip, CircularProgress,
    Chip, InputAdornment, Tabs, Tab,
} from "@mui/material";
import {
    Add as AddIcon, Search as SearchIcon, Visibility as ViewIcon,
    Check as CheckIcon, Close as CloseIcon, Undo as UndoIcon,
    Inventory2 as BoxOpenIcon, LocalShipping as TruckIcon,
    ChevronLeft as PrevIcon, ChevronRight as NextIcon,
} from "@mui/icons-material";
import {
    getSalesReturns, approveSalesReturn, cancelSalesReturn,
    getPurchaseReturns, approvePurchaseReturn, cancelPurchaseReturn,
} from "../services/returnsService";
import SalesReturnModal from "../components/returns/SalesReturnModal";
import PurchaseReturnModal from "../components/returns/PurchaseReturnModal";
import ReturnDetailsModal from "../components/returns/ReturnDetailsModal";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const Returns = () => {
    const [activeTab, setActiveTab] = useState("sales");
    const [searchText, setSearchText] = useState("");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [viewItem, setViewItem] = useState(null);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [confirm, setConfirm] = useState({ open: false, title: "", message: "", action: null, loading: false, confirmButtonClass: "", iconBgClass: "", icon: undefined });

    const fetchData = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const res = activeTab === "sales"
                ? await getSalesReturns(page, search)
                : await getPurchaseReturns(page, search);
            setData(res.results || []);
            setTotalCount(res.count || 0);
            setNextPage(res.next);
            setPrevPage(res.previous);
        } catch (err) {
            console.error("Failed to fetch returns", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        setSearchText("");
    }, [activeTab]);

    useEffect(() => {
        const timer = setTimeout(() => fetchData(currentPage, searchText), 400);
        return () => clearTimeout(timer);
    }, [searchText, currentPage, activeTab]);

    const getStatusChipProps = (s) => {
        switch (s) {
            case 'APPROVED': return { color: "success", variant: "outlined" };
            case 'CANCELLED': return { color: "error", variant: "outlined" };
            case 'DRAFT':
            default: return { color: "default", variant: "outlined" };
        }
    };

    const handleApprove = (id) => {
        setConfirm({
            open: true,
            title: `Approve ${activeTab === "sales" ? "Sales" : "Purchase"} Return?`,
            message: activeTab === "sales"
                ? "Stock will be restored (except unusable items) and a Credit Note will be generated."
                : "Stock will be deducted (items going back to vendor) and a Debit Note will be generated.",
            confirmText: "Approve",
            confirmButtonClass: "green",
            iconBgClass: "success",
            icon: CheckIcon,
            action: async () => {
                setConfirm(prev => ({ ...prev, loading: true }));
                try {
                    const res = activeTab === "sales"
                        ? await approveSalesReturn(id)
                        : await approvePurchaseReturn(id);
                    setAlert({ open: true, type: "success", message: res.message || "Return approved" });
                    fetchData(currentPage, searchText);
                } catch (err) {
                    const msg = err.response?.data?.error || "Failed to approve return";
                    setAlert({ open: true, type: "error", message: msg });
                } finally {
                    setConfirm({ open: false });
                }
            }
        });
    };

    const handleCancel = (id) => {
        setConfirm({
            open: true,
            title: `Cancel ${activeTab === "sales" ? "Sales" : "Purchase"} Return?`,
            message: "This will cancel the return. If it was approved, stock changes will be reversed.",
            confirmText: "Cancel Return",
            confirmButtonClass: "error",
            iconBgClass: "error",
            icon: CloseIcon,
            action: async () => {
                setConfirm(prev => ({ ...prev, loading: true }));
                try {
                    const res = activeTab === "sales"
                        ? await cancelSalesReturn(id)
                        : await cancelPurchaseReturn(id);
                    setAlert({ open: true, type: "success", message: res.message || "Return cancelled" });
                    fetchData(currentPage, searchText);
                } catch (err) {
                    const msg = err.response?.data?.error || "Failed to cancel return";
                    setAlert({ open: true, type: "error", message: msg });
                } finally {
                    setConfirm({ open: false });
                }
            }
        });
    };

    const colSpan = activeTab === "purchase" ? 8 : 7;

    return (
        <Box sx={{ p: { xs: 0.5, sm: 1 }, display: "flex", flexDirection: "column", gap: 2 }}>
            <Card
                sx={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: 1,
                    overflow: "hidden",
                }}
            >
                {/* HEADER */}
                <Box
                    sx={{
                        px: 3,
                        py: 2.5,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { sm: "center" },
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                color: "text.primary",
                                letterSpacing: "-0.01em",
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <UndoIcon sx={{ color: "primary.main" }} /> Returns Management
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600, mt: 0.5 }}>
                            Total: {totalCount}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateModalOpen(true)}
                        sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: 3,
                            px: 2.5,
                            py: 1,
                        }}
                    >
                        New {activeTab === "sales" ? "Sales" : "Purchase"} Return
                    </Button>
                </Box>

                {/* TABS */}
                <Box sx={{ px: 3, borderBottom: "1px solid", borderColor: "divider" }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, val) => setActiveTab(val)}
                        sx={{
                            "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                minHeight: 48,
                            },
                        }}
                    >
                        <Tab
                            value="sales"
                            label="Sales Returns"
                            icon={<BoxOpenIcon sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                        />
                        <Tab
                            value="purchase"
                            label="Purchase Returns"
                            icon={<TruckIcon sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* SEARCH */}
                <Box
                    sx={{
                        px: 3,
                        py: 2,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        bgcolor: "action.hover",
                    }}
                >
                    <TextField
                        value={searchText}
                        onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                        placeholder={`Search ${activeTab === "sales" ? "sales" : "purchase"} returns...`}
                        size="small"
                        sx={{ maxWidth: 400 }}
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: "text.disabled", fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* TABLE */}
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "text.secondary" }}>
                                    Return No.
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "text.secondary" }}>
                                    {activeTab === "sales" ? "PI Number" : "PO Number"}
                                </TableCell>
                                {activeTab === "purchase" && (
                                    <TableCell sx={{ fontWeight: 700, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "text.secondary" }}>
                                        Vendor
                                    </TableCell>
                                )}
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "text.secondary" }}>
                                    Date
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "text.secondary", textAlign: "right" }}>
                                    Amount
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "text.secondary", textAlign: "center" }}>
                                    {activeTab === "sales" ? "Credit Note" : "Debit Note"}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "text.secondary", textAlign: "center" }}>
                                    Status
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "text.secondary", textAlign: "center" }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={colSpan} sx={{ textAlign: "center", py: 6, color: "text.disabled", fontWeight: 600 }}>
                                        <CircularProgress size={28} sx={{ mb: 1 }} />
                                        <Typography variant="body2" sx={{ color: "text.disabled", fontWeight: 600 }}>
                                            Loading...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : data.length > 0 ? data.map(item => {
                                const st = (item.status || "DRAFT").toUpperCase();
                                const chipProps = getStatusChipProps(st);
                                const noteNumber = activeTab === "sales" ? item.credit_note_number : item.debit_note_number;
                                return (
                                    <TableRow key={item.id} hover>
                                        <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700, fontFamily: "monospace", color: "primary.main" }}>
                                            {item.return_number}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "0.75rem", fontFamily: "monospace", color: "text.secondary" }}>
                                            {activeTab === "sales" ? item.pi_number : item.po_number}
                                        </TableCell>
                                        {activeTab === "purchase" && (
                                            <TableCell sx={{ fontSize: "0.875rem", color: "text.secondary", fontWeight: 500, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {item.vendor_name}
                                            </TableCell>
                                        )}
                                        <TableCell sx={{ fontSize: "0.875rem", color: "text.secondary", fontWeight: 500 }}>
                                            {item.return_date}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: "0.875rem", textAlign: "right", fontWeight: 700, color: "text.primary", fontFamily: "monospace" }}>
                                            <Typography component="span" sx={{ fontSize: "0.625rem", color: "text.disabled", mr: 0.5 }}>
                                                {item.currency}
                                            </Typography>
                                            {Number(item.total_return_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: "center" }}>
                                            {noteNumber ? (
                                                <Chip
                                                    label={noteNumber}
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                    sx={{ fontSize: "0.625rem", fontWeight: 700, fontFamily: "monospace" }}
                                                />
                                            ) : (
                                                <Typography variant="body2" sx={{ color: "text.disabled" }}>
                                                    —
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: "center" }}>
                                            <Chip
                                                label={st}
                                                size="small"
                                                color={chipProps.color}
                                                variant={chipProps.variant}
                                                sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ textAlign: "center" }}>
                                            <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" onClick={() => setViewItem(item)} sx={{ color: "text.secondary", "&:hover": { color: "primary.main", bgcolor: "primary.lighter" } }}>
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={st === 'DRAFT' ? "Approve" : "Cannot approve"}>
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => st === 'DRAFT' && handleApprove(item.id)}
                                                            disabled={st !== 'DRAFT'}
                                                            sx={{
                                                                color: st === 'DRAFT' ? "success.main" : "text.disabled",
                                                                "&:hover": st === 'DRAFT' ? { color: "success.dark", bgcolor: "success.lighter" } : {},
                                                                opacity: st !== 'DRAFT' ? 0.4 : 1,
                                                            }}
                                                        >
                                                            <CheckIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title={st === 'CANCELLED' ? "Already cancelled" : "Cancel return"}>
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => st !== 'CANCELLED' && handleCancel(item.id)}
                                                            disabled={st === 'CANCELLED'}
                                                            sx={{
                                                                color: st !== 'CANCELLED' ? "error.main" : "text.disabled",
                                                                "&:hover": st !== 'CANCELLED' ? { color: "error.dark", bgcolor: "error.lighter" } : {},
                                                                opacity: st === 'CANCELLED' ? 0.4 : 1,
                                                            }}
                                                        >
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={colSpan} sx={{ textAlign: "center", py: 6, color: "text.disabled", fontWeight: 600, fontStyle: "italic" }}>
                                        No {activeTab === "sales" ? "sales" : "purchase"} returns found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* PAGINATION */}
                <Box
                    sx={{
                        px: 3,
                        py: 2,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Button
                        size="small"
                        startIcon={<PrevIcon />}
                        onClick={() => prevPage && setCurrentPage(p => p - 1)}
                        disabled={!prevPage}
                        sx={{ textTransform: "none", fontWeight: 600, color: "text.secondary" }}
                    >
                        Previous
                    </Button>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.disabled" }}>
                        Page {currentPage}
                    </Typography>
                    <Button
                        size="small"
                        endIcon={<NextIcon />}
                        onClick={() => nextPage && setCurrentPage(p => p + 1)}
                        disabled={!nextPage}
                        sx={{ textTransform: "none", fontWeight: 600, color: "text.secondary" }}
                    >
                        Next
                    </Button>
                </Box>
            </Card>

            {/* CREATE MODALS */}
            {activeTab === "sales" ? (
                <SalesReturnModal
                    isOpen={createModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onSuccess={(msg) => { fetchData(currentPage, searchText); setAlert({ open: true, type: "success", message: msg }); }}
                />
            ) : (
                <PurchaseReturnModal
                    isOpen={createModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onSuccess={(msg) => { fetchData(currentPage, searchText); setAlert({ open: true, type: "success", message: msg }); }}
                />
            )}

            {/* DETAILS MODAL */}
            <ReturnDetailsModal
                isOpen={!!viewItem}
                onClose={() => setViewItem(null)}
                returnData={viewItem}
                type={activeTab}
            />

            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                message={confirm.message}
                confirmText={confirm.confirmText}
                loading={confirm.loading}
                onConfirm={confirm.action}
                onCancel={() => setConfirm({ open: false })}
                icon={confirm.icon}
                confirmButtonClass={confirm.confirmButtonClass}
                iconBgClass={confirm.iconBgClass}
            />

            <AlertToast open={alert.open} type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, open: false })} />
        </Box>
    );
};

export default Returns;
