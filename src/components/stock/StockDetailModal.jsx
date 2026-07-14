import { useCallback, useEffect, useState } from "react";
import {
    Dialog, DialogContent, Box, Typography, IconButton, Chip, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Tabs, Tab,
} from "@mui/material";
import {
    Close as CloseIcon,
    ShoppingCart as BuyIcon,
    Sell as SellIcon,
    LocalShipping as OnOrderIcon,
    TrendingUp as UpIcon,
    TrendingDown as DownIcon,
    TrendingFlat as FlatIcon,
} from "@mui/icons-material";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
    Tooltip as RTooltip,
} from "recharts";
import { getStockDetail } from "../../services/stockService";

const inr = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n) => Number(n || 0).toLocaleString("en-IN");
// Amount in the document's OWN currency (₹ for INR, "USD 500.00" otherwise).
const money = (n, currency) => {
    const v = Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return currency && currency !== "INR" ? `${currency} ${v}` : `₹${v}`;
};
const dt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const th = {
    fontSize: 10, fontWeight: 900, color: "#475569", textTransform: "uppercase",
    letterSpacing: "0.05em", bgcolor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", py: 1,
};
const td = { fontSize: 12, py: 1, borderBottom: "1px solid #F1F5F9" };

function Stat({ label, value, sub, color = "#0F172A" }) {
    return (
        <Box sx={{ p: 1.5, border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "#fff", minWidth: 0 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 900, color, mt: 0.25, lineHeight: 1.2 }}>{value}</Typography>
            {sub ? <Typography sx={{ fontSize: 10, color: "#94A3B8", mt: 0.25 }}>{sub}</Typography> : null}
        </Box>
    );
}

function TrendChip({ trend, pct }) {
    if (!trend || trend === "FLAT") {
        return <Chip size="small" icon={<FlatIcon sx={{ fontSize: 13 }} />} label="No change"
            sx={{ fontSize: 10, fontWeight: 800, bgcolor: "#F8FAFC", color: "#475569", border: "1px solid #E2E8F0" }} />;
    }
    const up = trend === "UP";
    return (
        <Chip
            size="small"
            icon={up ? <UpIcon sx={{ fontSize: 13 }} /> : <DownIcon sx={{ fontSize: 13 }} />}
            label={`${up ? "+" : ""}${Number(pct || 0).toFixed(1)}% vs previous buy`}
            sx={{
                fontSize: 10, fontWeight: 800,
                bgcolor: up ? "#FEF2F2" : "#ECFDF5",
                color: up ? "#B91C1C" : "#047857",
                border: `1px solid ${up ? "#FECACA" : "#A7F3D0"}`,
            }}
        />
    );
}

