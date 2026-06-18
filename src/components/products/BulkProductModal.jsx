import { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
    Alert, Grid, Typography, Paper, CircularProgress
} from "@mui/material";
import {
    Close as CloseIcon, CloudDownload as DownloadIcon,
    CloudUpload as UploadIcon, FilePresent as FileIcon,
    CheckCircle as CheckIcon, Error as ErrorIcon
} from "@mui/icons-material";
import { getBulkUploadTemplate, bulkUploadProducts } from "../../services/productService";
import { saveAs } from "file-saver";

const BulkProductModal = ({ open, onClose, onSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        if (!open) {
            setSelectedFile(null);
            setError(null);
            setSuccess(null);
        }
    }, [open]);

    const handleDownloadTemplate = async () => {
        setDownloading(true);
        setError(null);
        try {
            const res = await getBulkUploadTemplate();
            saveAs(res.data, "product_bulk_template.xlsx");
            setSuccess("Template downloaded successfully!");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to download template. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const res = await bulkUploadProducts(formData);
            setSuccess(res.data?.message || res.message || "Products uploaded successfully!");
            if (onSuccess) onSuccess();
            setSelectedFile(null);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || err.response?.data?.detail || "Failed to upload file. Check your format.";
            setError(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                Bulk Product Entry
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
                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {error && (
                        <Alert severity="error" icon={<ErrorIcon />} sx={{ borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" icon={<CheckIcon />} sx={{ borderRadius: 2 }}>
                            {success}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        {/* Download Template Step */}
                        <Grid item xs={12} sm={6}>
                            <Paper
                                sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    border: '2px dashed',
                                    borderColor: 'divider',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: 'primary.lighter'
                                    }
                                }}
                            >
                                <Box sx={{ bgcolor: 'primary.lighter', p: 2, borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                                    <DownloadIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                </Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                    Step 1: Template
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>
                                    Download the Excel template to ensure your data format is correct.
                                </Typography>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={handleDownloadTemplate}
                                    disabled={downloading}
                                    startIcon={downloading ? <CircularProgress size={16} /> : <DownloadIcon />}
                                    sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}
                                >
                                    {downloading ? "Downloading..." : "Download Excel"}
                                </Button>
                            </Paper>
                        </Grid>

                        {/* Upload Step */}
                        <Grid item xs={12} sm={6}>
                            <Paper
                                sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    border: '2px dashed',
                                    borderColor: 'divider',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: 'success.main',
                                        bgcolor: 'success.lighter'
                                    }
                                }}
                            >
                                <Box sx={{ bgcolor: 'success.lighter', p: 2, borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                                    <UploadIcon sx={{ fontSize: 32, color: 'success.main' }} />
                                </Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                    Step 2: Select File
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>
                                    Select your completed Excel file to proceed.
                                </Typography>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" style={{ display: 'block' }}>
                                    <Button
                                        component="span"
                                        fullWidth
                                        variant="contained"
                                        color="success"
                                        startIcon={<UploadIcon />}
                                        sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}
                                    >
                                        {selectedFile ? "Change File" : "Select Excel"}
                                    </Button>
                                </label>
                                {selectedFile && (
                                    <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'success.main', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        Selected: {selectedFile.name}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>

                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block', color: 'info.main' }}>
                            Important Instructions
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                            <Typography component="li" variant="caption" sx={{ color: 'info.dark' }}>
                                Keep headers unchanged in the Excel file.
                            </Typography>
                            <Typography component="li" variant="caption" sx={{ color: 'info.dark' }}>
                                Ensure all mandatory fields are filled correctly.
                            </Typography>
                        </Box>
                    </Alert>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} disabled={uploading}>Close</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={uploading || !selectedFile}
                    startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : undefined}
                >
                    {uploading ? "Submitting..." : "Submit"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkProductModal;
