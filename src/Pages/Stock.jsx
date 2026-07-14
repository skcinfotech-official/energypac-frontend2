import { useCallback, useEffect, useState } from "react";
import {
    Box, Card, Typography, TextField, InputAdornment, IconButton, Chip, Tooltip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Pagination, ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Warehouse as WarehouseIcon,
    TrendingUp as UpIcon,
    TrendingDown as DownIcon,
    TrendingFlat as FlatIcon,
    Inventory2 as BoxIcon,
    LockClock as ReservedIcon,
    Sell as SellableIcon,
    AccountBalanceWallet as ValueIcon,
} from "@mui/icons-material";
import { getStock, getStockSummary } from "../services/stockService";
import StockDetailModal from "../components/stock/StockDetailModal";

const PAGE_SIZE = 25;

const inr = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const inrShort = (n) => {
    const v = Number(n || 0);
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(2)} L`;
    return inr(v);
};
const num = (n) => Number(n || 0).toLocaleString("en-IN");
const dt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—");

const th = {
    fontSize: 10, fontWeight: 900, color: "#475569", textTransform: "uppercase",
    letterSpacing: "0.05em", bgcolor: "#F8FAFC", borderBottom: "1px solid #E2E8F0",
    py: 1.25, whiteSpace: "nowrap",
};
const td = { fontSize: 12, py: 1.25, borderBottom: "1px solid #F1F5F9" };

const FILTERS = [
    { value: "ALL", label: "All items" },
    { value: "SELLABLE", label: "Free to sell" },
    { value: "IN_STOCK", label: "In stock" },
    { value: "OUT_OF_STOCK", label: "Out of stock" },
    { value: "LOW", label: "Low stock" },
    { value: "NEVER_PURCHASED", label: "Never bought" },
];

function KpiCard({ icon, label, value, sub, color }) {
    return (
        <Card variant="outlined" sx={{ borderRadius: 3, border: "1px solid #E2E8F0", p: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                <Box sx={{ width: 26, height: 26, borderRadius: 1.5, bgcolor: `${color}14`, color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {icon}
                </Box>
                <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                </Typography>
            </Box>
            <Typography sx={{ fontSize: 20, fontWeight: 900, color: "#0F172A", lineHeight: 1.2 }}>{value}</Typography>
            {sub ? <Typography sx={{ fontSize: 11, color: "#94A3B8", mt: 0.25 }}>{sub}</Typography> : null}
        </Card>
    );
}

function Trend({ trend, pct }) {
    if (!trend || trend === "FLAT") return <FlatIcon sx={{ fontSize: 14, color: "#CBD5E1" }} />;
    const up = trend === "UP";
    return (
        <Tooltip title={`${up ? "Costlier" : "Cheaper"} than the previous purchase (${Number(pct || 0).toFixed(1)}%)`} arrow>
            {up
                ? <UpIcon sx={{ fontSize: 14, color: "#DC2626" }} />
                : <DownIcon sx={{ fontSize: 14, color: "#059669" }} />}
        </Tooltip>
    );
}

export default function Stock() {
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [ordering, setOrdering] = useState("-stock_value");
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [detailId, setDetailId] = useState(null);

    // debounce the search box
    useEffect(() => {
        const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
        return () => clearTimeout(t);
    }, [search]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [list, sum] = await Promise.all([
                getStock({ search: debounced, status: statusFilter, ordering, page, page_size: PAGE_SIZE }),
                getStockSummary({ search: debounced }),
            ]);
            setRows(list.results || []);
            setCount(list.count || 0);
            setSummary(sum);
        } catch (err) {
            console.error("Failed to load stock", err);
            setRows([]);
            setCount(0);
        } finally {
            setLoading(false);
        }
    }, [debounced, statusFilter, ordering, page]);

    useEffect(() => { load(); }, [load]);

    const sortBy = (field) => {
        setOrdering((prev) => (prev === `-${field}` ? field : `-${field}`));
        setPage(1);
    };
    const sortArrow = (field) =>
        ordering === `-${field}` ? " ↓" : ordering === field ? " ↑" : "";

    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

    return (
        <Box sx={{ width: "100%" }}>
            {/* HEADER */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 1 }}>
                <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 900, color: "#0F172A", display: "flex", alignItems: "center", gap: 1 }}>
                        <WarehouseIcon sx={{ fontSize: 22, color: "#1D4ED8" }} /> Stock Register
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.25 }}>
                        Every item — how many times it was bought, at what price, what's left, and what is free to sell.
                    </Typography>
                </Box>
                <IconButton onClick={load} size="small" sx={{ border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "background.paper" }}>
                    <RefreshIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {/* KPIs */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", lg: "repeat(5,1fr)" }, gap: 1.5, mb: 2.5 }}>
                <KpiCard icon={<BoxIcon sx={{ fontSize: 15 }} />} color="#1D4ED8"
                    label="Items in stock" value={summary ? summary.in_stock_items : "—"}
                    sub={summary ? `${summary.total_items} items tracked` : ""} />
                <KpiCard icon={<SellableIcon sx={{ fontSize: 15 }} />} color="#059669"
                    label="Free to sell" value={summary ? summary.sellable_items : "—"}
                    sub="Bought but not yet sold" />
                <KpiCard icon={<ReservedIcon sx={{ fontSize: 15 }} />} color="#D97706"
                    label="Reserved units" value={summary ? num(summary.reserved_units) : "—"}
                    sub="Locked in open PIs" />
                <KpiCard icon={<ValueIcon sx={{ fontSize: 15 }} />} color="#7C3AED"
                    label="Stock value" value={summary ? inrShort(summary.total_stock_value) : "—"}
                    sub="At weighted-avg cost" />
                <KpiCard icon={<WarehouseIcon sx={{ fontSize: 15 }} />} color="#DC2626"
                    label="Out of stock" value={summary ? summary.out_of_stock_items : "—"}
                    sub={summary ? `${summary.low_stock_items} low on stock` : ""} />
            </Box>

            {/* TOOLBAR */}
            <Card variant="outlined" sx={{ borderRadius: 3, border: "1px solid #E2E8F0", p: 1.5, mb: 2, display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                <TextField
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search item name, code or HSN…"
                    size="small"
                    sx={{ flex: 1, minWidth: 240, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13 } }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 17, color: "#94A3B8" }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={statusFilter}
                    onChange={(_e, v) => { if (v) { setStatusFilter(v); setPage(1); } }}
                    sx={{
                        flexWrap: "wrap",
                        "& .MuiToggleButton-root": {
                            fontSize: 11, fontWeight: 800, textTransform: "none", px: 1.5, py: 0.6,
                            borderRadius: 2, border: "1px solid #E2E8F0",
                        },
                    }}
                >
                    {FILTERS.map((f) => (
                        <ToggleButton key={f.value} value={f.value}>{f.label}</ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Card>

            {/* TABLE */}
            <Card variant="outlined" sx={{ borderRadius: 3, border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 980 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ ...th, cursor: "pointer" }} onClick={() => sortBy("item_name")}>
                                    Item{sortArrow("item_name")}
                                </TableCell>
                                <TableCell sx={{ ...th, cursor: "pointer" }} align="right" onClick={() => sortBy("purchase_count")}>
                                    Times bought{sortArrow("purchase_count")}
                                </TableCell>
                                <TableCell sx={th} align="right">Last buy price</TableCell>
                                <TableCell sx={{ ...th, cursor: "pointer" }} align="right" onClick={() => sortBy("avg_purchase_rate")}>
                                    Avg buy price{sortArrow("avg_purchase_rate")}
                                </TableCell>
                                <TableCell sx={th} align="right">Low / High</TableCell>
                                <TableCell sx={{ ...th, cursor: "pointer" }} align="right" onClick={() => sortBy("total_sold_qty")}>
                                    Sold{sortArrow("total_sold_qty")}
                                </TableCell>
                                <TableCell sx={{ ...th, cursor: "pointer" }} align="right" onClick={() => sortBy("current_stock")}>
                                    In stock{sortArrow("current_stock")}
                                </TableCell>
                                <TableCell sx={th} align="right">Reserved</TableCell>
                                <TableCell sx={{ ...th, cursor: "pointer" }} align="right" onClick={() => sortBy("available_qty")}>
                                    Free to sell{sortArrow("available_qty")}
                                </TableCell>
                                <TableCell sx={{ ...th, cursor: "pointer" }} align="right" onClick={() => sortBy("stock_value")}>
                                    Stock value{sortArrow("stock_value")}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} sx={{ textAlign: "center", py: 6, border: 0 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} sx={{ textAlign: "center", py: 6, border: 0, color: "#94A3B8", fontSize: 13 }}>
                                        No items match this filter.
                                    </TableCell>
                                </TableRow>
                            ) : rows.map((r) => (
                                <TableRow key={r.product_id} hover sx={{ cursor: "pointer" }} onClick={() => setDetailId(r.product_id)}>
                                    {/* Item */}
                                    <TableCell sx={td}>
                                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{r.item_name}</Typography>
                                        <Typography sx={{ fontSize: 10, color: "#94A3B8", fontFamily: "monospace" }}>
                                            {r.item_code} · {r.unit}
                                            {r.is_out_of_stock ? " · OUT OF STOCK" : r.is_low_stock ? " · LOW" : ""}
                                        </Typography>
                                    </TableCell>

                                    {/* Times bought */}
                                    <TableCell sx={td} align="right">
                                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: r.purchase_count ? "#0F172A" : "#CBD5E1" }}>
                                            {r.purchase_count}×
                                        </Typography>
                                        <Typography sx={{ fontSize: 10, color: "#94A3B8" }}>{num(r.total_purchased_qty)} {r.unit}</Typography>
                                    </TableCell>

                                    {/* Last buy */}
                                    <TableCell sx={td} align="right">
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                                            <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                                                {r.last_purchase_rate > 0 ? inr(r.last_purchase_rate) : "—"}
                                            </Typography>
                                            <Trend trend={r.price_trend} pct={r.price_change_pct} />
                                        </Box>
                                        {r.last_purchase_currency && r.last_purchase_currency !== "INR" && (
                                            <Typography sx={{ fontSize: 10, color: "#7C3AED", fontWeight: 700 }}>
                                                {r.last_purchase_currency} {num(r.last_purchase_rate_original)} converted
                                            </Typography>
                                        )}
                                        <Typography sx={{ fontSize: 10, color: "#94A3B8" }}>
                                            {r.last_purchase_date ? `${dt(r.last_purchase_date)} · ${r.last_vendor_name || "—"}` : "never bought"}
                                        </Typography>
                                    </TableCell>

                                    {/* Avg */}
                                    <TableCell sx={{ ...td, fontWeight: 700 }} align="right">
                                        {r.avg_purchase_rate > 0 ? inr(r.avg_purchase_rate) : "—"}
                                    </TableCell>

                                    {/* Low / high */}
                                    <TableCell sx={td} align="right">
                                        <Typography sx={{ fontSize: 11, color: "#64748B" }}>
                                            {r.min_purchase_rate > 0 ? `${inr(r.min_purchase_rate)} – ${inr(r.max_purchase_rate)}` : "—"}
                                        </Typography>
                                    </TableCell>

                                    {/* Sold */}
                                    <TableCell sx={td} align="right">
                                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: r.total_sold_qty ? "#047857" : "#CBD5E1" }}>
                                            {num(r.total_sold_qty)}
                                        </Typography>
                                        <Typography sx={{ fontSize: 10, color: "#94A3B8" }}>
                                            {r.last_sale_price > 0 ? `@ ${inr(r.last_sale_price)}` : "not sold"}
                                        </Typography>
                                    </TableCell>

                                    {/* In stock */}
                                    <TableCell sx={td} align="right">
                                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: r.current_stock > 0 ? "#0F172A" : "#DC2626" }}>
                                            {num(r.current_stock)}
                                        </Typography>
                                    </TableCell>

                                    {/* Reserved */}
                                    <TableCell sx={td} align="right">
                                        {r.reserved_qty > 0 ? (
                                            <Tooltip title={`${r.open_pi_count} open PI(s) have claimed these units`} arrow>
                                                <Chip size="small" label={num(r.reserved_qty)}
                                                    sx={{ fontSize: 10, fontWeight: 900, height: 20, bgcolor: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" }} />
                                            </Tooltip>
                                        ) : <Typography sx={{ fontSize: 12, color: "#CBD5E1" }}>—</Typography>}
                                    </TableCell>

                                    {/* Free to sell */}
                                    <TableCell sx={td} align="right">
                                        <Chip size="small" label={num(r.available_qty)}
                                            sx={{
                                                fontSize: 11, fontWeight: 900, height: 22,
                                                bgcolor: r.available_qty > 0 ? "#ECFDF5" : "#FEF2F2",
                                                color: r.available_qty > 0 ? "#047857" : "#B91C1C",
                                                border: `1px solid ${r.available_qty > 0 ? "#A7F3D0" : "#FECACA"}`,
                                            }} />
                                    </TableCell>

                                    {/* Value */}
                                    <TableCell sx={{ ...td, fontWeight: 800 }} align="right">{inr(r.stock_value)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {totalPages > 1 && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 1.5, borderTop: "1px solid #F1F5F9" }}>
                        <Pagination count={totalPages} page={page} onChange={(_e, p) => setPage(p)} size="small" color="primary" />
                    </Box>
                )}
            </Card>

            <Typography sx={{ fontSize: 11, color: "#94A3B8", mt: 1.5 }}>
                <b>Free to sell</b> = in stock − quantity already promised on open (Draft/Sent) Proforma Invoices.
                Only these items appear in a <b>Stock Sale</b> PI, so the same unit can never be sold twice.
            </Typography>

            <StockDetailModal open={!!detailId} productId={detailId} onClose={() => setDetailId(null)} />
        </Box>
    );
}
