import React, { useState, useEffect } from "react";
import {
    FaTruck,
    FaCoins,
    FaHourglassHalf,
    FaCalendarCheck,
    FaChartPie,
    FaInfoCircle,
    FaSearch,
    FaChartBar,
    FaChevronDown,
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
    "#4f46e5", // Indigo
    "#10b981", // Emerald
    "#06b6d4", // Cyan
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#6366f1", // Violet
    "#14b8a6", // Teal
    "#f97316"  // Orange
];

// Aesthetic mock fallbacks for when database has no reports logged yet
const MOCK_SUMMARY = {
    total_freight_cost: 15300.25,
    active_transports_count: 3,
    total_transports_count: 8,
    delivered_transports_count: 5,
    transporter_count: 4
};

const MOCK_BY_PO = [
    { po_number: "PO/2026/0001", total_cost: 4500.00 },
    { po_number: "PO/2026/0002", total_cost: 3200.50 },
    { po_number: "PO/2026/0003", total_cost: 5600.75 },
    { po_number: "PO/2026/0004", total_cost: 2000.00 }
];

const MOCK_BY_VENDOR = [
    { vendor_name: "Blue Dart Logistics", total_cost: 6500.00 },
    { vendor_name: "DHL Carrier Corp", total_cost: 4800.75 },
    { vendor_name: "Raju Fast Freight", total_cost: 3000.00 },
    { vendor_name: "SafeTransit Co", total_cost: 1000.50 }
];

const MOCK_BREAKDOWN = [
    { cost_type: "FREIGHT", cost_type_display: "Freight Cost", total_amount: 11000.25 },
    { cost_type: "LOADING", cost_type_display: "Loading Charges", total_amount: 1500.00 },
    { cost_type: "UNLOADING", cost_type_display: "Unloading Charges", total_amount: 1200.00 },
    { cost_type: "INSURANCE", cost_type_display: "Transit Insurance", total_amount: 800.00 },
    { cost_type: "TOLL", cost_type_display: "Toll Taxes", total_amount: 800.00 }
];

const MOCK_LANDED_COST = [
    { item_name: "Copper Induction Cable 12mm", po_number: "PO/2026/0001", quantity: 150, unit_landed_cost: 30.00, total_landed_cost: 4500.00 },
    { item_name: "Galvanized Steel Conduit", po_number: "PO/2026/0002", quantity: 80, unit_landed_cost: 40.00, total_landed_cost: 3200.50 },
    { item_name: "Aluminium Circuit Breakers X9", po_number: "PO/2026/0003", quantity: 200, unit_landed_cost: 28.00, total_landed_cost: 5600.75 },
    { item_name: "Industrial Core Transformer 5kVA", po_number: "PO/2026/0004", quantity: 5, unit_landed_cost: 400.00, total_landed_cost: 2000.00 }
];

