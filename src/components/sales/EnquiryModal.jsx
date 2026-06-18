import { useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Button, TextField, Grid,
    Alert, CircularProgress, IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { createClientQuery } from "../../services/salesService";

const EnquiryModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        client_name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        query_date: "",
        remarks: "",
        pdf_upload: null,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const newErrors = {};
        if (!formData.client_name) newErrors.client_name = "Client Name is required";
        if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = "Invalid phone number (10 digits)";
        }
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Invalid email address";
        }
        if (!formData.query_date) newErrors.query_date = "Query Date is required";

        if (!formData.pdf_upload && !formData.remarks?.trim()) {
            newErrors.pdf_upload = "Please upload a PDF or provide remarks";
            newErrors.remarks = "Please provide remarks or upload a PDF";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        let updatedValue = value;

        if (name === "pdf_upload") {
            updatedValue = files[0];
            setFormData(prev => ({ ...prev, pdf_upload: updatedValue }));
        } else if (name === "phone") {
            updatedValue = value.replace(/\D/g, "");
            setFormData(prev => ({ ...prev, phone: updatedValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        setErrors(prevErrors => {
            const newErrors = { ...prevErrors };

            if (name === "pdf_upload" || name === "remarks") {
                const hasPdf = name === "pdf_upload" ? updatedValue : formData.pdf_upload;
                const hasRemarks = name === "remarks" ? updatedValue : formData.remarks;

                if (hasPdf || hasRemarks?.trim()) {
                    delete newErrors.pdf_upload;
                    delete newErrors.remarks;
                }
            } else {
                if (newErrors[name]) delete newErrors[name];
            }

            return newErrors;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach((key) => {
                data.append(key, formData[key]);
            });

            await createClientQuery(data);
            onSuccess();
            onClose();
            setFormData({
                client_name: "",
                contact_person: "",
                phone: "",
                email: "",
                address: "",
                query_date: "",
                remarks: "",
                pdf_upload: null,
            });
        } catch (error) {
            console.error("Failed to submit enquiry", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to submit enquiry";
            setErrors(prev => ({ ...prev, submit: errorMsg }));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const labelSx = { fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 };
    const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& .MuiInputBase-input': { fontWeight: 600, fontSize: 13 } };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 4, maxHeight: '90vh', bgcolor: '#FAFBFC' } }}
        >
            <DialogTitle sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        New Client Query
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, bgcolor: '#FAFBFC' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                    {errors.submit && (
                        <Alert severity="error" sx={{ borderRadius: 2, fontWeight: 600, fontSize: 13 }}>
                            {errors.submit}
                        </Alert>
                    )}

                    <form id="enquiry-form" onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography sx={labelSx}>
                                        Client Name <span style={{ color: '#EF4444' }}>*</span>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="client_name"
                                        value={formData.client_name}
                                        onChange={handleChange}
                                        placeholder="Enter client name"
                                        error={!!errors.client_name}
                                        helperText={errors.client_name}
                                        sx={inputSx}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography sx={labelSx}>
                                        Contact Person <span style={{ color: '#EF4444' }}>*</span>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={handleChange}
                                        placeholder="Enter contact person"
                                        error={!!errors.contact_person}
                                        helperText={errors.contact_person}
                                        sx={inputSx}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography sx={labelSx}>
                                        Phone <span style={{ color: '#EF4444' }}>*</span>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                        error={!!errors.phone}
                                        helperText={errors.phone}
                                        inputProps={{ maxLength: 10 }}
                                        sx={inputSx}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography sx={labelSx}>
                                        Email <span style={{ color: '#EF4444' }}>*</span>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter email address"
                                        error={!!errors.email}
                                        helperText={errors.email}
                                        sx={inputSx}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography sx={labelSx}>
                                        Query Date <span style={{ color: '#EF4444' }}>*</span>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="query_date"
                                        type="date"
                                        value={formData.query_date}
                                        onChange={handleChange}
                                        error={!!errors.query_date}
                                        helperText={errors.query_date}
                                        InputLabelProps={{ shrink: true }}
                                        sx={inputSx}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography sx={labelSx}>
                                        Upload PDF <span style={{ color: '#EF4444' }}>*</span>
                                    </Typography>
                                    <Box sx={{ position: 'relative' }}>
                                        <input
                                            name="pdf_upload"
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleChange}
                                            style={{ display: 'none' }}
                                            id="pdf-upload-input"
                                        />
                                        <label htmlFor="pdf-upload-input" style={{ display: 'block' }}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 1.5,
                                                    px: 2,
                                                    py: 1.75,
                                                    borderRadius: 2,
                                                    border: '2px dashed',
                                                    borderColor: errors.pdf_upload ? '#FCA5A5' : '#CBD5E1',
                                                    bgcolor: errors.pdf_upload ? 'rgba(248, 113, 113, 0.04)' : 'rgba(203, 213, 225, 0.04)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                    '&:hover': {
                                                        borderColor: errors.pdf_upload ? '#FCA5A5' : '#94A3B8',
                                                        bgcolor: errors.pdf_upload ? 'rgba(248, 113, 113, 0.08)' : 'rgba(203, 213, 225, 0.08)',
                                                    }
                                                }}
                                            >
                                                <CloudUploadIcon sx={{ fontSize: 20, color: errors.pdf_upload ? '#EF4444' : '#64748B' }} />
                                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                                                    {formData.pdf_upload ? formData.pdf_upload.name : "Choose PDF file"}
                                                </Typography>
                                            </Box>
                                        </label>
                                    </Box>
                                    {errors.pdf_upload && (
                                        <Typography sx={{ fontSize: 12, color: '#EF4444', mt: 0.5, fontWeight: 500 }}>
                                            {errors.pdf_upload}
                                        </Typography>
                                    )}
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography sx={labelSx}>
                                        Address <span style={{ color: '#EF4444' }}>*</span>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Enter full address"
                                        multiline
                                        rows={2}
                                        error={!!errors.address}
                                        helperText={errors.address}
                                        sx={inputSx}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography sx={labelSx}>Remarks</Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleChange}
                                        placeholder="Enter remarks"
                                        multiline
                                        rows={3}
                                        error={!!errors.remarks}
                                        helperText={errors.remarks}
                                        sx={inputSx}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </form>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC' }}>
                <Button
                    onClick={onClose}
                    sx={{ fontWeight: 700, color: 'text.secondary', borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#E2E8F0' } }}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form="enquiry-form"
                    variant="contained"
                    disabled={loading}
                    sx={{
                        fontWeight: 700,
                        borderRadius: 2,
                        textTransform: 'none',
                        bgcolor: '#1565C0',
                        px: 3,
                        '&:hover': { bgcolor: '#0D47A1' },
                        '&:disabled': { opacity: 0.5, cursor: 'not-allowed' }
                    }}
                >
                    {loading ? "Submitting..." : "Submit Query"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EnquiryModal;
