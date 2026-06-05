import React, { useState, useEffect } from "react";
import { FaBox, FaSearch, FaShoppingCart, FaStore, FaExclamationTriangle } from "react-icons/fa";
import { getItemAnalytics } from "../services/financeService";

export default function ItemAnalytics() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

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

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><FaBox className="text-blue-600" /> Item Analytics</h1>
                    <p className="text-slate-500 mt-1 font-medium">Product-wise purchase & sale tracking</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Total Qty Purchased</p>
                    <p className="text-2xl font-black text-slate-800">{totalPurchased.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Total Qty Sold</p>
                    <p className="text-2xl font-black text-slate-800">{totalSold.toLocaleString()}</p>
                </div>
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm">
                    <p className="text-[10px] text-amber-600 uppercase font-black tracking-wider mb-1">Purchased but Not Sold</p>
                    <p className="text-2xl font-black text-amber-700">{purchasedNotSold} items</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
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
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-3.5 text-left">Product</th>
                                <th className="px-5 py-3.5 text-center">Current Stock</th>
                                <th className="px-5 py-3.5 text-center"><FaShoppingCart className="inline mr-1" size={10}/>Times Purchased</th>
                                <th className="px-5 py-3.5 text-right">Qty Purchased</th>
                                <th className="px-5 py-3.5 text-center"><FaStore className="inline mr-1" size={10}/>Times Sold</th>
                                <th className="px-5 py-3.5 text-right">Qty Sold</th>
                                <th className="px-5 py-3.5 text-center">Last Purchase</th>
                                <th className="px-5 py-3.5 text-center">Last Sale</th>
                                <th className="px-5 py-3.5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="9" className="px-5 py-20 text-center text-slate-400"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filtered.length > 0 ? filtered.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="font-bold text-slate-800">{item.item_name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{item.item_code} | {item.unit}</div>
                                    </td>
                                    <td className="px-5 py-3 text-center font-bold text-slate-700">{item.current_stock}</td>
                                    <td className="px-5 py-3 text-center font-bold text-blue-600">{item.total_times_purchased}</td>
                                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-700">{item.total_qty_purchased}</td>
                                    <td className="px-5 py-3 text-center font-bold text-emerald-600">{item.total_times_sold}</td>
                                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-700">{item.total_qty_sold}</td>
                                    <td className="px-5 py-3 text-center text-xs text-slate-500">{item.last_purchase_date || "-"}</td>
                                    <td className="px-5 py-3 text-center text-xs text-slate-500">{item.last_sale_date || "-"}</td>
                                    <td className="px-5 py-3 text-center">
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
                                </tr>
                            )) : (
                                <tr><td colSpan="9" className="px-5 py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No items found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
