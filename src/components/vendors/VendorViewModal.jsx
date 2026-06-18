import { useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
    Grid, Typography, CircularProgress, Chip, Paper, IconButton, Divider
} from "@mui/material";
import {
    Close as CloseIcon, Business as BusinessIcon, Email as EmailIcon,
    Phone as PhoneIcon, LocationOn as LocationIcon, AccountBalance as BankIcon,
    Badge as IdCardIcon, AccessTime as ClockIcon
} from "@mui/icons-material";

const VendorViewModal = ({ open, onClose, data, loading }) => {
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
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'primary.lighter', color: 'primary.main', p: 1, borderRadius: 1 }}>
                        <BusinessIcon />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Vendor Details</Typography>
                        {data && <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{data.vendor_code}</Typography>}
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary">Loading details...</Typography>
                    </Box>
                ) : data ? (
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>

                        {/* BASIC INFO */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
                                <BusinessIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                    Basic Information
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <DetailItem label="Vendor Name" value={data.vendor_name} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <DetailItem label="Contact Person" value={data.contact_person} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <DetailItem label="Email" value={data.email} icon={<EmailIcon />} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <DetailItem label="Phone" value={data.phone} icon={<PhoneIcon />} />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* TAX & ID */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
                                <IdCardIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                    Tax & ID Numbers
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <DetailItem label="GST Number" value={data.gst_number} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <DetailItem label="PAN Number" value={data.pan_number} />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* BANK DETAILS */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
                                <BankIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                    Bank Details
                                </Typography>
                            </Box>
                            <Paper sx={{ p: 2, bgcolor: 'background.default', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <DetailItem label="Bank Name" value={data.bank_name} fullWidth />
                                <DetailItem label="Account Holder" value={data.account_name} fullWidth />
                                <DetailItem label="Account Number" value={data.bank_account_number} fullWidth />
                                <DetailItem label="IFSC Code" value={data.ifsc_code} fullWidth />
                                <DetailItem label="SWIFT Code" value={data.swift_code} fullWidth />
                            </Paper>
                        </Box>

                        {/* ADDRESS */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
                                <LocationIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                    Address
                                </Typography>
                            </Box>
                            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Typography variant="body2" sx={{ color: data.address ? 'text.primary' : 'text.secondary', fontStyle: data.address ? 'normal' : 'italic' }}>
                                    {data.address || 'No address provided'}
                                </Typography>
                            </Paper>
                        </Box>

                        {/* META */}
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Chip
                                label={data.is_active ? 'Active' : 'Inactive'}
                                color={data.is_active ? 'success' : 'error'}
                                variant="outlined"
                                size="small"
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ClockIcon sx={{ fontSize: 14 }} />
                                Created: {new Date(data.created_at).toLocaleDateString()}
                            </Typography>
                        </Box>

                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">Failed to load vendor details.</Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained">Close</Button>
            </DialogActions>
        </Dialog>
    );
};

const DetailItem = ({ label, value, icon, fullWidth }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: fullWidth ? '100%' : 'auto' }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {icon} {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {value || '-'}
        </Typography>
    </Box>
);

export default VendorViewModal;
