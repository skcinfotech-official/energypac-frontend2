import React, { useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Button, IconButton, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Card, CardContent, Grid
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StorageIcon from "@mui/icons-material/Storage";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import { fetchFinancePOItems } from "../../services/financeService";

const POItemsModal = ({ open, onClose, poId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && poId) {
            const loadItems = async () => {
                setLoading(true);
                try {
                    const res = await fetchFinancePOItems(poId);
                    setData(res);
                } catch (err) {
                    console.error("Failed to load PO items", err);
                } finally {
                    setLoading(false);
                }
            };
            loadItems();
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
                    <StorageIcon sx={{ color: "#10b981", fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                            Purchased & Pending Items Details
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
                        <CircularProgress size={40} sx={{ color: "#10b981" }} />
                        <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Fetching Item list...
                        </Typography>
                    </Box>
                ) : data ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ bgcolor: "white", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.5 }}>
                                            Items Total
                                        </Typography>
                                        <Typography sx={{ fontSize: "20px", fontWeight: 900, color: "#1e293b" }}>
                                            {formatCurrency(data.items_total)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ bgcolor: "#d1fae5", border: "1px solid #a7f3d0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.5 }}>
                                            Purchased Total
                                        </Typography>
                                        <Typography sx={{ fontSize: "20px", fontWeight: 900, color: "#065f46" }}>
                                            {formatCurrency(data.purchased_items_total)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ bgcolor: "#dbeafe", border: "1px solid #bfdbfe", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.5 }}>
                                            Purchased Count
                                        </Typography>
                                        <Typography sx={{ fontSize: "20px", fontWeight: 900, color: "#1e3a8a" }}>
                                            {data.purchased_items_count} <Typography component="span" sx={{ fontSize: "12px", fontWeight: 700, color: "#3b82f6" }}>items</Typography>
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ bgcolor: "#fef3c7", border: "1px solid #fde68a", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.5 }}>
                                            Pending Count
                                        </Typography>
                                        <Typography sx={{ fontSize: "20px", fontWeight: 900, color: "#92400e" }}>
                                            {data.pending_items_count} <Typography component="span" sx={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b" }}>items</Typography>
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 2, bgcolor: "#dbeafe", borderRadius: "12px 12px 0 0" }}>
                                <CheckCircleIcon sx={{ color: "#0891b2", fontSize: 20 }} />
                                <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#0c4a6e", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                    Purchased Items
                                </Typography>
                                <Box sx={{ ml: "auto", bgcolor: "#cffafe", color: "#0c4a6e", px: 1.5, py: 0.25, borderRadius: "12px", fontSize: "10px", fontWeight: 900 }}>
                                    {data.purchased_items?.length || 0} ITEMS
                                </Box>
                            </Box>
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "0 0 12px 12px", bgcolor: "white" }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                            <TableCell sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product Info</TableCell>
                                            <TableCell align="center" sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>HSN</TableCell>
                                            <TableCell align="right" sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quantity</TableCell>
                                            <TableCell align="right" sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rate</TableCell>
                                            <TableCell align="right" sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Net Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody sx={{ "& .MuiTableRow-root:hover": { bgcolor: "#f8fafc" } }}>
                                        {data.purchased_items?.length > 0 ? (
                                            data.purchased_items.map((it, idx) => (
                                                <TableRow key={idx} sx={{ borderBottom: "1px solid #e2e8f0" }}>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.875rem" }}>{it.product_name}</Typography>
                                                        <Typography sx={{ fontSize: "10px", fontFamily: "monospace", color: "#64748b" }}>{it.product_code}</Typography>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }}>{it.hsn_code || "---"}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 900, color: "#1e293b" }}>
                                                        {Number(it.quantity).toFixed(2)} <Typography component="span" sx={{ fontSize: "10px", color: "#64748b" }}>{it.unit}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ color: "#475569", fontWeight: 700 }}>{formatCurrency(it.rate)}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 900, color: "#059669" }}>{formatCurrency(it.amount)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 5, color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.05em" }}>
                                                    No items purchased yet
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>

                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 2, bgcolor: "#fed7aa", borderRadius: "12px 12px 0 0" }}>
                                <HourglassBottomIcon sx={{ color: "#d97706", fontSize: 20 }} />
                                <Typography sx={{ fontSize: "11px", fontWeight: 900, color: "#78350f", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                    Pending Items
                                </Typography>
                                <Box sx={{ ml: "auto", bgcolor: "#fef08a", color: "#78350f", px: 1.5, py: 0.25, borderRadius: "12px", fontSize: "10px", fontWeight: 900 }}>
                                    {data.pending_items?.length || 0} ITEMS
                                </Box>
                            </Box>
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "0 0 12px 12px", bgcolor: "white" }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                            <TableCell sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product Info</TableCell>
                                            <TableCell align="center" sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>HSN</TableCell>
                                            <TableCell align="right" sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quantity</TableCell>
                                            <TableCell align="right" sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rate</TableCell>
                                            <TableCell align="right" sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Net Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody sx={{ "& .MuiTableRow-root:hover": { bgcolor: "#f8fafc" } }}>
                                        {data.pending_items?.length > 0 ? (
                                            data.pending_items.map((it, idx) => (
                                                <TableRow key={idx} sx={{ borderBottom: "1px solid #e2e8f0" }}>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.875rem" }}>{it.product_name}</Typography>
                                                        <Typography sx={{ fontSize: "10px", fontFamily: "monospace", color: "#64748b" }}>{it.product_code}</Typography>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }}>{it.hsn_code || "---"}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 900, color: "#1e293b" }}>
                                                        {Number(it.quantity).toFixed(2)} <Typography component="span" sx={{ fontSize: "10px", color: "#64748b" }}>{it.unit}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ color: "#475569", fontWeight: 700 }}>{formatCurrency(it.rate)}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 900, color: "#d97706" }}>{formatCurrency(it.amount)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 5, color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.05em" }}>
                                                    No pending items remaining
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 1 }}>
                        <InfoIcon sx={{ fontSize: 40, color: "#94a3b8" }} />
                        <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            No detailed data found for this PO
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
                        px: 3,
                        "&:hover": { bgcolor: "#000" }
                    }}
                >
                    CLOSE
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default POItemsModal;
