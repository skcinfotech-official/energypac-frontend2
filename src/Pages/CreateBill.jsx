import { useState, useEffect, useRef } from "react";
import { getProformaInvoices, getProformaInvoiceById, createBill, getBillableItems } from "../services/salesService";
import {
    Box, Card, Paper, Typography, Button, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Tooltip, CircularProgress, Chip,
    InputAdornment, Select, MenuItem, FormControl, InputLabel, Alert, Divider, Grid,
    ToggleButton, ToggleButtonGroup
} from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PercentIcon from "@mui/icons-material/Percent";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import InfoIcon from "@mui/icons-material/Info";
import AlertToast from "../components/ui/AlertToast";

const CreateBill = () => {

    // Page Status
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });

    // Trade-type mode: separates Domestic PIs from International PIs (separate bills)
    const [mode, setMode] = useState("DOMESTIC"); // "DOMESTIC" | "INTERNATIONAL"

    // PI Selection dropdown states
    const [piList, setPiList] = useState([]);
    const [piSearch, setPiSearch] = useState("");
    const [isPiDropdownOpen, setIsPiDropdownOpen] = useState(false);
    const [selectedPi, setSelectedPi] = useState(null);
    const [piListLoading, setPiListLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Currency from selected PI
    const [piCurrency, setPiCurrency] = useState("INR");
    // Quantity-level partial billing: true when the PI's every line is fully
    // billed (nothing left to bill) — generating a new bill is then blocked.
    const [fullyBilled, setFullyBilled] = useState(false);

    const getCurrencySymbol = (code) => {
        switch (code?.toUpperCase()) {
            case "USD": case "AUD": case "CAD": case "SGD": case "HKD": return "$";
            case "INR": return "₹";
            case "EUR": return "€";
            case "GBP": return "£";
            case "JPY": case "CNY": return "¥";
            case "AED": return "د.إ";
            case "SAR": return "﷼";
            case "BDT": return "৳";
            // Any other ISO code: show the code itself (e.g. "CHF 1,200.00")
            default: return code || "";
        }
    };

    // Form data state
    const [formData, setFormData] = useState({
        proforma_invoice: "",
        bill_date: new Date().toISOString().split('T')[0],
        bill_type: "DOMESTIC",
        client_name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        cgst_percentage: 0,
        sgst_percentage: 0,
        igst_percentage: 18,
        discount_amount: 0,
        remarks: "",
        items: []
    });

    // Handle clicking outside PI dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsPiDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch PI list when dropdown is opened or search text changes
    useEffect(() => {
        if (!isPiDropdownOpen) return;

        const fetchPIs = async () => {
            setPiListLoading(true);
            try {
                const response = await getProformaInvoices(1, piSearch, mode);
                const results = response.results || [];
                setPiList(results);
            } catch (err) {
                console.error("Failed to fetch PIs for dropdown", err);
            } finally {
                setPiListLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchPIs();
        }, 300);

        return () => clearTimeout(timer);
    }, [piSearch, isPiDropdownOpen, mode]);

    // Switch trade-type mode: reset current selection so domestic/international stay separate
    const handleModeChange = (_, newMode) => {
        if (!newMode || newMode === mode) return;
        setMode(newMode);
        setSelectedPi(null);
        setFullyBilled(false);
        setPiList([]);
        setPiSearch("");
        // International currency is whatever the chosen PI uses — stay neutral until one is picked.
        setPiCurrency(newMode === "INTERNATIONAL" ? "" : "INR");
        setFormData(prev => ({
            ...prev,
            proforma_invoice: "",
            bill_type: newMode,
            client_name: "",
            contact_person: "",
            phone: "",
            email: "",
            address: "",
            cgst_percentage: 0,
            sgst_percentage: 0,
            igst_percentage: 0,   // No GST on international/export bills
            discount_amount: 0,
            remarks: "",
            items: []
        }));
    };

    // Handle selection of a Proforma Invoice
    const handlePiSelect = async (pi) => {
        setSelectedPi(pi);
        setIsPiDropdownOpen(false);
        setPiSearch("");
        setLoading(true);
        setFullyBilled(false);

        try {
            // Quantity-level partial billing: fetch what is still left to bill.
            // A fully-billed PI is blocked; otherwise we pre-fill the REMAINING
            // quantity per line so the user bills only the unbilled balance.
            const billable = await getBillableItems(pi.id);
            if (billable?.is_fully_billed) {
                setFullyBilled(true);
                setLoading(false);
                setAlert({
                    open: true,
                    type: "error",
                    message: "This PI is fully billed. No remaining quantity left to bill.",
                });
                return;
            }
            const remainingByPiItem = {};
            (billable?.items || []).forEach((it) => {
                remainingByPiItem[it.pi_item] = Number(it.remaining_qty);
            });

            const details = await getProformaInvoiceById(pi.id);
            if (details) {
                const currency = details.currency || "INR";
                setPiCurrency(currency);

                // Bill type follows the selected tab (trade_type), not the currency.
                // International/export bills carry NO GST — taxes stay 0.
                const defaultBillType = mode;
                const defaultIgst = 0;

                // Keep only lines that still have a remaining quantity; default
                // each to its remaining (the max billable now). User can lower it.
                const mappedItems = (details.items || [])
                    .map((item) => {
                        const rem = remainingByPiItem[item.id];
                        return { item, rem };
                    })
                    .filter(({ rem }) => rem === undefined || rem > 0)
                    .map(({ item, rem }) => ({
                        pi_item: item.id || null,
                        product: item.product || null,
                        item_name: item.product_name || item.item_name || "Product Item",
                        hsn_code: item.hsn_code || "",
                        unit: item.unit || "KG",
                        quantity: rem !== undefined ? rem : (Number(item.quantity) || 0),
                        max_quantity: rem !== undefined ? rem : undefined,
                        rate: Number(item.unit_price || item.rate) || 0
                    }));

                setFormData(prev => ({
                    ...prev,
                    proforma_invoice: details.id,
                    bill_type: defaultBillType,
                    client_name: details.applicant_importer || "",
                    contact_person: details.consignee ? details.consignee.split("\n")[0] : "",
                    phone: details.phone || "",
                    email: details.email || "",
                    address: details.consignee || details.applicant_importer || "",
                    cgst_percentage: 0,
                    sgst_percentage: 0,
                    igst_percentage: defaultIgst,
                    discount_amount: 0,
                    remarks: `Against PI ${details.pi_number || details.id}`,
                    items: mappedItems
                }));

                setAlert({
                    open: true,
                    type: "success",
                    message: `Successfully loaded PI details: ${details.pi_number}`
                });
            }
        } catch (err) {
            console.error("Failed to load selected PI details", err);
            setAlert({
                open: true,
                type: "error",
                message: "Failed to load proforma invoice details."
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculate real-time summary financials
    const calculateFinancials = () => {
        const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);

        const cgst = subtotal * (Number(formData.cgst_percentage || 0) / 100);
        const sgst = subtotal * (Number(formData.sgst_percentage || 0) / 100);
        const igst = subtotal * (Number(formData.igst_percentage || 0) / 100);
        const totalTax = cgst + sgst + igst;

        const discount = Number(formData.discount_amount || 0);
        const netPayable = Math.max(0, subtotal + totalTax - discount);

        return {
            subtotal,
            cgst,
            sgst,
            igst,
            totalTax,
            netPayable
        };
    };

    const financials = calculateFinancials();

    // Handle form input fields change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.endsWith("_percentage") || name === "discount_amount"
                ? (parseFloat(value) || 0)
                : value
        }));
    };

    // Handle inline change for a specific item in the table
    const handleItemChange = (index, field, value) => {
        setFormData(prev => {
            const updatedItems = [...prev.items];
            let nextValue = field === "quantity" || field === "rate" ? (parseFloat(value) || 0) : value;
            // Quantity-level partial billing: never let a line be billed for more
            // than its remaining (unbilled) quantity. Backend enforces this too.
            if (field === "quantity") {
                const max = updatedItems[index].max_quantity;
                if (max !== undefined && nextValue > max) nextValue = max;
            }
            updatedItems[index] = {
                ...updatedItems[index],
                [field]: nextValue
            };
            return {
                ...prev,
                items: updatedItems
            };
        });
    };

    // Remove an item from the bill item list
    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    // Form submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.proforma_invoice) {
            setAlert({ open: true, type: "error", message: "Please select a Proforma Invoice first." });
            return;
        }

        if (!formData.client_name?.trim()) {
            setAlert({ open: true, type: "error", message: "Client Name is required." });
            return;
        }

        if (!formData.bill_date) {
            setAlert({ open: true, type: "error", message: "Bill Date is required." });
            return;
        }

        if (formData.items.length === 0) {
            setAlert({ open: true, type: "error", message: "The bill must contain at least one item." });
            return;
        }

        const invalidItem = formData.items.find(item => !item.item_name || item.quantity <= 0 || item.rate <= 0);
        if (invalidItem) {
            setAlert({ open: true, type: "error", message: "All items must have a name, quantity > 0 and rate > 0." });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                cgst_percentage: Number(formData.cgst_percentage),
                sgst_percentage: Number(formData.sgst_percentage),
                igst_percentage: Number(formData.igst_percentage),
                discount_amount: Number(formData.discount_amount),
                items: formData.items.map(item => ({
                    ...item,
                    quantity: Number(item.quantity),
                    rate: Number(item.rate)
                }))
            };

            await createBill(payload);
            setAlert({ open: true, type: "success", message: "Bill generated successfully!" });
            // Stay on this page after creating — do not auto-redirect to the bills
            // list. The user can navigate away manually when they're ready.

        } catch (err) {
            console.error("Failed to create bill", err);
            const errMsg = err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || "Failed to create PI Bill.";
            setAlert({ open: true, type: "error", message: errMsg });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 1280, mx: "auto", py: 2, px: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* HEADER */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "grey.200" }}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: "grey.800", display: "flex", alignItems: "center", gap: 1.5 }}>
                            <ReceiptLongIcon sx={{ color: "primary.main" }} />
                            Create PI Bill
                        </Typography>
                        <Typography variant="body2" sx={{ color: "grey.500", mt: 0.5, fontWeight: 500 }}>
                            Issue bills against existing proforma invoices. Fields and item lists are pre-populated automatically.
                        </Typography>
                    </Box>

                    {/* DOMESTIC / INTERNATIONAL mode toggle */}
                    <ToggleButtonGroup
                        exclusive
                        value={mode}
                        onChange={handleModeChange}
                        sx={{
                            bgcolor: "grey.50",
                            borderRadius: 3,
                            p: 0.5,
                            "& .MuiToggleButton-root": {
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "0.82rem",
                                px: 2,
                                py: 0.8,
                                gap: 0.75,
                                border: "none",
                                borderRadius: "10px !important",
                                color: "grey.600",
                                "&.Mui-selected": {
                                    bgcolor: "#fff",
                                    color: "primary.main",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                                    "&:hover": { bgcolor: "#fff" },
                                },
                            },
                        }}
                    >
                        <ToggleButton value="DOMESTIC"><HomeWorkIcon sx={{ fontSize: 18 }} />Domestic PI</ToggleButton>
                        <ToggleButton value="INTERNATIONAL"><PublicIcon sx={{ fontSize: 18 }} />International PI</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Paper>

            <form onSubmit={handleSubmit}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {/* PI SELECTION & CORE PROPERTIES */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "grey.200" }}>
                        <Grid container spacing={3}>
                            {/* SEARCH/SELECT PROFORMA INVOICE */}
                            <Grid item xs={12} md={4}>
                                <Box ref={dropdownRef} sx={{ position: "relative" }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.500", textTransform: "uppercase", letterSpacing: 1, mb: 1, display: "block" }}>
                                        Select Proforma Invoice *
                                    </Typography>
                                    <Box
                                        onClick={() => setIsPiDropdownOpen(!isPiDropdownOpen)}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            px: 2,
                                            py: 1.5,
                                            bgcolor: "grey.50",
                                            border: "1px solid",
                                            borderColor: "grey.200",
                                            borderRadius: 3,
                                            cursor: "pointer",
                                            minHeight: 44,
                                            "&:hover": { borderColor: "primary.main" },
                                            transition: "border-color 0.2s"
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: selectedPi ? 700 : 600, color: selectedPi ? "grey.800" : "grey.400" }}>
                                            {selectedPi ? `${selectedPi.pi_number} (${selectedPi.applicant_importer})` : `Select a ${mode === "INTERNATIONAL" ? "International" : "Domestic"} PI...`}
                                        </Typography>
                                        <KeyboardArrowDownIcon sx={{ color: "grey.400", fontSize: 18, transition: "transform 0.2s", transform: isPiDropdownOpen ? "rotate(180deg)" : "none" }} />
                                    </Box>

                                    {isPiDropdownOpen && (
                                        <Paper elevation={8} sx={{ position: "absolute", left: 0, right: 0, mt: 1, borderRadius: 3, zIndex: 50, overflow: "hidden", border: "1px solid", borderColor: "grey.200" }}>
                                            <Box sx={{ p: 1.5, borderBottom: "1px solid", borderColor: "grey.100", bgcolor: "grey.50" }}>
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="Search by PI ref or client..."
                                                    value={piSearch}
                                                    onChange={(e) => setPiSearch(e.target.value)}
                                                    autoFocus
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <SearchIcon sx={{ color: "grey.400", fontSize: 18 }} />
                                                            </InputAdornment>
                                                        ),
                                                        sx: { borderRadius: 2, fontSize: 14 }
                                                    }}
                                                />
                                            </Box>
                                            <Box sx={{ maxHeight: 240, overflowY: "auto", py: 0.5 }}>
                                                {piListLoading ? (
                                                    <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                                                        <CircularProgress size={16} />
                                                        <Typography variant="caption" sx={{ color: "grey.400" }}>Loading proforma invoices...</Typography>
                                                    </Box>
                                                ) : piList.length > 0 ? (
                                                    piList.map((pi) => (
                                                        <Box
                                                            key={pi.id}
                                                            onClick={() => handlePiSelect(pi)}
                                                            sx={{
                                                                px: 2,
                                                                py: 1.5,
                                                                cursor: "pointer",
                                                                "&:hover": { bgcolor: "primary.50" },
                                                                transition: "background-color 0.15s",
                                                                borderBottom: "1px solid",
                                                                borderColor: "grey.50"
                                                            }}
                                                        >
                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: "grey.800", fontFamily: "monospace" }}>
                                                                {pi.pi_number || `#${pi.id.substring(0, 8)}`}
                                                            </Typography>
                                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                                                                <Typography variant="caption" sx={{ color: "grey.500", fontWeight: 500 }}>
                                                                    {pi.applicant_importer}
                                                                </Typography>
                                                                <Chip
                                                                    label={`${pi.currency} ${Number(pi.grand_total).toLocaleString()}`}
                                                                    size="small"
                                                                    sx={{ fontWeight: 600, fontSize: 11, bgcolor: "primary.50", color: "primary.main", height: 22 }}
                                                                />
                                                            </Box>
                                                        </Box>
                                                    ))
                                                ) : (
                                                    <Typography variant="caption" sx={{ p: 2, display: "block", textAlign: "center", color: "grey.400", fontStyle: "italic" }}>
                                                        No {mode === "INTERNATIONAL" ? "International" : "Domestic"} proforma invoices found
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Paper>
                                    )}
                                </Box>
                            </Grid>

                            {/* BILL DATE */}
                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.500", textTransform: "uppercase", letterSpacing: 1, mb: 1, display: "block" }}>
                                    Bill Date *
                                </Typography>
                                <TextField
                                    fullWidth
                                    type="date"
                                    name="bill_date"
                                    value={formData.bill_date}
                                    onChange={handleInputChange}
                                    required
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarTodayIcon sx={{ color: "grey.400", fontSize: 16 }} />
                                            </InputAdornment>
                                        ),
                                        sx: { borderRadius: 3, bgcolor: "grey.50", fontWeight: 700, fontSize: 14 }
                                    }}
                                />
                            </Grid>

                            {/* BILL TYPE */}
                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.500", textTransform: "uppercase", letterSpacing: 1, mb: 1, display: "block" }}>
                                    Bill Type *
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        name="bill_type"
                                        value={formData.bill_type}
                                        disabled
                                        sx={{ borderRadius: 3, bgcolor: "grey.100", fontWeight: 700, fontSize: 14 }}
                                    >
                                        <MenuItem value="DOMESTIC">DOMESTIC</MenuItem>
                                        <MenuItem value="INTERNATIONAL">INTERNATIONAL</MenuItem>
                                    </Select>
                                    <Typography variant="caption" sx={{ color: "grey.400", mt: 0.5, fontStyle: "italic" }}>
                                        Set by the {mode === "INTERNATIONAL" ? "International" : "Domestic"} tab above
                                    </Typography>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* PI FULLY BILLED ALERT */}
                    {fullyBilled && (
                        <Alert
                            severity="error"
                            icon={<InfoIcon />}
                            sx={{ borderRadius: 4, border: "1px solid", borderColor: "error.200" }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                PI Fully Billed
                            </Typography>
                            <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                                Every item of this Proforma Invoice has already been billed in full.
                                There is no remaining quantity left to bill. Please select a different PI.
                            </Typography>
                        </Alert>
                    )}

                    {/* CLIENT INFORMATION */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "grey.200" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid", borderColor: "grey.100", pb: 1.5, mb: 2 }}>
                            <PersonIcon sx={{ color: "grey.400", fontSize: 18 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "grey.700", textTransform: "uppercase", letterSpacing: 1 }}>
                                Client / Customer Contact details
                            </Typography>
                        </Box>

                        {loading ? (
                            <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                <CircularProgress size={28} sx={{ mb: 1 }} />
                                <Typography variant="caption" sx={{ fontWeight: 600, color: "grey.400" }}>Loading data from PI...</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6} lg={3}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.400", textTransform: "uppercase", letterSpacing: 1, mb: 0.75, display: "block", fontSize: 10 }}>
                                        Client Name *
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="client_name"
                                        value={formData.client_name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. ABC Trading LLC"
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonIcon sx={{ color: "grey.400", fontSize: 16 }} />
                                                </InputAdornment>
                                            ),
                                            sx: { borderRadius: 3, bgcolor: "grey.50", fontWeight: 600, fontSize: 14 }
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6} lg={3}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.400", textTransform: "uppercase", letterSpacing: 1, mb: 0.75, display: "block", fontSize: 10 }}>
                                        Contact Person
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={handleInputChange}
                                        placeholder="e.g. John"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonIcon sx={{ color: "grey.400", fontSize: 16 }} />
                                                </InputAdornment>
                                            ),
                                            sx: { borderRadius: 3, bgcolor: "grey.50", fontWeight: 600, fontSize: 14 }
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6} lg={3}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.400", textTransform: "uppercase", letterSpacing: 1, mb: 0.75, display: "block", fontSize: 10 }}>
                                        Phone Number
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. +971-555-1234"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PhoneIcon sx={{ color: "grey.400", fontSize: 16 }} />
                                                </InputAdornment>
                                            ),
                                            sx: { borderRadius: 3, bgcolor: "grey.50", fontWeight: 600, fontSize: 14 }
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6} lg={3}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.400", textTransform: "uppercase", letterSpacing: 1, mb: 0.75, display: "block", fontSize: 10 }}>
                                        Email Address
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="e.g. john@abc.com"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailIcon sx={{ color: "grey.400", fontSize: 16 }} />
                                                </InputAdornment>
                                            ),
                                            sx: { borderRadius: 3, bgcolor: "grey.50", fontWeight: 600, fontSize: 14 }
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.400", textTransform: "uppercase", letterSpacing: 1, mb: 0.75, display: "block", fontSize: 10 }}>
                                        Billing Address
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="e.g.  New York, USA"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOnIcon sx={{ color: "grey.400", fontSize: 16 }} />
                                                </InputAdornment>
                                            ),
                                            sx: { borderRadius: 3, bgcolor: "grey.50", fontWeight: 600, fontSize: 14 }
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        )}
                    </Paper>

                    {/* ITEMS SECTION */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "grey.200" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "grey.100", pb: 1.5, mb: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Inventory2Icon sx={{ color: "grey.400", fontSize: 18 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "grey.700", textTransform: "uppercase", letterSpacing: 1 }}>
                                    Bill Items
                                </Typography>
                            </Box>
                        </Box>

                        {loading ? (
                            <Box sx={{ py: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                <CircularProgress size={32} sx={{ mb: 1.5 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "grey.400" }}>Building item list from proforma invoice...</Typography>
                            </Box>
                        ) : (
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "grey.50" }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "grey.500", textTransform: "uppercase", textAlign: "center", width: 48 }}>#</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "grey.500", textTransform: "uppercase" }}>Item Name / Product Details *</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "grey.500", textTransform: "uppercase", textAlign: "center", width: 128 }}>HSN Code</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "grey.500", textTransform: "uppercase", textAlign: "center", width: 112 }}>Unit</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "grey.500", textTransform: "uppercase", textAlign: "right", width: 112 }}>Quantity *</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "grey.500", textTransform: "uppercase", textAlign: "right", width: 144 }}>Rate *</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "grey.500", textTransform: "uppercase", textAlign: "right", width: 144 }}>Total Amount</TableCell>
                                            <TableCell sx={{ width: 48 }} />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData.items.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} sx={{ textAlign: "center", py: 6, color: "grey.400", fontStyle: "italic", fontSize: 13 }}>
                                                    No items listed. Choose a Proforma Invoice to load items automatically.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            formData.items.map((item, index) => (
                                                <TableRow key={index} hover sx={{ verticalAlign: "middle" }}>
                                                    <TableCell sx={{ textAlign: "center", fontWeight: 600, color: "grey.400" }}>{index + 1}</TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            value={item.item_name}
                                                            onChange={(e) => handleItemChange(index, "item_name", e.target.value)}
                                                            placeholder="Item description"
                                                            required
                                                            InputProps={{ sx: { borderRadius: 2, bgcolor: "grey.50", fontSize: 12, fontWeight: 600 } }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            value={item.hsn_code}
                                                            onChange={(e) => handleItemChange(index, "hsn_code", e.target.value)}
                                                            placeholder="HSN Code"
                                                            InputProps={{ sx: { borderRadius: 2, bgcolor: "grey.50", fontSize: 12, fontWeight: 700, fontFamily: "monospace", textAlign: "center", "& input": { textAlign: "center" } } }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            value={item.unit}
                                                            onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                                                            placeholder="e.g. KG, MTR"
                                                            InputProps={{ sx: { borderRadius: 2, bgcolor: "grey.50", fontSize: 12, fontWeight: 600, "& input": { textAlign: "center" } } }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: "right" }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                            required
                                                            inputProps={{ min: "0.01", step: "any", max: item.max_quantity }}
                                                            InputProps={{ sx: { borderRadius: 2, bgcolor: "grey.50", fontSize: 12, fontWeight: 700, width: 96, "& input": { textAlign: "right" } } }}
                                                        />
                                                        {item.max_quantity !== undefined && (
                                                            <Typography sx={{ fontSize: 10, color: "grey.500", fontWeight: 600, mt: 0.5, textAlign: "right" }}>
                                                                Remaining: {item.max_quantity}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: "right" }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={item.rate}
                                                            onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                                                            required
                                                            inputProps={{ min: "0.01", step: "any" }}
                                                            InputProps={{ sx: { borderRadius: 2, bgcolor: "grey.50", fontSize: 12, fontWeight: 700, width: 112, "& input": { textAlign: "right" } } }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: "right", fontWeight: 700, color: "grey.800", fontFamily: "monospace", fontSize: 12 }}>
                                                        {Number(item.quantity * item.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: "center" }}>
                                                        <Tooltip title="Remove item">
                                                            <IconButton size="small" onClick={() => handleRemoveItem(index)} sx={{ color: "error.light", "&:hover": { color: "error.main" } }}>
                                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>

                    {/* BOTTOM BLOCK: REMARKS & TAXES SUMMARY */}
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3 }}>
                        {/* REMARKS AND ADDITIONAL FIELDS */}
                        <Paper elevation={0} sx={{ flex: 1, p: 3, borderRadius: 4, border: "1px solid", borderColor: "grey.200" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid", borderColor: "grey.100", pb: 1.5, mb: 2 }}>
                                <ChatBubbleIcon sx={{ color: "grey.400", fontSize: 18 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "grey.700", textTransform: "uppercase", letterSpacing: 1 }}>
                                    Remarks & Details
                                </Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.500", textTransform: "uppercase", letterSpacing: 1, mb: 1, display: "block" }}>
                                    Remarks
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    placeholder="Write any specific annotations or reference points..."
                                    InputProps={{ sx: { borderRadius: 3, bgcolor: "grey.50", fontWeight: 600, fontSize: 14 } }}
                                />
                            </Box>

                            <Alert
                                severity="info"
                                icon={<InfoIcon sx={{ fontSize: 18 }} />}
                                sx={{ borderRadius: 3, bgcolor: "primary.50", "& .MuiAlert-message": { fontSize: 12, lineHeight: 1.6 } }}
                            >
                                <Typography variant="caption" component="span" sx={{ fontWeight: 700 }}>Pro-Tip: </Typography>
                                <Typography variant="caption" component="span">
                                    Generating a bill records it permanently in the Finance Ledger. Please make sure that all items loaded from the Proforma Invoice correspond exactly to the delivery parameters.
                                </Typography>
                            </Alert>
                        </Paper>

                        {/* FINANCIALS, TAXES AND GRAND TOTAL */}
                        <Paper elevation={0} sx={{ width: { xs: "100%", lg: 420 }, flexShrink: 0, bgcolor: "grey.50", p: 3, borderRadius: 4, border: "1px solid", borderColor: "grey.200", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 3 }}>
                            <Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid", borderColor: "grey.200", pb: 1.5 }}>
                                    <MonetizationOnIcon sx={{ color: "primary.main", fontSize: 18 }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "grey.700", textTransform: "uppercase", letterSpacing: 1 }}>
                                        Financial Summary
                                    </Typography>
                                </Box>

                                <Box sx={{ mt: 2.5, display: "flex", flexDirection: "column", gap: 1.75 }}>
                                    {/* Items Subtotal */}
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: "grey.600" }}>Items Subtotal</Typography>
                                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: "grey.900" }}>
                                            {getCurrencySymbol(piCurrency)} {financials.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Typography>
                                    </Box>

                                    {/* TAX INPUT FIELDS — domestic only; international/export has no GST */}
                                    <Divider />
                                    {mode === "DOMESTIC" ? (
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 0.5 }}>
                                        {/* CGST */}
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: "grey.600" }}>CGST (%)</Typography>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    name="cgst_percentage"
                                                    value={formData.cgst_percentage}
                                                    onChange={handleInputChange}
                                                    inputProps={{ min: 0, max: 100 }}
                                                    InputProps={{
                                                        sx: { borderRadius: 2, bgcolor: "white", width: 80, fontSize: 12, fontWeight: 700, "& input": { textAlign: "right", py: 0.75, px: 1.5 } }
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.500" }}>%</Typography>
                                            </Box>
                                        </Box>

                                        {/* SGST */}
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: "grey.600" }}>SGST (%)</Typography>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    name="sgst_percentage"
                                                    value={formData.sgst_percentage}
                                                    onChange={handleInputChange}
                                                    inputProps={{ min: 0, max: 100 }}
                                                    InputProps={{
                                                        sx: { borderRadius: 2, bgcolor: "white", width: 80, fontSize: 12, fontWeight: 700, "& input": { textAlign: "right", py: 0.75, px: 1.5 } }
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.500" }}>%</Typography>
                                            </Box>
                                        </Box>

                                        {/* IGST */}
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: "grey.600" }}>IGST (%)</Typography>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    name="igst_percentage"
                                                    value={formData.igst_percentage}
                                                    onChange={handleInputChange}
                                                    inputProps={{ min: 0, max: 100 }}
                                                    InputProps={{
                                                        sx: { borderRadius: 2, bgcolor: "white", width: 80, fontSize: 12, fontWeight: 700, "& input": { textAlign: "right", py: 0.75, px: 1.5 } }
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.500" }}>%</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    ) : (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1.25, px: 1.5, borderRadius: 2, bgcolor: "#fff", border: "1px dashed", borderColor: "grey.300" }}>
                                            <PublicIcon sx={{ fontSize: 18, color: "grey.500" }} />
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.600" }}>
                                                No GST — Export / International invoice. Amounts come directly from the PI.
                                            </Typography>
                                        </Box>
                                    )}
                                    <Divider />

                                    {/* DISCOUNT AMOUNT INPUT */}
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: "grey.600" }}>Discount Amount</Typography>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: "grey.500" }}>{getCurrencySymbol(piCurrency)}</Typography>
                                            <TextField
                                                size="small"
                                                type="number"
                                                name="discount_amount"
                                                value={formData.discount_amount}
                                                onChange={handleInputChange}
                                                inputProps={{ min: 0, step: "any" }}
                                                InputProps={{
                                                    sx: { borderRadius: 2, bgcolor: "white", width: 112, fontSize: 12, fontWeight: 700, "& input": { textAlign: "right", py: 0.75, px: 1.5 } }
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    {/* Total Taxation Value — domestic only */}
                                    {mode === "DOMESTIC" && (
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: "grey.500" }}>Total Taxation Value</Typography>
                                            <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "grey.700" }}>
                                                {getCurrencySymbol(piCurrency)} {financials.totalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            {/* GRAND TOTAL & SUBMIT BUTTON */}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 3, borderTop: "1px solid", borderColor: "grey.200" }}>
                                <Paper variant="outlined" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, borderRadius: 3, bgcolor: "white" }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "grey.700" }}>Grand Total Net Payable</Typography>
                                    <Typography variant="h5" sx={{ fontFamily: "monospace", fontWeight: 900, color: "primary.main" }}>
                                        {getCurrencySymbol(piCurrency)} {financials.netPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Typography>
                                </Paper>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    disabled={submitting || loading || fullyBilled}
                                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckIcon sx={{ fontSize: 16 }} />}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 3,
                                        fontWeight: 700,
                                        fontSize: 14,
                                        textTransform: "none",
                                        boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
                                        "&:active": { transform: "scale(0.98)" }
                                    }}
                                >
                                    {submitting ? "RECORDING BILL..." : "GENERATE PI BILL"}
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </form>

            {/* ALERT TOAST */}
            <AlertToast
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ ...alert, open: false })}
            />
        </Box>
    );
};

export default CreateBill;
