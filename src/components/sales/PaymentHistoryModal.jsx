import React, { useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Button, IconButton, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Card, CardContent, Grid
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import InfoIcon from "@mui/icons-material/Info";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PersonIcon from "@mui/icons-material/Person";
import { fetchFinancePOPaymentHistory } from "../../services/financeService";

const PaymentHistoryModal = ({ open, onClose, poId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && poId) {
            const loadHistory = async () => {
                setLoading(true);
                try {
                    const res = await fetchFinancePOPaymentHistory(poId);
                    setData(res);
                } catch (err) {
                    console.error("Failed to load payment history", err);
                } finally {
                    setLoading(false);
                }
            };
            loadHistory();
        }
    }, [open, poId]);

    const formatCurrency = (amount) => {
        const curr = data?.currency || 'INR';
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

    const formatDate = (dateString) => {
        if (!dateString) return "---";
        return new Date(dateString).toLocaleDateString(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            sx={{ zIndex: 60 }}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: "90vh",
                    overflow: "hidden",
                }
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "#1a1a2e",
                    color: "white",
                    py: 2.5,
                    px: 3,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <HistoryIcon sx={{ color: "#f59e0b", fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                            Payment History
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#cbd5e1", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {data?.po_number || "Loading..."} • {data?.vendor_name}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: "#cbd5e1", "&:hover": { color: "white" } }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ bgcolor: "#f1f5f9", p: 3, overflowY: "auto" }}>
                {loading ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 2 }}>
                        <CircularProgress size={40} sx={{ color: "#f59e0b" }} />
                        <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Loading payments...
                        </Typography>
                    </Box>
                ) : data ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ bgcolor: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", "&:hover": { boxShadow: "0 4px 6px rgba(0,0,0,0.1)" } }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.5 }}>
                                            Total PO Amount
                                        </Typography>
                                        <Typography sx={{ fontSize: "20px", fontWeight: 900, color: "#1e293b" }}>
                                            {formatCurrency(data.total_amount)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ bgcolor: "#d1fae5", border: "1px solid #a7f3d0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", "&:hover": { boxShadow: "0 4px 6px rgba(0,0,0,0.1)" } }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#047857", textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.5 }}>
                                            Total Paid To Date
                                        </Typography>
                                        <Typography sx={{ fontSize: "20px", fontWeight: 900, color: "#065f46" }}>
                                            {formatCurrency(data.total_paid)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ bgcolor: "#fed7aa", border: "1px solid #fdba74", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", "&:hover": { boxShadow: "0 4px 6px rgba(0,0,0,0.1)" } }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.5 }}>
                                            Current Balance
                                        </Typography>
                                        <Typography sx={{ fontSize: "20px", fontWeight: 900, color: "#92400e" }}>
                                            {formatCurrency(data.balance)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ bgcolor: "#dbeafe", border: "1px solid #bfdbfe", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", "&:hover": { boxShadow: "0 4px 6px rgba(0,0,0,0.1)" } }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.5 }}>
                                            Payment Count
                                        </Typography>
                                        <Typography sx={{ fontSize: "20px", fontWeight: 900, color: "#1e3a8a" }}>
                                            {data.payment_count} <Typography component="span" sx={{ fontSize: "12px" }}>Installments</Typography>
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 2, bgcolor: "#f8fafc", borderRadius: "12px 12px 0 0", borderBottom: "1px solid #e2e8f0" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <AttachMoneyIcon sx={{ color: "#64748b", fontSize: 20 }} />
                                    <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                        Transaction Records
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    px: 1.5, py: 0.5, borderRadius: "12px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase",
                                    bgcolor: data.status === 'COMPLETED' ? "#d1fae5" : "#fed7aa",
                                    color: data.status === 'COMPLETED' ? "#065f46" : "#78350f"
                                }}>
                                    PO Status: {data.status}
                                </Box>
                            </Box>
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "0 0 12px 12px", bgcolor: "white" }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                            <TableCell sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>#</TableCell>
                                            <TableCell align="center" sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</TableCell>
                                            <TableCell sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Mode & Reference</TableCell>
                                            <TableCell align="right" sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount Paid</TableCell>
                                            <TableCell align="right" sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Balance After</TableCell>
                                            <TableCell sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recorded By</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody sx={{ "& .MuiTableRow-root:hover": { bgcolor: "#f8fafc" } }}>
                                        {data.payments?.length > 0 ? (
                                            data.payments.map((payment, idx) => (
                                                <TableRow key={payment.id} sx={{ borderBottom: "1px solid #e2e8f0" }}>
                                                    <TableCell sx={{ fontWeight: 900, color: "#94a3b8", fontSize: "11px" }}>
                                                        {String(payment.payment_number || idx + 1).padStart(2, '0')}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#1e293b" }}>{formatDate(payment.payment_date)}</Typography>
                                                            <Typography sx={{ fontSize: "10px", color: "#64748b", fontWeight: 500 }}>{new Date(payment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                                                            <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#1e293b", textTransform: "uppercase", letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 1 }}>
                                                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#10b981" }}></Box>
                                                                {payment.payment_mode_display || payment.payment_mode}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 700, color: "#64748b", mt: 0.5 }}>Ref: {payment.reference_number || 'N/A'}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 900, color: "#059669", fontSize: "14px" }}>
                                                        {formatCurrency(payment.amount)}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                                                            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#1e293b" }}>{formatCurrency(payment.balance_after)}</Typography>
                                                            <Box sx={{ width: "100%", height: 4, bgcolor: "#e2e8f0", borderRadius: "9999px", mt: 0.5, overflow: "hidden" }}>
                                                                <Box
                                                                    sx={{
                                                                        height: "100%",
                                                                        bgcolor: "#3b82f6",
                                                                        width: `${Math.max(0, 100 - (payment.balance_after / data.total_amount) * 100)}%`,
                                                                        transition: "width 1s ease"
                                                                    }}
                                                                />
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: 1 }}>
                                                            <PersonIcon sx={{ fontSize: 14, color: "#cbd5e1" }} />
                                                            {payment.recorded_by_name}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, color: "#cbd5e1" }}>
                                                        <AttachMoneyIcon sx={{ fontSize: 40 }} />
                                                        <Typography sx={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>No transaction records found</Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    {data.payments?.length > 0 && (
                                        <TableRow sx={{ bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                                            <TableCell colSpan={3} sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", py: 2 }}>Total Consolidated</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 900, color: "#059669", fontSize: "14px", py: 2 }}>{formatCurrency(data.total_paid)}</TableCell>
                                            <TableCell align="right" sx={{ fontSize: "11px", fontWeight: 900, color: "#b45309", py: 2 }}>{formatCurrency(data.balance)}</TableCell>
                                            <TableCell colSpan={1}></TableCell>
                                        </TableRow>
                                    )}
                                </Table>
                            </TableContainer>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 1 }}>
                        <InfoIcon sx={{ fontSize: 40, color: "#94a3b8" }} />
                        <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            No payment records found
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e2e8f0", bgcolor: "white", gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        bgcolor: "#1a1a2e",
                        color: "white",
                        textTransform: "uppercase",
                        fontWeight: 900,
                        fontSize: "12px",
                        borderRadius: 2,
                        px: 4,
                        "&:hover": { bgcolor: "#000" }
                    }}
                >
                    CLOSE HISTORY
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentHistoryModal;
