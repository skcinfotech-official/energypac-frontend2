import { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, IconButton, Button, TextField, Grid,
    Table, TableHead, TableBody, TableRow, TableCell, TableFooter,
    Checkbox, Chip, Alert, CircularProgress, FormControl,
    InputLabel, Select, MenuItem, Tooltip, Divider, Card,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import DescriptionIcon from "@mui/icons-material/Description";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SearchIcon from "@mui/icons-material/Search";
import BoltIcon from "@mui/icons-material/Bolt";
import { toast } from "react-hot-toast";
import { fetchRequisitions } from "../../services/requisition";
import { createProformaInvoice, updateProformaInvoice, getRequisitionItemsForPi, getStockItemsForPi } from "../../services/salesService";
import { previewProfit } from "../../services/financeService";
import { getCurrencies } from "../../services/currencyService";
import { getProducts, createProduct } from "../../services/productService";

const PRIMARY = "#1565C0";
const BG = "#FAFBFC";

// Default Terms & Conditions pre-filled on a new PI. Users can edit, remove,
// add new ones, and mark any line bold (key + value) via the per-row checkbox.
const DEFAULT_PI_TERMS = [
    { key: "Production Time", value: "Within 20 days from the date of L/C" },
    { key: "Mode of Shipment", value: "By Road" },
    { key: "Time of Shipment", value: "Within 25 days after the date of L/C" },
    { key: "Terms of Delivery", value: "C&F upto Jogbani, Bihar, India" },
    { key: "Terms of Payment", value: "By 100% Irrevocable L/C 30 days At Sight" },
    { key: "Packing Specification", value: "Export standard road worthy packing would be used" },
    { key: "Tolerance", value: "± 10% on Qty & Value" },
    { key: "PI Validity", value: "Upto 31/08/2026" },
    { key: "Insurance", value: "To be covered by the applicant" },
    { key: "Advising Bank Details", value: "Standard Chartered Bank, Kolkata, SWIFT CODE: SCBLINBB" },
    { key: "Partial Shipment", value: "Allowed" },
    { key: "Transshipment", value: "Allowed" },
    { key: "Period of Documents Presentation", value: "Within 21 days after the date of Shipment" },
    { key: "Contract No", value: "EEL/KOL/25/55" },
    { key: "Contract Date", value: "20/09/2025" },
];

const makeDefaultTerms = () =>
    DEFAULT_PI_TERMS.map((t, i) => ({ id: i + 1, key: t.key, value: t.value, bold: false }));

const ClientQuotationModal = ({ isOpen, onClose, onSuccess, invoice = null, variant = "modal" }) => {
    const isEdit = !!invoice;

    const [piMode, setPiMode] = useState("requisition");
    const [tradeType, setTradeType] = useState("DOMESTIC");
    const [formData, setFormData] = useState({
        requisition: "",
        pi_date: new Date().toISOString().split('T')[0],
        currency: "USD",
        conversion_rate: "",
        payment_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lc_number: "",
        exporter_beneficiary: "EnergyPac Engineering Ltd",
        consignee: "",
        applicant_importer: "",
        port_of_loading: "Kolkata Port",
        port_of_discharge: "",
        terms_of_delivery: "",
        terms_of_payment: "",
        notes: "",
        exporter_reference: "",
        gst_number: "19AABCE4975G1ZE",
        pre_carriage_by: "",
        country_of_origin: "INDIA",
        final_destination: "BANGLADESH",
        place_of_receipt: "",
    });

    const [requisitions, setRequisitions] = useState([]);
    const [reqSearch, setReqSearch] = useState("");
    const [reqOpen, setReqOpen] = useState(false);
    const [selectedReqNumber, setSelectedReqNumber] = useState("");
    const [items, setItems] = useState([]);
    const [terms, setTerms] = useState(makeDefaultTerms());
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [loadingItems, setLoadingItems] = useState(false);
    const [profitPreview, setProfitPreview] = useState(null);

    const [stockProducts, setStockProducts] = useState([]);
    const [stockSearch, setStockSearch] = useState("");
    const [loadingStock, setLoadingStock] = useState(false);
    const [currencyList, setCurrencyList] = useState([]);

    // Direct PI (phone-rate / ad-hoc) — search any product or add a brand-new one
    const [directProducts, setDirectProducts] = useState([]);
    const [directSearch, setDirectSearch] = useState("");
    const [loadingDirect, setLoadingDirect] = useState(false);
    const [showDirectAdd, setShowDirectAdd] = useState(false);
    const [creatingItem, setCreatingItem] = useState(false);
    const [newItem, setNewItem] = useState({ item_name: "", hsn_code: "", unit: "PCS", rate: "" });

    useEffect(() => {
        if (isOpen) {

            const fetchCurrencyList = async () => {
                try {
                    const res = await getCurrencies({ isActive: true });
                    setCurrencyList(res.data?.results || res.data || []);
                } catch (err) {
                    console.error("Failed to fetch currencies", err);
                }
            };
            fetchCurrencyList();

            if (isEdit && invoice) {
                setPiMode(
                    invoice.source === "STOCK_SALE" ? "stock_sale"
                        : invoice.source === "DIRECT" ? "direct"
                        : "requisition"
                );
                setTradeType(invoice.trade_type || "DOMESTIC");
                setFormData({
                    requisition: invoice.requisition || "",
                    pi_date: invoice.pi_date || "",
                    currency: invoice.currency || "USD",
                    conversion_rate: invoice.conversion_rate || "",
                    payment_due_date: invoice.payment_due_date || "",
                    lc_number: invoice.lc_number || "",
                    exporter_beneficiary: invoice.exporter_beneficiary || "EnergyPac Engineering Ltd",
                    consignee: invoice.consignee || "",
                    applicant_importer: invoice.applicant_importer || "",
                    port_of_loading: invoice.port_of_loading || "Kolkata Port",
                    port_of_discharge: invoice.port_of_discharge || "",
                    terms_of_delivery: invoice.terms_of_delivery || "",
                    terms_of_payment: invoice.terms_of_payment || "",
                    notes: invoice.notes || "",
                    exporter_reference: invoice.exporter_reference || "",
                    gst_number: invoice.gst_number || "19AABCE4975G1ZE",
                    pre_carriage_by: invoice.pre_carriage_by || "",
                    country_of_origin: invoice.country_of_origin || "INDIA",
                    final_destination: invoice.final_destination || "BANGLADESH",
                    place_of_receipt: invoice.place_of_receipt || "",
                });

                const populatedItems = (invoice.items || []).map(item => ({
                    product: item.product || item.product_id || "",
                    product_name: item.product_name || item.item_name || "Product",
                    hsn_code: item.hsn_code || "N/A",
                    quantity: Number(item.quantity) || 1,
                    unit_price: Number(item.unit_price || item.rate) || 0,
                    unit: item.unit || "pcs",
                }));
                setItems(populatedItems);

                const populatedTerms = (invoice.terms_and_conditions || []).map((term, index) => {
                    // New format: stored as objects {key, value, bold}
                    if (term && typeof term === "object") {
                        return {
                            id: index + 1,
                            key: term.key || "",
                            value: term.value || "",
                            bold: !!term.bold,
                        };
                    }
                    // Legacy format: "key: value" string
                    const termStr = String(term);
                    const colonIdx = termStr.indexOf(":");
                    if (colonIdx !== -1) {
                        return {
                            id: index + 1,
                            key: termStr.substring(0, colonIdx).trim(),
                            value: termStr.substring(colonIdx + 1).trim(),
                            bold: false,
                        };
                    }
                    return { id: index + 1, key: "", value: termStr.trim(), bold: false };
                });
                setTerms(populatedTerms.length > 0 ? populatedTerms : makeDefaultTerms());
            } else {
                setPiMode("requisition");
                setTradeType("DOMESTIC");
                setFormData({
                    requisition: "",
                    pi_date: new Date().toISOString().split('T')[0],
                    currency: "USD",
                    conversion_rate: "",
                    payment_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    lc_number: "",
                    exporter_beneficiary: "EnergyPac Engineering Ltd",
                    consignee: "",
                    applicant_importer: "",
                    port_of_loading: "Kolkata Port",
                    port_of_discharge: "",
                    terms_of_delivery: "",
                    terms_of_payment: "",
                    notes: "",
                    exporter_reference: "",
                    gst_number: "19AABCE4975G1ZE",
                    pre_carriage_by: "",
                    country_of_origin: "INDIA",
                    final_destination: "BANGLADESH",
                    place_of_receipt: "",
                });
                setItems([]);
                setTerms(makeDefaultTerms());
                setStockProducts([]);
                setStockSearch("");
                setDirectProducts([]);
                setDirectSearch("");
                setShowDirectAdd(false);
                setNewItem({ item_name: "", hsn_code: "", unit: "PCS", rate: "" });
                setReqSearch("");
                setReqOpen(false);
                setSelectedReqNumber("");
            }
            setError("");
            setProfitPreview(null);
        }
    }, [isOpen, invoice]);

    // Requisition search (server-side, debounced) — only in requisition mode
    useEffect(() => {
        if (!isOpen || isEdit || piMode !== "requisition") return;
        const t = setTimeout(async () => {
            try {
                // when a requisition is already chosen, don't re-search with its number
                const q = formData.requisition ? "" : reqSearch;
                const res = await fetchRequisitions(1, q, "", "");
                setRequisitions(res.data?.results || []);
            } catch (err) {
                console.error("Failed to fetch requisitions", err);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [isOpen, isEdit, piMode, reqSearch, formData.requisition]);

    const handleModeChange = (mode) => {
        if (isEdit) return;
        setPiMode(mode);
        setItems([]);
        setFormData(prev => ({ ...prev, requisition: "" }));
        setProfitPreview(null);
        setError("");
        setShowDirectAdd(false);
        setNewItem({ item_name: "", hsn_code: "", unit: "PCS", rate: "" });
        setReqSearch("");
        setReqOpen(false);
        setSelectedReqNumber("");
    };

    const selectRequisition = async (req) => {
        const reqId = req?.id || "";
        setFormData(prev => ({ ...prev, requisition: reqId }));
        setSelectedReqNumber(req?.requisition_number || "");
        setReqOpen(false);
        setReqSearch(req?.requisition_number || "");

        if (!reqId) {
            setItems([]);
            return;
        }

        setLoadingItems(true);
        try {
            const responseItems = await getRequisitionItemsForPi(reqId);
            const rawList = Array.isArray(responseItems) ? responseItems : (responseItems?.items || responseItems?.results || responseItems?.data || []);

            const mappedItems = rawList.map(item => {
                const remainingQty = item.remaining_qty !== undefined ? Number(item.remaining_qty) : Number(item.quantity) || 1;
                return {
                    product: item.product_id || item.product || "",
                    product_name: item.product_name || item.item_name || "Product",
                    product_code: item.product_code || "",
                    hsn_code: item.hsn_code || "N/A",
                    quantity: Math.min(Number(item.quantity) || 1, remainingQty > 0 ? remainingQty : Number(item.quantity) || 1),
                    unit_price: Number(item.unit_price || item.rate) || 0,
                    unit: item.unit || "pcs",
                    current_stock: Number(item.current_stock) || 0,
                    already_in_pi: Number(item.already_in_pi) || 0,
                    remaining_qty: remainingQty,
                    purchase_status: item.purchase_status || "PENDING",
                    can_add_to_pi: item.can_add_to_pi !== undefined ? item.can_add_to_pi : true,
                    selected: item.can_add_to_pi !== false,
                };
            });
            setItems(mappedItems);

            const unavailable = mappedItems.filter(i => !i.can_add_to_pi);
            if (unavailable.length > 0) {
                const allocated = unavailable.filter(i => i.purchase_status === 'FULLY_ALLOCATED').length;
                const notPurchased = unavailable.length - allocated;
                const parts = [];
                if (notPurchased > 0) parts.push(`${notPurchased} not purchased`);
                if (allocated > 0) parts.push(`${allocated} already in PI`);
                toast(`${parts.join(', ')} — disabled`, { icon: '⚠️' });
            } else {
                toast.success("Loaded items from requisition");
            }
        } catch (err) {
            console.error("Failed to load requisition items", err);
            toast.error("Failed to load requisition items");
        } finally {
            setLoadingItems(false);
        }
    };

    const loadStockProducts = async () => {
        setLoadingStock(true);
        try {
            const response = await getStockItemsForPi();
            setStockProducts(response?.items || []);
        } catch (err) {
            console.error("Failed to load stock items", err);
            toast.error("Failed to load stock items");
        } finally {
            setLoadingStock(false);
        }
    };

    useEffect(() => {
        if (isOpen && piMode === "stock_sale" && stockProducts.length === 0) {
            loadStockProducts();
        }
    }, [isOpen, piMode]);

    // Direct PI — debounced product master search (any item, not just in-stock)
    useEffect(() => {
        if (!isOpen || piMode !== "direct") return;
        const timer = setTimeout(async () => {
            setLoadingDirect(true);
            try {
                const res = await getProducts({ search: directSearch });
                const list = res.data?.results || res.data || [];
                setDirectProducts(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error("Failed to load products", err);
            } finally {
                setLoadingDirect(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [isOpen, piMode, directSearch]);

    const filteredDirect = directProducts.filter(p => !items.some(i => i.product === p.id));

    const handleAddDirectItem = (product) => {
        setItems(prev => [...prev, {
            product: product.id,
            product_name: product.item_name,
            product_code: product.item_code,
            hsn_code: product.hsn_code || "",
            quantity: 1,
            unit_price: Number(product.rate) || 0,
            unit: product.unit || "PCS",
            can_add_to_pi: true,
            selected: true,
        }]);
        toast.success(`${product.item_name} added`);
    };

    const handleCreateAndAddItem = async () => {
        if (!newItem.item_name.trim()) { toast.error("Item name is required"); return; }
        if (newItem.rate === "" || Number(newItem.rate) < 0) { toast.error("Enter a valid rate"); return; }
        setCreatingItem(true);
        try {
            const res = await createProduct({
                item_name: newItem.item_name.trim(),
                hsn_code: newItem.hsn_code.trim(),
                unit: newItem.unit || "PCS",
                rate: Number(newItem.rate) || 0,
            });
            const product = res.data;
            handleAddDirectItem(product);
            setNewItem({ item_name: "", hsn_code: "", unit: "PCS", rate: "" });
            // keep the add panel open so multiple items can be added in a row
        } catch (err) {
            console.error("Failed to create item", err);
            toast.error(err.response?.data?.item_name?.[0] || "Failed to create item");
        } finally {
            setCreatingItem(false);
        }
    };

    const filteredStock = stockProducts.filter(p =>
        !items.some(i => i.product === p.product_id) &&
        (p.product_name.toLowerCase().includes(stockSearch.toLowerCase()) ||
         p.product_code.toLowerCase().includes(stockSearch.toLowerCase()))
    );

    const handleAddStockItem = (product) => {
        setItems(prev => [...prev, {
            product: product.product_id,
            product_name: product.product_name,
            product_code: product.product_code,
            hsn_code: "",
            quantity: 1,
            unit_price: Number(product.rate) || 0,
            unit: product.unit,
            current_stock: product.current_stock,
            can_add_to_pi: true,
            selected: true,
        }]);
        toast.success(`${product.product_name} added`);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "currency") {
            setFormData(prev => ({
                ...prev,
                currency: value,
                conversion_rate: value === "INR" ? 1 : prev.conversion_rate === 1 ? "" : prev.conversion_rate,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === "conversion_rate" ? value : value
            }));
        }
    };

    const handleItemChange = (index, field, value) => {
        setItems(prevItems => {
            const updated = [...prevItems];
            updated[index] = {
                ...updated[index],
                [field]: (field === "quantity" || field === "unit_price") ? value : value
            };
            return updated;
        });
    };

    const handleAddTerm = () => {
        setTerms([...terms, { id: Date.now(), key: "", value: "", bold: false }]);
    };

    const handleRemoveTerm = (id) => {
        setTerms(terms.filter(t => t.id !== id));
    };

    const handleTermChange = (id, field, value) => {
        setTerms(terms.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleToggleItem = (index) => {
        setItems(prev => {
            const updated = [...prev];
            if (!updated[index].can_add_to_pi) return updated;
            updated[index] = { ...updated[index], selected: !updated[index].selected };
            return updated;
        });
    };

    useEffect(() => {
        if (!formData.requisition || items.length === 0 || isEdit || piMode === "stock_sale") { setProfitPreview(null); return; }
        const selectedItems = items.filter(i => i.selected && i.can_add_to_pi);
        if (selectedItems.length === 0) { setProfitPreview(null); return; }
        const totalSellingInr = selectedItems.reduce((s, it) => s + (Number(it.quantity) * Number(it.unit_price)), 0) * (formData.currency !== 'INR' ? Number(formData.conversion_rate || 1) : 1);
        const timer = setTimeout(async () => {
            try {
                const res = await previewProfit({ requisition: formData.requisition, selling_price_inr: totalSellingInr, currency: formData.currency, conversion_rate: Number(formData.conversion_rate || 1) });
                setProfitPreview(res);
            } catch { setProfitPreview(null); }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.requisition, formData.currency, formData.conversion_rate, items, piMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const selectedItems = piMode === "requisition"
                ? items.filter(i => i.selected && i.can_add_to_pi)
                : items;

            if (selectedItems.length === 0) throw new Error("At least one item is required");
            if (piMode === "requisition" && !formData.requisition) throw new Error("Please select a Requisition");

            const payload = {
                ...formData,
                conversion_rate: formData.currency === "INR" ? 1 : Number(formData.conversion_rate) || 1,
                requisition: piMode === "requisition" ? formData.requisition : null,
                source: piMode === "stock_sale" ? "STOCK_SALE" : piMode === "direct" ? "DIRECT" : undefined,
                trade_type: tradeType,
                items: selectedItems.map(it => ({
                    product: it.product,
                    hsn_code: it.hsn_code,
                    quantity: Number(it.quantity),
                    unit_price: Number(it.unit_price)
                })),
                terms_and_conditions: terms
                    .filter(t => (t.value || "").trim() !== "" || (t.key || "").trim() !== "")
                    .map(t => ({
                        key: (t.key || "").trim(),
                        value: (t.value || "").trim(),
                        bold: !!t.bold,
                    }))
            };

            if (isEdit) {
                await updateProformaInvoice(invoice.id, payload);
                toast.success("Proforma Invoice updated successfully!");
                onSuccess("Proforma Invoice updated successfully!");
            } else {
                await createProformaInvoice(payload);
                toast.success("Proforma Invoice created successfully!");
                onSuccess("Proforma Invoice created successfully!");
            }
            onClose();
        } catch (err) {
            console.error(err);
            let errorMsg = "";
            if (err.response?.data) {
                const data = err.response.data;
                if (typeof data === "string") {
                    errorMsg = data;
                } else if (typeof data === "object") {
                    const messages = [];
                    for (const [, val] of Object.entries(data)) {
                        let cleanVal = "";
                        if (Array.isArray(val)) cleanVal = val.join(", ");
                        else if (typeof val === "string") cleanVal = val;
                        else cleanVal = JSON.stringify(val);
                        messages.push(cleanVal);
                    }
                    if (messages.length > 0) errorMsg = messages.join(" | ");
                }
            }
            if (!errorMsg) {
                errorMsg = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to save Proforma Invoice";
            }
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'COMPLETED': return <Chip label="PURCHASED" size="small" sx={{ fontSize: 9, fontWeight: 700, bgcolor: '#d1fae5', color: '#047857', height: 20 }} />;
            case 'PO_CREATED': return <Chip label="PO CREATED" size="small" sx={{ fontSize: 9, fontWeight: 700, bgcolor: '#fef3c7', color: '#b45309', height: 20 }} />;
            case 'PENDING': return <Chip label="NO PO" size="small" sx={{ fontSize: 9, fontWeight: 700, bgcolor: '#fee2e2', color: '#b91c1c', height: 20 }} />;
            case 'FULLY_ALLOCATED': return <Chip label="ALREADY IN PI" size="small" sx={{ fontSize: 9, fontWeight: 700, bgcolor: '#f3e8ff', color: '#7c3aed', height: 20 }} />;
            default: return null;
        }
    };

    const labelSx = { fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 };
    const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& .MuiInputBase-input': { fontWeight: 600, fontSize: 13 } };

    const headerTitle = isEdit ? "Edit Proforma Invoice" : "Create Proforma Invoice";
    const headerSubtitle = piMode === "stock_sale" ? "Sell items directly from stock (no requisition)"
        : piMode === "direct" ? "Direct PI — phone-rate / ad-hoc sale, any item (no requisition, no stock check)"
        : "Issue proforma invoice against a requisition";

    const formBody = (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                    {error && (
                        <Alert severity="error" icon={<WarningAmberIcon fontSize="small" />} sx={{ borderRadius: 2, fontWeight: 600, fontSize: 13 }}>
                            {error}
                        </Alert>
                    )}

                    <form id="proforma-form" onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                            {/* TRADE TYPE: Domestic / International */}
                            <Box>
                                <Typography sx={labelSx}>Trade Type *</Typography>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Button
                                        type="button"
                                        variant={tradeType === "DOMESTIC" ? "contained" : "outlined"}
                                        onClick={() => !isEdit && setTradeType("DOMESTIC")}
                                        disabled={isEdit}
                                        sx={{
                                            borderRadius: 2, fontWeight: 700, fontSize: 13, textTransform: 'none', borderWidth: 2,
                                            bgcolor: tradeType === "DOMESTIC" ? '#EFF6FF' : 'white',
                                            color: tradeType === "DOMESTIC" ? PRIMARY : 'text.disabled',
                                            borderColor: tradeType === "DOMESTIC" ? PRIMARY : 'divider',
                                            '&:hover': { borderWidth: 2 },
                                        }}
                                    >
                                        Domestic (GST + PI Bill)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={tradeType === "INTERNATIONAL" ? "contained" : "outlined"}
                                        onClick={() => !isEdit && setTradeType("INTERNATIONAL")}
                                        disabled={isEdit}
                                        sx={{
                                            borderRadius: 2, fontWeight: 700, fontSize: 13, textTransform: 'none', borderWidth: 2,
                                            bgcolor: tradeType === "INTERNATIONAL" ? '#ECFEFF' : 'white',
                                            color: tradeType === "INTERNATIONAL" ? '#0E7490' : 'text.disabled',
                                            borderColor: tradeType === "INTERNATIONAL" ? '#06B6D4' : 'divider',
                                            '&:hover': { borderWidth: 2 },
                                        }}
                                    >
                                        International (Export — no GST)
                                    </Button>
                                </Box>
                                {tradeType === "INTERNATIONAL" && (
                                    <Typography sx={{ fontSize: 11, color: '#0E7490', mt: 0.75, fontWeight: 600 }}>
                                        Export PI — no GST. After creating, generate a Commercial Invoice &amp; Packing List from the PI list.
                                    </Typography>
                                )}
                            </Box>

                            {/* PI MODE TOGGLE */}
                            {!isEdit && (
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Button
                                        variant={piMode === "requisition" ? "contained" : "outlined"}
                                        startIcon={<DescriptionIcon />}
                                        onClick={() => handleModeChange("requisition")}
                                        sx={{
                                            borderRadius: 2,
                                            fontWeight: 700,
                                            fontSize: 13,
                                            textTransform: 'none',
                                            bgcolor: piMode === "requisition" ? '#EFF6FF' : 'white',
                                            color: piMode === "requisition" ? PRIMARY : 'text.disabled',
                                            borderColor: piMode === "requisition" ? PRIMARY : 'divider',
                                            borderWidth: 2,
                                            '&:hover': { borderWidth: 2, bgcolor: piMode === "requisition" ? '#DBEAFE' : '#F8FAFC' },
                                            boxShadow: piMode === "requisition" ? 1 : 0,
                                        }}
                                    >
                                        Requisition PI
                                    </Button>
                                    <Button
                                        variant={piMode === "stock_sale" ? "contained" : "outlined"}
                                        startIcon={<Inventory2Icon />}
                                        onClick={() => handleModeChange("stock_sale")}
                                        sx={{
                                            borderRadius: 2,
                                            fontWeight: 700,
                                            fontSize: 13,
                                            textTransform: 'none',
                                            bgcolor: piMode === "stock_sale" ? '#FFFBEB' : 'white',
                                            color: piMode === "stock_sale" ? '#B45309' : 'text.disabled',
                                            borderColor: piMode === "stock_sale" ? '#F59E0B' : 'divider',
                                            borderWidth: 2,
                                            '&:hover': { borderWidth: 2, bgcolor: piMode === "stock_sale" ? '#FEF3C7' : '#F8FAFC' },
                                            boxShadow: piMode === "stock_sale" ? 1 : 0,
                                        }}
                                    >
                                        Stock Sale
                                    </Button>
                                    <Button
                                        variant={piMode === "direct" ? "contained" : "outlined"}
                                        startIcon={<BoltIcon />}
                                        onClick={() => handleModeChange("direct")}
                                        sx={{
                                            borderRadius: 2,
                                            fontWeight: 700,
                                            fontSize: 13,
                                            textTransform: 'none',
                                            bgcolor: piMode === "direct" ? '#F5F3FF' : 'white',
                                            color: piMode === "direct" ? '#6D28D9' : 'text.disabled',
                                            borderColor: piMode === "direct" ? '#8B5CF6' : 'divider',
                                            borderWidth: 2,
                                            '&:hover': { borderWidth: 2, bgcolor: piMode === "direct" ? '#EDE9FE' : '#F8FAFC' },
                                            boxShadow: piMode === "direct" ? 1 : 0,
                                        }}
                                    >
                                        Direct PI
                                    </Button>
                                </Box>
                            )}

                            {/* REQUISITION & CORE FIELDS */}
                            <Grid container spacing={2}>
                                {piMode === "requisition" ? (
                                    <Grid item xs={12} md={4}>
                                        <Typography sx={labelSx}>Requisition Reference *</Typography>
                                        {isEdit ? (
                                            <TextField
                                                value={invoice?.requisition_number || "Active Requisition"}
                                                fullWidth size="small" disabled
                                                sx={inputSx}
                                            />
                                        ) : (
                                            <Box sx={{ position: 'relative' }}>
                                                <TextField
                                                    value={reqSearch}
                                                    onChange={(e) => {
                                                        setReqSearch(e.target.value);
                                                        setReqOpen(true);
                                                        if (formData.requisition) {
                                                            setFormData(prev => ({ ...prev, requisition: "" }));
                                                            setSelectedReqNumber("");
                                                            setItems([]);
                                                        }
                                                    }}
                                                    onFocus={() => setReqOpen(true)}
                                                    onBlur={() => setTimeout(() => setReqOpen(false), 150)}
                                                    placeholder="Search requisition number..."
                                                    fullWidth size="small"
                                                    InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: 'text.disabled', mr: 0.5 }} /> }}
                                                    sx={inputSx}
                                                />
                                                {reqOpen && (
                                                    <Box sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, mt: 0.5, bgcolor: 'white', border: '1px solid', borderColor: 'divider', borderRadius: 2, boxShadow: 3, maxHeight: 220, overflowY: 'auto' }}>
                                                        {requisitions.length === 0 ? (
                                                            <Typography sx={{ fontSize: 12, color: 'text.disabled', textAlign: 'center', py: 2, fontStyle: 'italic' }}>
                                                                {reqSearch ? "No matching requisition" : "Type to search requisitions"}
                                                            </Typography>
                                                        ) : requisitions.map(req => (
                                                            <Box
                                                                key={req.id}
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={() => selectRequisition(req)}
                                                                sx={{ px: 1.5, py: 1, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'monospace', borderBottom: '1px solid', borderColor: 'divider', bgcolor: formData.requisition === req.id ? '#EFF6FF' : 'white', '&:hover': { bgcolor: '#F1F5F9' } }}
                                                            >
                                                                {req.requisition_number}
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                )}
                                                {formData.requisition && selectedReqNumber && (
                                                    <Typography sx={{ fontSize: 10, color: 'success.main', mt: 0.5, fontWeight: 700 }}>
                                                        ✓ {selectedReqNumber} selected
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    </Grid>
                                ) : (
                                    <Grid item xs={12} md={4}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                                            {piMode === "direct" ? (
                                                <Box sx={{ px: 2, py: 1.5, bgcolor: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 2, fontSize: 13, fontWeight: 700, color: '#6D28D9', width: '100%', textAlign: 'center' }}>
                                                    Direct PI — No Requisition
                                                </Box>
                                            ) : (
                                                <Box sx={{ px: 2, py: 1.5, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 2, fontSize: 13, fontWeight: 700, color: '#B45309', width: '100%', textAlign: 'center' }}>
                                                    Stock Sale — No Requisition
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>
                                )}

                                <Grid item xs={12} md={4}>
                                    <Typography sx={labelSx}>PI Date *</Typography>
                                    <TextField type="date" name="pi_date" value={formData.pi_date} onChange={handleInputChange} fullWidth size="small" required sx={inputSx} />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Typography sx={labelSx}>Payment Due Date *</Typography>
                                    <TextField type="date" name="payment_due_date" value={formData.payment_due_date} onChange={handleInputChange} fullWidth size="small" required sx={inputSx} />
                                </Grid>
                            </Grid>

                            {/* FINANCIAL & EXPORTER REFERENCE DETAILS */}
                            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md>
                                        <Typography sx={labelSx}>Currency *</Typography>
                                        <FormControl fullWidth size="small">
                                            <Select name="currency" value={formData.currency} onChange={handleInputChange} required sx={{ borderRadius: 2, fontWeight: 700, fontSize: 13 }}>
                                                {currencyList.length > 0 ? currencyList.map(c => (
                                                    <MenuItem key={c.id} value={c.code}>{c.code} ({c.symbol || c.name})</MenuItem>
                                                )) : (
                                                    [
                                                        <MenuItem key="USD" value="USD">USD ($)</MenuItem>,
                                                        <MenuItem key="INR" value="INR">INR (&#8377;)</MenuItem>,
                                                        <MenuItem key="EUR" value="EUR">EUR (&euro;)</MenuItem>,
                                                        <MenuItem key="GBP" value="GBP">GBP (&pound;)</MenuItem>,
                                                    ]
                                                )}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    {formData.currency !== "INR" && (
                                        <Grid item xs={12} md>
                                            <Typography sx={labelSx}>Conversion Rate (1 {formData.currency} = &#8377;?) *</Typography>
                                            <TextField type="number" inputProps={{ step: "0.0001" }} name="conversion_rate" value={formData.conversion_rate} onChange={handleInputChange} fullWidth size="small" required sx={{ ...inputSx, '& .MuiInputBase-input': { fontWeight: 700, fontSize: 13 } }} />
                                        </Grid>
                                    )}
                                    <Grid item xs={12} md>
                                        <Typography sx={labelSx}>L/C Number</Typography>
                                        <TextField name="lc_number" value={formData.lc_number} onChange={handleInputChange} placeholder="e.g. LC-2026-001" fullWidth size="small" sx={{ ...inputSx, '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }} />
                                    </Grid>
                                    <Grid item xs={12} md>
                                        <Typography sx={labelSx}>Exporter Ref</Typography>
                                        <TextField name="exporter_reference" value={formData.exporter_reference} onChange={handleInputChange} placeholder="e.g. REF-010" fullWidth size="small" sx={{ ...inputSx, '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }} />
                                    </Grid>
                                    <Grid item xs={12} md>
                                        <Typography sx={labelSx}>GST Number</Typography>
                                        <TextField name="gst_number" value={formData.gst_number} onChange={handleInputChange} placeholder="e.g. 19AABCE..." fullWidth size="small" sx={{ ...inputSx, '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }} />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* PARTIES INFORMATION */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <Typography sx={labelSx}>Exporter Beneficiary *</Typography>
                                    <TextField name="exporter_beneficiary" value={formData.exporter_beneficiary} onChange={handleInputChange} fullWidth size="small" required sx={inputSx} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography sx={labelSx}>Consignee *</Typography>
                                    <TextField name="consignee" value={formData.consignee} onChange={handleInputChange} placeholder="e.g. ABC Corp, Dubai" fullWidth size="small" required sx={inputSx} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography sx={labelSx}>Applicant Importer *</Typography>
                                    <TextField name="applicant_importer" value={formData.applicant_importer} onChange={handleInputChange} placeholder="e.g. ABC Trading LLC, UAE" fullWidth size="small" required sx={inputSx} />
                                </Grid>
                            </Grid>

                            {/* SHIPPING & LOGISTICS */}
                            <Box sx={{ p: 2, bgcolor: 'rgba(33,150,243,0.03)', borderRadius: 3, border: '1px solid', borderColor: 'rgba(33,150,243,0.15)' }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: PRIMARY, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
                                    Shipping & Logistics
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={3}>
                                        <Typography sx={labelSx}>Port of Loading</Typography>
                                        <TextField name="port_of_loading" value={formData.port_of_loading} onChange={handleInputChange} fullWidth size="small" sx={{ ...inputSx, '& .MuiInputBase-input': { fontSize: 12, fontWeight: 600 } }} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography sx={labelSx}>Port of Discharge</Typography>
                                        <TextField name="port_of_discharge" value={formData.port_of_discharge} onChange={handleInputChange} placeholder="e.g. Benapole Land Port" fullWidth size="small" sx={{ ...inputSx, '& .MuiInputBase-input': { fontSize: 12, fontWeight: 600 } }} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography sx={labelSx}>Pre-carriage By</Typography>
                                        <TextField name="pre_carriage_by" value={formData.pre_carriage_by} onChange={handleInputChange} placeholder="e.g. BY ROAD" fullWidth size="small" sx={{ ...inputSx, '& .MuiInputBase-input': { fontSize: 12, fontWeight: 600 } }} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography sx={labelSx}>Place of Receipt</Typography>
                                        <TextField name="place_of_receipt" value={formData.place_of_receipt} onChange={handleInputChange} placeholder="e.g. PETRAPOLE LCS" fullWidth size="small" sx={{ ...inputSx, '& .MuiInputBase-input': { fontSize: 12, fontWeight: 600 } }} />
                                    </Grid>
                                </Grid>
                                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                    <Grid item xs={12} md={3}>
                                        <Typography sx={labelSx}>Country of Origin</Typography>
                                        <TextField name="country_of_origin" value={formData.country_of_origin} onChange={handleInputChange} fullWidth size="small" sx={{ ...inputSx, '& .MuiInputBase-input': { fontSize: 12, fontWeight: 600 } }} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography sx={labelSx}>Final Destination</Typography>
                                        <TextField name="final_destination" value={formData.final_destination} onChange={handleInputChange} fullWidth size="small" sx={{ ...inputSx, '& .MuiInputBase-input': { fontSize: 12, fontWeight: 600 } }} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography sx={labelSx}>Terms of Delivery</Typography>
                                        <TextField name="terms_of_delivery" value={formData.terms_of_delivery} onChange={handleInputChange} placeholder="e.g. FOB Kolkata" fullWidth size="small" sx={{ ...inputSx, '& .MuiInputBase-input': { fontSize: 12, fontWeight: 600 } }} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography sx={labelSx}>Terms of Payment</Typography>
                                        <TextField name="terms_of_payment" value={formData.terms_of_payment} onChange={handleInputChange} placeholder="e.g. Irrevocable L/C at sight" fullWidth size="small" sx={{ ...inputSx, '& .MuiInputBase-input': { fontSize: 12, fontWeight: 600 } }} />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* STOCK SALE: Product Search & Add */}
                            {piMode === "stock_sale" && !isEdit && (
                                <Box sx={{ p: 2, bgcolor: 'rgba(245,158,11,0.05)', borderRadius: 3, border: '1px solid', borderColor: 'rgba(245,158,11,0.2)' }}>
                                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Inventory2Icon sx={{ fontSize: 14 }} /> Add Products from Stock
                                    </Typography>
                                    <TextField
                                        value={stockSearch}
                                        onChange={(e) => setStockSearch(e.target.value)}
                                        placeholder="Search products by name or code..."
                                        fullWidth
                                        size="small"
                                        InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: 'text.disabled', mr: 1 }} /> }}
                                        sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                    {loadingStock ? (
                                        <Typography sx={{ fontSize: 12, color: 'text.disabled', textAlign: 'center', py: 3 }}>Loading stock items...</Typography>
                                    ) : (
                                        <Box sx={{ maxHeight: 192, overflowY: 'auto' }}>
                                            {filteredStock.length === 0 ? (
                                                <Typography sx={{ fontSize: 12, color: 'text.disabled', textAlign: 'center', py: 3, fontStyle: 'italic' }}>
                                                    {stockSearch ? "No matching products found" : "No products with stock available"}
                                                </Typography>
                                            ) : filteredStock.map(p => (
                                                <Box key={p.product_id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 0.5, '&:hover': { borderColor: '#FDE68A', bgcolor: 'rgba(245,158,11,0.04)' }, transition: 'all 0.15s' }}>
                                                    <Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{p.product_name}</Typography>
                                                            <Typography sx={{ fontSize: 10, color: 'text.disabled', fontFamily: 'monospace' }}>{p.product_code}</Typography>
                                                            <Typography sx={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>Stock: {p.current_stock} {p.unit}</Typography>
                                                        </Box>
                                                        {p.purchase_history && p.purchase_history.length > 0 && (
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                                {p.purchase_history.map((ph, idx) => (
                                                                    <Typography key={idx} sx={{ fontSize: 9, color: 'text.secondary', bgcolor: '#F1F5F9', px: 1, py: 0.25, borderRadius: 0.5, fontFamily: 'monospace' }}>
                                                                        {ph.requisition_number} → {ph.po_number} ({ph.qty} @ &#8377;{ph.rate})
                                                                    </Typography>
                                                                ))}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    <Button
                                                        size="small"
                                                        startIcon={<AddIcon sx={{ fontSize: 12 }} />}
                                                        onClick={() => handleAddStockItem(p)}
                                                        sx={{ fontSize: 11, fontWeight: 700, color: '#B45309', bgcolor: '#FEF3C7', borderRadius: 1.5, textTransform: 'none', minWidth: 0, px: 1.5, '&:hover': { bgcolor: '#FDE68A' }, flexShrink: 0 }}
                                                    >
                                                        Add
                                                    </Button>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {/* DIRECT PI: add existing or brand-new items via "Add Item" (no list shown upfront) */}
                            {piMode === "direct" && !isEdit && (
                                <Box sx={{ p: 2, bgcolor: 'rgba(139,92,246,0.05)', borderRadius: 3, border: '1px solid', borderColor: 'rgba(139,92,246,0.2)' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <BoltIcon sx={{ fontSize: 14 }} /> Direct Items — add existing or new (rate as per your deal)
                                        </Typography>
                                        <Button
                                            type="button"
                                            size="small"
                                            startIcon={<AddIcon sx={{ fontSize: 12 }} />}
                                            onClick={() => setShowDirectAdd(v => !v)}
                                            sx={{ fontSize: 11, fontWeight: 700, color: '#6D28D9', bgcolor: '#EDE9FE', borderRadius: 1.5, textTransform: 'none', border: '1px solid #DDD6FE', '&:hover': { bgcolor: '#DDD6FE' } }}
                                        >
                                            {showDirectAdd ? "Close" : "Add Item"}
                                        </Button>
                                    </Box>

                                    {showDirectAdd && (
                                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {/* Existing item picker — results only appear once you start typing */}
                                            <Box>
                                                <Typography sx={labelSx}>Add an existing item</Typography>
                                                <TextField
                                                    value={directSearch}
                                                    onChange={(e) => setDirectSearch(e.target.value)}
                                                    placeholder="Search by name or code..."
                                                    fullWidth
                                                    size="small"
                                                    InputProps={{
                                                        startAdornment: <SearchIcon sx={{ fontSize: 16, color: 'text.disabled', mr: 1 }} />,
                                                        endAdornment: loadingDirect ? <CircularProgress size={14} /> : null,
                                                    }}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                {directSearch.trim() !== "" && (
                                                    <Box sx={{ maxHeight: 180, overflowY: 'auto', mt: 1 }}>
                                                        {filteredDirect.length === 0 ? (
                                                            <Typography sx={{ fontSize: 12, color: 'text.disabled', textAlign: 'center', py: 2, fontStyle: 'italic' }}>
                                                                {loadingDirect ? "Searching..." : "No match — add it as a new item below"}
                                                            </Typography>
                                                        ) : filteredDirect.map(p => (
                                                            <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 0.5, '&:hover': { borderColor: '#DDD6FE', bgcolor: 'rgba(139,92,246,0.04)' }, transition: 'all 0.15s' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{p.item_name}</Typography>
                                                                    <Typography sx={{ fontSize: 10, color: 'text.disabled', fontFamily: 'monospace' }}>{p.item_code}</Typography>
                                                                </Box>
                                                                <Button
                                                                    type="button"
                                                                    size="small"
                                                                    startIcon={<AddIcon sx={{ fontSize: 12 }} />}
                                                                    onClick={() => { handleAddDirectItem(p); setDirectSearch(""); }}
                                                                    sx={{ fontSize: 11, fontWeight: 700, color: '#6D28D9', bgcolor: '#EDE9FE', borderRadius: 1.5, textTransform: 'none', minWidth: 0, px: 1.5, '&:hover': { bgcolor: '#DDD6FE' }, flexShrink: 0 }}
                                                                >
                                                                    Add
                                                                </Button>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>

                                            <Divider sx={{ '&::before, &::after': { borderColor: '#DDD6FE' } }}>
                                                <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or add a new item</Typography>
                                            </Divider>

                                            {/* New item inline form */}
                                            <Grid container spacing={1.5} alignItems="flex-end">
                                                <Grid item xs={12} md={4}>
                                                    <Typography sx={labelSx}>Item Name *</Typography>
                                                    <TextField value={newItem.item_name} onChange={(e) => setNewItem(p => ({ ...p, item_name: e.target.value }))} placeholder="e.g. Copper Lug 50mm" fullWidth size="small" sx={inputSx} />
                                                </Grid>
                                                <Grid item xs={6} md={2}>
                                                    <Typography sx={labelSx}>HSN</Typography>
                                                    <TextField value={newItem.hsn_code} onChange={(e) => setNewItem(p => ({ ...p, hsn_code: e.target.value }))} placeholder="7408" fullWidth size="small" sx={inputSx} />
                                                </Grid>
                                                <Grid item xs={6} md={2}>
                                                    <Typography sx={labelSx}>Unit</Typography>
                                                    <TextField value={newItem.unit} onChange={(e) => setNewItem(p => ({ ...p, unit: e.target.value }))} placeholder="PCS" fullWidth size="small" sx={inputSx} />
                                                </Grid>
                                                <Grid item xs={6} md={2}>
                                                    <Typography sx={labelSx}>Rate</Typography>
                                                    <TextField type="number" inputProps={{ step: "0.01", min: 0 }} value={newItem.rate} onChange={(e) => setNewItem(p => ({ ...p, rate: e.target.value }))} placeholder="0.00" fullWidth size="small" sx={inputSx} />
                                                </Grid>
                                                <Grid item xs={6} md={2}>
                                                    <Button
                                                        type="button"
                                                        fullWidth
                                                        onClick={handleCreateAndAddItem}
                                                        disabled={creatingItem}
                                                        startIcon={creatingItem ? <CircularProgress size={12} color="inherit" /> : <CheckIcon sx={{ fontSize: 14 }} />}
                                                        sx={{ fontSize: 11, fontWeight: 700, color: 'white', bgcolor: '#7C3AED', borderRadius: 1.5, textTransform: 'none', '&:hover': { bgcolor: '#6D28D9' } }}
                                                    >
                                                        {creatingItem ? "Adding..." : "Create & Add"}
                                                    </Button>
                                                </Grid>
                                            </Grid>

                                            <Typography sx={{ fontSize: 10, color: 'text.disabled', fontStyle: 'italic' }}>
                                                Tip: add as many items as you need — each pick/creation appends a row below.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {/* ITEMS BREAKDOWN TABLE */}
                            <Box>
                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, ml: 0.5 }}>
                                    Items Breakdown
                                    {piMode === "requisition" && items.length > 0 && (
                                        <Typography component="span" sx={{ fontSize: 10, color: 'text.disabled', fontWeight: 400, textTransform: 'none', ml: 1 }}>
                                            ({items.filter(i => i.selected && i.can_add_to_pi).length} of {items.length} selected)
                                        </Typography>
                                    )}
                                </Typography>
                                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden', boxShadow: 1, bgcolor: 'white' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                                                {piMode === "requisition" && <TableCell sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'text.secondary', width: 40, textAlign: 'center' }} />}
                                                <TableCell sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'text.secondary', width: 48, textAlign: 'center' }}>#</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'text.secondary' }}>Product Name / Details</TableCell>
                                                {piMode === "requisition" && <TableCell sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'text.secondary', width: 96, textAlign: 'center' }}>Status</TableCell>}
                                                <TableCell sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'text.secondary', width: 176 }}>HSN Code</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'text.secondary', width: 112, textAlign: 'right' }}>Quantity</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'text.secondary', width: 144, textAlign: 'right' }}>Unit Price ({formData.currency})</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'text.secondary', width: 144, textAlign: 'right' }}>Total Amount</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'text.secondary', width: 48 }} />
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loadingItems ? (
                                                <TableRow>
                                                    <TableCell colSpan={piMode === "requisition" ? 9 : 7} sx={{ textAlign: 'center', py: 4, color: 'text.disabled', fontStyle: 'italic' }}>
                                                        <CircularProgress size={20} sx={{ mr: 1 }} /> Loading items for chosen requisition...
                                                    </TableCell>
                                                </TableRow>
                                            ) : items.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={piMode === "requisition" ? 9 : 7} sx={{ textAlign: 'center', py: 4, color: 'text.disabled', fontStyle: 'italic', fontSize: 12 }}>
                                                        {piMode === "stock_sale"
                                                            ? "No items added. Use the search above to add products from stock."
                                                            : piMode === "direct"
                                                            ? "No items added. Search an existing item or use 'New Item' above."
                                                            : "No items loaded. Please select a Requisition to auto-populate."}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                items.map((item, index) => {
                                                    const disabled = piMode === "requisition" && !item.can_add_to_pi;
                                                    const excluded = piMode === "requisition" && !item.selected;
                                                    return (
                                                        <TableRow key={index} sx={{ bgcolor: disabled ? 'rgba(239,68,68,0.04)' : excluded ? '#F8FAFC' : 'white', opacity: disabled || excluded ? 0.55 : 1, '&:hover': { bgcolor: disabled ? undefined : '#F8FAFC' }, transition: 'background 0.15s' }}>
                                                            {piMode === "requisition" && (
                                                                <TableCell sx={{ textAlign: 'center', py: 1.5 }}>
                                                                    <Checkbox
                                                                        size="small"
                                                                        checked={item.selected && item.can_add_to_pi}
                                                                        disabled={!item.can_add_to_pi}
                                                                        onChange={() => handleToggleItem(index)}
                                                                        sx={{ p: 0, color: PRIMARY }}
                                                                    />
                                                                </TableCell>
                                                            )}
                                                            <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: 'text.disabled', fontSize: 12, py: 1.5 }}>
                                                                {index + 1}
                                                            </TableCell>
                                                            <TableCell sx={{ py: 1.5 }}>
                                                                <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'text.primary' }}>{item.product_name}</Typography>
                                                                <Typography sx={{ fontSize: 10, color: 'text.disabled', fontFamily: 'monospace', mt: 0.25 }}>
                                                                    {item.product_code || item.product}
                                                                    {item.current_stock !== undefined && (
                                                                        <Typography component="span" sx={{ ml: 1, color: '#059669', fontSize: 10 }}>Stock: {item.current_stock}</Typography>
                                                                    )}
                                                                </Typography>
                                                                {disabled && (
                                                                    <Typography sx={{ fontSize: 10, color: 'error.main', fontWeight: 700, mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <WarningAmberIcon sx={{ fontSize: 10 }} />
                                                                        {item.purchase_status === 'PENDING' ? 'PO not generated' :
                                                                         item.purchase_status === 'FULLY_ALLOCATED' ? `Already allocated in other PI (${item.already_in_pi || 0} qty)` :
                                                                         'Not yet received/purchased'}
                                                                    </Typography>
                                                                )}
                                                                {!disabled && item.remaining_qty !== undefined && item.remaining_qty < item.quantity && (
                                                                    <Typography sx={{ fontSize: 10, color: '#D97706', fontWeight: 700, mt: 0.25 }}>
                                                                        Max available: {item.remaining_qty} (already {item.already_in_pi} in other PI)
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                            {piMode === "requisition" && (
                                                                <TableCell sx={{ textAlign: 'center', py: 1.5 }}>
                                                                    {getStatusChip(item.purchase_status)}
                                                                </TableCell>
                                                            )}
                                                            <TableCell sx={{ py: 1.5 }}>
                                                                <TextField
                                                                    value={item.hsn_code}
                                                                    onChange={(e) => handleItemChange(index, "hsn_code", e.target.value)}
                                                                    size="small"
                                                                    placeholder="e.g. 32145 Ind 65421 BD"
                                                                    title={item.hsn_code || "HSN Code"}
                                                                    disabled={disabled}
                                                                    sx={{ width: 160, '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, '& .MuiInputBase-input': { fontSize: 11, fontFamily: 'monospace', fontWeight: 600, py: 0.75, px: 1 } }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ textAlign: 'right', py: 1.5 }}>
                                                                <TextField
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                                    size="small"
                                                                    inputProps={{ min: 1, style: { textAlign: 'right' } }}
                                                                    disabled={disabled}
                                                                    sx={{ width: 96, '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, '& .MuiInputBase-input': { fontSize: 11, fontWeight: 600, py: 0.75, px: 1 } }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ textAlign: 'right', py: 1.5 }}>
                                                                <TextField
                                                                    type="number"
                                                                    inputProps={{ step: "0.01", min: 0, style: { textAlign: 'right' } }}
                                                                    value={item.unit_price}
                                                                    onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
                                                                    size="small"
                                                                    disabled={disabled}
                                                                    sx={{ width: 112, '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, '& .MuiInputBase-input': { fontSize: 11, fontWeight: 700, py: 0.5, px: 1 } }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ textAlign: 'right', fontWeight: 700, color: 'text.primary', fontSize: 12, py: 1.5 }}>
                                                                {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell sx={{ textAlign: 'center', py: 1.5 }}>
                                                                {piMode !== "requisition" && (
                                                                    <IconButton size="small" onClick={() => handleRemoveItem(index)} sx={{ color: 'error.light', '&:hover': { color: 'error.main' } }}>
                                                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                        {items.length > 0 && (
                                            <TableFooter>
                                                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                                                    <TableCell colSpan={piMode === "requisition" ? 7 : 5} sx={{ textAlign: 'right', fontWeight: 700, fontSize: 12, color: 'text.secondary', borderTop: '1px solid', borderColor: 'divider' }}>
                                                        Subtotal Amount:
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: 'right', fontWeight: 700, fontSize: 13, color: PRIMARY, borderTop: '1px solid', borderColor: 'divider' }}>
                                                        {formData.currency} {(piMode === "requisition"
                                                            ? items.filter(i => i.selected && i.can_add_to_pi)
                                                            : items
                                                        ).reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell sx={{ borderTop: '1px solid', borderColor: 'divider' }} />
                                                </TableRow>
                                            </TableFooter>
                                        )}
                                    </Table>
                                </Box>
                            </Box>

                            {/* PROFIT PREVIEW */}
                            {profitPreview && !isEdit && piMode === "requisition" && (
                                <Box sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: (profitPreview.expected_profit_inr || 0) >= 0 ? '#A7F3D0' : '#FECACA', bgcolor: (profitPreview.expected_profit_inr || 0) >= 0 ? '#ECFDF5' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography sx={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', mb: 0.25 }}>Profit Preview (Estimated)</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>Cost: &#8377;{Number(profitPreview.purchase_cost_inr || 0).toLocaleString('en-IN')}</Typography>
                                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>Transport: &#8377;{Number(profitPreview.transport_cost_inr || 0).toLocaleString('en-IN')}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography sx={{ fontSize: 20, fontWeight: 900, color: (profitPreview.expected_profit_inr || 0) >= 0 ? '#047857' : '#B91C1C' }}>
                                            {(profitPreview.expected_profit_inr || 0) >= 0 ? '+' : ''}&#8377;{Number(profitPreview.expected_profit_inr || 0).toLocaleString('en-IN')}
                                        </Typography>
                                        <Typography sx={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: (profitPreview.expected_margin_percentage || 0) >= 10 ? '#059669' : '#DC2626' }}>
                                            Margin: {Number(profitPreview.expected_margin_percentage || 0).toFixed(1)}%
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            {/* TERMS AND CONDITIONS */}
                            <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', pb: 1, mb: 2 }}>
                                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Terms & Conditions</Typography>
                                    <Button size="small" startIcon={<AddIcon sx={{ fontSize: 12 }} />} onClick={handleAddTerm} sx={{ fontSize: 11, fontWeight: 700, color: PRIMARY, bgcolor: '#EFF6FF', borderRadius: 1.5, textTransform: 'none', border: '1px solid', borderColor: '#BFDBFE', '&:hover': { bgcolor: '#DBEAFE' } }}>
                                        Add Term
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {terms.length === 0 ? (
                                        <Typography sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: 12, textAlign: 'center', py: 1 }}>No terms added</Typography>
                                    ) : (
                                        terms.map((term, index) => (
                                            <Box key={term.id} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: { sm: 'center' }, bgcolor: 'white', p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 0 }}>
                                                <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0, minWidth: 64 }}>Term #{index + 1}</Typography>
                                                <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                                                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', mb: 0.5 }}>Key / Label</Typography>
                                                    <TextField value={term.key} onChange={(e) => handleTermChange(term.id, "key", e.target.value)} placeholder="e.g. Shipment" fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, '& .MuiInputBase-input': { fontSize: 12, py: 0.75, fontWeight: term.bold ? 700 : 400 } }} />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ fontSize: 9, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', mb: 0.5 }}>Value</Typography>
                                                    <TextField value={term.value} onChange={(e) => handleTermChange(term.id, "value", e.target.value)} placeholder="e.g. within 45 days" fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 }, '& .MuiInputBase-input': { fontSize: 12, py: 0.75, fontWeight: term.bold ? 700 : 400 } }} />
                                                </Box>
                                                <Tooltip title="Make this line bold in the PI">
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                                        <Typography sx={{ fontSize: 9, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase' }}>Bold</Typography>
                                                        <Checkbox checked={!!term.bold} onChange={(e) => handleTermChange(term.id, "bold", e.target.checked)} size="small" sx={{ p: 0.5 }} />
                                                    </Box>
                                                </Tooltip>
                                                <Tooltip title="Delete Term">
                                                    <IconButton size="small" onClick={() => handleRemoveTerm(term.id)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main', bgcolor: '#FEF2F2' }, flexShrink: 0 }}>
                                                        <DeleteIcon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            </Box>

                            {/* HANDLING NOTES */}
                            <Box>
                                <Typography sx={labelSx}>Handling Notes</Typography>
                                <TextField
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    multiline
                                    rows={3}
                                    placeholder="Special priorities, packing demands..."
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& .MuiInputBase-input': { fontSize: 12, fontWeight: 600 } }}
                                />
                            </Box>
                        </Box>
                    </form>
                </Box>
    );

    const actionButtons = (
        <>
            <Button onClick={onClose} sx={{ fontWeight: 700, color: 'text.secondary', borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#E2E8F0' } }}>
                Cancel
            </Button>
            <Button
                type="submit"
                form="proforma-form"
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <CheckIcon sx={{ fontSize: 14 }} />}
                sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none', bgcolor: PRIMARY, px: 3, '&:hover': { bgcolor: '#0D47A1' } }}
            >
                {submitting ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Invoice" : "Create Invoice")}
            </Button>
        </>
    );

    // ── Full-page variant (same design as the modal) ─────────────────────────
    if (variant === "page") {
        return (
            <Box sx={{ p: { xs: 1, sm: 2 }, bgcolor: BG, minHeight: '100%' }}>
                <Card sx={{ width: '100%', borderRadius: 4, overflow: 'hidden', boxShadow: 2 }}>
                    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>{headerTitle}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.25 }}>{headerSubtitle}</Typography>
                        </Box>
                        <Tooltip title="Close">
                            <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                        </Tooltip>
                    </Box>
                    <Box sx={{ p: 3, bgcolor: BG }}>{formBody}</Box>
                    <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: 1, position: 'sticky', bottom: 0, zIndex: 2 }}>
                        {actionButtons}
                    </Box>
                </Card>
            </Box>
        );
    }

    // ── Modal variant (default) ──────────────────────────────────────────────
    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4, maxHeight: '90vh', bgcolor: BG } }}>
            <DialogTitle sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>{headerTitle}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.25 }}>{headerSubtitle}</Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, bgcolor: BG }}>{formBody}</DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC' }}>
                {actionButtons}
            </DialogActions>
        </Dialog>
    );
};

export default ClientQuotationModal;
