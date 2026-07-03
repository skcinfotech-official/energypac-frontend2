
import { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Chip,
    Divider,
    Paper,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import GroupIcon from "@mui/icons-material/Group";
import { getSalesPerformanceReport } from "../services/salesService";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from "recharts";

const SalesPerformance = () => {
    const [performanceData, setPerformanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    // Default to All Time so existing data always shows (backend default is only last 30 days).
    const [filters, setFilters] = useState(() => {
        const d = new Date();
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return { start_date: "2000-01-01", end_date: local.toISOString().slice(0, 10) };
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
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    // Formatter for Currency
    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        });
    };

    if (loading && !performanceData) {
        return (
            <Box
                sx={{
                    display: "flex",
                    height: "100vh",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress size={40} sx={{ color: "#1565C0" }} />
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header & Filters */}
            <Card
                sx={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "grey.200",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
            >
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "column", md: "row" },
                            justifyContent: "space-between",
                            alignItems: { xs: "flex-start", md: "center" },
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    color: "grey.800",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <EmojiEventsIcon sx={{ color: "#f59e0b" }} />
                                Sales Performance Report
                            </Typography>
                            <Typography variant="body2" sx={{ color: "grey.500", mt: 0.5 }}>
                                Detailed breakdown of team and individual performance.
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<FileDownloadIcon />}
                                sx={{
                                    backgroundColor: "grey.100",
                                    color: "grey.600",
                                    textTransform: "none",
                                    fontWeight: 500,
                                    fontSize: "0.875rem",
                                    boxShadow: "none",
                                    borderRadius: 2,
                                    "&:hover": {
                                        backgroundColor: "grey.200",
                                        boxShadow: "none",
                                    },
                                }}
                            >
                                Export PDF
                            </Button>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2, borderColor: "grey.100" }} />

                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "flex-end",
                            gap: 2,
                        }}
                    >
                        <TextField
                            label="Start Date"
                            type="date"
                            size="small"
                            value={filters.start_date}
                            onChange={(e) => handleFilterChange("start_date", e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ minWidth: 160 }}
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            size="small"
                            value={filters.end_date}
                            onChange={(e) => handleFilterChange("end_date", e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ minWidth: 160 }}
                        />
                        <Typography
                            variant="caption"
                            sx={{
                                color: "grey.400",
                                ml: "auto",
                                alignSelf: "center",
                            }}
                        >
                            Report Generated:{" "}
                            {performanceData
                                ? new Date(performanceData.generated_at).toLocaleString()
                                : "-"}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {performanceData && (
                <>
                    {/* Overall Metrics */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                            <MetricCard
                                title="Total Queries"
                                value={performanceData.overall_metrics?.total_queries}
                                subtitle="Inbound leads"
                                color="blue"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                            <MetricCard
                                title="Total Quotations"
                                value={performanceData.overall_metrics?.total_quotations}
                                subtitle="Proposals sent"
                                color="purple"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                            <MetricCard
                                title="Win Rate"
                                value={`${performanceData.overall_metrics?.win_rate}%`}
                                subtitle={`${performanceData.overall_metrics?.total_won} Won / ${performanceData.overall_metrics?.total_lost} Lost`}
                                color="green"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                            <MetricCard
                                title="Avg Response Time"
                                value={`${performanceData.overall_metrics?.average_response_time_days} Days`}
                                subtitle="Speed to quote"
                                color="orange"
                            />
                        </Grid>
                    </Grid>

                    {/* User Performance Table */}
                    <Card
                        sx={{
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: "grey.200",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                borderBottom: "1px solid",
                                borderColor: "grey.100",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 700,
                                    color: "grey.800",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <GroupIcon sx={{ color: "#1565C0" }} />
                                Sales Representative Performance
                            </Typography>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow
                                        sx={{
                                            backgroundColor: "grey.100",
                                        }}
                                    >
                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.75rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                py: 2,
                                            }}
                                        >
                                            Sales Rep
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.75rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                py: 2,
                                            }}
                                        >
                                            Quotations
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.75rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                py: 2,
                                            }}
                                        >
                                            Total Value
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.75rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                py: 2,
                                            }}
                                        >
                                            Avg Value
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.75rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                py: 2,
                                            }}
                                        >
                                            Accepted
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.75rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                py: 2,
                                            }}
                                        >
                                            Rejected
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.75rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                py: 2,
                                            }}
                                        >
                                            Conversion Rate
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {performanceData.user_performance?.length > 0 ? (
                                        performanceData.user_performance.map((user, index) => (
                                            <TableRow
                                                key={user.user_id}
                                                sx={{
                                                    backgroundColor:
                                                        index % 2 === 0 ? "grey.50" : "white",
                                                    "&:hover": {
                                                        backgroundColor: "grey.200",
                                                    },
                                                    transition: "background-color 0.15s",
                                                }}
                                            >
                                                <TableCell
                                                    sx={{
                                                        fontWeight: 500,
                                                        color: "grey.800",
                                                    }}
                                                >
                                                    {user.user_name}
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{ color: "grey.600" }}
                                                >
                                                    {user.quotations_count}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        fontWeight: 500,
                                                        color: "grey.800",
                                                    }}
                                                >
                                                    {formatCurrency(user.total_value)}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{ color: "grey.600" }}
                                                >
                                                    {formatCurrency(user.average_value)}
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        color: "success.main",
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {user.accepted_count}
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        color: "error.main",
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {user.rejected_count}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={`${user.acceptance_rate}%`}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: "0.75rem",
                                                            ...(user.acceptance_rate >= 50
                                                                ? {
                                                                      backgroundColor: "#dcfce7",
                                                                      color: "#15803d",
                                                                  }
                                                                : user.acceptance_rate >= 30
                                                                  ? {
                                                                        backgroundColor: "#fef9c3",
                                                                        color: "#a16207",
                                                                    }
                                                                  : {
                                                                        backgroundColor: "#fee2e2",
                                                                        color: "#b91c1c",
                                                                    }),
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                align="center"
                                                sx={{
                                                    py: 4,
                                                    color: "grey.500",
                                                }}
                                            >
                                                No performance data found for the selected period.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>

                    {/* Performance Comparison Chart */}
                    <Card
                        sx={{
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: "grey.200",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                            p: 3,
                        }}
                    >
                        <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700, color: "grey.800", mb: 3 }}
                        >
                            Individual Performance Comparison
                        </Typography>
                        <Box sx={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={performanceData.user_performance}
                                    barSize={40}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="user_name"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        orientation="left"
                                        stroke="#3b82f6"
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        stroke="#10b981"
                                    />
                                    <RechartsTooltip
                                        formatter={(value, name) => [
                                            name === "Total Value"
                                                ? formatCurrency(value)
                                                : value,
                                            name,
                                        ]}
                                    />
                                    <Legend />
                                    <Bar
                                        yAxisId="left"
                                        dataKey="total_value"
                                        name="Total Value"
                                        fill="#3b82f6"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        yAxisId="right"
                                        dataKey="quotations_count"
                                        name="Quotations Sent"
                                        fill="#10b981"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>
                </>
            )}
        </Box>
    );
};

