
import { useState, useEffect } from "react";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Grid,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Divider,
} from "@mui/material";
import { getSalesAnalytics } from "../services/salesService";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const SalesStatistics = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    // Default to All Time so existing data always shows (backend default is only last 30 days).
    const [filters, setFilters] = useState(() => {
        const d = new Date();
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return { start_date: "2000-01-01", end_date: local.toISOString().slice(0, 10), group_by: "month" };
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
            <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={40} sx={{ color: "#1565C0" }} />
            </Box>
        );
    }


    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header & Filters */}
            <Card sx={{ borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2 }}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 1 }}>
                                <ShowChartIcon sx={{ color: "#1565C0" }} />
                                Sales Analytics
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#64748b" }}>
                                comprehensive overview of sales performance.
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<FileDownloadIcon />}
                                sx={{
                                    bgcolor: "#f1f5f9",
                                    color: "#475569",
                                    textTransform: "none",
                                    fontWeight: 500,
                                    fontSize: "0.875rem",
                                    borderRadius: 2,
                                    boxShadow: "none",
                                    "&:hover": { bgcolor: "#e2e8f0", boxShadow: "none" },
                                }}
                            >
                                Export Report
                            </Button>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2, borderColor: "#f1f5f9" }} />

                    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 2 }}>
                        <TextField
                            label="Start Date"
                            type="date"
                            size="small"
                            value={filters.start_date}
                            onChange={(e) => handleFilterChange("start_date", e.target.value)}
                            slotProps={{ inputLabel: { shrink: true, sx: { fontSize: "0.75rem", fontWeight: 600, color: "#475569" } } }}
                            sx={{ "& .MuiInputBase-input": { fontSize: "0.875rem" } }}
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            size="small"
                            value={filters.end_date}
                            onChange={(e) => handleFilterChange("end_date", e.target.value)}
                            slotProps={{ inputLabel: { shrink: true, sx: { fontSize: "0.75rem", fontWeight: 600, color: "#475569" } } }}
                            sx={{ "& .MuiInputBase-input": { fontSize: "0.875rem" } }}
                        />
                        <FormControl size="small" sx={{ minWidth: 128 }}>
                            <InputLabel sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Group By</InputLabel>
                            <Select
                                label="Group By"
                                value={filters.group_by}
                                onChange={(e) => handleFilterChange("group_by", e.target.value)}
                                sx={{ fontSize: "0.875rem" }}
                            >
                                <MenuItem value="day">Day</MenuItem>
                                <MenuItem value="week">Week</MenuItem>
                                <MenuItem value="month">Month</MenuItem>
                                <MenuItem value="year">Year</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography variant="caption" sx={{ color: "#94a3b8", ml: "auto", alignSelf: "center" }}>
                            Last Updated: {analyticsData ? new Date(analyticsData.generated_at).toLocaleString() : '-'}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {analyticsData && (
                <>
                    {/* Overall Stats Cards */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
                            <StatCard title="Total Quotations" value={analyticsData.overall_statistics?.total_quotations} color="blue" />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
                            <StatCard title="Total Value" value={formatCurrency(analyticsData.overall_statistics?.total_value)} color="green" />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
                            <StatCard title="Avg Value" value={formatCurrency(analyticsData.overall_statistics?.average_value)} color="purple" />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
                            <StatCard title="Highest Value" value={formatCurrency(analyticsData.overall_statistics?.highest_value)} color="orange" />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
                            <StatCard title="Lowest Value" value={formatCurrency(analyticsData.overall_statistics?.lowest_value)} color="red" />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        {/* Time Trends Chart */}
                        <Grid size={{ xs: 12, lg: 6 }}>
                            <Card sx={{ borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b", mb: 3 }}>
                                        Sales Trend Over Time
                                    </Typography>
                                    <Box sx={{ height: 320 }}>
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
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Status Breakdown Pie Chart */}
                        <Grid size={{ xs: 12, lg: 6 }}>
                            <Card sx={{ borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b", mb: 3 }}>
                                        Quotation Status Breakdown
                                    </Typography>
                                    <Box sx={{ height: 320 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={analyticsData.status_breakdown}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(2)}%`}
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
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        {/* Top Clients Bar Chart */}
                        <Grid size={{ xs: 12, lg: 6 }}>
                            <Card sx={{ borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b", mb: 3 }}>
                                        Top Clients by Value
                                    </Typography>
                                    <Box sx={{ height: 320 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analyticsData.top_clients} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" tick={{ fontSize: 12 }} />
                                                <YAxis dataKey="client_name" type="category" width={100} tick={{ fontSize: 12 }} />
                                                <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'transparent' }} />
                                                <Bar dataKey="total_value" name="Total Value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Conversion Funnel / Tax Analysis */}
                        <Grid size={{ xs: 12, lg: 6 }}>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <Card sx={{ borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                    <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b", mb: 2 }}>
                                            Conversion Funnel
                                        </Typography>
                                        <Grid container spacing={1}>
                                            <Grid size={3}>
                                                <FunnelStep label="Queries" value={analyticsData.conversion_funnel?.total_queries} bgColor="#f1f5f9" textColor="#475569" />
                                            </Grid>
                                            <Grid size={3}>
                                                <FunnelStep label="Quotations" value={analyticsData.conversion_funnel?.quotations_sent} bgColor="#dbeafe" textColor="#1565C0" />
                                            </Grid>
                                            <Grid size={3}>
                                                <FunnelStep label="Converted" value={analyticsData.conversion_funnel?.converted} bgColor="#dcfce7" textColor="#16a34a" />
                                            </Grid>
                                            <Grid size={3}>
                                                <FunnelStep label="Rejected" value={analyticsData.conversion_funnel?.rejected} bgColor="#fee2e2" textColor="#dc2626" />
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>

                                <Card sx={{ borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                    <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b", mb: 2 }}>
                                            Tax Analysis (Averages)
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={4}>
                                                <Box sx={{ p: 1.5, bgcolor: "#FAFBFC", borderRadius: 2, textAlign: "center" }}>
                                                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                                                        CGST
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b" }}>
                                                        {analyticsData.tax_analysis?.cgst?.avg_percentage}%
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                                        {formatCurrency(analyticsData.tax_analysis?.cgst?.total)} Total
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={4}>
                                                <Box sx={{ p: 1.5, bgcolor: "#FAFBFC", borderRadius: 2, textAlign: "center" }}>
                                                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                                                        SGST
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b" }}>
                                                        {analyticsData.tax_analysis?.sgst?.avg_percentage}%
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                                        {formatCurrency(analyticsData.tax_analysis?.sgst?.total)} Total
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={4}>
                                                <Box sx={{ p: 1.5, bgcolor: "#FAFBFC", borderRadius: 2, textAlign: "center" }}>
                                                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                                                        IGST
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b" }}>
                                                        {analyticsData.tax_analysis?.igst?.avg_percentage}%
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                                        {formatCurrency(analyticsData.tax_analysis?.igst?.total)} Total
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Box>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
};

const StatCard = ({ title, value, color }) => {
    const colorMap = {
        blue: "#1565C0",
        green: "#16a34a",
        purple: "#9333ea",
        orange: "#ea580c",
        red: "#dc2626",
    };

    return (
        <Card sx={{ borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5, display: "block" }}>
                    {title}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colorMap[color] || "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );
};

const FunnelStep = ({ label, value, bgColor, textColor }) => (
    <Box sx={{ p: 1.5, borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: bgColor, color: textColor }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {value}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", opacity: 0.8 }}>
            {label}
        </Typography>
    </Box>
);

const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    });
};

export default SalesStatistics;
