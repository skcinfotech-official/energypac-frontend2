import React, { useState } from "react";
import { FaTimes, FaMoneyBillWave, FaCalendarAlt, FaCreditCard, FaEdit } from "react-icons/fa";
import { recordFinancePayment } from "../../services/financeService";
import PasswordConfirmModal from "../ui/PasswordConfirmModal";

const RecordPaymentModal = ({ open, onClose, poData, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
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
            await recordFinancePayment(poData.id, {
                ...payload,
                confirm_password: password,
                amount: parseFloat(payload.amount)
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

    return (
        <>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>

                {/* Modal */}
                <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="px-8 py-6 bg-emerald-600 text-white flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 font-outfit">
                                <FaMoneyBillWave /> Record Payment
                            </h3>
                            <p className="text-[10px] text-emerald-100 uppercase tracking-widest font-bold mt-1 font-outfit">
                                {poData.po_number} • {poData.vendor_name}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-emerald-100 hover:text-white">
                            <FaTimes size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleInitialSubmit} className="p-8 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl animate-in fade-in slide-in-from-top-2 font-outfit">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5 font-outfit">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FaMoneyBillWave className="text-emerald-500" /> Amount (INR)
                                </label>
                                <input
                                    required
                                    type="number"
                                    name="amount"
                                    value={payload.amount}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-outfit"
                                />
                                <p className="text-[10px] text-slate-400 font-black">Outstanding: {poData.balance.toLocaleString('en-IN')}</p>
                            </div>

                            <div className="space-y-1.5 font-outfit">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FaCalendarAlt className="text-slate-400" /> Payment Date
                                </label>
                                <input
                                    required
                                    type="date"
                                    name="payment_date"
                                    value={payload.payment_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-outfit"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5 font-outfit">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FaCreditCard className="text-slate-400" /> Payment Mode
                                </label>
                                <select
                                    name="payment_mode"
                                    value={payload.payment_mode}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-outfit appearance-none"
                                >
                                    {paymentModes.map(mode => (
                                        <option key={mode} value={mode}>{mode}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5 font-outfit">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FaEdit className="text-slate-400" /> Ref. Number
                                </label>
                                <input
                                    type="text"
                                    name="reference_number"
                                    value={payload.reference_number}
                                    onChange={handleChange}
                                    placeholder="UTR / Check No."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-outfit"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 font-outfit">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label>
                            <textarea
                                name="remarks"
                                value={payload.remarks}
                                onChange={handleChange}
                                rows="2"
                                placeholder="Add payment details/notes..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-outfit"
                            ></textarea>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-outfit"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 font-outfit"
                            >
                                Confirm
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <PasswordConfirmModal
                open={confirmOpen}
                loading={loading}
                title="Confirm Payment"
                message={`You are recording a payment of ${parseFloat(payload.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} for ${poData.po_number}.`}
                onConfirm={handleFinalConfirm}
                onCancel={() => setConfirmOpen(false)}
            />
        </>
    );
};

export default RecordPaymentModal;
