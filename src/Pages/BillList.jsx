import React, { useState, useEffect } from "react";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import BillDetailsModal from "../components/sales/BillDetailsModal";
import { getBills, getBillsByWorkOrder, getAllWorkOrders, getBillById, markBillAsPaid, cancelBill, getBillReport, getOutstandingReport } from "../services/salesService";
import { FaSearch, FaFilter, FaEye, FaMoneyBillWave, FaTimes, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { useSearchParams } from "react-router-dom";

const BillList = () => {
    const [searchParams] = useSearchParams();
    // Data State
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);

    // Filter State
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterWorkOrder, setFilterWorkOrder] = useState(""); // WO ID

    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [confirm, setConfirm] = useState({ open: false, action: null });

    // Payment Modal State
    const [paymentModal, setPaymentModal] = useState({ open: false, bill: null, amount: "" });
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);


    // Dropdown Data
    const [workOrders, setWorkOrders] = useState([]);

    // Details Modal State
    const [selectedBillId, setSelectedBillId] = useState(null);
    const [billDetails, setBillDetails] = useState(null);

    const [detailsLoading, setDetailsLoading] = useState(false);

    // Report State
    const [showReportModal, setShowReportModal] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [reportType, setReportType] = useState("bills"); // 'bills' | 'outstanding'
    const [reportParams, setReportParams] = useState({
        start_date: "",
        end_date: "",
        status: "",
        work_order: "",
        aging: false
    });

    // Handle deep linking
    useEffect(() => {
        const id = searchParams.get("id");
        if (id) {
            handleViewDetails(id);
        }
    }, [searchParams]);

    // Fetch All Work Orders for Filter
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const data = await getAllWorkOrders();
                // Ensure array
                const woList = Array.isArray(data) ? data : (data.results || []);
                setWorkOrders(woList);
            } catch (err) {
                console.error("Failed to fetch work orders for filter", err);
            }
        };
        fetchFilters();
    }, []);

    // Fetch Bills on dependency change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchBills();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [page, searchQuery, filterWorkOrder]);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const data = await getBills(page, searchQuery, filterWorkOrder);

            if (data) {
                setBills(data.results || []);
                setTotalCount(data.count || 0);
                setNext(data.next);
                setPrevious(data.previous);
            }
        } catch (error) {
            console.error("Failed to fetch bills", error);
            setAlert({ open: true, type: "error", message: "Failed to load bills" });
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleNext = () => {
        if (next) setPage(p => p + 1);
    };

    const handlePrev = () => {
        if (previous) setPage(p => Math.max(1, p - 1));
    };

    const handleFilterChange = (e) => {
        setFilterWorkOrder(e.target.value);
        setPage(1); // Reset to page 1 on filter change
    };

    const handleViewDetails = async (id) => {
        setSelectedBillId(id);
        setDetailsLoading(true);
        try {
            const data = await getBillById(id);
            setBillDetails(data);
        } catch (error) {
            console.error("Failed to fetch bill details", error);
            setAlert({ open: true, type: "error", message: "Failed to load bill details" });
            setSelectedBillId(null);
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetailsModal = () => {
        setSelectedBillId(null);
        setBillDetails(null);
    };

    const handleCancelBill = (billId) => {
        setConfirm({
            open: true,
            title: "Cancel Bill?",
            description: "Are you sure you want to cancel this bill? This action cannot be undone.",
            action: async () => {
                try {
                    await cancelBill(billId);
                    setAlert({ open: true, type: "success", message: "Bill cancelled successfully" });
                    fetchBills();
                } catch (error) {
                    console.error("Failed to cancel bill", error);
                    setAlert({ open: true, type: "error", message: "Failed to cancel bill" });
                } finally {
                    setConfirm({ ...confirm, open: false });
                }
            }
        });
    };

    // Payment Handlers
    const openPaymentModal = (bill) => {
        // Default amount to balance if positive, otherwise 0
        const defaultAmount = parseFloat(bill.balance) > 0 ? bill.balance : "0.00";
        setPaymentModal({ open: true, bill, amount: defaultAmount });
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setPaymentSubmitting(true);
        try {
            await markBillAsPaid(paymentModal.bill.id, paymentModal.amount);
            setAlert({ open: true, type: "success", message: "Payment recorded successfully" });
            setPaymentModal({ open: false, bill: null, amount: "" });
            fetchBills(); // Refresh list
        } catch (error) {
            console.error("Payment failed", error);
            setAlert({ open: true, type: "error", message: "Failed to record payment" });
        } finally {
            setPaymentSubmitting(false);
        }
    };

    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const wb = XLSX.utils.book_new();

            if (reportType === "outstanding") {
                const params = { aging: reportParams.aging };
                const data = await getOutstandingReport(params);

                const summary = data.summary || {};
                const bills = data.bills || [];

                const sheetData = [
                    ["OUTSTANDING PAYMENTS REPORT"],
                    ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()],
                    [],
                    ["SUMMARY"],
                    ["Total Outstanding Bills:", summary.total_outstanding_bills || 0],
                    ["Total Outstanding Amount:", summary.total_outstanding_amount || 0],
                    [],
                    // HEADERS
                    [
                        "Bill Number", "Date", "WO Number", "Client Name", "Contact Person",
                        "Phone", "Email", "Total Amount", "Paid Amount", "Balance Due",
                        "Days Outstanding", "Status"
                    ]
                ];

                bills.forEach(bill => {
                    sheetData.push([
                        bill.bill_number,
                        bill.bill_date,
                        bill.wo_number,
                        bill.client_name,
                        bill.contact_person,
                        bill.phone,
                        bill.email,
                        bill.total_amount,
                        bill.amount_paid,
                        bill.balance,
                        bill.days_outstanding,
                        bill.status
                    ]);
                });

                const ws = XLSX.utils.aoa_to_sheet(sheetData);
                // Column widths
                ws['!cols'] = [
                    { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
                    { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
                    { wch: 15 }, { wch: 12 }
                ];

                XLSX.utils.book_append_sheet(wb, ws, "Outstanding Report");
                const filename = `Outstanding_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

                // Generate and save
                const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
                saveAs(blob, filename);

            } else {
                // STANDARD BILL REPORT
                const params = {};
                if (reportParams.start_date) params.start_date = reportParams.start_date;
                if (reportParams.end_date) params.end_date = reportParams.end_date;
                if (reportParams.status) params.status = reportParams.status;
                if (reportParams.work_order) params.work_order = reportParams.work_order;

                const data = await getBillReport(params);

                const summary = data.summary || {};
                const bills = data.bills || [];
                const taxCollected = summary.tax_collected || {};

                const finalSheetData = [
                    // --- HEADER ---
                    [data.report_type || "Bill Report"],
                    ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()],
                    ["Generated By:", data.generated_by || "System"],
                    ["Date Range:", `${data.date_range?.start_date || "N/A"} to ${data.date_range?.end_date || "N/A"}`],
                    [],

                    // --- SUMMARY ---
                    ["SUMMARY"],
                    ["Total Bills:", summary.total_bills || 0],
                    ["Total Amount:", summary.total_amount || 0],
                    ["Total Advance Deducted:", summary.total_advance_deducted || 0],
                    ["Net Payable:", summary.total_net_payable || 0],
                    ["Total Paid:", summary.total_paid || 0],
                    ["Outstanding:", summary.total_outstanding || 0],
                    ["Generated Count:", summary.generated_bills || 0],
                    ["Paid Count:", summary.paid_bills || 0],
                    ["Cancelled Count:", summary.cancelled_bills || 0],
                    [],
                    ["TAX SUMMARY"],
                    ["Total CGST:", taxCollected.cgst || 0],
                    ["Total SGST:", taxCollected.sgst || 0],
                    ["Total IGST:", taxCollected.igst || 0],
                    ["Total Tax:", taxCollected.total || 0],
                    [],

                    // --- DATA TABLE HEADERS ---
                    [
                        "Bill Number", "Date", "WO Number", "Client Name", "Contact Person", "Phone",
                        "Total Items", "Subtotal", "CGST", "SGST", "IGST", "Total Tax",
                        "Total Amount", "Advance Deducted", "Net Payable", "Amount Paid", "Balance",
                        "Status", "Created By"
                    ]
                ];

                bills.forEach(bill => {
                    const tax = bill.tax_summary || {};
                    finalSheetData.push([
                        bill.bill_number,
                        bill.bill_date,
                        bill.wo_number,
                        bill.client_name,
                        bill.contact_person,
                        bill.phone,
                        bill.total_items,
                        bill.subtotal,
                        tax.cgst || 0,
                        tax.sgst || 0,
                        tax.igst || 0,
                        tax.total_tax || 0,
                        bill.total_amount,
                        bill.advance_deducted,
                        bill.net_payable,
                        bill.amount_paid,
                        bill.balance,
                        bill.status,
                        bill.created_by
                    ]);
                });

                const worksheet = XLSX.utils.aoa_to_sheet(finalSheetData);

                // Adjust column widths
                const wscols = [
                    { wch: 18 }, // Bill Number
                    { wch: 12 }, // Date
                    { wch: 15 }, // WO Number
                    { wch: 20 }, // Client Name
                    { wch: 15 }, // Contact Person
                    { wch: 12 }, // Phone
                    { wch: 10 }, // Total Items
                    { wch: 12 }, // Subtotal
                    { wch: 10 }, // CGST
                    { wch: 10 }, // SGST
                    { wch: 10 }, // IGST
                    { wch: 10 }, // Total Tax
                    { wch: 12 }, // Total Amount
                    { wch: 15 }, // Advance Deducted
                    { wch: 12 }, // Net Payable
                    { wch: 12 }, // Amount Paid
                    { wch: 12 }, // Balance
                    { wch: 12 }, // Status
                    { wch: 15 }, // Created By
                ];
                worksheet['!cols'] = wscols;

                XLSX.utils.book_append_sheet(wb, worksheet, "Bill Report");

                // Generate Buffer
                const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });

                const filename = `Bill_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                saveAs(blob, filename);

            }
            setShowReportModal(false);
            setAlert({ open: true, type: "success", message: "Report downloaded successfully" });

        } catch (error) {
            console.error("Failed to download report", error);
            setAlert({ open: true, type: "error", message: "Failed to download report" });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="p-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800">Work Order Bills</h3>
                        <span className="text-sm text-slate-500 font-semibold">
                            Total: {totalCount}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
                            setReportParams({ start_date: thirtyDaysAgo, end_date: today, status: "", work_order: "", aging: false });
                            setReportType("bills");
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
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        {/* Filter by WO */}
                        <div className="w-full md:w-64">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Filter by Work Order
                            </label>
                            <div className="relative">
                                <select
                                    value={filterWorkOrder}
                                    onChange={handleFilterChange}
                                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                >
                                    <option value="">All Work Orders</option>
                                    {workOrders.map(wo => (
                                        <option key={wo.id} value={wo.id}>
                                            {wo.wo_number} - {wo.client_name}
                                        </option>
                                    ))}
                                </select>
                                <FaFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Search */}
                        {!filterWorkOrder && (
                            <div className="flex-1 min-w-50">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Search Bills
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by Bill No, Client..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setPage(1);
                                        }}
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                        )}

                        {/* Clear Filters Button (Optional) */}
                        {(filterWorkOrder || searchQuery) && (
                            <button
                                onClick={() => {
                                    setFilterWorkOrder("");
                                    setSearchQuery("");
                                    setPage(1);
                                }}
                                className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-px"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-slate-800 uppercase text-[10px] font-bold tracking-widest">
                                <th className="px-6 py-4">Bill Number</th>
                                <th className="px-6 py-4">WO Number</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : bills.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                                        No bills found.
                                    </td>
                                </tr>
                            ) : (
                                bills.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-semibold text-blue-600 text-sm">
                                            {bill.bill_number}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                                            {bill.wo_number}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {bill.bill_date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-800">{bill.client_name}</div>
                                            <div className="text-xs text-slate-400">{bill.contact_person}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-slate-800 font-mono">
                                            ₹{parseFloat(bill.total_amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-red-600 font-mono">
                                            ₹{parseFloat(bill.balance).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold
                                                ${bill.status === 'GENERATED' ? 'bg-blue-100 text-blue-700' :
                                                    bill.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                        bill.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                            'bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {bill.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center flex justify-center gap-2">
                                            <button
                                                onClick={() => handleViewDetails(bill.id)}
                                                title="View Details"
                                                className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                            >
                                                <FaEye />
                                            </button>
                                            {bill.status !== 'PAID' && bill.status !== 'CANCELLED' && (
                                                <>
                                                    <button
                                                        onClick={() => openPaymentModal(bill)}
                                                        title="Record Payment"
                                                        className="text-green-500 hover:text-green-700 p-2 rounded-full hover:bg-green-50 transition-colors"
                                                    >
                                                        <FaMoneyBillWave />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelBill(bill.id)}
                                                        title="Cancel Bill"
                                                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </>
                                            )}
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
                        onClick={handlePrev}
                        disabled={!previous}
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        ← Previous
                    </button>

                    <span className="text-xs text-slate-400">
                        Page {page} {totalCount > 0 && `of ${Math.ceil(totalCount / 10)}`}
                    </span>

                    <button
                        onClick={handleNext}
                        disabled={!next}
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Next →
                    </button>
                </div>
            </div>

            <AlertToast
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ ...alert, open: false })}
            />

            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                message={confirm.description}
                confirmText={confirm.confirmText || "Confirm"}
                onConfirm={confirm.action}
                onCancel={() => setConfirm({ ...confirm, open: false })}
            />

            {/* Bill Details Modal */}
            {selectedBillId && (
                <BillDetailsModal
                    isOpen={!!selectedBillId}
                    onClose={closeDetailsModal}
                    loading={detailsLoading}
                    details={billDetails}
                />
            )}

            {/* Payment Modal */}
            {paymentModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Record Payment</h3>

                        <div className="mb-4">
                            <div className="text-sm text-slate-500 mb-1">Bill Number</div>
                            <div className="font-mono font-semibold text-slate-800">{paymentModal.bill?.bill_number}</div>
                        </div>

                        <div className="mb-6">
                            <div className="text-sm text-slate-500 mb-1">Outstanding Balance</div>
                            <div className="font-mono font-bold text-red-600 text-lg">₹{paymentModal.bill?.balance}</div>
                        </div>

                        <form onSubmit={handlePaymentSubmit}>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Amount Paid (₹)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={paymentModal.amount}
                                onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-lg font-mono mb-6"
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPaymentModal({ open: false, bill: null, amount: "" })}
                                    className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={paymentSubmitting}
                                    className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 disabled:opacity-50 transition-all"
                                >
                                    {paymentSubmitting ? "Processing..." : "Confirm Payment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            )}

            {/* REPORT MODAL */}
            {
                showReportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <FaFileExcel className="text-emerald-600" /> Export Bill Report
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-slate-600 font-medium">Select Report Type:</p>
                                <div className="space-y-3">
                                    {/* Standard Bill Report */}
                                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                        <input
                                            type="radio"
                                            name="reportType"
                                            value="bills"
                                            checked={reportType === "bills"}
                                            onChange={(e) => setReportType(e.target.value)}
                                            className="text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm font-semibold text-slate-700">Bill Report</span>
                                    </label>

                                    {reportType === "bills" && (
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
                                                    <option value="GENERATED">Generated</option>
                                                    <option value="PAID">Paid</option>
                                                    <option value="CANCELLED">Cancelled</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Work Order (Optional)</label>
                                                <select
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    value={reportParams.work_order}
                                                    onChange={(e) => setReportParams({ ...reportParams, work_order: e.target.value })}
                                                >
                                                    <option value="">All Work Orders</option>
                                                    {workOrders.map(wo => (
                                                        <option key={wo.id} value={wo.id}>
                                                            {wo.wo_number}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Outstanding Report */}
                                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                        <input
                                            type="radio"
                                            name="reportType"
                                            value="outstanding"
                                            checked={reportType === "outstanding"}
                                            onChange={(e) => setReportType(e.target.value)}
                                            className="text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-sm font-semibold text-slate-700">Outstanding Report</span>
                                    </label>

                                    {reportType === "outstanding" && (
                                        <div className="pl-8 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="includeAging"
                                                    checked={reportParams.aging}
                                                    onChange={(e) => setReportParams({ ...reportParams, aging: e.target.checked })}
                                                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                                />
                                                <label htmlFor="includeAging" className="text-sm text-slate-600">Include aging details?</label>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1 italic">
                                                Downloads a separate report for all unpaid bills.
                                            </p>
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
                )
            }
        </div>
    );
};
export default BillList;
