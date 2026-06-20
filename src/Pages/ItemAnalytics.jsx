import React, { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    CircularProgress,
    Chip,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from "@mui/material";
import {
    Inventory2 as BoxIcon,
    Search as SearchIcon,
    ShoppingCart as ShoppingCartIcon,
    Store as StoreIcon,
    Warning as WarningIcon,
    Visibility as EyeIcon,
    Close as CloseIcon,
    ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { getItemAnalytics } from "../services/financeService";
import { getProductTracking } from "../services/productService";

export default function ItemAnalytics() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [trackingModal, setTrackingModal] = useState({ open: false, data: null, loading: false });

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const data = await getItemAnalytics();
                setItems(data.items || []);
            } catch (err) {
                console.error("Failed to load item analytics:", err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const openTracking = async (productId) => {
        setTrackingModal({ open: true, data: null, loading: true });
        try {
            const res = await getProductTracking(productId);
            setTrackingModal({ open: true, data: res.data, loading: false });
        } catch {
            setTrackingModal({ open: true, data: null, loading: false });
        }
    };

    const closeTracking = () => setTrackingModal({ open: false, data: null, loading: false });

    const filtered = items.filter(item => {
        const q = search.toLowerCase();
        const matchSearch = item.item_name?.toLowerCase().includes(q) || item.item_code?.toLowerCase().includes(q);
        if (filter === "purchased_not_sold") return matchSearch && item.purchased_not_sold;
        if (filter === "sold_not_purchased") return matchSearch && item.sold_not_purchased;
        if (filter === "in_stock") return matchSearch && item.current_stock > 0;
        return matchSearch;
    });

    const totalPurchased = items.reduce((s, i) => s + i.total_qty_purchased, 0);
    const totalSold = items.reduce((s, i) => s + i.total_qty_sold, 0);
    const purchasedNotSold = items.filter(i => i.purchased_not_sold).length;

    const fmt = (v, c = "INR") => {
        const sym = c === "USD" ? "$" : "₹";
        return `${sym}${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <>
            <Box sx={{ width: "100%", py: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Header */}
                <Card variant="outlined" sx={{ borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, justifyContent: "space-between", gap: 2 }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 1.5, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                                    <BoxIcon sx={{ color: "#1565C0" }} /> Item Analytics
                                </Typography>
                                <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5, fontWeight: 500 }}>
                                    Product-wise purchase, sale & lifecycle tracking
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <Card variant="outlined" sx={{ borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                                <Typography sx={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 900, letterSpacing: "0.05em", mb: 0.5 }}>
                                    Total Qty Purchased
                                </Typography>
                                <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: "#1e293b" }}>
                                    {totalPurchased.toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card variant="outlined" sx={{ borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                                <Typography sx={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 900, letterSpacing: "0.05em", mb: 0.5 }}>
                                    Total Qty Sold
                                </Typography>
                                <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: "#1e293b" }}>
                                    {totalSold.toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card variant="outlined" sx={{ borderRadius: 4, border: "1px solid #fde68a", bgcolor: "#fffbeb", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                                <Typography sx={{ fontSize: "10px", color: "#d97706", textTransform: "uppercase", fontWeight: 900, letterSpacing: "0.05em", mb: 0.5 }}>
                                    Purchased but Not Sold
                                </Typography>
                                <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: "#b45309" }}>
                                    {purchasedNotSold} items
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Search & Filter */}
                <Card variant="outlined" sx={{ borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search item name or code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                flex: 1,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 3,
                                    bgcolor: "#f8fafc",
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                },
                            }}
                        />
                        <FormControl size="small" sx={{ minWidth: 220 }}>
                            <Select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                sx={{
                                    borderRadius: 3,
                                    bgcolor: "#f8fafc",
                                    fontSize: "0.875rem",
                                    fontWeight: 700,
                                    color: "#334155",
                                }}
                            >
                                <MenuItem value="all">All Items</MenuItem>
                                <MenuItem value="purchased_not_sold">Purchased but Not Sold</MenuItem>
                                <MenuItem value="sold_not_purchased">Sold but Not Purchased</MenuItem>
                                <MenuItem value="in_stock">In Stock</MenuItem>
                            </Select>
                        </FormControl>
                    </CardContent>
                </Card>

                {/* Main Table */}
                <Card variant="outlined" sx={{ borderRadius: 4, border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                    <TableContainer>
                        <Table sx={{ minWidth: 900 }} size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                    <TableCell sx={thStyle} align="left">Product</TableCell>
                                    <TableCell sx={thStyle} align="center">Stock</TableCell>
                                    <TableCell sx={thStyle} align="center">
                                        <ShoppingCartIcon sx={{ fontSize: 10, mr: 0.5, verticalAlign: "middle" }} />Purchased
                                    </TableCell>
                                    <TableCell sx={thStyle} align="right">Qty Bought</TableCell>
                                    <TableCell sx={thStyle} align="center">
                                        <StoreIcon sx={{ fontSize: 10, mr: 0.5, verticalAlign: "middle" }} />Sold
                                    </TableCell>
                                    <TableCell sx={thStyle} align="right">Qty Sold</TableCell>
                                    <TableCell sx={thStyle} align="center">Last Buy</TableCell>
                                    <TableCell sx={thStyle} align="center">Last Sale</TableCell>
                                    <TableCell sx={thStyle} align="center">Status</TableCell>
                                    <TableCell sx={thStyle} align="center">Track</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                                            <CircularProgress size={28} sx={{ color: "#1565C0" }} />
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length > 0 ? filtered.map((item, i) => (
                                    <TableRow
                                        key={i}
                                        hover
                                        sx={{
                                            "&:hover .track-btn": { opacity: 1 },
                                            "& td": { borderBottom: "1px solid #f1f5f9" },
                                        }}
                                    >
                                        <TableCell sx={{ px: 2, py: 1.5 }}>
                                            <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.875rem" }}>{item.item_name}</Typography>
                                            <Typography sx={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" }}>{item.item_code} · {item.unit}</Typography>
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: "#334155", fontSize: "0.875rem" }}>{item.current_stock}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: "#1565C0", fontSize: "0.875rem" }}>{item.total_times_purchased}</TableCell>
                                        <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#334155", fontSize: "0.875rem" }}>{item.total_qty_purchased}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: "#059669", fontSize: "0.875rem" }}>{item.total_times_sold}</TableCell>
                                        <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#334155", fontSize: "0.875rem" }}>{item.total_qty_sold}</TableCell>
                                        <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#64748b" }}>{item.last_purchase_date || "-"}</TableCell>
                                        <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#64748b" }}>{item.last_sale_date || "-"}</TableCell>
                                        <TableCell align="center">
                                            {item.purchased_not_sold ? (
                                                <Chip
                                                    icon={<WarningIcon sx={{ fontSize: "10px !important" }} />}
                                                    label="Unsold"
                                                    size="small"
                                                    sx={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", bgcolor: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", height: 22, "& .MuiChip-icon": { color: "#b45309" } }}
                                                />
                                            ) : item.sold_not_purchased ? (
                                                <Chip
                                                    label="No PO"
                                                    size="small"
                                                    sx={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", bgcolor: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", height: 22 }}
                                                />
                                            ) : item.total_times_sold > 0 ? (
                                                <Chip
                                                    label="Active"
                                                    size="small"
                                                    sx={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", bgcolor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", height: 22 }}
                                                />
                                            ) : (
                                                <Chip
                                                    label="New"
                                                    size="small"
                                                    sx={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", bgcolor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", height: 22 }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            {(item.total_times_purchased > 0 || item.total_times_sold > 0) && (
                                                <Tooltip title="View Full Tracking">
                                                    <IconButton
                                                        className="track-btn"
                                                        onClick={() => openTracking(item.product_id)}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: "#f1f5f9",
                                                            color: "#64748b",
                                                            opacity: 0.6,
                                                            "&:hover": { bgcolor: "#1565C0", color: "#fff" },
                                                            transition: "all 0.2s",
                                                        }}
                                                    >
                                                        <EyeIcon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                                            <Typography sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.1em" }}>
                                                No items found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            </Box>

            {/* Tracking Modal */}
            <Dialog
                open={trackingModal.open}
                onClose={closeTracking}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        maxHeight: "90vh",
                        overflow: "hidden",
                    },
                }}
                BackdropProps={{
                    sx: { bgcolor: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" },
                }}
            >
                {/* Header */}
                <DialogTitle
                    sx={{
                        bgcolor: "#0f172a",
                        color: "#fff",
                        px: 2.5,
                        py: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            sx={{
                                fontSize: { xs: "0.875rem", sm: "1rem" },
                                fontWeight: 900,
                                textTransform: "uppercase",
                                letterSpacing: "-0.01em",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Product Lifecycle — {trackingModal.data?.product?.item_name || "Loading..."}
                        </Typography>
                        {trackingModal.data?.product && (
                            <Typography sx={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, mt: 0.25 }}>
                                {trackingModal.data.product.item_code} · {trackingModal.data.product.unit} · Stock: {trackingModal.data.product.current_stock}
                            </Typography>
                        )}
                    </Box>
                    <IconButton onClick={closeTracking} sx={{ color: "#fff", ml: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0, overflow: "auto" }}>
                    {trackingModal.loading ? (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 8 }}>
                            <CircularProgress size={28} sx={{ color: "#1565C0" }} />
                        </Box>
                    ) : trackingModal.data ? (
                        <>
                            {/* Purchase History */}
                            <Box sx={{ borderBottom: "1px solid #e2e8f0" }}>
                                <Box sx={{ bgcolor: "#eff6ff", px: 2.5, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 1 }}>
                                        <ShoppingCartIcon sx={{ fontSize: 14 }} /> Purchase History ({trackingModal.data.total_purchases})
                                    </Typography>
                                </Box>
                                {trackingModal.data.purchases.length > 0 ? (
                                    <TableContainer>
                                        <Table sx={{ minWidth: 650 }} size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                                    <TableCell sx={modalThStyle} align="left">Requisition</TableCell>
                                                    <TableCell sx={modalThStyle} align="left">PO Number</TableCell>
                                                    <TableCell sx={modalThStyle} align="left">Vendor</TableCell>
                                                    <TableCell sx={modalThStyle} align="center">Date</TableCell>
                                                    <TableCell sx={modalThStyle} align="right">Qty</TableCell>
                                                    <TableCell sx={modalThStyle} align="right">Rate</TableCell>
                                                    <TableCell sx={modalThStyle} align="right">Amount</TableCell>
                                                    <TableCell sx={modalThStyle} align="right">INR Value</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {trackingModal.data.purchases.map((p, i) => (
                                                    <TableRow key={i} hover sx={{ "& td": { borderBottom: "1px solid #f1f5f9" } }}>
                                                        <TableCell sx={{ px: 2, py: 1.25 }}>
                                                            <Chip
                                                                label={p.requisition_number}
                                                                size="small"
                                                                sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontSize: "10px", height: 22 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ px: 2, py: 1.25 }}>
                                                            <Typography sx={{ fontFamily: "monospace", fontWeight: 700, color: "#334155", fontSize: "10px" }}>{p.po_number}</Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ px: 2, py: 1.25, fontWeight: 700, color: "#334155", fontSize: "0.75rem" }}>{p.vendor_name}</TableCell>
                                                        <TableCell align="center" sx={{ px: 2, py: 1.25, color: "#64748b", fontSize: "0.75rem" }}>{p.po_date}</TableCell>
                                                        <TableCell align="right" sx={{ px: 2, py: 1.25, fontFamily: "monospace", fontWeight: 700, fontSize: "0.75rem" }}>{p.quantity}</TableCell>
                                                        <TableCell align="right" sx={{ px: 2, py: 1.25, fontFamily: "monospace", fontSize: "0.75rem" }}>{fmt(p.rate, p.currency)}</TableCell>
                                                        <TableCell align="right" sx={{ px: 2, py: 1.25 }}>
                                                            <Typography sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.75rem" }}>
                                                                {fmt(p.amount, p.currency)}
                                                            </Typography>
                                                            {p.currency !== 'INR' && (
                                                                <Typography sx={{ fontSize: "9px", color: "#94a3b8", mt: 0.25 }}>@{p.conversion_rate}</Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ px: 2, py: 1.25, fontFamily: "monospace", fontWeight: 700, color: "#1e293b", fontSize: "0.75rem" }}>
                                                            {fmt(p.amount_inr, 'INR')}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ px: 2.5, py: 4, textAlign: "center" }}>
                                        <Typography sx={{ color: "#94a3b8", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                            No purchase records
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Flow Arrow */}
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 1, bgcolor: "#f8fafc" }}>
                                <ArrowForwardIcon sx={{ color: "#cbd5e1" }} />
                            </Box>

                            {/* Sale History */}
                            <Box>
                                <Box sx={{ bgcolor: "#ecfdf5", px: 2.5, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 900, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 1 }}>
                                        <StoreIcon sx={{ fontSize: 14 }} /> Sale History ({trackingModal.data.total_sales})
                                    </Typography>
                                </Box>
                                {trackingModal.data.sales.length > 0 ? (
                                    <TableContainer>
                                        <Table sx={{ minWidth: 600 }} size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                                    <TableCell sx={modalThStyle} align="left">Requisition</TableCell>
                                                    <TableCell sx={modalThStyle} align="left">PI Number</TableCell>
                                                    <TableCell sx={modalThStyle} align="center">Date</TableCell>
                                                    <TableCell sx={modalThStyle} align="center">Status</TableCell>
                                                    <TableCell sx={modalThStyle} align="right">Qty</TableCell>
                                                    <TableCell sx={modalThStyle} align="right">Unit Price</TableCell>
                                                    <TableCell sx={modalThStyle} align="right">Amount</TableCell>
                                                    <TableCell sx={modalThStyle} align="right">INR Value</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {trackingModal.data.sales.map((s, i) => (
                                                    <TableRow key={i} hover sx={{ "& td": { borderBottom: "1px solid #f1f5f9" } }}>
                                                        <TableCell sx={{ px: 2, py: 1.25 }}>
                                                            <Chip
                                                                label={s.requisition_number}
                                                                size="small"
                                                                sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontSize: "10px", height: 22 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ px: 2, py: 1.25 }}>
                                                            <Typography sx={{ fontFamily: "monospace", fontWeight: 700, color: "#047857", fontSize: "10px" }}>{s.pi_number}</Typography>
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ px: 2, py: 1.25, color: "#64748b", fontSize: "0.75rem" }}>{s.pi_date}</TableCell>
                                                        <TableCell align="center" sx={{ px: 2, py: 1.25 }}>
                                                            <Chip
                                                                label={s.status}
                                                                size="small"
                                                                sx={{
                                                                    fontSize: "9px",
                                                                    fontWeight: 900,
                                                                    textTransform: "uppercase",
                                                                    height: 22,
                                                                    ...(s.status === 'ACCEPTED'
                                                                        ? { bgcolor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }
                                                                        : s.status === 'SENT'
                                                                        ? { bgcolor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }
                                                                        : s.status === 'DRAFT'
                                                                        ? { bgcolor: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }
                                                                        : { bgcolor: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }),
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ px: 2, py: 1.25, fontFamily: "monospace", fontWeight: 700, fontSize: "0.75rem" }}>{s.quantity}</TableCell>
                                                        <TableCell align="right" sx={{ px: 2, py: 1.25, fontFamily: "monospace", fontSize: "0.75rem" }}>{fmt(s.unit_price, s.currency)}</TableCell>
                                                        <TableCell align="right" sx={{ px: 2, py: 1.25 }}>
                                                            <Typography sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.75rem" }}>
                                                                {fmt(s.amount, s.currency)}
                                                            </Typography>
                                                            {s.currency !== 'INR' && (
                                                                <Typography sx={{ fontSize: "9px", color: "#94a3b8", mt: 0.25 }}>@{s.conversion_rate}</Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ px: 2, py: 1.25, fontFamily: "monospace", fontWeight: 700, color: "#1e293b", fontSize: "0.75rem" }}>
                                                            {fmt(s.amount_inr, 'INR')}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ px: 2.5, py: 4, textAlign: "center" }}>
                                        <Typography sx={{ color: "#94a3b8", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                            No sale records
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ py: 8, textAlign: "center" }}>
                            <Typography sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", fontSize: "10px" }}>
                                Failed to load tracking data
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ bgcolor: "#f8fafc", px: 2.5, py: 1.5, borderTop: "1px solid #e2e8f0" }}>
                    <Button
                        onClick={closeTracking}
                        variant="contained"
                        disableElevation
                        sx={{
                            bgcolor: "#e2e8f0",
                            color: "#334155",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            borderRadius: 2,
                            textTransform: "none",
                            "&:hover": { bgcolor: "#cbd5e1" },
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

// Shared table header cell styles
const thStyle = {
    fontSize: "10px",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    px: 2,
    py: 1.5,
    borderBottom: "1px solid #e2e8f0",
};

const modalThStyle = {
    fontSize: "9px",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    px: 2,
    py: 1.25,
    borderBottom: "1px solid #e2e8f0",
};
