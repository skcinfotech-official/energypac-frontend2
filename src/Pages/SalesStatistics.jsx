
import { useState, useEffect } from "react";
import { FaChartLine, FaFilter, FaCalendarAlt, FaDownload } from "react-icons/fa";
import { getSalesAnalytics } from "../services/salesService";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const SalesStatistics = () => {
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
            // Only send non-empty filters
            const params = {};
            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date) params.end_date = filters.end_date;
            if (filters.group_by) params.group_by = filters.group_by;

            const data = await getSalesAnalytics(params);
            setAnalyticsData(data);
        } catch (error) {
            console.error("Failed to load analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Colors for charts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading && !analyticsData) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header & Filters */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <FaChartLine className="text-blue-600" />
                            Sales Analytics
                        </h2>
                        <p className="text-slate-500 text-sm"> comprehensive overview of sales performance.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors">
                            <FaDownload /> Export Report
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-slate-100">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                        <input
                            type="date"
                            className="input py-1.5 text-sm"
                            value={filters.start_date}
                            onChange={(e) => handleFilterChange("start_date", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
                        <input
                            type="date"
                            className="input py-1.5 text-sm"
                            value={filters.end_date}
                            onChange={(e) => handleFilterChange("end_date", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Group By</label>
                        <select
                            className="input py-1.5 text-sm w-32"
                            value={filters.group_by}
                            onChange={(e) => handleFilterChange("group_by", e.target.value)}
                        >
                            <option value="day">Day</option>
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                            <option value="year">Year</option>
                        </select>
                    </div>
                    <div className="ml-auto text-xs text-slate-400 self-center">
                        Last Updated: {analyticsData ? new Date(analyticsData.generated_at).toLocaleString() : '-'}
                    </div>
                </div>
            </div>

            {analyticsData && (
                <>
                    {/* Overall Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <StatCard title="Total Quotations" value={analyticsData.overall_statistics?.total_quotations} color="blue" />
                        <StatCard title="Total Value" value={formatCurrency(analyticsData.overall_statistics?.total_value)} color="green" />
                        <StatCard title="Avg Value" value={formatCurrency(analyticsData.overall_statistics?.average_value)} color="purple" />
                        <StatCard title="Highest Value" value={formatCurrency(analyticsData.overall_statistics?.highest_value)} color="orange" />
                        <StatCard title="Lowest Value" value={formatCurrency(analyticsData.overall_statistics?.lowest_value)} color="red" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Time Trends Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6">Sales Trend Over Time</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analyticsData.time_trends}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                        <Line type="monotone" dataKey="total_value" name="Total Value" stroke="#3b82f6" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Status Breakdown Pie Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6">Quotation Status Breakdown</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analyticsData.status_breakdown}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="count"
                                            nameKey="status"
                                        >
                                            {analyticsData.status_breakdown?.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value, name, props) => [value, props.payload.status]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Clients Bar Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6">Top Clients by Value</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analyticsData.top_clients} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 12 }} />
                                        <YAxis dataKey="client_name" type="category" width={100} tick={{ fontSize: 12 }} />
                                        <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="total_value" name="Total Value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Conversion Funnel / Tax Analysis using simple cards for now */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4">Conversion Funnel</h3>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <FunnelStep label="Queries" value={analyticsData.conversion_funnel?.total_queries} color="bg-slate-100 text-slate-600" />
                                    <FunnelStep label="Quotations" value={analyticsData.conversion_funnel?.quotations_sent} color="bg-blue-100 text-blue-600" />
                                    <FunnelStep label="Converted" value={analyticsData.conversion_funnel?.converted} color="bg-green-100 text-green-600" />
                                    <FunnelStep label="Rejected" value={analyticsData.conversion_funnel?.rejected} color="bg-red-100 text-red-600" />
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4">Tax Analysis (Averages)</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                                        <p className="text-xs text-slate-500 font-bold uppercase">CGST</p>
                                        <p className="text-xl font-bold text-slate-800">{analyticsData.tax_analysis?.cgst?.avg_percentage}%</p>
                                        <p className="text-xs text-slate-400">{formatCurrency(analyticsData.tax_analysis?.cgst?.total)} Total</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                                        <p className="text-xs text-slate-500 font-bold uppercase">SGST</p>
                                        <p className="text-xl font-bold text-slate-800">{analyticsData.tax_analysis?.sgst?.avg_percentage}%</p>
                                        <p className="text-xs text-slate-400">{formatCurrency(analyticsData.tax_analysis?.sgst?.total)} Total</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                                        <p className="text-xs text-slate-500 font-bold uppercase">IGST</p>
                                        <p className="text-xl font-bold text-slate-800">{analyticsData.tax_analysis?.igst?.avg_percentage}%</p>
                                        <p className="text-xs text-slate-400">{formatCurrency(analyticsData.tax_analysis?.igst?.total)} Total</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const StatCard = ({ title, value, color }) => {
    const colorClasses = {
        blue: "text-blue-600 bg-blue-50",
        green: "text-green-600 bg-green-50",
        purple: "text-purple-600 bg-purple-50",
        orange: "text-orange-600 bg-orange-50",
        red: "text-red-600 bg-red-50",
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
            <p className={`text-xl font-bold truncate ${colorClasses[color]?.split(" ")[0]}`}>{value}</p>
        </div>
    );
};

const FunnelStep = ({ label, value, color }) => (
    <div className={`p-3 rounded-lg flex flex-col items-center justify-center ${color}`}>
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-[10px] uppercase font-bold tracking-wide opacity-80">{label}</span>
    </div>
);

const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    });
};

export default SalesStatistics;
