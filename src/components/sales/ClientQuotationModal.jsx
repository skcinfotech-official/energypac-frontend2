import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaTrash, FaCheck, FaBoxOpen, FaFileAlt, FaExclamationTriangle, FaSearch } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { fetchRequisitions } from "../../services/requisition";
import { createProformaInvoice, updateProformaInvoice, getRequisitionItemsForPi, getStockItemsForPi } from "../../services/salesService";
import { previewProfit } from "../../services/financeService";
import { getCurrencies } from "../../services/currencyService";

const ClientQuotationModal = ({ isOpen, onClose, onSuccess, invoice = null }) => {
    const isEdit = !!invoice;

    const [piMode, setPiMode] = useState("requisition");
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
    const [items, setItems] = useState([]);
    const [terms, setTerms] = useState([
        { id: 1, key: "Shipment", value: "within 45 days" },
        { id: 2, key: "Inspection", value: "Inspection certificate required" }
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [loadingItems, setLoadingItems] = useState(false);
    const [profitPreview, setProfitPreview] = useState(null);

    const [stockProducts, setStockProducts] = useState([]);
    const [stockSearch, setStockSearch] = useState("");
    const [loadingStock, setLoadingStock] = useState(false);
    const [currencyList, setCurrencyList] = useState([]);

    useEffect(() => {
        if (isOpen) {
            const fetchReqList = async () => {
                try {
                    const response = await fetchRequisitions(1, "", "", "");
                    setRequisitions(response.data?.results || []);
                } catch (err) {
                    console.error("Failed to fetch requisitions", err);
                }
            };
            fetchReqList();

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
                setPiMode(invoice.is_stock_sale ? "stock_sale" : "requisition");
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

                const populatedTerms = (invoice.terms_and_conditions || []).map((termStr, index) => {
                    const colonIdx = termStr.indexOf(":");
                    if (colonIdx !== -1) {
                        const key = termStr.substring(0, colonIdx).trim();
                        const value = termStr.substring(colonIdx + 1).trim();
                        return { id: index + 1, key, value };
                    }
                    return { id: index + 1, key: "", value: termStr.trim() };
                });
                setTerms(populatedTerms.length > 0 ? populatedTerms : [
                    { id: 1, key: "Shipment", value: "within 45 days" },
                    { id: 2, key: "Inspection", value: "Inspection certificate required" }
                ]);
            } else {
                setPiMode("requisition");
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
                setTerms([
                    { id: 1, key: "Shipment", value: "within 45 days" },
                    { id: 2, key: "Inspection", value: "Inspection certificate required" }
                ]);
                setStockProducts([]);
                setStockSearch("");
            }
            setError("");
            setProfitPreview(null);
        }
    }, [isOpen, invoice]);

    const handleModeChange = (mode) => {
        if (isEdit) return;
        setPiMode(mode);
        setItems([]);
        setFormData(prev => ({ ...prev, requisition: "" }));
        setProfitPreview(null);
        setError("");
    };

    // Fetch requisition items
    const handleRequisitionChange = async (e) => {
        const reqId = e.target.value;
        setFormData(prev => ({ ...prev, requisition: reqId }));

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

    // Stock sale: load available stock products
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
        setTerms([...terms, { id: Date.now(), key: "", value: "" }]);
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

    // Profit preview (only for requisition-based PI)
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
                requisition: piMode === "stock_sale" ? null : formData.requisition,
                items: selectedItems.map(it => ({
                    product: it.product,
                    hsn_code: it.hsn_code,
                    quantity: Number(it.quantity),
                    unit_price: Number(it.unit_price)
                })),
                terms_and_conditions: terms
                    .filter(t => t.value.trim() !== "")
                    .map(t => {
                        if (t.key.trim() !== "") {
                            return `${t.key}: ${t.value}`;
                        }
                        return t.value;
                    })
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

    if (!isOpen) return null;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'COMPLETED': return <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-md">PURCHASED</span>;
            case 'PO_CREATED': return <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-md">PO CREATED</span>;
            case 'PENDING': return <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded-md">NO PO</span>;
            case 'FULLY_ALLOCATED': return <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded-md">ALREADY IN PI</span>;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {isEdit ? "Edit Proforma Invoice" : "Create Proforma Invoice"}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {piMode === "stock_sale" ? "Sell items directly from stock (no requisition)" : "Issue proforma invoice against a requisition"}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all">
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-semibold flex items-start gap-2">
                            <FaExclamationTriangle className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form id="proforma-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* PI MODE TOGGLE */}
                        {!isEdit && (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleModeChange("requisition")}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                        piMode === "requisition"
                                            ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                    }`}
                                >
                                    <FaFileAlt size={14} />
                                    Requisition PI
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleModeChange("stock_sale")}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                        piMode === "stock_sale"
                                            ? "bg-amber-50 border-amber-500 text-amber-700 shadow-sm"
                                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                    }`}
                                >
                                    <FaBoxOpen size={14} />
                                    Stock Sale (Direct)
                                </button>
                            </div>
                        )}

                        {/* REQUISITION & CORE FIELDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {piMode === "requisition" ? (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">
                                        Requisition Reference *
                                    </label>
                                    <select
                                        name="requisition"
                                        value={formData.requisition}
                                        onChange={handleRequisitionChange}
                                        className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                                        required
                                        disabled={isEdit}
                                    >
                                        <option value="">Select Requisition</option>
                                        {isEdit ? (
                                            <option value={formData.requisition}>{invoice?.requisition_number || "Active Requisition"}</option>
                                        ) : (
                                            requisitions.map(req => (
                                                <option key={req.id} value={req.id}>
                                                    {req.requisition_number}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            ) : (
                                <div className="flex items-end">
                                    <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-bold text-amber-700 w-full text-center">
                                        Direct Stock Sale — No Requisition
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">
                                    PI Date *
                                </label>
                                <input
                                    type="date"
                                    name="pi_date"
                                    value={formData.pi_date}
                                    onChange={handleInputChange}
                                    className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">
                                    Payment Due Date *
                                </label>
                                <input
                                    type="date"
                                    name="payment_due_date"
                                    value={formData.payment_due_date}
                                    onChange={handleInputChange}
                                    className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold"
                                    required
                                />
                            </div>
                        </div>

                        {/* FINANCIAL & EXPORTER REFERENCE DETAILS */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Currency *</label>
                                <select name="currency" value={formData.currency} onChange={handleInputChange} className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-bold" required>
                                    {currencyList.length > 0 ? currencyList.map(c => (
                                        <option key={c.id} value={c.code}>{c.code} ({c.symbol || c.name})</option>
                                    )) : (
                                        <>
                                            <option value="USD">USD ($)</option>
                                            <option value="INR">INR (₹)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            {formData.currency !== "INR" && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Conversion Rate (1 {formData.currency} = ₹?) *</label>
                                    <input type="number" step="0.0001" name="conversion_rate" value={formData.conversion_rate} onChange={handleInputChange} className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-bold" required />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">L/C Number</label>
                                <input type="text" name="lc_number" value={formData.lc_number} onChange={handleInputChange} placeholder="e.g. LC-2026-001" className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Exporter Ref</label>
                                <input type="text" name="exporter_reference" value={formData.exporter_reference} onChange={handleInputChange} placeholder="e.g. REF-010" className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">GST Number</label>
                                <input type="text" name="gst_number" value={formData.gst_number} onChange={handleInputChange} placeholder="e.g. 19AABCE..." className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
                            </div>
                        </div>

                        {/* PARTIES INFORMATION */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Exporter Beneficiary *</label>
                                <input type="text" name="exporter_beneficiary" value={formData.exporter_beneficiary} onChange={handleInputChange} className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Consignee *</label>
                                <input type="text" name="consignee" value={formData.consignee} onChange={handleInputChange} placeholder="e.g. ABC Corp, Dubai" className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Applicant Importer *</label>
                                <input type="text" name="applicant_importer" value={formData.applicant_importer} onChange={handleInputChange} placeholder="e.g. ABC Trading LLC, UAE" className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold" required />
                            </div>
                        </div>

                        {/* SHIPPING & LOGISTICS */}
                        <div className="p-4 bg-blue-50/20 rounded-2xl border border-blue-100/40 space-y-4">
                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Shipping & Logistics</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Port of Loading</label><input type="text" name="port_of_loading" value={formData.port_of_loading} onChange={handleInputChange} className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 text-xs font-semibold" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Port of Discharge</label><input type="text" name="port_of_discharge" value={formData.port_of_discharge} onChange={handleInputChange} placeholder="e.g. Benapole Land Port" className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 text-xs font-semibold" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Pre-carriage By</label><input type="text" name="pre_carriage_by" value={formData.pre_carriage_by} onChange={handleInputChange} placeholder="e.g. BY ROAD" className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 text-xs font-semibold" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Place of Receipt</label><input type="text" name="place_of_receipt" value={formData.place_of_receipt} onChange={handleInputChange} placeholder="e.g. PETRAPOLE LCS" className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 text-xs font-semibold" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Country of Origin</label><input type="text" name="country_of_origin" value={formData.country_of_origin} onChange={handleInputChange} className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 text-xs font-semibold" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Final Destination</label><input type="text" name="final_destination" value={formData.final_destination} onChange={handleInputChange} className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 text-xs font-semibold" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Terms of Delivery</label><input type="text" name="terms_of_delivery" value={formData.terms_of_delivery} onChange={handleInputChange} placeholder="e.g. FOB Kolkata" className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 text-xs font-semibold" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Terms of Payment</label><input type="text" name="terms_of_payment" value={formData.terms_of_payment} onChange={handleInputChange} placeholder="e.g. Irrevocable L/C at sight" className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 text-xs font-semibold" /></div>
                            </div>
                        </div>

                        {/* STOCK SALE: Product Search & Add */}
                        {piMode === "stock_sale" && !isEdit && (
                            <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100 space-y-3">
                                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                                    <FaBoxOpen size={12} /> Add Products from Stock
                                </h4>
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                    <input
                                        type="text"
                                        value={stockSearch}
                                        onChange={(e) => setStockSearch(e.target.value)}
                                        placeholder="Search products by name or code..."
                                        className="input w-full pl-9 pr-4 py-2 rounded-xl border-slate-200 focus:ring-2 focus:ring-amber-500 text-sm"
                                    />
                                </div>
                                {loadingStock ? (
                                    <p className="text-xs text-slate-400 text-center py-3">Loading stock items...</p>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                        {filteredStock.length === 0 ? (
                                            <p className="text-xs text-slate-400 text-center py-3 italic">
                                                {stockSearch ? "No matching products found" : "No products with stock available"}
                                            </p>
                                        ) : filteredStock.map(p => (
                                            <div key={p.product_id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all">
                                                <div>
                                                    <div>
                                                        <span className="text-sm font-semibold text-slate-800">{p.product_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono ml-2">{p.product_code}</span>
                                                        <span className="text-[10px] text-emerald-600 font-bold ml-2">Stock: {p.current_stock} {p.unit}</span>
                                                    </div>
                                                    {p.purchase_history && p.purchase_history.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                                            {p.purchase_history.map((ph, idx) => (
                                                                <span key={idx} className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                                                    {ph.requisition_number} → {ph.po_number} ({ph.qty} @ ₹{ph.rate})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddStockItem(p)}
                                                    className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-200 transition-colors shrink-0"
                                                >
                                                    <FaPlus size={10} className="inline mr-1" /> Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ITEMS BREAKDOWN TABLE */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2.5 ml-0.5">
                                Items Breakdown
                                {piMode === "requisition" && items.length > 0 && (
                                    <span className="text-[10px] text-slate-400 font-normal normal-case ml-2">
                                        ({items.filter(i => i.selected && i.can_add_to_pi).length} of {items.length} selected)
                                    </span>
                                )}
                            </h3>
                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                                        <tr>
                                            {piMode === "requisition" && <th className="px-3 py-3.5 w-10 text-center"></th>}
                                            <th className="px-4 py-3.5 w-12 text-center">#</th>
                                            <th className="px-4 py-3.5">Product Name / Details</th>
                                            {piMode === "requisition" && <th className="px-3 py-3.5 w-24 text-center">Status</th>}
                                            <th className="px-4 py-3.5 w-44">HSN Code</th>
                                            <th className="px-4 py-3.5 w-28 text-right">Quantity</th>
                                            <th className="px-4 py-3.5 w-36 text-right">Unit Price ({formData.currency})</th>
                                            <th className="px-4 py-3.5 w-36 text-right">Total Amount</th>
                                            <th className="px-4 py-3.5 w-12 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loadingItems ? (
                                            <tr>
                                                <td colSpan={piMode === "requisition" ? 9 : 7} className="px-4 py-8 text-center text-slate-400 italic">
                                                    Loading items for chosen requisition...
                                                </td>
                                            </tr>
                                        ) : items.length === 0 ? (
                                            <tr>
                                                <td colSpan={piMode === "requisition" ? 9 : 7} className="px-4 py-8 text-center text-slate-400 italic">
                                                    {piMode === "stock_sale"
                                                        ? "No items added. Use the search above to add products from stock."
                                                        : "No items loaded. Please select a Requisition to auto-populate."}
                                                </td>
                                            </tr>
                                        ) : (
                                            items.map((item, index) => {
                                                const disabled = piMode === "requisition" && !item.can_add_to_pi;
                                                const excluded = piMode === "requisition" && !item.selected;
                                                return (
                                                    <tr key={index} className={`transition-colors align-middle ${disabled ? 'bg-red-50/50 opacity-60' : excluded ? 'bg-slate-50 opacity-50' : 'hover:bg-slate-50'}`}>
                                                        {piMode === "requisition" && (
                                                            <td className="px-3 py-3.5 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.selected && item.can_add_to_pi}
                                                                    disabled={!item.can_add_to_pi}
                                                                    onChange={() => handleToggleItem(index)}
                                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                                                                />
                                                            </td>
                                                        )}
                                                        <td className="px-4 py-3.5 text-center font-semibold text-slate-400">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <div className="font-semibold text-slate-800">{item.product_name}</div>
                                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                                {item.product_code || item.product}
                                                                {item.current_stock !== undefined && (
                                                                    <span className="ml-2 text-emerald-600">Stock: {item.current_stock}</span>
                                                                )}
                                                            </div>
                                                            {disabled && (
                                                                <div className="text-[10px] text-red-600 font-bold mt-0.5 flex items-center gap-1">
                                                                    <FaExclamationTriangle size={8} />
                                                                    {item.purchase_status === 'PENDING' ? 'PO not generated' :
                                                                     item.purchase_status === 'FULLY_ALLOCATED' ? `Already allocated in other PI (${item.already_in_pi || 0} qty)` :
                                                                     'Not yet received/purchased'}
                                                                </div>
                                                            )}
                                                            {!disabled && item.remaining_qty !== undefined && item.remaining_qty < item.quantity && (
                                                                <div className="text-[10px] text-amber-600 font-bold mt-0.5">
                                                                    Max available: {item.remaining_qty} (already {item.already_in_pi} in other PI)
                                                                </div>
                                                            )}
                                                        </td>
                                                        {piMode === "requisition" && (
                                                            <td className="px-3 py-3.5 text-center">
                                                                {getStatusBadge(item.purchase_status)}
                                                            </td>
                                                        )}
                                                        <td className="px-4 py-3.5">
                                                            <input
                                                                type="text"
                                                                value={item.hsn_code}
                                                                onChange={(e) => handleItemChange(index, "hsn_code", e.target.value)}
                                                                className="input py-1.5 px-2 border-slate-200 focus:ring-blue-500 rounded-lg text-xs font-mono font-semibold w-40 inline-block disabled:bg-slate-100"
                                                                placeholder="e.g. 32145 Ind 65421 BD"
                                                                title={item.hsn_code || "HSN Code"}
                                                                disabled={disabled}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right">
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                                className="input text-right py-1.5 px-2 border-slate-200 focus:ring-blue-500 rounded-lg text-xs font-semibold w-24 inline-block disabled:bg-slate-100"
                                                                min="1"
                                                                disabled={disabled}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.unit_price}
                                                                onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
                                                                className="input text-right py-1 px-2 border-slate-200 focus:ring-blue-500 rounded-lg text-xs font-bold w-28 inline-block disabled:bg-slate-100"
                                                                min="0"
                                                                disabled={disabled}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-bold text-slate-800">
                                                            {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            {piMode === "stock_sale" && (
                                                                <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600 transition-colors">
                                                                    <FaTrash size={13} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    {items.length > 0 && (
                                        <tfoot className="bg-slate-50 font-bold text-slate-700 border-t border-slate-200">
                                            <tr>
                                                <td colSpan={piMode === "requisition" ? 7 : 5} className="px-4 py-3.5 text-right">Subtotal Amount:</td>
                                                <td className="px-4 py-3.5 text-right text-blue-600">
                                                    {formData.currency} {(piMode === "requisition"
                                                        ? items.filter(i => i.selected && i.can_add_to_pi)
                                                        : items
                                                    ).reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0).toFixed(2)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        {/* PROFIT PREVIEW */}
                        {profitPreview && !isEdit && piMode === "requisition" && (
                            <div className={`p-4 rounded-2xl border flex items-center justify-between ${(profitPreview.expected_profit_inr || 0) >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Profit Preview (Estimated)</p>
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                                        <span>Cost: ₹{Number(profitPreview.purchase_cost_inr || 0).toLocaleString('en-IN')}</span>
                                        <span>Transport: ₹{Number(profitPreview.transport_cost_inr || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xl font-black ${(profitPreview.expected_profit_inr || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {(profitPreview.expected_profit_inr || 0) >= 0 ? '+' : ''}₹{Number(profitPreview.expected_profit_inr || 0).toLocaleString('en-IN')}
                                    </p>
                                    <p className={`text-[10px] font-black uppercase ${(profitPreview.expected_margin_percentage || 0) >= 10 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        Margin: {Number(profitPreview.expected_margin_percentage || 0).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* TERMS AND CONDITIONS */}
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Terms & Conditions</h3>
                                <button type="button" onClick={handleAddTerm} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-lg border border-blue-100 transition-colors">
                                    <FaPlus size={10} /> Add Term
                                </button>
                            </div>
                            <div className="space-y-3">
                                {terms.length === 0 ? (
                                    <p className="text-slate-400 italic text-xs text-center py-2">No terms added</p>
                                ) : (
                                    terms.map((term, index) => (
                                        <div key={term.id} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 min-w-16">Term #{index + 1}</div>
                                            <div className="w-full sm:w-1/3">
                                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 ml-0.5">Key / Label</label>
                                                <input type="text" value={term.key} onChange={(e) => handleTermChange(term.id, "key", e.target.value)} placeholder="e.g. Shipment" className="input w-full text-xs py-1.5 border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500" />
                                            </div>
                                            <div className="w-full sm:flex-1">
                                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 ml-0.5">Value</label>
                                                <input type="text" value={term.value} onChange={(e) => handleTermChange(term.id, "value", e.target.value)} placeholder="e.g. within 45 days" className="input w-full text-xs py-1.5 border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500" />
                                            </div>
                                            <button type="button" onClick={() => handleRemoveTerm(term.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 mb-0.5" title="Delete Term">
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* HANDLING NOTES */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-0.5">Handling Notes</label>
                            <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" placeholder="Special priorities, packing demands..." className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 text-xs font-semibold py-2"></textarea>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-sm transition-colors">Cancel</button>
                    <button type="submit" form="proforma-form" disabled={submitting} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200/50 disabled:opacity-50 transition-all flex items-center gap-1.5">
                        <FaCheck size={12} />
                        {submitting ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Invoice" : "Create Invoice")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientQuotationModal;
