import React, { useState, useEffect } from "react";
import { FaBoxOpen, FaExclamationTriangle, FaSkull, FaSync } from "react-icons/fa";
import { getInventoryAging } from "../services/financeService";

export default function InventoryAging() {
    const [data, setData] = useState({ slow_moving: { count: 0, items: [] }, dead_stock: { count: 0, items: [] } });
    const [loading, setLoading] = useState(true);
    const [threshold, setThreshold] = useState(90);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getInventoryAging({ threshold_days: threshold });
            setData(res);
        } catch (err) {
            console.error("Failed to load aging data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [threshold]);

    const formatDate = (d) => d || "-";

    const StockTable = ({ title, icon, items, colorClass }) => (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${colorClass}`}>
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">{icon} {title}</h3>
                <span className="text-xs font-bold bg-white/80 px-3 py-1 rounded-full">{items.length} items</span>
            </div>
            {items.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-3 text-left">Product</th>
                                <th className="px-5 py-3 text-center">Stock</th>
                                <th className="px-5 py-3 text-center">Unit</th>
                                <th className="px-5 py-3 text-center">Last Purchase</th>
                                <th className="px-5 py-3 text-center">Last Sale</th>
                                <th className="px-5 py-3 text-center">Days Unsold</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="font-bold text-slate-800">{item.item_name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{item.item_code}</div>
                                    </td>
                                    <td className="px-5 py-3 text-center font-black text-slate-700">{item.current_stock}</td>
                                    <td className="px-5 py-3 text-center text-xs text-slate-500 font-bold">{item.unit}</td>
                                    <td className="px-5 py-3 text-center text-xs text-slate-500">{formatDate(item.last_purchase_date)}</td>
                                    <td className="px-5 py-3 text-center text-xs text-slate-500">{formatDate(item.last_sale_date)}</td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                            item.days_unsold > threshold * 2 ? 'bg-red-50 text-red-700 border border-red-200' :
                                            item.days_unsold > threshold ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                            'bg-slate-50 text-slate-600 border border-slate-200'
                                        }`}>
                                            {item.days_unsold !== null ? `${item.days_unsold} days` : "Never sold"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="py-16 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No items in this category</div>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><FaBoxOpen className="text-amber-600" /> Inventory Aging & Dead Stock</h1>
                    <p className="text-slate-500 mt-1 font-medium">Identify slow-moving and dead stock items</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Threshold:</label>
                        <select value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                            <option value={30}>30 Days</option>
                            <option value={60}>60 Days</option>
                            <option value={90}>90 Days</option>
                            <option value={180}>180 Days</option>
                            <option value={365}>1 Year</option>
                        </select>
                    </div>
                    <button onClick={fetchData} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95"><FaSync size={14} className="text-slate-600" /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm">
                    <p className="text-[10px] text-amber-600 uppercase font-black tracking-wider mb-1">Slow Moving ({threshold}+ days)</p>
                    <p className="text-3xl font-black text-amber-700">{data.slow_moving?.count || 0}</p>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm">
                    <p className="text-[10px] text-red-600 uppercase font-black tracking-wider mb-1">Dead Stock ({threshold * 2}+ days)</p>
                    <p className="text-3xl font-black text-red-700">{data.dead_stock?.count || 0}</p>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-20 flex justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <>
                    <StockTable title="Slow Moving Stock" icon={<FaExclamationTriangle className="text-amber-500" />} items={data.slow_moving?.items || []} colorClass="bg-amber-50 text-amber-800" />
                    <StockTable title="Dead Stock" icon={<FaSkull className="text-red-500" />} items={data.dead_stock?.items || []} colorClass="bg-red-50 text-red-800" />
                </>
            )}
        </div>
    );
}
