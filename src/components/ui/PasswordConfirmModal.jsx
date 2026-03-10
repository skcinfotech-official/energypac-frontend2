import React, { useState } from "react";
import { FaLock } from "react-icons/fa";

const PasswordConfirmModal = ({ open, title = "Confirm Password", message = "Please enter your password to confirm this action.", onConfirm, onCancel, loading = false }) => {
    const [password, setPassword] = useState("");

    if (!open) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(password);
        setPassword("");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4 text-blue-600">
                        <div className="p-3 bg-blue-50 rounded-full">
                            <FaLock />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    </div>

                    <p className="text-sm text-slate-600 mb-6 font-semibold">
                        {message}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <input
                                autoFocus
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all"
                            >
                                {loading ? "Verifying..." : "Confirm"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PasswordConfirmModal;
