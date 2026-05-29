import { useEffect, useState } from "react";
import { createCurrency, updateCurrency } from "../../services/currencyService";
import AlertToast from "../ui/AlertToast";
import { FaTimes } from "react-icons/fa";

const initialState = {
    code: "",
    name: "",
    symbol: "",
    is_active: true,
};

export default function CurrencyModal({
    open,
    onClose,
    mode,
    currency,
    onSuccess,
}) {
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "error", message: "" });

    useEffect(() => {
        if (mode === "edit" && currency) {
            setForm({
                code: currency.code || "",
                name: currency.name || "",
                symbol: currency.symbol || "",
                is_active: currency.is_active ?? true,
            });
        } else {
            setForm(initialState);
        }
        setErrors({});
    }, [mode, currency, open]);

    if (!open) return null;

    const handleChange = (e) => {
        let { name, value, type, checked } = e.target;
        
        if (type === "checkbox") {
            setForm({ ...form, [name]: checked });
        } else {
            if (name === "code") {
                // Currency codes are generally uppercase and up to 3-5 chars
                value = value.toUpperCase().slice(0, 5);
            }
            setForm({ ...form, [name]: value });
        }

        // Clear error when user types
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const validateForm = () => {
        let newErrors = {};
        let isValid = true;

        if (!form.code.trim()) {
            newErrors.code = "Currency Code is required (e.g. USD)";
            isValid = false;
        } else if (form.code.trim().length < 2) {
            newErrors.code = "Currency Code must be at least 2 characters";
            isValid = false;
        }

        if (!form.name.trim()) {
            newErrors.name = "Currency Name is required";
            isValid = false;
        }

        if (!form.symbol.trim()) {
            newErrors.symbol = "Symbol is required (e.g. $)";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            if (mode === "edit") {
                // PATCH payload can include name, is_active, and others
                const payload = {
                    code: form.code,
                    name: form.name,
                    symbol: form.symbol,
                    is_active: form.is_active,
                };
                await updateCurrency(currency.id, payload);
            } else {
                await createCurrency(form);
            }

            onSuccess(mode);
            onClose();
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.detail || err.response?.data?.message || "Failed to save currency";
            setToast({ open: true, type: "error", message: errMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h2 className="text-lg font-bold text-slate-800">
                        {mode === "edit" ? "Edit Currency" : "Add Currency"}
                    </h2>
                    <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <form id="currency-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label block text-xs font-semibold text-slate-600 mb-1">Currency Code <span className="text-red-500">*</span></label>
                            <input
                                className={`input ${errors.code ? "border-red-500 focus:ring-red-200" : ""}`}
                                name="code"
                                value={form.code}
                                onChange={handleChange}
                                placeholder="e.g. USD, EUR, INR"
                                disabled={mode === "edit"} // Often standard practice, but can be editable if allowed
                            />
                            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                        </div>

                        <div>
                            <label className="label block text-xs font-semibold text-slate-600 mb-1">Currency Name <span className="text-red-500">*</span></label>
                            <input
                                className={`input ${errors.name ? "border-red-500 focus:ring-red-200" : ""}`}
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. US Dollar"
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="label block text-xs font-semibold text-slate-600 mb-1">Symbol <span className="text-red-500">*</span></label>
                            <input
                                className={`input ${errors.symbol ? "border-red-500 focus:ring-red-200" : ""}`}
                                name="symbol"
                                value={form.symbol}
                                onChange={handleChange}
                                placeholder="e.g. $, €, ₹"
                            />
                            {errors.symbol && <p className="text-xs text-red-500 mt-1">{errors.symbol}</p>}
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                checked={form.is_active}
                                onChange={handleChange}
                                className="h-4.5 w-4.5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                            />
                            <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 select-none">
                                Is Active
                            </label>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="currency-form"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                    >
                        {loading ? "Saving..." : "Save Currency"}
                    </button>
                </div>

                <AlertToast
                    open={toast.open}
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast({ ...toast, open: false })}
                />
            </div>
        </div>
    );
}
