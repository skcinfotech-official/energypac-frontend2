import { useState, useEffect } from "react";
import { FaTimes, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { getProformaInvoices } from "../../services/salesService";
import { getPiItemsForReturn, createSalesReturn } from "../../services/returnsService";

const REASON_OPTIONS = [
    { value: "DEFECTIVE", label: "Defective" },
    { value: "WRONG_ITEM", label: "Wrong Item" },
    { value: "EXCESS", label: "Excess Quantity" },
    { value: "DAMAGED", label: "Damaged in Transit" },
    { value: "QUALITY", label: "Quality Issue" },
    { value: "OTHER", label: "Other" },
];

const CONDITION_OPTIONS = [
    { value: "GOOD", label: "Good — Resalable" },
    { value: "DAMAGED", label: "Damaged — Needs Repair" },
    { value: "UNUSABLE", label: "Unusable — Write Off" },
];

const SalesReturnModal = ({ isOpen, onClose, onSuccess }) => {
    const [piList, setPiList] = useState([]);
    const [selectedPi, setSelectedPi] = useState("");
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            const fetchPIs = async () => {
                try {
                    const res = await getProformaInvoices(1, "");
                    const accepted = (res.results || []).filter(p => p.status === "ACCEPTED");
                    setPiList(accepted);
                } catch (err) {
                    console.error(err);
                }
            };
            fetchPIs();
            setSelectedPi("");
            setReturnDate(new Date().toISOString().split('T')[0]);
            setReason("");
            setNotes("");
            setItems([]);
            setError("");
        }
    }, [isOpen]);

    const handlePiChange = async (e) => {
        const piId = e.target.value;
        setSelectedPi(piId);
        if (!piId) { setItems([]); return; }

        setLoadingItems(true);
        try {
            const res = await getPiItemsForReturn(piId);
            const mapped = (res.items || []).map(item => ({
                ...item,
                return_qty: 0,
                reason: "OTHER",
                condition: "GOOD",
                notes: "",
                selected: false,
            }));
            setItems(mapped);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load PI items");
        } finally {
            setLoadingItems(false);
        }
    };

    const handleItemChange = (index, field, value) => {
        setItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: field === "return_qty" ? (parseFloat(value) || 0) : value };
            if (field === "return_qty" && parseFloat(value) > 0) {
                updated[index].selected = true;
            }
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const selectedItems = items.filter(i => i.return_qty > 0);
        if (!selectedPi) { setError("Please select a Proforma Invoice"); return; }
        if (selectedItems.length === 0) { setError("Enter return quantity for at least one item"); return; }

        const overItems = selectedItems.filter(i => i.return_qty > i.returnable_qty);
        if (overItems.length > 0) {
            setError(`Quantity exceeds returnable: ${overItems.map(i => i.product_name).join(", ")}`);
            return;
        }

        setSubmitting(true);
        try {
            await createSalesReturn({
                proforma_invoice: selectedPi,
                return_date: returnDate,
                reason,
                notes,
                items: selectedItems.map(i => ({
                    product: i.product_id,
                    quantity: i.return_qty,
                    unit_price: i.unit_price,
                    reason: i.reason,
                    condition: i.condition,
                    notes: i.notes,
                })),
            });
            toast.success("Sales return created");
            onSuccess("Sales return created successfully");
            onClose();
        } catch (err) {
            const msg = err.response?.data?.items || err.response?.data?.error || err.message || "Failed to create return";
            setError(typeof msg === "object" ? JSON.stringify(msg) : msg);
            toast.error("Failed to create return");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const totalReturnAmount = items.filter(i => i.return_qty > 0).reduce((s, i) => s + i.return_qty * i.unit_price, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Create Sales Return</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Return items from an accepted Proforma Invoice</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"><FaTimes size={16} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-semibold flex items-start gap-2">
                            <FaExclamationTriangle className="mt-0.5 shrink-0" /><span>{error}</span>
                        </div>
                    )}

                    <form id="sr-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Proforma Invoice *</label>
                                <select value={selectedPi} onChange={handlePiChange} className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold" required>
                                    <option value="">Select PI</option>
                                    {piList.map(pi => <option key={pi.id} value={pi.id}>{pi.pi_number} — {pi.applicant_importer}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Return Date *</label>
                                <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-semibold" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Overall Reason</label>
                                <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Client rejected batch" className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                        </div>

                        {/* ITEMS TABLE */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Return Items</h3>
                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-3 w-10">#</th>
                                            <th className="px-3 py-3">Product</th>
                                            <th className="px-3 py-3 w-20 text-right">Sold</th>
                                            <th className="px-3 py-3 w-20 text-right">Returned</th>
                                            <th className="px-3 py-3 w-24 text-right">Returnable</th>
                                            <th className="px-3 py-3 w-24 text-right">Return Qty</th>
                                            <th className="px-3 py-3 w-28">Reason</th>
                                            <th className="px-3 py-3 w-32">Condition</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loadingItems ? (
                                            <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-400 italic">Loading items...</td></tr>
                                        ) : items.length === 0 ? (
                                            <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-400 italic">Select a PI to see items</td></tr>
                                        ) : items.map((item, idx) => (
                                            <tr key={idx} className={`transition-colors ${item.returnable_qty <= 0 ? 'bg-slate-50 opacity-50' : 'hover:bg-slate-50'}`}>
                                                <td className="px-3 py-3 font-semibold text-slate-400">{idx + 1}</td>
                                                <td className="px-3 py-3">
                                                    <div className="font-semibold text-slate-800">{item.product_name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{item.product_code}</div>
                                                </td>
                                                <td className="px-3 py-3 text-right font-medium">{item.sold_qty}</td>
                                                <td className="px-3 py-3 text-right font-medium text-amber-600">{item.already_returned > 0 ? item.already_returned : '—'}</td>
                                                <td className="px-3 py-3 text-right font-bold text-emerald-600">{item.returnable_qty}</td>
                                                <td className="px-3 py-3 text-right">
                                                    <input
                                                        type="number"
                                                        value={item.return_qty || ""}
                                                        onChange={e => handleItemChange(idx, "return_qty", e.target.value)}
                                                        className="input text-right py-1.5 px-2 border-slate-200 rounded-lg text-xs font-semibold w-20 disabled:bg-slate-100"
                                                        min="0"
                                                        max={item.returnable_qty}
                                                        disabled={item.returnable_qty <= 0}
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="px-3 py-3">
                                                    <select value={item.reason} onChange={e => handleItemChange(idx, "reason", e.target.value)} className="input py-1 px-1 border-slate-200 rounded-lg text-[10px] font-semibold w-full" disabled={item.returnable_qty <= 0}>
                                                        {REASON_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <select value={item.condition} onChange={e => handleItemChange(idx, "condition", e.target.value)} className="input py-1 px-1 border-slate-200 rounded-lg text-[10px] font-semibold w-full" disabled={item.returnable_qty <= 0}>
                                                        {CONDITION_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {totalReturnAmount > 0 && (
                                        <tfoot className="bg-slate-50 border-t border-slate-200">
                                            <tr>
                                                <td colSpan="5" className="px-3 py-3 text-right font-bold text-slate-700 text-xs">Total Return Amount:</td>
                                                <td colSpan="3" className="px-3 py-3 font-black text-blue-700 text-sm">{totalReturnAmount.toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2" placeholder="Additional notes..." className="input w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 text-xs" />
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-sm">Cancel</button>
                    <button type="submit" form="sr-form" disabled={submitting} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                        <FaCheck size={12} /> {submitting ? "Creating..." : "Create Return"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesReturnModal;