const MetricCard = ({ title, value, subtitle, color }) => {
    const colorMap = {
        blue: { text: "#1565C0", bg: "#eff6ff", border: "#dbeafe" },
        green: { text: "#16a34a", bg: "#f0fdf4", border: "#dcfce7" },
        purple: { text: "#9333ea", bg: "#faf5ff", border: "#f3e8ff" },
        orange: { text: "#ea580c", bg: "#fff7ed", border: "#ffedd5" },
    };

    const colors = colorMap[color] || colorMap.blue;

    return (
        <Card
            sx={{
                p: 2.5,
                borderRadius: 4,
                border: "1px solid",
                borderColor: colors.border,
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
        >
            <Typography
                variant="caption"
                sx={{
                    fontWeight: 700,
                    color: "grey.400",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    mb: 1,
                    display: "block",
                }}
            >
                {title}
            </Typography>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: colors.text,
                    }}
                >
                    {value}
                </Typography>
                <Chip
                    label={subtitle}
                    size="small"
                    sx={{
                        fontWeight: 700,
                        fontSize: "0.625rem",
                        textTransform: "uppercase",
                        color: colors.text,
                        backgroundColor: colors.bg,
                        borderRadius: 2,
                        height: 24,
                    }}
                />
            </Box>
        </Card>
    );
};

export default SalesPerformance;
