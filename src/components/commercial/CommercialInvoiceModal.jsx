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
import Inventory2Icon from "@mui/icons-material/Inventory2";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";

import {
    getCommercialInvoicePrefill, getCommercialInvoiceById,
    createCommercialInvoice, updateCommercialInvoice, downloadCommercialInvoiceExcel,
} from "../../services/commercialService";
import { CommercialInvoicePDF } from "./CommercialDocPDF";

const PRIMARY = "#0E7490";
const labelSx = { fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 };
const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: 2 }, "& .MuiInputBase-input": { fontSize: 13 } };

const HEADER_FIELDS = [
    ["invoice_no", "Invoice No"], ["invoice_date", "Invoice Date", "date"],
    ["marks_from", "Marks & Nos — From"], ["marks_to", "Marks & Nos — To"],
    ["buyers_order_no", "Buyers Order No"], ["buyers_order_date", "Buyers Order Date", "date"],
    ["exporters_ref", "Exporters Ref (IEC)"], ["gst_no", "GST No"],
    ["place_of_supply", "Place of Supply"], ["vessel_flight_no", "Vessel/Flight No"],
    ["port_of_loading", "Port of Loading"], ["port_of_discharge", "Port of Discharge"],
    ["place_of_delivery", "Place of Delivery"], ["pre_carriage_by", "Pre-carriage by"],
    ["place_of_receipt", "Place of Receipt"], ["country_of_origin", "Country of Origin"],
    ["final_destination", "Final Destination"], ["lut_no", "LUT No & Date"],
];
const TEXTAREAS = [
    ["exporter", "Exporter"], ["consigned_to_order_of", "Consigned to the order of"],
    ["importer_notify_party", "Importer/Notify Party"], ["applicant", "Applicant"],
    ["terms_of_delivery", "Terms of Delivery"],
    ["terms_of_delivery_and_payment", "Terms of Delivery and Payment"],
];

const blankItem = () => ({
    marks_nos: "", no_kind_pkgs: "", description: "", hs_code: "",
    quantity: 1, unit: "Nos.", unit_price: 0,
});

