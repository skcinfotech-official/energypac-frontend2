import React, { useState, useEffect } from "react";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import BillDetailsModal from "../components/sales/BillDetailsModal";
import { getBills, getBillById, markBillAsPaid, cancelBill, getBillReport, getOutstandingReport, getBillPaymentHistory } from "../services/salesService";
import PasswordConfirmModal from "../components/ui/PasswordConfirmModal";
import WorkOrderSelector from "../components/common/WorkOrderSelector";
import { FaSearch, FaFilter, FaEye, FaMoneyBillWave, FaTimes, FaFileExcel, FaHistory, FaFileInvoiceDollar, FaCalendarAlt, FaUserTie, FaUserEdit } from "react-icons/fa";
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
    const [filterWorkOrder, setFilterWorkOrder] = useState("");

    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [confirm, setConfirm] = useState({ open: false, title: "", description: "", action: null });

    // Payment Modal State
    const [paymentModal, setPaymentModal] = useState({ open: false, bill: null, amount: "", currency: "INR", payment_date: "", payment_mode: "CASH", reference_number: "", remarks: "" });
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);
    const [passwordModal, setPasswordModal] = useState({ open: false, onConfirm: null, title: "", message: "", loading: false });

    // Details Modal State
    const [selectedBillId, setSelectedBillId] = useState(null);
    const [billDetails, setBillDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Payment History Modal State
    const [historyModal, setHistoryModal] = useState({ open: false, data: null, loading: false });

    // Report State
    const [showReportModal, setShowReportModal] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [reportType, setReportType] = useState("bills");
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

    const fetchBills = async (pageNum = 1) => {
        setLoading(true);
        try {
            const data = await getBills(pageNum, searchQuery, filterWorkOrder);
            if (data) {
                setBills(data.results || []);
                setTotalCount(data.count || 0);
                setNext(data.next);
                setPrevious(data.previous);
                setPage(pageNum);
            }
        } catch (error) {
            console.error("Failed to fetch bills", error);
            setAlert({ open: true, type: "error", message: "Failed to load bills" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchBills(page);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, filterWorkOrder, page]);

    const handleNext = () => { if (next) setPage(p => p + 1); };
    const handlePrev = () => { if (previous) setPage(p => Math.max(1, p - 1)); };

    const handleViewDetails = async (id) => {
        setPaymentModal(prev => ({ ...prev, open: false })); // Ensure payment modal is closed
        setHistoryModal(prev => ({ ...prev, open: false })); // Ensure history modal is closed
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
            action: () => {
                setConfirm(prev => ({ ...prev, open: false }));
                setPasswordModal({
                    open: true,
                    title: "Confirm Cancellation",
                    message: "Please enter your password to cancel this bill.",
                    loading: false,
                    onConfirm: async (password) => {
                        setPasswordModal(prev => ({ ...prev, loading: true }));
                        try {
                            const res = await cancelBill(billId, { confirm_password: password });
                            setAlert({ open: true, type: "success", message: res.message || "Bill cancelled successfully" });
                            fetchBills(page);
                            setPasswordModal({ open: false });
                        } catch (error) {
                            console.error("Failed to cancel bill", error);
                            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to cancel bill";
                            setAlert({ open: true, type: "error", message: errorMsg });
                            setPasswordModal(prev => ({ ...prev, loading: false }));
                        }
                    }
                });
            }
        });
    };

    const openPaymentModal = (bill) => {
        closeDetailsModal();
        setHistoryModal(prev => ({ ...prev, open: false }));
        const defaultAmount = parseFloat(bill.balance) > 0 ? bill.balance : "0.00";
        setPaymentModal({
            open: true,
            bill,
            amount: defaultAmount,
            currency: "INR",
            payment_date: new Date().toISOString().split("T")[0],
            payment_mode: "CASH",
            reference_number: "",
            remarks: ""
        });
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        setPasswordModal({
            open: true,
            title: "Confirm Payment",
            message: "Please enter your password to record this payment.",
            loading: false,
            onConfirm: async (password) => {
                setPasswordModal(prev => ({ ...prev, loading: true }));
                try {
                    let finalAmount = parseFloat(paymentModal.amount);
                    const billExchRate = parseFloat(paymentModal.bill?.exchange_rate || paymentModal.bill?.conversion_rate || 1);
                    if (paymentModal.currency !== 'INR') {
                        finalAmount = finalAmount * billExchRate;
                    }

                    const payload = {
                        confirm_password: password,
                        amount_paid: Number(finalAmount.toFixed(2)),
                        payment_date: paymentModal.payment_date
                    };
                    const res = await markBillAsPaid(paymentModal.bill.id, payload);
                    setAlert({ open: true, type: "success", message: res.message || "Payment recorded successfully" });
                    setPaymentModal({ open: false, bill: null, amount: "", currency: "INR", payment_date: "", payment_mode: "CASH", reference_number: "", remarks: "" });
                    fetchBills(page);
                    setPasswordModal({ open: false });
                } catch (error) {
                    console.error("Payment failed", error);
                    const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to record payment";
                    setAlert({ open: true, type: "error", message: errorMsg });
                    setPasswordModal(prev => ({ ...prev, loading: false }));
                }
            }
        });
    };

    const handleViewHistory = async (bill) => {
        closeDetailsModal();
        setPaymentModal(prev => ({ ...prev, open: false }));
        setHistoryModal({ open: true, data: null, loading: true });
        try {
            const data = await getBillPaymentHistory(bill.id);
            setHistoryModal({ open: true, data: data, loading: false });
        } catch (error) {
            console.error("Failed to fetch history", error);
            setAlert({ open: true, type: "error", message: "Failed to fetch payment history" });
            setHistoryModal({ open: false, data: null, loading: false });
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
                const billsList = data.bills || [];
                const sheetData = [
                    ["OUTSTANDING PAYMENTS REPORT"],
                    ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()],
                    [],
                    ["Summary: Total Quantity", summary.total_outstanding_bills || 0],
                    ["Summary: Total Amount", summary.total_outstanding_amount || 0],
                    [],
                    ["Bill Number", "Date", "PI Number", "Client Name", "Contact Person", "Phone", "Email", "Total Amount", "Paid Amount", "Balance Due", "Days Outstanding", "Status"]
                ];
                billsList.forEach(b => sheetData.push([b.bill_number, b.bill_date, b.pi_number || b.wo_number, b.client_name, b.contact_person, b.phone, b.email, b.total_amount, b.amount_paid, b.balance, b.days_outstanding, b.status]));
                const ws = XLSX.utils.aoa_to_sheet(sheetData);
                XLSX.utils.book_append_sheet(wb, ws, "Outstanding");
            } else {
                const params = { ...reportParams };
                const data = await getBillReport(params);
                const summary = data.summary || {};
                const billsList = data.bills || [];
                const sheetData = [
                    ["PI BILL REPORT"],
                    ["Date Range:", `${data.date_range?.start_date} to ${data.date_range?.end_date}`],
                    ["Summary: Total Records", summary.total_bills],
                    ["Summary: Total Amount", summary.total_amount],
                    [],
                    ["Bill Number", "Date", "PI Number", "Client Name", "Amount", "Paid", "Balance", "Status"]
                ];
                billsList.forEach(b => sheetData.push([b.bill_number, b.bill_date, b.pi_number || b.wo_number, b.client_name, b.total_amount, b.amount_paid, b.balance, b.status]));
                const ws = XLSX.utils.aoa_to_sheet(sheetData);
                XLSX.utils.book_append_sheet(wb, ws, "Bills");
            }
            const filename = `Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, filename);
            setShowReportModal(false);
            setAlert({ open: true, type: "success", message: "Report generated successfully" });
        } catch (error) {
            console.error("Failed to download report", error);
            setAlert({ open: true, type: "error", message: "Failed to download report" });
        } finally {
            setDownloading(false);
        }
    };

    const formatCurrency = (amount, curr = 'INR') => {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: curr === 'USD' ? 'USD' : 'INR',
            maximumFractionDigits: 2
        }).replace('US$', '$');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split("-");
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${day} ${monthNames[parseInt(month, 10) - 1]} ${year}`;
        }
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString();
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'GENERATED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PAID': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-1">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <FaFileInvoiceDollar className="text-emerald-600" />
                        PI Bills (Finance)
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium ">Track client billing, outstanding balances, and financial records for all active proforma invoices</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
                            setReportParams({ start_date: thirtyDaysAgo, end_date: today, status: "", work_order: "", aging: false });
                            setReportType("bills");
                            setShowReportModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                        <FaFileExcel className="text-sm" />
                        GENERATE REPORT
                    </button>
                    <div className="bg-slate-50 px-5 py-2 rounded-xl border border-slate-200">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Bills</p>
                        <p className="text-xl font-black text-slate-800 leading-tight">{totalCount}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Search */}
                    <div className="lg:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Search Bill No. / Client</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="E.g. BILL/2026/001..."
                                value={searchQuery}
                                onChange={(e) => {setSearchQuery(e.target.value); setPage(1);}}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                            />
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    {/* WO Filter */}
                    <div className="lg:col-span-2">
                        <div className="flex items-end justify-between mb-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Filter by Proforma Invoice</label>
                            {(filterWorkOrder || searchQuery) && (
                                <button
                                    onClick={() => {setFilterWorkOrder(""); setSearchQuery(""); setPage(1);}}
                                    className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-1"
                                >
                                    <FaTimes size={10} /> Clear Filters
                                </button>
                            )}
                        </div>
                        <WorkOrderSelector
                            value={filterWorkOrder}
                            onChange={(id) => {setFilterWorkOrder(id); setPage(1);}}
                            placeholder="All Proforma Invoices (Search by PI Number or Client)"
                        />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bill Reference</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Client Info</th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Amount</th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Due Balance</th>
                                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && bills.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-10"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : bills.length > 0 ? (
                                bills.map((bill) => (
                                    <tr key={bill.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 self-start text-xs mb-1">
                                                    {bill.bill_number}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                    PI: <span className="text-slate-600 ">{bill.wo_number || bill.pi_number}</span>
                                                </span>
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-1">
                                                    <FaCalendarAlt size={10} />
                                                    {bill.bill_date}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                    <FaUserTie size={12} className="text-slate-400" />
                                                    {bill.client_name}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-medium ">{bill.contact_person}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-bold text-slate-800">{formatCurrency(bill.total_amount)}</div>
                                            {bill.currency && bill.currency !== 'INR' && (
                                                <div className="text-[10px] text-blue-600 font-bold">
                                                    {formatCurrency(bill.original_total_amount || (bill.total_amount / (bill.exchange_rate || bill.conversion_rate || 1)), bill.currency)}
                                                </div>
                                            )}
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Net Payable</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-bold text-emerald-600">{formatCurrency(bill.amount_paid)}</div>
                                            {bill.currency && bill.currency !== 'INR' && (
                                                <div className="text-[10px] text-emerald-500 font-bold">
                                                    {formatCurrency(bill.original_amount_paid || (bill.amount_paid / (bill.exchange_rate || bill.conversion_rate || 1)), bill.currency)}
                                                </div>
                                            )}
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Total Collected</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`text-sm font-black ${parseFloat(bill.balance) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {formatCurrency(bill.balance)}
                                            </div>
                                            {bill.currency && bill.currency !== 'INR' && (
                                                <div className={`text-[10px] font-bold ${parseFloat(bill.balance) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {formatCurrency(bill.original_balance || (bill.balance / (bill.exchange_rate || bill.conversion_rate || 1)), bill.currency)}
                                                </div>
                                            )}
                                            {parseFloat(bill.balance) > 0 && (
                                                <div className="w-16 h-1 bg-slate-100 rounded-full mt-1.5 ml-auto overflow-hidden">
                                                    <div className="h-full bg-red-400" style={{ width: `${Math.min(100, (bill.balance / bill.total_amount) * 100)}%` }}></div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(bill.status)}`}>
                                                {bill.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(bill.id)}
                                                    className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                    title="Quick View"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    onClick={() => handleViewHistory(bill)}
                                                    className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                    title="Collection History"
                                                >
                                                    <FaHistory size={14} />
                                                </button>
                                                <button
                                                    onClick={() => openPaymentModal(bill)}
                                                    disabled={bill.status === 'PAID' || bill.status === 'CANCELLED'}
                                                    className={`p-2 rounded-lg transition-all shadow-sm active:scale-90 ${
                                                        bill.status === 'PAID' || bill.status === 'CANCELLED'
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                                                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                                    }`}
                                                    title={bill.status === 'PAID' ? "Bill Already Paid" : bill.status === 'CANCELLED' ? "Cannot Pay Cancelled Bill" : "Record Payment"}
                                                >
                                                    <FaMoneyBillWave />
                                                </button>
                                                <button
                                                    onClick={() => handleCancelBill(bill.id)}
                                                    disabled={bill.status === 'PAID' || bill.status === 'CANCELLED'}
                                                    className={`p-2 rounded-lg transition-all shadow-sm active:scale-90 ${
                                                        bill.status === 'PAID' || bill.status === 'CANCELLED'
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                                                            : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                                                    }`}
                                                    title={bill.status === 'PAID' ? "Cannot Cancel Paid Bill" : bill.status === 'CANCELLED' ? "Bill Already Cancelled" : "Void Bill"}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                                <FaSearch size={32} />
                                            </div>
                                            <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No billing records found</p>
                                            <button onClick={() => {setSearchQuery(""); setFilterWorkOrder("");}} className="text-emerald-600 font-black hover:underline uppercase text-[10px] tracking-widest mt-2">SHOW ALL RECORDS</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Showing <span className="text-slate-800">{bills.length}</span> of <span className="text-slate-800">{totalCount}</span> records
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrev}
                            disabled={!previous}
                            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm hover:shadow active:scale-95"
                        >
                            PREVIOUS
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={!next}
                            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm hover:shadow active:scale-95"
                        >
                            NEXT PAGE
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Modals outside the animated container */}
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
                onConfirm={confirm.action}
                onCancel={() => setConfirm({ ...confirm, open: false })}
            />

            <PasswordConfirmModal
                open={passwordModal.open}
                title={passwordModal.title}
                message={passwordModal.message}
                loading={passwordModal.loading}
                onConfirm={passwordModal.onConfirm}
                onCancel={() => setPasswordModal({ open: false })}
            />

            {selectedBillId && (
                <BillDetailsModal
                    isOpen={!!selectedBillId}
                    onClose={closeDetailsModal}
                    loading={detailsLoading}
                    details={billDetails}
                />
            )}

            {/* Redesigned Payment Collection Modal */}
            {paymentModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPaymentModal({ open: false, bill: null, amount: "", payment_date: "", payment_mode: "NEFT", reference_number: "", remarks: "" })}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 text-white p-6">
                            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <FaMoneyBillWave className="text-emerald-400" /> Record Collection
                            </h3>
                            <div className="mt-4 flex justify-between items-end border-t border-white/10 pt-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Bill Reference</p>
                                    <p className="font-mono font-bold text-emerald-400">{paymentModal.bill?.bill_number}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Due Balance</p>
                                    <p className="text-2xl font-black text-red-400">{formatCurrency(paymentModal.bill?.balance)}</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="p-8 space-y-6 bg-slate-50">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Collected Amount *</label>
                                        {paymentModal.bill?.currency && paymentModal.bill?.currency !== 'INR' && (
                                            <div className="flex bg-slate-200 rounded-lg p-0.5 shadow-inner">
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentModal({ ...paymentModal, currency: 'INR', amount: paymentModal.bill.balance })}
                                                    className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${paymentModal.currency === 'INR' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                                >
                                                    INR
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const rate = parseFloat(paymentModal.bill?.exchange_rate || paymentModal.bill?.conversion_rate || 1);
                                                        setPaymentModal({ ...paymentModal, currency: paymentModal.bill.currency, amount: paymentModal.bill.original_balance || (paymentModal.bill.balance / rate) });
                                                    }}
                                                    className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${paymentModal.currency !== 'INR' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                                >
                                                    {paymentModal.bill.currency}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                            {paymentModal.currency === 'INR' ? '₹' : (paymentModal.currency === 'USD' ? '$' : paymentModal.currency)}
                                        </div>
                                        <input
                                            type="number" step="0.01" min="0" required
                                            value={paymentModal.amount}
                                            onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                                            className="w-full pl-10 pr-5 py-3.5 bg-white border border-slate-200 rounded-xl text-xl font-black focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                    {paymentModal.currency !== 'INR' && (paymentModal.bill?.exchange_rate || paymentModal.bill?.conversion_rate) && (
                                        <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase italic">
                                            Approx. {formatCurrency(parseFloat(paymentModal.amount || 0) * parseFloat(paymentModal.bill?.exchange_rate || paymentModal.bill?.conversion_rate || 1))} (Exch: {Number(paymentModal.bill?.exchange_rate || paymentModal.bill?.conversion_rate || 1).toFixed(2)})
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Collection Date *</label>
                                    <input
                                        type="date" required
                                        value={paymentModal.payment_date}
                                        onChange={(e) => setPaymentModal({ ...paymentModal, payment_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setPaymentModal({ open: false, bill: null, amount: "", payment_date: "", payment_mode: "CASH", reference_number: "", remarks: "" })}
                                    className="flex-1 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={paymentSubmitting}
                                    className="flex-[2] py-3.5 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                >
                                    {paymentSubmitting ? "PROCESSING..." : "CONFIRM COLLECTION"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {historyModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setHistoryModal({ open: false, data: null, loading: false })}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                                    <FaHistory className="text-amber-400" /> Collection Tracking
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">History for {historyModal.data?.bill_number}</p>
                            </div>
                            <button onClick={() => setHistoryModal({ open: false, data: null, loading: false })} className="p-2 hover:bg-white/10 rounded-full transition-colors"><FaTimes size={18} /></button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto bg-slate-50 space-y-6">
                            {historyModal.loading ? (
                                <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
                            ) : historyModal.data ? (
                                <>
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md">
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Net Bill Amount</p>
                                            <p className="text-xl font-black text-slate-800">{formatCurrency(historyModal.data.net_payable)}</p>
                                            {historyModal.data.currency && historyModal.data.currency !== 'INR' && (
                                                <p className="text-[10px] font-bold text-blue-600 mt-1">
                                                    {formatCurrency(historyModal.data.original_net_payable || (historyModal.data.net_payable / (historyModal.data.exchange_rate || historyModal.data.conversion_rate || 1)), historyModal.data.currency)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md">
                                            <p className="text-[10px] text-emerald-600 uppercase font-black tracking-wider mb-1">Total Collected</p>
                                            <p className="text-xl font-black text-emerald-700">{formatCurrency(historyModal.data.total_paid)}</p>
                                            {historyModal.data.currency && historyModal.data.currency !== 'INR' && (
                                                <p className="text-[10px] font-bold text-emerald-500 mt-1">
                                                    {formatCurrency(historyModal.data.original_total_paid || (historyModal.data.total_paid / (historyModal.data.exchange_rate || historyModal.data.conversion_rate || 1)), historyModal.data.currency)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 shadow-sm hover:shadow-md">
                                            <p className="text-[10px] text-orange-600 uppercase font-black tracking-wider mb-1">Current Balance</p>
                                            <p className="text-xl font-black text-orange-700">{formatCurrency(historyModal.data.balance)}</p>
                                            {historyModal.data.currency && historyModal.data.currency !== 'INR' && (
                                                <p className="text-[10px] font-bold text-orange-400 mt-1">
                                                    {formatCurrency(historyModal.data.original_balance || (historyModal.data.balance / (historyModal.data.exchange_rate || historyModal.data.conversion_rate || 1)), historyModal.data.currency)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md">
                                            <p className="text-[10px] text-blue-600 uppercase font-black tracking-wider mb-1">Payment Count</p>
                                            <p className="text-xl font-black text-blue-700">{historyModal.data.payments?.length || 0} <span className="text-xs font-bold uppercase tracking-tighter">Collections</span></p>
                                        </div> 
                                    </div>

                                    {/* Payments Table */}
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FaMoneyBillWave className="text-slate-400" />
                                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Collection Breakdown</h4>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                                        <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                                        <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                                                        <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                                                        <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount Collected</th>
                                                        <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance After</th>
                                                        <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recorded By</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {historyModal.data.payments?.map((payment, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-5 py-4">
                                                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
                                                                    <FaCalendarAlt size={12} className="text-slate-300" />
                                                                    {formatDate(payment.payment_date || payment.created_at)}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
                                                                    {payment.payment_mode_display}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-mono font-bold text-slate-700">
                                                                        {payment.reference_number || "N/A"}
                                                                    </span>
                                                                    {payment.remarks && (
                                                                        <span className="text-[10px] text-slate-400 font-medium italic mt-0.5 max-w-[200px] truncate" title={payment.remarks}>
                                                                            {payment.remarks}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-sm font-black text-slate-800">{formatCurrency(payment.amount)}</span>
                                                                    {historyModal.data.currency && historyModal.data.currency !== 'INR' && (
                                                                        <span className="text-[10px] font-bold text-emerald-600">
                                                                            {formatCurrency(payment.original_amount || (payment.amount / (historyModal.data.exchange_rate || historyModal.data.conversion_rate || 1)), historyModal.data.currency)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-xs font-bold text-slate-400">{formatCurrency(payment.balance_after)}</span>
                                                                    {historyModal.data.currency && historyModal.data.currency !== 'INR' && (
                                                                        <span className="text-[10px] font-medium text-slate-400">
                                                                            {formatCurrency(payment.original_balance_after || (payment.balance_after / (historyModal.data.exchange_rate || historyModal.data.conversion_rate || 1)), historyModal.data.currency)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
                                                                    <FaUserEdit size={12} className="text-slate-300" />
                                                                    {payment.recorded_by_name}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* Report Selection Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowReportModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 text-white p-6 border-b border-white/5">
                            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <FaFileExcel className="text-emerald-400" /> Export Financial Report
                            </h3>
                            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Select report parameters</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-3">
                                <label className="flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-50/10 transition-all group">
                                    <input type="radio" name="rpt" value="bills" checked={reportType === "bills"} onChange={(e) => setReportType(e.target.value)} className="w-5 h-5 text-emerald-600 border-slate-300 focus:ring-emerald-500" />
                                    <div>
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Comprehensive Bill Report</p>
                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">Transaction history & tax summaries</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-50/10 transition-all group">
                                    <input type="radio" name="rpt" value="outstanding" checked={reportType === "outstanding"} onChange={(e) => setReportType(e.target.value)} className="w-5 h-5 text-emerald-600 border-slate-300 focus:ring-emerald-500" />
                                    <div>
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Outstanding Collection Report</p>
                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">Pending balances & aging analysis</p>
                                    </div>
                                </label>
                            </div>
                            {reportType === "bills" && (
                                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">From</label>
                                        <input type="date" value={reportParams.start_date} onChange={(e) => setReportParams({...reportParams, start_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">To</label>
                                        <input type="date" value={reportParams.end_date} onChange={(e) => setReportParams({...reportParams, end_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500" />
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={handleDownloadReport}
                                disabled={downloading}
                                className="w-full py-4 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {downloading ? (<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>) : <FaFileExcel />}
                                {downloading ? "GENERATING..." : "DOWNLOAD EXCEL REPORT"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BillList;