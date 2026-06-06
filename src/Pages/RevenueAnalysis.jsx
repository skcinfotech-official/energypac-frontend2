import React, { useEffect, useState } from "react";
import {
    FaTimes, FaFileInvoiceDollar, FaArrowUp, FaArrowDown, FaEye,
    FaSync, FaShoppingCart, FaTruck, FaChartLine, FaFileExcel
} from "react-icons/fa";
import { getProfitLossList, getProfitLossItems } from "../services/financeService";
import RequisitionSelector from "../components/common/RequisitionSelector";
import AlertToast from "../components/ui/AlertToast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function RevenueAnalysis() {
    const [pnlList, setPnlList] = useState([]);
    const [pnlSummary, setPnlSummary] = useState(null);
    const [pnlLoading, setPnlLoading] = useState(false);
    const [filterRequisition, setFilterRequisition] = useState("");
    const [filterFY, setFilterFY] = useState("");
    const [itemModal, setItemModal] = useState({ open: false, reqNumber: "", items: [], loading: false, transport: 0 });
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });

    const generateFYOptions = () => {
        const now = new Date();
        const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        const options = [];
        for (let y = currentYear; y >= currentYear - 5; y--) {
            options.push({ value: `${y}-${y + 1}`, label: `FY ${y}-${String(y + 1).slice(2)}` });
        }
        return options;
    };

    const fetchPnlData = async () => {
        setPnlLoading(true);
        try {
            const params = {};
            if (filterRequisition) params.requisition = filterRequisition;
            if (filterFY) params.fy = filterFY;
            const data = await getProfitLossList(params);
            setPnlList(data.requisitions || []);
            setPnlSummary(data.summary || null);
        } catch {
            setToast({ open: true, type: "error", message: "Failed to fetch P&L data" });
        } finally {
            setPnlLoading(false);
        }
    };

    useEffect(() => { fetchPnlData(); }, [filterRequisition, filterFY]);

    const openItemModal = async (reqId, reqNumber) => {
        setItemModal({ open: true, reqNumber, items: [], loading: true, transport: 0 });
        try {
            const data = await getProfitLossItems(reqId);
            setItemModal(prev => ({ ...prev, items: data.items || [], transport: data.total_transport_cost || 0, loading: false }));
        } catch {
            setToast({ open: true, type: "error", message: "Failed to load item breakdown" });
            setItemModal(prev => ({ ...prev, loading: false }));
        }
    };

    const closeItemModal = () => setItemModal({ open: false, reqNumber: "", items: [], loading: false, transport: 0 });

    const fmt = (v) => Number(v || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    const fmtD = (v) => Number(v || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

    const s = pnlSummary || {};
    const totalRevenue = s.total_revenue || 0;
    const totalPurchases = s.total_purchase_cost || 0;
    const totalTransport = s.total_transport_cost || 0;
    const totalProfit = s.total_profit_loss || 0;
    const overallMargin = s.overall_margin || 0;
    const profitCount = pnlList.filter(i => (i.profit_loss_inr || 0) > 0).length;
    const lossCount = pnlList.filter(i => (i.profit_loss_inr || 0) < 0).length;

    const handleExport = () => {
        const wb = XLSX.utils.book_new();
        const rows = [
            ["REVENUE & PROFITABILITY ANALYSIS"], ["Generated:", new Date().toLocaleString()], [],
            ["Requisition", "Purchase", "Transport", "Total Cost", "Revenue", "P&L", "Margin %", "Status"]
        ];
        pnlList.forEach(i => rows.push([i.requisition_number, i.purchase_cost_inr, i.transport_cost_inr, i.total_cost_inr, i.sales_revenue_inr, i.profit_loss_inr, i.margin_percentage, i.alert || "NORMAL"]));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "P&L");
        saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]), `Revenue_${new Date().toISOString().split('T')[0]}.xlsx`);
        setToast({ open: true, type: "success", message: "Exported" });
    };

    const MarginBadge = ({ margin }) => {
        const cls = margin >= 20 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : margin >= 10 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200';
        return <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-black border ${cls}`}>{Number(margin).toFixed(1)}%</span>;
    };

    const StatusBadge = ({ alert, revenue }) => {
        if (alert === 'LOSS') return <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase bg-red-100 text-red-700 border border-red-200">Loss</span>;
        if (alert === 'LOW_MARGIN') return <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200">Low</span>;
        if (revenue > 0) return <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">Healthy</span>;
        return <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200">Pending</span>;
    };

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-1">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <FaFileInvoiceDollar className="text-emerald-600" /> Revenue & Profitability
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm font-medium">Requisition-wise P&L with transport allocation</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={handleExport} disabled={pnlList.length === 0} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-lg transition-all active:scale-95 uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50">
                            <FaFileExcel /> Export
                        </button>
                        <button onClick={fetchPnlData} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all active:scale-95">
                            <FaSync size={12} className="text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {[
                        { label: "Revenue", value: fmt(totalRevenue), icon: <FaChartLine size={14} />, bg: "bg-blue-50", fg: "text-blue-600" },
                        { label: "Purchases", value: fmt(totalPurchases), icon: <FaShoppingCart size={14} />, bg: "bg-red-50", fg: "text-red-600" },
                        { label: "Transport", value: fmt(totalTransport), icon: <FaTruck size={14} />, bg: "bg-amber-50", fg: "text-amber-600" },
                        { label: "Net P&L", value: fmt(totalProfit), icon: totalProfit >= 0 ? <FaArrowUp size={14} /> : <FaArrowDown size={14} />, bg: totalProfit >= 0 ? "bg-emerald-50" : "bg-red-50", fg: totalProfit >= 0 ? "text-emerald-600" : "text-red-600", valueCls: totalProfit >= 0 ? "text-emerald-700" : "text-red-700" },
                    ].map((c, i) => (
                        <div key={i} className={`${i === 3 ? (totalProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100') : 'bg-white border-slate-200'} p-4 rounded-2xl border shadow-sm`}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className={`p-1.5 rounded-md ${c.bg} ${c.fg}`}>{c.icon}</div>
                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">{c.label}</span>
                            </div>
                            <p className={`text-lg font-black ${c.valueCls || 'text-slate-800'} truncate`}>{c.value}</p>
                        </div>
                    ))}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Margin</span>
                            <div className="flex gap-1.5 text-[8px] font-black">
                                <span className="text-emerald-600">{profitCount}P</span>
                                <span className="text-red-600">{lossCount}L</span>
                            </div>
                        </div>
                        <p className={`text-xl font-black ${overallMargin >= 10 ? 'text-emerald-700' : overallMargin >= 0 ? 'text-amber-700' : 'text-red-700'}`}>{Number(overallMargin).toFixed(1)}%</p>
                        <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${overallMargin >= 20 ? 'bg-emerald-500' : overallMargin >= 10 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, overallMargin))}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
                    <div className="w-44">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Financial Year</label>
                        <select value={filterFY} onChange={(e) => setFilterFY(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                            <option value="">All Years</option>
                            {generateFYOptions().map(fy => <option key={fy.value} value={fy.value}>{fy.label}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 max-w-sm">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                            Filter Requisition
                            {filterRequisition && <button onClick={() => setFilterRequisition("")} className="text-[9px] text-red-500 font-black uppercase hover:underline flex items-center gap-0.5"><FaTimes size={7} /> Clear</button>}
                        </label>
                        <RequisitionSelector value={filterRequisition} onChange={setFilterRequisition} placeholder="Select requisition..." />
                    </div>
                    <div className="flex items-center gap-3 pb-1">
                        {(filterFY || filterRequisition) && (
                            <button onClick={() => { setFilterFY(""); setFilterRequisition(""); }} className="text-[9px] text-red-500 font-black uppercase hover:underline flex items-center gap-0.5"><FaTimes size={7} /> Clear All</button>
                        )}
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{pnlList.length} record{pnlList.length !== 1 ? 's' : ''}{filterFY && ` · ${filterFY}`}</span>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] border-collapse text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    {["Requisition", "Purchase", "Transport", "Total Cost", "Revenue", "P&L", "Margin", "Status", ""].map((h, i) => (
                                        <th key={i} className={`px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider ${i >= 1 && i <= 5 ? 'text-right' : ''} ${i >= 6 ? 'text-center' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pnlLoading ? (
                                    Array(3).fill(0).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan="9" className="px-4 py-6"><div className="h-3 bg-slate-100 rounded w-full"></div></td></tr>)
                                ) : pnlList.length > 0 ? pnlList.map((item, idx) => {
                                    const profit = parseFloat(item.profit_loss_inr || 0);
                                    const margin = parseFloat(item.margin_percentage || 0);
                                    const revenue = parseFloat(item.sales_revenue_inr || 0);
                                    return (
                                        <tr key={item.requisition_id || idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 py-3.5">
                                                <span className={`font-mono font-bold px-2.5 py-1 rounded border text-xs ${item.is_stock_sale ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-blue-700 bg-blue-50 border-blue-100'}`}>{item.requisition_number}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-600">{fmtD(item.purchase_cost_inr)}</td>
                                            <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-500">{fmtD(item.transport_cost_inr)}</td>
                                            <td className="px-4 py-3.5 text-right font-mono text-sm font-bold text-slate-800">{fmtD(item.total_cost_inr)}</td>
                                            <td className="px-4 py-3.5 text-right font-mono text-sm font-bold">{revenue > 0 ? <span className="text-blue-700">{fmtD(revenue)}</span> : <span className="text-slate-400">No sale</span>}</td>
                                            <td className={`px-4 py-3.5 text-right font-mono text-sm font-black ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{profit >= 0 ? '+' : ''}{fmtD(profit)}</td>
                                            <td className="px-4 py-3 text-center"><MarginBadge margin={margin} /></td>
                                            <td className="px-4 py-3 text-center"><StatusBadge alert={item.alert} revenue={revenue} /></td>
                                            <td className="px-4 py-3 text-center">
                                                {item.requisition_id ? (
                                                    <button onClick={() => openItemModal(item.requisition_id, item.requisition_number)} className="p-1.5 rounded-md bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white transition-all active:scale-90 opacity-60 group-hover:opacity-100" title="Item Breakdown">
                                                        <FaEye size={12} />
                                                    </button>
                                                ) : (
                                                    <span className="text-[9px] text-slate-400 font-bold">N/A</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="9" className="px-4 py-16 text-center">
                                        <FaFileInvoiceDollar size={24} className="text-slate-200 mx-auto mb-2" />
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No P&L records found</p>
                                        {filterRequisition && <button onClick={() => setFilterRequisition("")} className="text-blue-600 font-bold text-[10px] uppercase mt-1 hover:underline">Show All</button>}
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Item Breakdown Modal */}
            {itemModal.open && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeItemModal}></div>
                    <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
                            <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight truncate">Item P&L — {itemModal.reqNumber}</h3>
                                <p className="text-xs text-slate-400 font-bold mt-0.5">Transport Allocated: {fmtD(itemModal.transport)}</p>
                            </div>
                            <button onClick={closeItemModal} className="p-2 hover:bg-white/10 rounded-lg shrink-0 ml-2"><FaTimes size={16} /></button>
                        </div>

                        {/* Summary Strip */}
                        {!itemModal.loading && itemModal.items.length > 0 && (() => {
                            const tCost = itemModal.items.reduce((a, i) => a + parseFloat(i.total_cost_inr || 0), 0);
                            const tRev = itemModal.items.reduce((a, i) => a + parseFloat(i.selling_amount_inr || 0), 0);
                            const tPL = tRev - tCost;
                            return (
                                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap gap-5 text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                                    <span>{itemModal.items.length} Items</span>
                                    <span>Cost: <span className="text-slate-800">{fmtD(tCost)}</span></span>
                                    <span>Revenue: <span className="text-blue-700">{fmtD(tRev)}</span></span>
                                    <span>P&L: <span className={tPL >= 0 ? 'text-emerald-600' : 'text-red-600'}>{tPL >= 0 ? '+' : ''}{fmtD(tPL)}</span></span>
                                </div>
                            );
                        })()}

                        {/* Modal Body */}
                        <div className="flex-1 overflow-auto">
                            {itemModal.loading ? (
                                <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                            ) : itemModal.items.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[750px] text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                            <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                <th className="px-4 py-3 text-left">Product</th>
                                                <th className="px-4 py-3 text-right">Buy Qty</th>
                                                <th className="px-4 py-3 text-right">Buy Amt</th>
                                                <th className="px-4 py-3 text-right">Transport</th>
                                                <th className="px-4 py-3 text-right">Total Cost</th>
                                                <th className="px-4 py-3 text-right">Sell Qty</th>
                                                <th className="px-4 py-3 text-right">Sell Amt</th>
                                                <th className="px-4 py-3 text-right">P&L</th>
                                                <th className="px-4 py-3 text-center">Margin</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {itemModal.items.map((it, i) => {
                                                const pl = parseFloat(it.profit_loss_inr || 0);
                                                const mg = parseFloat(it.margin_percentage || 0);
                                                return (
                                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold text-slate-800 text-sm">{it.product_name}</div>
                                                            <div className="text-[10px] text-slate-400 font-mono">{it.product_code} · {it.unit}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-600">{it.purchase_qty}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                                                            {fmtD(it.purchase_amount_inr)}
                                                            {it.purchase_currency && it.purchase_currency !== 'INR' && (
                                                                <div className="text-[10px] text-blue-500 mt-0.5">{it.purchase_currency} {Number(it.purchase_amount_original || 0).toFixed(2)} @{it.purchase_conversion_rate}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-slate-400">{fmtD(it.allocated_transport_inr)}</td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{fmtD(it.total_cost_inr)}</td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-600">{it.selling_qty}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                                                            {fmtD(it.selling_amount_inr)}
                                                            {it.selling_currency && it.selling_currency !== 'INR' && (
                                                                <div className="text-[10px] text-emerald-500 mt-0.5">{it.selling_currency} {Number(it.selling_amount_original || 0).toFixed(2)} @{it.selling_conversion_rate}</div>
                                                            )}
                                                        </td>
                                                        <td className={`px-4 py-3 text-right font-mono font-black ${pl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{pl >= 0 ? '+' : ''}{fmtD(pl)}</td>
                                                        <td className="px-4 py-3 text-center"><MarginBadge margin={mg} /></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-16 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No item data</div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end shrink-0">
                            <button onClick={closeItemModal} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-lg transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            <AlertToast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
        </>
    );
}
