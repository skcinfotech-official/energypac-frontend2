import { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, IconButton, Button, TextField, Grid,
    Table, TableHead, TableBody, TableRow, TableCell,
    CircularProgress, Alert, Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "react-hot-toast";

import {
    getProformaInvoiceById, updateProformaInvoice,
    lockProformaInvoice, unlockProformaInvoice,
} from "../../services/salesService";

const PRIMARY = "#2196F3";
const numOr0 = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v) || 0);
const fmt = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Dedicated editor for the Note Sheet / Comparative Statement.
 * Lets the user override each vendor's offer price per item, edit the sale
 * price / freight / export cost, and the profit-loading %. Persists back onto
 * the PI (which carries the lock + revision, just like PO editing).
 */
const EditComparisonSheetModal = ({ isOpen, piId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [locked, setLocked] = useState(false);
    const [error, setError] = useState("");
    const [pi, setPi] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [rows, setRows] = useState([]);
    const [profitPct, setProfitPct] = useState(0);
    const currency = pi?.currency || "USD";

    useEffect(() => {
        if (!isOpen || !piId) return;
        let active = true;
        (async () => {
            setLoading(true);
            setError("");
            try {
                await lockProformaInvoice(piId);
                if (active) setLocked(true);
                const data = await getProformaInvoiceById(piId);
                if (!active) return;
                setPi(data);
                setProfitPct(data.profit_loading_percent ?? 0);

                const items = data.items || [];
                // Union of vendor names across items (offers + stored overrides).
                const vset = [];
                items.forEach((it) => {
                    const keys = [
                        ...Object.keys(it.vendor_offers_available || {}),
                        ...Object.keys(it.vendor_offers || {}),
                    ];
                    keys.forEach((k) => { if (k && !vset.includes(k)) vset.push(k); });
                });
                setVendors(vset);

                setRows(items.map((it) => {
                    const available = it.vendor_offers_available || {};
                    const override = it.vendor_offers || {};
                    const vendorEdits = {};
                    vset.forEach((v) => {
                        const eff = (v in override) ? override[v] : available[v];
                        vendorEdits[v] = eff === undefined || eff === null ? "" : String(eff);
                    });
                    return {
                        id: it.id,
                        product: it.product,
                        requisition_item: it.requisition_item,
                        description: it.product_name || it.item_name || "",
                        unit: it.unit || "",
                        hsn_code: it.hsn_code || "",
                        quantity: Number(it.quantity) || 0,
                        unit_price: String(it.unit_price ?? 0),
                        freight: String(it.freight ?? 0),
                        export_cost: String(it.export_cost ?? 0),
                        last_lc_reference: it.last_lc_reference || "",
                        last_unit_price: it.last_unit_price ?? 0,
                        actual_purchase_rate: Number(it.actual_purchase_rate) || 0,
                        available,
                        vendorEdits,
                    };
                }));
            } catch (err) {
                console.error("Failed to open comparison sheet", err);
                setError("Could not open — the PI may be locked by another user.");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [isOpen, piId]);

    const releaseLock = async () => {
        if (locked && piId) {
            try { await unlockProformaInvoice(piId); } catch { /* ignore */ }
            setLocked(false);
        }
    };

    const handleClose = async () => {
        await releaseLock();
        onClose?.();
    };

    const setCell = (idx, field, value) => {
        setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
    };
    const setVendorCell = (idx, vendor, value) => {
        setRows((prev) => prev.map((r, i) => (
            i === idx ? { ...r, vendorEdits: { ...r.vendorEdits, [vendor]: value } } : r
        )));
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const payloadItems = rows.map((r) => {
                // Store only vendor rates that differ from the quotation offer.
                const overrides = {};
                vendors.forEach((v) => {
                    const edited = r.vendorEdits[v];
                    if (edited === "" || edited === undefined) return;
                    const avail = r.available[v];
                    if (avail === undefined || Number(edited) !== Number(avail)) {
                        overrides[v] = numOr0(edited);
                    }
                });
                return {
                    id: r.id,
                    product: r.product,
                    hsn_code: r.hsn_code,
                    unit: r.unit,
                    quantity: Number(r.quantity),
                    unit_price: numOr0(r.unit_price),
                    freight: numOr0(r.freight),
                    export_cost: numOr0(r.export_cost),
                    last_lc_reference: r.last_lc_reference,
                    last_unit_price: numOr0(r.last_unit_price),
                    vendor_offers: overrides,
                };
            });
            await updateProformaInvoice(piId, {
                profit_loading_percent: numOr0(profitPct),
                items: payloadItems,
            });
            toast.success("Comparison sheet updated");
            await releaseLock();
            onSuccess?.();
            onClose?.();
        } catch (err) {
            console.error("Failed to save comparison sheet", err);
            const msg = err?.response?.data?.items || err?.response?.data?.detail || "Failed to save";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setSaving(false);
        }
    };

    const cellInput = { width: 90, "& .MuiInputBase-input": { fontSize: 12, py: 0.5, px: 1, textAlign: "right" } };

    return (
        <Dialog open={!!isOpen} onClose={handleClose} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Edit Comparison Sheet</Typography>
                    {pi && (
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                            {pi.pi_number} · Currency {currency}
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ overflow: "auto" }}>
                {loading ? (
                    <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress /></Box>
                ) : error && !rows.length ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2, flexWrap: "wrap" }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>
                                Profit Loading %
                            </Typography>
                            <TextField
                                type="number" size="small" value={profitPct}
                                onChange={(e) => setProfitPct(e.target.value)}
                                inputProps={{ step: "0.01", min: 0 }}
                                sx={{ width: 110, "& .MuiInputBase-input": { fontSize: 13, fontWeight: 700 } }}
                            />
                            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                                Vendor offer cells override the quotation rate; blank/equal keeps the quoted value.
                            </Typography>
                        </Box>

                        <Box sx={{ overflowX: "auto" }}>
                            <Table size="small" sx={{ minWidth: 720, "& td, & th": { border: "1px solid #e0e0e0" } }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#F3F4F6" }}>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, minWidth: 180 }}>Description</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textAlign: "right" }}>Qty</TableCell>
                                        {vendors.map((v) => (
                                            <TableCell key={v} sx={{ fontWeight: 700, fontSize: 11, textAlign: "center" }}>
                                                {v}<br />Offer ({currency})
                                            </TableCell>
                                        ))}
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textAlign: "right", bgcolor: "#FEF3C7" }}>
                                            Actual Purchase<br />(PO) {currency}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textAlign: "right" }}>New Sale Price ({currency})</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textAlign: "right" }}>Freight</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textAlign: "right" }}>Export Cost</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((r, idx) => (
                                        <TableRow key={r.id}>
                                            <TableCell sx={{ fontSize: 12 }}>{idx + 1}</TableCell>
                                            <TableCell sx={{ fontSize: 12 }}>
                                                {r.description}
                                                <Typography sx={{ fontSize: 10, color: "text.secondary" }}>{r.unit}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 12, textAlign: "right" }}>{fmt(r.quantity)}</TableCell>
                                            {vendors.map((v) => (
                                                <TableCell key={v} sx={{ textAlign: "right" }}>
                                                    <TextField
                                                        type="number" size="small"
                                                        value={r.vendorEdits[v] ?? ""}
                                                        onChange={(e) => setVendorCell(idx, v, e.target.value)}
                                                        inputProps={{ step: "0.0001", min: 0 }}
                                                        sx={cellInput}
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell sx={{ textAlign: "right", bgcolor: "#FFFBEB" }}>
                                                <Tooltip title="From the actual Purchase Order(s) — read-only">
                                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(r.actual_purchase_rate)}</span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: "right" }}>
                                                <TextField
                                                    type="number" size="small" value={r.unit_price}
                                                    onChange={(e) => setCell(idx, "unit_price", e.target.value)}
                                                    inputProps={{ step: "0.01", min: 0 }} sx={cellInput}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ textAlign: "right" }}>
                                                <TextField
                                                    type="number" size="small" value={r.freight}
                                                    onChange={(e) => setCell(idx, "freight", e.target.value)}
                                                    inputProps={{ step: "0.01", min: 0 }} sx={cellInput}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ textAlign: "right" }}>
                                                <TextField
                                                    type="number" size="small" value={r.export_cost}
                                                    onChange={(e) => setCell(idx, "export_cost", e.target.value)}
                                                    inputProps={{ step: "0.01", min: 0 }} sx={cellInput}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} disabled={saving}>Cancel</Button>
                <Button
                    variant="contained" startIcon={<SaveIcon />}
                    onClick={handleSave} disabled={saving || loading || !rows.length}
                    sx={{ bgcolor: PRIMARY }}
                >
                    {saving ? "Saving..." : "Save Comparison Sheet"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditComparisonSheetModal;
