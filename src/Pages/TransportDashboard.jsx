import React, { useState, useEffect } from "react";
import {
    FaTruck,
    FaCoins,
    FaHourglassHalf,
    FaCalendarCheck,
    FaChartPie,
    FaSearch,
    FaChartBar,
    FaTimes,
    FaBarcode,
    FaBoxes,
    FaFileExcel
} from "react-icons/fa";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";
import {
    getTransportDashboard,
    getTransportCostByPO,
    getTransportCostByVendor,
    getTransportCostBreakdown,
    getTransportLandedCostReport,
    getTransportsReport
} from "../services/transportService";
import AlertToast from "../components/ui/AlertToast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const COLORS = [
    "#4f46e5", "#10b981", "#06b6d4", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6", "#f97316"
];

const EMPTY_SUMMARY = {
    total_freight_cost: 0,
    active_transports_count: 0,
    total_transports_count: 0,
    delivered_transports_count: 0,
    transporter_count: 0
};

export default function TransportDashboard() {
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [downloading, setDownloading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState("all");

    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    const [byPoData, setByPoData] = useState([]);
    const [byVendorData, setByVendorData] = useState([]);
    const [breakdownData, setBreakdownData] = useState([]);
    const [landedCostData, setLandedCostData] = useState([]);
    const [landedCostSearch, setLandedCostSearch] = useState("");
    const [landedCostPage, setLandedCostPage] = useState(1);

    const fetchAllReports = async () => {
        setLoading(true);
        try {
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const [sumRes, poRes, vendorRes, breakdownRes, landedRes] = await Promise.allSettled([
                getTransportDashboard(params),
                getTransportCostByPO(params),
                getTransportCostByVendor(params),
                getTransportCostBreakdown(params),
                getTransportLandedCostReport(params)
            ]);

            if (sumRes.status === "fulfilled" && sumRes.value?.summary) {
                const s = sumRes.value.summary;
                setSummary({
                    total_freight_cost: parseFloat(s.total_cost) || 0,
                    active_transports_count: (parseInt(s.pending) || 0) + (parseInt(s.in_transit) || 0),
                    total_transports_count: parseInt(s.total_entries) || 0,
                    delivered_transports_count: parseInt(s.delivered) || 0,
                    transporter_count: sumRes.value.recent_entries
                        ? new Set(sumRes.value.recent_entries.map(e => e.transporter_name).filter(Boolean)).size
                        : 0
                });
            } else {
                setSummary(EMPTY_SUMMARY);
            }

            if (poRes.status === "fulfilled" && Array.isArray(poRes.value?.purchase_orders)) {
                setByPoData(poRes.value.purchase_orders.map(p => ({
                    po_number: p.po_number || "Direct PI",
                    total_cost: parseFloat(p.grand_total || p.total_transport_cost) || 0
                })));
            } else {
                setByPoData([]);
            }

            if (vendorRes.status === "fulfilled" && Array.isArray(vendorRes.value?.vendors)) {
                setByVendorData(vendorRes.value.vendors.map(v => ({
                    vendor_name: v.vendor_name || "Direct",
                    total_cost: parseFloat(v.total_transport_cost) || 0
                })));
            } else {
                setByVendorData([]);
            }

            if (breakdownRes.status === "fulfilled" && Array.isArray(breakdownRes.value?.breakdown)) {
                setBreakdownData(breakdownRes.value.breakdown.map(b => ({
                    cost_type: b.cost_type,
                    cost_type_display: b.cost_type_display || b.cost_type,
                    total_amount: parseFloat(b.total_amount) || 0
                })));
            } else {
                setBreakdownData([]);
            }

            if (landedRes.status === "fulfilled" && Array.isArray(landedRes.value?.items)) {
                setLandedCostData(landedRes.value.items.map(i => ({
                    item_name: i.product_name || i.item_name,
                    po_number: i.po_number || "Direct",
                    quantity: i.quantity || 0,
                    unit_landed_cost: i.allocated_transport && i.quantity ? (parseFloat(i.allocated_transport) / i.quantity) : 0,
                    total_landed_cost: parseFloat(i.allocated_transport) || 0,
                    purchase_rate: parseFloat(i.purchase_rate) || 0,
                    landed_cost: parseFloat(i.landed_cost) || 0
                })));
            } else {
                setLandedCostData([]);
            }
        } catch (error) {
            console.error("Dashboard fetch failed:", error);
            setSummary(EMPTY_SUMMARY);
            setByPoData([]);
            setByVendorData([]);
            setBreakdownData([]);
            setLandedCostData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllReports();
    }, [startDate, endDate]);

    const formatCurrency = (amount) => {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        });
    };

    const filteredLandedCost = landedCostData.filter(item => {
        const query = landedCostSearch.toLowerCase();
        return (
            (item.item_name || "").toLowerCase().includes(query) ||
            (item.po_number || "").toLowerCase().includes(query)
        );
    });

    const itemsPerPage = 5;
    const paginatedLandedCost = filteredLandedCost.slice(
        (landedCostPage - 1) * itemsPerPage,
        landedCostPage * itemsPerPage
    );
    const totalLandedPages = Math.ceil(filteredLandedCost.length / itemsPerPage);

    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const wb = XLSX.utils.book_new();
            const fileNameDate = `${startDate || 'start'}_to_${endDate || 'end'}`;

            if (reportType === "all") {
                const summarySheetData = [
                    ["LOGISTICS SUMMARY ANALYTICS REPORT"],
                    ["Start Date:", startDate || "All Time"], ["End Date:", endDate || "All Time"],
                    ["Generated At:", new Date().toLocaleString()], [],
                    ["Metric", "Value"],
                    ["Total Freight Cost", summary.total_freight_cost],
                    ["Active Shipments", summary.active_transports_count],
                    ["Delivered Shipments", summary.delivered_transports_count],
                    ["Total Logistics", summary.total_transports_count],
                    ["Active Transporters", summary.transporter_count]
                ];
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summarySheetData), "Summary");

                const poSheet = [["COST BY PURCHASE ORDER"], [], ["PO Number", "Total Cost"]];
                byPoData.forEach(p => poSheet.push([p.po_number, p.total_cost]));
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(poSheet), "Cost by PO");

                const vendorSheet = [["COST BY TRANSPORTER"], [], ["Transporter", "Total Cost"]];
                byVendorData.forEach(v => vendorSheet.push([v.vendor_name, v.total_cost]));
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(vendorSheet), "Cost by Transporter");

                const bkSheet = [["COST BREAKDOWN"], [], ["Type", "Display", "Amount"]];
                breakdownData.forEach(b => bkSheet.push([b.cost_type, b.cost_type_display, b.total_amount]));
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bkSheet), "Breakdown");

                const lcSheet = [["LANDED COSTS"], [], ["Item", "PO", "Qty", "Unit Freight", "Total Freight", "Purchase Rate", "Landed Cost"]];
                landedCostData.forEach(i => lcSheet.push([i.item_name, i.po_number, i.quantity, i.unit_landed_cost, i.total_landed_cost, i.purchase_rate, i.landed_cost]));
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(lcSheet), "Landed Costs");
            } else if (reportType === "raw_transports") {
                const params = {};
                if (startDate) params.start_date = startDate;
                if (endDate) params.end_date = endDate;
                const res = await getTransportsReport(params);
                const data = res.data || res;
                let list = Array.isArray(data) ? data : (data?.results || []);
                const sheet = [["RAW TRANSPORT ENTRIES"], [], ["Transport#", "Transporter", "Vehicle", "Dispatch Date", "Status", "From", "To", "Total Cost"]];
                list.forEach(t => {
                    const cost = t.total_cost ? parseFloat(t.total_cost) : (t.cost_items || []).reduce((s, c) => s + parseFloat(c.amount || 0), 0);
                    sheet.push([t.transport_number, t.transporter_name, t.vehicle_number, t.dispatch_date, t.status, t.dispatch_from, t.dispatch_to, cost]);
                });
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet), "Transports");
            } else {
                let sheetData = [];
                let sheetName = "Report";
                if (reportType === "by_po") {
                    sheetData = [["COST BY PO"], [], ["PO Number", "Total Cost"]];
                    byPoData.forEach(p => sheetData.push([p.po_number, p.total_cost]));
                    sheetName = "Cost by PO";
                } else if (reportType === "by_vendor") {
                    sheetData = [["COST BY TRANSPORTER"], [], ["Transporter", "Total Cost"]];
                    byVendorData.forEach(v => sheetData.push([v.vendor_name, v.total_cost]));
                    sheetName = "Cost by Transporter";
                } else if (reportType === "breakdown") {
                    sheetData = [["COST BREAKDOWN"], [], ["Type", "Display", "Amount"]];
                    breakdownData.forEach(b => sheetData.push([b.cost_type, b.cost_type_display, b.total_amount]));
                    sheetName = "Breakdown";
                } else if (reportType === "landed_cost") {
                    sheetData = [["LANDED COSTS"], [], ["Item", "PO", "Qty", "Unit Freight", "Total Freight", "Purchase Rate", "Landed Cost"]];
                    landedCostData.forEach(i => sheetData.push([i.item_name, i.po_number, i.quantity, i.unit_landed_cost, i.total_landed_cost, i.purchase_rate, i.landed_cost]));
                    sheetName = "Landed Costs";
                }
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetData), sheetName);
            }

            const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `Logistics_Report_${fileNameDate}.xlsx`);
            setShowReportModal(false);
            setAlert({ open: true, type: "success", message: "Report downloaded successfully" });
        } catch (error) {
            console.error("Export failed:", error);
            setAlert({ open: true, type: "error", message: `Export failed: ${error.message}` });
        } finally {
            setDownloading(false);
        }
    };

    const EmptyState = ({ message }) => (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <FaTruck size={28} className="mb-3 opacity-30" />
            <p className="text-xs font-bold uppercase tracking-widest">{message}</p>
        </div>
    );

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-1">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <FaChartPie className="text-blue-600" />
                            Logistics Analytics &amp; Landed Costs
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">Freight expenditures, carrier shares, and item landed costs</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowReportModal(true)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all active:scale-95 uppercase tracking-widest flex items-center gap-2">
                            <FaFileExcel className="text-sm" /> Export Excel
                        </button>
                        <button onClick={fetchAllReports} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-200 transition-all active:scale-95 uppercase tracking-widest">
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 px-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Filter:</span>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">From</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">To</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                        {(startDate || endDate) && (
                            <button onClick={() => { setStartDate(""); setEndDate(""); }} className="text-xs text-red-500 font-bold hover:text-red-700 uppercase flex items-center gap-1.5">
                                <FaTimes /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-24 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading logistics data...</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="p-4 rounded-xl bg-blue-50 text-blue-600 border border-blue-100"><FaCoins size={22} /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Freight</p>
                                    <p className="text-xl font-black text-slate-800 leading-tight mt-1 truncate">{formatCurrency(summary.total_freight_cost)}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="p-4 rounded-xl bg-amber-50 text-amber-600 border border-amber-100"><FaHourglassHalf size={22} /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Shipments</p>
                                    <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{summary.active_transports_count}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100"><FaCalendarCheck size={22} /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Delivered</p>
                                    <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{summary.delivered_transports_count} <span className="text-xs text-slate-400 font-semibold">/ {summary.total_transports_count}</span></p>
                                    {summary.total_transports_count > 0 && (
                                        <div className="h-1 bg-slate-100 rounded-full w-full mt-2 overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(summary.delivered_transports_count / summary.total_transports_count) * 100}%` }}></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="p-4 rounded-xl bg-violet-50 text-violet-600 border border-violet-100"><FaTruck size={22} /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transporters</p>
                                    <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{summary.transporter_count}</p>
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
                                <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2 mb-4">
                                    <FaChartPie className="text-slate-400" /> Cost Breakdown by Type
                                </h3>
                                {breakdownData.length > 0 ? (
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="total_amount" nameKey="cost_type_display">
                                                    {breakdownData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip formatter={(val) => formatCurrency(val)} />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : <EmptyState message="No cost breakdown data" />}
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
                                <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2 mb-4">
                                    <FaTruck className="text-slate-400" /> Expenditure by Transporter
                                </h3>
                                {byVendorData.length > 0 ? (
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={byVendorData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" tickFormatter={(v) => `₹${v}`} />
                                                <YAxis dataKey="vendor_name" type="category" width={110} tick={{ fontSize: 10, fontWeight: 700 }} />
                                                <Tooltip formatter={(val) => formatCurrency(val)} />
                                                <Bar dataKey="total_cost" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : <EmptyState message="No transporter data" />}
                            </div>
                        </div>

                        {/* PO Cost Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[350px]">
                            <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2 mb-4">
                                <FaChartBar className="text-slate-400" /> Expenses by Purchase Order
                            </h3>
                            {byPoData.length > 0 ? (
                                <div className="h-60 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={byPoData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="po_number" tick={{ fontSize: 10, fontWeight: 700 }} />
                                            <YAxis tickFormatter={(v) => `₹${v}`} />
                                            <Tooltip formatter={(val) => formatCurrency(val)} />
                                            <Bar dataKey="total_cost" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={28} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : <EmptyState message="No PO cost data" />}
                        </div>

                        {/* Landed Cost Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                                <div>
                                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
                                        <FaBoxes className="text-slate-400" /> Item-wise Landed Freight Costs
                                    </h3>
                                </div>
                                <div className="w-full md:w-80 relative">
                                    <input type="text" placeholder="Search product or PO..." value={landedCostSearch} onChange={(e) => { setLandedCostSearch(e.target.value); setLandedCostPage(1); }}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
                                            <th className="px-6 py-3.5">Product Item</th>
                                            <th className="px-6 py-3.5">Purchase Order</th>
                                            <th className="px-6 py-3.5 text-center">Qty</th>
                                            <th className="px-6 py-3.5 text-right">Unit Freight</th>
                                            <th className="px-6 py-3.5 text-right">Total Freight</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {paginatedLandedCost.length > 0 ? (
                                            paginatedLandedCost.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                                                        <FaBarcode className="text-slate-300" size={12} /> {item.item_name}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{item.po_number}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-600">{item.quantity}</td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-700 font-mono text-xs">{formatCurrency(item.unit_landed_cost)}</td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-800 font-mono text-xs">{formatCurrency(item.total_landed_cost)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">No landed cost data available</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {totalLandedPages > 1 && (
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                                    <div className="text-xs text-slate-400 font-bold uppercase">Showing {paginatedLandedCost.length} of {filteredLandedCost.length}</div>
                                    <div className="flex gap-2">
                                        <button disabled={landedCostPage === 1} onClick={() => setLandedCostPage(p => p - 1)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 active:scale-95">PREV</button>
                                        <button disabled={landedCostPage === totalLandedPages} onClick={() => setLandedCostPage(p => p + 1)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 active:scale-95">NEXT</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <AlertToast open={alert.open} type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, open: false })} />

            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><FaFileExcel className="text-emerald-600" /> Export Report</h3>
                            <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
                        </div>
                        <div className="p-6 space-y-3">
                            {["all", "by_po", "by_vendor", "breakdown", "landed_cost", "raw_transports"].map(type => (
                                <label key={type} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input type="radio" name="reportType" value={type} checked={reportType === type} onChange={(e) => setReportType(e.target.value)} className="text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm font-semibold text-slate-700">
                                        {{ all: "Full Analytics Report", by_po: "Cost by PO", by_vendor: "Cost by Transporter", breakdown: "Cost Breakdown", landed_cost: "Item Landed Cost", raw_transports: "Raw Transport Entries" }[type]}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <button onClick={() => setShowReportModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">Cancel</button>
                            <button onClick={handleDownloadReport} disabled={downloading} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2">
                                {downloading ? "Exporting..." : "Download Excel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
