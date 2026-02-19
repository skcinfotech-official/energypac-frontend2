
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    FaFileInvoiceDollar, FaClipboardList, FaExclamationTriangle, FaChartLine,
    FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaArrowRight
} from "react-icons/fa";
import { getBillingDashboardStats } from "../services/salesService";
import AlertToast from "../components/ui/AlertToast";

const BillingDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const resolveLink = (apiLink) => {
        if (!apiLink) return "#";

        // Work Order Details
        if (apiLink.match(/^\/work-orders\/[a-f0-9-]+$/)) {
            const id = apiLink.split('/').pop();
            return `/sales/work-orders?id=${id}`;
        }

        // Bill Details
        if (apiLink.match(/^\/bills\/[a-f0-9-]+$/)) {
            const id = apiLink.split('/').pop();
            return `/sales/wo-bills?id=${id}`;
        }

        // Work Order List with filter
        if (apiLink.includes("/work-orders")) {
            return apiLink.replace("/work-orders", "/sales/work-orders");
        }

        // Bill List with filter
        if (apiLink.includes("/bills")) {
            return apiLink.replace("/bills", "/sales/wo-bills");
        }

        // Inventory
        if (apiLink.includes("/inventory")) {
            return apiLink.replace("/inventory", "/master/item");
        }

        return apiLink;
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getBillingDashboardStats();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch billing stats:", err);
                setError("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const formatCurrency = (amount) => {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-500 text-xl font-bold mb-2">Error</div>
                <p className="text-slate-600">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <FaChartLine className="text-emerald-600" />
                        Billing Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1">Overview of work orders, billing status, and financial metrics</p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-xs font-mono text-slate-400 mb-2">Last updated: {new Date(stats?.generated_at).toLocaleTimeString()}</p>
                    <Link to="/sales/billing-analytics" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 rounded-lg text-xs font-semibold transition-colors shadow-sm">
                        <FaChartLine /> View Analytics
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Work Orders Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <FaClipboardList className="text-blue-500" /> Work Orders
                        </h3>
                        <Link to="/sales/work-orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            View All <FaArrowRight size={10} />
                        </Link>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Total Active</p>
                            <p className="text-2xl font-bold text-slate-800">{stats?.work_orders?.active || 0}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Total Value</p>
                            <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats?.work_orders?.total_value)}</p>
                        </div>
                        <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
                            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-1">Partially Delivered</p>
                            <p className="text-2xl font-bold text-slate-800">{stats?.work_orders?.partially_delivered || 0}</p>
                        </div>
                        <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Completed</p>
                            <p className="text-2xl font-bold text-slate-800">{stats?.work_orders?.completed || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Billing Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <FaFileInvoiceDollar className="text-emerald-500" /> Billing & Payments
                        </h3>
                        <Link to="/sales/wo-bills" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                            View All Bills <FaArrowRight size={10} />
                        </Link>
                    </div>
                    <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100 col-span-2 md:col-span-1">
                            <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-1">Total Billed</p>
                            <p className="text-xl font-bold text-slate-800">{formatCurrency(stats?.bills?.total_billed)}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{stats?.bills?.this_month} bills this month</p>
                        </div>
                        <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
                            <p className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">Received</p>
                            <p className="text-xl font-bold text-green-700">{formatCurrency(stats?.bills?.total_received)}</p>
                            <p className="text-[10px] text-green-600/70 mt-1 font-medium">{stats?.bills?.paid} paid bills</p>
                        </div>
                        <div className="p-4 bg-red-50/50 rounded-lg border border-red-100">
                            <p className="text-xs text-red-600 font-semibold uppercase tracking-wider mb-1">Outstanding</p>
                            <p className="text-xl font-bold text-red-600">{formatCurrency(stats?.bills?.total_outstanding)}</p>
                            <p className="text-[10px] text-red-400 mt-1 font-medium">{stats?.bills?.generated} pending</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <FaHourglassHalf className="text-slate-400" /> Recent Activity
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[400px]">
                        {stats?.recent_activities?.length > 0 ? (
                            stats.recent_activities.map((activity, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                                    <div className={`mt-1 p-2 rounded-full flex-shrink-0 
                                        ${activity.type === 'work_order' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {activity.type === 'work_order' ? <FaClipboardList /> : <FaFileInvoiceDollar />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{activity.title}</p>
                                            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                                {new Date(activity.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">{activity.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide
                                                ${activity.action === 'created' ? 'bg-slate-100 text-slate-600' :
                                                    activity.action === 'generated' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                                {activity.action}
                                            </span>
                                            {activity.link && (
                                                <Link to={resolveLink(activity.link)} className="text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                                    View Details
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-500 text-sm">No recent activity found</div>
                        )}
                    </div>
                </div>

                {/* Alerts Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <FaExclamationTriangle className="text-amber-500" /> Alerts & Actions
                        </h3>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto max-h-[400px]">
                        {stats?.alerts?.length > 0 ? (
                            stats.alerts.map((alert, idx) => (
                                <div key={idx} className={`p-4 rounded-lg border border-l-4 shadow-sm
                                    ${alert.type === 'danger' ? 'bg-red-50 border-red-200 border-l-red-500' :
                                        alert.type === 'warning' ? 'bg-amber-50 border-amber-200 border-l-amber-500' : 'bg-blue-50 border-blue-200 border-l-blue-500'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-sm font-bold ${alert.type === 'danger' ? 'text-red-700' :
                                            alert.type === 'warning' ? 'text-amber-700' : 'text-blue-700'
                                            }`}>{alert.title}</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-3">{alert.message}</p>
                                    {alert.link && (
                                        <Link
                                            to={resolveLink(alert.link)}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors inline-block
                                                ${alert.type === 'danger' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                                    alert.type === 'warning' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                        >
                                            {alert.action || "Take Action"}
                                        </Link>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                <FaCheckCircle className="text-4xl text-emerald-100 mb-2" />
                                <p className="text-sm">No pending alerts</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingDashboard;
