import { useState, useEffect, useRef } from "react";
import { FaTimes, FaTrashAlt, FaSave } from "react-icons/fa";
import { updatePurchaseOrder, unlockPurchaseOrder } from "../../services/purchaseOrderService";
import { toast } from "react-hot-toast";

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

const EditPurchaseOrderModal = ({ open, onClose, poData, onUpdate }) => {
    const modalRef = useRef(null);

    // Form fields
    const [poDate, setPoDate] = useState("");
    const [remarks, setRemarks] = useState("");
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
            setRemarks(poData.remarks || "");
            setDiscountAmount(parseFloat(poData.discount_amount) || 0);
            setCgstPercentage(parseFloat(poData.cgst_percentage) || 0);
            setSgstPercentage(parseFloat(poData.sgst_percentage) || 0);
            setIgstPercentage(parseFloat(poData.igst_percentage) || 0);
            setItems(
                (poData.items || []).map(item => ({
                    id: item.id, // existing item UUID
                    product: item.product || item.product_id, // product UUID
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
                remarks: remarks,
                discount_amount: parseFloat(discountAmount),
                cgst_percentage: parseFloat(cgstPercentage),
                sgst_percentage: parseFloat(sgstPercentage),
                igst_percentage: parseFloat(igstPercentage),
                items: items.map(it => ({
                    id: it.id || undefined, // undefined for new items
                    product: it.product,
                    quantity: it.quantity,
                    rate: it.rate
                }))
            };

            await updatePurchaseOrder(poData.id, payload);
            toast.success("Purchase Order updated successfully!");
            
            // Release the editing lock
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose}></div>

            {/* Modal Box */}
            <div
                ref={modalRef}
                className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Edit Purchase Order</h3>
                        <p className="text-xs text-slate-500 font-mono">{poData.po_number} • Vendor: {poData.vendor_name}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* General Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-150">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">PO Date *</label>
                            <input
                                type="date"
                                value={poDate}
                                onChange={(e) => setPoDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Discount Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Remarks / Comments</label>
                            <input
                                type="text"
                                placeholder="Edit PO remarks..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Tax Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-150">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">CGST (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={cgstPercentage}
                                onChange={(e) => setCgstPercentage(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">SGST (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={sgstPercentage}
                                onChange={(e) => setSgstPercentage(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">IGST (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={igstPercentage}
                                onChange={(e) => setIgstPercentage(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono"
                            />
                        </div>
                    </div>


                    {/* Items Grid */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Line Items ({items.length})</h4>
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-3">Product Name</th>
                                        <th className="px-5 py-3 text-center">HSN</th>
                                        <th className="px-5 py-3 text-right">Quantity</th>
                                        <th className="px-5 py-3 text-right">Rate ({getCurrencySymbol(poData.currency)})</th>
                                        <th className="px-5 py-3 text-right">Total ({getCurrencySymbol(poData.currency)})</th>
                                        <th className="px-5 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {items.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="font-bold text-slate-800">{item.product_name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{item.product_code}</div>
                                            </td>
                                            <td className="px-5 py-3 text-center text-xs font-bold text-slate-500">{item.hsn_code || "---"}</td>
                                            <td className="px-5 py-3 text-right">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                    className="w-20 px-2 py-1 text-right border border-slate-200 rounded-lg text-xs font-bold font-mono focus:border-blue-500 focus:outline-none transition-all"
                                                />
                                                <span className="text-[10px] text-slate-400 ml-1 font-bold">{item.unit}</span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.rate}
                                                    onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                                                    className="w-24 px-2 py-1 text-right border border-slate-200 rounded-lg text-xs font-bold font-mono focus:border-blue-500 focus:outline-none transition-all"
                                                />
                                            </td>
                                            <td className="px-5 py-3 text-right font-black text-slate-800 font-mono">
                                                {(item.quantity * item.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <FaTrashAlt size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-5 py-10 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                                                No items in this Purchase Order. Please add a product above.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Calculations Review Block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <div className="flex flex-col justify-center text-xs text-slate-400 font-bold uppercase tracking-wide space-y-1">
                            <p>All taxes, discounts, and custom rates are calculated live.</p>
                        </div>
                        <div className="space-y-2.5 text-sm font-bold text-slate-600">
                            <div className="flex justify-between">
                                <span>Items Total:</span>
                                <span className="font-mono text-slate-800">{getCurrencySymbol(poData.currency)} {itemsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-red-500">
                                    <span>Discount Applied:</span>
                                    <span className="font-mono text-red-600">-{getCurrencySymbol(poData.currency)} {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {cgstPercentage > 0 && (
                                <div className="flex justify-between">
                                    <span>CGST ({cgstPercentage}%):</span>
                                    <span className="font-mono text-slate-800">{getCurrencySymbol(poData.currency)} {cgstAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {sgstPercentage > 0 && (
                                <div className="flex justify-between">
                                    <span>SGST ({sgstPercentage}%):</span>
                                    <span className="font-mono text-slate-800">{getCurrencySymbol(poData.currency)} {sgstAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {igstPercentage > 0 && (
                                <div className="flex justify-between">
                                    <span>IGST ({igstPercentage}%):</span>
                                    <span className="font-mono text-slate-800">{getCurrencySymbol(poData.currency)} {igstAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {freightCost > 0 && (
                                <div className="flex justify-between">
                                    <span>Freight Cost:</span>
                                    <span className="font-mono text-slate-800">{getCurrencySymbol(poData.currency)} {freightCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center">
                                <span className="text-base font-black text-slate-900 uppercase">Estimated Invoice Total:</span>
                                <span className="text-xl font-black text-blue-600 font-mono">
                                    {getCurrencySymbol(poData.currency)} {finalInvoiceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        disabled={saving}
                        className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || items.length === 0}
                        className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/10"
                    >
                        {saving ? (
                            <div className="h-4 w-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                        ) : (
                            <FaSave />
                        )}
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPurchaseOrderModal;
