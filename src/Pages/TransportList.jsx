import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Card,
    Typography,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableFooter,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Chip,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Paper,
    Divider,
    RadioGroup,
    Radio,
    FormControlLabel,
    ToggleButton,
    ToggleButtonGroup,
    Skeleton,
    Autocomplete,
    ClickAwayListener,
    Popper,
    List,
    ListItemButton,
    ListItemText,
    Stack
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import PlaceIcon from "@mui/icons-material/Place";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import InfoIcon from "@mui/icons-material/Info";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckIcon from "@mui/icons-material/Check";
import LinkIcon from "@mui/icons-material/Link";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { getTransports, createTransport, updateTransport, markTransportDelivered, getTransportsByPO, getTransportsByPI, getLandedCostPO, getLandedCostPI, getTransporters, getDispatchTracker, getTransportNote } from "../services/transportService";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import TransportNoteSheetPDF from "../components/transport/TransportNoteSheetPDF";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { fetchPurchaseOrders } from "../services/purchaseOrderService";
import { getProformaInvoices } from "../services/salesService";
import { verificationService } from "../services/verificationService";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { CheckCircle, Schedule, Error } from "@mui/icons-material";

const COST_TYPES = [
    { value: "FREIGHT", label: "Freight Cost" },
    { value: "LOADING", label: "Loading Charges" },
    { value: "UNLOADING", label: "Unloading Charges" },
    { value: "INSURANCE", label: "Transit Insurance" },
    { value: "CUSTOMS", label: "Customs Duty" },
    { value: "OCTROI", label: "Octroi Charges" },
    { value: "HANDLING", label: "Handling Fees" },
    { value: "PACKAGING", label: "Packaging Costs" },
    { value: "TOLL", label: "Toll Tax" },
    { value: "OTHER", label: "Other Expenses" }
];

