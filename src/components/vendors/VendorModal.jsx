import { useEffect, useState } from "react";
import { createVendor, updateVendor } from "../../services/vendorService";
import AlertToast from "../ui/AlertToast";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Paper,
    Grid,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";

const initialState = {
    vendor_name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    gst_number: "",
    pan_number: "",
    bank_name: "",
    account_name: "",
    bank_account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    swift_code: "",
};

export default function VendorModal({
    open,
    onClose,
    mode,
    vendor,
    onSuccess,
}) {
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "error", message: "" });

    useEffect(() => {
        if (mode === "edit" && vendor) {
            setForm({
                vendor_name: vendor.vendor_name || "",
                contact_person: vendor.contact_person || "",
                phone: vendor.phone || "",
                email: vendor.email || "",
                address: vendor.address || "",
                gst_number: vendor.gst_number || "",
                pan_number: vendor.pan_number || "",
                bank_name: vendor.bank_name || "",
                account_name: vendor.account_name || "",
                bank_account_number: vendor.bank_account_number || "",
                confirm_account_number: vendor.bank_account_number || "",
                ifsc_code: vendor.ifsc_code || "",
                swift_code: vendor.swift_code || "",
            });
        } else {
            setForm(initialState);
        }
        setErrors({});
    }, [mode, vendor, open]);

    const handleChange = (e) => {
        let { name, value } = e.target;

        // Enforce validations on input
        if (name === "phone") {
            // Only digits allowed
            value = value.replace(/\D/g, "");
        } else if (["gst_number", "pan_number", "ifsc_code", "swift_code"].includes(name)) {
            // Force Uppercase
            value = value.toUpperCase();
        }

        setForm({ ...form, [name]: value });

        // Clear error when user types
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const validateForm = () => {
        let newErrors = {};
        let isValid = true;

        if (!form.vendor_name.trim()) {
            newErrors.vendor_name = "Vendor Name is required";
            isValid = false;
        }

        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Invalid email format";
            isValid = false;
        }

        if (form.phone && form.phone.length !== 10) {
            newErrors.phone = "Phone number must be exactly 10 digits";
            isValid = false;
        }

        if (form.gst_number && form.gst_number.length !== 15) {
            newErrors.gst_number = "GST number must be 15 uppercase characters";
            isValid = false;
        }

        if (form.pan_number && form.pan_number.length !== 10) {
            newErrors.pan_number = "PAN number must be 10 uppercase characters";
            isValid = false;
        }

        if (form.bank_account_number && form.bank_account_number !== form.confirm_account_number) {
            newErrors.confirm_account_number = "Account numbers do not match";
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

            // Exclude confirm_account_number from the payload
            const { confirm_account_number, ...payload } = form;

            if (mode === "edit") {
                await updateVendor(vendor.id, payload);
            } else {
                await createVendor(payload);
            }

            onSuccess(mode);
            onClose();
        } catch (err) {
            console.log(err);
            setToast({ open: true, type: "error", message: "Failed to save vendor" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    maxHeight: "90vh",
                    borderRadius: "12px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: 2,
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "#1e293b",
                }}
            >
                {mode === "edit" ? "Edit Vendor" : "Add Vendor"}
                <IconButton
                    onClick={onClose}
                    sx={{
                        color: "#94a3b8",
                        "&:hover": {
                            color: "#475569",
                            backgroundColor: "white",
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    padding: 3,
                    overflowY: "auto",
                    backgroundColor: "white",
                }}
            >
                <Box component="form" id="vendor-form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    {/* Basic Information */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Vendor Name"
                                name="vendor_name"
                                value={form.vendor_name}
                                onChange={handleChange}
                                error={!!errors.vendor_name}
                                helperText={errors.vendor_name}
                                required
                                variant="outlined"
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Contact Person"
                                name="contact_person"
                                value={form.contact_person}
                                onChange={handleChange}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Phone"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                                type="tel"
                                error={!!errors.phone}
                                helperText={errors.phone}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="example@domain.com"
                                type="email"
                                error={!!errors.email}
                                helperText={errors.email}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="GST Number"
                                name="gst_number"
                                value={form.gst_number}
                                onChange={handleChange}
                                placeholder="15 alphanumeric characters"
                                error={!!errors.gst_number}
                                helperText={errors.gst_number}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="PAN Number"
                                name="pan_number"
                                value={form.pan_number}
                                onChange={handleChange}
                                placeholder="10 alphanumeric characters"
                                error={!!errors.pan_number}
                                helperText={errors.pan_number}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                    </Grid>

                    {/* Address */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                multiline
                                rows={3}
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                    </Grid>

                    {/* Bank Details Section */}
                    <Paper
                        sx={{
                            padding: 2.5,
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            mb: 2,
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: "bold",
                                color: "#475569",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                mb: 2,
                            }}
                        >
                            Bank Details
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="Bank Name"
                                    name="bank_name"
                                    value={form.bank_name}
                                    onChange={handleChange}
                                    error={!!errors.bank_name}
                                    helperText={errors.bank_name}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="Account Holder Name"
                                    name="account_name"
                                    value={form.account_name}
                                    onChange={handleChange}
                                    error={!!errors.account_name}
                                    helperText={errors.account_name}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="IFSC Code"
                                    name="ifsc_code"
                                    value={form.ifsc_code}
                                    onChange={handleChange}
                                    error={!!errors.ifsc_code}
                                    helperText={errors.ifsc_code}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="Bank Account Number"
                                    name="bank_account_number"
                                    value={form.bank_account_number}
                                    onChange={handleChange}
                                    type="tel"
                                    error={!!errors.bank_account_number}
                                    helperText={errors.bank_account_number}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="Confirm Account Number"
                                    name="confirm_account_number"
                                    value={form.confirm_account_number}
                                    onChange={handleChange}
                                    type="tel"
                                    error={!!errors.confirm_account_number}
                                    helperText={errors.confirm_account_number}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    fullWidth
                                    label="Swift Code"
                                    name="swift_code"
                                    value={form.swift_code}
                                    onChange={handleChange}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>
            </DialogContent>

            <DialogActions
                sx={{
                    padding: 2,
                    backgroundColor: "#f8fafc",
                    borderTop: "1px solid #e2e8f0",
                    gap: 1,
                }}
            >
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    sx={{
                        borderColor: "#cbd5e1",
                        color: "#475569",
                        "&:hover": {
                            backgroundColor: "white",
                            borderColor: "#94a3b8",
                        },
                    }}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form="vendor-form"
                    disabled={loading}
                    variant="contained"
                    sx={{
                        backgroundColor: "#2563eb",
                        "&:hover": {
                            backgroundColor: "#1d4ed8",
                        },
                        "&:disabled": {
                            opacity: 0.5,
                        },
                    }}
                >
                    {loading ? "Saving..." : "Save Vendor"}
                </Button>
            </DialogActions>

            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />
        </Dialog>
    );
}
