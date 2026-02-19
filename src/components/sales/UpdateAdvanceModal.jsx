/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { FaMoneyBillWave, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { updateWorkOrderAdvance, getWorkOrderById } from "../../services/salesService";

const UpdateAdvanceModal = ({ isOpen, onClose, workOrder, onSuccess }) => {
    const [amount, setAmount] = useState("");
    const [currentAdvance, setCurrentAdvance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);


    useEffect(() => {
        const fetchDetails = async () => {
            if (workOrder && isOpen) {
                setFetching(true);
                try {
                    const data = await getWorkOrderById(workOrder.id);
                    // Using advance_amount as per WorkOrderDetailsModal
                    const adv = data.advance_amount || 0;
                    setCurrentAdvance(adv);

                } catch (error) {
                    console.error("Failed to fetch WO details", error);
                    toast.error("Failed to load current advance details");
                } finally {
                    setFetching(false);
                }
            }
        };
        fetchDetails();
    }, [workOrder, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateWorkOrderAdvance(workOrder.id, amount);
            toast.success("Advance updated successfully!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Update failed", error);
            toast.error("Failed to update advance amount.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <FaMoneyBillWave className="text-xl" />
                        </div>
                        <h3 className="font-bold text-slate-800">Update Advance</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Current Advance: {fetching ? (
                                <span className="text-slate-400 text-xs animate-pulse">Loading...</span>
                            ) : (
                                <span className="font-mono text-blue-600">₹{parseFloat(currentAdvance).toFixed(2)}</span>
                            )}
                        </label>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 mt-4">
                            New Advance Payment Amount (₹)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-lg"
                            placeholder="0.00"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Enter the new advance payment amount for Work Order: <span className="font-mono font-semibold">{workOrder?.wo_number}</span>
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? "Updating..." : "Update Amount"}
                        </button>
                    </div>
                </form>

                {/* Removed AlertToast */}
            </div>
        </div>
    );
};

export default UpdateAdvanceModal;
