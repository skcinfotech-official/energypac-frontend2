
import { useState, useEffect } from "react";
import { FaTimes, FaPercent } from "react-icons/fa";
import { updateClientQuotationGst, getClientQuotationSummary } from "../../services/salesService";

const UpdateGstModal = ({ isOpen, onClose, quotation, onSuccess }) => {
    const [formData, setFormData] = useState({
        cgst_percentage: 0,
        sgst_percentage: 0,
        igst_percentage: 0,
    });
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch existing rates when modal opens
    useEffect(() => {
        if (isOpen && quotation?.id) {
            const fetchSummary = async () => {
                setLoading(true);
                try {
                    const data = await getClientQuotationSummary(quotation.id);
                    if (data?.taxes) {
                        setFormData({
                            cgst_percentage: data.taxes.cgst?.percentage || 0,
                            sgst_percentage: data.taxes.sgst?.percentage || 0,
                            igst_percentage: data.taxes.igst?.percentage || 0,
                        });
                    }
                } catch (err) {
                    console.error("Failed to fetch quotation summary", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchSummary();
        }
    }, [isOpen, quotation]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await updateClientQuotationGst(quotation.id, formData);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to update GST settings");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !quotation) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        Update GST Rates
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                        <FaTimes />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-slate-500 mb-4">
                        Update tax rates for Quotation <span className="font-mono font-semibold text-slate-700">{quotation.quotation_number}</span>
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading rates...</div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">CGST %</label>
                                <input
                                    type="number"
                                    name="cgst_percentage"
                                    value={formData.cgst_percentage}
                                    onChange={handleInputChange}
                                    className="input w-full"
                                    step="any"
                                    min="0"
                                    max="100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">SGST %</label>
                                <input
                                    type="number"
                                    name="sgst_percentage"
                                    value={formData.sgst_percentage}
                                    onChange={handleInputChange}
                                    className="input w-full"
                                    step="any"
                                    min="0"
                                    max="100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">IGST %</label>
                                <input
                                    type="number"
                                    name="igst_percentage"
                                    value={formData.igst_percentage}
                                    onChange={handleInputChange}
                                    className="input w-full"
                                    step="any"
                                    min="0"
                                    max="100"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {submitting ? "Updating..." : "Update Rates"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdateGstModal;
