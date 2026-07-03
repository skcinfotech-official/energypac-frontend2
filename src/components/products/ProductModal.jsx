import { useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Box, Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { createProduct, updateProduct } from "../../services/productService";

export default function ProductModal({
    open,
    onClose,
    onSuccess,
    mode = "add",
    product = null,
}) {
    const [form, setForm] = useState({
        item_name: "",
        description: "",
        hsn_code: "",
        unit: "PCS",
        rate: "",
        current_stock: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        if (mode === "edit" && product) {
            setForm({
                item_name: product.item_name || "",
                description: product.description || "",
                hsn_code: product.hsn_code || "",
                unit: product.unit || "PCS",
                rate: product.rate ?? "",
                current_stock: product.current_stock ?? "",
            });
        } else {
            setForm({
                item_name: "",
                description: "",
                hsn_code: "",
                unit: "PCS",
                rate: "",
                current_stock: "",
            });
        }
        setError("");
    }, [open, mode, product]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setLoading(true);

            const payload = {
                ...form,
                rate: Number(form.rate) || 0,
                current_stock: Number(form.current_stock) || 0,
            };

            if (mode === "edit") {
                await updateProduct(product.id, payload);
            } else {
                await createProduct(payload);
            }

            onSuccess(mode);
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to save product");
            onSuccess("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                {mode === "edit" ? "Edit Product" : "Add Product"}
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
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Item Name"
                            name="item_name"
                            value={form.item_name}
                            onChange={handleChange}
                            placeholder="e.g. Steel Rod 10mm"
                            required
                            size="small"
                        />

                        <TextField
                            fullWidth
                            label="HSN Code"
                            name="hsn_code"
                            value={form.hsn_code}
                            onChange={handleChange}
                            placeholder="e.g. 7214"
                            size="small"
                        />

                        <TextField
                            fullWidth
                            label="Unit"
                            name="unit"
                            value={form.unit}
                            onChange={handleChange}
                            placeholder="e.g. KG"
                            size="small"
                        />

                        <TextField
                            fullWidth
                            type="number"
                            label="Rate"
                            name="rate"
                            value={form.rate}
                            onChange={handleChange}
                            placeholder="e.g. 250.00"
                            inputProps={{ step: "0.01" }}
                            size="small"
                        />

                        <TextField
                            fullWidth
                            type="number"
                            label="Current Stock (optional)"
                            name="current_stock"
                            value={form.current_stock}
                            onChange={handleChange}
                            placeholder="e.g. 0"
                            inputProps={{ step: "0.01", min: 0 }}
                            helperText="Opening stock quantity. Leave blank or 0 if none."
                            size="small"
                        />
                    </Box>

                    <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="e.g. High quality industrial cable"
                        multiline
                        rows={3}
                    />

                    {error && <Alert severity="error">{error}</Alert>}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
                >
                    {loading ? "Saving..." : mode === "edit" ? "Update Product" : "Save Product"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