const TransportList = () => {
    // List state
    const [transports, setTransports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [verificationStatuses, setVerificationStatuses] = useState({});

    // Toast and Confirm State
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [confirm, setConfirm] = useState({ open: false, title: "", description: "", action: null });

    // Details Modal State
    const [viewingTransport, setViewingTransport] = useState(null);

    // Form Modal State
    const [formModal, setFormModal] = useState({ open: false, mode: "create", id: null });
    const [submitting, setSubmitting] = useState(false);

    // Form fields state
    const [refType, setRefType] = useState("PO"); // "PO" or "PI"
    const [refSearch, setRefSearch] = useState("");
    const [isRefDropdownOpen, setIsRefDropdownOpen] = useState(false);
    const [refList, setRefList] = useState([]);
    const [refLoading, setRefLoading] = useState(false);
    const dropdownRef = useRef(null);

    const [formData, setFormData] = useState({
        purchase_order: null, // PO UUID
        proforma_invoice: null, // PI UUID
        linked_number: "", // Number string for UI display
        transporter: null, // Transporter master UUID (optional)
        transporter_name: "",
        transporter_contact: "",
        vehicle_number: "",
        driver_name: "",
        driver_contact: "",
        lr_number: "",
        invoice_reference: "",
        dispatch_date: "",
        expected_delivery_date: "",
        dispatch_from: "",
        dispatch_to: "",
        cost_items: []
    });

    // Transporter master list (for the optional dropdown)
    const [transporterOptions, setTransporterOptions] = useState([]);
    // Consignment items for partial-shipment tracking: [{ key, po_item|pi_item, product_name, product_code, unit, ordered, shipped, pending, ship_qty }]
    const [consignmentItems, setConsignmentItems] = useState([]);
    const [consignmentLoading, setConsignmentLoading] = useState(false);

    // Filter & Landed Cost state
    const [selectedFilterDoc, setSelectedFilterDoc] = useState(null); // { id, type, label }
    const [landedCostData, setLandedCostData] = useState(null); // { landed_cost }
    const [filterRefSearch, setFilterRefSearch] = useState("");
    const [isFilterRefDropdownOpen, setIsFilterRefDropdownOpen] = useState(false);
    const [filterRefList, setFilterRefList] = useState([]);
    const [filterRefLoading, setFilterRefLoading] = useState(false);
    const [filterRefType, setFilterRefType] = useState("PO");
    const [docTypeFilter, setDocTypeFilter] = useState("ALL"); // "ALL", "PO", "PI"
    const filterDropdownRef = useRef(null);

    // Close select dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsRefDropdownOpen(false);
            }
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setIsFilterRefDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Load transporter master list whenever the form opens
    useEffect(() => {
        if (!formModal.open) return;
        (async () => {
            try {
                const res = await getTransporters({ is_active: true });
                setTransporterOptions(res?.results || res || []);
            } catch (err) {
                console.error("Failed to load transporters", err);
            }
        })();
    }, [formModal.open]);

    // Fetch ordered/shipped/pending item breakdown for the selected PO/PI
    const loadConsignmentForRef = async (type, id, existingItems = []) => {
        setConsignmentLoading(true);
        try {
            const params = type === "PO" ? { purchase_order: id } : { proforma_invoice: id };
            const tracker = await getDispatchTracker(params);
            // map existing consignment lines (edit mode) by source item id so we can prefill ship_qty
            const existingByItem = {};
            existingItems.forEach((ci) => {
                const srcId = ci.po_item || ci.pi_item;
                if (srcId) existingByItem[srcId] = Number(ci.quantity) || 0;
            });
            const rows = (tracker.items || []).map((it) => {
                const prefill = existingByItem[it.item_id] || 0;
                // in edit mode, the shipped figure already includes this entry's qty — add it back to available
                const pending = Number(it.pending_qty) + prefill;
                return {
                    key: it.item_id,
                    source: type === "PO" ? "po_item" : "pi_item",
                    source_id: it.item_id,
                    product_name: it.product_name,
                    product_code: it.product_code,
                    unit: it.unit,
                    ordered: Number(it.ordered_qty),
                    shipped: Number(it.shipped_qty),
                    pending,
                    ship_qty: prefill,
                };
            });
            setConsignmentItems(rows);
        } catch (err) {
            console.error("Failed to load consignment items", err);
            setConsignmentItems([]);
        } finally {
            setConsignmentLoading(false);
        }
    };

    const handleConsignmentQtyChange = (key, value) => {
        setConsignmentItems((prev) => prev.map((row) => {
            if (row.key !== key) return row;
            let v = parseFloat(value);
            if (isNaN(v) || v < 0) v = 0;
            if (v > row.pending) v = row.pending;
            return { ...row, ship_qty: v };
        }));
    };

    const fetchVerificationStatusesForDocs = async (transports) => {
        const statuses = {};
        for (const transport of transports) {
            const docId = transport.purchase_order || transport.proforma_invoice;
            const docType = transport.purchase_order ? 'PO' : 'PI';
            if (docId) {
                const status = docType === 'PO'
                    ? await verificationService.getPOVerificationStatus(docId)
                    : await verificationService.getPIVerificationStatus(docId);
                statuses[docId] = { ...status, type: docType };
            }
        }
        setVerificationStatuses(statuses);
    };

    // Load transports on page load or filter changes
    const fetchTransports = async (pageNum = 1) => {
        setLoading(true);
        try {
            let data;
            if (selectedFilterDoc) {
                if (selectedFilterDoc.type === "PO") {
                    data = await getTransportsByPO(selectedFilterDoc.id);
                } else {
                    data = await getTransportsByPI(selectedFilterDoc.id);
                }
                const list = Array.isArray(data) ? data : (data?.results || []);
                setTransports(list);
                setTotalCount(list.length);
                setNext(null);
                setPrevious(null);
                fetchVerificationStatusesForDocs(list);
            } else {
                data = await getTransports(pageNum, searchQuery);
                if (data) {
                    setTransports(data.results || []);
                    setTotalCount(data.count || 0);
                    setNext(data.next);
                    setPrevious(data.previous);
                    setPage(pageNum);
                    fetchVerificationStatusesForDocs(data.results || []);
                }
            }
        } catch (error) {
            console.error("Failed to fetch transports:", error);
            setAlert({ open: true, type: "error", message: "Failed to load transports" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransports(page);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, page, selectedFilterDoc]);

    const handleNext = () => { if (next) setPage(p => p + 1); };
    const handlePrev = () => { if (previous) setPage(p => Math.max(1, p - 1)); };

    // Fetch POs or PIs dynamically inside form
    useEffect(() => {
        if (!isRefDropdownOpen) return;

        const loadRefs = async () => {
            setRefLoading(true);
            try {
                if (refType === "PO") {
                    const response = await fetchPurchaseOrders(1, refSearch);
                    setRefList(response.results || []);
                } else {
                    const response = await getProformaInvoices(1, refSearch);
                    setRefList(response.results || []);
                }
            } catch (err) {
                console.error("Failed to load reference search list", err);
            } finally {
                setRefLoading(false);
            }
        };

        const timer = setTimeout(() => {
            loadRefs();
        }, 300);

        return () => clearTimeout(timer);
    }, [refSearch, refType, isRefDropdownOpen]);

    // Handle reference selection — multiple transport entries per PO/PI are now allowed
    // (partial shipments), so we load the item-level pending breakdown instead of blocking.
    const handleRefSelect = async (item) => {
        setIsRefDropdownOpen(false);
        setRefSearch("");

        if (refType === "PO") {
            setFormData(prev => ({
                ...prev,
                purchase_order: item.id,
                proforma_invoice: null,
                linked_number: item.po_number || item.id
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                proforma_invoice: item.id,
                purchase_order: null,
                linked_number: item.pi_number || item.id
            }));
        }
        loadConsignmentForRef(refType, item.id);
    };

    // Fetch POs or PIs dynamically inside FILTER
    useEffect(() => {
        if (!isFilterRefDropdownOpen) return;

        const loadFilterRefs = async () => {
            setFilterRefLoading(true);
            try {
                if (filterRefType === "PO") {
                    const response = await fetchPurchaseOrders(1, filterRefSearch);
                    setFilterRefList(response.results || []);
                } else {
                    const response = await getProformaInvoices(1, filterRefSearch);
                    setFilterRefList(response.results || []);
                }
            } catch (err) {
                console.error("Failed to load filter reference search list", err);
            } finally {
                setFilterRefLoading(false);
            }
        };

        const timer = setTimeout(() => {
            loadFilterRefs();
        }, 300);

        return () => clearTimeout(timer);
    }, [filterRefSearch, filterRefType, isFilterRefDropdownOpen]);

    const handleSelectFilterDoc = async (item) => {
        const docLabel = filterRefType === "PO" ? (item.po_number || item.id) : (item.pi_number || item.id);
        const filterDoc = { id: item.id, type: filterRefType, label: docLabel };
        setSelectedFilterDoc(filterDoc);
        setIsFilterRefDropdownOpen(false);
        setFilterRefSearch("");

        // Fetch Landed Cost
        try {
            let res;
            if (filterRefType === "PO") {
                res = await getLandedCostPO(item.id);
            } else {
                res = await getLandedCostPI(item.id);
            }
            setLandedCostData(res);
        } catch (err) {
            console.error("Failed to fetch landed cost:", err);
            setLandedCostData(null);
        }
    };

    const handleClearFilterDoc = () => {
        setSelectedFilterDoc(null);
        setLandedCostData(null);
    };

    const getVerificationStatusChip = (transport) => {
        const docId = transport.purchase_order || transport.proforma_invoice;
        let verStatus = verificationStatuses[docId]?.status || 'NOT_SENT';
        // Normalize NOT_STARTED to NOT_SENT
        if (verStatus === 'NOT_STARTED') verStatus = 'NOT_SENT';

        let label, color, icon;

        switch (verStatus) {
            case 'VERIFIED':
                label = 'Verified';
                color = 'success';
                icon = <CheckCircle sx={{ mr: 0.5, fontSize: 14 }} />;
                break;
            case 'PENDING':
                label = 'Pending';
                color = 'warning';
                icon = <Schedule sx={{ mr: 0.5, fontSize: 14 }} />;
                break;
            case 'REJECTED':
                label = 'Rejected';
                color = 'error';
                icon = <Error sx={{ mr: 0.5, fontSize: 14 }} />;
                break;
            default:
                label = 'Not Sent';
                color = 'default';
                icon = null;
        }

        return <Chip icon={icon} label={label} color={color} size="small" variant="outlined" />;
    };

    // Cost Items dynamically added/removed
    const handleAddCostLine = () => {
        setFormData(prev => ({
            ...prev,
            cost_items: [
                ...prev.cost_items,
                { cost_type: "FREIGHT", description: "", amount: 0 }
            ]
        }));
    };

    const handleRemoveCostLine = (idx) => {
        setFormData(prev => ({
            ...prev,
            cost_items: prev.cost_items.filter((_, i) => i !== idx)
        }));
    };

    const handleCostItemChange = (idx, field, value) => {
        setFormData(prev => {
            const list = [...prev.cost_items];
            list[idx] = {
                ...list[idx],
                [field]: field === "amount" ? (parseFloat(value) || 0) : value
            };
            return {
                ...prev,
                cost_items: list
            };
        });
    };

    // Calculate total cost items sum
    const totalCost = formData.cost_items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const handleOpenForm = (mode, transportObj = null) => {
        if (mode === "create") {
            setRefType("PO");
            setConsignmentItems([]);
            setFormData({
                purchase_order: null,
                proforma_invoice: null,
                linked_number: "",
                transporter: null,
                transporter_name: "",
                transporter_contact: "",
                vehicle_number: "",
                driver_name: "",
                driver_contact: "",
                lr_number: "",
                invoice_reference: "",
                dispatch_date: "",
                expected_delivery_date: "",
                dispatch_from: "",
                dispatch_to: "",
                cost_items: [{ cost_type: "FREIGHT", description: "", amount: 0 }]
            });
            setFormModal({ open: true, mode: "create", id: null });
        } else {
            const poId = transportObj.purchase_order;
            const piId = transportObj.proforma_invoice;
            setRefType(poId ? "PO" : "PI");
            setConsignmentItems([]);
            setFormData({
                purchase_order: poId || null,
                proforma_invoice: piId || null,
                linked_number: transportObj.po_number || transportObj.pi_number || transportObj.purchase_order_number || transportObj.proforma_invoice_number || "Linked Ref",
                transporter: transportObj.transporter || null,
                transporter_name: transportObj.transporter_name || "",
                transporter_contact: transportObj.transporter_contact || "",
                vehicle_number: transportObj.vehicle_number || "",
                driver_name: transportObj.driver_name || "",
                driver_contact: transportObj.driver_contact || "",
                lr_number: transportObj.lr_number || "",
                invoice_reference: transportObj.invoice_reference || "",
                dispatch_date: transportObj.dispatch_date || "",
                expected_delivery_date: transportObj.expected_delivery_date || "",
                dispatch_from: transportObj.dispatch_from || "",
                dispatch_to: transportObj.dispatch_to || "",
                cost_items: (transportObj.cost_items || []).map(item => ({
                    cost_type: item.cost_type,
                    description: item.description || "",
                    amount: parseFloat(item.amount) || 0
                }))
            });
            setFormModal({ open: true, mode: "edit", id: transportObj.id });
            // prefill the item-level shipment breakdown for this entry
            if (poId || piId) {
                loadConsignmentForRef(poId ? "PO" : "PI", poId || piId, transportObj.consignment_items || []);
            }
        }
    };

    const handleFormSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!formData.purchase_order && !formData.proforma_invoice) {
            setAlert({ open: true, type: "error", message: "Please select a Purchase Order or Proforma Invoice first." });
            return;
        }
        if (!formData.transporter_name?.trim()) {
            setAlert({ open: true, type: "error", message: "Transporter Name is required." });
            return;
        }
        if (!formData.cost_items || formData.cost_items.length === 0) {
            setAlert({ open: true, type: "error", message: "At least one cost item is required." });
            return;
        }
        const invalidCost = formData.cost_items.find(item => !item.cost_type || !item.amount || parseFloat(item.amount) <= 0);
        if (invalidCost) {
            setAlert({ open: true, type: "error", message: "All cost items must have a type and amount > 0." });
            return;
        }

        setSubmitting(true);
        try {
            // Clean cost items payloads to floats
            const cleanedCostItems = formData.cost_items.map(item => ({
                cost_type: item.cost_type,
                description: item.description || "",
                amount: Number(parseFloat(item.amount).toFixed(2))
            }));

            // consignment lines with a positive ship qty become partial-shipment records
            const cleanedConsignment = consignmentItems
                .filter(row => Number(row.ship_qty) > 0)
                .map(row => ({
                    [row.source]: row.source_id,
                    quantity: Number(parseFloat(row.ship_qty).toFixed(2)),
                }));

            const payload = {
                purchase_order: formData.purchase_order,
                proforma_invoice: formData.proforma_invoice,
                transporter: formData.transporter,
                transporter_name: formData.transporter_name,
                transporter_contact: formData.transporter_contact,
                vehicle_number: formData.vehicle_number,
                driver_name: formData.driver_name,
                driver_contact: formData.driver_contact,
                lr_number: formData.lr_number,
                invoice_reference: formData.invoice_reference,
                dispatch_date: formData.dispatch_date,
                expected_delivery_date: formData.expected_delivery_date,
                dispatch_from: formData.dispatch_from,
                dispatch_to: formData.dispatch_to,
                cost_items: cleanedCostItems,
            };
            // Only send consignment_items when the breakdown actually loaded — avoids
            // wiping existing partial-shipment records if the tracker failed to load on edit.
            if (consignmentItems.length > 0) {
                payload.consignment_items = cleanedConsignment;
            }

            if (formModal.mode === "create") {
                await createTransport(payload);
                setAlert({ open: true, type: "success", message: "Transport tracking logged successfully!" });
            } else {
                await updateTransport(formModal.id, payload);
                setAlert({ open: true, type: "success", message: "Transport records updated successfully!" });
            }
            setFormModal({ open: false, mode: "create", id: null });
            fetchTransports(page);
        } catch (error) {
            console.error("Logistics submission failed:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Logistics submission failed.";
            setAlert({ open: true, type: "error", message: errorMsg });
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkDelivered = (transportObj) => {
        setConfirm({
            open: true,
            title: "Confirm Delivery",
            description: `Are you sure you want to mark transport shipment ${transportObj.transport_number || ''} as delivered?`,
            action: async () => {
                try {
                    await markTransportDelivered(transportObj.id);
                    setAlert({ open: true, type: "success", message: "Transport shipment marked delivered successfully!" });
                    setViewingTransport(null);
                    fetchTransports(page);
                    setConfirm(prev => ({ ...prev, open: false }));
                } catch (error) {
                    console.error("Failed to mark transport delivered:", error);
                    const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to mark shipment as delivered.";
                    setAlert({ open: true, type: "error", message: errorMsg });
                }
            }
        });
    };

    const handleDownloadNote = async (transportObj) => {
        try {
            const note = await getTransportNote(transportObj.id);
            const blob = await pdf(<TransportNoteSheetPDF note={note} />).toBlob();
            saveAs(blob, `${(note.transport_number || "transport").replace(/\//g, "_")}_note.pdf`);
        } catch (error) {
            console.error("Failed to generate transport note:", error);
            setAlert({ open: true, type: "error", message: "Failed to generate transport note PDF." });
        }
    };

    const formatCurrency = (amount) => {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        });
    };

    const filteredTransports = transports.filter(trn => {
        if (docTypeFilter === "PO") return !!(trn.purchase_order || trn.po_number);
        if (docTypeFilter === "PI") return !!(trn.proforma_invoice || trn.pi_number);
        return true;
    });

    const totalTransportsCost = filteredTransports.reduce((sum, trn) => {
        const itemSum = trn.total_cost ? parseFloat(trn.total_cost) : (trn.cost_items || []).reduce((s, cost) => s + parseFloat(cost.amount || 0), 0);
        return sum + itemSum;
    }, 0);

    return (
        <>
            <Box sx={{ width: "100%", py: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Header Section */}
                <Paper elevation={0} sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", gap: 2, p: 3, borderRadius: 3, border: "1px solid", borderColor: "grey.200" }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "grey.800", display: "flex", alignItems: "center", gap: 1.5 }}>
                            <LocalShippingIcon sx={{ color: "primary.main" }} />
                            Logistics &amp; Transport Management
                        </Typography>
                        <Typography variant="body2" sx={{ color: "grey.500", mt: 0.5, fontWeight: 500 }}>
                            Track vehicle routing, logistical cost breakdowns, and freight delivery details against POs and PIs
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenForm("create")}
                            sx={{ borderRadius: 2.5, textTransform: "uppercase", fontWeight: 900, px: 3, py: 1.2, fontSize: "0.8rem", boxShadow: "0 4px 14px 0 rgba(25,118,210,0.25)" }}
                        >
                            Log New Shipment
                        </Button>
                        <Paper variant="outlined" sx={{ px: 2.5, py: 1, borderRadius: 2.5, bgcolor: "grey.50" }}>
                            <Typography sx={{ fontSize: "0.6rem", textTransform: "uppercase", fontWeight: 800, color: "grey.400", letterSpacing: 1 }}>Logistics Cost (Page)</Typography>
                            <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: "grey.800", lineHeight: 1.2 }}>{formatCurrency(totalTransportsCost)}</Typography>
                        </Paper>
                    </Box>
                </Paper>

                {/* Filters */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "grey.200" }}>
                    <Grid container spacing={3}>
                        {/* Search query */}
                        <Grid item xs={12} lg={4}>
                            <Typography sx={{ fontSize: "0.65rem", fontWeight: 800, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>
                                Search Transporter / Driver / Vehicle / Ref
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="E.g. Blue Dart, Raju, MH12AB..., TRN/..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: "grey.400", fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2.5, bgcolor: "grey.50", fontWeight: 600, fontSize: "0.875rem" }
                                }}
                            />
                        </Grid>

                        {/* Filter Shipments by Link Category */}
                        <Grid item xs={12} lg={4}>
                            <Typography sx={{ fontSize: "0.65rem", fontWeight: 800, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>
                                Filter Shipments by Link Category
                            </Typography>
                            <ToggleButtonGroup
                                value={docTypeFilter}
                                exclusive
                                onChange={(e, val) => { if (val !== null) setDocTypeFilter(val); }}
                                fullWidth
                                size="small"
                                sx={{
                                    bgcolor: "grey.100",
                                    borderRadius: 2.5,
                                    p: 0.5,
                                    "& .MuiToggleButton-root": {
                                        border: "none",
                                        borderRadius: "8px !important",
                                        textTransform: "uppercase",
                                        fontWeight: 900,
                                        fontSize: "0.6rem",
                                        letterSpacing: 1,
                                        py: 1,
                                        color: "grey.500",
                                        "&.Mui-selected": {
                                            bgcolor: "white",
                                            color: "primary.main",
                                            boxShadow: 1,
                                            "&:hover": { bgcolor: "white" }
                                        }
                                    }
                                }}
                            >
                                <ToggleButton value="ALL">All Shipments</ToggleButton>
                                <ToggleButton value="PO">All PO</ToggleButton>
                                <ToggleButton value="PI">All PI</ToggleButton>
                            </ToggleButtonGroup>
                        </Grid>

                        {/* Landed Cost Selector */}
                        <Grid item xs={12} lg={4}>
                            <Box ref={filterDropdownRef} sx={{ position: "relative" }}>
                                <Typography sx={{ fontSize: "0.65rem", fontWeight: 800, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>
                                    Landed Cost Reference Selector
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <ToggleButtonGroup
                                        value={filterRefType}
                                        exclusive
                                        onChange={(e, val) => {
                                            if (val !== null) {
                                                setFilterRefType(val);
                                                setFilterRefSearch("");
                                                setFilterRefList([]);
                                            }
                                        }}
                                        size="small"
                                        sx={{
                                            bgcolor: "grey.100",
                                            borderRadius: 2.5,
                                            p: 0.25,
                                            alignSelf: "flex-start",
                                            "& .MuiToggleButton-root": {
                                                border: "none",
                                                borderRadius: "8px !important",
                                                textTransform: "uppercase",
                                                fontWeight: 900,
                                                fontSize: "0.6rem",
                                                letterSpacing: 1,
                                                px: 1.5,
                                                py: 0.75,
                                                color: "grey.500",
                                                "&.Mui-selected": {
                                                    bgcolor: "white",
                                                    color: "primary.main",
                                                    boxShadow: 1,
                                                    "&:hover": { bgcolor: "white" }
                                                }
                                            }
                                        }}
                                    >
                                        <ToggleButton value="PO">PO</ToggleButton>
                                        <ToggleButton value="PI">PI</ToggleButton>
                                    </ToggleButtonGroup>
                                    <Box sx={{ position: "relative", flex: 1 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            readOnly={!!selectedFilterDoc}
                                            value={selectedFilterDoc ? selectedFilterDoc.label : filterRefSearch}
                                            onClick={() => !selectedFilterDoc && setIsFilterRefDropdownOpen(true)}
                                            onChange={(e) => { setFilterRefSearch(e.target.value); setIsFilterRefDropdownOpen(true); }}
                                            placeholder={`Search linked ${filterRefType}...`}
                                            InputProps={{
                                                readOnly: !!selectedFilterDoc,
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        {selectedFilterDoc ? (
                                                            <IconButton size="small" onClick={handleClearFilterDoc} sx={{ color: "grey.400", "&:hover": { color: "error.main" } }}>
                                                                <CloseIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        ) : (
                                                            <ExpandMoreIcon sx={{ fontSize: 16, color: "grey.400" }} />
                                                        )}
                                                    </InputAdornment>
                                                ),
                                                sx: { borderRadius: 2.5, bgcolor: "grey.50", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }
                                            }}
                                        />

                                        {/* Dropdown Results */}
                                        {isFilterRefDropdownOpen && (
                                            <Paper elevation={8} sx={{ position: "absolute", left: 0, right: 0, mt: 1, borderRadius: 2.5, zIndex: 100, maxHeight: 208, overflow: "auto", border: "1px solid", borderColor: "grey.200" }}>
                                                {filterRefLoading ? (
                                                    <Typography sx={{ p: 1.5, textAlign: "center", fontSize: "0.6rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase" }}>
                                                        Searching active docs...
                                                    </Typography>
                                                ) : filterRefList.length > 0 ? (
                                                    filterRefList.map((item) => (
                                                        <Box
                                                            key={item.id}
                                                            onClick={() => handleSelectFilterDoc(item)}
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                                px: 2,
                                                                py: 1.2,
                                                                cursor: "pointer",
                                                                fontWeight: 700,
                                                                fontSize: "0.7rem",
                                                                color: "grey.700",
                                                                borderBottom: "1px solid",
                                                                borderColor: "grey.100",
                                                                "&:hover": { bgcolor: "primary.50", color: "primary.main" },
                                                                transition: "all 0.15s"
                                                            }}
                                                        >
                                                            <span>{filterRefType === "PO" ? item.po_number : item.pi_number}</span>
                                                            <Chip label={item.client_name || item.vendor_name || "Active"} size="small" variant="outlined" sx={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", height: 20 }} />
                                                        </Box>
                                                    ))
                                                ) : (
                                                    <Typography sx={{ p: 1.5, textAlign: "center", fontSize: "0.6rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase" }}>
                                                        No matching references found
                                                    </Typography>
                                                )}
                                            </Paper>
                                        )}
                                    </Box>
                                </Box>

                                {/* Landed Cost Calculated details */}
                                {selectedFilterDoc && (
                                    <Paper elevation={0} sx={{ mt: 1, px: 1.5, py: 1, borderRadius: 2.5, bgcolor: "#ecfdf5", border: "1px solid", borderColor: "#a7f3d0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <Typography sx={{ fontSize: "0.75rem", color: "#065f46" }}>
                                            Landed Cost (<strong style={{ fontFamily: "monospace", fontSize: "0.65rem" }}>{selectedFilterDoc.label}</strong>):
                                        </Typography>
                                        <Typography sx={{ fontFamily: "monospace", fontWeight: 900, color: "#047857", fontSize: "0.8rem" }}>
                                            {formatCurrency(landedCostData?.landed_cost || 0)}
                                        </Typography>
                                    </Paper>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Table list */}
                <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", overflow: "hidden" }}>
                    <TableContainer>
                        <Table
                            size="small"
                            sx={{
                                // compact: tighter padding + smaller text so it fits without horizontal scroll
                                '& .MuiTableCell-root': { py: 0.75, px: 1 },
                                '& .MuiTableCell-head': { fontSize: '0.6rem !important', letterSpacing: '0.5px !important' },
                                '& .MuiTypography-root': { fontSize: '0.68rem' },
                                '& .MuiChip-root': { height: 18, fontSize: '0.58rem' },
                                '& .MuiChip-root .MuiChip-label': { px: 0.75 },
                            }}
                        >
                            <TableHead>
                                <TableRow sx={{ bgcolor: "grey.50" }}>
                                    <TableCell sx={{ fontWeight: 800, fontSize: "0.68rem", color: "grey.500", textTransform: "uppercase", letterSpacing: 1 }}>Transport Ref &amp; Dates</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: "0.68rem", color: "grey.500", textTransform: "uppercase", letterSpacing: 1 }}>Associated PO / PI</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: "0.68rem", color: "grey.500", textTransform: "uppercase", letterSpacing: 1 }}>Transporter &amp; Vehicle</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: "0.68rem", color: "grey.500", textTransform: "uppercase", letterSpacing: 1 }}>Driver Details</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: "0.68rem", color: "grey.500", textTransform: "uppercase", letterSpacing: 1 }}>Dispatch Route</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: "0.68rem", color: "grey.500", textTransform: "uppercase", letterSpacing: 1, textAlign: "right" }}>Total Freight Cost</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: "0.68rem", color: "grey.500", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>Doc Verification</TableCell>
                                    <TableCell sx={{ fontWeight: 800, fontSize: "0.68rem", color: "grey.500", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && filteredTransports.length === 0 ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={8} sx={{ px: 3, py: 4 }}>
                                                <Skeleton variant="rectangular" height={20} sx={{ borderRadius: 1 }} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredTransports.length > 0 ? (
                                    filteredTransports.map((trn) => {
                                        const totalTrnCost = trn.total_cost ? parseFloat(trn.total_cost) : (trn.cost_items || []).reduce((s, cost) => s + parseFloat(cost.amount || 0), 0);
                                        return (
                                            <TableRow key={trn.id} hover sx={{ "&:hover": { bgcolor: "grey.50" }, transition: "background 0.15s" }}>
                                                <TableCell sx={{ py: 2 }}>
                                                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                            <Chip
                                                                label={trn.transport_number || `TRN/${trn.id.substring(0, 6).toUpperCase()}`}
                                                                size="small"
                                                                sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontSize: "0.75rem", height: 24 }}
                                                            />
                                                            <Chip
                                                                label={trn.status_display || trn.status || "Pending"}
                                                                size="small"
                                                                sx={{
                                                                    fontWeight: 900,
                                                                    fontSize: "0.55rem",
                                                                    textTransform: "uppercase",
                                                                    height: 20,
                                                                    ...(trn.status?.toUpperCase() === "DELIVERED"
                                                                        ? { bgcolor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }
                                                                        : { bgcolor: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }
                                                                    )
                                                                }}
                                                            />
                                                        </Box>
                                                        <Typography sx={{ fontSize: "0.62rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", mt: 0.5, display: "flex", alignItems: "center", gap: 0.75 }}>
                                                            <CalendarTodayIcon sx={{ fontSize: 12 }} />
                                                            Disp: {trn.dispatch_date}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: "0.62rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", mt: 0.25, display: "flex", alignItems: "center", gap: 0.75 }}>
                                                            <CalendarTodayIcon sx={{ fontSize: 12 }} />
                                                            Exp: {trn.expected_delivery_date}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ py: 2 }}>
                                                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                                                        {trn.po_number || trn.purchase_order_number ? (
                                                            <Chip
                                                                label={`PO: ${trn.po_number || trn.purchase_order_number}`}
                                                                size="small"
                                                                sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "grey.100", color: "grey.800", border: "1px solid", borderColor: "grey.200", fontSize: "0.75rem", height: 24, alignSelf: "flex-start" }}
                                                            />
                                                        ) : trn.pi_number || trn.proforma_invoice_number ? (
                                                            <Chip
                                                                label={`PI: ${trn.pi_number || trn.proforma_invoice_number}`}
                                                                size="small"
                                                                sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "grey.100", color: "grey.800", border: "1px solid", borderColor: "grey.200", fontSize: "0.75rem", height: 24, alignSelf: "flex-start" }}
                                                            />
                                                        ) : (
                                                            <Typography sx={{ color: "grey.400", fontStyle: "italic", fontSize: "0.8rem" }}>No Ref linked</Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ py: 2 }}>
                                                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                                                        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "grey.800" }}>{trn.transporter_name}</Typography>
                                                        <Typography sx={{ fontSize: "0.68rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase" }}>{trn.vehicle_number}</Typography>
                                                        <Typography sx={{ fontSize: "0.62rem", color: "grey.400", display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                                                            <PhoneIcon sx={{ fontSize: 12 }} /> {trn.transporter_contact}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ py: 2 }}>
                                                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                                                        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "grey.800", display: "flex", alignItems: "center", gap: 0.75 }}>
                                                            <PersonIcon sx={{ fontSize: 14, color: "grey.400" }} />
                                                            {trn.driver_name}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: "0.62rem", color: "grey.400", display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                                                            <PhoneIcon sx={{ fontSize: 12 }} /> {trn.driver_contact}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ py: 2 }}>
                                                    <Box sx={{ display: "flex", flexDirection: "column", fontSize: "0.75rem", fontWeight: 600, color: "grey.600" }}>
                                                        <Typography sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.75rem", fontWeight: 600 }}>
                                                            <PlaceIcon sx={{ fontSize: 14, color: "success.main" }} /> From: {trn.dispatch_from}
                                                        </Typography>
                                                        <Typography sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.75rem", fontWeight: 600, mt: 0.5 }}>
                                                            <PlaceIcon sx={{ fontSize: 14, color: "error.main" }} /> To: {trn.dispatch_to}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ py: 2, textAlign: "right" }}>
                                                    <Typography sx={{ fontSize: "0.875rem", fontWeight: 900, color: "grey.800" }}>{formatCurrency(totalTrnCost)}</Typography>
                                                    <Typography sx={{ fontSize: "0.55rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, mt: 0.25 }}>
                                                        {(trn.cost_items || []).length} Cost items
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 2, textAlign: "center" }}>
                                                    {getVerificationStatusChip(trn)}
                                                </TableCell>
                                                <TableCell sx={{ py: 2 }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                                        <Tooltip title="Quick View">
                                                            <IconButton size="small" onClick={() => setViewingTransport(trn)} sx={{ color: "grey.500", "&:hover": { color: "primary.main", bgcolor: "primary.50" } }}>
                                                                <VisibilityIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Transport Note PDF">
                                                            <IconButton size="small" onClick={() => handleDownloadNote(trn)} sx={{ color: "#b91c1c", "&:hover": { color: "#7f1d1d", bgcolor: "#fef2f2" } }}>
                                                                <PictureAsPdfIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {trn.status?.toUpperCase() !== "DELIVERED" && (
                                                            <Tooltip title="Modify records">
                                                                <IconButton size="small" onClick={() => handleOpenForm("edit", trn)} sx={{ color: "primary.main", "&:hover": { color: "primary.dark", bgcolor: "primary.50" } }}>
                                                                    <EditIcon sx={{ fontSize: 18 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        {trn.status?.toUpperCase() !== "DELIVERED" && (
                                                            <Tooltip title="Mark Delivered">
                                                                <IconButton size="small" onClick={() => handleMarkDelivered(trn)} sx={{ color: "success.main", "&:hover": { color: "success.dark", bgcolor: "#ecfdf5" } }}>
                                                                    <CheckIcon sx={{ fontSize: 18 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} sx={{ py: 10, textAlign: "center" }}>
                                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                                                <Box sx={{ width: 80, height: 80, bgcolor: "grey.100", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "grey.300" }}>
                                                    <LocalShippingIcon sx={{ fontSize: 40 }} />
                                                </Box>
                                                <Typography sx={{ color: "grey.500", fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, fontSize: "0.875rem" }}>
                                                    No logistical shipments logged
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    <Box sx={{ px: 3, py: 2, bgcolor: "grey.50", borderTop: "1px solid", borderColor: "grey.200", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography sx={{ fontSize: "0.75rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>
                            Showing <Box component="span" sx={{ color: "grey.800" }}>{filteredTransports.length}</Box> of <Box component="span" sx={{ color: "grey.800" }}>{totalCount}</Box> shipments
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1.5 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ChevronLeftIcon />}
                                onClick={handlePrev}
                                disabled={!previous}
                                sx={{ borderRadius: 2.5, fontWeight: 900, fontSize: "0.7rem", textTransform: "uppercase", px: 2.5, borderColor: "grey.200", color: "grey.600" }}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                endIcon={<ChevronRightIcon />}
                                onClick={handleNext}
                                disabled={!next}
                                sx={{ borderRadius: 2.5, fontWeight: 900, fontSize: "0.7rem", textTransform: "uppercase", px: 2.5, borderColor: "grey.200", color: "grey.600" }}
                            >
                                Next Page
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Alert toast */}
            <AlertToast
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ ...alert, open: false })}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                message={confirm.description}
                onConfirm={() => {
                    if (confirm.action) confirm.action();
                    setConfirm(prev => ({ ...prev, open: false }));
                }}
                onCancel={() => setConfirm(prev => ({ ...prev, open: false }))}
                confirmText="Confirm"
                confirmButtonClass="bg-emerald-600 hover:bg-emerald-500"
                icon={CheckIcon}
                iconBgClass="bg-emerald-100 text-emerald-600"
            />

            {/* Log / Edit form Dialog */}
            <Dialog
                open={formModal.open}
                onClose={() => setFormModal({ open: false, mode: "create", id: null })}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, maxHeight: "90vh" } }}
            >
                <DialogTitle sx={{ bgcolor: "grey.900", color: "white", py: 2.5, px: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
                            <LocalShippingIcon sx={{ color: "#60a5fa" }} />
                            {formModal.mode === "create" ? "Log Logistical Transport shipment" : "Modify Transport Logistics Records"}
                        </Typography>
                        <Typography sx={{ fontSize: "0.6rem", color: "grey.400", textTransform: "uppercase", fontWeight: 700, mt: 0.25 }}>
                            Specify dispatch routes and cost items
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setFormModal({ open: false, mode: "create", id: null })} sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ bgcolor: "grey.50", p: 4, display: "flex", flexDirection: "column", gap: 3, pt: "24px !important" }}>
                    {/* Ref Select Section */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "grey.200" }}>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, color: "grey.800", textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid", borderColor: "grey.100", pb: 1, mb: 2 }}>
                            <LinkIcon sx={{ color: "grey.400", fontSize: 16 }} /> Associated Documents Reference
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>
                                    Reference Type
                                </Typography>
                                <ToggleButtonGroup
                                    value={refType}
                                    exclusive
                                    onChange={(e, val) => {
                                        if (val !== null) {
                                            setRefType(val);
                                            setFormData(prev => ({ ...prev, purchase_order: null, proforma_invoice: null, linked_number: "" }));
                                        }
                                    }}
                                    fullWidth
                                    size="small"
                                    sx={{
                                        bgcolor: "grey.100",
                                        borderRadius: 2.5,
                                        p: 0.25,
                                        "& .MuiToggleButton-root": {
                                            border: "none",
                                            borderRadius: "8px !important",
                                            textTransform: "uppercase",
                                            fontWeight: 900,
                                            fontSize: "0.65rem",
                                            letterSpacing: 1,
                                            py: 1,
                                            color: "grey.500",
                                            "&.Mui-selected": {
                                                bgcolor: "white",
                                                color: "primary.main",
                                                boxShadow: 1,
                                                "&:hover": { bgcolor: "white" }
                                            }
                                        }
                                    }}
                                >
                                    <ToggleButton value="PO">Purchase Order (PO)</ToggleButton>
                                    <ToggleButton value="PI">Proforma Invoice (PI)</ToggleButton>
                                </ToggleButtonGroup>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Box ref={dropdownRef} sx={{ position: "relative" }}>
                                    <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>
                                        Select {refType} *
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        required
                                        value={formData.linked_number || refSearch}
                                        onClick={() => !formData.linked_number && setIsRefDropdownOpen(true)}
                                        onChange={(e) => { setRefSearch(e.target.value); setIsRefDropdownOpen(true); }}
                                        placeholder={`Click to search and select linked active ${refType}...`}
                                        InputProps={{
                                            readOnly: !!formData.purchase_order || !!formData.proforma_invoice,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    {formData.linked_number ? (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setFormData(prev => ({ ...prev, purchase_order: null, proforma_invoice: null, linked_number: "" }))}
                                                            sx={{ color: "grey.400", "&:hover": { color: "error.main" } }}
                                                        >
                                                            <CloseIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    ) : (
                                                        <ExpandMoreIcon sx={{ fontSize: 18, color: "grey.400" }} />
                                                    )}
                                                </InputAdornment>
                                            ),
                                            sx: { borderRadius: 2.5, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", py: 0.5 }
                                        }}
                                    />

                                    {/* Autocomplete Ref Select Dropdown */}
                                    {isRefDropdownOpen && (
                                        <Paper elevation={8} sx={{ position: "absolute", left: 0, right: 0, mt: 1, borderRadius: 2.5, zIndex: 100, maxHeight: 224, overflow: "auto", border: "1px solid", borderColor: "grey.200" }}>
                                            {refLoading ? (
                                                <Typography sx={{ p: 2, textAlign: "center", fontSize: "0.7rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase" }}>
                                                    Searching active references...
                                                </Typography>
                                            ) : refList.length > 0 ? (
                                                refList.map((item) => (
                                                    <Box
                                                        key={item.id}
                                                        onClick={() => handleRefSelect(item)}
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            px: 2.5,
                                                            py: 1.5,
                                                            cursor: "pointer",
                                                            fontWeight: 700,
                                                            fontSize: "0.75rem",
                                                            color: "grey.700",
                                                            borderBottom: "1px solid",
                                                            borderColor: "grey.100",
                                                            "&:hover": { bgcolor: "primary.50", color: "primary.main" },
                                                            transition: "all 0.15s"
                                                        }}
                                                    >
                                                        <span>{refType === "PO" ? item.po_number : item.pi_number}</span>
                                                        <Chip label={item.client_name || item.vendor_name || "Active"} size="small" variant="outlined" sx={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", height: 22 }} />
                                                    </Box>
                                                ))
                                            ) : (
                                                <Typography sx={{ p: 2, textAlign: "center", fontSize: "0.7rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase" }}>
                                                    No matching references found
                                                </Typography>
                                            )}
                                        </Paper>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Logistics Details Grid */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "grey.200" }}>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, color: "grey.800", textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid", borderColor: "grey.100", pb: 1, mb: 3 }}>
                            <LocalShippingIcon sx={{ color: "grey.400", fontSize: 16 }} /> Carrier &amp; Dispatch Details
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>Transporter (Master)</Typography>
                                <Select
                                    fullWidth size="small" displayEmpty
                                    value={formData.transporter || ""}
                                    onChange={(e) => {
                                        const id = e.target.value || null;
                                        const t = transporterOptions.find(o => o.id === id);
                                        setFormData(prev => ({
                                            ...prev,
                                            transporter: id,
                                            transporter_name: t ? t.name : prev.transporter_name,
                                            transporter_contact: t && t.phone ? t.phone : prev.transporter_contact,
                                        }));
                                    }}
                                    sx={{ borderRadius: 2.5, bgcolor: "grey.50", fontSize: "0.8rem", fontWeight: 700 }}
                                >
                                    <MenuItem value="" sx={{ fontSize: "0.8rem", fontStyle: "italic" }}>— None / type manually —</MenuItem>
                                    {transporterOptions.map(o => (
                                        <MenuItem key={o.id} value={o.id} sx={{ fontSize: "0.8rem" }}>{o.transporter_code} — {o.name}</MenuItem>
                                    ))}
                                </Select>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>Transporter Name *</Typography>
                                <TextField
                                    fullWidth size="small" required
                                    placeholder="E.g. Blue Dart Logistics"
                                    value={formData.transporter_name}
                                    onChange={(e) => setFormData({ ...formData, transporter_name: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2.5, bgcolor: "grey.50", fontWeight: 700, fontSize: "0.875rem" } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>Transporter Contact *</Typography>
                                <TextField
                                    fullWidth size="small" required
                                    placeholder="10 digit phone number"
                                    value={formData.transporter_contact}
                                    onChange={(e) => setFormData({ ...formData, transporter_contact: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2.5, bgcolor: "grey.50", fontWeight: 700, fontSize: "0.875rem" } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>Vehicle Number *</Typography>
                                <TextField
                                    fullWidth size="small" required
                                    placeholder="E.g. MH12AB1234"
                                    value={formData.vehicle_number}
                                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2.5, bgcolor: "grey.50", fontWeight: 700, fontSize: "0.875rem" } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>Driver Name *</Typography>
                                <TextField
                                    fullWidth size="small" required
                                    placeholder="Driver full name"
                                    value={formData.driver_name}
                                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2.5, bgcolor: "grey.50", fontWeight: 700, fontSize: "0.875rem" } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>Driver Contact *</Typography>
                                <TextField
                                    fullWidth size="small" required
                                    placeholder="Driver phone number"
                                    value={formData.driver_contact}
                                    onChange={(e) => setFormData({ ...formData, driver_contact: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2.5, bgcolor: "grey.50", fontWeight: 700, fontSize: "0.875rem" } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>LR / Consignment Note No.</Typography>
                                <TextField
                                    fullWidth size="small"
                                    placeholder="Lorry receipt / bilty no."
                                    value={formData.lr_number}
                                    onChange={(e) => setFormData({ ...formData, lr_number: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2.5, bgcolor: "grey.50", fontWeight: 700, fontSize: "0.875rem" } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>Transporter Invoice Ref.</Typography>
                                <TextField
                                    fullWidth size="small"
                                    placeholder="Carrier's invoice no."
                                    value={formData.invoice_reference}
                                    onChange={(e) => setFormData({ ...formData, invoice_reference: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2.5, bgcolor: "grey.50", fontWeight: 700, fontSize: "0.875rem" } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>Dispatch From *</Typography>
                                <TextField
                                    fullWidth size="small" required
                                    placeholder="City of Origin"
                                    value={formData.dispatch_from}
                                    onChange={(e) => setFormData({ ...formData, dispatch_from: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2.5, bgcolor: "grey.50", fontWeight: 700, fontSize: "0.875rem" } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>Dispatch To *</Typography>
                                <TextField
                                    fullWidth size="small" required
                                    placeholder="Destination City"
                                    value={formData.dispatch_to}
                                    onChange={(e) => setFormData({ ...formData, dispatch_to: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2.5, bgcolor: "grey.50", fontWeight: 700, fontSize: "0.875rem" } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4} sx={{ display: { xs: "none", md: "block" } }} />
                            <Grid item xs={12} md={4}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>Dispatch Date *</Typography>
                                <TextField
                                    fullWidth size="small" required type="date"
                                    value={formData.dispatch_date}
                                    onChange={(e) => setFormData({ ...formData, dispatch_date: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2.5, bgcolor: "grey.50", fontWeight: 700, fontSize: "0.875rem" } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.500", textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>Expected Delivery Date *</Typography>
                                <TextField
                                    fullWidth size="small" required type="date"
                                    value={formData.expected_delivery_date}
                                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                                    InputProps={{ sx: { borderRadius: 2.5, bgcolor: "grey.50", fontWeight: 700, fontSize: "0.875rem" } }}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Consignment Items (partial-shipment tracking) */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "grey.200" }}>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, color: "grey.800", textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid", borderColor: "grey.100", pb: 1, mb: 2 }}>
                            <ReceiptLongIcon sx={{ color: "grey.400", fontSize: 16 }} /> Consignment Items — what's shipping in this trip
                        </Typography>
                        {!formData.purchase_order && !formData.proforma_invoice ? (
                            <Typography sx={{ fontSize: "0.72rem", color: "grey.400", fontStyle: "italic", py: 1 }}>
                                Select a {refType} above to load its items. Enter the quantity going in this shipment (partial dispatch allowed).
                            </Typography>
                        ) : consignmentLoading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={22} /></Box>
                        ) : consignmentItems.length === 0 ? (
                            <Typography sx={{ fontSize: "0.72rem", color: "grey.400", fontStyle: "italic", py: 1 }}>
                                No items found on this {refType}, or all items are fully dispatched.
                            </Typography>
                        ) : (
                            <TableContainer sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 2.5, overflow: "hidden" }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "grey.50" }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.6rem", color: "grey.600", textTransform: "uppercase", letterSpacing: 1 }}>Item</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.6rem", color: "grey.600", textTransform: "uppercase", letterSpacing: 1, textAlign: "right" }}>Ordered</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.6rem", color: "grey.600", textTransform: "uppercase", letterSpacing: 1, textAlign: "right" }}>Pending</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.6rem", color: "grey.600", textTransform: "uppercase", letterSpacing: 1, width: "20%", textAlign: "right" }}>Ship Now</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {consignmentItems.map((row) => (
                                            <TableRow key={row.key} hover>
                                                <TableCell sx={{ py: 1 }}>
                                                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "grey.800" }}>{row.product_name}</Typography>
                                                    <Typography sx={{ fontSize: "0.6rem", color: "grey.400", fontWeight: 700 }}>{row.product_code} · {row.unit}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 1, textAlign: "right", fontSize: "0.78rem", fontWeight: 700 }}>{row.ordered}</TableCell>
                                                <TableCell sx={{ py: 1, textAlign: "right", fontSize: "0.78rem", fontWeight: 800, color: row.pending > 0 ? "#c2410c" : "#059669" }}>{row.pending}</TableCell>
                                                <TableCell sx={{ py: 1 }}>
                                                    <TextField
                                                        fullWidth size="small" type="number"
                                                        inputProps={{ min: 0, max: row.pending, step: "0.01", style: { textAlign: "right" } }}
                                                        value={row.ship_qty}
                                                        disabled={row.pending <= 0}
                                                        onChange={(e) => handleConsignmentQtyChange(row.key, e.target.value)}
                                                        InputProps={{ sx: { borderRadius: 2, bgcolor: "grey.50", fontSize: "0.78rem", fontWeight: 700 } }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>

                    {/* Logistics Cost Breakdown Subtable */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "grey.200" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "grey.100", pb: 1, mb: 2 }}>
                            <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, color: "grey.800", textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                                <MonetizationOnIcon sx={{ color: "grey.400", fontSize: 16 }} /> Freight Cost Breakdown
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<AddIcon sx={{ fontSize: 12 }} />}
                                onClick={handleAddCostLine}
                                sx={{ fontSize: "0.6rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, color: "primary.main", bgcolor: "primary.50", borderRadius: 2, px: 1.5, "&:hover": { bgcolor: "primary.100" } }}
                            >
                                Add Cost line
                            </Button>
                        </Box>

                        <TableContainer sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 2.5, overflow: "hidden" }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "grey.50" }}>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.6rem", color: "grey.600", textTransform: "uppercase", letterSpacing: 1, width: "25%" }}>Cost Type</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.6rem", color: "grey.600", textTransform: "uppercase", letterSpacing: 1, width: "50%" }}>Description / Note</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.6rem", color: "grey.600", textTransform: "uppercase", letterSpacing: 1, width: "20%", textAlign: "right" }}>Amount (INR)</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.6rem", color: "grey.600", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {formData.cost_items.map((item, idx) => (
                                        <TableRow key={idx} hover>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Select
                                                    fullWidth
                                                    size="small"
                                                    required
                                                    value={item.cost_type}
                                                    onChange={(e) => handleCostItemChange(idx, "cost_type", e.target.value)}
                                                    sx={{ borderRadius: 2, bgcolor: "grey.50", fontSize: "0.75rem", fontWeight: 700 }}
                                                >
                                                    {COST_TYPES.map(type => (
                                                        <MenuItem key={type.value} value={type.value} sx={{ fontSize: "0.8rem" }}>{type.label}</MenuItem>
                                                    ))}
                                                </Select>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <TextField
                                                    fullWidth size="small"
                                                    placeholder="Transit insurance, toll charges, handling notes..."
                                                    value={item.description}
                                                    onChange={(e) => handleCostItemChange(idx, "description", e.target.value)}
                                                    InputProps={{ sx: { borderRadius: 2, bgcolor: "grey.50", fontSize: "0.75rem", fontWeight: 700 } }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <TextField
                                                    fullWidth size="small"
                                                    type="number"
                                                    required
                                                    inputProps={{ step: "0.01", min: "0" }}
                                                    value={item.amount || ""}
                                                    onChange={(e) => handleCostItemChange(idx, "amount", e.target.value)}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start" sx={{ "& .MuiTypography-root": { fontSize: "0.75rem", fontWeight: 700, color: "grey.400" } }}>&#8377;</InputAdornment>,
                                                        sx: { borderRadius: 2, bgcolor: "grey.50", fontSize: "0.75rem", fontWeight: 900, "& input": { textAlign: "right" } }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5, textAlign: "center" }}>
                                                <IconButton
                                                    size="small"
                                                    disabled={formData.cost_items.length <= 1}
                                                    onClick={() => handleRemoveCostLine(idx)}
                                                    sx={{ color: "grey.400", "&:hover": { color: "error.main", bgcolor: "grey.100" } }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow sx={{ bgcolor: "grey.50", "& td": { borderBottom: "none" } }}>
                                        <TableCell colSpan={2} sx={{ textAlign: "right", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1, color: "grey.500" }}>
                                            Total Logistics Cost
                                        </TableCell>
                                        <TableCell sx={{ textAlign: "right", fontWeight: 900, color: "grey.800", fontFamily: "monospace", fontSize: "0.9rem" }}>
                                            {formatCurrency(totalCost)}
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </TableContainer>
                    </Paper>
                </DialogContent>

                <DialogActions sx={{ bgcolor: "grey.50", px: 4, py: 2, borderTop: "1px solid", borderColor: "grey.200" }}>
                    <Button
                        onClick={() => setFormModal({ open: false, mode: "create", id: null })}
                        sx={{ borderRadius: 2.5, fontWeight: 900, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1.5, px: 3, py: 1, bgcolor: "grey.200", color: "grey.700", "&:hover": { bgcolor: "grey.300" } }}
                    >
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleFormSubmit}
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={14} sx={{ color: "white" }} /> : null}
                        sx={{ borderRadius: 2.5, fontWeight: 900, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1.5, px: 3, py: 1, boxShadow: "0 4px 14px 0 rgba(25,118,210,0.25)" }}
                    >
                        {submitting ? "SUBMITTING..." : "CONFIRM SHIPMENT LOG"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Quick Details View Dialog */}
            <Dialog
                open={!!viewingTransport}
                onClose={() => setViewingTransport(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, maxHeight: "85vh" } }}
            >
                {viewingTransport && (
                    <>
                        <DialogTitle sx={{ bgcolor: "grey.900", color: "white", py: 2.5, px: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: -0.5, display: "flex", alignItems: "center", gap: 1 }}>
                                        <LocalShippingIcon sx={{ color: "#60a5fa" }} /> Carrier Shipment Report
                                    </Typography>
                                    <Chip
                                        label={viewingTransport.status_display || viewingTransport.status || "Pending"}
                                        size="small"
                                        sx={{
                                            fontWeight: 900,
                                            fontSize: "0.6rem",
                                            textTransform: "uppercase",
                                            height: 22,
                                            ...(viewingTransport.status?.toUpperCase() === "DELIVERED"
                                                ? { bgcolor: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.3)" }
                                                : { bgcolor: "rgba(245,158,11,0.15)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.3)" }
                                            )
                                        }}
                                    />
                                </Box>
                                <Typography sx={{ fontSize: "0.6rem", color: "grey.400", fontWeight: 700, mt: 0.5, textTransform: "uppercase", letterSpacing: 2 }}>
                                    Reference ID: {viewingTransport.transport_number || `TRN/${viewingTransport.id.substring(0, 6).toUpperCase()}`}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setViewingTransport(null)} sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent sx={{ bgcolor: "grey.50", p: 4, display: "flex", flexDirection: "column", gap: 3, pt: "24px !important" }}>
                            {/* Milestone Tracker Banner */}
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "grey.200", display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", gap: 3 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: "0.6rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, mb: 0.5 }}>
                                        Logistics Route
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, fontWeight: 700, color: "grey.800" }}>
                                            <PlaceIcon sx={{ color: "success.main", fontSize: 18 }} />
                                            <Typography sx={{ fontWeight: 700 }}>{viewingTransport.dispatch_from}</Typography>
                                        </Box>
                                        <Box sx={{ height: 2, bgcolor: "grey.200", flex: 1, minWidth: 32, position: "relative", borderRadius: 1, overflow: "hidden" }}>
                                            <Box sx={{ position: "absolute", inset: 0, bgcolor: "primary.main", borderRadius: 1, width: "60%", animation: "pulse 2s infinite", "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.5 } } }} />
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, fontWeight: 700, color: "grey.800" }}>
                                            <PlaceIcon sx={{ color: "error.main", fontSize: 18 }} />
                                            <Typography sx={{ fontWeight: 700 }}>{viewingTransport.dispatch_to}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />
                                <Box sx={{ display: "flex", gap: 4 }}>
                                    <Box>
                                        <Typography sx={{ fontSize: "0.6rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>Dispatch Date</Typography>
                                        <Typography sx={{ fontWeight: 700, color: "grey.800" }}>{viewingTransport.dispatch_date}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: "0.6rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>Expected Arrival</Typography>
                                        <Typography sx={{ fontWeight: 700, color: "grey.800" }}>{viewingTransport.expected_delivery_date}</Typography>
                                    </Box>
                                </Box>
                            </Paper>

                            {/* Linked Reference & Carrier Details */}
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "grey.200", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                        <Box>
                                            <Typography sx={{ fontSize: "0.6rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>
                                                Linked Reference
                                            </Typography>
                                            {viewingTransport.po_number || viewingTransport.purchase_order_number ? (
                                                <Box>
                                                    <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", color: "grey.400", fontWeight: 700 }}>Purchase Order</Typography>
                                                    <Chip
                                                        label={viewingTransport.po_number || viewingTransport.purchase_order_number}
                                                        size="small"
                                                        sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontSize: "0.75rem", mt: 0.5 }}
                                                    />
                                                </Box>
                                            ) : viewingTransport.pi_number || viewingTransport.proforma_invoice_number ? (
                                                <Box>
                                                    <Typography sx={{ fontSize: "0.7rem", textTransform: "uppercase", color: "grey.400", fontWeight: 700 }}>Proforma Invoice</Typography>
                                                    <Chip
                                                        label={viewingTransport.pi_number || viewingTransport.proforma_invoice_number}
                                                        size="small"
                                                        sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontSize: "0.75rem", mt: 0.5 }}
                                                    />
                                                </Box>
                                            ) : (
                                                <Typography sx={{ color: "grey.400", fontStyle: "italic" }}>No Reference Logged</Typography>
                                            )}
                                        </Box>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "grey.200", height: "100%" }}>
                                        <Typography sx={{ fontSize: "0.6rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>
                                            Transporter identity
                                        </Typography>
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                            <Typography sx={{ fontWeight: 900, color: "grey.800" }}>{viewingTransport.transporter_name}</Typography>
                                            <Typography sx={{ fontSize: "0.62rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                                                Vehicle: <Box component="span" sx={{ color: "grey.800" }}>{viewingTransport.vehicle_number}</Box>
                                            </Typography>
                                            <Typography sx={{ fontSize: "0.62rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                                                Phone: <Box component="span" sx={{ color: "grey.800", fontFamily: "monospace" }}>{viewingTransport.transporter_contact}</Box>
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "grey.200", height: "100%" }}>
                                        <Typography sx={{ fontSize: "0.6rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>
                                            Driver particulars
                                        </Typography>
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                            <Typography sx={{ fontWeight: 700, color: "grey.800", display: "flex", alignItems: "center", gap: 0.75 }}>
                                                <PersonIcon sx={{ fontSize: 14, color: "grey.400" }} /> {viewingTransport.driver_name}
                                            </Typography>
                                            <Typography sx={{ fontSize: "0.62rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                                                Contact No: <Box component="span" sx={{ color: "grey.800", fontFamily: "monospace" }}>{viewingTransport.driver_contact}</Box>
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Carrier docs + Payment status */}
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "grey.200", height: "100%" }}>
                                        <Typography sx={{ fontSize: "0.6rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>
                                            Carrier Documents
                                        </Typography>
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                                            <Typography sx={{ fontSize: "0.72rem", color: "grey.500", fontWeight: 700 }}>
                                                LR / Consignment No.: <Box component="span" sx={{ color: "grey.800", fontFamily: "monospace" }}>{viewingTransport.lr_number || "—"}</Box>
                                            </Typography>
                                            <Typography sx={{ fontSize: "0.72rem", color: "grey.500", fontWeight: 700 }}>
                                                Transporter Invoice Ref.: <Box component="span" sx={{ color: "grey.800", fontFamily: "monospace" }}>{viewingTransport.invoice_reference || "—"}</Box>
                                            </Typography>
                                            <Typography sx={{ fontSize: "0.72rem", color: "grey.500", fontWeight: 700 }}>
                                                Direction: <Box component="span" sx={{ color: "grey.800" }}>{viewingTransport.direction === "SELL" ? "Outbound (Sale)" : viewingTransport.direction === "BUY" ? "Inbound (Purchase)" : "—"}</Box>
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "grey.200", height: "100%" }}>
                                        <Typography sx={{ fontSize: "0.6rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, mb: 1 }}>
                                            Transporter Payment
                                        </Typography>
                                        <Box sx={{ display: "flex", gap: 3 }}>
                                            <Box>
                                                <Typography sx={{ fontSize: "0.55rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase" }}>Paid</Typography>
                                                <Typography sx={{ fontWeight: 900, color: "#047857", fontSize: "0.9rem" }}>{formatCurrency(viewingTransport.amount_paid)}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontSize: "0.55rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase" }}>Balance</Typography>
                                                <Typography sx={{ fontWeight: 900, color: Number(viewingTransport.balance) > 0 ? "#dc2626" : "#059669", fontSize: "0.9rem" }}>{formatCurrency(viewingTransport.balance)}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontSize: "0.55rem", color: "grey.400", fontWeight: 700, textTransform: "uppercase" }}>Status</Typography>
                                                <Chip label={(viewingTransport.payment_status_display || viewingTransport.payment_status || "Unpaid")} size="small"
                                                    sx={{ fontWeight: 800, fontSize: "0.6rem", height: 20, mt: 0.25,
                                                        ...(viewingTransport.payment_status === "PAID" ? { bgcolor: "#ecfdf5", color: "#047857" }
                                                            : viewingTransport.payment_status === "PARTIALLY_PAID" ? { bgcolor: "#fffbeb", color: "#b45309" }
                                                            : { bgcolor: "#fef2f2", color: "#b91c1c" }) }} />
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Consignment items shipped in this trip */}
                            {(viewingTransport.consignment_items || []).length > 0 && (
                                <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", overflow: "hidden" }}>
                                    <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "grey.100", bgcolor: "grey.50", display: "flex", alignItems: "center", gap: 1 }}>
                                        <ReceiptLongIcon sx={{ color: "grey.400", fontSize: 16 }} />
                                        <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.800", textTransform: "uppercase", letterSpacing: 2 }}>
                                            Consignment Items (this shipment)
                                        </Typography>
                                    </Box>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: "grey.50" }}>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: "0.55rem", color: "grey.400", textTransform: "uppercase", letterSpacing: 1 }}>Item</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: "0.55rem", color: "grey.400", textTransform: "uppercase", letterSpacing: 1 }}>Code</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: "0.55rem", color: "grey.400", textTransform: "uppercase", letterSpacing: 1, textAlign: "right" }}>Qty</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {viewingTransport.consignment_items.map((ci, idx) => (
                                                    <TableRow key={idx} hover>
                                                        <TableCell sx={{ py: 1.5 }}><Typography sx={{ fontWeight: 700, color: "grey.700", fontSize: "0.8rem" }}>{ci.product_name}</Typography></TableCell>
                                                        <TableCell sx={{ py: 1.5 }}><Typography sx={{ fontSize: "0.72rem", color: "grey.500", fontFamily: "monospace" }}>{ci.product_code}</Typography></TableCell>
                                                        <TableCell sx={{ py: 1.5, textAlign: "right" }}><Typography sx={{ fontWeight: 800, color: "grey.800", fontSize: "0.8rem" }}>{ci.quantity} {ci.unit}</Typography></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            )}

                            {/* Cost Breakdown details */}
                            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "grey.200", overflow: "hidden" }}>
                                <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "grey.100", bgcolor: "grey.50", display: "flex", alignItems: "center", gap: 1 }}>
                                    <MonetizationOnIcon sx={{ color: "grey.400", fontSize: 16 }} />
                                    <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "grey.800", textTransform: "uppercase", letterSpacing: 2 }}>
                                        Freight &amp; Cargo Cost Breakdown
                                    </Typography>
                                </Box>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "grey.50" }}>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "0.55rem", color: "grey.400", textTransform: "uppercase", letterSpacing: 1, width: "33%" }}>Cost Type</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "0.55rem", color: "grey.400", textTransform: "uppercase", letterSpacing: 1, width: "50%" }}>Description</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: "0.55rem", color: "grey.400", textTransform: "uppercase", letterSpacing: 1, width: "20%", textAlign: "right" }}>Amount</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {(viewingTransport.cost_items || []).map((cost, idx) => {
                                                const typeLabel = cost.cost_type_display || COST_TYPES.find(t => t.value === cost.cost_type)?.label || cost.cost_type;
                                                return (
                                                    <TableRow key={idx} hover>
                                                        <TableCell sx={{ py: 1.5 }}>
                                                            <Typography sx={{ fontWeight: 700, color: "grey.700", fontSize: "0.8rem" }}>{typeLabel}</Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ py: 1.5 }}>
                                                            <Typography sx={{ fontSize: "0.75rem", color: "grey.500" }}>{cost.description || "—"}</Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ py: 1.5, textAlign: "right" }}>
                                                            <Typography sx={{ fontWeight: 900, color: "grey.800", fontFamily: "monospace", fontSize: "0.8rem" }}>{formatCurrency(cost.amount)}</Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow sx={{ bgcolor: "grey.50", "& td": { borderBottom: "none" } }}>
                                                <TableCell colSpan={2} sx={{ textAlign: "right", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1, color: "grey.500" }}>
                                                    Total freight shipment cost
                                                </TableCell>
                                                <TableCell sx={{ textAlign: "right", fontWeight: 900, color: "grey.800", fontFamily: "monospace", fontSize: "0.9rem" }}>
                                                    {formatCurrency(viewingTransport.total_cost || (viewingTransport.cost_items || []).reduce((s, c) => s + parseFloat(c.amount || 0), 0))}
                                                </TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </DialogContent>

                        <DialogActions sx={{ bgcolor: "grey.50", px: 4, py: 2, borderTop: "1px solid", borderColor: "grey.200" }}>
                            {viewingTransport.status?.toUpperCase() !== "DELIVERED" && (
                                <Button
                                    variant="contained"
                                    startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
                                    onClick={() => handleMarkDelivered(viewingTransport)}
                                    sx={{
                                        borderRadius: 2.5,
                                        fontWeight: 900,
                                        fontSize: "0.7rem",
                                        textTransform: "uppercase",
                                        letterSpacing: 1.5,
                                        px: 3,
                                        py: 1,
                                        bgcolor: "#059669",
                                        "&:hover": { bgcolor: "#047857" },
                                        boxShadow: "0 4px 14px 0 rgba(5,150,105,0.25)"
                                    }}
                                >
                                    Mark Delivered
                                </Button>
                            )}
                            <Button
                                onClick={() => setViewingTransport(null)}
                                sx={{ borderRadius: 2.5, fontWeight: 900, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: 1.5, px: 3, py: 1, bgcolor: "grey.200", color: "grey.700", "&:hover": { bgcolor: "grey.300" } }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </>
    );
};

export default TransportList;
