
import { useState, useEffect } from "react";
import { FaChartLine, FaDownload, FaUsers, FaTrophy, FaCalendarAlt } from "react-icons/fa";
import { getSalesPerformanceReport } from "../services/salesService";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    RadialBarChart, RadialBar,
} from 'recharts';

const SalesPerformance = () => {
    const [performanceData, setPerformanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        start_date: "",
        end_date: "",
    });

    useEffect(() => {
        fetchPerformance();
    }, [filters]);

    const fetchPerformance = async () => {
        setLoading(true);
        try {
            // Only send non-empty filters
            const params = {};
            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date) params.end_date = filters.end_date;

            const data = await getSalesPerformanceReport(params);
            setPerformanceData(data);
        } catch (error) {
            console.error("Failed to load performance report", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Formatter for Currency
    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        });
    };

    if (loading && !performanceData) {
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
                            <FaTrophy className="text-yellow-500" />
                            Sales Performance Report
                        </h2>
                        <p className="text-slate-500 text-sm">Detailed breakdown of team and individual performance.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors">
                            <FaDownload /> Export PDF
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
                    <div className="ml-auto text-xs text-slate-400 self-center">
                        Report Generated: {performanceData ? new Date(performanceData.generated_at).toLocaleString() : '-'}
                    </div>
                </div>
            </div>

            {performanceData && (
                <>
                    {/* Overall Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Total Queries"
                            value={performanceData.overall_metrics?.total_queries}
                            subtitle="Inbound leads"
                            color="blue"
                        />
                        <MetricCard
                            title="Total Quotations"
                            value={performanceData.overall_metrics?.total_quotations}
                            subtitle="Proposals sent"
                            color="purple"
                        />
                        <MetricCard
                            title="Win Rate"
                            value={`${performanceData.overall_metrics?.win_rate}%`}
                            subtitle={`${performanceData.overall_metrics?.total_won} Won / ${performanceData.overall_metrics?.total_lost} Lost`}
                            color="green"
                        />
                        <MetricCard
                            title="Avg Response Time"
                            value={`${performanceData.overall_metrics?.average_response_time_days} Days`}
                            subtitle="Speed to quote"
                            color="orange"
                        />
                    </div>

                    {/* User Performance Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FaUsers className="text-blue-600" />
                                Sales Representative Performance
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider">
                                        <th className="px-6 py-4">Sales Rep</th>
                                        <th className="px-6 py-4 text-center">Quotations</th>
                                        <th className="px-6 py-4 text-right">Total Value</th>
                                        <th className="px-6 py-4 text-right">Avg Value</th>
                                        <th className="px-6 py-4 text-center">Accepted</th>
                                        <th className="px-6 py-4 text-center">Rejected</th>
                                        <th className="px-6 py-4 text-center">Conversion Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {performanceData.user_performance?.length > 0 ? (
                                        performanceData.user_performance.map((user) => (
                                            <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-800">
                                                    {user.user_name}
                                                </td>
                                                <td className="px-6 py-4 text-center text-slate-600">
                                                    {user.quotations_count}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-slate-800">
                                                    {formatCurrency(user.total_value)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-600">
                                                    {formatCurrency(user.average_value)}
                                                </td>
                                                <td className="px-6 py-4 text-center text-green-600 font-medium">
                                                    {user.accepted_count}
                                                </td>
                                                <td className="px-6 py-4 text-center text-red-500 font-medium">
                                                    {user.rejected_count}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.acceptance_rate >= 50 ? 'bg-green-100 text-green-700' :
                                                            user.acceptance_rate >= 30 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {user.acceptance_rate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                                No performance data found for the selected period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Performance Comparison Chart */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6">Individual Performance Comparison</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData.user_performance} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="user_name" tick={{ fontSize: 12 }} />
                                    <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                                    <RechartsTooltip formatter={(value, name) => [name === 'Total Value' ? formatCurrency(value) : value, name]} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="total_value" name="Total Value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="right" dataKey="quotations_count" name="Quotations Sent" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const MetricCard = ({ title, value, subtitle, color }) => {
    const colorClasses = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        green: "text-green-600 bg-green-50 border-green-100",
        purple: "text-purple-600 bg-purple-50 border-purple-100",
        orange: "text-orange-600 bg-orange-50 border-orange-100",
    };

    return (
        <div className={`p-5 rounded-2xl border ${colorClasses[color]?.split(" ")[2]} bg-white shadow-sm`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
            <div className="flex items-end justify-between">
                <p className={`text-2xl font-bold ${colorClasses[color]?.split(" ")[0]}`}>{value}</p>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${colorClasses[color]}`}>
                    {subtitle}
                </div>
            </div>
        </div>
    );
};

export default SalesPerformance;
