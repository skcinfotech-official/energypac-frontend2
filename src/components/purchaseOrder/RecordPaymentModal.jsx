import React, { useState } from "react";
import { FaTimes, FaMoneyBillWave, FaCalendarAlt, FaCreditCard, FaEdit } from "react-icons/fa";
import { recordFinancePayment } from "../../services/financeService";
import PasswordConfirmModal from "../ui/PasswordConfirmModal";

const RecordPaymentModal = ({ open, onClose, poData, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [paymentCurrency, setPaymentCurrency] = useState("INR");
    const [payload, setPayload] = useState({
        amount: "",
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: "NEFT",
        reference_number: "",
        remarks: ""
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setPayload({ ...payload, [e.target.name]: e.target.value });
    };

    const handleInitialSubmit = (e) => {
        e.preventDefault();
        if (!payload.amount || parseFloat(payload.amount) <= 0) {
            setError("Please enter a valid amount");
            return;
        }
        setError("");
        setConfirmOpen(true);
    };

    const handleFinalConfirm = async (password) => {
        setLoading(true);
        setError("");
        try {
            let finalAmount = parseFloat(payload.amount);
            if (paymentCurrency !== 'INR' && poData.exchange_rate) {
                finalAmount = finalAmount * parseFloat(poData.exchange_rate);
            }

            await recordFinancePayment(poData.id, {
                ...payload,
                amount: finalAmount,
                remarks: payload.remarks + (paymentCurrency !== 'INR' ? ` (Paid: ${payload.amount} ${paymentCurrency})` : ""),
                confirm_password: password
            });
            onSuccess("Payment recorded successfully!");
            setConfirmOpen(false);
            onClose();
        } catch (err) {
            console.error("Payment failed", err);
            const msg = err.response?.data?.message || err.response?.data?.detail || "Failed to record payment";
            setError(msg);
            setConfirmOpen(false);
        } finally {
            setLoading(false);
        }
    };

    if (!open || !poData) return null;

    const paymentModes = ["CASH", "CHEQUE", "NEFT", "RTGS", "IMPS", "UPI", "OTHER"];

    const formatINR = (val) => Number(val || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

    return (
        <>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>

                {/* Modal */}
                <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-outfit">
                    <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                <FaMoneyBillWave className="text-emerald-400" /> Record Payment
                            </h3>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">
                                {poData.po_number} • {poData.vendor_name}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <FaTimes size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleInitialSubmit} className="p-8 space-y-6 bg-slate-50">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <FaMoneyBillWave className="text-emerald-500" /> Amount to Pay *
                                    </label>
                                    
                                    {poData.currency && poData.currency !== 'INR' && (
                                        <div className="flex bg-slate-200 rounded-lg p-0.5 shadow-inner">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPaymentCurrency('INR');
                                                    setPayload({ ...payload, amount: poData.balance });
                                                }}
                                                className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${paymentCurrency === 'INR' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                INR
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPaymentCurrency(poData.currency);
                                                    setPayload({ ...payload, amount: (poData.balance / (poData.exchange_rate || 1)).toFixed(2) });
                                                }}
                                                className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${paymentCurrency !== 'INR' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                {poData.currency}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                        {paymentCurrency === 'INR' ? '₹' : (paymentCurrency === 'USD' ? '$' : paymentCurrency)}
                                    </div>
                                    <input
                                        required
                                        type="number" step="0.01"
                                        name="amount"
                                        value={payload.amount}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full pl-10 pr-5 py-3.5 bg-white border border-slate-200 rounded-xl text-xl font-black focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                                        Outstanding: {formatINR(poData.balance)}
                                    </p>
                                    {paymentCurrency !== 'INR' && poData.exchange_rate && (
                                        <p className="text-[10px] text-emerald-600 font-bold uppercase italic">
                                            ≈ {formatINR(parseFloat(payload.amount || 0) * poData.exchange_rate)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FaCalendarAlt className="text-slate-400" /> Date
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        name="payment_date"
                                        value={payload.payment_date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FaCreditCard className="text-slate-400" /> Mode
                                    </label>
                                    <select
                                        name="payment_mode"
                                        value={payload.payment_mode}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                    >
                                        {paymentModes.map(mode => (
                                            <option key={mode} value={mode}>{mode}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FaEdit className="text-slate-400" /> Ref. Number
                                </label>
                                <input
                                    type="text"
                                    name="reference_number"
                                    value={payload.reference_number}
                                    onChange={handleChange}
                                    placeholder="UTR / Check No / Trans ID"
                                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label>
                                <textarea
                                    name="remarks"
                                    value={payload.remarks}
                                    onChange={handleChange}
                                    rows="2"
                                    placeholder="Add payment details/notes..."
                                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-emerald-500 outline-none transition-all"
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] px-6 py-3.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <PasswordConfirmModal
                open={confirmOpen}
                loading={loading}
                title="Confirm Payment"
                message={`You are recording a payment of ${paymentCurrency === 'INR' ? formatINR(payload.amount) : `${paymentCurrency} ${payload.amount}`} for ${poData.po_number}.`}
                onConfirm={handleFinalConfirm}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    );
};

export default RecordPaymentModal;