export default function StockDetailModal({ open, productId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState(0);

    const load = useCallback(async (id) => {
        setLoading(true);
        setTab(0);
        try {
            setData(await getStockDetail(id));
        } catch (err) {
            console.error("Failed to load stock detail", err);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open && productId) load(productId);
    }, [open, productId, load]);

    // API sends purchases newest-first; the timeline reads oldest → newest.
    const buyTimeline = data?.purchases ? [...data.purchases].reverse() : [];

    // Currency / conversion columns only make sense when something was actually
    // bought or sold in a foreign currency — for pure-INR items they are noise.
    const fxBuy = (data?.purchases || []).some((p) => p.currency !== "INR");
    const fxSell = (data?.sales || []).some((s) => s.currency !== "INR");
    const fxOrder = (data?.on_order || []).some((o) => o.currency !== "INR");
    const estimatedBuy = (data?.purchases || []).some((p) => p.conversion_rate_estimated);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
            slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
            <DialogContent sx={{ p: 0, bgcolor: "background.default" }}>
                {/* HEADER */}
                <Box sx={{ px: 3, py: 2, bgcolor: "#fff", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                        <Typography sx={{ fontSize: 17, fontWeight: 900, color: "#0F172A" }}>
                            {data?.item_name || "Item"}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: "#64748B", fontFamily: "monospace", mt: 0.25 }}>
                            {data?.item_code} {data?.hsn_code ? `· HSN ${data.hsn_code}` : ""} {data?.unit ? `· ${data.unit}` : ""}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                </Box>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={28} /></Box>
                ) : !data ? (
                    <Typography sx={{ p: 4, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                        Could not load this item.
                    </Typography>
                ) : (
                    <Box sx={{ p: 3 }}>
                        {/* KPI STRIP */}
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(6,1fr)" }, gap: 1.5, mb: 2 }}>
                            <Stat label="In stock" value={`${num(data.current_stock)} ${data.unit}`} sub="On hand today" />
                            <Stat label="Reserved" value={`${num(data.reserved_qty)} ${data.unit}`}
                                sub={`${data.open_pi_count} open PI(s)`} color="#B45309" />
                            <Stat label="Free to sell" value={`${num(data.available_qty)} ${data.unit}`}
                                sub="Bought, not yet sold" color={data.available_qty > 0 ? "#047857" : "#B91C1C"} />
                            <Stat label="Times bought" value={data.purchase_count}
                                sub={`${num(data.total_purchased_qty)} ${data.unit} total`} />
                            <Stat label="Avg buy price" value={inr(data.avg_purchase_rate)}
                                sub={`Range ${inr(data.min_purchase_rate)} – ${inr(data.max_purchase_rate)}`} />
                            <Stat label="Stock value" value={inr(data.stock_value)} sub="At avg cost" color="#1D4ED8" />
                        </Box>

                        {/* LATEST BUY */}
                        <Box sx={{ p: 2, bgcolor: "#fff", border: "1px solid #E2E8F0", borderRadius: 3, mb: 2,
                            display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, justifyContent: "space-between" }}>
                            <Box>
                                <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Latest purchase price
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mt: 0.5, flexWrap: "wrap" }}>
                                    <Typography sx={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>
                                        {inr(data.last_purchase_rate)}
                                        <Typography component="span" sx={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}> /{data.unit}</Typography>
                                    </Typography>
                                    <TrendChip trend={data.price_trend} pct={data.price_change_pct} />
                                </Box>
                                <Typography sx={{ fontSize: 11, color: "#64748B", mt: 0.5 }}>
                                    {data.last_purchase_date
                                        ? <>Bought on <b>{dt(data.last_purchase_date)}</b> from <b>{data.last_vendor_name || "—"}</b>
                                            {data.last_po_number ? <> · PO <b>{data.last_po_number}</b></> : null}
                                            {data.last_requisition_number ? <> · REQ <b>{data.last_requisition_number}</b></> : null}</>
                                        : "Never purchased through a PO yet"}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: "right" }}>
                                <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Last sale price
                                </Typography>
                                <Typography sx={{ fontSize: 22, fontWeight: 900, color: "#047857" }}>
                                    {data.last_sale_price > 0 ? inr(data.last_sale_price) : "—"}
                                </Typography>
                                <Typography sx={{ fontSize: 11, color: "#64748B" }}>
                                    {data.last_pi_number ? <>{data.last_pi_number} · {dt(data.last_sale_date)}</> : "Not sold yet"}
                                </Typography>
                            </Box>
                        </Box>

                        {/* EVERY PURCHASE — when it was bought and for how much */}
                        <Box sx={{ p: 2, bgcolor: "#fff", border: "1px solid #E2E8F0", borderRadius: 3, mb: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                                <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Every purchase — bought {data.purchase_count}× ({num(data.total_purchased_qty)} {data.unit} for {inr(data.total_purchase_value)})
                                </Typography>
                                {data.purchase_count > 1 && (
                                    <Typography sx={{ fontSize: 10, color: "#94A3B8" }}>
                                        Cheapest {inr(data.min_purchase_rate)} · Costliest {inr(data.max_purchase_rate)} · Avg {inr(data.avg_purchase_rate)}
                                    </Typography>
                                )}
                            </Box>

                            {buyTimeline.length === 0 ? (
                                <Typography sx={{ fontSize: 12, color: "#94A3B8", py: 2, textAlign: "center" }}>
                                    This item has never been received through a Purchase Order.
                                </Typography>
                            ) : (
                                <>
                                    {/* one card per buy, oldest → newest */}
                                    <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1 }}>
                                        {buyTimeline.map((p, i) => {
                                            const prev = i > 0 ? buyTimeline[i - 1].rate_inr : null;
                                            const diff = prev ? p.rate_inr - prev : 0;
                                            return (
                                                <Box key={`${p.po_id}-${i}`} sx={{
                                                    minWidth: 168, flexShrink: 0, p: 1.25, borderRadius: 2,
                                                    border: "1px solid #E2E8F0",
                                                    bgcolor: i === buyTimeline.length - 1 ? "#EFF6FF" : "#F8FAFC",
                                                }}>
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                        <Typography sx={{ fontSize: 9, fontWeight: 900, color: "#94A3B8" }}>BUY #{i + 1}</Typography>
                                                        <Typography sx={{ fontSize: 9, fontWeight: 800, color: "#64748B" }}>{dt(p.po_date)}</Typography>
                                                    </Box>
                                                    {/* Bought in the PO's own currency … */}
                                                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mt: 0.25, flexWrap: "wrap" }}>
                                                        <Typography sx={{ fontSize: 15, fontWeight: 900, color: "#0F172A" }}>
                                                            {money(p.rate, p.currency)}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: 9, color: "#94A3B8", fontWeight: 700 }}>/{data.unit}</Typography>
                                                        {diff !== 0 && (
                                                            <Typography sx={{ fontSize: 9, fontWeight: 900, color: diff > 0 ? "#DC2626" : "#059669" }}>
                                                                {diff > 0 ? "▲" : "▼"} {inr(Math.abs(diff))}
                                                            </Typography>
                                                        )}
                                                    </Box>

                                                    {/* … and what that was worth in INR at that time */}
                                                    {p.currency !== "INR" && (
                                                        <Box sx={{ mt: 0.25, px: 0.75, py: 0.4, borderRadius: 1, bgcolor: "#F5F3FF", border: "1px solid #DDD6FE" }}>
                                                            <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#5B21B6" }}>
                                                                {p.conversion_rate_estimated ? "≈ " : "= "}{inr(p.rate_inr)}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: 9, color: "#7C3AED" }}>
                                                                1 {p.currency} = ₹{num(p.conversion_rate)}
                                                                {p.conversion_rate_estimated ? " (rate not saved on PO)" : ""}
                                                            </Typography>
                                                        </Box>
                                                    )}

                                                    <Typography sx={{ fontSize: 10, color: "#475569", mt: 0.25 }}>
                                                        {num(p.quantity)} {data.unit} · {money(p.amount, p.currency)}
                                                        {p.currency !== "INR" ? ` (${inr(p.amount_inr)})` : ""}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 10, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {p.vendor_name || "—"}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: 9, color: "#94A3B8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {p.po_number}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Box>

                                    {/* price movement */}
                                    {buyTimeline.length > 1 && (
                                        <Box sx={{ width: "100%", height: 170, mt: 1 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={buyTimeline.map((p, i) => ({
                                                    label: `#${i + 1} · ${dt(p.po_date)}`,
                                                    rate: p.rate_inr,
                                                }))} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
                                                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94A3B8" }} />
                                                    <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} width={60}
                                                        tickFormatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
                                                    <RTooltip formatter={(v) => [inr(v), "Buy price"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                                                    <Line type="monotone" dataKey="rate" stroke="#1D4ED8" strokeWidth={2}
                                                        dot={{ r: 3, fill: "#1D4ED8" }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </Box>
                                    )}
                                    {fxBuy && (
                                        <Typography sx={{ fontSize: 10, color: "#7C3AED", mt: 0.5 }}>
                                            Foreign-currency purchases are converted with the rate stored on that PO, so the INR value is what it actually cost on that date.
                                            {estimatedBuy && (
                                                <Typography component="span" sx={{ fontSize: 10, color: "#B45309", fontWeight: 700 }}>
                                                    {" "}⚠ Some POs were saved without a conversion rate — those are marked ≈ and use the exchange rate that was effective on the PO date.
                                                </Typography>
                                            )}
                                        </Typography>
                                    )}
                                </>
                            )}
                        </Box>

                        {/* TABS */}
                        <Box sx={{ bgcolor: "#fff", border: "1px solid #E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                            <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ borderBottom: "1px solid #E2E8F0", minHeight: 42,
                                "& .MuiTab-root": { fontSize: 12, fontWeight: 800, textTransform: "none", minHeight: 42 } }}>
                                <Tab icon={<BuyIcon sx={{ fontSize: 15 }} />} iconPosition="start" label={`Purchases (${data.purchases.length})`} />
                                <Tab icon={<SellIcon sx={{ fontSize: 15 }} />} iconPosition="start" label={`Sales (${data.sales.length})`} />
                                <Tab icon={<OnOrderIcon sx={{ fontSize: 15 }} />} iconPosition="start" label={`On order (${data.on_order.length})`} />
                            </Tabs>

                            {/* PURCHASES */}
                            {tab === 0 && (
                                <TableContainer sx={{ maxHeight: 340 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={th}>Date</TableCell>
                                                <TableCell sx={th}>PO No.</TableCell>
                                                <TableCell sx={th}>Vendor</TableCell>
                                                <TableCell sx={th}>Requisition</TableCell>
                                                <TableCell sx={th} align="right">Qty</TableCell>
                                                {fxBuy && <TableCell sx={th} align="center">Currency</TableCell>}
                                                <TableCell sx={th} align="right">{fxBuy ? "Rate (as bought)" : "Rate"}</TableCell>
                                                {fxBuy && <TableCell sx={th} align="right">Conv. rate</TableCell>}
                                                {fxBuy && <TableCell sx={th} align="right">Rate (INR)</TableCell>}
                                                <TableCell sx={th} align="right">{fxBuy ? "Amount (as bought)" : "Amount"}</TableCell>
                                                {fxBuy && <TableCell sx={th} align="right">Amount (INR)</TableCell>}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.purchases.length === 0 ? (
                                                <TableRow><TableCell colSpan={fxBuy ? 11 : 7} sx={{ ...td, textAlign: "center", color: "#94A3B8", py: 4 }}>
                                                    This item was never received through a PO.
                                                </TableCell></TableRow>
                                            ) : data.purchases.map((p, i) => (
                                                <TableRow key={`${p.po_id}-${i}`} hover>
                                                    <TableCell sx={td}>{dt(p.po_date)}</TableCell>
                                                    <TableCell sx={{ ...td, fontFamily: "monospace", fontWeight: 700 }}>{p.po_number}</TableCell>
                                                    <TableCell sx={td}>{p.vendor_name || "—"}</TableCell>
                                                    <TableCell sx={{ ...td, fontFamily: "monospace", color: "#64748B" }}>{p.requisition_number || "—"}</TableCell>
                                                    <TableCell sx={td} align="right">{num(p.quantity)}</TableCell>
                                                    {fxBuy && (
                                                        <TableCell sx={td} align="center">
                                                            <Chip size="small" label={p.currency}
                                                                sx={{
                                                                    fontSize: 9, fontWeight: 900, height: 19,
                                                                    bgcolor: p.currency === "INR" ? "#F1F5F9" : "#F5F3FF",
                                                                    color: p.currency === "INR" ? "#475569" : "#5B21B6",
                                                                    border: `1px solid ${p.currency === "INR" ? "#E2E8F0" : "#DDD6FE"}`,
                                                                }} />
                                                        </TableCell>
                                                    )}
                                                    <TableCell sx={{ ...td, fontWeight: 800 }} align="right">{money(p.rate, p.currency)}</TableCell>
                                                    {fxBuy && (
                                                        <TableCell sx={{ ...td, color: p.currency === "INR" ? "#CBD5E1" : "#7C3AED", fontWeight: 700 }} align="right">
                                                            {p.currency === "INR" ? "—" : (
                                                                <>₹{num(p.conversion_rate)}{p.conversion_rate_estimated ? " *" : ""}</>
                                                            )}
                                                        </TableCell>
                                                    )}
                                                    {fxBuy && (
                                                        <TableCell sx={{ ...td, fontWeight: 800 }} align="right">{inr(p.rate_inr)}</TableCell>
                                                    )}
                                                    <TableCell sx={{ ...td, fontWeight: 800 }} align="right">{money(p.amount, p.currency)}</TableCell>
                                                    {fxBuy && (
                                                        <TableCell sx={{ ...td, fontWeight: 800 }} align="right">{inr(p.amount_inr)}</TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {/* SALES */}
                            {tab === 1 && (
                                <TableContainer sx={{ maxHeight: 340 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={th}>Date</TableCell>
                                                <TableCell sx={th}>PI No.</TableCell>
                                                <TableCell sx={th}>Buyer</TableCell>
                                                <TableCell sx={th}>Source</TableCell>
                                                <TableCell sx={th}>Status</TableCell>
                                                <TableCell sx={th} align="right">Qty</TableCell>
                                                {fxSell && <TableCell sx={th} align="center">Currency</TableCell>}
                                                <TableCell sx={th} align="right">Sale price</TableCell>
                                                {fxSell && <TableCell sx={th} align="right">Conv. rate</TableCell>}
                                                {fxSell && <TableCell sx={th} align="right">Price (INR)</TableCell>}
                                                <TableCell sx={th} align="right">{fxSell ? "Amount (INR)" : "Amount"}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.sales.length === 0 ? (
                                                <TableRow><TableCell colSpan={fxSell ? 11 : 8} sx={{ ...td, textAlign: "center", color: "#94A3B8", py: 4 }}>
                                                    Not sold on any PI yet.
                                                </TableCell></TableRow>
                                            ) : data.sales.map((s, i) => (
                                                <TableRow key={`${s.pi_id}-${i}`} hover>
                                                    <TableCell sx={td}>{dt(s.pi_date)}</TableCell>
                                                    <TableCell sx={{ ...td, fontFamily: "monospace", fontWeight: 700 }}>{s.pi_number}</TableCell>
                                                    <TableCell sx={td}>{s.buyer || "—"}</TableCell>
                                                    <TableCell sx={{ ...td, fontSize: 11, color: "#64748B" }}>{s.source}</TableCell>
                                                    <TableCell sx={td}>
                                                        <Chip size="small" label={s.is_sold ? "SOLD" : "RESERVED"}
                                                            sx={{
                                                                fontSize: 9, fontWeight: 900, height: 20,
                                                                bgcolor: s.is_sold ? "#ECFDF5" : "#FFFBEB",
                                                                color: s.is_sold ? "#047857" : "#B45309",
                                                                border: `1px solid ${s.is_sold ? "#A7F3D0" : "#FDE68A"}`,
                                                            }} />
                                                    </TableCell>
                                                    <TableCell sx={td} align="right">{num(s.quantity)}</TableCell>
                                                    {fxSell && (
                                                        <TableCell sx={td} align="center">
                                                            <Chip size="small" label={s.currency}
                                                                sx={{
                                                                    fontSize: 9, fontWeight: 900, height: 19,
                                                                    bgcolor: s.currency === "INR" ? "#F1F5F9" : "#F5F3FF",
                                                                    color: s.currency === "INR" ? "#475569" : "#5B21B6",
                                                                    border: `1px solid ${s.currency === "INR" ? "#E2E8F0" : "#DDD6FE"}`,
                                                                }} />
                                                        </TableCell>
                                                    )}
                                                    <TableCell sx={{ ...td, fontWeight: 800 }} align="right">{money(s.unit_price, s.currency)}</TableCell>
                                                    {fxSell && (
                                                        <TableCell sx={{ ...td, color: s.currency === "INR" ? "#CBD5E1" : "#7C3AED", fontWeight: 700 }} align="right">
                                                            {s.currency === "INR" ? "—" : (
                                                                <>₹{num(s.conversion_rate)}{s.conversion_rate_estimated ? " *" : ""}</>
                                                            )}
                                                        </TableCell>
                                                    )}
                                                    {fxSell && (
                                                        <TableCell sx={{ ...td, fontWeight: 800 }} align="right">{inr(s.unit_price_inr)}</TableCell>
                                                    )}
                                                    <TableCell sx={{ ...td, fontWeight: 800 }} align="right">{inr(s.amount_inr)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {/* ON ORDER */}
                            {tab === 2 && (
                                <TableContainer sx={{ maxHeight: 340 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={th}>PO Date</TableCell>
                                                <TableCell sx={th}>PO No.</TableCell>
                                                <TableCell sx={th}>Vendor</TableCell>
                                                <TableCell sx={th}>Requisition</TableCell>
                                                <TableCell sx={th}>PO Status</TableCell>
                                                <TableCell sx={th} align="right">Qty</TableCell>
                                                <TableCell sx={th} align="right">{fxOrder ? "Rate (as ordered)" : "Rate"}</TableCell>
                                                {fxOrder && <TableCell sx={th} align="right">Conv. rate</TableCell>}
                                                {fxOrder && <TableCell sx={th} align="right">Rate (INR)</TableCell>}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.on_order.length === 0 ? (
                                                <TableRow><TableCell colSpan={fxOrder ? 9 : 7} sx={{ ...td, textAlign: "center", color: "#94A3B8", py: 4 }}>
                                                    Nothing on order — no pending PO lines for this item.
                                                </TableCell></TableRow>
                                            ) : data.on_order.map((o, i) => (
                                                <TableRow key={`${o.po_id}-${i}`} hover>
                                                    <TableCell sx={td}>{dt(o.po_date)}</TableCell>
                                                    <TableCell sx={{ ...td, fontFamily: "monospace", fontWeight: 700 }}>{o.po_number}</TableCell>
                                                    <TableCell sx={td}>{o.vendor_name || "—"}</TableCell>
                                                    <TableCell sx={{ ...td, fontFamily: "monospace", color: "#64748B" }}>{o.requisition_number || "—"}</TableCell>
                                                    <TableCell sx={{ ...td, fontSize: 11 }}>{o.po_status}</TableCell>
                                                    <TableCell sx={td} align="right">{num(o.quantity)}</TableCell>
                                                    <TableCell sx={{ ...td, fontWeight: 800 }} align="right">{money(o.rate, o.currency)}</TableCell>
                                                    {fxOrder && (
                                                        <TableCell sx={{ ...td, color: o.currency === "INR" ? "#CBD5E1" : "#7C3AED", fontWeight: 700 }} align="right">
                                                            {o.currency === "INR" ? "—" : `₹${num(o.conversion_rate)}`}
                                                        </TableCell>
                                                    )}
                                                    {fxOrder && <TableCell sx={td} align="right">{inr(o.rate_inr)}</TableCell>}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>

                        <Divider sx={{ my: 2 }} />
                        <Typography sx={{ fontSize: 11, color: "#94A3B8" }}>
                            Stock rises when a PO item is received and falls when a PI is accepted.
                            Quantities on DRAFT/SENT PIs are shown as <b>Reserved</b> — they are excluded from “Free to sell”.
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
