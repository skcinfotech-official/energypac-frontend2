import React from "react";
import { FaTimes, FaMoneyBillWave, FaUserTie, FaCalendarAlt, FaShippingFast, FaIdCard, FaEnvelope, FaPhoneAlt, FaBoxOpen, FaHistory } from "react-icons/fa";

const FinancePOModal = ({ open, onClose, data, onViewItems, onRecordPayment, onShowHistory }) => {
    if (!open || !data) return null;

    const formatCurrency = (amount) => {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            case 'PARTIALLY_RECEIVED': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Purchase Order Details</h3>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(data.status)}`}>
                                {data.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 font-bold mt-1 flex items-center gap-2">
                             <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-mono">{data.po_number}</span>
                             • 
                             <span className="flex items-center gap-1.5"><FaCalendarAlt className="text-slate-400" /> {new Date(data.po_date).toLocaleDateString()}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-900 active:scale-90">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Payable</p>
                            <p className="text-2xl font-black text-slate-900">{formatCurrency(data.total_amount)}</p>
                        </div>
                        <div className="p-5 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30">
                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">Amount Paid</p>
                            <p className="text-2xl font-black text-emerald-700">{formatCurrency(data.amount_paid)}</p>
                        </div>
                        <div className="p-5 rounded-2xl border-2 border-red-100 bg-red-50/30">
                            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest mb-1">Outstanding Balance</p>
                            <p className="text-2xl font-black text-red-700">{formatCurrency(data.balance)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Vendor Information */}
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                                <FaUserTie className="text-slate-400" />
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Vendor Info</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        Vendor Name
                                    </label>
                                    <p className="text-sm font-bold text-slate-800">{data.vendor_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        GST Number
                                    </label>
                                    <p className="text-sm font-mono font-bold text-slate-800">{data.vendor_gst || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 text-blue-500">
                                        <FaEnvelope size={10} /> Email
                                    </label>
                                    <p className="text-sm font-bold text-slate-800">{data.vendor_email || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 text-emerald-500">
                                        <FaPhoneAlt size={10} /> Phone
                                    </label>
                                    <p className="text-sm font-bold text-slate-800">{data.vendor_phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <div className="border-b border-slate-200 pb-3 flex items-center gap-2">
                                <FaMoneyBillWave className="text-slate-400" />
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Order Summary</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold">Items Total ({data.total_items_count} units)</span>
                                    <span className="text-slate-900 font-black">{formatCurrency(data.items_total)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold flex items-center gap-1.5"><FaShippingFast className="text-blue-400" /> Freight Cost</span>
                                    <span className="text-slate-900 font-black">{formatCurrency(data.freight_cost)}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-base font-black text-slate-900 uppercase tracking-tight">Net Amount</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-emerald-600 block leading-none">{formatCurrency(data.total_amount)}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Inclusive of all taxes</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Item View (optional summary) */}
                    {data.items && data.items.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <FaBoxOpen className="text-slate-400" /> Items List
                                </h4>
                                <button 
                                    onClick={() => onViewItems(data.id)}
                                    className="text-xs font-black text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 flex items-center gap-1"
                                >
                                    SHOW DETAILED ITEM VIEW →
                                </button>
                            </div>
                            <div className="overflow-hidden border border-slate-100 rounded-xl">
                                <table className="w-full text-left bg-white text-xs">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3">Product</th>
                                            <th className="px-5 py-3 text-right">Qty</th>
                                            <th className="px-5 py-3 text-right">Rate</th>
                                            <th className="px-5 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.items.slice(0, 3).map((it, i) => (
                                            <tr key={i}>
                                                <td className="px-5 py-3 font-bold text-slate-700">{it.product_name}</td>
                                                <td className="px-5 py-3 text-right font-black text-slate-900">{it.quantity} {it.unit}</td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-500">{formatCurrency(it.rate)}</td>
                                                <td className="px-5 py-3 text-right font-black text-slate-900">{formatCurrency(it.amount)}</td>
                                            </tr>
                                        ))}
                                        {data.items.length > 3 && (
                                            <tr>
                                                <td colSpan="4" className="px-5 py-3 text-center bg-slate-50/50">
                                                    <button 
                                                        onClick={() => onViewItems(data.id)}
                                                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                                                    >
                                                        + {data.items.length - 3} OTHER ITEMS • CLICK TO VIEW ALL
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-white">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Payment count: <span className="text-slate-800">{data.payment_count}</span>
                    </p>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => onShowHistory(data.id)}
                            className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                        >
                            <FaHistory /> PAYMENT HISTORY
                        </button>
                        <button 
                            onClick={() => onRecordPayment(data)}
                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                            <FaMoneyBillWave /> RECORD PAYMENT
                        </button>
                        <button 
                            onClick={() => onViewItems(data.id)}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                        >
                            ITEM DETAILS
                        </button>
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/20"
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancePOModal;
