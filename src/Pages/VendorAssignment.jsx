import { useEffect, useState } from "react";
import {
    Box, Card, Typography, Button, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Tooltip, CircularProgress,
    Chip, InputAdornment
} from "@mui/material";
import {
    Add as AddIcon, Edit as EditIcon,
    Search as SearchIcon, ChevronLeft as PrevIcon, ChevronRight as NextIcon,
} from "@mui/icons-material";
import { getVendorAssignments } from "../services/vendorAssignment";
import VendorAssignmentModal from "../components/vendorAssignment/VendorAssignmentModal";
import AlertToast from "../components/ui/AlertToast";

const VendorAssignment = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [page, setPage] = useState(1);
    const [searchText, setSearchText] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [viewOnly, setViewOnly] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });

    const loadData = async (pageNum = 1) => {
        setLoading(true);
        try {
            const res = await getVendorAssignments(pageNum, searchText);
            const resData = res.data;
            if (resData.results) {
                setData(resData.results); setCount(resData.count || resData.results.length);
                setNext(resData.next); setPrevious(resData.previous);
            } else {
                setData(Array.isArray(resData) ? resData : []); setCount(Array.isArray(resData) ? resData.length : 0);
            }
            setPage(pageNum);
        } catch (err) {
            const data = err.response?.data;
            const errorMsg = err.response?.status === 400
                ? (data?.non_field_errors?.[0] || data?.message || data?.error || data?.detail || "Validation error")
                : (data?.error || data?.detail || data?.message || "Failed to load vendor assignments");
            setToast({ open: true, type: "error", message: errorMsg });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        const timer = setTimeout(() => loadData(1), 500);
        return () => clearTimeout(timer);
    }, [searchText]);

    const handleEdit = (row) => { setEditData(row); setViewOnly(false); setOpenModal(true); };
    const handleView = (row) => { setEditData(row); setViewOnly(true); setOpenModal(true); };
    const handleAdd = () => { setEditData(null); setViewOnly(false); setOpenModal(true); };
    const handleSuccess = () => {
        setToast({ open: true, type: "success", message: editData ? "Assignment updated successfully" : "Assignment created successfully" });
        loadData(page);
    };

    const getStatusChip = (row) => {
        if (row.status === "Completed") return <Chip label="Completed" size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700, fontSize: '0.65rem' }} />;
        if (row.quotations?.length > 0 || row.is_quoted) return <Chip label="Quoted" size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 700, fontSize: '0.65rem' }} />;
        return <Chip label="Pending" size="small" sx={{ bgcolor: '#EBF5FF', color: '#1565C0', fontWeight: 700, fontSize: '0.65rem' }} />;
    };

    return (
        <Box>
            <AlertToast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
            <Card>
                {/* Header */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Vendor Assignments</Typography>
                        <Typography variant="caption" color="text.secondary">Total: {count}</Typography>
                    </Box>
                    <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>Assign Vendor</Button>
                </Box>

                {/* Search */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#FAFBFC' }}>
                    <TextField size="small" fullWidth placeholder="Search by req no, vendor..." value={searchText} onChange={e => setSearchText(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} /></InputAdornment> }} />
                </Box>

                {/* Table */}
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Requisition</TableCell>
                                <TableCell>Vendor</TableCell>
                                <TableCell>Assigned By</TableCell>
                                <TableCell align="center">Items</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
                            ) : data.length > 0 ? data.map(row => (
                                <TableRow key={row.id} hover onClick={() => handleView(row)} sx={{ cursor: 'pointer' }}>
                                    <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>{row.requisition_number}</Typography></TableCell>
                                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{row.vendor_details?.vendor_name || "-"}</Typography></TableCell>
                                    <TableCell><Typography variant="body2" color="text.secondary">{row.assigned_by_name || "-"}</Typography></TableCell>
                                    <TableCell align="center"><Chip label={row.total_items} size="small" variant="outlined" sx={{ fontWeight: 600 }} /></TableCell>
                                    <TableCell><Typography variant="caption" color="text.secondary">{row.assignment_date ? new Date(row.assignment_date).toLocaleDateString() : "-"}</Typography></TableCell>
                                    <TableCell align="center">{getStatusChip(row)}</TableCell>
                                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title={(row.quotations?.length > 0 || row.is_quoted || row.status === "Completed") ? "View only" : "Edit"}>
                                                <IconButton size="small" color={(row.quotations?.length > 0 || row.is_quoted || row.status === "Completed") ? "default" : "primary"}
                                                    onClick={() => (row.quotations?.length > 0 || row.is_quoted || row.status === "Completed") ? handleView(row) : handleEdit(row)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">No assignments found</Typography>
                                </TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Button size="small" startIcon={<PrevIcon />} disabled={!previous} onClick={() => loadData(page - 1)} sx={{ fontWeight: 600 }}>Previous</Button>
                    <Typography variant="caption" color="text.secondary">Page {page}</Typography>
                    <Button size="small" endIcon={<NextIcon />} disabled={!next} onClick={() => loadData(page + 1)} sx={{ fontWeight: 600 }}>Next</Button>
                </Box>
            </Card>

            <VendorAssignmentModal open={openModal} editData={editData} viewOnly={viewOnly} onClose={() => setOpenModal(false)} onSuccess={handleSuccess} />
        </Box>
    );
};

export default VendorAssignment;
