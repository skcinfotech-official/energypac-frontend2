import React, { useEffect, useState } from "react";
import { fetchFinancePOPaymentHistory } from "../../services/financeService";
import { FaTimes, FaHistory, FaInfoCircle, FaCalendarAlt, FaMoneyBillWave, FaUserEdit, FaFileInvoiceDollar } from "react-icons/fa";

const PaymentHistoryModal = ({ open, onClose, poId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && poId) {
            const loadHistory = async () => {
                setLoading(true);
                try {
                    const res = await fetchFinancePOPaymentHistory(poId);
                    setData(res);
                } catch (err) {
                    console.error("Failed to load payment history", err);
                } finally {
                    setLoading(false);
                }
            };
            loadHistory();
        }
    }, [open, poId]);

    if (!open) return null;

    const formatCurrency = (amount) => {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "---";
        return new Date(dateString).toLocaleDateString(undefined, { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <FaHistory className="text-amber-400" />
                            Payment History
                        </h3>
                        <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mt-1">
                            {data?.po_number || "Loading..."} • {data?.vendor_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <FaTimes size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading payments...</p>
                        </div>
                    ) : data ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-1">Total PO Amount</p>
                                    <p className="text-xl font-black text-slate-800">{formatCurrency(data.total_amount)}</p>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md">
                                    <p className="text-[10px] text-emerald-600 uppercase font-black tracking-wider mb-1">Total Paid To Date</p>
                                    <p className="text-xl font-black text-emerald-700">{formatCurrency(data.total_paid)}</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 shadow-sm hover:shadow-md">
                                    <p className="text-[10px] text-orange-600 uppercase font-black tracking-wider mb-1">Current Balance</p>
                                    <p className="text-xl font-black text-orange-700">{formatCurrency(data.balance)}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md">
                                    <p className="text-[10px] text-blue-600 uppercase font-black tracking-wider mb-1">Payment Count</p>
                                    <p className="text-xl font-black text-blue-700">{data.payment_count} <span className="text-xs">Installments</span></p>
                                </div> 
                            </div>

                            {/* Payments Table */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FaMoneyBillWave className="text-slate-400" />
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Transaction Records</h4>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${data.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        PO Status: {data.status}
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                                <th className="px-5 py-4">#</th>
                                                <th className="px-5 py-4 text-center">Date</th>
                                                <th className="px-5 py-4">Mode & Reference</th>
                                                <th className="px-5 py-4 text-right">Amount Paid</th>
                                                <th className="px-5 py-4 text-right">Balance After</th>
                                                <th className="px-5 py-4">Recorded By</th>
                                                <th className="px-5 py-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {data.payments?.length > 0 ? (
                                                data.payments.map((payment, idx) => (
                                                    <tr key={payment.id} className="hover:bg-slate-50 transition-all group">
                                                        <td className="px-5 py-4 font-black text-slate-400 text-xs">
                                                            {String(payment.payment_number || idx + 1).padStart(2, '0')}
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-xs font-bold text-slate-800">{formatDate(payment.payment_date)}</span>
                                                                <span className="text-[10px] text-slate-400 font-medium">{new Date(payment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-tighter">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                                    {payment.payment_mode_display || payment.payment_mode}
                                                                </span>
                                                                <span className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">Ref: {payment.reference_number || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 text-right font-black text-emerald-600 text-sm">
                                                            {formatCurrency(payment.amount)}
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-800">{formatCurrency(payment.balance_after)}</span>
                                                                <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                                    <div 
                                                                        className="h-full bg-blue-500 transition-all duration-1000" 
                                                                        style={{ width: `${Math.max(0, 100 - (payment.balance_after / data.total_amount) * 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                                                <FaUserEdit size={12} className="text-slate-300" />
                                                                {payment.recorded_by_name}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <button 
                                                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                                title="View Receipt"
                                                            >
                                                                <FaFileInvoiceDollar size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="px-5 py-12 text-center">
                                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                                            <FaMoneyBillWave size={32} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">No transaction records found</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {data.payments?.length > 0 && (
                                            <tfoot>
                                                <tr className="bg-slate-50 border-t border-slate-200">
                                                    <td colSpan="3" className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase">Total Consolidated</td>
                                                    <td className="px-5 py-3 text-right font-black text-emerald-700 text-sm">{formatCurrency(data.total_paid)}</td>
                                                    <td className="px-5 py-3 text-right text-xs font-black text-orange-700">{formatCurrency(data.balance)}</td>
                                                    <td colSpan="2"></td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                            <FaInfoCircle size={32} />
                            <p className="text-sm font-bold uppercase tracking-widest">No payment records found</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-white">
                    <button onClick={onClose} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200">
                        CLOSE HISTORY
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentHistoryModal;
