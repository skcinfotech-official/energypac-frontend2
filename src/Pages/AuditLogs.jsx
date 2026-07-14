import { useEffect, useState } from "react";
import {
    Box, Card, Typography, Button, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Chip, InputAdornment,
    Select, MenuItem, FormControl, InputLabel, Grid
} from "@mui/material";
import {
    History as HistoryIcon, Search as SearchIcon,
    CalendarMonth as CalendarIcon, Clear as ClearIcon,
    ChevronLeft as PrevIcon, ChevronRight as NextIcon,
} from "@mui/icons-material";
import { getAuditLogs } from "../services/auditLogService";
import AuditLogDetailModal from "../components/audit/AuditLogDetailModal";
import AlertToast from "../components/ui/AlertToast";

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [modelFilter, setModelFilter] = useState("");
    const [selectedLog, setSelectedLog] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });

    const fetchLogs = async (pageNum = 1, useUrl = null) => {
        try {
            setLoading(true);
            const res = await getAuditLogs({ url: useUrl, search: searchText, action: actionFilter, modelName: modelFilter, page: pageNum });
            const results = res.data?.results || res.results || res.data || [];
            setLogs(results); setCount(res.data?.count ?? res.count ?? results.length);
            setNext(res.data?.next ?? res.next ?? null); setPrevious(res.data?.previous ?? res.previous ?? null);
            setPage(pageNum);
        } catch (err) {
            setToast({ open: true, type: "error", message: "Failed to fetch audit logs from the server" });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchLogs(1), 400);
        return () => clearTimeout(timer);
    }, [searchText, actionFilter, modelFilter]);

    const handlePageChange = (newPageUrl, direction) => {
        if (!newPageUrl) return;
        fetchLogs(direction === "next" ? page + 1 : page - 1, newPageUrl);
    };

    const handleClearFilters = () => { setSearchText(""); setActionFilter(""); setModelFilter(""); };

    const formatTimestamp = (isoString) => {
        if (!isoString) return "-";
        return new Date(isoString).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const actionChipColor = (action) => {
        const a = action?.toUpperCase();
        if (a === "CREATE") return { bgcolor: '#E8F5E9', color: '#2E7D32' };
        if (a === "UPDATE") return { bgcolor: '#FFF8E1', color: '#F57F17' };
        return { bgcolor: '#FFEBEE', color: '#C62828' };
    };

    return (
        <Box>
            <Card>
                {/* Header */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HistoryIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} /> System Audit Logs
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Total Records: {count}</Typography>
                    </Box>
                    {(searchText || actionFilter || modelFilter) && (
                        <Button size="small" startIcon={<ClearIcon />} onClick={handleClearFilters} sx={{ fontWeight: 600 }}>
                            Clear Filters
                        </Button>
                    )}
                </Box>

                {/* Filters */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#FAFBFC' }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth size="small" placeholder="Search performer, object ref..." value={searchText} onChange={e => setSearchText(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} /></InputAdornment> }} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Component / Model</InputLabel>
                                <Select value={modelFilter} label="Component / Model" onChange={e => setModelFilter(e.target.value)}>
                                    <MenuItem value="">All Components</MenuItem>
                                    <MenuItem value="PurchaseOrder">Purchase Order</MenuItem>
                                    <MenuItem value="TransportEntry">Transport Entry</MenuItem>
                                    <MenuItem value="Requisition">Requisition</MenuItem>
                                    <MenuItem value="Item">Item</MenuItem>
                                    <MenuItem value="Vendor">Vendor</MenuItem>
                                    <MenuItem value="Currency">Currency</MenuItem>
                                    <MenuItem value="User">User</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Action Type</InputLabel>
                                <Select value={actionFilter} label="Action Type" onChange={e => setActionFilter(e.target.value)}>
                                    <MenuItem value="">All Actions</MenuItem>
                                    <MenuItem value="CREATE">CREATE</MenuItem>
                                    <MenuItem value="UPDATE">UPDATE</MenuItem>
                                    <MenuItem value="DELETE">DELETE</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>

                {/* Table */}
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Timestamp</TableCell>
                                <TableCell>Performer</TableCell>
                                <TableCell align="center">Action</TableCell>
                                <TableCell>Component</TableCell>
                                <TableCell>Affected Object</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                    <CircularProgress size={28} />
                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>Loading audit trail...</Typography>
                                </TableCell></TableRow>
                            )}
                            {!loading && logs.length === 0 && (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                    <Typography variant="body2" color="text.secondary">No audit logs found for the current filter settings.</Typography>
                                </TableCell></TableRow>
                            )}
                            {!loading && logs.map(log => (
                                <TableRow key={log.id} hover onClick={() => { setSelectedLog(log); setModalOpen(true); }} sx={{ cursor: 'pointer' }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <CalendarIcon sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                                            <Typography variant="body2">{formatTimestamp(log.timestamp)}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{log.user_name || "System"}</Typography>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', display: 'block', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.user}>
                                            {log.user || "Auto Job"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={log.action} size="small" sx={{ ...actionChipColor(log.action), fontWeight: 700, fontSize: '0.65rem' }} />
                                    </TableCell>
                                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{log.model_name}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.object_repr}>
                                            {log.object_repr || "-"}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }} title={log.object_id}>
                                            Ref ID: {log.object_id}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {!loading && count > 0 && (
                    <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Button size="small" startIcon={<PrevIcon />} disabled={!previous} onClick={() => handlePageChange(previous, "previous")} sx={{ fontWeight: 600 }}>
                            Previous
                        </Button>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Chip label={`Page ${page}`} size="small" sx={{ fontWeight: 700 }} />
                            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                Showing {logs.length} of {count} records
                            </Typography>
                        </Box>
                        <Button size="small" endIcon={<NextIcon />} disabled={!next} onClick={() => handlePageChange(next, "next")} sx={{ fontWeight: 600 }}>
                            Next
                        </Button>
                    </Box>
                )}
            </Card>

            <AuditLogDetailModal open={modalOpen} onClose={() => { setModalOpen(false); setSelectedLog(null); }} log={selectedLog} />
            <AlertToast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
        </Box>
    );
}
