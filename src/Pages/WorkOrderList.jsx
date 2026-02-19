/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaSearch, FaEye, FaEdit, FaFileExcel } from "react-icons/fa";
import WorkOrderDetailsModal from "../components/sales/WorkOrderDetailsModal";
import UpdateAdvanceModal from "../components/sales/UpdateAdvanceModal";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getWorkOrders, getWorkOrderById, getWorkOrderReport, getWorkOrderDeliveryAnalysis } from "../services/salesService";

import { useSearchParams } from "react-router-dom";

const WorkOrderList = () => {
    const [searchParams] = useSearchParams();
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState("ACTIVE");
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [workOrderDetails, setWorkOrderDetails] = useState(null);

    // Advance Update State
    const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
    const [selectedWorkOrderForAdvance, setSelectedWorkOrderForAdvance] = useState(null);

    // Report State
    const [showReportModal, setShowReportModal] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [reportType, setReportType] = useState("work_order"); // "work_order", "delivery_analysis"
    const [reportParams, setReportParams] = useState({
        start_date: "",
        end_date: "",
        status: ""
    });

    // Handle URL Params for deep linking mainly from Dashboard
    useEffect(() => {
        const id = searchParams.get("id");
        if (id) {
            handleViewDetails(id);
        }

        const status = searchParams.get("status");
        if (status) {
            setStatusFilter(status.toUpperCase());
        }
    }, [searchParams]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchWorkOrders();
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [currentPage, searchQuery, statusFilter]);

    const fetchWorkOrders = async () => {
        setLoading(true);
        try {
            const data = await getWorkOrders(currentPage, searchQuery, statusFilter);
            setWorkOrders(data.results || []);
            setTotalCount(data.count || 0);
            setNext(data.next);
            setPrevious(data.previous);
        } catch (error) {
            console.error("Failed to fetch work orders", error);
            toast.error("Failed to load work orders");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id) => {
        setSelectedWorkOrderId(id);
        setDetailsLoading(true);
        try {
            const details = await getWorkOrderById(id);
            setWorkOrderDetails(details);
        } catch (error) {
            console.error("Failed to fetch work order details", error);
            toast.error("Failed to load work order details");
            setSelectedWorkOrderId(null); // Clear ID on error
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetailsModal = () => {
        setSelectedWorkOrderId(null);
        setWorkOrderDetails(null);
    };

    const handleEditAdvance = (wo) => {
        setSelectedWorkOrderForAdvance(wo);
        setAdvanceModalOpen(true);
    };

    const handleAdvanceUpdateSuccess = () => {
        fetchWorkOrders(); // Refresh list to reflect new advance? Or maybe UI doesn't need to change unless advance is shown.
        // It's good practice to refresh data.
        setAdvanceModalOpen(false);
        setSelectedWorkOrderForAdvance(null);
    };

    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const params = {};
            if (reportParams.start_date) params.start_date = reportParams.start_date;
            if (reportParams.end_date) params.end_date = reportParams.end_date;

            let data;
            let filename;
            let finalSheetData = [];
            let wscols = [];

            if (reportType === "delivery_analysis") {
                data = await getWorkOrderDeliveryAnalysis(params);
                filename = `Delivery_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`;

                const overall = data.overall_summary || {};
                const itemSummary = data.item_summary || {};
                const stock = data.stock_analysis || {};
                const details = data.work_order_details || [];

                finalSheetData = [
                    // --- HEADER ---
                    [data.report_type || "Work Order Delivery Analysis"],
                    ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()],
                    ["Date Range:", `${data.date_range?.start_date || "N/A"} to ${data.date_range?.end_date || "N/A"}`],
                    [],

                    // --- OVERALL SUMMARY ---
                    ["OVERALL SUMMARY"],
                    ["Total Work Orders:", overall.total_work_orders || 0],
                    ["Completed WOs:", overall.completed_wos || 0],
                    ["Partially Delivered WOs:", overall.partially_delivered_wos || 0],
                    ["Pending WOs:", overall.pending_wos || 0],
                    [],

                    // --- ITEM SUMMARY ---
                    ["ITEM SUMMARY"],
                    ["Total Items:", itemSummary.total_items || 0],
                    ["Fully Delivered Items:", itemSummary.fully_delivered_items || 0],
                    ["Partially Delivered Items:", itemSummary.partially_delivered_items || 0],
                    ["Pending Items:", itemSummary.pending_items || 0],
                    ["Delivery Rate:", (itemSummary.delivery_rate || 0) + "%"],
                    [],

                    // --- STOCK ANALYSIS ---
                    ["STOCK ANALYSIS"],
                    ["In Stock Pending Items:", stock.in_stock_pending_items || 0],
                    ["Out of Stock Pending Items:", stock.out_of_stock_pending_items || 0],
                    [],

                    // --- DETAILS TABLE ---
                    [
                        "WO Number", "Client Name", "Total Items",
                        "Fully Delivered", "Partially Delivered", "Pending",
                        "Completion %", "Status"
                    ]
                ];

                details.forEach(row => {
                    finalSheetData.push([
                        row.wo_number,
                        row.client_name,
                        row.total_items,
                        row.fully_delivered,
                        row.partially_delivered,
                        row.pending,
                        row.completion_percentage,
                        row.status
                    ]);
                });

                wscols = [
                    { wch: 15 }, // WO Number
                    { wch: 25 }, // Client Name
                    { wch: 12 }, // Total Items
                    { wch: 15 }, // Fully Del
                    { wch: 15 }, // Partial Del
                    { wch: 12 }, // Pending
                    { wch: 15 }, // Completion %
                    { wch: 15 }, // Status
                ];

            } else {
                // DEFAULT: Work Order Report
                if (reportParams.status) params.status = reportParams.status;
                data = await getWorkOrderReport(params);
                filename = `WorkOrder_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

                const summary = data.summary || {};
                const workOrders = data.work_orders || [];

                finalSheetData = [
                    // --- HEADER ---
                    [data.report_type || "Work Order Report"],
                    ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()],
                    ["Generated By:", data.generated_by || "System"],
                    ["Date Range:", `${data.date_range?.start_date || "N/A"} to ${data.date_range?.end_date || "N/A"}`],
                    [],

                    // --- SUMMARY ---
                    ["SUMMARY"],
                    ["Total Work Orders:", summary.total_work_orders || 0],
                    ["Total Value:", summary.total_value || 0],
                    ["Total Advance Received:", summary.total_advance_received || 0],
                    ["Total Delivered Value:", summary.total_delivered_value || 0],
                    ["Active WOs:", summary.active_wos || 0],
                    ["Partially Delivered WOs:", summary.partially_delivered_wos || 0],
                    ["Completed WOs:", summary.completed_wos || 0],
                    ["Cancelled WOs:", summary.cancelled_wos || 0],
                    [],

                    // --- DATA TABLE HEADERS ---
                    [
                        "WO Number", "Date", "Quotation No", "Client Name", "Contact Person", "Phone",
                        "Total Items", "Total Amount", "Advance Amount", "Advance Remaining",
                        "Delivered Value", "Completion %", "Status", "Created By", "Created At"
                    ]
                ];

                workOrders.forEach(wo => {
                    finalSheetData.push([
                        wo.wo_number,
                        wo.wo_date,
                        wo.quotation_number,
                        wo.client_name,
                        wo.contact_person,
                        wo.phone,
                        wo.total_items,
                        wo.total_amount,
                        wo.advance_amount,
                        wo.advance_remaining,
                        wo.total_delivered_value,
                        wo.completion_percentage,
                        wo.status,
                        wo.created_by,
                        wo.created_at ? new Date(wo.created_at).toLocaleString() : ""
                    ]);
                });

                wscols = [
                    { wch: 15 }, // WO Number
                    { wch: 12 }, // Date
                    { wch: 15 }, // Quotation No
                    { wch: 25 }, // Client Name
                    { wch: 20 }, // Contact Person
                    { wch: 15 }, // Phone
                    { wch: 12 }, // Total Items
                    { wch: 15 }, // Total Amount
                    { wch: 15 }, // Advance Amount
                    { wch: 18 }, // Advance Remaining
                    { wch: 15 }, // Delivered Value
                    { wch: 15 }, // Completion %
                    { wch: 15 }, // Status
                    { wch: 20 }, // Created By
                    { wch: 20 }, // Created At
                ];
            }

            const wb = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(finalSheetData);
            worksheet['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, worksheet, "Report");

            // Generate Buffer
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });

            saveAs(blob, filename);

            setShowReportModal(false);
            toast.success("Report downloaded successfully");

        } catch (error) {
            console.error("Failed to download report", error);
            toast.error("Failed to download report");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800">Work Orders</h3>
                        <span className="text-sm text-slate-500 font-semibold">
                            Total: {totalCount}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            // Set defaults for date range (current month)
                            const today = new Date().toISOString().split('T')[0];
                            const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                            setReportParams({ start_date: firstDay, end_date: today, status: "" });
                            setReportType("work_order");
                            setShowReportModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 transition-colors"
                    >
                        <FaFileExcel className="text-sm" />
                        Download Report
                    </button>
                </div>

                {/* SEARCH & FILTER */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="w-40">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="input w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            >
                                <option value="">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-55">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Search Work Order
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by WO Number, Client..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-slate-800 uppercase text-[10px] font-bold tracking-widest">
                                <th className="px-6 py-4 text-[13px]">WO Number</th>
                                <th className="px-6 py-4 text-[13px]">Date</th>
                                <th className="px-6 py-4 text-[13px]">Client</th>
                                <th className="px-6 py-4 text-[13px] text-right">Amount</th>
                                <th className="px-6 py-4 text-[13px]">Status</th>
                                <th className="px-6 py-4 text-[13px] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-6 text-center text-slate-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : workOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-slate-500">
                                        No work orders found.
                                    </td>
                                </tr>
                            ) : (
                                workOrders.map((wo) => (
                                    <tr key={wo.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-blue-600 font-semibold">
                                            {wo.wo_number}
                                            <div className="text-xs text-slate-400 mt-0.5">{wo.quotation_number}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {wo.wo_date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-800">{wo.client_name}</div>
                                            <div className="text-xs text-slate-400">{wo.contact_person}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-slate-800 font-mono">
                                            ₹{wo.total_amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold
                                                ${wo.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                    wo.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-700'}`}>
                                                {wo.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleViewDetails(wo.id)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                                title="View Details"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                onClick={() => handleEditAdvance(wo)}
                                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all"
                                                title="Update Advance Payment"
                                            >
                                                <FaEdit />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={!previous}
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed"
                    >
                        ← Previous
                    </button>

                    <span className="text-xs text-slate-400">Page {currentPage}</span>

                    <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={!next}
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* Work Order Details Modal */}
            {
                selectedWorkOrderId && (
                    <WorkOrderDetailsModal
                        isOpen={!!selectedWorkOrderId}
                        onClose={closeDetailsModal}
                        loading={detailsLoading}
                        details={workOrderDetails}
                    />
                )
            }

            {/* Update Advance Modal */}
            {advanceModalOpen && selectedWorkOrderForAdvance && (
                <UpdateAdvanceModal
                    isOpen={advanceModalOpen}
                    workOrder={selectedWorkOrderForAdvance}
                    onClose={() => {
                        setAdvanceModalOpen(false);
                        setSelectedWorkOrderForAdvance(null);
                    }}
                    onSuccess={handleAdvanceUpdateSuccess}
                />
            )}

            {/* REPORT MODAL */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FaFileExcel className="text-emerald-600" /> Export WO Report
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600 font-medium">Select Report Type:</p>

                            <div className="space-y-3">
                                {/* Work Order List Report Option */}
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="work_order"
                                        checked={reportType === "work_order"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Work Order List Report</span>
                                </label>
                                {reportType === "work_order" && (
                                    <div className="pl-8 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    value={reportParams.start_date}
                                                    onChange={(e) => setReportParams({ ...reportParams, start_date: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    value={reportParams.end_date}
                                                    onChange={(e) => setReportParams({ ...reportParams, end_date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status (Optional)</label>
                                            <select
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                value={reportParams.status}
                                                onChange={(e) => setReportParams({ ...reportParams, status: e.target.value })}
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="ACTIVE">Active</option>
                                                <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
                                                <option value="COMPLETED">Completed</option>
                                                <option value="CANCELLED">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Delivery Analysis Option */}
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="delivery_analysis"
                                        checked={reportType === "delivery_analysis"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Delivery Analysis</span>
                                </label>
                                {reportType === "delivery_analysis" && (
                                    <div className="pl-8 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={reportParams.start_date}
                                                onChange={(e) => setReportParams({ ...reportParams, start_date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                                            <input
                                                type="date"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={reportParams.end_date}
                                                onChange={(e) => setReportParams({ ...reportParams, end_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
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
                                {downloading ? "Downloading..." : "Download Excel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkOrderList;
