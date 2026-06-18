
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
    Avatar,
    Divider,
    Paper,
    ToggleButton,
    ToggleButtonGroup,
    InputAdornment,
} from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { getProductSalesAnalysis } from "../services/salesService";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

// local YYYY-MM-DD (avoids UTC shift from toISOString)
const ymd = (d) => {
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
};
const presetRange = (key) => {
    const now = new Date();
    const end = ymd(now);
    if (key === "all") return { start_date: "2000-01-01", end_date: end };
    if (key === "ytd") return { start_date: `${now.getFullYear()}-01-01`, end_date: end };
    if (key === "m1") return { start_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, end_date: end };
    if (key === "m3") { const d = new Date(now); d.setMonth(d.getMonth() - 3); return { start_date: ymd(d), end_date: end }; }
    return null;
};

const ProductSalesAnalysis = () => {
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    // Default to All Time so existing data always shows (backend default is only last 30 days).
    const [preset, setPreset] = useState("all");
    const [filters, setFilters] = useState(presetRange("all"));

    useEffect(() => {
        fetchAnalysis();
    }, [filters]);

    const applyPreset = (key) => {
        if (!key) return;
        setPreset(key);
        const range = presetRange(key);
        if (range) setFilters(range);
    };

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
        setPreset("custom");
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
                    bgcolor: "#fff",
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
                                <Inventory2OutlinedIcon sx={{ color: "#ed6c02" }} />
                                Product Sales Analysis
                            </Typography>
                            <Typography variant="body2" sx={{ color: "grey.500", mt: 0.5 }}>
                                Insights into product performance and quoting trends.
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<FileDownloadOutlinedIcon />}
                                sx={{
                                    bgcolor: "grey.100",
                                    color: "grey.600",
                                    textTransform: "none",
                                    fontWeight: 500,
                                    fontSize: "0.875rem",
                                    borderRadius: 2,
                                    boxShadow: "none",
                                    "&:hover": {
                                        bgcolor: "grey.200",
                                        boxShadow: "none",
                                    },
                                }}
                            >
                                Export Report
                            </Button>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2, borderColor: "grey.100" }} />

                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: 2,
                            p: 1.5,
                            borderRadius: 3,
                            bgcolor: "grey.50",
                            border: "1px solid",
                            borderColor: "grey.100",
                        }}
                    >
                        {/* Quick presets */}
                        <ToggleButtonGroup
                            size="small"
                            exclusive
                            value={preset}
                            onChange={(_, val) => applyPreset(val)}
                            sx={{
                                bgcolor: "#fff",
                                borderRadius: 2,
                                "& .MuiToggleButton-root": {
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: "0.78rem",
                                    px: 1.6,
                                    py: 0.6,
                                    border: "1px solid",
                                    borderColor: "grey.200",
                                    color: "grey.600",
                                    "&.Mui-selected": {
                                        bgcolor: "#1565C0",
                                        color: "#fff",
                                        "&:hover": { bgcolor: "#0d47a1" },
                                    },
                                },
                            }}
                        >
                            <ToggleButton value="all">All Time</ToggleButton>
                            <ToggleButton value="ytd">This Year</ToggleButton>
                            <ToggleButton value="m3">Last 3 Months</ToggleButton>
                            <ToggleButton value="m1">This Month</ToggleButton>
                        </ToggleButtonGroup>

                        <Divider orientation="vertical" flexItem sx={{ borderColor: "grey.200", display: { xs: "none", sm: "block" } }} />

                        {/* Custom date range */}
                        <TextField
                            type="date"
                            size="small"
                            value={filters.start_date}
                            onChange={(e) => handleFilterChange("start_date", e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CalendarMonthOutlinedIcon sx={{ fontSize: 18, color: "grey.500" }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                bgcolor: "#fff",
                                borderRadius: 2,
                                "& .MuiOutlinedInput-root": { borderRadius: 2 },
                                "& .MuiInputBase-input": { fontSize: "0.82rem", py: 0.9 },
                            }}
                        />
                        <Typography variant="caption" sx={{ color: "grey.500", fontWeight: 600 }}>to</Typography>
                        <TextField
                            type="date"
                            size="small"
                            value={filters.end_date}
                            onChange={(e) => handleFilterChange("end_date", e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CalendarMonthOutlinedIcon sx={{ fontSize: 18, color: "grey.500" }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                bgcolor: "#fff",
                                borderRadius: 2,
                                "& .MuiOutlinedInput-root": { borderRadius: 2 },
                                "& .MuiInputBase-input": { fontSize: "0.82rem", py: 0.9 },
                            }}
                        />

                        <Typography
                            variant="caption"
                            sx={{
                                ml: "auto",
                                color: "grey.400",
                                alignSelf: "center",
                            }}
                        >
                            Report Generated: {analysisData ? new Date(analysisData.generated_at).toLocaleString() : '-'}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {analysisData && (
                <>
                    {/* Summary Cards */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <SummaryCard
                                title="Total Products Quoted"
                                value={analysisData.summary?.total_products}
                                icon={LocalOfferOutlinedIcon}
                                color="blue"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <SummaryCard
                                title="Total Quantity Quoted"
                                value={analysisData.summary?.total_quantity_quoted}
                                icon={Inventory2OutlinedIcon}
                                color="purple"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <SummaryCard
                                title="Total Value Quoted"
                                value={formatCurrency(analysisData.summary?.total_value_quoted)}
                                icon={WarehouseOutlinedIcon}
                                color="green"
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        {/* Top Stock Products Chart */}
                        <Grid item xs={12} lg={6}>
                            <Card
                                sx={{
                                    borderRadius: 4,
                                    border: "1px solid",
                                    borderColor: "grey.200",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                    bgcolor: "#fff",
                                }}
                            >
                                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 700,
                                            color: "grey.800",
                                            mb: 3,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <WarehouseOutlinedIcon sx={{ color: "#1565C0" }} />
                                        Top Stock Products (by Value)
                                    </Typography>
                                    <Box sx={{ height: 320 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analysisData.top_stock_products} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" tick={{ fontSize: 12 }} />
                                                <YAxis dataKey="item_name" type="category" width={120} tick={{ fontSize: 12 }} />
                                                <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'transparent' }} />
                                                <Bar dataKey="total_value" name="Total Value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Top Manual Products Chart */}
                        <Grid item xs={12} lg={6}>
                            <Card
                                sx={{
                                    borderRadius: 4,
                                    border: "1px solid",
                                    borderColor: "grey.200",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                    bgcolor: "#fff",
                                }}
                            >
                                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 700,
                                            color: "grey.800",
                                            mb: 3,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <EditOutlinedIcon sx={{ color: "#7c3aed" }} />
                                        Top Manual Products (by Value)
                                    </Typography>
                                    <Box sx={{ height: 320 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analysisData.top_manual_products} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" tick={{ fontSize: 12 }} />
                                                <YAxis dataKey="item_name" type="category" width={120} tick={{ fontSize: 12 }} />
                                                <RechartsTooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: 'transparent' }} />
                                                <Bar dataKey="total_value" name="Total Value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Detailed Product Table */}
                    <Card
                        sx={{
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: "grey.200",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                            bgcolor: "#fff",
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
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "grey.800" }}>
                                Detailed Product Analysis
                            </Typography>
                            <Typography variant="caption" sx={{ color: "grey.500", fontWeight: 500 }}>
                                Top 50 items
                            </Typography>
                        </Box>
                        <TableContainer>
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead>
                                    <TableRow
                                        sx={{
                                            bgcolor: "grey.100",
                                        }}
                                    >
                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.7rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Item Code
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.7rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Item Name
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.7rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Quotations
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.7rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Total Qty
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.7rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Avg Rate
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.7rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Total Value
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.7rem",
                                                color: "grey.600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                px: 3,
                                                py: 2,
                                            }}
                                        >
                                            Rate Range
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {analysisData.all_products?.length > 0 ? (
                                        analysisData.all_products.map((item, idx) => (
                                            <TableRow
                                                key={idx}
                                                sx={{
                                                    bgcolor: idx % 2 === 0 ? "grey.50" : "#fff",
                                                    "&:hover": { bgcolor: "grey.200" },
                                                    transition: "background-color 0.15s",
                                                }}
                                            >
                                                <TableCell
                                                    sx={{
                                                        px: 3,
                                                        py: 2,
                                                        fontFamily: "monospace",
                                                        fontSize: "0.75rem",
                                                        color: "grey.500",
                                                    }}
                                                >
                                                    {item.item_code}
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        px: 3,
                                                        py: 2,
                                                        fontWeight: 500,
                                                        color: "grey.800",
                                                        fontSize: "0.875rem",
                                                    }}
                                                >
                                                    {item.item_name}
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        px: 3,
                                                        py: 2,
                                                        color: "grey.600",
                                                        fontSize: "0.875rem",
                                                    }}
                                                >
                                                    {item.quotations_count}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        px: 3,
                                                        py: 2,
                                                        color: "grey.600",
                                                        fontSize: "0.875rem",
                                                    }}
                                                >
                                                    {item.total_quantity} {item.unit}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        px: 3,
                                                        py: 2,
                                                        color: "grey.600",
                                                        fontSize: "0.875rem",
                                                    }}
                                                >
                                                    {formatCurrency(item.average_rate)}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        px: 3,
                                                        py: 2,
                                                        fontWeight: 700,
                                                        color: "grey.800",
                                                        fontSize: "0.875rem",
                                                    }}
                                                >
                                                    {formatCurrency(item.total_value)}
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        px: 3,
                                                        py: 2,
                                                        fontSize: "0.75rem",
                                                        color: "grey.500",
                                                    }}
                                                >
                                                    {formatCurrency(item.min_rate)} - {formatCurrency(item.max_rate)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                align="center"
                                                sx={{ px: 3, py: 4, color: "grey.500" }}
                                            >
                                                No product data found for the selected period.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </>
            )}
        </Box>
    );
};

const SummaryCard = ({ title, value, icon: Icon, color }) => {
    const colorMap = {
        blue: { bgcolor: "#e3f2fd", color: "#1565C0" },
        green: { bgcolor: "#e8f5e9", color: "#2e7d32" },
        purple: { bgcolor: "#f3e5f5", color: "#7b1fa2" },
        orange: { bgcolor: "#fff3e0", color: "#e65100" },
    };

    const colorStyle = colorMap[color] || colorMap.blue;

    return (
        <Card
            sx={{
                borderRadius: 4,
                border: "1px solid",
                borderColor: "grey.200",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                bgcolor: "#fff",
            }}
        >
            <CardContent
                sx={{
                    p: 3,
                    "&:last-child": { pb: 3 },
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                <Avatar
                    sx={{
                        bgcolor: colorStyle.bgcolor,
                        color: colorStyle.color,
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                    }}
                    variant="rounded"
                >
                    <Icon sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                    <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "grey.500" }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "grey.800" }}
                    >
                        {value}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ProductSalesAnalysis;
