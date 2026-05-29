import React, { useEffect, useState } from "react";
import { 
    FaTimes, 
    FaFileInvoiceDollar, 
    FaArrowUp, 
    FaArrowDown, 
    FaCalculator, 
    FaInfoCircle 
} from "react-icons/fa";
import { getProfitLossList } from "../services/financeService";
import RequisitionSelector from "../components/common/RequisitionSelector";
import AlertToast from "../components/ui/AlertToast";

export default function RevenueAnalysis() {
    // P&L list state
    const [pnlList, setPnlList] = useState([]);
    const [pnlSummary, setPnlSummary] = useState(null);
    const [pnlLoading, setPnlLoading] = useState(false);
    const [filterPnlRequisition, setFilterPnlRequisition] = useState("");
    



    // Alert Toast
    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
    });

    /* =========================
       FETCH PROFIT LOSS DATA
       ========================= */
    const fetchPnlData = async () => {
        setPnlLoading(true);
        try {
            const params = {};
            if (filterPnlRequisition) {
                params.requisition = filterPnlRequisition;
            }
            const data = await getProfitLossList(params);
            setPnlList(data.requisitions || []);
            setPnlSummary(data.summary || null);
        } catch (error) {
            console.error("Failed to load P&L data:", error);
            setToast({
                open: true,
                type: "error",
                message: "Failed to fetch profit & loss statements",
            });
        } finally {
            setPnlLoading(false);
        }
    };

    useEffect(() => {
        fetchPnlData();
    }, [filterPnlRequisition]);





    /* =========================
       FORMATTING HELPERS
       ========================= */
    const formatCurrency = (amount, curr = 'INR') => {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: curr === 'USD' ? 'USD' : 'INR',
            maximumFractionDigits: 2
        }).replace('US$', '$');
    };

    // Calculations for high level overview cards
    const totalRevenue = pnlSummary?.total_revenue ?? pnlList.reduce((sum, item) => sum + parseFloat(item.sales_revenue_inr || item.revenue || 0), 0);
    const totalPurchases = pnlSummary?.total_purchase_cost ?? pnlList.reduce((sum, item) => sum + parseFloat(item.purchase_cost_inr || item.purchase_cost || 0), 0);
    const totalTransport = pnlSummary?.total_transport_cost ?? pnlList.reduce((sum, item) => sum + parseFloat(item.transport_cost_inr || item.transport_cost || 0), 0);
    const totalNetProfit = pnlSummary?.total_profit_loss ?? pnlList.reduce((sum, item) => sum + parseFloat(item.profit_loss_inr || item.profit || 0), 0);
    const averageMargin = pnlSummary?.overall_margin ?? (pnlList.length > 0 
        ? pnlList.reduce((sum, item) => sum + parseFloat(item.margin_percentage || 0), 0) / pnlList.length 
        : 0);

    const getAlertBadge = (alert) => {
        switch (alert) {
            case 'LOSS':
                return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">CRITICAL LOSS</span>;
            case 'LOW_MARGIN':
                return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">LOW MARGIN</span>;
            case 'HEALTHY':
                return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">HEALTHY MARGIN</span>;
            default:
                return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-700 border border-slate-200">{alert || 'NORMAL'}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in py-1">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <FaFileInvoiceDollar className="text-emerald-600 animate-pulse" />
                        Revenue & Profitability Analysis
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Analyze gross revenues, requisition P&L, allocate transport overheads, and preview project viability.</p>
                </div>
            </div>

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Total Sales Revenue</p>
                    <p className="text-2xl font-black text-slate-800">{formatCurrency(totalRevenue, 'INR')}</p>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase mt-1">
                        <FaArrowUp size={8} /> Gross turnover
                    </div>
                </div>
                <div className="bg-red-50/20 p-6 rounded-2xl border border-slate-250/20 shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Combined Purchases & Transport</p>
                    <p className="text-2xl font-black text-red-650">{formatCurrency(totalPurchases + totalTransport, 'INR')}</p>
                    <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold uppercase mt-1">
                        Cost Price: {formatCurrency(totalPurchases)} | Freight: {formatCurrency(totalTransport)}
                    </div>
                </div>
                <div className={`p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all ${totalNetProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <p className={`text-[10px] uppercase font-black tracking-wider mb-1 ${totalNetProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Net Consolidated Profit</p>
                    <p className={`text-2xl font-black ${totalNetProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(totalNetProfit, 'INR')}</p>
                    <div className={`flex items-center gap-1 text-[10px] font-bold uppercase mt-1 ${totalNetProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {totalNetProfit >= 0 ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />} Combined margins
                    </div>
                </div>
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] text-amber-600 uppercase font-black tracking-wider mb-1">Average Profit Margin</p>
                    <p className="text-2xl font-black text-amber-700">{averageMargin.toFixed(2)}%</p>
                    <div className="w-full bg-amber-200/50 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, averageMargin))}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="max-w-md">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                        Filter by Requisition
                        {filterPnlRequisition && (
                            <button 
                                onClick={() => setFilterPnlRequisition("")}
                                className="text-[9px] font-black text-red-500 uppercase hover:underline flex items-center gap-0.5"
                            >
                                <FaTimes size={8} /> Clear filter
                            </button>
                        )}
                    </label>
                    <RequisitionSelector 
                        value={filterPnlRequisition}
                        onChange={(id) => setFilterPnlRequisition(id)}
                        placeholder="Choose a requisition to see its specific P&L details..."
                    />
                </div>
            </div>

            {/* Table View */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Requisition Number</th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Purchase Cost (INR)</th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transport Cost (INR)</th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Cost (INR)</th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sales Revenue (INR)</th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Profit / Loss (INR)</th>
                                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Margin Percentage</th>
                                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Viability Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                            {pnlLoading && pnlList.length === 0 ? (
                                Array(4).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="8" className="px-6 py-10"><div className="h-4 bg-slate-150 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : pnlList.length > 0 ? (
                                pnlList.map((item, idx) => {
                                    const profit = parseFloat(item.profit_loss_inr ?? item.net_profit ?? item.profit ?? 0);
                                    const margin = parseFloat(item.margin_percentage ?? item.profit_margin ?? 0);
                                    return (
                                        <tr key={item.requisition_id || idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs">
                                                    {item.requisition_number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-semibold text-slate-600">
                                                {formatCurrency(item.purchase_cost_inr ?? item.purchase_cost)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-semibold text-slate-500">
                                                {formatCurrency(item.transport_cost_inr ?? item.transport_cost ?? 0)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                                                {formatCurrency(item.total_cost_inr ?? item.total_cost ?? (parseFloat(item.purchase_cost_inr || 0) + parseFloat(item.transport_cost_inr || 0)))}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                                                {formatCurrency(item.sales_revenue_inr ?? item.revenue)}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-mono font-black ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {formatCurrency(profit)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                                                        margin >= 20 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        margin >= 10 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-red-50 text-red-700 border-red-100'
                                                    }`}>
                                                        {margin.toFixed(2)}%
                                                    </span>
                                                    <div className="w-12 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                        <div className={`h-full ${margin >= 20 ? 'bg-emerald-500' : margin >= 10 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-bold text-slate-800">
                                                {getAlertBadge(item.alert)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                <FaFileInvoiceDollar size={32} />
                                            </div>
                                            <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No profitability records found</p>
                                            <button onClick={() => setFilterPnlRequisition("")} className="text-emerald-600 font-black hover:underline uppercase text-[10px] tracking-widest mt-2">SHOW ALL RECORDS</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>




            {/* ALERT TOAST */}
            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />
        </div>
    );
}
