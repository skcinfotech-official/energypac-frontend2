import React, { useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Button, TextField, Select, MenuItem,
    FormControl, Alert, CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import EditIcon from "@mui/icons-material/Edit";
import { recordFinancePayment } from "../../services/financeService";
import PasswordConfirmModal from "../ui/PasswordConfirmModal";

const getCurrencySymbol = (code) => {
    switch (code?.toUpperCase()) {
        case "USD": return "$";
        case "EUR": return "€";
        case "GBP": return "£";
        case "JPY": return "¥";
        case "INR": return "₹";
        default: return code || "₹";
    }
};

const RecordPaymentModal = ({ open, onClose, poData, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [payload, setPayload] = useState({
        amount: "",
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: "NEFT",
        reference_number: "",
        remarks: ""
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setPayload({ ...payload, [e.target.name]: e.target.value });
    };

    const handleInitialSubmit = (e) => {
        e.preventDefault();
        if (!payload.amount || parseFloat(payload.amount) <= 0) {
            setError("Please enter a valid amount");
            return;
        }
        setError("");
        setConfirmOpen(true);
    };

    const handleFinalConfirm = async (password) => {
        setLoading(true);
        setError("");
        try {
            await recordFinancePayment(poData.id, {
                ...payload,
                amount: parseFloat(payload.amount),
                confirm_password: password
            });
            onSuccess("Payment recorded successfully!");
            setConfirmOpen(false);
            onClose();
        } catch (error) {
            console.error("Payment failed", error);
            const msg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to record payment";
            setError(msg);
            setConfirmOpen(false);
        } finally {
            setLoading(false);
        }
    };

    if (!open || !poData) return null;

    const paymentModes = ["CASH", "CHEQUE", "NEFT", "RTGS", "IMPS", "UPI", "OTHER"];
    const poCurrency = poData?.currency || "INR";
    const convRate = parseFloat(poData?.conversion_rate || 1);

    const formatAmount = (val, curr) => {
        const c = curr || poCurrency;
        const num = Number(val || 0);
        const locale = c === 'INR' ? 'en-IN' : 'en-US';
        return `${getCurrencySymbol(c)} ${num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const inputSx = {
        "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            bgcolor: "white",
            fontSize: "0.875rem",
            fontWeight: 700,
            "& fieldset": { borderColor: "#e2e8f0" },
            "&:hover fieldset": { borderColor: "#cbd5e1" },
            "&.Mui-focused fieldset": { borderColor: "#059669" },
        },
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                sx={{ zIndex: 70 }}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
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
                        <AttachMoneyIcon sx={{ color: "#10b981", fontSize: 28 }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900, textTransform: "uppercase", fontSize: "16px" }}>
                                Record Payment
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748b", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                {poData.po_number} • {poData.vendor_name}
                            </Typography>
                        </Box>
                    </Box>
                    <Button onClick={onClose} sx={{ minWidth: "auto", p: 0.5 }}>
                        <CloseIcon sx={{ color: "#cbd5e1", fontSize: 20 }} />
                    </Button>
                </DialogTitle>

                <DialogContent sx={{ bgcolor: "#f1f5f9", p: 3 }}>
                    <Box component="form" onSubmit={handleInitialSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                        {error && (
                            <Alert severity="error" sx={{ borderRadius: 2, fontSize: "12px", fontWeight: 700 }}>
                                {error}
                            </Alert>
                        )}

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 1 }}>
                                <AttachMoneyIcon sx={{ fontSize: 16, color: "#059669" }} /> Amount to Pay ({poCurrency}) *
                            </Typography>
                            <TextField
                                required
                                type="number"
                                step="0.01"
                                name="amount"
                                value={payload.amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                inputProps={{ style: { textAlign: "left", paddingLeft: "32px" } }}
                                sx={{
                                    ...inputSx,
                                    "& .MuiOutlinedInput-root": {
                                        ...inputSx["& .MuiOutlinedInput-root"],
                                        position: "relative",
                                    },
                                    "& .MuiOutlinedInput-root::before": {
                                        content: `"${getCurrencySymbol(poCurrency)}"`,
                                        position: "absolute",
                                        left: 12,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#64748b",
                                        fontWeight: 700,
                                        pointerEvents: "none",
                                    }
                                }}
                                fullWidth
                                size="small"
                            />
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 0.5, fontSize: "10px" }}>
                                <Typography sx={{ color: "#64748b", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                                    Outstanding: {formatAmount(poData.balance)}
                                </Typography>
                                {poCurrency !== 'INR' && convRate > 0 && (
                                    <Typography sx={{ color: "#059669", fontWeight: 700, textTransform: "uppercase", fontStyle: "italic" }}>
                                        ≈ ₹{(parseFloat(payload.amount || 0) * convRate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 1 }}>
                                    <CalendarTodayIcon sx={{ fontSize: 16 }} /> Date
                                </Typography>
                                <TextField
                                    required
                                    type="date"
                                    name="payment_date"
                                    value={payload.payment_date}
                                    onChange={handleChange}
                                    fullWidth
                                    size="small"
                                    sx={inputSx}
                                />
                            </Box>

                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 1 }}>
                                    <CreditCardIcon sx={{ fontSize: 16 }} /> Mode
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        name="payment_mode"
                                        value={payload.payment_mode}
                                        onChange={handleChange}
                                        sx={{
                                            ...inputSx,
                                            "& .MuiSvgIcon-root": { color: "#64748b" }
                                        }}
                                    >
                                        {paymentModes.map(mode => (
                                            <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 1 }}>
                                <EditIcon sx={{ fontSize: 16 }} /> Reference Number
                            </Typography>
                            <TextField
                                type="text"
                                name="reference_number"
                                value={payload.reference_number}
                                onChange={handleChange}
                                placeholder="UTR / Check No / Trans ID"
                                fullWidth
                                size="small"
                                sx={inputSx}
                            />
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Remarks</Typography>
                            <TextField
                                name="remarks"
                                value={payload.remarks}
                                onChange={handleChange}
                                placeholder="Add payment details/notes..."
                                multiline
                                rows={2}
                                fullWidth
                                size="small"
                                sx={inputSx}
                            />
                        </Box>

                        <Box sx={{ display: "flex", gap: 2, pt: 2, borderTop: "1px solid #e2e8f0" }}>
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="outlined"
                                fullWidth
                                sx={{
                                    borderColor: "#e2e8f0",
                                    color: "#475569",
                                    textTransform: "uppercase",
                                    fontWeight: 900,
                                    fontSize: "11px",
                                    borderRadius: 2,
                                    "&:hover": { bgcolor: "#f1f5f9", borderColor: "#cbd5e1" }
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                sx={{
                                    bgcolor: "#059669",
                                    color: "white",
                                    textTransform: "uppercase",
                                    fontWeight: 900,
                                    fontSize: "11px",
                                    borderRadius: 2,
                                    boxShadow: "0 4px 6px rgba(5, 150, 105, 0.2)",
                                    "&:hover": { bgcolor: "#047857" }
                                }}
                            >
                                Confirm Payment
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

            <PasswordConfirmModal
                open={confirmOpen}
                loading={loading}
                title="Confirm Payment"
                message={`You are recording a payment of ${formatAmount(payload.amount)} for ${poData.po_number}.`}
                onConfirm={handleFinalConfirm}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    );
};

export default RecordPaymentModal;
