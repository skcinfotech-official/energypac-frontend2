
import { useState, useEffect } from "react";
import { FaBoxOpen, FaDownload, FaTags, FaWarehouse, FaPenFancy } from "react-icons/fa";
import { getProductSalesAnalysis } from "../services/salesService";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const ProductSalesAnalysis = () => {
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        start_date: "",
        end_date: "",
    });

    useEffect(() => {
        fetchAnalysis();
    }, [filters]);

    const fetchAnalysis = async () => {
        setLoading(true);
        try {
            // Only send non-empty filters
            const params = {};
            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date) params.end_date = filters.end_date;

            const data = await getProductSalesAnalysis(params);
            setAnalysisData(data);
        } catch (error) {
            console.error("Failed to load product analysis", error);
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

    // Colors
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading && !analysisData) {
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
                            <FaBoxOpen className="text-orange-500" />
                            Product Sales Analysis
                        </h2>
                        <p className="text-slate-500 text-sm">Insights into product performance and quoting trends.</p>
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
                    <div className="ml-auto text-xs text-slate-400 self-center">
                        Report Generated: {analysisData ? new Date(analysisData.generated_at).toLocaleString() : '-'}
                    </div>
                </div>
            </div>

            {analysisData && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SummaryCard
                            title="Total Products Quoted"
                            value={analysisData.summary?.total_products}
                            icon={FaTags}
                            color="blue"
                        />
                        <SummaryCard
                            title="Total Quantity Quoted"
                            value={analysisData.summary?.total_quantity_quoted}
                            icon={FaBoxOpen}
                            color="purple"
                        />
                        <SummaryCard
                            title="Total Value Quoted"
                            value={formatCurrency(analysisData.summary?.total_value_quoted)}
                            icon={FaWarehouse}
                            color="green"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Stock Products Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <FaWarehouse className="text-blue-500" /> Top Stock Products (by Value)
                            </h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analysisData.top_stock_products} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 12 }} />
                                        <YAxis dataKey="item_name" type="category" width={120} tick={{ fontSize: 12 }} />
                                        <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="total_value" name="Total Value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Manual Products Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <FaPenFancy className="text-purple-500" /> Top Manual Products (by Value)
                            </h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analysisData.top_manual_products} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 12 }} />
                                        <YAxis dataKey="item_name" type="category" width={120} tick={{ fontSize: 12 }} />
                                        <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="total_value" name="Total Value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Product Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Detailed Product Analysis</h3>
                            <span className="text-xs text-slate-500 font-medium">Top 50 items</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider">
                                        <th className="px-6 py-4">Item Code</th>
                                        <th className="px-6 py-4">Item Name</th>
                                        <th className="px-6 py-4 text-center">Quotations</th>
                                        <th className="px-6 py-4 text-right">Total Qty</th>
                                        <th className="px-6 py-4 text-right">Avg Rate</th>
                                        <th className="px-6 py-4 text-right">Total Value</th>
                                        <th className="px-6 py-4 text-center">Rate Range</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {analysisData.all_products?.length > 0 ? (
                                        analysisData.all_products.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                    {item.item_code}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-800 text-sm">
                                                    {item.item_name}
                                                </td>
                                                <td className="px-6 py-4 text-center text-slate-600 text-sm">
                                                    {item.quotations_count}
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-600 text-sm">
                                                    {item.total_quantity} {item.unit}
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-600 text-sm">
                                                    {formatCurrency(item.average_rate)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-800 text-sm">
                                                    {formatCurrency(item.total_value)}
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs text-slate-500">
                                                    {formatCurrency(item.min_rate)} - {formatCurrency(item.max_rate)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                                No product data found for the selected period.
                                            </td>
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

const SummaryCard = ({ title, value, icon: Icon, color }) => {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        purple: "bg-purple-50 text-purple-600",
        orange: "bg-orange-50 text-orange-600",
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-xl ${colorClasses[color]}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-500">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
};

export default ProductSalesAnalysis;