const CommercialInvoiceModal = ({ isOpen, onClose, onSuccess, proformaInvoiceId, ciId = null, onGeneratePackingList }) => {
    const isEdit = !!ciId;
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState(null);
    const [items, setItems] = useState([]);
    const [declarations, setDeclarations] = useState([]);
    const [savedCI, setSavedCI] = useState(null);   // full CI after save (for exports)

    useEffect(() => {
        if (!isOpen) return;
        setError(""); setSavedCI(null);
        const load = async () => {
            setLoading(true);
            try {
                let data;
                if (isEdit) {
                    data = await getCommercialInvoiceById(ciId);
                    setSavedCI(data);
                } else {
                    data = await getCommercialInvoicePrefill(proformaInvoiceId);
                }
                const { items: its, declarations: decs, ...rest } = data;
                setForm(rest);
                setItems((its || []).map(i => ({ ...blankItem(), ...i })));
                setDeclarations(decs || []);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.error || "Failed to load commercial invoice data");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isOpen, ciId, proformaInvoiceId]);

    const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const setItem = (idx, k, v) => setItems(p => p.map((it, i) => i === idx ? { ...it, [k]: v } : it));
    const addItem = () => setItems(p => [...p, blankItem()]);
    const removeItem = (idx) => setItems(p => p.filter((_, i) => i !== idx));

    const fcaTotal = items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
    const cptTotal = fcaTotal + Number(form?.total_freight || 0);

    const buildPayload = () => ({
        proforma_invoice: form.proforma_invoice,
        invoice_no: form.invoice_no || "", invoice_date: form.invoice_date || null,
        exporters_ref: form.exporters_ref || "", gst_no: form.gst_no || "",
        buyers_order_no: form.buyers_order_no || "", buyers_order_date: form.buyers_order_date || null,
        exporter: form.exporter || "", consigned_to_order_of: form.consigned_to_order_of || "",
        importer_notify_party: form.importer_notify_party || "", applicant: form.applicant || "",
        terms_of_delivery: form.terms_of_delivery || "",
        terms_of_delivery_and_payment: form.terms_of_delivery_and_payment || "",
        place_of_supply: form.place_of_supply || "", vessel_flight_no: form.vessel_flight_no || "",
        port_of_loading: form.port_of_loading || "", port_of_discharge: form.port_of_discharge || "",
        place_of_delivery: form.place_of_delivery || "", pre_carriage_by: form.pre_carriage_by || "",
        place_of_receipt: form.place_of_receipt || "", country_of_origin: form.country_of_origin || "",
        final_destination: form.final_destination || "",
        marks_from: form.marks_from || "", marks_to: form.marks_to || "",
        currency: form.currency || "USD",
        total_freight: Number(form.total_freight || 0),
        project_name: form.project_name || "", declarations: declarations.filter(d => d.trim() !== ""),
        lut_no: form.lut_no || "",
        items: items.map((it, i) => ({
            id: it.id, pi_item: it.pi_item, marks_nos: it.marks_nos, no_kind_pkgs: it.no_kind_pkgs,
            description: it.description, hs_code: it.hs_code, quantity: Number(it.quantity || 0),
            unit: it.unit, unit_price: Number(it.unit_price || 0), sort_order: i,
        })),
    });

    const handleSave = async () => {
        setSubmitting(true); setError("");
        try {
            if (items.length === 0) throw new Error("At least one item is required");
            const payload = buildPayload();
            const ci = isEdit ? await updateCommercialInvoice(ciId, payload) : await createCommercialInvoice(payload);
            setSavedCI(ci);
            toast.success(`Commercial Invoice ${ci.ci_number} saved`);
            onSuccess?.(ci);
        } catch (err) {
            console.error(err);
            const d = err.response?.data;
            setError(typeof d === "string" ? d : (d ? Object.values(d).flat().join(" | ") : err.message));
            toast.error("Failed to save Commercial Invoice");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePdf = async () => {
        if (!savedCI) return;
        const blob = await pdf(<CommercialInvoicePDF ci={savedCI} />).toBlob();
        saveAs(blob, `${savedCI.ci_number.replace(/\//g, "_")}.pdf`);
    };
    const handleExcel = async () => {
        if (!savedCI) return;
        const blob = await downloadCommercialInvoiceExcel(savedCI.id);
        saveAs(blob, `${savedCI.ci_number.replace(/\//g, "_")}.xlsx`);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4, maxHeight: "92vh" } }}>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{isEdit ? "Edit" : "Create"} Commercial Invoice</Typography>
                    <Typography variant="caption" color="text.disabled">
                        {savedCI?.ci_number ? savedCI.ci_number : "Export billing — no GST"}{savedCI?.pi_number ? ` · PI ${savedCI.pi_number}` : ""}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {loading || !form ? (
                    <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
                        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                        {/* Party / multiline blocks */}
                        <Grid container spacing={2}>
                            {TEXTAREAS.map(([k, lbl]) => (
                                <Grid item xs={12} md={6} key={k}>
                                    <Typography sx={labelSx}>{lbl}</Typography>
                                    <TextField value={form[k] || ""} onChange={(e) => setField(k, e.target.value)} fullWidth size="small" multiline minRows={2} sx={inputSx} />
                                </Grid>
                            ))}
                        </Grid>

                        {/* Header scalar fields */}
                        <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                            <Grid container spacing={2}>
                                {HEADER_FIELDS.map(([k, lbl, type]) => (
                                    <Grid item xs={12} sm={6} md={3} key={k}>
                                        <Typography sx={labelSx}>{lbl}</Typography>
                                        <TextField type={type || "text"} value={form[k] || ""} onChange={(e) => setField(k, e.target.value)} fullWidth size="small" sx={inputSx} InputLabelProps={type === "date" ? { shrink: true } : undefined} />
                                    </Grid>
                                ))}
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography sx={labelSx}>Currency</Typography>
                                    <TextField value={form.currency || "USD"} onChange={(e) => setField("currency", e.target.value)} fullWidth size="small" sx={inputSx} />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Items */}
                        <Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography sx={labelSx}>Items</Typography>
                                <Button type="button" size="small" startIcon={<AddIcon />} onClick={addItem} sx={{ textTransform: "none", fontWeight: 700 }}>Add Item</Button>
                            </Box>
                            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "auto" }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 10 }}>No & Kind of Pkgs</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 10 }}>Description</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 10, width: 110 }}>HS Code</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 10, width: 70 }}>Qty</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 10, width: 70 }}>Unit</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 10, width: 100 }}>Unit Price</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 10, width: 100, textAlign: "right" }}>Total</TableCell>
                                            <TableCell sx={{ width: 40 }} />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {items.map((it, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell><TextField value={it.no_kind_pkgs} onChange={(e) => setItem(idx, "no_kind_pkgs", e.target.value)} size="small" variant="standard" /></TableCell>
                                                <TableCell><TextField value={it.description} onChange={(e) => setItem(idx, "description", e.target.value)} size="small" variant="standard" multiline fullWidth /></TableCell>
                                                <TableCell><TextField value={it.hs_code} onChange={(e) => setItem(idx, "hs_code", e.target.value)} size="small" variant="standard" placeholder="8537.20.00" /></TableCell>
                                                <TableCell><TextField type="number" value={it.quantity} onChange={(e) => setItem(idx, "quantity", e.target.value)} size="small" variant="standard" /></TableCell>
                                                <TableCell><TextField value={it.unit} onChange={(e) => setItem(idx, "unit", e.target.value)} size="small" variant="standard" /></TableCell>
                                                <TableCell><TextField type="number" value={it.unit_price} onChange={(e) => setItem(idx, "unit_price", e.target.value)} size="small" variant="standard" /></TableCell>
                                                <TableCell sx={{ textAlign: "right", fontWeight: 700, fontSize: 12 }}>{(Number(it.quantity || 0) * Number(it.unit_price || 0)).toFixed(2)}</TableCell>
                                                <TableCell><IconButton size="small" onClick={() => removeItem(idx)}><DeleteIcon sx={{ fontSize: 16, color: "error.light" }} /></IconButton></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Box>

                        {/* Freight + totals */}
                        <Grid container spacing={2} alignItems="center" justifyContent="flex-end">
                            <Grid item xs={12} md={3}>
                                <Typography sx={labelSx}>Total Freight ({form.currency})</Typography>
                                <TextField type="number" value={form.total_freight || 0} onChange={(e) => setField("total_freight", e.target.value)} fullWidth size="small" sx={inputSx} />
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography sx={labelSx}>FCA Value</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{form.currency} {fcaTotal.toFixed(2)}</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Typography sx={labelSx}>CPT Value (FCA + Freight)</Typography>
                                <Typography sx={{ fontWeight: 800, color: PRIMARY }}>{form.currency} {cptTotal.toFixed(2)}</Typography>
                            </Grid>
                        </Grid>

                        {/* Project + declarations */}
                        <Box>
                            <Typography sx={labelSx}>Project Name</Typography>
                            <TextField value={form.project_name || ""} onChange={(e) => setField("project_name", e.target.value)} fullWidth size="small" multiline minRows={2} sx={inputSx} />
                        </Box>
                        <Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography sx={labelSx}>Declarations</Typography>
                                <Button type="button" size="small" startIcon={<AddIcon />} onClick={() => setDeclarations(d => [...d, ""])} sx={{ textTransform: "none", fontWeight: 700 }}>Add</Button>
                            </Box>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                {declarations.map((d, i) => (
                                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                        <Typography sx={{ fontSize: 12, color: "text.disabled", minWidth: 18 }}>{i + 1}.</Typography>
                                        <TextField value={d} onChange={(e) => setDeclarations(arr => arr.map((x, j) => j === i ? e.target.value : x))} fullWidth size="small" sx={inputSx} />
                                        <IconButton size="small" onClick={() => setDeclarations(arr => arr.filter((_, j) => j !== i))}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 700, color: "text.secondary" }}>Close</Button>
                {savedCI && (
                    <>
                        <Tooltip title="Download PDF"><Button type="button" onClick={handlePdf} startIcon={<PictureAsPdfIcon />} sx={{ textTransform: "none", fontWeight: 700 }}>PDF</Button></Tooltip>
                        <Tooltip title="Download Excel"><Button type="button" onClick={handleExcel} startIcon={<GridOnIcon />} sx={{ textTransform: "none", fontWeight: 700, color: "#15803D" }}>Excel</Button></Tooltip>
                        {onGeneratePackingList && (
                            <Button type="button" onClick={() => onGeneratePackingList(savedCI)} startIcon={<Inventory2Icon />} variant="outlined" sx={{ textTransform: "none", fontWeight: 700 }}>Packing List</Button>
                        )}
                        <Divider orientation="vertical" flexItem />
                    </>
                )}
                <Button type="button" onClick={handleSave} variant="contained" disabled={submitting || loading} startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />} sx={{ textTransform: "none", fontWeight: 700, bgcolor: PRIMARY, "&:hover": { bgcolor: "#155E63" } }}>
                    {submitting ? "Saving..." : (isEdit ? "Update" : "Create")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CommercialInvoiceModal;
