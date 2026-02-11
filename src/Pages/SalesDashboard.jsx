
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaFileAlt, FaChartLine, FaArrowUp, FaBox, FaShoppingBag, FaFileInvoiceDollar, FaRegListAlt, FaArrowRight, FaCommentDots, FaMoneyBillWave, FaPercentage } from "react-icons/fa";
import { getSalesDashboardStats } from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";

// Helper to fix API links to Client Routes if needed
const normalizeLink = (link) => {
    if (!link) return "#";

    let newLink = link;

    // Map API resource paths to Frontend Routes
    if (newLink.includes("/sales/quotations")) {
        newLink = newLink.replace("/sales/quotations", "/sales/client-quotation");
    } else if (newLink.includes("/sales/queries")) {
        newLink = newLink.replace("/sales/queries", "/sales/client-query");
    }

    // Convert UUID path params to query params if needed
    const idMatch = newLink.match(/\/([a-f0-9-]{36})/);
    if (idMatch) {
        const id = idMatch[1];
        const parts = newLink.split('/' + id);
        newLink = `${parts[0]}?view_id=${id}`;
    }

    return newLink;
};

export default function SalesDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getSalesDashboardStats();
                setStats(data);
            } catch (err) {
                console.error("Failed to load sales dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Sales Overview</h2>
                    <p className="text-slate-500 text-sm">Welcome back, {user?.full_name || "User"}. Here's your sales performance.</p>
                </div>
                {stats?.generated_at && (
                    <div className="text-xs text-slate-500 font-medium">
                        Updated : {new Date(stats.generated_at).toLocaleString()}
                    </div>
                )}
            </div>

            {stats && (
                <>
                    {/* STATS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Quoted Value"
                            value={stats.values?.total_quoted?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || "₹0"}
                            change={`${stats.quotations?.this_month || 0} Quotes this month`}
                            icon={<FaFileInvoiceDollar />}
                            color="blue"
                        />
                        <StatCard
                            title="Accepted Value"
                            value={stats.values?.accepted_value?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || "₹0"}
                            change={`${stats.metrics?.acceptance_rate || 0}% Acceptance Rate`}
                            icon={<FaMoneyBillWave />}
                            color="emerald"
                        />
                        <StatCard
                            title="Pending Queries"
                            value={stats.client_queries?.pending || 0}
                            change={`Total: ${stats.client_queries?.total || 0}`}
                            icon={<FaCommentDots />}
                            color="orange"
                        />
                        <StatCard
                            title="Conversion Rate"
                            value={`${stats.metrics?.conversion_rate || 0}%`}
                            change="Quotations to Orders"
                            icon={<FaPercentage />}
                            color="indigo"
                        />
                    </div>

                    {/* ALERTS SECTION */}
                    {stats.alerts && stats.alerts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {stats.alerts.map((alert, idx) => (
                                <div key={idx} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                        <FaFileAlt />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-amber-900 text-sm">{alert.title}</h4>
                                        <p className="text-amber-700 text-xs mt-1 mb-2">{alert.message}</p>
                                        {alert.link && (
                                            <Link to={normalizeLink(alert.link)} className="inline-flex items-center text-xs font-bold text-amber-600 hover:text-amber-800 hover:underline gap-1">
                                                {alert.action || "View Details"} <FaArrowRight className="text-[10px]" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}


                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* RECENT ACTIVITY SECTION */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800">Recent Activity</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                                            <th className="px-6 py-4">Title</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4 text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {stats.recent_activities?.slice(0, 10).map((activity, index) => (
                                            <TableRow
                                                key={index}
                                                activity={activity}
                                            />
                                        ))}
                                        {(!stats.recent_activities || stats.recent_activities.length === 0) && (
                                            <tr><td colSpan="4" className="p-6 text-center text-slate-400">No recent activity</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* TOP CLIENTS */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                                <div className="px-6 py-4 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-800">Top Clients (This Month)</h3>
                                </div>
                                <div className="p-0">
                                    {stats.top_clients_this_month?.slice(0, 5).map((client, idx) => (
                                        <div key={idx} className="px-6 py-3 border-b border-slate-50 hover:bg-slate-50 flex items-center justify-between last:border-0">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{client.client_name}</p>
                                                <p className="text-xs text-slate-500 font-mono">{client.quotations_count} Quotes</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-blue-600 text-sm">
                                                    {(client.total_value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                                </p>
                                                <p className="text-[10px] text-slate-400">Total Value</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats.top_clients_this_month || stats.top_clients_this_month.length === 0) && (
                                        <div className="p-4 text-center text-slate-400 text-xs">No top clients data available.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ title, value, change, icon, color }) {
    const colors = {
        blue: "bg-blue-100 text-blue-600",
        indigo: "bg-indigo-100 text-indigo-600",
        emerald: "bg-emerald-100 text-emerald-600",
        orange: "bg-orange-100 text-orange-600",
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors[color]} group-hover:scale-110 transition-transform duration-200`}>
                    {icon}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600`}>
                    {change}
                </span>
            </div>
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
            </div>
        </div>
    );
}

function TableRow({ activity }) {
    const typeColors = {
        quotation: "bg-blue-100 text-blue-700",
        client_query: "bg-amber-100 text-amber-700",
        order: "bg-emerald-100 text-emerald-700",
        other: "bg-slate-100 text-slate-700"
    };

    const typeLabel = {
        quotation: "Quotation",
        client_query: "Query",
        order: "Order",
    };

    const typeKey = activity.type || 'other';

    return (
        <tr className="hover:bg-slate-50/50 transition-colors">
            <td className="px-6 py-4">
                <span className="font-semibold text-slate-700 text-sm tracking-wide block">
                    {activity.link ? (
                        <Link to={normalizeLink(activity.link)} className="hover:text-blue-600 hover:underline">
                            {activity.title}
                        </Link>
                    ) : (
                        activity.title
                    )}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className="text-slate-500 text-xs">{activity.description}</span>
            </td>
            <td className="px-6 py-4">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${typeColors[typeKey] || typeColors.other}`}>
                    {typeLabel[typeKey] || typeKey}
                </span>
            </td>
            <td className="px-6 py-4 text-right text-slate-500 text-xs">
                {new Date(activity.date).toLocaleDateString()}
            </td>
        </tr>
    );
}
