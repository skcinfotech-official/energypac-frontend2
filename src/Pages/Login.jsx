import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaChevronRight, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function Login() {
    const [employeeCode, setEmployeeCode] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login, isAuthenticated, user, authChecked } = useAuth();

    useEffect(() => {
        if (authChecked && isAuthenticated) {
            if (user?.role === "ADMIN") {
                navigate("/admin/dashboard", { replace: true });
            } else {
                navigate("/", { replace: true });
            }
        }
    }, [isAuthenticated, authChecked, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setLoading(true);
            const user = await login(employeeCode, password);
            
            if (user?.role === "ADMIN") {
                navigate("/admin/dashboard", { replace: true });
            } else {
                navigate("/", { replace: true });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-inter">
            {/* DECORATIVE ELEMENTS */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>

            <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
                {/* LOGO */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-600 rounded-2xl text-white font-bold text-3xl shadow-2xl shadow-blue-500/40 mb-6">
                        E
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Energypac <span className="text-blue-500">ERP</span>
                    </h1>
                    <p className="text-slate-500 mt-4 text-sm uppercase tracking-widest px-4 py-1.5 border border-slate-800 rounded-full inline-block">
                        Authorized Access Only
                    </p>
                </div>

                {/* LOGIN CARD */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-4xl shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Employee Code"
                                    autoComplete="username"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={employeeCode}
                                    onChange={(e) => setEmployeeCode(e.target.value)}
                                />

                            </div>

                            <div className="relative group">
                                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    className="w-full pl-12 pr-12 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs text-center font-medium">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? "Signing In..." : "Log In"}
                            {!loading && (
                                <FaChevronRight className="text-xs" />
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-800/50 flex justify-between text-[11px] uppercase tracking-widest text-slate-600">
                        <span>Corporate Enterprise</span>
                        <a className="text-slate-400 hover:text-blue-500 underline">
                            Forgot Password?
                        </a>
                    </div>
                </div>

                <p className="text-center text-slate-700 mt-10 text-[10px] uppercase tracking-[0.2em]">
                    © 2026 Energypac Power Generation Ltd.
                </p>
            </div>
        </div>
    );
}