export default function TransportDashboard() {
    const [loading, setLoading] = useState(true);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [downloading, setDownloading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState("all"); // all, by_po, by_vendor, breakdown, landed_cost

    // Report State
    const [summary, setSummary] = useState(MOCK_SUMMARY);
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

            let demoDetected = false;

            // 1. Resolve general summary
            if (sumRes.status === "fulfilled" && sumRes.value && sumRes.value.summary) {
                const liveSum = sumRes.value.summary;
                setSummary({
                    total_freight_cost: parseFloat(liveSum.total_cost) || 0,
                    active_transports_count: (parseInt(liveSum.pending) || 0) + (parseInt(liveSum.in_transit) || 0),
                    total_transports_count: parseInt(liveSum.total_entries) || 0,
                    delivered_transports_count: parseInt(liveSum.delivered) || 0,
                    transporter_count: sumRes.value.recent_entries 
                        ? new Set(sumRes.value.recent_entries.map(e => e.transporter_name).filter(Boolean)).size 
                        : 0
                });
                
                if (parseInt(liveSum.total_entries) === 0) {
                    demoDetected = true;
                }
            } else {
                setSummary(MOCK_SUMMARY);
                demoDetected = true;
            }

            // 2. Resolve PO Costs
            if (poRes.status === "fulfilled" && poRes.value && Array.isArray(poRes.value.purchase_orders)) {
                const poList = poRes.value.purchase_orders.map(p => ({
                    po_number: p.po_number || "Direct PI / Other",
                    total_cost: parseFloat(p.grand_total || p.total_transport_cost) || 0
                }));
                setByPoData(demoDetected ? MOCK_BY_PO : poList);
            } else {
                setByPoData(demoDetected ? MOCK_BY_PO : []);
            }

            // 3. Resolve Vendor Cost Shares
            if (vendorRes.status === "fulfilled" && vendorRes.value && Array.isArray(vendorRes.value.vendors)) {
                const vendorList = vendorRes.value.vendors.map(v => ({
                    vendor_name: v.vendor_name || "PI Clients / Direct",
                    total_cost: parseFloat(v.total_transport_cost) || 0
                }));
                setByVendorData(demoDetected ? MOCK_BY_VENDOR : vendorList);
            } else {
                setByVendorData(demoDetected ? MOCK_BY_VENDOR : []);
            }

            // 4. Resolve Breakdown Slices
            if (breakdownRes.status === "fulfilled" && breakdownRes.value && Array.isArray(breakdownRes.value.breakdown)) {
                const breakdownList = breakdownRes.value.breakdown.map(b => ({
                    cost_type: b.cost_type,
                    cost_type_display: b.cost_type_display || b.cost_type,
                    total_amount: parseFloat(b.total_amount) || 0
                }));
                setBreakdownData(demoDetected ? MOCK_BREAKDOWN : breakdownList);
            } else {
                setBreakdownData(demoDetected ? MOCK_BREAKDOWN : []);
            }

            // 5. Resolve Landed Cost Table
            if (landedRes.status === "fulfilled" && landedRes.value && Array.isArray(landedRes.value.items)) {
                const landedList = landedRes.value.items.map(i => ({
                    item_name: i.product_name || i.item_name,
                    po_number: i.po_number || "Direct Reference",
                    quantity: i.quantity || 0,
                    unit_landed_cost: i.allocated_transport && i.quantity ? (parseFloat(i.allocated_transport) / i.quantity) : 0,
                    total_landed_cost: parseFloat(i.allocated_transport) || 0,
                    purchase_rate: parseFloat(i.purchase_rate) || 0,
                    landed_cost: parseFloat(i.landed_cost) || 0
                }));
                setLandedCostData(demoDetected ? MOCK_LANDED_COST : landedList);
            } else {
                setLandedCostData(demoDetected ? MOCK_LANDED_COST : []);
            }

            setIsDemoMode(demoDetected);
            if (demoDetected) {
                setAlert({
                    open: true,
                    type: "info",
                    message: "Viewing simulated demonstration analytics. Setup active shipments to load real reports."
                });
            }
        } catch (error) {
            console.error("Dashboard failed to retrieve active logistics report records", error);
            setIsDemoMode(true);
            setSummary(MOCK_SUMMARY);
            setByPoData(MOCK_BY_PO);
            setByVendorData(MOCK_BY_VENDOR);
            setBreakdownData(MOCK_BREAKDOWN);
            setLandedCostData(MOCK_LANDED_COST);
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

    // Filtered landed cost list
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
                // 1. Summary Sheet
                const summarySheetData = [
                    ["LOGISTICS SUMMARY ANALYTICS REPORT"],
                    ["Purpose:", "Summary Performance"],
                    ["Start Date:", startDate || "All Time"],
                    ["End Date:", endDate || "All Time"],
                    ["Generated At:", new Date().toLocaleString()],
                    [],
                    ["Metric", "Value"],
                    ["Total Freight Cost", summary.total_freight_cost],
                    ["Active Shipments Count", summary.active_transports_count],
                    ["Delivered Shipments Count", summary.delivered_transports_count],
                    ["Total Logistics Count", summary.total_transports_count],
                    ["Active Transporters Count", summary.transporter_count]
                ];
                const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
                XLSX.utils.book_append_sheet(wb, wsSummary, "Logistics Summary");

                // 2. PO Costs Sheet
                const poSheetData = [
                    ["LOGISTICS COST BY PURCHASE ORDER"],
                    ["Start Date:", startDate || "All Time"],
                    ["End Date:", endDate || "All Time"],
                    [],
                    ["Purchase Order Number", "Total Transport Cost (INR)"]
                ];
                byPoData.forEach(p => {
                    poSheetData.push([p.po_number, p.total_cost]);
                });
                const wsPo = XLSX.utils.aoa_to_sheet(poSheetData);
                XLSX.utils.book_append_sheet(wb, wsPo, "Cost by PO");

                // 3. Vendor Costs Sheet
                const vendorSheetData = [
                    ["LOGISTICS EXPENDITURE BY TRANSPORTER"],
                    ["Start Date:", startDate || "All Time"],
                    ["End Date:", endDate || "All Time"],
                    [],
                    ["Transporter Agency Name", "Total Transport Cost (INR)"]
                ];
                byVendorData.forEach(v => {
                    vendorSheetData.push([v.vendor_name, v.total_cost]);
                });
                const wsVendor = XLSX.utils.aoa_to_sheet(vendorSheetData);
                XLSX.utils.book_append_sheet(wb, wsVendor, "Cost by Transporter");

                // 4. Cost Breakdown Sheet
                const breakdownSheetData = [
                    ["LOGISTICS EXPENDITURE BREAKDOWN BY COST TYPE"],
                    ["Start Date:", startDate || "All Time"],
                    ["End Date:", endDate || "All Time"],
                    [],
                    ["Cost Type", "Display Name", "Total Amount (INR)"]
                ];
                breakdownData.forEach(b => {
                    breakdownSheetData.push([b.cost_type, b.cost_type_display, b.total_amount]);
                });
                const wsBreakdown = XLSX.utils.aoa_to_sheet(breakdownSheetData);
                XLSX.utils.book_append_sheet(wb, wsBreakdown, "Cost Breakdown");

                // 5. Landed Cost Sheet
                const landedSheetData = [
                    ["ITEM-WISE ALLOCATED LANDED FREIGHT COSTS"],
                    ["Start Date:", startDate || "All Time"],
                    ["End Date:", endDate || "All Time"],
                    [],
                    ["Item Name", "PO Number", "Quantity", "Unit Landed Freight Cost", "Total Allocated Freight", "Purchase Rate", "Total Landed Cost"]
                ];
                landedCostData.forEach(i => {
                    landedSheetData.push([
                        i.item_name,
                        i.po_number,
                        i.quantity,
                        i.unit_landed_cost,
                        i.total_landed_cost,
                        i.purchase_rate || 0,
                        i.landed_cost || 0
                    ]);
                });
                const wsLanded = XLSX.utils.aoa_to_sheet(landedSheetData);
                XLSX.utils.book_append_sheet(wb, wsLanded, "Item Landed Costs");

                const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
                saveAs(blob, `Logistics_Analytics_Report_${fileNameDate}.xlsx`);
            } else if (reportType === "by_po") {
                const poSheetData = [
                    ["LOGISTICS COST BY PURCHASE ORDER"],
                    ["Start Date:", startDate || "All Time"],
                    ["End Date:", endDate || "All Time"],
                    ["Generated At:", new Date().toLocaleString()],
                    [],
                    ["Purchase Order Number", "Total Transport Cost (INR)"]
                ];
                byPoData.forEach(p => {
                    poSheetData.push([p.po_number, p.total_cost]);
                });
                const wsPo = XLSX.utils.aoa_to_sheet(poSheetData);
                XLSX.utils.book_append_sheet(wb, wsPo, "Cost by PO");

                const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
                saveAs(blob, `Logistics_Cost_By_PO_${fileNameDate}.xlsx`);
            } else if (reportType === "by_vendor") {
                const vendorSheetData = [
                    ["LOGISTICS EXPENDITURE BY TRANSPORTER"],
                    ["Start Date:", startDate || "All Time"],
                    ["End Date:", endDate || "All Time"],
                    ["Generated At:", new Date().toLocaleString()],
                    [],
                    ["Transporter Agency Name", "Total Transport Cost (INR)"]
                ];
                byVendorData.forEach(v => {
                    vendorSheetData.push([v.vendor_name, v.total_cost]);
                });
                const wsVendor = XLSX.utils.aoa_to_sheet(vendorSheetData);
                XLSX.utils.book_append_sheet(wb, wsVendor, "Cost by Transporter");

                const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
                saveAs(blob, `Logistics_Cost_By_Transporter_${fileNameDate}.xlsx`);
            } else if (reportType === "breakdown") {
                const breakdownSheetData = [
                    ["LOGISTICS EXPENDITURE BREAKDOWN BY COST TYPE"],
                    ["Start Date:", startDate || "All Time"],
                    ["End Date:", endDate || "All Time"],
                    ["Generated At:", new Date().toLocaleString()],
                    [],
                    ["Cost Type", "Display Name", "Total Amount (INR)"]
                ];
                breakdownData.forEach(b => {
                    breakdownSheetData.push([b.cost_type, b.cost_type_display, b.total_amount]);
                });
                const wsBreakdown = XLSX.utils.aoa_to_sheet(breakdownSheetData);
                XLSX.utils.book_append_sheet(wb, wsBreakdown, "Cost Breakdown");

                const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
                saveAs(blob, `Logistics_Cost_Breakdown_${fileNameDate}.xlsx`);
            } else if (reportType === "landed_cost") {
                const landedSheetData = [
                    ["ITEM-WISE ALLOCATED LANDED FREIGHT COSTS"],
                    ["Start Date:", startDate || "All Time"],
                    ["End Date:", endDate || "All Time"],
                    ["Generated At:", new Date().toLocaleString()],
                    [],
                    ["Item Name", "PO Number", "Quantity", "Unit Landed Freight Cost", "Total Allocated Freight", "Purchase Rate", "Total Landed Cost"]
                ];
                landedCostData.forEach(i => {
                    landedSheetData.push([
                        i.item_name,
                        i.po_number,
                        i.quantity,
                        i.unit_landed_cost,
                        i.total_landed_cost,
                        i.purchase_rate || 0,
                        i.landed_cost || 0
                    ]);
                });
                const wsLanded = XLSX.utils.aoa_to_sheet(landedSheetData);
                XLSX.utils.book_append_sheet(wb, wsLanded, "Item Landed Costs");

                const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
                saveAs(blob, `Logistics_Landed_Costs_${fileNameDate}.xlsx`);
            } else if (reportType === "raw_transports") {
                const params = {};
                if (startDate) params.start_date = startDate;
                if (endDate) params.end_date = endDate;
                const res = await getTransportsReport(params);
                const data = res.data || res;
                if (!data) throw new Error("No data received from API");

                let transportsList = [];
                if (Array.isArray(data)) {
                    transportsList = data;
                } else if (data.results && Array.isArray(data.results)) {
                    transportsList = data.results;
                } else if (data && typeof data === "object") {
                    const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
                    if (arrayKey) {
                        transportsList = data[arrayKey];
                    } else {
                        transportsList = [data];
                    }
                }

                const transportSheetData = [
                    ["RAW TRANSPORT LOGISTICS ENTRIES LIST"],
                    ["Start Date:", startDate || "All Time"],
                    ["End Date:", endDate || "All Time"],
                    ["Generated At:", new Date().toLocaleString()],
                    [],
                    ["Transport Number", "Transporter Name", "Contact", "Vehicle Number", "Driver Name", "Driver Contact", "Dispatch Date", "Expected Delivery Date", "Status", "From", "To", "Total Freight Cost (INR)"]
                ];

                transportsList.forEach(t => {
                    const totalCost = t.total_cost ? parseFloat(t.total_cost) : (t.cost_items || []).reduce((s, c) => s + parseFloat(c.amount || 0), 0);
                    transportSheetData.push([
                        t.transport_number || "-",
                        t.transporter_name || "-",
                        t.transporter_contact || "-",
                        t.vehicle_number || "-",
                        t.driver_name || "-",
                        t.driver_contact || "-",
                        t.dispatch_date || "-",
                        t.expected_delivery_date || "-",
                        t.status || "-",
                        t.dispatch_from || "-",
                        t.dispatch_to || "-",
                        totalCost
                    ]);
                });

                const wsTransports = XLSX.utils.aoa_to_sheet(transportSheetData);
                XLSX.utils.book_append_sheet(wb, wsTransports, "Logistics Shipments");

                const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
                saveAs(blob, `Logistics_Shipments_List_${fileNameDate}.xlsx`);
            }

            setShowReportModal(false);
            setAlert({ open: true, type: "success", message: "Report downloaded successfully" });
        } catch (error) {
            console.error("Export to Excel failed:", error);
            setAlert({ open: true, type: "error", message: `Excel export failed: ${error.message}` });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-1">
                {/* Header section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <FaChartPie className="text-blue-600 animate-pulse" />
                            Logistics Analytics &amp; Landed Costs
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">Interactive intelligence reports detailing freight expenditures, carrier shares, and nested item landed costs</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isDemoMode && (
                            <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full tracking-wider animate-pulse flex items-center gap-1.5">
                                <FaInfoCircle /> DEMO DATA MODE
                            </span>
                        )}
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all active:scale-95 uppercase tracking-widest flex items-center gap-2"
                        >
                            <FaFileExcel className="text-sm" />
                            Export Excel
                        </button>
                        <button
                            onClick={fetchAllReports}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-200 transition-all active:scale-95 uppercase tracking-widest"
                        >
                            Sync Reports
                        </button>
                    </div>
                </div>

                {/* Date Filter Panel */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 px-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Filter Date:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">From</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">To</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        {(startDate || endDate) && (
                            <button
                                onClick={() => {
                                    setStartDate("");
                                    setEndDate("");
                                }}
                                className="text-xs text-red-500 font-bold hover:text-red-700 uppercase flex items-center gap-1.5"
                            >
                                <FaTimes /> Clear Filter
                            </button>
                        )}
                    </div>
                    {startDate && endDate && (
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                            Range: {new Date(startDate).toLocaleDateString()} – {new Date(endDate).toLocaleDateString()}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-24 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Assembling logistical intelligence reports...</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Metrics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Card 1 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="p-4 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                                    <FaCoins size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Freight Spendings</p>
                                    <p className="text-xl font-black text-slate-800 leading-tight mt-1 truncate">{formatCurrency(summary.total_freight_cost)}</p>
                                </div>
                            </div>
                            {/* Card 2 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="p-4 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                                    <FaHourglassHalf size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Shipments</p>
                                    <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{summary.active_transports_count} <span className="text-xs text-slate-400 font-semibold uppercase">Pending</span></p>
                                </div>
                            </div>
                            {/* Card 3 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    <FaCalendarCheck size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Delivery Fulfillment</p>
                                    <div className="flex items-baseline justify-between mt-1">
                                        <p className="text-2xl font-black text-slate-800 leading-tight">{summary.delivered_transports_count} <span className="text-xs text-slate-400 font-semibold uppercase">Closed</span></p>
                                    </div>
                                    <div className="h-1 bg-slate-100 rounded-full w-full mt-2 relative overflow-hidden">
                                        <div
                                            className="absolute top-0 bottom-0 left-0 bg-emerald-500 rounded-full"
                                            style={{ width: `${(summary.delivered_transports_count / (summary.total_transports_count || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            {/* Card 4 */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                                <div className="p-4 rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                                    <FaTruck size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Transporters</p>
                                    <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{summary.transporter_count} <span className="text-xs text-slate-400 font-semibold uppercase">Agencies</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Pie chart breakdown */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
                                <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2 mb-4">
                                    <FaChartPie className="text-slate-400" /> Logistics Cost breakdown by Type
                                </h3>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                        <PieChart>
                                            <Pie
                                                data={breakdownData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={4}
                                                dataKey="total_amount"
                                                nameKey="cost_type_display"
                                            >
                                                {breakdownData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val) => formatCurrency(val)} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Bar chart vendor cost shares */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
                                <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2 mb-4">
                                    <FaTruck className="text-slate-400" /> Logistics Expenditure by Transporter
                                </h3>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                        <BarChart
                                            data={byVendorData}
                                            layout="vertical"
                                            margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" tickFormatter={(v) => `₹${v}`} />
                                            <YAxis dataKey="vendor_name" type="category" width={110} tick={{ fontSize: 10, fontWeight: 700 }} />
                                            <Tooltip formatter={(val) => formatCurrency(val)} />
                                            <Bar dataKey="total_cost" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* PO costs full bar chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[350px]">
                            <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2 mb-4">
                                <FaChartBar className="text-slate-400" /> Logistics Expenses by Linked Purchase Orders (PO)
                            </h3>
                            <div className="h-60 w-full">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <BarChart
                                        data={byPoData}
                                        margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="po_number" tick={{ fontSize: 10, fontWeight: 700 }} />
                                        <YAxis tickFormatter={(v) => `₹${v}`} />
                                        <Tooltip formatter={(val) => formatCurrency(val)} />
                                        <Bar dataKey="total_cost" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={28} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Item-wise Landed Cost Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                                <div>
                                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
                                        <FaBoxes className="text-slate-400" /> Item-wise Landed Freight Costs
                                    </h3>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Landed freight allocation mapped down to single inventory line items</p>
                                </div>
                                <div className="w-full md:w-80 relative">
                                    <input
                                        type="text"
                                        placeholder="Search product name or PO number..."
                                        value={landedCostSearch}
                                        onChange={(e) => { setLandedCostSearch(e.target.value); setLandedCostPage(1); }}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
                                            <th className="px-6 py-3.5">Inventory Product Item</th>
                                            <th className="px-6 py-3.5">Linked Purchase Order</th>
                                            <th className="px-6 py-3.5 text-center">Qty Loaded</th>
                                            <th className="px-6 py-3.5 text-right">Unit Freight Load</th>
                                            <th className="px-6 py-3.5 text-right">Total Landed Freight</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {paginatedLandedCost.length > 0 ? (
                                            paginatedLandedCost.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                                                        <FaBarcode className="text-slate-300" size={12} />
                                                        {item.item_name}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                                            {item.po_number || "Direct PO"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-600">{item.quantity}</td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-700 font-mono text-xs">{formatCurrency(item.unit_landed_cost)}</td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-800 font-mono text-xs">{formatCurrency(item.total_landed_cost)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-10 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">No landed item costs located</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination footer */}
                            {totalLandedPages > 1 && (
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                                    <div className="text-xs text-slate-400 font-bold uppercase">
                                        Showing {paginatedLandedCost.length} of {filteredLandedCost.length} items
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={landedCostPage === 1}
                                            onClick={() => setLandedCostPage(p => p - 1)}
                                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors active:scale-95"
                                        >
                                            PREV
                                        </button>
                                        <button
                                            disabled={landedCostPage === totalLandedPages}
                                            onClick={() => setLandedCostPage(p => p + 1)}
                                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors active:scale-95"
                                        >
                                            NEXT
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Toast notice for demonstration simulations */}
            <AlertToast
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ ...alert, open: false })}
            />

            {/* REPORT MODAL */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FaFileExcel className="text-emerald-600" /> Export Logistics Report
                            </h3>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600 font-medium">Choose Purpose:</p>

                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="all"
                                        checked={reportType === "all"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Full Analytics Report</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="by_po"
                                        checked={reportType === "by_po"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Cost by PO Report</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="by_vendor"
                                        checked={reportType === "by_vendor"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Cost by Transporter Report</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="breakdown"
                                        checked={reportType === "breakdown"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Cost Breakdown Report</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="landed_cost"
                                        checked={reportType === "landed_cost"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Item Landed Cost Report</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="raw_transports"
                                        checked={reportType === "raw_transports"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Raw Transport Entries List</span>
                                </label>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDownloadReport}
                                disabled={downloading}
                                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
                            >
                                {downloading ? "Exporting..." : "Download Excel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
