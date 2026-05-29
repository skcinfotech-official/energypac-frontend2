import React, { useState, useEffect, useRef } from "react";
import {
    FaTruck,
    FaSearch,
    FaPlus,
    FaTrash,
    FaEdit,
    FaEye,
    FaCalendarAlt,
    FaUser,
    FaPhone,
    FaMapMarkerAlt,
    FaChevronDown,
    FaTimes,
    FaCoins,
    FaInfoCircle,
    FaFileInvoiceDollar,
    FaCheck,
    FaLink
} from "react-icons/fa";
import { getTransports, createTransport, updateTransport, markTransportDelivered, getTransportsByPO, getTransportsByPI, getLandedCostPO, getLandedCostPI } from "../services/transportService";
import { fetchPurchaseOrders } from "../services/purchaseOrderService";
import { getProformaInvoices } from "../services/salesService";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";

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
        transporter_name: "",
        transporter_contact: "",
        vehicle_number: "",
        driver_name: "",
        driver_contact: "",
        dispatch_date: "",
        expected_delivery_date: "",
        dispatch_from: "",
        dispatch_to: "",
        cost_items: []
    });

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
            } else {
                data = await getTransports(pageNum, searchQuery);
                if (data) {
                    setTransports(data.results || []);
                    setTotalCount(data.count || 0);
                    setNext(data.next);
                    setPrevious(data.previous);
                    setPage(pageNum);
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

    // Handle reference selection
    const handleRefSelect = (item) => {
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
        setIsRefDropdownOpen(false);
        setRefSearch("");
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
            setFormData({
                purchase_order: null,
                proforma_invoice: null,
                linked_number: "",
                transporter_name: "",
                transporter_contact: "",
                vehicle_number: "",
                driver_name: "",
                driver_contact: "",
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
            setFormData({
                purchase_order: poId || null,
                proforma_invoice: piId || null,
                linked_number: transportObj.po_number || transportObj.pi_number || transportObj.purchase_order_number || transportObj.proforma_invoice_number || "Linked Ref",
                transporter_name: transportObj.transporter_name || "",
                transporter_contact: transportObj.transporter_contact || "",
                vehicle_number: transportObj.vehicle_number || "",
                driver_name: transportObj.driver_name || "",
                driver_contact: transportObj.driver_contact || "",
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
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.purchase_order && !formData.proforma_invoice) {
            setAlert({ open: true, type: "error", message: "Please select a Purchase Order or Proforma Invoice first." });
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

            const payload = {
                purchase_order: formData.purchase_order,
                proforma_invoice: formData.proforma_invoice,
                transporter_name: formData.transporter_name,
                transporter_contact: formData.transporter_contact,
                vehicle_number: formData.vehicle_number,
                driver_name: formData.driver_name,
                driver_contact: formData.driver_contact,
                dispatch_date: formData.dispatch_date,
                expected_delivery_date: formData.expected_delivery_date,
                dispatch_from: formData.dispatch_from,
                dispatch_to: formData.dispatch_to,
                cost_items: cleanedCostItems
            };

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
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-1">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <FaTruck className="text-blue-600" />
                            Logistics &amp; Transport Management
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium ">Track vehicle routing, logistical cost breakdowns, and freight delivery details against POs and PIs</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleOpenForm("create")}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                            <FaPlus className="text-xs" />
                            LOG NEW SHIPMENT
                        </button>
                        <div className="bg-slate-50 px-5 py-2 rounded-xl border border-slate-200">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Logistics Cost (Page)</p>
                            <p className="text-xl font-black text-slate-800 leading-tight">{formatCurrency(totalTransportsCost)}</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Search query */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Search Transporter / Driver / Vehicle / Ref</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="E.g. Blue Dart, Raju, MH12AB..., TRN/..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            />
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    {/* Filter Shipments by Link Category */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Filter Shipments by Link Category</label>
                        <div className="flex bg-slate-100 p-1.5 rounded-xl shadow-inner border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setDocTypeFilter("ALL")}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${docTypeFilter === "ALL" ? "bg-white text-blue-600 shadow animate-fade-in" : "text-slate-500"}`}
                            >
                                All Shipments
                            </button>
                            <button
                                type="button"
                                onClick={() => setDocTypeFilter("PO")}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${docTypeFilter === "PO" ? "bg-white text-blue-600 shadow animate-fade-in" : "text-slate-500"}`}
                            >
                                All PO
                            </button>
                            <button
                                type="button"
                                onClick={() => setDocTypeFilter("PI")}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${docTypeFilter === "PI" ? "bg-white text-blue-600 shadow animate-fade-in" : "text-slate-500"}`}
                            >
                                All PI
                            </button>
                        </div>
                    </div>

                    {/* Landed Cost Selector */}
                    <div className="relative" ref={filterDropdownRef}>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Landed Cost Reference Selector</label>
                        <div className="flex gap-2">
                            <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200 self-start">
                                <button
                                    type="button"
                                    onClick={() => { setFilterRefType("PO"); setFilterRefSearch(""); setFilterRefList([]); }}
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${filterRefType === "PO" ? "bg-white text-blue-600 shadow animate-fade-in" : "text-slate-500"}`}
                                >
                                    PO
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setFilterRefType("PI"); setFilterRefSearch(""); setFilterRefList([]); }}
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${filterRefType === "PI" ? "bg-white text-blue-600 shadow animate-fade-in" : "text-slate-500"}`}
                                >
                                    PI
                                </button>
                            </div>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    readOnly={!!selectedFilterDoc}
                                    value={selectedFilterDoc ? selectedFilterDoc.label : filterRefSearch}
                                    onClick={() => !selectedFilterDoc && setIsFilterRefDropdownOpen(true)}
                                    onChange={(e) => { setFilterRefSearch(e.target.value); setIsFilterRefDropdownOpen(true); }}
                                    placeholder={`Search linked ${filterRefType}...`}
                                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                />
                                {selectedFilterDoc ? (
                                    <button
                                        type="button"
                                        onClick={handleClearFilterDoc}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1 transition-colors"
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                ) : (
                                    <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                                )}
                            </div>
                        </div>

                        {/* Dropdown Results */}
                        {isFilterRefDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-52 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                {filterRefLoading ? (
                                    <div className="p-3 text-center text-[10px] text-slate-400 font-bold uppercase animate-pulse">Searching active docs...</div>
                                ) : filterRefList.length > 0 ? (
                                    filterRefList.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleSelectFilterDoc(item)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 font-bold transition-all border-b border-slate-100 flex items-center justify-between text-[11px]"
                                        >
                                            <span>{filterRefType === "PO" ? item.po_number : item.pi_number}</span>
                                            <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{item.client_name || item.vendor_name || "Active"}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-3 text-center text-[10px] text-slate-400 font-bold uppercase">No matching references found</div>
                                )}
                            </div>
                        )}

                        {/* Landed Cost Calculated details right underneath */}
                        {selectedFilterDoc && (
                            <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl p-2.5 flex items-center justify-between animate-fade-in">
                                <span>Landed Cost (<strong className="font-mono text-[10px]">{selectedFilterDoc.label}</strong>):</span>
                                <strong className="font-mono text-emerald-700">{formatCurrency(landedCostData?.landed_cost || 0)}</strong>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table list */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transport Ref &amp; Dates</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Associated PO / PI</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transporter &amp; Vehicle</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Driver Details</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dispatch Route</th>
                                    <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Freight Cost</th>
                                    <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading && filteredTransports.length === 0 ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="7" className="px-6 py-10"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                        </tr>
                                    ))
                                ) : filteredTransports.length > 0 ? (
                                    filteredTransports.map((trn) => {
                                        const totalTrnCost = trn.total_cost ? parseFloat(trn.total_cost) : (trn.cost_items || []).reduce((s, cost) => s + parseFloat(cost.amount || 0), 0);
                                        return (
                                            <tr key={trn.id} className="group hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100 self-start text-xs">
                                                                {trn.transport_number || `TRN/${trn.id.substring(0,6).toUpperCase()}`}
                                                            </span>
                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                                trn.status?.toUpperCase() === "DELIVERED" 
                                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                                            }`}>
                                                                {trn.status_display || trn.status || "Pending"}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1.5">
                                                            <FaCalendarAlt size={10} />
                                                            Disp: {trn.dispatch_date}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                                                            <FaCalendarAlt size={10} />
                                                            Exp: {trn.expected_delivery_date}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-slate-700 font-medium">
                                                        {trn.po_number || trn.purchase_order_number ? (
                                                            <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 self-start">
                                                                PO: {trn.po_number || trn.purchase_order_number}
                                                            </span>
                                                        ) : trn.pi_number || trn.proforma_invoice_number ? (
                                                            <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 self-start">
                                                                PI: {trn.pi_number || trn.proforma_invoice_number}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 italic">No Ref linked</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800">{trn.transporter_name}</span>
                                                        <span className="text-[11px] text-slate-400 font-bold uppercase">{trn.vehicle_number}</span>
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><FaPhone size={10}/> {trn.transporter_contact}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                            <FaUser size={11} className="text-slate-400" />
                                                            {trn.driver_name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1"><FaPhone size={10}/> {trn.driver_contact}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-xs font-semibold text-slate-600">
                                                        <span className="flex items-center gap-1"><FaMapMarkerAlt size={10} className="text-emerald-500"/> From: {trn.dispatch_from}</span>
                                                        <span className="flex items-center gap-1 mt-1"><FaMapMarkerAlt size={10} className="text-red-500"/> To: {trn.dispatch_to}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-black text-slate-800">{formatCurrency(totalTrnCost)}</span>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{(trn.cost_items || []).length} Cost items</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setViewingTransport(trn)}
                                                            className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90"
                                                            title="Quick View"
                                                        >
                                                            <FaEye size={14} />
                                                        </button>
                                                        <button
                                                             onClick={() => handleOpenForm("edit", trn)}
                                                             className="p-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all active:scale-90"
                                                             title="Modify records"
                                                         >
                                                             <FaEdit size={14} />
                                                         </button>
                                                        {trn.status?.toUpperCase() !== "DELIVERED" && (
                                                            <button
                                                                onClick={() => handleMarkDelivered(trn)}
                                                                className="p-2 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all active:scale-90"
                                                                title="Mark Delivered"
                                                            >
                                                                <FaCheck size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                                    <FaTruck size={32} />
                                                </div>
                                                <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No logistical shipments logged</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            Showing <span className="text-slate-800">{filteredTransports.length}</span> of <span className="text-slate-800">{totalCount}</span> shipments
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handlePrev}
                                disabled={!previous}
                                className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm hover:shadow active:scale-95"
                            >
                                PREVIOUS
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!next}
                                className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm hover:shadow active:scale-95"
                            >
                                NEXT PAGE
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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
                icon={FaCheck}
                iconBgClass="bg-emerald-100 text-emerald-600"
            />

            {/* Log / Edit form Modal */}
            {formModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setFormModal({ open: false, mode: "create", id: null })}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                    <FaTruck className="text-blue-400" />
                                    {formModal.mode === "create" ? "Log Logistical Transport shipment" : "Modify Transport Logistics Records"}
                                </h3>
                                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Specify dispatch routes and cost items</p>
                            </div>
                            <button onClick={() => setFormModal({ open: false, mode: "create", id: null })} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FaTimes size={18} /></button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto bg-slate-50 p-8 space-y-6">
                            {/* Ref Select Section */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <FaLink className="text-slate-400" /> Associated Documents Reference
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Reference Type</label>
                                        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
                                            <button
                                                type="button"
                                                onClick={() => { setRefType("PO"); setFormData(prev => ({ ...prev, purchase_order: null, proforma_invoice: null, linked_number: "" })); }}
                                                className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${refType === "PO" ? "bg-white text-blue-600 shadow" : "text-slate-500"}`}
                                            >
                                                Purchase Order (PO)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setRefType("PI"); setFormData(prev => ({ ...prev, purchase_order: null, proforma_invoice: null, linked_number: "" })); }}
                                                className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${refType === "PI" ? "bg-white text-blue-600 shadow" : "text-slate-500"}`}
                                            >
                                                Proforma Invoice (PI)
                                            </button>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 relative" ref={dropdownRef}>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Select {refType} *</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                readOnly={!!formData.purchase_order || !!formData.proforma_invoice}
                                                value={formData.linked_number || refSearch}
                                                onClick={() => !formData.linked_number && setIsRefDropdownOpen(true)}
                                                onChange={(e) => { setRefSearch(e.target.value); setIsRefDropdownOpen(true); }}
                                                placeholder={`Click to search and select linked active ${refType}...`}
                                                className="w-full pl-5 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
                                            />
                                            {formData.linked_number ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, purchase_order: null, proforma_invoice: null, linked_number: "" }))}
                                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1 transition-colors"
                                                >
                                                    <FaTimes size={14} />
                                                </button>
                                            ) : (
                                                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            )}
                                        </div>

                                        {/* Autocomplete Ref Select Dropdown */}
                                        {isRefDropdownOpen && (
                                            <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                                {refLoading ? (
                                                    <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase animate-pulse">Searching active references...</div>
                                                ) : refList.length > 0 ? (
                                                    refList.map((item) => (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => handleRefSelect(item)}
                                                            className="w-full text-left px-5 py-3 hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 font-bold transition-all border-b border-slate-100 flex items-center justify-between text-xs"
                                                        >
                                                            <span>{refType === "PO" ? item.po_number : item.pi_number}</span>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{item.client_name || item.vendor_name || "Active"}</span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase">No matching references found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Logistics Details Grid */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <FaTruck className="text-slate-400" /> Carrier &amp; Dispatch Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Transporter Name *</label>
                                        <input
                                            type="text" required
                                            placeholder="E.g. Blue Dart Logistics"
                                            value={formData.transporter_name}
                                            onChange={(e) => setFormData({ ...formData, transporter_name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Transporter Contact *</label>
                                        <input
                                            type="text" required
                                            placeholder="10 digit phone number"
                                            value={formData.transporter_contact}
                                            onChange={(e) => setFormData({ ...formData, transporter_contact: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Vehicle Number *</label>
                                        <input
                                            type="text" required
                                            placeholder="E.g. MH12AB1234"
                                            value={formData.vehicle_number}
                                            onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Driver Name *</label>
                                        <input
                                            type="text" required
                                            placeholder="Driver full name"
                                            value={formData.driver_name}
                                            onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Driver Contact *</label>
                                        <input
                                            type="text" required
                                            placeholder="Driver phone number"
                                            value={formData.driver_contact}
                                            onChange={(e) => setFormData({ ...formData, driver_contact: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <span className="hidden md:inline">&nbsp;</span>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Dispatch From *</label>
                                        <input
                                            type="text" required
                                            placeholder="City of Origin"
                                            value={formData.dispatch_from}
                                            onChange={(e) => setFormData({ ...formData, dispatch_from: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Dispatch To *</label>
                                        <input
                                            type="text" required
                                            placeholder="Destination City"
                                            value={formData.dispatch_to}
                                            onChange={(e) => setFormData({ ...formData, dispatch_to: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <span className="hidden md:inline">&nbsp;</span>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Dispatch Date *</label>
                                        <input
                                            type="date" required
                                            value={formData.dispatch_date}
                                            onChange={(e) => setFormData({ ...formData, dispatch_date: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Expected Delivery Date *</label>
                                        <input
                                            type="date" required
                                            value={formData.expected_delivery_date}
                                            onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Logistics Cost Breakdown Subtable */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                        <FaCoins className="text-slate-400" /> Freight Cost Breakdown
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={handleAddCostLine}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-black rounded-lg text-[10px] uppercase tracking-wider transition-colors active:scale-95"
                                    >
                                        <FaPlus size={8} /> Add Cost line
                                    </button>
                                </div>

                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                                            <tr>
                                                <th className="px-5 py-3 w-1/4">Cost Type</th>
                                                <th className="px-5 py-3 w-1/2">Description / Note</th>
                                                <th className="px-5 py-3 w-1/5 text-right">Amount (INR)</th>
                                                <th className="px-5 py-3 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {formData.cost_items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <select
                                                            required
                                                            value={item.cost_type}
                                                            onChange={(e) => handleCostItemChange(idx, "cost_type", e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                                                        >
                                                            {COST_TYPES.map(type => (
                                                                <option key={type.value} value={type.value}>{type.label}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Transit insurance, toll charges, handling notes..."
                                                            value={item.description}
                                                            onChange={(e) => handleCostItemChange(idx, "description", e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                                                        />
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        <div className="relative">
                                                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</div>
                                                            <input
                                                                type="number" step="0.01" min="0" required
                                                                value={item.amount || ""}
                                                                onChange={(e) => handleCostItemChange(idx, "amount", e.target.value)}
                                                                className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-right outline-none focus:border-blue-500"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            disabled={formData.cost_items.length <= 1}
                                                            onClick={() => handleRemoveCostLine(idx)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition-colors"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                                            <tr>
                                                <td colSpan="2" className="px-5 py-3 text-right uppercase tracking-wider text-slate-500">Total Logistics Cost</td>
                                                <td className="px-5 py-3 text-right font-black text-slate-800 font-mono text-sm">{formatCurrency(totalCost)}</td>
                                                <td>&nbsp;</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </form>

                        {/* Modal Footer */}
                        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setFormModal({ open: false, mode: "create", id: null })}
                                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={handleFormSubmit}
                                disabled={submitting}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                            >
                                {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {submitting ? "SUBMITTING..." : "CONFIRM SHIPMENT LOG"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Details View Modal */}
            {viewingTransport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewingTransport(null)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                                    <FaTruck className="text-blue-400" /> Carrier Shipment Report
                                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                                        viewingTransport.status?.toUpperCase() === "DELIVERED" 
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    }`}>
                                        {viewingTransport.status_display || viewingTransport.status || "Pending"}
                                    </span>
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                                    Reference ID: {viewingTransport.transport_number || `TRN/${viewingTransport.id.substring(0,6).toUpperCase()}`}
                                </p>
                            </div>
                            <button onClick={() => setViewingTransport(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FaTimes size={18} /></button>
                        </div>

                        {/* Body */}
                        <div className="p-8 overflow-y-auto bg-slate-50 space-y-6 flex-1 text-sm">
                            {/* Milestone Tracker Banner */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1 space-y-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Logistics Route</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 font-bold text-slate-800">
                                            <FaMapMarkerAlt className="text-emerald-500" /> {viewingTransport.dispatch_from}
                                        </div>
                                        <div className="h-0.5 bg-slate-200 w-12 flex-1 relative min-w-8">
                                            <div className="absolute inset-0 bg-blue-500 rounded animate-pulse" style={{width: '60%'}}></div>
                                        </div>
                                        <div className="flex items-center gap-1 font-bold text-slate-800">
                                            <FaMapMarkerAlt className="text-red-500" /> {viewingTransport.dispatch_to}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-px bg-slate-200 hidden md:block"></div>
                                <div className="flex gap-8">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Dispatch Date</span>
                                        <span className="font-bold text-slate-800">{viewingTransport.dispatch_date}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Expected Arrival</span>
                                        <span className="font-bold text-slate-800">{viewingTransport.expected_delivery_date}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Linked Reference & Carrier Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">Linked Reference</span>
                                        {viewingTransport.po_number || viewingTransport.purchase_order_number ? (
                                            <div className="font-bold text-slate-800">
                                                <p className="text-xs uppercase text-slate-400 font-bold">Purchase Order</p>
                                                <p className="font-mono text-blue-700 bg-blue-50 border border-blue-100 rounded px-2.5 py-1 inline-block mt-1 font-bold text-xs">{viewingTransport.po_number || viewingTransport.purchase_order_number}</p>
                                            </div>
                                        ) : viewingTransport.pi_number || viewingTransport.proforma_invoice_number ? (
                                            <div className="font-bold text-slate-800">
                                                <p className="text-xs uppercase text-slate-400 font-bold">Proforma Invoice</p>
                                                <p className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2.5 py-1 inline-block mt-1 font-bold text-xs">{viewingTransport.pi_number || viewingTransport.proforma_invoice_number}</p>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">No Reference Logged</span>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">Transporter identity</span>
                                    <div className="space-y-1">
                                        <p className="font-black text-slate-800">{viewingTransport.transporter_name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vehicle: <span className="text-slate-800">{viewingTransport.vehicle_number}</span></p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone: <span className="text-slate-800 font-mono">{viewingTransport.transporter_contact}</span></p>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">Driver particulars</span>
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-800 flex items-center gap-1.5"><FaUser size={11} className="text-slate-400" /> {viewingTransport.driver_name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact No: <span className="text-slate-800 font-mono">{viewingTransport.driver_contact}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Cost Breakdown details */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FaCoins className="text-slate-400" />
                                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Freight &amp; Cargo Cost Breakdown</h4>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100 uppercase text-[9px] tracking-wider text-slate-400">
                                                <th className="px-5 py-3 w-1/3">Cost Type</th>
                                                <th className="px-5 py-3 w-1/2">Description</th>
                                                <th className="px-5 py-3 w-1/5 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(viewingTransport.cost_items || []).map((cost, idx) => {
                                                const typeLabel = cost.cost_type_display || COST_TYPES.find(t => t.value === cost.cost_type)?.label || cost.cost_type;
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50/20 transition-colors">
                                                        <td className="px-5 py-3.5">
                                                            <span className="font-bold text-slate-700">{typeLabel}</span>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span className="text-xs text-slate-500">{cost.description || "—"}</span>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-right">
                                                            <span className="font-black text-slate-800 font-mono">{formatCurrency(cost.amount)}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-100 font-bold text-xs">
                                            <tr>
                                                <td colSpan="2" className="px-5 py-3 text-right uppercase tracking-wider text-slate-500">Total freight shipment cost</td>
                                                <td className="px-5 py-3 text-right font-black text-slate-800 font-mono text-sm">
                                                    {formatCurrency(viewingTransport.total_cost || (viewingTransport.cost_items || []).reduce((s, c) => s + parseFloat(c.amount || 0), 0))}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end gap-3">
                            {viewingTransport.status?.toUpperCase() !== "DELIVERED" && (
                                <button
                                    onClick={() => handleMarkDelivered(viewingTransport)}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                                >
                                    <FaCheck size={12} />
                                    Mark Delivered
                                </button>
                            )}
                            <button
                                onClick={() => setViewingTransport(null)}
                                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TransportList;
