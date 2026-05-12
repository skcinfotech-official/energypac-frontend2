
import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaTrash, FaBoxOpen, FaLayerGroup, FaSync } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { exchangeRateService } from "../../services/exchangeRateService";
import { createClientQuotation, updateClientQuotation, getClientQueries } from "../../services/salesService";
import ProductSelector from "../common/ProductSelector";
import ProductModal from "../products/ProductModal";

const ClientQuotationModal = ({ isOpen, onClose, onSuccess, quotation = null }) => {
    const isEdit = !!quotation;
    const [formData, setFormData] = useState({
        client_query: "",
        quotation_date: new Date().toISOString().split('T')[0],
        validity_date: "",
        payment_terms: "",
        delivery_terms: "",
        remarks: "",
        cgst_percentage: 9,
        sgst_percentage: 9,
        igst_percentage: 0,
        currency: "INR",
    });

    const [exchangeRate, setExchangeRate] = useState(1.0);
    const [rateLoading, setRateLoading] = useState(false);

    const [items, setItems] = useState([]);
    const [queries, setQueries] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showProductModal, setShowProductModal] = useState(false);


    // Populate form on edit
    useEffect(() => {
        if (isOpen && quotation) {
            setFormData({
                client_query: quotation.client_query,
                quotation_date: quotation.quotation_date,
                validity_date: quotation.validity_date,
                payment_terms: quotation.payment_terms || "",
                delivery_terms: quotation.delivery_terms || "",
                remarks: quotation.remarks || "",
                cgst_percentage: quotation.cgst_percentage || 0,
                sgst_percentage: quotation.sgst_percentage || 0,
                igst_percentage: quotation.igst_percentage || 0,
                currency: quotation.currency || "INR",
            });
            setExchangeRate(quotation.exchange_rate || 1.0);

            const populatedItems = quotation.items.map(item => ({
                id: item.id || Date.now() + Math.random(),
                product: item.product,
                product_details: {
                    hsn_code: item.hsn_code,
                    unit: item.unit,
                    current_stock: item.stock_quantity,
                },
                quantity: item.quantity,
                rate: item.original_rate || item.rate,
                remarks: item.remarks || "",
                type: 'stock'
            }));
            setItems(populatedItems);
        } else if (isOpen && !quotation) {
            // Reset for new creation
            setFormData({
                client_query: "",
                quotation_date: new Date().toISOString().split('T')[0],
                validity_date: "",
                payment_terms: "",
                delivery_terms: "",
                remarks: "",
                cgst_percentage: 9,
                sgst_percentage: 9,
                igst_percentage: 0,
                currency: "INR",
            });
            setExchangeRate(1.0);
            setItems([]);
        }
    }, [isOpen, quotation]);

    // Fetch Client Queries for Dropdown
    useEffect(() => {
        if (isOpen && !isEdit) {
            const fetchQueries = async () => {
                try {
                    const data = await getClientQueries(1, ""); // Fetch first page/all
                    setQueries(data.results || []);
                } catch (err) {
                    console.error("Failed to fetch client queries", err);
                }
            };
            fetchQueries();
        }
    }, [isOpen, isEdit]);

    const loadExchangeRate = async () => {
        setRateLoading(true);
        try {
            const data = await exchangeRateService.getCurrentRate();
            setExchangeRate(data.rate);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch exchange rate");
        } finally {
            setRateLoading(false);
        }
    };

    useEffect(() => {
        if (formData.currency === "USD" && !isEdit) {
            loadExchangeRate();
        } else if (formData.currency === "INR") {
            setExchangeRate(1.0);
        }
    }, [formData.currency, isEdit]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddItem = () => {
        const newItem = {
            id: Date.now(),
            type: 'stock',
            quantity: 1,
            rate: 0,
            remarks: "",
            product: null,
            product_details: null,
        };
        setItems([newItem, ...items]);
    };



    const handleRemoveItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            // Validate
            if (!formData.client_query) throw new Error("Please select a client query");
            if (items.length === 0) throw new Error("Please add at least one item");

            // Prepare Payload
            const payload = {
                ...formData,
                items: items.map(item => {
                    const common = {
                        quantity: Number(item.quantity),
                        rate: Number(item.rate),
                        remarks: item.remarks
                    };

                    if (item.type === 'stock') {
                        if (!item.product) throw new Error("Product selection missing for a stock item");
                        return {
                            product: item.product,
                            ...common
                        };
                    } else {
                        // Should not happen now
                        if (!item.product) throw new Error("Product selection missing");
                        return {
                            product: item.product,
                            ...common
                        };
                    }
                })
            };

            if (isEdit) {
                await updateClientQuotation(quotation.id, payload);
            } else {
                await createClientQuotation(payload);
            }
            const successMsg = isEdit ? "Quotation updated successfully!" : "Quotation created successfully!";

            setFormData({
                client_query: "",
                quotation_date: new Date().toISOString().split('T')[0],
                validity_date: "",
                payment_terms: "",
                delivery_terms: "",
                remarks: "",
                cgst_percentage: 9,
                sgst_percentage: 9,
                igst_percentage: 0,
                currency: "INR",
            });
            setExchangeRate(1.0);
            setItems([]);
            onSuccess(successMsg);
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to create quotation");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            {/* Modal Content - Large width, no outside click close */}
            <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-slate-800">
                        {isEdit ? `Edit Quotation: ${quotation.quotation_number}` : "New Client Quotation"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                        <FaTimes />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <form id="quotation-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* QUOTATION DETAILS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Client Query *</label>
                                <select
                                    name="client_query"
                                    value={formData.client_query}
                                    onChange={handleInputChange}
                                    className="input w-full disabled:bg-slate-100 disabled:text-slate-500"
                                    required
                                    disabled={isEdit}
                                >
                                    {isEdit ? (
                                        <option value={quotation.client_query}>{quotation.query_number} - {quotation.client_name}</option>
                                    ) : (
                                        <>
                                            <option value="">Select Query</option>
                                            {queries.map(q => (
                                                <option key={q.id} value={q.id}>
                                                    {q.query_number} - {q.client_name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Quotation Date *</label>
                                <input
                                    type="date"
                                    name="quotation_date"
                                    value={formData.quotation_date}
                                    onChange={handleInputChange}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Validity Date *</label>
                                <input
                                    type="date"
                                    name="validity_date"
                                    value={formData.validity_date}
                                    onChange={handleInputChange}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Terms</label>
                                <input
                                    type="text"
                                    name="payment_terms"
                                    value={formData.payment_terms}
                                    onChange={handleInputChange}
                                    className="input w-full"
                                    placeholder="e.g. 30 days"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Delivery Terms</label>
                                <input
                                    type="text"
                                    name="delivery_terms"
                                    value={formData.delivery_terms}
                                    onChange={handleInputChange}
                                    className="input w-full"
                                    placeholder="e.g. Ex-works"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
                                <input
                                    type="text"
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    className="input w-full"
                                    placeholder="Optional remarks"
                                />
                            </div>
                        </div>

                        {/* CURRENCY & TAX SETTINGS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2">Input Currency</h3>
                                    <div className="flex gap-1.5">
                                        {["INR", "USD"].map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, currency: c })}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                                    formData.currency === c
                                                        ? "bg-blue-600 text-white shadow-sm"
                                                        : "bg-white text-slate-600 border border-slate-200"
                                                }`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {formData.currency === "USD" && (
                                    <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-blue-100 shadow-sm">
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Exchange Rate</p>
                                            <p className="text-sm font-black text-blue-600 leading-none">1 USD = ₹ {exchangeRate}</p>
                                        </div>
                                        {!isEdit && (
                                            <button 
                                                type="button" 
                                                onClick={loadExchangeRate} 
                                                className="p-1.5 hover:bg-blue-50 rounded-md text-blue-400 transition-colors"
                                                title="Refresh Rate"
                                            >
                                                <FaSync className={rateLoading ? "animate-spin" : ""} size={12} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200">
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tax Settings (%)</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">CGST</label>
                                        <input type="number" name="cgst_percentage" value={formData.cgst_percentage} onChange={handleInputChange} className="input w-full text-xs py-1" placeholder="9" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">SGST</label>
                                        <input type="number" name="sgst_percentage" value={formData.sgst_percentage} onChange={handleInputChange} className="input w-full text-xs py-1" placeholder="9" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">IGST</label>
                                        <input type="number" name="igst_percentage" value={formData.igst_percentage} onChange={handleInputChange} className="input w-full text-xs py-1" placeholder="0" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ITEMS SECTION */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-slate-700 uppercase">Items</h3>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded hover:bg-indigo-100 transition-colors"
                                    >
                                        <FaBoxOpen /> Add Item
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowProductModal(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded hover:bg-emerald-100 transition-colors"
                                    >
                                        <FaLayerGroup /> Add New Product
                                    </button>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-3 w-10">#</th>
                                            <th className="px-3 py-3 min-w-48">Item Details</th>
                                            <th className="px-3 py-3 w-24">HSN</th>
                                            <th className="px-3 py-3 w-20">Unit</th>
                                            <th className="px-3 py-3 w-24 text-right">Qty</th>
                                            <th className="px-3 py-3 w-32 text-right">Rate ({formData.currency})</th>
                                            <th className="px-3 py-3 w-32 text-right">Amount ({formData.currency})</th>
                                            {formData.currency === "USD" && <th className="px-3 py-3 w-32 text-right">Amount (INR)</th>}
                                            <th className="px-3 py-3 w-10 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.length === 0 && (
                                            <tr>
                                                <td colSpan="8" className="px-4 py-8 text-center text-slate-400 italic">
                                                    No items added yet. Click buttons above to add items.
                                                </td>
                                            </tr>
                                        )}
                                        {items.map((item, index) => (
                                            <tr key={item.id} className="odd:bg-slate-100 even:bg-white hover:bg-slate-200  group align-top ">
                                                <td className="px-3 py-3 text-slate-500 pt-5">{items.length - index}</td>

                                                {/* ITEM DETAILS COLUMN */}
                                                <td className="px-3 py-3">
                                                    <div className="space-y-2">
                                                        <div className="w-full">
                                                            <ProductSelector
                                                                value={item.product}
                                                                excludeIds={items.filter((_, idx) => idx !== index).map(it => it.product)}
                                                                onChange={(val, productInfo) => {
                                                                    const newItems = [...items];
                                                                    newItems[index] = {
                                                                        ...newItems[index],
                                                                        product: val,
                                                                        product_details: productInfo,
                                                                        rate: productInfo?.rate || newItems[index].rate
                                                                    };
                                                                    setItems(newItems);
                                                                }}
                                                                placeholder="Select Stock Product..."
                                                            />
                                                            {item.product_details && (
                                                                <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                                                                    <span>Current Stock: {item.product_details.current_stock} {item.product_details.unit}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            placeholder="Remarks (e.g. spec details)"
                                                            className="input w-full text-xs"
                                                            value={item.remarks}
                                                            onChange={(e) => handleItemChange(index, "remarks", e.target.value)}
                                                        />
                                                    </div>
                                                </td>

                                                {/* HSN */}
                                                <td className="px-1 py-1 pt-4">
                                                    <span className="text-slate-500 text-xs block pt-2">
                                                        {item.product_details?.hsn_code || '-'}
                                                    </span>
                                                </td>

                                                {/* UNIT */}
                                                <td className="px-1 py-1 pt-4">
                                                    <span className="text-slate-500 text-xs block pt-2">
                                                        {item.product_details?.unit || '-'}
                                                    </span>
                                                </td>

                                                {/* QTY */}
                                                <td className="px-1 py-1 pt-4">
                                                    <input
                                                        type="number"
                                                        className="input w-full text-xs text-right"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                        min="0"
                                                    />
                                                </td>

                                                {/* RATE */}
                                                <td className="px-1 py-2 pt-4">
                                                    <input
                                                        type="number"
                                                        className="input w-full text-xs text-right"
                                                        value={item.rate}
                                                        onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                                                        min="0"
                                                    />
                                                </td>

                                                {/* AMOUNT */}
                                                <td className="px-3 py-3 text-right font-bold text-slate-700 pt-6">
                                                    {(formData.currency?.toString().trim().toUpperCase() === "USD" ? "$" : "₹")} {((Number(item.quantity) || 0) * (Number(item.rate) || 0)).toFixed(2)}
                                                </td>
                                                {formData.currency === "USD" && (
                                                    <td className="px-3 py-3 text-right font-bold text-blue-600 pt-6">
                                                        ₹ {((Number(item.quantity) || 0) * (Number(item.rate) || 0) * exchangeRate).toFixed(2)}
                                                    </td>
                                                )}

                                                {/* ACTIONS */}
                                                <td className="px-3 py-3 text-center pt-5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="text-red-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {items.length > 0 && (
                                        <tfoot className="bg-slate-50 font-bold text-slate-700 border-t border-slate-200">
                                            <tr>
                                                <td colSpan={formData.currency === "USD" ? "6" : "6"} className="px-4 py-3 text-right">Total:</td>
                                                <td className="px-4 py-3 text-right">
                                                    {formData.currency?.toString().trim().toUpperCase() === "USD" ? "$" : "₹"} {items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.rate) || 0)), 0).toFixed(2)}
                                                </td>
                                                {formData.currency?.toString().trim().toUpperCase() === "USD" && (
                                                    <td className="px-4 py-3 text-right text-blue-600">
                                                        ₹ {items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.rate) || 0) * exchangeRate), 0).toFixed(2)}
                                                    </td>
                                                )}
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="quotation-form"
                        disabled={submitting}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                    >
                        {submitting ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Quotation" : "Create Quotation")}
                    </button>
                </div>
            </div>

            {/* Product Modal for creating new master products */}
            {showProductModal && (
                <ProductModal
                    open={showProductModal}
                    onClose={() => setShowProductModal(false)}
                    onSuccess={() => {
                        toast.success("Product created successfully! Select it from the list.");
                        setShowProductModal(false);
                    }}
                    mode="add"
                />
            )}

        </div>
    );
};

export default ClientQuotationModal;
