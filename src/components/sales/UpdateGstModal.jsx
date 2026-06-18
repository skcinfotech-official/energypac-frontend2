import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    CircularProgress,
    Alert,
    Stack,
} from "@mui/material";
import {
    Close as CloseIcon,
    Percent as PercentIcon,
} from "@mui/icons-material";
import { updateClientQuotationGst, getClientQuotationSummary } from "../../services/salesService";

const UpdateGstModal = ({ isOpen, onClose, quotation, onSuccess }) => {
    const [formData, setFormData] = useState({
        cgst_percentage: 0,
        sgst_percentage: 0,
        igst_percentage: 0,
    });
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch existing rates when modal opens
    useEffect(() => {
        if (isOpen && quotation?.id) {
            const fetchSummary = async () => {
                setLoading(true);
                try {
                    const data = await getClientQuotationSummary(quotation.id);
                    if (data?.taxes) {
                        setFormData({
                            cgst_percentage: data.taxes.cgst?.percentage || 0,
                            sgst_percentage: data.taxes.sgst?.percentage || 0,
                            igst_percentage: data.taxes.igst?.percentage || 0,
                        });
                    }
                } catch (err) {
                    console.error("Failed to fetch quotation summary", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchSummary();
        }
    }, [isOpen, quotation]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await updateClientQuotationGst(quotation.id, formData);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to update GST settings");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !quotation) return null;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
        >
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PercentIcon sx={{ color: "primary.main" }} />
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        Update GST Rates
                    </Typography>
                </Box>
                <Button
                    onClick={onClose}
                    variant="text"
                    size="small"
                    sx={{ minWidth: "auto", p: 1 }}
                >
                    <CloseIcon />
                </Button>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 2 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Update tax rates for Quotation{" "}
                        <Typography
                            component="span"
                            sx={{ fontFamily: "monospace", fontWeight: "bold", color: "text.primary" }}
                        >
                            {quotation.quotation_number}
                        </Typography>
                    </Typography>

                    {error && (
                        <Alert severity="error" onClose={() => setError("")}>
                            {error}
                        </Alert>
                    )}

                    {loading ? (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 3 }}>
                            <CircularProgress size={32} />
                            <Typography sx={{ mt: 1.5, color: "text.secondary", fontSize: "0.875rem" }}>
                                Loading rates...
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="CGST %"
                                name="cgst_percentage"
                                type="number"
                                value={formData.cgst_percentage}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                inputProps={{
                                    step: "any",
                                    min: "0",
                                    max: "100"
                                }}
                                helperText="Central GST percentage"
                            />
                            <TextField
                                fullWidth
                                label="SGST %"
                                name="sgst_percentage"
                                type="number"
                                value={formData.sgst_percentage}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                inputProps={{
                                    step: "any",
                                    min: "0",
                                    max: "100"
                                }}
                                helperText="State GST percentage"
                            />
                            <TextField
                                fullWidth
                                label="IGST %"
                                name="igst_percentage"
                                type="number"
                                value={formData.igst_percentage}
                                onChange={handleInputChange}
                                variant="outlined"
                                size="small"
                                inputProps={{
                                    step: "any",
                                    min: "0",
                                    max: "100"
                                }}
                                helperText="Integrated GST percentage"
                            />
                        </Stack>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={submitting || loading}
                >
                    {submitting ? "Updating..." : "Update Rates"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UpdateGstModal;