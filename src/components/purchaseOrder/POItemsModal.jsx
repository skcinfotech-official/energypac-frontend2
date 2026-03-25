import React, { useEffect, useState } from "react";
import { fetchFinancePOItems } from "../../services/financeService";
import { FaTimes, FaBoxOpen, FaInfoCircle, FaClipboardCheck, FaHourglassHalf } from "react-icons/fa";

const POItemsModal = ({ open, onClose, poId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && poId) {
            const loadItems = async () => {
                setLoading(true);
                try {
                    const res = await fetchFinancePOItems(poId);
                    setData(res);
                } catch (err) {
                    console.error("Failed to load PO items", err);
                } finally {
                    setLoading(false);
                }
            };
            loadItems();
        }
    }, [open, poId]);

    if (!open) return null;

    const formatCurrency = (amount) => {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <FaBoxOpen className="text-emerald-400" />
                            Purchased & Pending Items Details
                        </h3>
                        <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mt-1">
                            {data?.po_number || "Loading..."} • {data?.vendor_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <FaTimes size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fetching Item list...</p>
                        </div>
                    ) : data ? (
                        <>
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Items Total</p>
                                    <p className="text-xl font-black text-slate-800">{formatCurrency(data.items_total)}</p>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                                    <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider mb-1">Purchased Total</p>
                                    <p className="text-xl font-black text-emerald-700">{formatCurrency(data.purchased_items_total)}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                                    <p className="text-[10px] text-blue-600 uppercase font-bold tracking-wider mb-1">Purchased Count</p>
                                    <p className="text-xl font-black text-blue-700">{data.purchased_items_count} <span className="text-xs font-bold text-blue-400">items</span></p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm">
                                    <p className="text-[10px] text-amber-600 uppercase font-bold tracking-wider mb-1">Pending Count</p>
                                    <p className="text-xl font-black text-amber-700">{data.pending_items_count} <span className="text-xs font-bold text-amber-400">items</span></p>
                                </div>
                            </div>

                            {/* Tables Section */}
                            <div className="grid grid-cols-1 gap-8">
                                
                                {/* Purchased Items */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 border-b border-emerald-50 bg-emerald-50/30 flex items-center gap-2">
                                        <FaClipboardCheck className="text-emerald-600" />
                                        <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">Purchased Items</h4>
                                        <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black">
                                            {data.purchased_items?.length || 0} ITEMS
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                                    <th className="px-5 py-3">Product Info</th>
                                                    <th className="px-5 py-3 text-center">HSN</th>
                                                    <th className="px-5 py-3 text-right">Quantity</th>
                                                    <th className="px-5 py-3 text-right">Rate</th>
                                                    <th className="px-5 py-3 text-right">Net Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {data.purchased_items?.length > 0 ? (
                                                    data.purchased_items.map((it, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-5 py-3">
                                                                <p className="font-bold text-slate-800">{it.product_name}</p>
                                                                <p className="text-[10px] font-mono text-slate-400">{it.product_code}</p>
                                                            </td>
                                                            <td className="px-5 py-3 text-center text-[10px] font-bold text-slate-500">{it.hsn_code || "---"}</td>
                                                            <td className="px-5 py-3 text-right font-black text-slate-700">{it.quantity} <span className="text-[10px] text-slate-400">{it.unit}</span></td>
                                                            <td className="px-5 py-3 text-right text-slate-600 font-bold">{formatCurrency(it.rate)}</td>
                                                            <td className="px-5 py-3 text-right font-black text-emerald-600">{formatCurrency(it.amount)}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-5 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No items purchased yet</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Pending Items */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 border-b border-amber-50 bg-amber-50/30 flex items-center gap-2 text-amber-700">
                                        <FaHourglassHalf className="text-amber-600" />
                                        <h4 className="text-xs font-black uppercase tracking-wider">Pending Items</h4>
                                        <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black">
                                            {data.pending_items?.length || 0} ITEMS
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                                    <th className="px-5 py-3">Product Info</th>
                                                    <th className="px-5 py-3 text-center">HSN</th>
                                                    <th className="px-5 py-3 text-right">Quantity</th>
                                                    <th className="px-5 py-3 text-right">Rate</th>
                                                    <th className="px-5 py-3 text-right">Net Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {data.pending_items?.length > 0 ? (
                                                    data.pending_items.map((it, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-5 py-3">
                                                                <p className="font-bold text-slate-800">{it.product_name}</p>
                                                                <p className="text-[10px] font-mono text-slate-400">{it.product_code}</p>
                                                            </td>
                                                            <td className="px-5 py-3 text-center text-[10px] font-bold text-slate-500">{it.hsn_code || "---"}</td>
                                                            <td className="px-5 py-3 text-right font-black text-slate-700">{it.quantity} <span className="text-[10px] text-slate-400">{it.unit}</span></td>
                                                            <td className="px-5 py-3 text-right text-slate-600 font-bold">{formatCurrency(it.rate)}</td>
                                                            <td className="px-5 py-3 text-right font-black text-amber-600">{formatCurrency(it.amount)}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-5 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No pending items remaining</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                            <FaInfoCircle size={32} />
                            <p className="text-sm font-bold uppercase tracking-widest">No detailed data found for this PO</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-white">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-black hover:bg-slate-800 active:scale-95 transition-all">
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POItemsModal;
