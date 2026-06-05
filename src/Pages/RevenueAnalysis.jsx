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
    const [itemModal, setItemModal] = useState({ open: false, reqId: null, reqNumber: "", items: [], loading: false, transport: 0 });
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });

    const fetchPnlData = async () => {
        setPnlLoading(true);
        try {
            const params = {};
            if (filterRequisition) params.requisition = filterRequisition;
            const data = await getProfitLossList(params);
            setPnlList(data.requisitions || []);
            setPnlSummary(data.summary || null);
        } catch {
            setToast({ open: true, type: "error", message: "Failed to fetch profit & loss data" });
        } finally {
            setPnlLoading(false);
        }
    };

    useEffect(() => { fetchPnlData(); }, [filterRequisition]);

    const handleViewItems = async (reqId, reqNumber) => {
        setItemModal({ open: true, reqId, reqNumber, items: [], loading: true, transport: 0 });
        try {
            const data = await getProfitLossItems(reqId);
            setItemModal(prev => ({ ...prev, items: data.items || [], transport: data.total_transport_cost || 0, loading: false }));
        } catch {
            setToast({ open: true, type: "error", message: "Failed to load item details" });
            setItemModal(prev => ({ ...prev, loading: false }));
        }
    };

    const fmt = (amount) => Number(amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    const fmtFull = (amount) => Number(amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

    const totalRevenue = pnlSummary?.total_revenue || 0;
    const totalPurchases = pnlSummary?.total_purchase_cost || 0;
    const totalTransport = pnlSummary?.total_transport_cost || 0;
    const totalProfit = pnlSummary?.total_profit_loss || 0;
    const overallMargin = pnlSummary?.overall_margin || 0;

    const profitableCount = pnlList.filter(i => parseFloat(i.profit_loss_inr || 0) > 0).length;
    const lossCount = pnlList.filter(i => parseFloat(i.profit_loss_inr || 0) < 0).length;

    const handleExport = () => {
        const wb = XLSX.utils.book_new();
        const sheet = [
            ["REVENUE & PROFITABILITY ANALYSIS"],
            ["Generated:", new Date().toLocaleString()],
            ["Total Revenue:", totalRevenue, "Total Purchase:", totalPurchases, "Transport:", totalTransport, "Net Profit:", totalProfit, "Margin:", `${overallMargin}%`],
            [],
            ["Requisition", "Purchase Cost", "Transport Cost", "Total Cost", "Sales Revenue", "Profit/Loss", "Margin %", "Status"]
        ];
        pnlList.forEach(item => sheet.push([
            item.requisition_number,
            item.purchase_cost_inr, item.transport_cost_inr, item.total_cost_inr,
            item.sales_revenue_inr, item.profit_loss_inr, item.margin_percentage, item.alert || "NORMAL"
        ]));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet), "P&L Report");
        saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]), `Revenue_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
        setToast({ open: true, type: "success", message: "Report exported successfully" });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-1">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <FaFileInvoiceDollar className="text-emerald-600" /> Revenue & Profitability
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Requisition-wise P&L with transport cost allocation and item-level breakdown</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleExport} disabled={pnlList.length === 0} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all active:scale-95 uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
                        <FaFileExcel /> Export
                    </button>
                    <button onClick={fetchPnlData} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95">
                        <FaSync size={14} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><FaChartLine size={16} /></div>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Revenue</span>
                    </div>
                    <p className="text-xl font-black text-slate-800">{fmt(totalRevenue)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-red-50 text-red-600"><FaShoppingCart size={16} /></div>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Purchases</span>
                    </div>
                    <p className="text-xl font-black text-slate-800">{fmt(totalPurchases)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><FaTruck size={16} /></div>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Transport</span>
                    </div>
                    <p className="text-xl font-black text-slate-800">{fmt(totalTransport)}</p>
                </div>
                <div className={`p-5 rounded-2xl border shadow-sm ${totalProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${totalProfit >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {totalProfit >= 0 ? <FaArrowUp size={16} /> : <FaArrowDown size={16} />}
                        </div>
                        <span className={`text-[10px] uppercase font-black tracking-wider ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Net P&L</span>
                    </div>
                    <p className={`text-xl font-black ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(totalProfit)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Margin</span>
                        <div className="flex gap-2 text-[9px] font-black">
                            <span className="text-emerald-600">{profitableCount} profit</span>
                            <span className="text-red-600">{lossCount} loss</span>
                        </div>
                    </div>
                    <p className={`text-2xl font-black ${overallMargin >= 10 ? 'text-emerald-700' : overallMargin >= 0 ? 'text-amber-700' : 'text-red-700'}`}>{Number(overallMargin).toFixed(1)}%</p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className={`h-full rounded-full ${overallMargin >= 20 ? 'bg-emerald-500' : overallMargin >= 10 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, overallMargin))}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="flex-1 max-w-md">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                            Filter by Requisition
                            {filterRequisition && (
                                <button onClick={() => setFilterRequisition("")} className="text-[9px] font-black text-red-500 uppercase hover:underline flex items-center gap-0.5">
                                    <FaTimes size={8} /> Clear
                                </button>
                            )}
                        </label>
                        <RequisitionSelector value={filterRequisition} onChange={(id) => setFilterRequisition(id)} placeholder="Select requisition for detailed P&L..." />
                    </div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest pb-2">
                        {pnlList.length} requisition{pnlList.length !== 1 ? 's' : ''} shown
                    </div>
                </div>
            </div>

            {/* P&L Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Requisition</th>
                                <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Purchase</th>
                                <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transport</th>
                                <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Cost</th>
                                <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Revenue</th>
                                <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">P&L</th>
                                <th className="px-5 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Margin</th>
                                <th className="px-5 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pnlLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse"><td colSpan="9" className="px-5 py-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td></tr>
                                ))
                            ) : pnlList.length > 0 ? (
                                pnlList.map((item, idx) => {
                                    const profit = parseFloat(item.profit_loss_inr || 0);
                                    const margin = parseFloat(item.margin_percentage || 0);
                                    const revenue = parseFloat(item.sales_revenue_inr || 0);
                                    return (
                                        <tr key={item.requisition_id || idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-5 py-4">
                                                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 text-xs">{item.requisition_number}</span>
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono text-sm text-slate-600">{fmtFull(item.purchase_cost_inr)}</td>
                                            <td className="px-5 py-4 text-right font-mono text-sm text-slate-500">{fmtFull(item.transport_cost_inr)}</td>
                                            <td className="px-5 py-4 text-right font-mono text-sm font-bold text-slate-800">{fmtFull(item.total_cost_inr)}</td>
                                            <td className="px-5 py-4 text-right">
                                                <span className={`font-mono text-sm font-bold ${revenue > 0 ? 'text-blue-700' : 'text-slate-400'}`}>{revenue > 0 ? fmtFull(revenue) : 'No sale'}</span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className={`font-mono text-sm font-black ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {profit >= 0 ? '+' : ''}{fmtFull(profit)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${
                                                        margin >= 20 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        margin >= 10 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        margin > 0 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        'bg-red-50 text-red-700 border-red-200'
                                                    }`}>{margin.toFixed(1)}%</span>
                                                    <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full ${margin >= 20 ? 'bg-emerald-500' : margin >= 10 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {item.alert === 'LOSS' ? (
                                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">Loss</span>
                                                ) : item.alert === 'LOW_MARGIN' ? (
                                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">Low</span>
                                                ) : revenue > 0 ? (
                                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">Healthy</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <button onClick={() => handleViewItems(item.requisition_id, item.requisition_number)} className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-all active:scale-90 opacity-70 group-hover:opacity-100" title="Item-wise Breakdown">
                                                    <FaEye size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="9" className="px-5 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300"><FaFileInvoiceDollar size={28} /></div>
                                            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No P&L records found</p>
                                            {filterRequisition && <button onClick={() => setFilterRequisition("")} className="text-blue-600 font-black hover:underline uppercase text-[10px] tracking-widest">Show All</button>}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Item P&L Modal */}
            {itemModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setItemModal({ open: false, reqId: null, reqNumber: "", items: [], loading: false, transport: 0 })}></div>
                    <div className="relative bg-white w-full max-w-6xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><FaEye className="text-blue-400" /> Item-wise P&L Breakdown</h3>
                                <p className="text-xs text-slate-400 font-bold mt-1">{itemModal.reqNumber} | Transport Allocated: {fmtFull(itemModal.transport)}</p>
                            </div>
                            <button onClick={() => setItemModal({ open: false, reqId: null, reqNumber: "", items: [], loading: false, transport: 0 })} className="p-2 hover:bg-white/10 rounded-full"><FaTimes size={18} /></button>
                        </div>

                        {/* Summary strip */}
                        {!itemModal.loading && itemModal.items.length > 0 && (
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap gap-6 text-xs font-bold text-slate-600 shrink-0">
                                <span>Items: <span className="text-slate-800">{itemModal.items.length}</span></span>
                                <span>Total Cost: <span className="text-slate-800">{fmtFull(itemModal.items.reduce((s, i) => s + parseFloat(i.total_cost_inr || 0), 0))}</span></span>
                                <span>Total Revenue: <span className="text-blue-700">{fmtFull(itemModal.items.reduce((s, i) => s + parseFloat(i.selling_amount_inr || 0), 0))}</span></span>
                                <span>Net P&L: <span className={`font-black ${itemModal.items.reduce((s, i) => s + parseFloat(i.profit_loss_inr || 0), 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtFull(itemModal.items.reduce((s, i) => s + parseFloat(i.profit_loss_inr || 0), 0))}</span></span>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto">
                            {itemModal.loading ? (
                                <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                            ) : itemModal.items.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                                        <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="px-5 py-3 text-left">Product</th>
                                            <th className="px-5 py-3 text-right">Buy Qty</th>
                                            <th className="px-5 py-3 text-right">Buy Amount</th>
                                            <th className="px-5 py-3 text-right">Transport</th>
                                            <th className="px-5 py-3 text-right">Total Cost</th>
                                            <th className="px-5 py-3 text-right">Sell Qty</th>
                                            <th className="px-5 py-3 text-right">Sell Amount</th>
                                            <th className="px-5 py-3 text-right">P&L</th>
                                            <th className="px-5 py-3 text-center">Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {itemModal.items.map((it, i) => {
                                            const pl = parseFloat(it.profit_loss_inr || 0);
                                            const mg = parseFloat(it.margin_percentage || 0);
                                            return (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <div className="font-bold text-slate-800">{it.product_name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">{it.product_code} | {it.unit}</div>
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-600">{it.purchase_qty}</td>
                                                    <td className="px-5 py-3 text-right font-mono text-slate-600">{fmtFull(it.purchase_amount_inr)}</td>
                                                    <td className="px-5 py-3 text-right font-mono text-slate-500">{fmtFull(it.allocated_transport_inr)}</td>
                                                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-800">{fmtFull(it.total_cost_inr)}</td>
                                                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-600">{it.selling_qty}</td>
                                                    <td className="px-5 py-3 text-right font-mono text-slate-600">{fmtFull(it.selling_amount_inr)}</td>
                                                    <td className={`px-5 py-3 text-right font-mono font-black ${pl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{pl >= 0 ? '+' : ''}{fmtFull(pl)}</td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${mg >= 20 ? 'bg-emerald-50 text-emerald-700' : mg >= 10 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                                            {mg.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No item data for this requisition</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <AlertToast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, open: false })} />
        </div>
    );
}
