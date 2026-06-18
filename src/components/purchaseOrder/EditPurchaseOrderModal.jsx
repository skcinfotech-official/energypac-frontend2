import { useState, useEffect, useRef } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Button, IconButton, Grid, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, CircularProgress, Divider, Checkbox, Tooltip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { updatePurchaseOrder, unlockPurchaseOrder } from "../../services/purchaseOrderService";
import { toast } from "react-hot-toast";

const PRIMARY = "#1565C0";
const BG = "#FAFBFC";

const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode?.toString().toUpperCase()) {
        case "USD": return "$";
        case "INR": return "₹";
        case "EUR": return "€";
        case "GBP": return "£";
        case "JPY": return "¥";
        default: return currencyCode || "₹";
    }
};

const labelSx = {
    fontSize: "10px",
    fontWeight: 800,
    color: "grey.500",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "block",
    mb: 0.5,
};

const inputSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: 2,
        bgcolor: "white",
        fontSize: "0.875rem",
        fontWeight: 700,
        "& fieldset": { borderColor: "grey.200" },
        "&:hover fieldset": { borderColor: "grey.400" },
        "&.Mui-focused fieldset": { borderColor: PRIMARY },
    },
};

const sectionBoxSx = {
    bgcolor: "#F8FAFC",
    p: 2.5,
    borderRadius: 3,
    border: "1px solid",
    borderColor: "grey.200",
};

