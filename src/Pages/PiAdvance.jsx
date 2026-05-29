import React, { useState, useEffect } from "react";
import { 
    FaSearch, 
    FaFilter, 
    FaPlus, 
    FaTimes, 
    FaCalendarAlt, 
    FaMoneyBillWave, 
    FaUserTie, 
    FaExchangeAlt, 
    FaHistory, 
    FaCheckCircle, 
    FaFileInvoiceDollar, 
    FaCoins, 
    FaInfoCircle, 
    FaDollarSign 
} from "react-icons/fa";
import { getAdvancePayments, createAdvancePayment, adjustAdvancePayment } from "../services/salesService";
import WorkOrderSelector from "../components/common/WorkOrderSelector";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const PiAdvance = () => {
    // Data State
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [confirm, setConfirm] = useState({ open: false, title: "", description: "", action: null });

    // Filter State
    const [filterStatus, setFilterStatus] = useState("ACTIVE");
    const [filterWorkOrder, setFilterWorkOrder] = useState("");
    const [filterCurrency, setFilterCurrency] = useState("");

    // Create Modal State
    const [createModal, setCreateModal] = useState({
        open: false,
        proforma_invoice: "",
        client_name: "",
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_mode: "TT",
        reference_number: "",
        remarks: ""
    });
    const [createLoading, setCreateLoading] = useState(false);

    // Adjust Modal State
    const [adjustModal, setAdjustModal] = useState({
        open: false,
        advanceId: null,
        advanceNumber: "",
        clientName: "",
        piNumber: "",
        remaining: 0,
        amount: ""
    });
    const [adjustLoading, setAdjustLoading] = useState(false);

    // Fetch Advance Payments
    const fetchAdvances = async () => {
        setLoading(true);
        try {
            const params = {
                ...(filterStatus && { status: filterStatus }),
                ...(filterWorkOrder && { proforma_invoice: filterWorkOrder }),
                ...(filterCurrency && { currency: filterCurrency })
            };
            const data = await getAdvancePayments(params);
            setAdvances(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error("Failed to fetch advance payments:", error);
            setAlert({ open: true, type: "error", message: "Failed to load advance payments" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvances();
    }, [filterStatus, filterWorkOrder, filterCurrency]);

    // Handle Create Advance Payment
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!createModal.proforma_invoice) {
            setAlert({ open: true, type: "error", message: "Please select a Proforma Invoice" });
            return;
        }
        setCreateLoading(true);
        try {
            const payload = {
                proforma_invoice: createModal.proforma_invoice,
                client_name: createModal.client_name,
                amount: parseFloat(createModal.amount),
                payment_date: createModal.payment_date,
                payment_mode: createModal.payment_mode,
                reference_number: createModal.reference_number,
                remarks: createModal.remarks
            };
            await createAdvancePayment(payload);
            setAlert({ open: true, type: "success", message: "Advance payment recorded successfully" });
            setCreateModal({
                open: false,
                proforma_invoice: "",
                client_name: "",
                amount: "",
                payment_date: new Date().toISOString().split("T")[0],
                payment_mode: "TT",
                reference_number: "",
                remarks: ""
            });
            fetchAdvances();
        } catch (error) {
            console.error("Failed to record advance payment:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to record advance payment";
            setAlert({ open: true, type: "error", message: errorMsg });
        } finally {
            setCreateLoading(false);
        }
    };

    // Handle Adjust Advance Payment
    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        const adjustAmt = parseFloat(adjustModal.amount);
        if (isNaN(adjustAmt) || adjustAmt <= 0) {
            setAlert({ open: true, type: "error", message: "Please enter a valid amount" });
            return;
        }
        if (adjustAmt > adjustModal.remaining) {
            setAlert({ open: true, type: "error", message: `Amount cannot exceed remaining balance of ${formatCurrency(adjustModal.remaining)}` });
            return;
        }
        setAdjustLoading(true);
        try {
            await adjustAdvancePayment(adjustModal.advanceId, { amount: adjustAmt });
            setAlert({ open: true, type: "success", message: "Advance adjustment recorded successfully" });
            setAdjustModal({
                open: false,
                advanceId: null,
                advanceNumber: "",
                clientName: "",
                piNumber: "",
                remaining: 0,
                amount: ""
            });
            fetchAdvances();
        } catch (error) {
            console.error("Failed to adjust advance:", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to adjust advance payment";
            setAlert({ open: true, type: "error", message: errorMsg });
        } finally {
            setAdjustLoading(false);
        }
    };

    const formatCurrency = (amount, curr = 'INR') => {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: curr === 'USD' ? 'USD' : (curr === 'EUR' ? 'EUR' : 'INR'),
            maximumFractionDigits: 2
        }).replace('US$', '$');
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'ADJUSTED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'USED': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    // Derived Statistics
    const totalAdvanceAmount = advances.reduce((sum, item) => sum + parseFloat(item.amount_inr || item.amount || 0), 0);
    const totalRemainingAmount = advances.reduce((sum, item) => sum + parseFloat((item.remaining * (item.conversion_rate || 1)) || item.remaining || 0), 0);
    const totalUsedAmount = totalAdvanceAmount - totalRemainingAmount;

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in py-1">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <FaCoins className="text-amber-500" />
                            PI Advance Payments
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">Record, track, and adjust client advance payments received against proforma invoices</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCreateModal(prev => ({ ...prev, open: true }))}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                            <FaPlus className="text-xs" />
                            RECORD ADVANCE
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Total Advances Received</p>
                        <p className="text-2xl font-black text-slate-800">{formatCurrency(totalAdvanceAmount, 'INR')}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">INR Valuation</p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all">
                        <p className="text-[10px] text-emerald-600 uppercase font-black tracking-wider mb-1">Total Remaining Balance</p>
                        <p className="text-2xl font-black text-emerald-700">{formatCurrency(totalRemainingAmount, 'INR')}</p>
                        <p className="text-[10px] text-emerald-500 font-bold mt-1 uppercase">Available to adjust</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all">
                        <p className="text-[10px] text-blue-600 uppercase font-black tracking-wider mb-1">Total Used / Adjusted</p>
                        <p className="text-2xl font-black text-blue-700">{formatCurrency(totalUsedAmount, 'INR')}</p>
                        <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase">Injected into bills</p>
                    </div>
                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-all">
                        <p className="text-[10px] text-amber-600 uppercase font-black tracking-wider mb-1">Total Active Payments</p>
                        <p className="text-2xl font-black text-amber-700">{advances.length}</p>
                        <p className="text-[10px] text-amber-500 font-bold mt-1 uppercase">Tracking records</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Filter by Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                            >
                                <option value="">All Statuses</option>
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="ADJUSTED">ADJUSTED</option>
                                <option value="USED">USED</option>
                            </select>
                        </div>

                        {/* Currency Filter */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Filter by Currency</label>
                            <select
                                value={filterCurrency}
                                onChange={(e) => setFilterCurrency(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                            >
                                <option value="">All Currencies</option>
                                <option value="INR">INR</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>

                        {/* Proforma Invoice Filter */}
                        <div>
                            <div className="flex items-end justify-between mb-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Filter by Proforma Invoice</label>
                                {(filterWorkOrder || filterStatus || filterCurrency) && (
                                    <button
                                        onClick={() => {setFilterWorkOrder(""); setFilterStatus("ACTIVE"); setFilterCurrency("");}}
                                        className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-1"
                                    >
                                        <FaTimes size={10} /> Clear Filters
                                    </button>
                                )}
                            </div>
                            <WorkOrderSelector
                                value={filterWorkOrder}
                                onChange={(id) => setFilterWorkOrder(id)}
                                placeholder="Search by PI Number or Client..."
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Advance Ref</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Proforma Invoice</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Client Info</th>
                                    <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Advance</th>
                                    <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Used & Remaining</th>
                                    <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment Info</th>
                                    <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading && advances.length === 0 ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="8" className="px-6 py-10"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                        </tr>
                                    ))
                                ) : advances.length > 0 ? (
                                    advances.map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 self-start text-xs mb-1">
                                                        {item.advance_number}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono font-semibold text-slate-700 text-xs">
                                                    {item.pi_number}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                        <FaUserTie size={12} className="text-slate-400" />
                                                        {item.client_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-sm font-black text-slate-800">{formatCurrency(item.amount, item.currency)}</div>
                                                {item.currency !== 'INR' && (
                                                    <div className="text-[10px] text-blue-600 font-bold">
                                                        {formatCurrency(item.amount_inr || (item.amount * (item.conversion_rate || 1)), 'INR')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-xs font-bold text-emerald-600">
                                                    Rem: {formatCurrency(item.remaining, item.currency)}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                    Used: {formatCurrency(item.amount_used || 0, item.currency)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
                                                        <FaCalendarAlt size={12} className="text-slate-300" />
                                                        {item.payment_date}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border mt-1">
                                                        {item.payment_mode}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setAdjustModal({
                                                        open: true,
                                                        advanceId: item.id,
                                                        advanceNumber: item.advance_number,
                                                        clientName: item.client_name,
                                                        piNumber: item.pi_number,
                                                        remaining: item.remaining,
                                                        amount: ""
                                                    })}
                                                    disabled={item.status === 'ADJUSTED' || item.status === 'USED' || parseFloat(item.remaining) <= 0}
                                                    className={`p-2 rounded-lg transition-all shadow-sm active:scale-90 inline-flex items-center gap-1.5 text-xs font-bold ${
                                                        item.status === 'ADJUSTED' || item.status === 'USED' || parseFloat(item.remaining) <= 0
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                                                            : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                                                    }`}
                                                    title={parseFloat(item.remaining) <= 0 ? "Advance Fully Adjusted" : "Adjust / Use Advance"}
                                                >
                                                    <FaExchangeAlt size={12} />
                                                    <span>Adjust</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                                    <FaSearch size={32} />
                                                </div>
                                                <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No advance payments found</p>
                                                <button onClick={() => {setFilterWorkOrder(""); setFilterStatus(""); setFilterCurrency("");}} className="text-blue-600 font-black hover:underline uppercase text-[10px] tracking-widest mt-2">SHOW ALL RECORDS</button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {createModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCreateModal(prev => ({ ...prev, open: false }))}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="bg-slate-900 text-white p-6">
                            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <FaCoins className="text-amber-400" /> Record Advance Payment
                            </h3>
                            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Always created against a Proforma Invoice</p>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="p-8 space-y-5 bg-slate-50 overflow-y-auto max-h-[70vh]">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Select Proforma Invoice *</label>
                                <WorkOrderSelector
                                    value={createModal.proforma_invoice}
                                    onChange={(id, selectedWO) => {
                                        setCreateModal(prev => ({
                                            ...prev,
                                            proforma_invoice: id,
                                            client_name: selectedWO ? selectedWO.client_name : prev.client_name
                                        }));
                                    }}
                                    placeholder="Search PI by Number or Client..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Client Name *</label>
                                <input
                                    type="text" required
                                    value={createModal.client_name}
                                    onChange={(e) => setCreateModal(prev => ({ ...prev, client_name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                    placeholder="E.g. ABC International..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Amount (FC / INR) *</label>
                                    <input
                                        type="number" step="0.01" min="0" required
                                        value={createModal.amount}
                                        onChange={(e) => setCreateModal(prev => ({ ...prev, amount: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        placeholder="E.g. 100000.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Payment Mode *</label>
                                    <select
                                        value={createModal.payment_mode}
                                        onChange={(e) => setCreateModal(prev => ({ ...prev, payment_mode: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value="TT">TT</option>
                                        <option value="CASH">CASH</option>
                                        <option value="NEFT">NEFT</option>
                                        <option value="CHEQUE">CHEQUE</option>
                                        <option value="BANK_TRANSFER">BANK TRANSFER</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Reference Number</label>
                                    <input
                                        type="text"
                                        value={createModal.reference_number}
                                        onChange={(e) => setCreateModal(prev => ({ ...prev, reference_number: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        placeholder="E.g. TT-REF-001..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Payment Date *</label>
                                    <input
                                        type="date" required
                                        value={createModal.payment_date}
                                        onChange={(e) => setCreateModal(prev => ({ ...prev, payment_date: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Remarks</label>
                                <textarea
                                    value={createModal.remarks}
                                    onChange={(e) => setCreateModal(prev => ({ ...prev, remarks: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all h-20 resize-none"
                                    placeholder="Remarks or payment terms..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setCreateModal(prev => ({ ...prev, open: false }))}
                                    className="flex-1 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="flex-[2] py-3.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                    {createLoading ? "RECORDING..." : "RECORD ADVANCE"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Adjust Modal */}
            {adjustModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setAdjustModal(prev => ({ ...prev, open: false }))}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 text-white p-6">
                            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <FaExchangeAlt className="text-blue-400" /> Adjust Advance Payment
                            </h3>
                            <div className="mt-4 border-t border-white/10 pt-4 text-xs space-y-1.5 text-slate-300">
                                <p>Advance Number: <span className="font-mono font-bold text-white">{adjustModal.advanceNumber}</span></p>
                                <p>Client: <span className="font-bold text-white">{adjustModal.clientName}</span></p>
                                <p>Proforma Invoice: <span className="font-mono font-bold text-white">{adjustModal.piNumber}</span></p>
                            </div>
                        </div>
                        <form onSubmit={handleAdjustSubmit} className="p-8 space-y-6 bg-slate-50">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount to Adjust *</label>
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Available: {formatCurrency(adjustModal.remaining)}</span>
                                </div>
                                <input
                                    type="number" step="0.01" min="0.01" max={adjustModal.remaining} required
                                    value={adjustModal.amount}
                                    onChange={(e) => setAdjustModal(prev => ({ ...prev, amount: e.target.value }))}
                                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-xl font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Enter amount..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setAdjustModal(prev => ({ ...prev, open: false }))}
                                    className="flex-1 py-3 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustLoading}
                                    className="flex-[2] py-3.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                    {adjustLoading ? "ADJUSTING..." : "CONFIRM ADJUSTMENT"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
        </>
    );
};

export default PiAdvance;
