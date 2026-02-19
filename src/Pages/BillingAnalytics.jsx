
import React, { useState, useEffect } from "react";
import { FaChartLine, FaDownload, FaCalendarAlt, FaFilter, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getBillingAnalytics } from "../services/salesService";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, ComposedChart, Area
} from 'recharts';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";

const BillingAnalytics = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        start_date: "",
        end_date: "",
        group_by: "month"
    });

    useEffect(() => {
        fetchAnalytics();
    }, [filters]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date) params.end_date = filters.end_date;
            if (filters.group_by) params.group_by = filters.group_by;

            const data = await getBillingAnalytics(params);
            setAnalyticsData(data);
        } catch (error) {
            console.error("Failed to load billing analytics", error);
            toast.error("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        });
    };

    const handleExport = () => {
        if (!analyticsData) return;

        const wb = XLSX.utils.book_new();

        // 1. Summary Sheet
        const summaryData = [
            ["BILLING ANALYTICS REPORT"],
            ["Generated At:", new Date().toLocaleString()],
            ["Period:", `${analyticsData.date_range?.start_date} to ${analyticsData.date_range?.end_date}`],
            [],
            ["OVERALL STATISTICS"],
            ["Total Revenue", analyticsData.overall_statistics?.total_revenue],
            ["Total Received", analyticsData.overall_statistics?.total_received],
            ["Total Outstanding", analyticsData.overall_statistics?.total_outstanding],
            ["Total Bills", analyticsData.overall_statistics?.total_bills],
            ["Avg Bill Value", analyticsData.overall_statistics?.average_bill_value],
            ["Collection Rate", `${analyticsData.overall_statistics?.collection_rate}%`]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

        // 2. Trends Sheet
        if (analyticsData.time_trends?.length > 0) {
            const trendData = [
                ["Period", "Total Revenue", "Total Received", "Total Outstanding", "Bills Count"],
                ...analyticsData.time_trends.map(t => [
                    t.period,
                    t.total_revenue,
                    t.total_received,
                    t.total_outstanding,
                    t.bills_count
                ])
            ];
            const wsTrends = XLSX.utils.aoa_to_sheet(trendData);
            XLSX.utils.book_append_sheet(wb, wsTrends, "Time Trends");
        }

        // 3. Clients Sheet
        if (analyticsData.top_clients?.length > 0) {
            const clientData = [
                ["Client Name", "Total Revenue", "Amount Paid", "Outstanding", "Total Bills"],
                ...analyticsData.top_clients.map(c => [
                    c.client_name,
                    c.total_revenue,
                    c.total_paid,
                    c.total_outstanding,
                    c.total_bills
                ])
            ];
            const wsClients = XLSX.utils.aoa_to_sheet(clientData);
            XLSX.utils.book_append_sheet(wb, wsClients, "Top Clients");
        }

        const filename = `Billing_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
        saveAs(blob, filename);
        toast.success("Report downloaded");
    };

    if (loading && !analyticsData) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Link to="/sales/billing-dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
                            <FaArrowLeft />
                        </Link>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <FaChartLine className="text-emerald-600" />
                            Billing Analytics
                        </h2>
                    </div>
                    <p className="text-slate-500 text-sm ml-7">Deep dive into financial performance and client insights.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors border border-emerald-200"
                >
                    <FaDownload /> Export Report
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                    <input
                        type="date"
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={filters.start_date}
                        onChange={(e) => handleFilterChange("start_date", e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                    <input
                        type="date"
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={filters.end_date}
                        onChange={(e) => handleFilterChange("end_date", e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Group By</label>
                    <select
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-32"
                        value={filters.group_by}
                        onChange={(e) => handleFilterChange("group_by", e.target.value)}
                    >
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                    </select>
                </div>
            </div>

            {analyticsData && (
                <>
                    {/* Overall Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard
                            title="Total Revenue"
                            value={formatCurrency(analyticsData.overall_statistics?.total_revenue)}
                            color="blue"
                            subtext={`${analyticsData.overall_statistics?.total_bills} Bills`}
                        />
                        <StatCard
                            title="Received"
                            value={formatCurrency(analyticsData.overall_statistics?.total_received)}
                            color="green"
                        />
                        <StatCard
                            title="Outstanding"
                            value={formatCurrency(analyticsData.overall_statistics?.total_outstanding)}
                            color="red"
                        />
                        <StatCard
                            title="Collection Rate"
                            value={`${analyticsData.overall_statistics?.collection_rate}%`}
                            color="purple"
                        />
                        <StatCard
                            title="Avg Bill Value"
                            value={formatCurrency(analyticsData.overall_statistics?.average_bill_value)}
                            color="amber"
                        />
                        <StatCard
                            title="Avg Payment Days"
                            value={analyticsData.overall_statistics?.average_payment_days || 0}
                            color="slate"
                            subtext="Days"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Time Trends Chart */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <FaCalendarAlt className="text-slate-400" /> Revenue & Collection Trends
                            </h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={analyticsData.time_trends}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                                        <RechartsTooltip
                                            formatter={(value) => formatCurrency(value)}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="total_revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="total_received" name="Received" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Line type="monotone" dataKey="total_outstanding" name="Outstanding" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Clients Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6">Top Clients by Revenue</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analyticsData.top_clients} layout="vertical" margin={{ left: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="client_name" type="category" tick={{ fontSize: 11, fill: '#475569' }} width={80} />
                                        <RechartsTooltip
                                            formatter={(value) => formatCurrency(value)}
                                            cursor={{ fill: '#f8fafc' }}
                                        />
                                        <Bar dataKey="total_revenue" name="Revenue" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={15} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Top Clients Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-700">Client Performance</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Client Name</th>
                                        <th className="px-6 py-3 text-right">Total Revenue</th>
                                        <th className="px-6 py-3 text-right">Amount Paid</th>
                                        <th className="px-6 py-3 text-right">Outstanding</th>
                                        <th className="px-6 py-3 text-center">Bills Count</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {analyticsData.top_clients?.map((client, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-slate-800">{client.client_name}</td>
                                            <td className="px-6 py-3 text-right font-mono text-blue-600">{formatCurrency(client.total_revenue)}</td>
                                            <td className="px-6 py-3 text-right font-mono text-emerald-600">{formatCurrency(client.total_paid)}</td>
                                            <td className="px-6 py-3 text-right font-mono text-red-600">{formatCurrency(client.total_outstanding)}</td>
                                            <td className="px-6 py-3 text-center text-slate-600">{client.total_bills}</td>
                                        </tr>
                                    ))}
                                    {(!analyticsData.top_clients || analyticsData.top_clients.length === 0) && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-400">No client data available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const StatCard = ({ title, value, color, subtext }) => {
    const colorClasses = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        green: "text-emerald-600 bg-emerald-50 border-emerald-100",
        red: "text-red-600 bg-red-50 border-red-100",
        purple: "text-purple-600 bg-purple-50 border-purple-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        slate: "text-slate-600 bg-slate-50 border-slate-200",
    };

    return (
        <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between h-full ${colorClasses[color]?.split(" ").slice(1).join(" ")}`}>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">{title}</p>
                <p className={`text-xl font-bold ${colorClasses[color]?.split(" ")[0]}`}>{value}</p>
            </div>
            {subtext && <p className="text-xs mt-2 font-medium opacity-60">{subtext}</p>}
        </div>
    );
};

export default BillingAnalytics;
