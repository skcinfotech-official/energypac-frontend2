import { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
    IconButton, Button, TextField, Grid, Table, TableHead, TableBody,
    TableRow, TableCell, Alert, CircularProgress, Divider, Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GridOnIcon from "@mui/icons-material/GridOn";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";

import {
    getTaxInvoicePrefill, getTaxInvoiceBlank, getTaxInvoiceById, createTaxInvoice,
    updateTaxInvoice, downloadTaxInvoiceExcel,
} from "../../services/domesticService";
import TaxInvoiceDocPDF from "./TaxInvoiceDocPDF";

const PRIMARY = "#1565C0";
const labelSx = { fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.5 };
const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: 2 }, "& .MuiInputBase-input": { fontSize: 13 } };

const blankItem = () => ({ description: "", hs_sac_code: "", quantity: 1, unit: "No.", rate: 0, taxable_value: 0, sgst_rate: 9, cgst_rate: 9, igst_rate: 0 });

// section field defs: [key, label, type]
const COMPANY_FIELDS = [
    ["company_name", "Company Name"], ["company_gstin", "Company GSTIN"],
    ["company_pan", "PAN No"], ["company_iec", "IEC No"],
    ["company_address", "Company Address"], ["copy_label", "Copy Label"],
];
const PARTY_FIELDS = (kind) => kind === "SERVICE"
    ? [["invoice_no", "Invoice No"], ["invoice_date", "Invoice Date", "date"],
       ["work_order_no", "Work Order No"], ["place_of_supply", "Place of Supply & Service"],
       ["state", "State"], ["state_code", "State Code"]]
    : [["invoice_no", "Invoice No"], ["invoice_date", "Invoice Date", "date"],
       ["challan_no", "Challan No"], ["challan_date", "Challan Date", "date"],
       ["vendor_code", "Vendor Code"], ["vehicle_no", "Vehicle No"],
       ["mode_of_transport", "Mode of Transport"], ["place_of_supply", "Place of Supply"],
       ["buyers_order_no", "Buyer's Order No"], ["buyers_order_date", "Buyer's Order Date", "date"],
       ["state", "State"], ["state_code", "State Code"]];
const BILL_FIELDS = [["bill_to_name", "Name"], ["bill_to_gstin", "GSTIN"], ["bill_to_address", "Address", "area"], ["bill_to_state", "State/Country"]];
const SHIP_FIELDS = [["ship_to_name", "Name"], ["ship_to_state", "State/Country"], ["ship_to_address", "Address", "area"], ["ship_to_project", "Project Name", "area"]];
const BANK_FIELDS = [["bank_name", "Bank Name"], ["bank_account", "Bank A/C"], ["bank_ifsc", "Bank IFSC"], ["gst_on_reverse_charge", "GST on Reverse Charge"]];