const EditPurchaseOrderModal = ({ open, onClose, poData, onUpdate }) => {
    // Form fields
    const [poDate, setPoDate] = useState("");
    const [subject, setSubject] = useState("");
    const [projectName, setProjectName] = useState("");
    const [billTo, setBillTo] = useState("");
    const [shipTo, setShipTo] = useState("");
    const [paymentDueDate, setPaymentDueDate] = useState("");
    const [termsAndConditions, setTermsAndConditions] = useState([]);
    const [remarks, setRemarks] = useState("");
    const [conversionRate, setConversionRate] = useState("");
    const [discountAmount, setDiscountAmount] = useState(0);
    const [cgstPercentage, setCgstPercentage] = useState(0);
    const [sgstPercentage, setSgstPercentage] = useState(0);
    const [igstPercentage, setIgstPercentage] = useState(0);
    const [items, setItems] = useState([]);

    // Submit state
    const [saving, setSaving] = useState(false);

    // Load PO data into state
    useEffect(() => {
        if (open && poData) {
            setPoDate(poData.po_date || new Date().toISOString().split('T')[0]);
            setSubject(poData.subject || "");
            setProjectName(poData.project_name || "");
            setBillTo(poData.bill_to || "");
            setShipTo(poData.ship_to || "");
            setPaymentDueDate(poData.payment_due_date || "");
            setTermsAndConditions(poData.terms_and_conditions || []);
            setRemarks(poData.remarks || "");
            setConversionRate(poData.conversion_rate || "");
            setDiscountAmount(parseFloat(poData.discount_amount) || 0);
            setCgstPercentage(parseFloat(poData.cgst_percentage) || 0);
            setSgstPercentage(parseFloat(poData.sgst_percentage) || 0);
            setIgstPercentage(parseFloat(poData.igst_percentage) || 0);
            setItems(
                (poData.items || []).map(item => ({
                    id: item.id,
                    product: item.product || item.product_id,
                    product_name: item.product_name,
                    product_code: item.product_code,
                    hsn_code: item.hsn_code,
                    unit: item.unit || "PCS",
                    quantity: parseFloat(item.quantity) || 0,
                    rate: parseFloat(item.rate) || 0
                }))
            );
        }
    }, [open, poData]);

    if (!open || !poData) return null;

    // Line item modifiers
    const handleItemChange = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = parseFloat(value) || 0;
        setItems(updated);
    };

    const handleRemoveItem = (index) => {
        const updated = items.filter((_, idx) => idx !== index);
        setItems(updated);
    };

    const handleAddProductSelect = (product) => {
        setSelectedProduct(product);
        setNewRate(parseFloat(product.base_price || product.rate) || 0);
        setProductSearch("");
        setSearchResults([]);
    };

    // Mathematical calculations
    const itemsTotal = items.reduce((acc, it) => acc + (it.quantity * it.rate), 0);
    const calculatedSubtotal = Math.max(0, itemsTotal - discountAmount);
    const cgstAmount = calculatedSubtotal * (cgstPercentage / 100);
    const sgstAmount = calculatedSubtotal * (sgstPercentage / 100);
    const igstAmount = calculatedSubtotal * (igstPercentage / 100);
    const freightCost = parseFloat(poData.freight_cost) || 0;
    const finalInvoiceTotal = calculatedSubtotal + cgstAmount + sgstAmount + igstAmount + freightCost;

    // Cancel action (triggers release of lock)
    const handleClose = async () => {
        try {
            await unlockPurchaseOrder(poData.id);
        } catch (err) {
            console.error("Failed to unlock PO on cancel", err);
        }
        onClose();
    };

    // Save action
    const handleSave = async () => {
        if (items.length === 0) {
            toast.error("A Purchase Order must have at least one item.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                po_date: poDate,
                subject: subject,
                project_name: projectName,
                bill_to: billTo,
                ship_to: shipTo,
                payment_due_date: paymentDueDate || null,
                conversion_rate: conversionRate ? parseFloat(conversionRate) : null,
                terms_and_conditions: termsAndConditions,
                remarks: remarks,
                discount_amount: parseFloat(discountAmount),
                cgst_percentage: parseFloat(cgstPercentage),
                sgst_percentage: parseFloat(sgstPercentage),
                igst_percentage: parseFloat(igstPercentage),
                items: items.map(it => ({
                    id: it.id || undefined,
                    product: it.product,
                    quantity: it.quantity,
                    rate: it.rate
                }))
            };

            await updatePurchaseOrder(poData.id, payload);
            toast.success("Purchase Order updated successfully!");

            await unlockPurchaseOrder(poData.id);

            if (onUpdate) onUpdate();
            onClose();
        } catch (error) {
            console.error("Failed to save PO edits", error);
            const msg = error.response?.data?.error || error.response?.data?.detail || "Failed to update Purchase Order";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            sx={{ zIndex: 1400 }}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: "90vh",
                    overflow: "hidden",
                }
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "#F8FAFC",
                    borderBottom: "1px solid",
                    borderColor: "grey.200",
                    py: 2,
                    px: 3,
                }}
            >
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "grey.900", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                        Edit Purchase Order
                    </Typography>
                    <Typography variant="caption" sx={{ color: "grey.500", fontFamily: "monospace" }}>
                        {poData.po_number} {"•"} Vendor: {poData.vendor_name}
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    sx={{ color: "grey.400", "&:hover": { color: "error.main", bgcolor: "#FEF2F2" } }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ bgcolor: BG, p: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
                    {/* General Settings */}
                    <Box sx={sectionBoxSx}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Typography sx={labelSx}>PO Date *</Typography>
                                <TextField
                                    type="date"
                                    value={poDate}
                                    onChange={(e) => setPoDate(e.target.value)}
                                    fullWidth
                                    size="small"
                                    sx={inputSx}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={labelSx}>Subject</Typography>
                                <TextField
                                    placeholder="PO subject..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    fullWidth
                                    size="small"
                                    sx={inputSx}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={labelSx}>Project Name</Typography>
                                <TextField
                                    placeholder="Project name..."
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    fullWidth
                                    size="small"
                                    sx={inputSx}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={labelSx}>Payment Due Date</Typography>
                                <TextField
                                    type="date"
                                    value={paymentDueDate}
                                    onChange={(e) => setPaymentDueDate(e.target.value)}
                                    fullWidth
                                    size="small"
                                    sx={inputSx}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            {poData.currency !== 'INR' && (
                                <Grid item xs={12} md={4}>
                                    <Typography sx={labelSx}>Conversion Rate (1 {poData.currency} = {"₹"}?)</Typography>
                                    <TextField
                                        type="number"
                                        inputProps={{ step: "0.0001" }}
                                        placeholder="e.g. 83.5"
                                        value={conversionRate}
                                        onChange={(e) => setConversionRate(e.target.value)}
                                        fullWidth
                                        size="small"
                                        sx={{ ...inputSx, "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], fontFamily: "monospace" } }}
                                    />
                                </Grid>
                            )}
                            <Grid item xs={12} md={4}>
                                <Typography sx={labelSx}>Discount Amount</Typography>
                                <TextField
                                    type="number"
                                    inputProps={{ step: "0.01" }}
                                    placeholder="0.00"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                    fullWidth
                                    size="small"
                                    sx={{ ...inputSx, "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], fontFamily: "monospace" } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={labelSx}>Remarks / Comments</Typography>
                                <TextField
                                    placeholder="Edit PO remarks..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    fullWidth
                                    size="small"
                                    sx={inputSx}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Bill To / Ship To */}
                    <Box sx={sectionBoxSx}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography sx={labelSx}>Bill To</Typography>
                                <TextField
                                    multiline
                                    rows={3}
                                    placeholder="Billing address..."
                                    value={billTo}
                                    onChange={(e) => setBillTo(e.target.value)}
                                    fullWidth
                                    size="small"
                                    sx={inputSx}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography sx={labelSx}>Ship To</Typography>
                                <TextField
                                    multiline
                                    rows={3}
                                    placeholder="Shipping address..."
                                    value={shipTo}
                                    onChange={(e) => setShipTo(e.target.value)}
                                    fullWidth
                                    size="small"
                                    sx={inputSx}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Tax Settings */}
                    <Box sx={sectionBoxSx}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Typography sx={labelSx}>CGST (%)</Typography>
                                <TextField
                                    type="number"
                                    inputProps={{ step: "0.01" }}
                                    placeholder="0.00"
                                    value={cgstPercentage}
                                    onChange={(e) => setCgstPercentage(parseFloat(e.target.value) || 0)}
                                    fullWidth
                                    size="small"
                                    sx={{ ...inputSx, "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], fontFamily: "monospace" } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={labelSx}>SGST (%)</Typography>
                                <TextField
                                    type="number"
                                    inputProps={{ step: "0.01" }}
                                    placeholder="0.00"
                                    value={sgstPercentage}
                                    onChange={(e) => setSgstPercentage(parseFloat(e.target.value) || 0)}
                                    fullWidth
                                    size="small"
                                    sx={{ ...inputSx, "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], fontFamily: "monospace" } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={labelSx}>IGST (%)</Typography>
                                <TextField
                                    type="number"
                                    inputProps={{ step: "0.01" }}
                                    placeholder="0.00"
                                    value={igstPercentage}
                                    onChange={(e) => setIgstPercentage(parseFloat(e.target.value) || 0)}
                                    fullWidth
                                    size="small"
                                    sx={{ ...inputSx, "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], fontFamily: "monospace" } }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Terms & Conditions */}
                    <Box sx={sectionBoxSx}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                            <Typography sx={{ ...labelSx, mb: 0 }}>Terms &amp; Conditions ({termsAndConditions.length})</Typography>
                            <Button
                                size="small"
                                onClick={() => setTermsAndConditions(prev => [...prev, { key: "", value: "", bold: false }])}
                                sx={{ color: PRIMARY, fontWeight: 700, fontSize: "0.75rem", textTransform: "none" }}
                            >
                                + Add Term
                            </Button>
                        </Box>
                        {termsAndConditions.length === 0 ? (
                            <Typography sx={{ fontSize: "0.75rem", color: "grey.400", fontStyle: "italic" }}>No terms added. Click "+ Add Term" to add.</Typography>
                        ) : (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                {termsAndConditions.map((term, idx) => {
                                    let termLabel = "";
                                    let termValue = "";
                                    let termBold = false;
                                    if (typeof term === "string") {
                                        const colonIdx = term.indexOf(":");
                                        if (colonIdx !== -1) {
                                            termLabel = term.substring(0, colonIdx).trim();
                                            termValue = term.substring(colonIdx + 1).trim();
                                        } else {
                                            termValue = term;
                                        }
                                    } else if (term && typeof term === "object") {
                                        termLabel = term.label || term.type || term.key || "";
                                        termValue = term.value || "";
                                        termBold = !!term.bold;
                                    }
                                    const writeTerm = (next) => {
                                        const updated = [...termsAndConditions];
                                        updated[idx] = { key: next.key, value: next.value, bold: next.bold };
                                        setTermsAndConditions(updated);
                                    };
                                    return (
                                        <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                                            <TextField
                                                placeholder="Label (e.g. Delivery)"
                                                value={termLabel}
                                                onChange={(e) => writeTerm({ key: e.target.value, value: termValue, bold: termBold })}
                                                size="small"
                                                sx={{ ...inputSx, width: "33%", "& input": { fontWeight: termBold ? 700 : 400 } }}
                                            />
                                            <TextField
                                                placeholder="Value (e.g. Within 30 days)"
                                                value={termValue}
                                                onChange={(e) => writeTerm({ key: termLabel, value: e.target.value, bold: termBold })}
                                                size="small"
                                                sx={{ ...inputSx, flex: 1, "& input": { fontWeight: termBold ? 700 : 400 } }}
                                            />
                                            <Tooltip title="Make this line bold in the PO">
                                                <Checkbox
                                                    checked={termBold}
                                                    onChange={(e) => writeTerm({ key: termLabel, value: termValue, bold: e.target.checked })}
                                                    size="small"
                                                />
                                            </Tooltip>
                                            <IconButton
                                                onClick={() => setTermsAndConditions(prev => prev.filter((_, i) => i !== idx))}
                                                size="small"
                                                sx={{ color: "error.light", "&:hover": { color: "error.main", bgcolor: "#FEF2F2" } }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>

                    {/* Items Grid */}
                    <Box>
                        <Typography sx={{ fontSize: "0.875rem", fontWeight: 900, color: "grey.800", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5 }}>
                            Line Items ({items.length})
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "grey.500" }}>Product Name</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "grey.500" }}>HSN</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "grey.500" }}>Quantity</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "grey.500" }}>Rate ({getCurrencySymbol(poData.currency)})</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "grey.500" }}>Total ({getCurrencySymbol(poData.currency)})</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "grey.500" }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={index} sx={{ "&:hover": { bgcolor: "#F8FAFC" } }}>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 700, color: "grey.800", fontSize: "0.875rem" }}>{item.product_name}</Typography>
                                                <Typography sx={{ fontSize: "10px", color: "grey.400", fontFamily: "monospace" }}>{item.product_code}</Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontSize: "0.75rem", fontWeight: 700, color: "grey.500" }}>{item.hsn_code || "---"}</TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                                                    <TextField
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                        size="small"
                                                        sx={{
                                                            width: 80,
                                                            "& .MuiOutlinedInput-root": {
                                                                borderRadius: 2,
                                                                fontSize: "0.75rem",
                                                                fontWeight: 700,
                                                                fontFamily: "monospace",
                                                                "& input": { textAlign: "right", py: 0.5, px: 1 },
                                                                "& fieldset": { borderColor: "grey.200" },
                                                                "&.Mui-focused fieldset": { borderColor: PRIMARY },
                                                            },
                                                        }}
                                                    />
                                                    <Typography sx={{ fontSize: "10px", color: "grey.400", fontWeight: 700 }}>{item.unit}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    type="number"
                                                    inputProps={{ step: "0.01" }}
                                                    value={item.rate}
                                                    onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                                                    size="small"
                                                    sx={{
                                                        width: 96,
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: 2,
                                                            fontSize: "0.75rem",
                                                            fontWeight: 700,
                                                            fontFamily: "monospace",
                                                            "& input": { textAlign: "right", py: 0.5, px: 1 },
                                                            "& fieldset": { borderColor: "grey.200" },
                                                            "&.Mui-focused fieldset": { borderColor: PRIMARY },
                                                        },
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 900, color: "grey.800", fontFamily: "monospace" }}>
                                                {(item.quantity * item.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    onClick={() => handleRemoveItem(index)}
                                                    size="small"
                                                    sx={{ color: "error.main", "&:hover": { bgcolor: "#FEF2F2" } }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 5, color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem" }}>
                                                No items in this Purchase Order. Please add a product above.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Calculations Review Block */}
                    <Box sx={{ ...sectionBoxSx, bgcolor: "#F8FAFC" }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                                    <Typography sx={{ fontSize: "0.75rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                        All taxes, discounts, and custom rates are calculated live.
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "grey.600" }}>Items Total:</Typography>
                                        <Typography sx={{ fontFamily: "monospace", fontWeight: 700, color: "grey.800", fontSize: "0.875rem" }}>
                                            {getCurrencySymbol(poData.currency)} {itemsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Typography>
                                    </Box>
                                    {discountAmount > 0 && (
                                        <Box sx={{ display: "flex", justifyContent: "space-between", color: "error.main" }}>
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 700 }}>Discount Applied:</Typography>
                                            <Typography sx={{ fontFamily: "monospace", fontWeight: 700, color: "error.dark", fontSize: "0.875rem" }}>
                                                -{getCurrencySymbol(poData.currency)} {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                    )}
                                    {cgstPercentage > 0 && (
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "grey.600" }}>CGST ({cgstPercentage}%):</Typography>
                                            <Typography sx={{ fontFamily: "monospace", fontWeight: 700, color: "grey.800", fontSize: "0.875rem" }}>
                                                {getCurrencySymbol(poData.currency)} {cgstAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                    )}
                                    {sgstPercentage > 0 && (
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "grey.600" }}>SGST ({sgstPercentage}%):</Typography>
                                            <Typography sx={{ fontFamily: "monospace", fontWeight: 700, color: "grey.800", fontSize: "0.875rem" }}>
                                                {getCurrencySymbol(poData.currency)} {sgstAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                    )}
                                    {igstPercentage > 0 && (
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "grey.600" }}>IGST ({igstPercentage}%):</Typography>
                                            <Typography sx={{ fontFamily: "monospace", fontWeight: 700, color: "grey.800", fontSize: "0.875rem" }}>
                                                {getCurrencySymbol(poData.currency)} {igstAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                    )}
                                    {freightCost > 0 && (
                                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "grey.600" }}>Freight Cost:</Typography>
                                            <Typography sx={{ fontFamily: "monospace", fontWeight: 700, color: "grey.800", fontSize: "0.875rem" }}>
                                                {getCurrencySymbol(poData.currency)} {freightCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                    )}
                                    <Divider sx={{ my: 0.5 }} />
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Typography sx={{ fontSize: "1rem", fontWeight: 900, color: "grey.900", textTransform: "uppercase" }}>Estimated Invoice Total:</Typography>
                                        <Typography sx={{ fontSize: "1.25rem", fontWeight: 900, color: PRIMARY, fontFamily: "monospace" }}>
                                            {getCurrencySymbol(poData.currency)} {finalInvoiceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </DialogContent>

            {/* Footer */}
            <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "grey.200", bgcolor: "#F8FAFC", gap: 1.5 }}>
                <Button
                    onClick={handleClose}
                    disabled={saving}
                    variant="outlined"
                    sx={{
                        color: "grey.700",
                        borderColor: "grey.300",
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 2.5,
                        "&:hover": { bgcolor: "grey.100" },
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving || items.length === 0}
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    sx={{
                        bgcolor: PRIMARY,
                        "&:hover": { bgcolor: "#0D47A1" },
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 2.5,
                    }}
                >
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditPurchaseOrderModal;
