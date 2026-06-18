import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Grid,
    Typography,
} from "@mui/material";
import {
    Close as CloseIcon,
    Save as SaveIcon,
    Add as AddIcon,
} from "@mui/icons-material";

const AddNewItemModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        item_name: "",
        item_code: "",
        description: "",
        hsn_code: "",
        unit: "",
        remarks: "",
        rate: 0
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        // Reset form
        setFormData({
            item_name: "",
            item_code: "",
            description: "",
            hsn_code: "",
            unit: "",
            remarks: "",
            rate: 0
        });
    };

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
                    <AddIcon sx={{ color: "primary.main" }} />
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        Add New Item Details
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
                <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
                    <TextField
                        fullWidth
                        label="Item Name"
                        name="item_name"
                        required
                        placeholder="Item Name"
                        value={formData.item_name}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                    />

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Item Code"
                                name="item_code"
                                placeholder="Item Code"
                                value={formData.item_code}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="HSN Code"
                                name="hsn_code"
                                placeholder="HSN Code"
                                value={formData.hsn_code}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Unit"
                                name="unit"
                                placeholder="e.g. PCS, NOS"
                                value={formData.unit}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Rate"
                                name="rate"
                                type="number"
                                placeholder="0.00"
                                value={formData.rate}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                                inputProps={{ step: "any", min: "0" }}
                            />
                        </Grid>
                    </Grid>

                    <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        placeholder="Item Description"
                        value={formData.description}
                        onChange={handleChange}
                        variant="outlined"
                        multiline
                        rows={3}
                        size="small"
                    />

                    <TextField
                        fullWidth
                        label="Remarks"
                        name="remarks"
                        placeholder="Optional remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    startIcon={<SaveIcon />}
                >
                    Add Item
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddNewItemModal;