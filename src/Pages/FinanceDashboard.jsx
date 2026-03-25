
import React, { useState, useEffect } from "react";
import { 
    FaChartLine, FaArrowUp, FaArrowDown, FaExchangeAlt, 
    FaShoppingCart, FaClock, FaCheckCircle, FaExclamationCircle,
    FaMoneyBillWave, FaArrowRight, FaWallet, FaHandHoldingUsd,
    FaBox
} from "react-icons/fa";
import { getFinanceDashboard } from "../services/financeService";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FinanceDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const data = await getFinanceDashboard();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch finance dashboard:", err);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const formatCurrency = (amount) => {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100 max-w-2xl mx-auto mt-10">
                <FaExclamationCircle className="text-red-500 text-4xl mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Dashboard</h2>
                <p className="text-red-600 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in p-1">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Finance Overview</h2>
                    <p className="text-slate-500 text-sm">Welcome back, {user?.full_name || "User"}. Monitoring cash flow and accounts.</p>
                </div>
                {/* {stats?.generated_at ? (
                    <div className="text-xs text-slate-500 font-medium">
                        Updated : {new Date(stats.generated_at).toLocaleString()}
                    </div>
                ) : (
                    <div className="text-xs text-slate-500 font-medium">
                        Server Time : {new Date().toLocaleTimeString()}
                    </div>
                )} */}
            </div>

            {/* MAIN STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Inflow"
                    value={formatCurrency(stats?.cash_flow?.total_inflow)}
                    change="Payments Received"
                    icon={<FaArrowUp />}
                    color="emerald"
                />
                <StatCard 
                    title="Total Outflow"
                    value={formatCurrency(stats?.cash_flow?.total_outflow)}
                    change="Vendor Payments"
                    icon={<FaArrowDown />}
                    color="orange"
                />
                <StatCard 
                    title="Net Cash Flow"
                    value={formatCurrency(stats?.cash_flow?.net_flow)}
                    change="Current Liquidity"
                    icon={<FaWallet />}
                    color="blue"
                />
                <StatCard 
                    title="Purchased Value"
                    value={formatCurrency(stats?.purchase_items?.purchased_value)}
                    change={`${stats?.purchase_items?.purchased_items} Items Purchased`}
                    icon={<FaBox />}
                    color="indigo"
                />
            </div>

            {/* DETAILED CARDS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Incoming (Client Payments) Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FaHandHoldingUsd className="text-indigo-600" /> {stats?.incoming?.label}
                        </h3>
                        <Link to="/finance/wo-bills" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                            MANAGE BILLS <FaArrowRight size={10} />
                        </Link>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Outstanding</p>
                                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.incoming?.outstanding)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase">
                                    {stats?.incoming?.pending_count} Bills Pending
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col justify-end space-y-3">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-slate-500 font-medium italic">Collection Progress</span>
                                <span className="text-indigo-600">{Math.round((stats?.incoming?.total_received / stats?.incoming?.total_value) * 100) || 0}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${(stats?.incoming?.total_received / stats?.incoming?.total_value) * 100}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                                <span>REC: {formatCurrency(stats?.incoming?.total_received)}</span>
                                <span>TOTAL: {formatCurrency(stats?.incoming?.total_value)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Outgoing (Vendor Payments) Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FaShoppingCart className="text-orange-600" /> {stats?.outgoing?.label}
                        </h3>
                        <Link to="/finance/purchase-orders" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                            MANAGE POS <FaArrowRight size={10} />
                        </Link>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">To Be Paid</p>
                                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.outgoing?.outstanding)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-black rounded-full uppercase">
                                    {stats?.outgoing?.pending_count} POs Pending
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col justify-end space-y-3">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-slate-500 font-medium italic">Payment Progress</span>
                                <span className="text-orange-600">{Math.round((stats?.outgoing?.total_paid / stats?.outgoing?.total_value) * 100) || 0}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${(stats?.outgoing?.total_paid / stats?.outgoing?.total_value) * 100}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                                <span>PAID: {formatCurrency(stats?.outgoing?.total_paid)}</span>
                                <span>TOTAL: {formatCurrency(stats?.outgoing?.total_value)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TRANSACTIONS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Client Payments (Incoming) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FaClock className="text-indigo-500" /> Recent Client Collections
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                                    <th className="px-6 py-4">Date / Bill</th>
                                    <th className="px-6 py-4">Client Info</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats?.recent_incoming?.length > 0 ? (
                                    stats.recent_incoming.slice(0, 5).map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-800">{formatDate(item.payment_date)}</div>
                                                <div className="text-[10px] font-mono text-indigo-600 font-bold">{item.bill_number}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-slate-700">{item.client_name}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase">{item.payment_mode_display}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-sm font-bold text-emerald-600">{formatCurrency(item.amount)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                                    {item.payment_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="p-10 text-center text-slate-400 italic">No recent incoming payments</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Vendor Payments (Outgoing) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FaClock className="text-orange-500" /> Recent Vendor Payments
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                                    <th className="px-6 py-4">Date / PO</th>
                                    <th className="px-6 py-4">Vendor Info</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats?.recent_outgoing?.length > 0 ? (
                                    stats.recent_outgoing.slice(0, 5).map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-800">{formatDate(item.payment_date)}</div>
                                                <div className="text-[10px] font-mono text-orange-600 font-bold">{item.po_number || "N/A"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-slate-700">{item.vendor_name}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase">{item.payment_mode_display}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-sm font-bold text-orange-600">{formatCurrency(item.amount)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                                    {item.payment_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="p-10 text-center text-slate-400 italic">No recent outgoing payments</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS ROW */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                        <FaWallet className="text-2xl text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold tracking-tight">Finance Operations</h4>
                        <p className="text-slate-400 text-xs">Manage your bills, POs and record transactions effortlessly.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Link to="/finance/wo-bills" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                        RECIEVE PAYMENT
                    </Link>
                    <Link to="/finance/purchase-orders" className="px-5 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95">
                        RECORD PO PAYMENT
                    </Link>
                </div>
            </div>
        </div>
    );
};

function StatCard({ title, value, change, icon, color }) {
    const colors = {
        blue: "bg-blue-100 text-blue-600",
        indigo: "bg-indigo-100 text-indigo-600",
        emerald: "bg-emerald-100 text-emerald-700",
        orange: "bg-orange-100 text-orange-600",
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors[color]} group-hover:scale-110 transition-transform duration-200`}>
                    <span className="text-lg">{icon}</span>
                </div>
                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-slate-50 text-slate-500 uppercase tracking-tighter">
                    {change}
                </span>
            </div>
            <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h4>
            </div>
        </div>
    );
}

export default FinanceDashboard;
