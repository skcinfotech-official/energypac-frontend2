import React, { useState, useEffect } from "react";
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
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Radio,
    RadioGroup,
    FormControlLabel,
    InputAdornment,
    LinearProgress,
    Paper
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PieChartIcon from "@mui/icons-material/PieChart";
import SearchIcon from "@mui/icons-material/Search";
import BarChartIcon from "@mui/icons-material/BarChart";
import CloseIcon from "@mui/icons-material/Close";
import QrCodeIcon from "@mui/icons-material/QrCode";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import TableChartIcon from "@mui/icons-material/TableChart";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";
import {
    getTransportDashboard,
    getTransportCostByPO,
    getTransportCostByVendor,
    getTransportCostBreakdown,
    getTransportLandedCostReport,
    getTransportsReport
} from "../services/transportService";
import AlertToast from "../components/ui/AlertToast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const COLORS = [
    "#4f46e5", "#10b981", "#06b6d4", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6", "#f97316"
];

const EMPTY_SUMMARY = {
    total_freight_cost: 0,
    active_transports_count: 0,
    total_transports_count: 0,
    delivered_transports_count: 0,
    transporter_count: 0
};

const PRIMARY = "#1565C0";
const BG = "#FAFBFC";

export default function TransportDashboard() {
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [downloading, setDownloading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState("all");

    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    const [byPoData, setByPoData] = useState([]);
    const [byVendorData, setByVendorData] = useState([]);
    const [breakdownData, setBreakdownData] = useState([]);
    const [landedCostData, setLandedCostData] = useState([]);
    const [landedCostSearch, setLandedCostSearch] = useState("");
    const [landedCostPage, setLandedCostPage] = useState(1);

    const fetchAllReports = async () => {
        setLoading(true);
        try {
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const [sumRes, poRes, vendorRes, breakdownRes, landedRes] = await Promise.allSettled([
                getTransportDashboard(params),
                getTransportCostByPO(params),
                getTransportCostByVendor(params),
                getTransportCostBreakdown(params),
                getTransportLandedCostReport(params)
            ]);

            if (sumRes.status === "fulfilled" && sumRes.value?.summary) {
                const s = sumRes.value.summary;
                setSummary({
                    total_freight_cost: parseFloat(s.total_cost) || 0,
                    active_transports_count: (parseInt(s.pending) || 0) + (parseInt(s.in_transit) || 0),
                    total_transports_count: parseInt(s.total_entries) || 0,
                    delivered_transports_count: parseInt(s.delivered) || 0,
                    transporter_count: sumRes.value.recent_entries
                        ? new Set(sumRes.value.recent_entries.map(e => e.transporter_name).filter(Boolean)).size
                        : 0
                });
            } else {
                setSummary(EMPTY_SUMMARY);
            }

            if (poRes.status === "fulfilled" && Array.isArray(poRes.value?.purchase_orders)) {
                setByPoData(poRes.value.purchase_orders.map(p => ({
                    po_number: p.po_number || "Direct PI",
                    total_cost: parseFloat(p.grand_total || p.total_transport_cost) || 0
                })));
            } else {
                setByPoData([]);
            }

            if (vendorRes.status === "fulfilled" && Array.isArray(vendorRes.value?.vendors)) {
                setByVendorData(vendorRes.value.vendors.map(v => ({
                    vendor_name: v.vendor_name || "Direct",
                    total_cost: parseFloat(v.total_transport_cost) || 0
                })));
            } else {
                setByVendorData([]);
            }

            if (breakdownRes.status === "fulfilled" && Array.isArray(breakdownRes.value?.breakdown)) {
                setBreakdownData(breakdownRes.value.breakdown.map(b => ({
                    cost_type: b.cost_type,
                    cost_type_display: b.cost_type_display || b.cost_type,
                    total_amount: parseFloat(b.total_amount) || 0
                })));
            } else {
                setBreakdownData([]);
            }

            if (landedRes.status === "fulfilled" && Array.isArray(landedRes.value?.items)) {
                setLandedCostData(landedRes.value.items.map(i => ({
                    item_name: i.product_name || i.item_name,
                    po_number: i.po_number || "Direct",
                    quantity: i.quantity || 0,
                    unit_landed_cost: i.allocated_transport && i.quantity ? (parseFloat(i.allocated_transport) / i.quantity) : 0,
                    total_landed_cost: parseFloat(i.allocated_transport) || 0,
                    purchase_rate: parseFloat(i.purchase_rate) || 0,
                    landed_cost: parseFloat(i.landed_cost) || 0
                })));
            } else {
                setLandedCostData([]);
            }
        } catch (error) {
            console.error("Dashboard fetch failed:", error);
            setSummary(EMPTY_SUMMARY);
            setByPoData([]);
            setByVendorData([]);
            setBreakdownData([]);
            setLandedCostData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllReports();
    }, [startDate, endDate]);

    const formatCurrency = (amount) => {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        });
    };

    const filteredLandedCost = landedCostData.filter(item => {
        const query = landedCostSearch.toLowerCase();
        return (
            (item.item_name || "").toLowerCase().includes(query) ||
            (item.po_number || "").toLowerCase().includes(query)
        );
    });

    const itemsPerPage = 5;
    const paginatedLandedCost = filteredLandedCost.slice(
        (landedCostPage - 1) * itemsPerPage,
        landedCostPage * itemsPerPage
    );
    const totalLandedPages = Math.ceil(filteredLandedCost.length / itemsPerPage);

    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const wb = XLSX.utils.book_new();
            const fileNameDate = `${startDate || 'start'}_to_${endDate || 'end'}`;

            if (reportType === "all") {
                const summarySheetData = [
                    ["LOGISTICS SUMMARY ANALYTICS REPORT"],
                    ["Start Date:", startDate || "All Time"], ["End Date:", endDate || "All Time"],
                    ["Generated At:", new Date().toLocaleString()], [],
                    ["Metric", "Value"],
                    ["Total Freight Cost", summary.total_freight_cost],
                    ["Active Shipments", summary.active_transports_count],
                    ["Delivered Shipments", summary.delivered_transports_count],
                    ["Total Logistics", summary.total_transports_count],
                    ["Active Transporters", summary.transporter_count]
                ];
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summarySheetData), "Summary");

                const poSheet = [["COST BY PURCHASE ORDER"], [], ["PO Number", "Total Cost"]];
                byPoData.forEach(p => poSheet.push([p.po_number, p.total_cost]));
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(poSheet), "Cost by PO");

                const vendorSheet = [["COST BY TRANSPORTER"], [], ["Transporter", "Total Cost"]];
                byVendorData.forEach(v => vendorSheet.push([v.vendor_name, v.total_cost]));
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(vendorSheet), "Cost by Transporter");

                const bkSheet = [["COST BREAKDOWN"], [], ["Type", "Display", "Amount"]];
                breakdownData.forEach(b => bkSheet.push([b.cost_type, b.cost_type_display, b.total_amount]));
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bkSheet), "Breakdown");

                const lcSheet = [["LANDED COSTS"], [], ["Item", "PO", "Qty", "Unit Freight", "Total Freight", "Purchase Rate", "Landed Cost"]];
                landedCostData.forEach(i => lcSheet.push([i.item_name, i.po_number, i.quantity, i.unit_landed_cost, i.total_landed_cost, i.purchase_rate, i.landed_cost]));
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(lcSheet), "Landed Costs");
            } else if (reportType === "raw_transports") {
                const params = {};
                if (startDate) params.start_date = startDate;
                if (endDate) params.end_date = endDate;
                const res = await getTransportsReport(params);
                const data = res.data || res;
                let list = Array.isArray(data) ? data : (data?.results || []);
                const sheet = [["RAW TRANSPORT ENTRIES"], [], ["Transport#", "Transporter", "Vehicle", "Dispatch Date", "Status", "From", "To", "Total Cost"]];
                list.forEach(t => {
                    const cost = t.total_cost ? parseFloat(t.total_cost) : (t.cost_items || []).reduce((s, c) => s + parseFloat(c.amount || 0), 0);
                    sheet.push([t.transport_number, t.transporter_name, t.vehicle_number, t.dispatch_date, t.status, t.dispatch_from, t.dispatch_to, cost]);
                });
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet), "Transports");
            } else {
                let sheetData = [];
                let sheetName = "Report";
                if (reportType === "by_po") {
                    sheetData = [["COST BY PO"], [], ["PO Number", "Total Cost"]];
                    byPoData.forEach(p => sheetData.push([p.po_number, p.total_cost]));
                    sheetName = "Cost by PO";
                } else if (reportType === "by_vendor") {
                    sheetData = [["COST BY TRANSPORTER"], [], ["Transporter", "Total Cost"]];
                    byVendorData.forEach(v => sheetData.push([v.vendor_name, v.total_cost]));
                    sheetName = "Cost by Transporter";
                } else if (reportType === "breakdown") {
                    sheetData = [["COST BREAKDOWN"], [], ["Type", "Display", "Amount"]];
                    breakdownData.forEach(b => sheetData.push([b.cost_type, b.cost_type_display, b.total_amount]));
                    sheetName = "Breakdown";
                } else if (reportType === "landed_cost") {
                    sheetData = [["LANDED COSTS"], [], ["Item", "PO", "Qty", "Unit Freight", "Total Freight", "Purchase Rate", "Landed Cost"]];
                    landedCostData.forEach(i => sheetData.push([i.item_name, i.po_number, i.quantity, i.unit_landed_cost, i.total_landed_cost, i.purchase_rate, i.landed_cost]));
                    sheetName = "Landed Costs";
                }
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetData), sheetName);
            }

            const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `Logistics_Report_${fileNameDate}.xlsx`);
            setShowReportModal(false);
            setAlert({ open: true, type: "success", message: "Report downloaded successfully" });
        } catch (error) {
            console.error("Export failed:", error);
            setAlert({ open: true, type: "error", message: `Export failed: ${error.message}` });
        } finally {
            setDownloading(false);
        }
    };

    const EmptyState = ({ message }) => (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, color: "grey.400" }}>
            <LocalShippingIcon sx={{ fontSize: 28, mb: 1.5, opacity: 0.3 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>{message}</Typography>
        </Box>
    );

    const reportTypeLabels = {
        all: "Full Analytics Report",
        by_po: "Cost by PO",
        by_vendor: "Cost by Transporter",
        breakdown: "Cost Breakdown",
        landed_cost: "Item Landed Cost",
        raw_transports: "Raw Transport Entries"
    };

    return (
        <>
            <Box sx={{ width: "100%", py: 0.5, display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Header */}
                <Card variant="outlined" sx={{ borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <CardContent sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", gap: 2, p: 3, "&:last-child": { pb: 3 } }}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: "grey.800", display: "flex", alignItems: "center", gap: 1.5 }}>
                                <PieChartIcon sx={{ color: PRIMARY }} />
                                Logistics Analytics &amp; Landed Costs
                            </Typography>
                            <Typography variant="body2" sx={{ color: "grey.500", mt: 0.5, fontWeight: 500 }}>
                                Freight expenditures, carrier shares, and item landed costs
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Button
                                variant="contained"
                                startIcon={<TableChartIcon />}
                                onClick={() => setShowReportModal(true)}
                                sx={{
                                    bgcolor: "#2e7d32",
                                    "&:hover": { bgcolor: "#388e3c" },
                                    textTransform: "uppercase",
                                    fontWeight: 800,
                                    fontSize: "0.7rem",
                                    letterSpacing: 2,
                                    borderRadius: 3,
                                    px: 2.5,
                                    py: 1.2
                                }}
                            >
                                Export Excel
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={fetchAllReports}
                                sx={{
                                    textTransform: "uppercase",
                                    fontWeight: 800,
                                    fontSize: "0.7rem",
                                    letterSpacing: 2,
                                    borderRadius: 3,
                                    borderColor: "grey.300",
                                    color: "grey.700",
                                    "&:hover": { bgcolor: "grey.100", borderColor: "grey.400" },
                                    px: 2.5,
                                    py: 1.2
                                }}
                            >
                                Refresh
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* Date Filter */}
                <Card variant="outlined" sx={{ borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <CardContent sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", gap: 2, p: 2, px: 3, "&:last-child": { pb: 2 } }}>
                        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: "grey.500", textTransform: "uppercase", letterSpacing: 2 }}>
                                Filter:
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.500" }}>From</Typography>
                                <TextField
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    size="small"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 3,
                                            bgcolor: BG,
                                            fontSize: "0.75rem",
                                            fontWeight: 700
                                        },
                                        "& .MuiOutlinedInput-input": { py: 0.8, px: 1.5 }
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.500" }}>To</Typography>
                                <TextField
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    size="small"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 3,
                                            bgcolor: BG,
                                            fontSize: "0.75rem",
                                            fontWeight: 700
                                        },
                                        "& .MuiOutlinedInput-input": { py: 0.8, px: 1.5 }
                                    }}
                                />
                            </Box>
                            {(startDate || endDate) && (
                                <Button
                                    size="small"
                                    startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                                    onClick={() => { setStartDate(""); setEndDate(""); }}
                                    sx={{
                                        color: "error.main",
                                        fontWeight: 700,
                                        fontSize: "0.7rem",
                                        textTransform: "uppercase",
                                        "&:hover": { color: "error.dark" }
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </Box>
                    </CardContent>
                </Card>

                {loading ? (
                    <Card variant="outlined" sx={{ borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, py: 12 }}>
                            <CircularProgress size={40} sx={{ color: PRIMARY }} />
                            <Typography variant="caption" sx={{ color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>
                                Loading logistics data...
                            </Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <Grid container spacing={3}>
                            {/* Total Freight */}
                            <Grid size={{ xs: 12, md: 3 }}>
                                <Card variant="outlined" sx={{ borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                                    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2.5, p: 3, "&:last-child": { pb: 3 } }}>
                                        <Avatar sx={{ bgcolor: "#e3f2fd", color: PRIMARY, width: 52, height: 52, borderRadius: 3, border: "1px solid #bbdefb" }}>
                                            <MonetizationOnIcon sx={{ fontSize: 22 }} />
                                        </Avatar>
                                        <Box>
                                            <Typography sx={{ fontSize: "0.625rem", textTransform: "uppercase", fontWeight: 700, color: "grey.400", letterSpacing: 1 }}>
                                                Total Freight
                                            </Typography>
                                            <Typography sx={{ fontSize: "1.15rem", fontWeight: 900, color: "grey.800", lineHeight: 1.2, mt: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {formatCurrency(summary.total_freight_cost)}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            {/* Active Shipments */}
                            <Grid size={{ xs: 12, md: 3 }}>
                                <Card variant="outlined" sx={{ borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                                    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2.5, p: 3, "&:last-child": { pb: 3 } }}>
                                        <Avatar sx={{ bgcolor: "#fff8e1", color: "#f59e0b", width: 52, height: 52, borderRadius: 3, border: "1px solid #ffecb3" }}>
                                            <HourglassEmptyIcon sx={{ fontSize: 22 }} />
                                        </Avatar>
                                        <Box>
                                            <Typography sx={{ fontSize: "0.625rem", textTransform: "uppercase", fontWeight: 700, color: "grey.400", letterSpacing: 1 }}>
                                                Active Shipments
                                            </Typography>
                                            <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: "grey.800", lineHeight: 1.2, mt: 0.5 }}>
                                                {summary.active_transports_count}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            {/* Delivered */}
                            <Grid size={{ xs: 12, md: 3 }}>
                                <Card variant="outlined" sx={{ borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                                    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2.5, p: 3, "&:last-child": { pb: 3 } }}>
                                        <Avatar sx={{ bgcolor: "#e8f5e9", color: "#10b981", width: 52, height: 52, borderRadius: 3, border: "1px solid #c8e6c9" }}>
                                            <EventAvailableIcon sx={{ fontSize: 22 }} />
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontSize: "0.625rem", textTransform: "uppercase", fontWeight: 700, color: "grey.400", letterSpacing: 1 }}>
                                                Delivered
                                            </Typography>
                                            <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: "grey.800", lineHeight: 1.2, mt: 0.5 }}>
                                                {summary.delivered_transports_count}{" "}
                                                <Typography component="span" sx={{ fontSize: "0.75rem", color: "grey.400", fontWeight: 600 }}>
                                                    / {summary.total_transports_count}
                                                </Typography>
                                            </Typography>
                                            {summary.total_transports_count > 0 && (
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={(summary.delivered_transports_count / summary.total_transports_count) * 100}
                                                    sx={{
                                                        mt: 1,
                                                        height: 4,
                                                        borderRadius: 2,
                                                        bgcolor: "grey.100",
                                                        "& .MuiLinearProgress-bar": { bgcolor: "#10b981", borderRadius: 2 }
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            {/* Transporters */}
                            <Grid size={{ xs: 12, md: 3 }}>
                                <Card variant="outlined" sx={{ borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                                    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2.5, p: 3, "&:last-child": { pb: 3 } }}>
                                        <Avatar sx={{ bgcolor: "#ede7f6", color: "#7c3aed", width: 52, height: 52, borderRadius: 3, border: "1px solid #d1c4e9" }}>
                                            <LocalShippingIcon sx={{ fontSize: 22 }} />
                                        </Avatar>
                                        <Box>
                                            <Typography sx={{ fontSize: "0.625rem", textTransform: "uppercase", fontWeight: 700, color: "grey.400", letterSpacing: 1 }}>
                                                Transporters
                                            </Typography>
                                            <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: "grey.800", lineHeight: 1.2, mt: 0.5 }}>
                                                {summary.transporter_count}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Charts */}
                        <Grid container spacing={3}>
                            {/* Pie Chart - Cost Breakdown */}
                            <Grid size={{ xs: 12, lg: 6 }}>
                                <Card variant="outlined" sx={{ borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height: 400 }}>
                                    <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", "&:last-child": { pb: 3 } }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, pb: 1.5, borderBottom: "1px solid", borderColor: "grey.100" }}>
                                            <PieChartIcon sx={{ color: "grey.400", fontSize: 16 }} />
                                            <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", color: "grey.800", letterSpacing: 2 }}>
                                                Cost Breakdown by Type
                                            </Typography>
                                        </Box>
                                        {breakdownData.length > 0 ? (
                                            <Box sx={{ flex: 1, width: "100%" }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="total_amount" nameKey="cost_type_display">
                                                            {breakdownData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip formatter={(val) => formatCurrency(val)} />
                                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </Box>
                                        ) : <EmptyState message="No cost breakdown data" />}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Bar Chart - By Transporter */}
                            <Grid size={{ xs: 12, lg: 6 }}>
                                <Card variant="outlined" sx={{ borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height: 400 }}>
                                    <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", "&:last-child": { pb: 3 } }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, pb: 1.5, borderBottom: "1px solid", borderColor: "grey.100" }}>
                                            <LocalShippingIcon sx={{ color: "grey.400", fontSize: 16 }} />
                                            <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", color: "grey.800", letterSpacing: 2 }}>
                                                Expenditure by Transporter
                                            </Typography>
                                        </Box>
                                        {byVendorData.length > 0 ? (
                                            <Box sx={{ flex: 1, width: "100%" }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={byVendorData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                        <XAxis type="number" tickFormatter={(v) => `₹${v}`} />
                                                        <YAxis dataKey="vendor_name" type="category" width={110} tick={{ fontSize: 10, fontWeight: 700 }} />
                                                        <Tooltip formatter={(val) => formatCurrency(val)} />
                                                        <Bar dataKey="total_cost" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </Box>
                                        ) : <EmptyState message="No transporter data" />}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* PO Cost Chart */}
                        <Card variant="outlined" sx={{ borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height: 350 }}>
                            <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", "&:last-child": { pb: 3 } }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, pb: 1.5, borderBottom: "1px solid", borderColor: "grey.100" }}>
                                    <BarChartIcon sx={{ color: "grey.400", fontSize: 16 }} />
                                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", color: "grey.800", letterSpacing: 2 }}>
                                        Expenses by Purchase Order
                                    </Typography>
                                </Box>
                                {byPoData.length > 0 ? (
                                    <Box sx={{ flex: 1, width: "100%" }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={byPoData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="po_number" tick={{ fontSize: 10, fontWeight: 700 }} />
                                                <YAxis tickFormatter={(v) => `₹${v}`} />
                                                <Tooltip formatter={(val) => formatCurrency(val)} />
                                                <Bar dataKey="total_cost" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={28} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                ) : <EmptyState message="No PO cost data" />}
                            </CardContent>
                        </Card>

                        {/* Landed Cost Table */}
                        <Card variant="outlined" sx={{ borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                            {/* Table Header */}
                            <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid", borderColor: "grey.100", display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", gap: 2, bgcolor: "rgba(248,250,252,0.5)" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Inventory2Icon sx={{ color: "grey.400", fontSize: 16 }} />
                                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", color: "grey.800", letterSpacing: 2 }}>
                                        Item-wise Landed Freight Costs
                                    </Typography>
                                </Box>
                                <TextField
                                    placeholder="Search product or PO..."
                                    value={landedCostSearch}
                                    onChange={(e) => { setLandedCostSearch(e.target.value); setLandedCostPage(1); }}
                                    size="small"
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon sx={{ fontSize: 16, color: "grey.400" }} />
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                    sx={{
                                        width: { xs: "100%", md: 320 },
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 3,
                                            fontSize: "0.75rem",
                                            fontWeight: 500
                                        }
                                    }}
                                />
                            </Box>

                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: BG }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: 1, color: "grey.500", px: 3, py: 1.8 }}>
                                                Product Item
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: 1, color: "grey.500", px: 3, py: 1.8 }}>
                                                Purchase Order
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: 1, color: "grey.500", px: 3, py: 1.8 }}>
                                                Qty
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: 1, color: "grey.500", px: 3, py: 1.8 }}>
                                                Unit Freight
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: 1, color: "grey.500", px: 3, py: 1.8 }}>
                                                Total Freight
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedLandedCost.length > 0 ? (
                                            paginatedLandedCost.map((item, idx) => (
                                                <TableRow key={idx} hover sx={{ "&:hover": { bgcolor: "rgba(248,250,252,0.5)" } }}>
                                                    <TableCell sx={{ px: 3, py: 2, fontWeight: 700, color: "grey.800" }}>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                            <QrCodeIcon sx={{ color: "grey.300", fontSize: 14 }} />
                                                            {item.item_name}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ px: 3, py: 2 }}>
                                                        <Chip
                                                            label={item.po_number}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                fontFamily: "monospace",
                                                                fontSize: "0.7rem",
                                                                fontWeight: 700,
                                                                color: "grey.700",
                                                                borderColor: "grey.300",
                                                                bgcolor: "grey.50",
                                                                borderRadius: 1,
                                                                height: 24
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ px: 3, py: 2, fontWeight: 700, color: "grey.600" }}>
                                                        {item.quantity}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ px: 3, py: 2, fontWeight: 900, color: "grey.700", fontFamily: "monospace", fontSize: "0.75rem" }}>
                                                        {formatCurrency(item.unit_landed_cost)}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ px: 3, py: 2, fontWeight: 900, color: "grey.800", fontFamily: "monospace", fontSize: "0.75rem" }}>
                                                        {formatCurrency(item.total_landed_cost)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} sx={{ textAlign: "center", py: 5, color: "grey.400", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.75rem" }}>
                                                    No landed cost data available
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {totalLandedPages > 1 && (
                                <Box sx={{ px: 3, py: 2, bgcolor: BG, borderTop: "1px solid", borderColor: "grey.200", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Typography variant="caption" sx={{ color: "grey.400", fontWeight: 700, textTransform: "uppercase" }}>
                                        Showing {paginatedLandedCost.length} of {filteredLandedCost.length}
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 1 }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            disabled={landedCostPage === 1}
                                            onClick={() => setLandedCostPage(p => p - 1)}
                                            sx={{
                                                fontSize: "0.625rem",
                                                fontWeight: 900,
                                                borderRadius: 2,
                                                borderColor: "grey.300",
                                                color: "grey.600",
                                                px: 1.5,
                                                py: 0.5,
                                                minWidth: "auto",
                                                "&:hover": { bgcolor: BG },
                                                "&.Mui-disabled": { opacity: 0.4 }
                                            }}
                                        >
                                            PREV
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            disabled={landedCostPage === totalLandedPages}
                                            onClick={() => setLandedCostPage(p => p + 1)}
                                            sx={{
                                                fontSize: "0.625rem",
                                                fontWeight: 900,
                                                borderRadius: 2,
                                                borderColor: "grey.300",
                                                color: "grey.600",
                                                px: 1.5,
                                                py: 0.5,
                                                minWidth: "auto",
                                                "&:hover": { bgcolor: BG },
                                                "&.Mui-disabled": { opacity: 0.4 }
                                            }}
                                        >
                                            NEXT
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Card>
                    </>
                )}
            </Box>

            <AlertToast open={alert.open} type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, open: false })} />

            {/* Export Report Modal */}
            <Dialog
                open={showReportModal}
                onClose={() => setShowReportModal(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: BG, borderBottom: "1px solid", borderColor: "grey.100", py: 2, px: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <TableChartIcon sx={{ color: "#2e7d32" }} />
                        <Typography sx={{ fontWeight: 700, color: "grey.800" }}>Export Report</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setShowReportModal(false)} sx={{ color: "grey.400", "&:hover": { color: "grey.600" } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <RadioGroup value={reportType} onChange={(e) => setReportType(e.target.value)}>
                        {["all", "by_po", "by_vendor", "breakdown", "landed_cost", "raw_transports"].map(type => (
                            <Paper
                                key={type}
                                variant="outlined"
                                sx={{
                                    mb: 1.5,
                                    borderRadius: 2,
                                    cursor: "pointer",
                                    "&:hover": { bgcolor: BG },
                                    transition: "background-color 0.15s",
                                    borderColor: reportType === type ? PRIMARY : "grey.300"
                                }}
                                onClick={() => setReportType(type)}
                            >
                                <FormControlLabel
                                    value={type}
                                    control={<Radio size="small" sx={{ "&.Mui-checked": { color: PRIMARY } }} />}
                                    label={
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: "grey.700" }}>
                                            {reportTypeLabels[type]}
                                        </Typography>
                                    }
                                    sx={{ m: 0, px: 1.5, py: 0.5, width: "100%" }}
                                />
                            </Paper>
                        ))}
                    </RadioGroup>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "grey.100", bgcolor: BG }}>
                    <Button
                        onClick={() => setShowReportModal(false)}
                        sx={{ color: "grey.600", fontWeight: 600, "&:hover": { color: "grey.800" } }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleDownloadReport}
                        disabled={downloading}
                        sx={{
                            bgcolor: "#2e7d32",
                            "&:hover": { bgcolor: "#388e3c" },
                            fontWeight: 600,
                            borderRadius: 2,
                            "&.Mui-disabled": { opacity: 0.5 }
                        }}
                    >
                        {downloading ? "Exporting..." : "Download Excel"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
