import { useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    FormControlLabel, Checkbox, Box, CircularProgress, Alert
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { createCurrency, updateCurrency } from "../../services/currencyService";
import AlertToast from "../ui/AlertToast";

const initialState = {
    code: "",
    name: "",
    symbol: "",
    is_active: true,
};

export default function CurrencyModal({
    open,
    onClose,
    mode,
    currency,
    onSuccess,
}) {
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "error", message: "" });

    useEffect(() => {
        if (mode === "edit" && currency) {
            setForm({
                code: currency.code || "",
                name: currency.name || "",
                symbol: currency.symbol || "",
                is_active: currency.is_active ?? true,
            });
        } else {
            setForm(initialState);
        }
        setErrors({});
    }, [mode, currency, open]);

    const handleChange = (e) => {
        let { name, value, type, checked } = e.target;

        if (type === "checkbox") {
            setForm({ ...form, [name]: checked });
        } else {
            if (name === "code") {
                value = value.toUpperCase().slice(0, 5);
            }
            setForm({ ...form, [name]: value });
        }

        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const validateForm = () => {
        let newErrors = {};
        let isValid = true;

        if (!form.code.trim()) {
            newErrors.code = "Currency Code is required (e.g. USD)";
            isValid = false;
        } else if (form.code.trim().length < 2) {
            newErrors.code = "Currency Code must be at least 2 characters";
            isValid = false;
        }

        if (!form.name.trim()) {
            newErrors.name = "Currency Name is required";
            isValid = false;
        }

        if (!form.symbol.trim()) {
            newErrors.symbol = "Symbol is required (e.g. $)";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            if (mode === "edit") {
                const payload = {
                    code: form.code,
                    name: form.name,
                    symbol: form.symbol,
                    is_active: form.is_active,
                };
                await updateCurrency(currency.id, payload);
            } else {
                await createCurrency(form);
            }

            onSuccess(mode);
            onClose();
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.detail || err.response?.data?.message || "Failed to save currency";
            setToast({ open: true, type: "error", message: errMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                    {mode === "edit" ? "Edit Currency" : "Add Currency"}
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
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Currency Code"
                            name="code"
                            value={form.code}
                            onChange={handleChange}
                            placeholder="e.g. USD, EUR, INR"
                            required
                            disabled={mode === "edit"}
                            error={!!errors.code}
                            helperText={errors.code}
                            size="small"
                        />

                        <TextField
                            fullWidth
                            label="Currency Name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g. US Dollar"
                            required
                            error={!!errors.name}
                            helperText={errors.name}
                            size="small"
                        />

                        <TextField
                            fullWidth
                            label="Symbol"
                            name="symbol"
                            value={form.symbol}
                            onChange={handleChange}
                            placeholder="e.g. $, €, ₹"
                            required
                            error={!!errors.symbol}
                            helperText={errors.symbol}
                            size="small"
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="is_active"
                                    checked={form.is_active}
                                    onChange={handleChange}
                                />
                            }
                            label="Is Active"
                        />
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
                        {loading ? "Saving..." : "Save Currency"}
                    </Button>
                </DialogActions>
            </Dialog>

            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />
        </>
    );
}
