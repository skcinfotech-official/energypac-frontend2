import React, { useState, useEffect } from "react";
import { FaBox, FaSearch, FaShoppingCart, FaStore, FaExclamationTriangle, FaEye, FaTimes, FaArrowRight } from "react-icons/fa";
import { getItemAnalytics } from "../services/financeService";
import { getProductTracking } from "../services/productService";

export default function ItemAnalytics() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [trackingModal, setTrackingModal] = useState({ open: false, data: null, loading: false });

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const data = await getItemAnalytics();
                setItems(data.items || []);
            } catch (err) {
                console.error("Failed to load item analytics:", err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const openTracking = async (productId) => {
        setTrackingModal({ open: true, data: null, loading: true });
        try {
            const res = await getProductTracking(productId);
            setTrackingModal({ open: true, data: res.data, loading: false });
        } catch {
            setTrackingModal({ open: true, data: null, loading: false });
        }
    };

    const closeTracking = () => setTrackingModal({ open: false, data: null, loading: false });

    const filtered = items.filter(item => {
        const q = search.toLowerCase();
        const matchSearch = item.item_name?.toLowerCase().includes(q) || item.item_code?.toLowerCase().includes(q);
        if (filter === "purchased_not_sold") return matchSearch && item.purchased_not_sold;
        if (filter === "sold_not_purchased") return matchSearch && item.sold_not_purchased;
        if (filter === "in_stock") return matchSearch && item.current_stock > 0;
        return matchSearch;
    });

    const totalPurchased = items.reduce((s, i) => s + i.total_qty_purchased, 0);
    const totalSold = items.reduce((s, i) => s + i.total_qty_sold, 0);
    const purchasedNotSold = items.filter(i => i.purchased_not_sold).length;

    const fmt = (v, c = "INR") => {
        const sym = c === "USD" ? "$" : "₹";
        return `${sym}${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-3"><FaBox className="text-blue-600" /> Item Analytics</h1>
                        <p className="text-slate-500 mt-1 text-sm font-medium">Product-wise purchase, sale & lifecycle tracking</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Total Qty Purchased</p>
                        <p className="text-2xl font-black text-slate-800">{totalPurchased.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Total Qty Sold</p>
                        <p className="text-2xl font-black text-slate-800">{totalSold.toLocaleString()}</p>
                    </div>
                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
                        <p className="text-[10px] text-amber-600 uppercase font-black tracking-wider mb-1">Purchased but Not Sold</p>
                        <p className="text-2xl font-black text-amber-700">{purchasedNotSold} items</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search item name or code..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium" />
                    </div>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                        <option value="all">All Items</option>
                        <option value="purchased_not_sold">Purchased but Not Sold</option>
                        <option value="sold_not_purchased">Sold but Not Purchased</option>
                        <option value="in_stock">In Stock</option>
                    </select>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-4 py-3 text-left">Product</th>
                                    <th className="px-4 py-3 text-center">Stock</th>
                                    <th className="px-4 py-3 text-center"><FaShoppingCart className="inline mr-1" size={10}/>Purchased</th>
                                    <th className="px-4 py-3 text-right">Qty Bought</th>
                                    <th className="px-4 py-3 text-center"><FaStore className="inline mr-1" size={10}/>Sold</th>
                                    <th className="px-4 py-3 text-right">Qty Sold</th>
                                    <th className="px-4 py-3 text-center">Last Buy</th>
                                    <th className="px-4 py-3 text-center">Last Sale</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-center">Track</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="10" className="px-4 py-16 text-center"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                                ) : filtered.length > 0 ? filtered.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-800">{item.item_name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{item.item_code} · {item.unit}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-700">{item.current_stock}</td>
                                        <td className="px-4 py-3 text-center font-bold text-blue-600">{item.total_times_purchased}</td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{item.total_qty_purchased}</td>
                                        <td className="px-4 py-3 text-center font-bold text-emerald-600">{item.total_times_sold}</td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">{item.total_qty_sold}</td>
                                        <td className="px-4 py-3 text-center text-xs text-slate-500">{item.last_purchase_date || "-"}</td>
                                        <td className="px-4 py-3 text-center text-xs text-slate-500">{item.last_sale_date || "-"}</td>
                                        <td className="px-4 py-3 text-center">
                                            {item.purchased_not_sold ? (
                                                <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase"><FaExclamationTriangle className="inline mr-0.5" size={8}/>Unsold</span>
                                            ) : item.sold_not_purchased ? (
                                                <span className="text-[9px] font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase">No PO</span>
                                            ) : item.total_times_sold > 0 ? (
                                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">Active</span>
                                            ) : (
                                                <span className="text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full uppercase">New</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {(item.total_times_purchased > 0 || item.total_times_sold > 0) && (
                                                <button onClick={() => openTracking(item.product_id)} className="p-1.5 rounded-md bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white transition-all active:scale-90 opacity-60 group-hover:opacity-100" title="View Full Tracking">
                                                    <FaEye size={12} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="10" className="px-4 py-16 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No items found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Tracking Modal */}
            {trackingModal.open && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeTracking}></div>
                    <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
                            <div className="min-w-0">
                                <h3 className="text-sm sm:text-base font-black uppercase tracking-tight truncate">
                                    Product Lifecycle — {trackingModal.data?.product?.item_name || "Loading..."}
                                </h3>
                                {trackingModal.data?.product && (
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                        {trackingModal.data.product.item_code} · {trackingModal.data.product.unit} · Stock: {trackingModal.data.product.current_stock}
                                    </p>
                                )}
                            </div>
                            <button onClick={closeTracking} className="p-2 hover:bg-white/10 rounded-lg shrink-0 ml-2"><FaTimes size={16} /></button>
                        </div>

                        {trackingModal.loading ? (
                            <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : trackingModal.data ? (
                            <div className="flex-1 overflow-y-auto">
                                {/* Purchase History */}
                                <div className="border-b border-slate-200">
                                    <div className="bg-blue-50 px-5 py-3 flex items-center justify-between">
                                        <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">
                                            <FaShoppingCart size={12} /> Purchase History ({trackingModal.data.total_purchases})
                                        </h4>
                                    </div>
                                    {trackingModal.data.purchases.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[650px] text-xs">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                        <th className="px-4 py-2.5 text-left">Requisition</th>
                                                        <th className="px-4 py-2.5 text-left">PO Number</th>
                                                        <th className="px-4 py-2.5 text-left">Vendor</th>
                                                        <th className="px-4 py-2.5 text-center">Date</th>
                                                        <th className="px-4 py-2.5 text-right">Qty</th>
                                                        <th className="px-4 py-2.5 text-right">Rate</th>
                                                        <th className="px-4 py-2.5 text-right">Amount</th>
                                                        <th className="px-4 py-2.5 text-right">INR Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {trackingModal.data.purchases.map((p, i) => (
                                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-2.5"><span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[10px]">{p.requisition_number}</span></td>
                                                            <td className="px-4 py-2.5"><span className="font-mono font-bold text-slate-700 text-[10px]">{p.po_number}</span></td>
                                                            <td className="px-4 py-2.5 font-bold text-slate-700">{p.vendor_name}</td>
                                                            <td className="px-4 py-2.5 text-center text-slate-500">{p.po_date}</td>
                                                            <td className="px-4 py-2.5 text-right font-mono font-bold">{p.quantity}</td>
                                                            <td className="px-4 py-2.5 text-right font-mono">{fmt(p.rate, p.currency)}</td>
                                                            <td className="px-4 py-2.5 text-right font-mono font-bold">
                                                                {fmt(p.amount, p.currency)}
                                                                {p.currency !== 'INR' && <div className="text-[9px] text-slate-400 mt-0.5">@{p.conversion_rate}</div>}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">{fmt(p.amount_inr, 'INR')}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="px-5 py-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No purchase records</div>
                                    )}
                                </div>

                                {/* Flow Arrow */}
                                <div className="flex items-center justify-center py-2 bg-slate-50">
                                    <FaArrowRight className="text-slate-300" />
                                </div>

                                {/* Sale History */}
                                <div>
                                    <div className="bg-emerald-50 px-5 py-3 flex items-center justify-between">
                                        <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                                            <FaStore size={12} /> Sale History ({trackingModal.data.total_sales})
                                        </h4>
                                    </div>
                                    {trackingModal.data.sales.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[600px] text-xs">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                        <th className="px-4 py-2.5 text-left">Requisition</th>
                                                        <th className="px-4 py-2.5 text-left">PI Number</th>
                                                        <th className="px-4 py-2.5 text-center">Date</th>
                                                        <th className="px-4 py-2.5 text-center">Status</th>
                                                        <th className="px-4 py-2.5 text-right">Qty</th>
                                                        <th className="px-4 py-2.5 text-right">Unit Price</th>
                                                        <th className="px-4 py-2.5 text-right">Amount</th>
                                                        <th className="px-4 py-2.5 text-right">INR Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {trackingModal.data.sales.map((s, i) => (
                                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-2.5"><span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[10px]">{s.requisition_number}</span></td>
                                                            <td className="px-4 py-2.5"><span className="font-mono font-bold text-emerald-700 text-[10px]">{s.pi_number}</span></td>
                                                            <td className="px-4 py-2.5 text-center text-slate-500">{s.pi_date}</td>
                                                            <td className="px-4 py-2.5 text-center">
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                                                    s.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                                    s.status === 'SENT' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                                    s.status === 'DRAFT' ? 'bg-slate-50 text-slate-600 border border-slate-200' :
                                                                    'bg-red-50 text-red-700 border border-red-200'
                                                                }`}>{s.status}</span>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right font-mono font-bold">{s.quantity}</td>
                                                            <td className="px-4 py-2.5 text-right font-mono">{fmt(s.unit_price, s.currency)}</td>
                                                            <td className="px-4 py-2.5 text-right font-mono font-bold">
                                                                {fmt(s.amount, s.currency)}
                                                                {s.currency !== 'INR' && <div className="text-[9px] text-slate-400 mt-0.5">@{s.conversion_rate}</div>}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">{fmt(s.amount_inr, 'INR')}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="px-5 py-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No sale records</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-16 text-center text-slate-400 font-bold uppercase text-[10px]">Failed to load tracking data</div>
                        )}

                        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end shrink-0">
                            <button onClick={closeTracking} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
