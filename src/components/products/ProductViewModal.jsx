import { useRef, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
    Card, CardContent, Grid, Typography, CircularProgress, Chip, Paper
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const ProductViewModal = ({ open, onClose, data, loading }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };

        if (open) {
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                Product Details
                <Button
                    variant="text"
                    size="small"
                    onClick={onClose}
                    sx={{ minWidth: 'auto', color: 'text.secondary' }}
                >
                    <CloseIcon />
                </Button>
            </DialogTitle>

            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary">
                            Loading details...
                        </Typography>
                    </Box>
                ) : data ? (
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>

                        {/* BASIC INFO */}
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                                    Item Name
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
                                    {data.item_name || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                                    HSN Code
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
                                    {data.hsn_code || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                                    Unit
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
                                    {data.unit || '-'}
                                </Typography>
                            </Grid>
                        </Grid>

                        {/* STOCK & TRACKING */}
                        <Paper sx={{ p: 2, bgcolor: 'background.default', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
                                Stock & Tracking
                            </Typography>
                            <Grid container spacing={1.5}>
                                <DetailItem label="Rate" value={`₹ ${parseFloat(data.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
                                <DetailItem label="Current Stock" value={data.current_stock} />
                                <DetailItem label="Purchase Count" value={data.purchase_count} />
                                <DetailItem label="Total Purchased Qty" value={data.total_purchased_qty} />
                                <DetailItem label="Sale Count" value={data.sale_count} />
                                <DetailItem label="Total Sold Qty" value={data.total_sold_qty} />
                                <DetailItem label="Last Purchase Date" value={data.last_purchase_date || "-"} />
                                <DetailItem label="Last Sale Date" value={data.last_sale_date || "-"} />
                            </Grid>
                        </Paper>

                        {/* DESCRIPTION */}
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                                Description
                            </Typography>
                            <Paper sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                <Typography variant="body2" sx={{ color: data.description ? 'text.primary' : 'text.secondary', fontStyle: data.description ? 'normal' : 'italic' }}>
                                    {data.description || 'No description provided'}
                                </Typography>
                            </Paper>
                        </Box>

                        {/* META DATA */}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 1 }}>
                            <Chip
                                label={data.is_active ? 'Active' : 'Inactive'}
                                variant="outlined"
                                color={data.is_active ? 'success' : 'error'}
                                size="small"
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                                Created: {new Date(data.created_at).toLocaleDateString()}
                            </Typography>
                        </Box>

                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                            Failed to load product details.
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained">Close</Button>
            </DialogActions>
        </Dialog>
    );
};

const DetailItem = ({ label, value }) => (
    <Grid item xs={6} sm={6}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
            {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.25 }}>
            {value || "-"}
        </Typography>
    </Grid>
);

export default ProductViewModal;
