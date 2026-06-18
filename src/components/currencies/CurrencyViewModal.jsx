import { useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
    Grid, Typography, CircularProgress, Chip, Paper
} from "@mui/material";
import { Close as CloseIcon, Language as GlobeIcon } from "@mui/icons-material";

const CurrencyViewModal = ({ open, onClose, data, loading }) => {
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
                Currency Details
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
                            <Grid item xs={6}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                                    Currency Code
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5, fontFamily: 'monospace' }}>
                                    {data.code || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                                    Symbol
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
                                    {data.symbol || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                                    Currency Name
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
                                    {data.name || '-'}
                                </Typography>
                            </Grid>
                        </Grid>

                        {/* META DATA */}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 1 }}>
                            <Chip
                                label={data.is_active ? 'Active' : 'Inactive'}
                                variant="outlined"
                                color={data.is_active ? 'success' : 'error'}
                                size="small"
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                                Created: {new Date(data.created_at || data.created_time).toLocaleDateString()}
                            </Typography>
                        </Box>

                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                            Failed to load currency details.
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

export default CurrencyViewModal;
