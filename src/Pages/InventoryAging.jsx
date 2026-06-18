import React, { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Chip,
    Grid,
} from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory2";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DangerousIcon from "@mui/icons-material/Dangerous";
import SyncIcon from "@mui/icons-material/Sync";
import { getInventoryAging } from "../services/financeService";

export default function InventoryAging() {
    const [data, setData] = useState({ slow_moving: { count: 0, items: [] }, dead_stock: { count: 0, items: [] } });
    const [loading, setLoading] = useState(true);
    const [threshold, setThreshold] = useState(90);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getInventoryAging({ threshold_days: threshold });
            setData(res);
        } catch (err) {
            console.error("Failed to load aging data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [threshold]);

    const formatDate = (d) => d || "-";

    const getDaysUnsoldChip = (daysUnsold) => {
        if (daysUnsold === null) {
            return (
                <Chip
                    label="Never sold"
                    size="small"
                    sx={{
                        fontSize: "10px",
                        fontWeight: 900,
                        bgcolor: "#F8FAFC",
                        color: "#475569",
                        border: "1px solid #E2E8F0",
                    }}
                />
            );
        }
        if (daysUnsold > threshold * 2) {
            return (
                <Chip
                    label={`${daysUnsold} days`}
                    size="small"
                    sx={{
                        fontSize: "10px",
                        fontWeight: 900,
                        bgcolor: "#FEF2F2",
                        color: "#B91C1C",
                        border: "1px solid #FECACA",
                    }}
                />
            );
        }
        if (daysUnsold > threshold) {
            return (
                <Chip
                    label={`${daysUnsold} days`}
                    size="small"
                    sx={{
                        fontSize: "10px",
                        fontWeight: 900,
                        bgcolor: "#FFFBEB",
                        color: "#B45309",
                        border: "1px solid #FDE68A",
                    }}
                />
            );
        }
        return (
            <Chip
                label={`${daysUnsold} days`}
                size="small"
                sx={{
                    fontSize: "10px",
                    fontWeight: 900,
                    bgcolor: "#F8FAFC",
                    color: "#475569",
                    border: "1px solid #E2E8F0",
                }}
            />
        );
    };

    const StockTable = ({ title, icon, items, headerBgColor, headerTextColor }) => (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 4,
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                overflow: "hidden",
            }}
        >
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    borderBottom: "1px solid #F1F5F9",
                    bgcolor: headerBgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Typography
                    sx={{
                        fontSize: "0.75rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: headerTextColor,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    {icon} {title}
                </Typography>
                <Chip
                    label={`${items.length} items`}
                    size="small"
                    sx={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        bgcolor: "rgba(255,255,255,0.8)",
                        color: headerTextColor,
                    }}
                />
            </Box>
            {items.length > 0 ? (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                <TableCell
                                    sx={{
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        color: "#64748B",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        px: 2.5,
                                        py: 1.5,
                                        borderBottom: "1px solid #E2E8F0",
                                    }}
                                >
                                    Product
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        color: "#64748B",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        px: 2.5,
                                        py: 1.5,
                                        borderBottom: "1px solid #E2E8F0",
                                    }}
                                >
                                    Stock
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        color: "#64748B",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        px: 2.5,
                                        py: 1.5,
                                        borderBottom: "1px solid #E2E8F0",
                                    }}
                                >
                                    Unit
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        color: "#64748B",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        px: 2.5,
                                        py: 1.5,
                                        borderBottom: "1px solid #E2E8F0",
                                    }}
                                >
                                    Last Purchase
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        color: "#64748B",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        px: 2.5,
                                        py: 1.5,
                                        borderBottom: "1px solid #E2E8F0",
                                    }}
                                >
                                    Last Sale
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        color: "#64748B",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        px: 2.5,
                                        py: 1.5,
                                        borderBottom: "1px solid #E2E8F0",
                                    }}
                                >
                                    Days Unsold
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item, i) => (
                                <TableRow
                                    key={i}
                                    sx={{
                                        "&:hover": { bgcolor: "#F8FAFC" },
                                        transition: "background-color 0.15s",
                                    }}
                                >
                                    <TableCell sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid #F1F5F9" }}>
                                        <Typography sx={{ fontWeight: 700, color: "#1E293B", fontSize: "0.875rem" }}>
                                            {item.item_name}
                                        </Typography>
                                        <Typography sx={{ fontSize: "10px", color: "#94A3B8", fontFamily: "monospace" }}>
                                            {item.item_code}
                                        </Typography>
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            px: 2.5,
                                            py: 1.5,
                                            fontWeight: 900,
                                            color: "#334155",
                                            borderBottom: "1px solid #F1F5F9",
                                        }}
                                    >
                                        {item.current_stock}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            px: 2.5,
                                            py: 1.5,
                                            fontSize: "0.75rem",
                                            color: "#64748B",
                                            fontWeight: 700,
                                            borderBottom: "1px solid #F1F5F9",
                                        }}
                                    >
                                        {item.unit}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            px: 2.5,
                                            py: 1.5,
                                            fontSize: "0.75rem",
                                            color: "#64748B",
                                            borderBottom: "1px solid #F1F5F9",
                                        }}
                                    >
                                        {formatDate(item.last_purchase_date)}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            px: 2.5,
                                            py: 1.5,
                                            fontSize: "0.75rem",
                                            color: "#64748B",
                                            borderBottom: "1px solid #F1F5F9",
                                        }}
                                    >
                                        {formatDate(item.last_sale_date)}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid #F1F5F9" }}
                                    >
                                        {getDaysUnsoldChip(item.days_unsold)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Box sx={{ py: 8, textAlign: "center" }}>
                    <Typography
                        sx={{
                            color: "#94A3B8",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            fontSize: "0.75rem",
                            letterSpacing: "0.1em",
                        }}
                    >
                        No items in this category
                    </Typography>
                </Box>
            )}
        </Card>
    );

    return (
        <Box sx={{ maxWidth: 1280, mx: "auto", py: 0.5, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header */}
            <Card
                variant="outlined"
                sx={{
                    borderRadius: 4,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                }}
            >
                <CardContent
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        alignItems: { md: "center" },
                        justifyContent: "space-between",
                        gap: 2,
                        p: 3,
                        "&:last-child": { pb: 3 },
                    }}
                >
                    <Box>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                color: "#1E293B",
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                            }}
                        >
                            <InventoryIcon sx={{ color: "#D97706" }} /> Inventory Aging & Dead Stock
                        </Typography>
                        <Typography sx={{ color: "#64748B", mt: 0.5, fontWeight: 500 }}>
                            Identify slow-moving and dead stock items
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel
                                sx={{
                                    fontSize: "0.75rem",
                                    fontWeight: 900,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                Threshold
                            </InputLabel>
                            <Select
                                value={threshold}
                                label="Threshold"
                                onChange={(e) => setThreshold(Number(e.target.value))}
                                sx={{
                                    bgcolor: "#F8FAFC",
                                    borderRadius: 3,
                                    fontSize: "0.875rem",
                                    fontWeight: 700,
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "#E2E8F0",
                                    },
                                }}
                            >
                                <MenuItem value={30}>30 Days</MenuItem>
                                <MenuItem value={60}>60 Days</MenuItem>
                                <MenuItem value={90}>90 Days</MenuItem>
                                <MenuItem value={180}>180 Days</MenuItem>
                                <MenuItem value={365}>1 Year</MenuItem>
                            </Select>
                        </FormControl>
                        <IconButton
                            onClick={fetchData}
                            sx={{
                                bgcolor: "#F1F5F9",
                                borderRadius: 3,
                                "&:hover": { bgcolor: "#E2E8F0" },
                                transition: "all 0.15s",
                            }}
                        >
                            <SyncIcon sx={{ fontSize: 18, color: "#475569" }} />
                        </IconButton>
                    </Box>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <Card
                        variant="outlined"
                        sx={{
                            borderRadius: 4,
                            bgcolor: "#FFFBEB",
                            border: "1px solid #FEF3C7",
                            boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                        }}
                    >
                        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                            <Typography
                                sx={{
                                    fontSize: "10px",
                                    color: "#D97706",
                                    textTransform: "uppercase",
                                    fontWeight: 900,
                                    letterSpacing: "0.05em",
                                    mb: 0.5,
                                }}
                            >
                                Slow Moving ({threshold}+ days)
                            </Typography>
                            <Typography sx={{ fontSize: "1.875rem", fontWeight: 900, color: "#B45309" }}>
                                {data.slow_moving?.count || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Card
                        variant="outlined"
                        sx={{
                            borderRadius: 4,
                            bgcolor: "#FEF2F2",
                            border: "1px solid #FEE2E2",
                            boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                        }}
                    >
                        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                            <Typography
                                sx={{
                                    fontSize: "10px",
                                    color: "#DC2626",
                                    textTransform: "uppercase",
                                    fontWeight: 900,
                                    letterSpacing: "0.05em",
                                    mb: 0.5,
                                }}
                            >
                                Dead Stock ({threshold * 2}+ days)
                            </Typography>
                            <Typography sx={{ fontSize: "1.875rem", fontWeight: 900, color: "#B91C1C" }}>
                                {data.dead_stock?.count || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Loading / Tables */}
            {loading ? (
                <Card
                    variant="outlined"
                    sx={{
                        borderRadius: 4,
                        border: "1px solid #E2E8F0",
                        p: 10,
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <CircularProgress size={40} sx={{ color: "#1565C0" }} />
                </Card>
            ) : (
                <>
                    <StockTable
                        title="Slow Moving Stock"
                        icon={<WarningAmberIcon sx={{ color: "#F59E0B", fontSize: 18 }} />}
                        items={data.slow_moving?.items || []}
                        headerBgColor="#FFFBEB"
                        headerTextColor="#92400E"
                    />
                    <StockTable
                        title="Dead Stock"
                        icon={<DangerousIcon sx={{ color: "#EF4444", fontSize: 18 }} />}
                        items={data.dead_stock?.items || []}
                        headerBgColor="#FEF2F2"
                        headerTextColor="#991B1B"
                    />
                </>
            )}
        </Box>
    );
}