const TaxInvoiceModal = ({ isOpen, onClose, onSuccess, proformaInvoiceId = null, tiId = null, initialKind = "PRODUCT" }) => {
    const isEdit = !!tiId;
    const isStandalone = !isEdit && !proformaInvoiceId;   // Service invoice: no PI link
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState(null);
    const [items, setItems] = useState([]);
    const [terms, setTerms] = useState([]);
    const [saved, setSaved] = useState(null);

    const kind = form?.kind || "PRODUCT";

    const loadPrefill = async (k) => {
        const data = await getTaxInvoicePrefill(proformaInvoiceId, k);
        const { items: its, terms_of_payment, ...rest } = data;
        setForm(rest);
        setItems((its || []).map(i => ({ ...blankItem(), ...i })));
        setTerms(terms_of_payment || []);
    };

    const loadBlank = async (k) => {
        const data = await getTaxInvoiceBlank(k);
        const { items: its, terms_of_payment, ...rest } = data;
        setForm(rest);
        setItems((its && its.length) ? its.map(i => ({ ...blankItem(), ...i })) : [blankItem()]);
        setTerms(terms_of_payment || []);
    };

    useEffect(() => {
        if (!isOpen) return;
        setError(""); setSaved(null);
        (async () => {
            setLoading(true);
            try {
                if (isEdit) {
                    const data = await getTaxInvoiceById(tiId);
                    setSaved(data);
                    const { items: its, terms_of_payment, ...rest } = data;
                    setForm(rest);
                    setItems((its || []).map(i => ({ ...blankItem(), ...i })));
                    setTerms(terms_of_payment || []);
                } else if (isStandalone) {
                    await loadBlank(initialKind);
                } else {
                    await loadPrefill("PRODUCT");
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.error || "Failed to load tax invoice data");
            } finally {
                setLoading(false);
            }
        })();
    }, [isOpen, tiId, proformaInvoiceId]);

    const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const setItem = (idx, k, v) => setItems(p => p.map((it, i) => i === idx ? { ...it, [k]: v } : it));
    const addItem = () => setItems(p => [...p, blankItem()]);
    const removeItem = (idx) => setItems(p => p.filter((_, i) => i !== idx));

    const calc = (it) => {
        const amount = Number(it.quantity || 0) * Number(it.rate || 0);
        const taxable = Number(it.taxable_value) || amount;
        const sgst = taxable * Number(it.sgst_rate || 0) / 100;
        const cgst = taxable * Number(it.cgst_rate || 0) / 100;
        const igst = taxable * Number(it.igst_rate || 0) / 100;
        return { amount, taxable, sgst, cgst, igst, total: taxable + sgst + cgst + igst };
    };
    const totBefore = items.reduce((a, it) => a + calc(it).taxable, 0);
    const totTax = items.reduce((a, it) => { const c = calc(it); return a + c.sgst + c.cgst + c.igst; }, 0);
    const totAfter = totBefore + totTax;
    const f2 = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const buildPayload = () => ({
        ...form,
        kind,
        terms_of_payment: terms.filter(t => (t || "").trim() !== ""),
        items: items.map((it, i) => ({
            id: it.id, pi_item: it.pi_item, description: it.description, hs_sac_code: it.hs_sac_code,
            quantity: Number(it.quantity || 0), unit: it.unit, rate: Number(it.rate || 0),
            taxable_value: Number(it.taxable_value) || (Number(it.quantity || 0) * Number(it.rate || 0)),
            sgst_rate: Number(it.sgst_rate || 0), cgst_rate: Number(it.cgst_rate || 0), igst_rate: Number(it.igst_rate || 0),
            sort_order: i,
        })),
    });

    const handleSave = async () => {
        setSubmitting(true); setError("");
        try {
            if (items.length === 0) throw new Error("At least one item is required");
            const payload = buildPayload();
            const ti = isEdit ? await updateTaxInvoice(tiId, payload) : await createTaxInvoice(payload);
            setSaved(ti);
            toast.success(`Tax Invoice ${ti.ti_number} saved`);
            onSuccess?.(ti);
        } catch (err) {
            console.error(err);
            const d = err.response?.data;
            setError(typeof d === "string" ? d : (d ? Object.values(d).flat().join(" | ") : err.message));
            toast.error("Failed to save Tax Invoice");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePdf = async () => {
        if (!saved) return;
        const blob = await pdf(<TaxInvoiceDocPDF ti={saved} />).toBlob();
        saveAs(blob, `${saved.ti_number.replace(/\//g, "_")}.pdf`);
    };
    const handleExcel = async () => {
        if (!saved) return;
        const blob = await downloadTaxInvoiceExcel(saved.id);
        saveAs(blob, `${saved.ti_number.replace(/\//g, "_")}.xlsx`);
    };

    const renderFields = (defs) => defs.map(([k, lbl, type]) => (
        <Grid item xs={12} sm={6} md={type === "area" ? 6 : 3} key={k}>
            <Typography sx={labelSx}>{lbl}</Typography>
            <TextField
                type={type === "date" ? "date" : "text"} value={form[k] ?? ""}
                onChange={(e) => setField(k, e.target.value)} fullWidth size="small"
                multiline={type === "area"} minRows={type === "area" ? 2 : undefined} sx={inputSx}
            />
        </Grid>
    ));

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: 4, maxHeight: "94vh" } }}>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{isEdit ? "Edit" : "Create"} Tax Invoice</Typography>
                    <Typography variant="caption" color="text.disabled">{saved?.ti_number || "Domestic GST invoice"}{saved?.pi_number ? ` · PI ${saved.pi_number}` : ""}</Typography>
                </Box>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {loading || !form ? (
                    <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
                        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                        {/* kind badge (fixed per page) */}
                        <Box>
                            <Box sx={{ display: "inline-flex", alignItems: "center", px: 1.5, py: 0.75, borderRadius: 2, border: "2px solid", borderColor: PRIMARY, bgcolor: "#EFF6FF" }}>
                                <Typography sx={{ fontWeight: 700, fontSize: 13, color: PRIMARY }}>
                                    {kind === "SERVICE" ? "Service Tax Invoice" : "Tax Invoice (Product)"}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Company header */}
                        <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                            <Typography sx={{ ...labelSx, color: PRIMARY }}>Company Header</Typography>
                            <Grid container spacing={2}>{renderFields(COMPANY_FIELDS)}</Grid>
                        </Box>

                        {/* Invoice meta */}
                        <Box>
                            <Typography sx={{ ...labelSx, color: PRIMARY }}>Invoice Details</Typography>
                            <Grid container spacing={2}>{renderFields(PARTY_FIELDS(kind))}</Grid>
                        </Box>

                        {/* Bill / Ship */}
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 3, border: "1px solid", borderColor: "divider", height: "100%" }}>
                                    <Typography sx={{ ...labelSx, color: PRIMARY }}>Bill To Party</Typography>
                                    <Grid container spacing={2}>{BILL_FIELDS.map(([k, lbl, type]) => (
                                        <Grid item xs={12} sm={type === "area" ? 12 : 6} key={k}>
                                            <Typography sx={labelSx}>{lbl}</Typography>
                                            <TextField value={form[k] ?? ""} onChange={(e) => setField(k, e.target.value)} fullWidth size="small" multiline={type === "area"} minRows={type === "area" ? 2 : undefined} sx={inputSx} />
                                        </Grid>))}</Grid>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 3, border: "1px solid", borderColor: "divider", height: "100%" }}>
                                    <Typography sx={{ ...labelSx, color: PRIMARY }}>Shipping Address</Typography>
                                    <Grid container spacing={2}>{SHIP_FIELDS.map(([k, lbl, type]) => (
                                        <Grid item xs={12} sm={type === "area" ? 12 : 6} key={k}>
                                            <Typography sx={labelSx}>{lbl}</Typography>
                                            <TextField value={form[k] ?? ""} onChange={(e) => setField(k, e.target.value)} fullWidth size="small" multiline={type === "area"} minRows={type === "area" ? 2 : undefined} sx={inputSx} />
                                        </Grid>))}</Grid>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Items */}
                        <Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography sx={{ ...labelSx, color: PRIMARY }}>Items (GST)</Typography>
                                <Button type="button" size="small" startIcon={<AddIcon />} onClick={addItem} sx={{ textTransform: "none", fontWeight: 700 }}>Add Item</Button>
                            </Box>
                            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "auto" }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                            {["Description", kind === "SERVICE" ? "SAC Code" : "H.S. Code", "Qty", "Unit", "Rate", "Taxable", "SGST%", "CGST%", "IGST%", "Total", ""].map((h, i) => (
                                                <TableCell key={i} sx={{ fontWeight: 700, fontSize: 10 }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {items.map((it, idx) => {
                                            const c = calc(it);
                                            return (
                                                <TableRow key={idx}>
                                                    <TableCell sx={{ minWidth: 180 }}><TextField value={it.description} onChange={(e) => setItem(idx, "description", e.target.value)} size="small" variant="standard" fullWidth multiline /></TableCell>
                                                    <TableCell><TextField value={it.hs_sac_code} onChange={(e) => setItem(idx, "hs_sac_code", e.target.value)} size="small" variant="standard" sx={{ width: 80 }} /></TableCell>
                                                    <TableCell><TextField type="number" value={it.quantity} onChange={(e) => setItem(idx, "quantity", e.target.value)} size="small" variant="standard" sx={{ width: 50 }} /></TableCell>
                                                    <TableCell><TextField value={it.unit} onChange={(e) => setItem(idx, "unit", e.target.value)} size="small" variant="standard" sx={{ width: 50 }} /></TableCell>
                                                    <TableCell><TextField type="number" value={it.rate} onChange={(e) => setItem(idx, "rate", e.target.value)} size="small" variant="standard" sx={{ width: 90 }} /></TableCell>
                                                    <TableCell><TextField type="number" value={it.taxable_value} onChange={(e) => setItem(idx, "taxable_value", e.target.value)} placeholder={c.amount.toFixed(2)} size="small" variant="standard" sx={{ width: 90 }} /></TableCell>
                                                    <TableCell><TextField type="number" value={it.sgst_rate} onChange={(e) => setItem(idx, "sgst_rate", e.target.value)} size="small" variant="standard" sx={{ width: 45 }} /></TableCell>
                                                    <TableCell><TextField type="number" value={it.cgst_rate} onChange={(e) => setItem(idx, "cgst_rate", e.target.value)} size="small" variant="standard" sx={{ width: 45 }} /></TableCell>
                                                    <TableCell><TextField type="number" value={it.igst_rate} onChange={(e) => setItem(idx, "igst_rate", e.target.value)} size="small" variant="standard" sx={{ width: 45 }} /></TableCell>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, textAlign: "right" }}>{f2(c.total)}</TableCell>
                                                    <TableCell><IconButton size="small" onClick={() => removeItem(idx)}><DeleteIcon sx={{ fontSize: 16, color: "error.light" }} /></IconButton></TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Box>
                            {/* totals */}
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 3, mt: 1.5, flexWrap: "wrap" }}>
                                <Typography sx={{ fontSize: 13 }}>Before Tax: <b>₹{f2(totBefore)}</b></Typography>
                                <Typography sx={{ fontSize: 13 }}>Tax: <b>₹{f2(totTax)}</b></Typography>
                                <Typography sx={{ fontSize: 14, color: PRIMARY }}>After Tax: <b>₹{f2(totAfter)}</b></Typography>
                            </Box>
                        </Box>

                        {/* Bank */}
                        <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                            <Typography sx={{ ...labelSx, color: PRIMARY }}>Bank Detail</Typography>
                            <Grid container spacing={2}>{renderFields(BANK_FIELDS)}</Grid>
                        </Box>

                        {/* Terms */}
                        <Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography sx={{ ...labelSx, color: PRIMARY }}>Terms of Payment</Typography>
                                <Button type="button" size="small" startIcon={<AddIcon />} onClick={() => setTerms(t => [...t, ""])} sx={{ textTransform: "none", fontWeight: 700 }}>Add</Button>
                            </Box>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                {terms.map((t, i) => (
                                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                        <Typography sx={{ fontSize: 12, color: "text.disabled", minWidth: 18 }}>{i + 1}.</Typography>
                                        <TextField value={t} onChange={(e) => setTerms(arr => arr.map((x, j) => j === i ? e.target.value : x))} fullWidth size="small" sx={inputSx} />
                                        <IconButton size="small" onClick={() => setTerms(arr => arr.filter((_, j) => j !== i))}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 700, color: "text.secondary" }}>Close</Button>
                {saved && (
                    <>
                        <Tooltip title="Download PDF"><Button type="button" onClick={handlePdf} startIcon={<PictureAsPdfIcon />} sx={{ textTransform: "none", fontWeight: 700 }}>PDF</Button></Tooltip>
                        <Tooltip title="Download Excel"><Button type="button" onClick={handleExcel} startIcon={<GridOnIcon />} sx={{ textTransform: "none", fontWeight: 700, color: "#15803D" }}>Excel</Button></Tooltip>
                        <Divider orientation="vertical" flexItem />
                    </>
                )}
                <Button type="button" onClick={handleSave} variant="contained" disabled={submitting || loading} startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />} sx={{ textTransform: "none", fontWeight: 700, bgcolor: PRIMARY }}>
                    {submitting ? "Saving..." : (isEdit ? "Update" : "Create")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TaxInvoiceModal;
