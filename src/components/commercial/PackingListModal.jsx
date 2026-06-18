import { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
    IconButton, Button, TextField, Table, TableHead, TableBody,
    TableRow, TableCell, Alert, CircularProgress, Divider, Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GridOnIcon from "@mui/icons-material/GridOn";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";

import {
    getPackingListPrefill, getPackingListById, getCommercialInvoiceById,
    createPackingList, updatePackingList, downloadPackingListExcel,
} from "../../services/commercialService";
import { PackingListPDF } from "./CommercialDocPDF";

const PRIMARY = "#0E7490";
const labelSx = { fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 };
const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: 2 }, "& .MuiInputBase-input": { fontSize: 13 } };

const PackingListModal = ({ isOpen, onClose, onSuccess, commercialInvoiceId, plId = null }) => {
    const isEdit = !!plId;
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState(null);
    const [items, setItems] = useState([]);
    const [ciData, setCiData] = useState(null);   // full CI header for PDF
    const [savedPL, setSavedPL] = useState(null);

    useEffect(() => {
        if (!isOpen) return;
        setError(""); setSavedPL(null);
        const load = async () => {
            setLoading(true);
            try {
                let data, ciId;
                if (isEdit) {
                    data = await getPackingListById(plId);
                    ciId = data.commercial_invoice;
                    setSavedPL(data);
                } else {
                    data = await getPackingListPrefill(commercialInvoiceId);
                    ciId = data.commercial_invoice;
                }
                const { items: its, ...rest } = data;
                setForm(rest);
                setItems(its || []);
                const ci = await getCommercialInvoiceById(ciId);
                setCiData(ci);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.error || "Failed to load packing list data");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isOpen, plId, commercialInvoiceId]);

    const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const setItem = (idx, k, v) => setItems(p => p.map((it, i) => i === idx ? { ...it, [k]: v } : it));

    const totNett = items.reduce((s, it) => s + Number(it.nett_weight || 0), 0);
    const totGross = items.reduce((s, it) => s + Number(it.gross_weight || 0), 0);

    const buildPayload = () => ({
        commercial_invoice: form.commercial_invoice,
        packing_specification: form.packing_specification || "",
        lut_no: form.lut_no || "",
        items: items.map((it, i) => ({
            id: it.id, ci_item: it.ci_item, marks_nos: it.marks_nos, no_kind_pkgs: it.no_kind_pkgs,
            description: it.description, hs_code: it.hs_code, quantity: Number(it.quantity || 0), unit: it.unit,
            nett_weight: Number(it.nett_weight || 0), gross_weight: Number(it.gross_weight || 0), sort_order: i,
        })),
    });

    const handleSave = async () => {
        setSubmitting(true); setError("");
        try {
            if (items.length === 0) throw new Error("At least one item is required");
            const payload = buildPayload();
            const pl = isEdit ? await updatePackingList(plId, payload) : await createPackingList(payload);
            setSavedPL(pl);
            toast.success(`Packing List ${pl.pl_number} saved`);
            onSuccess?.(pl);
        } catch (err) {
            console.error(err);
            const d = err.response?.data;
            setError(typeof d === "string" ? d : (d ? Object.values(d).flat().join(" | ") : err.message));
            toast.error("Failed to save Packing List");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePdf = async () => {
        if (!savedPL || !ciData) return;
        const blob = await pdf(<PackingListPDF pl={{ ...savedPL, commercial_invoice_data: ciData }} />).toBlob();
        saveAs(blob, `${savedPL.pl_number.replace(/\//g, "_")}.pdf`);
    };
    const handleExcel = async () => {
        if (!savedPL) return;
        const blob = await downloadPackingListExcel(savedPL.id);
        saveAs(blob, `${savedPL.pl_number.replace(/\//g, "_")}.xlsx`);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4, maxHeight: "92vh" } }}>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{isEdit ? "Edit" : "Create"} Packing List</Typography>
                    <Typography variant="caption" color="text.disabled">
                        {savedPL?.pl_number ? savedPL.pl_number : "Weights & packing"}{ciData?.ci_number ? ` · CI ${ciData.ci_number}` : ""}
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

                        <Box>
                            <Typography sx={labelSx}>Items — enter Nett & Gross weight (Kgs)</Typography>
                            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "auto" }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 10 }}>Marks & Nos</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 10 }}>No & Kind of Pkgs</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 10 }}>Description</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 10, width: 80 }}>Qty</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 10, width: 120 }}>Nett Wt (Kgs)</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: 10, width: 120 }}>Gross Wt (Kgs)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {items.map((it, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell sx={{ fontSize: 12 }}>{it.marks_nos}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{it.no_kind_pkgs}</TableCell>
                                                <TableCell sx={{ fontSize: 12, whiteSpace: "pre-line" }}>{it.description}</TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{`${Number(it.quantity || 0)} ${it.unit || ""}`}</TableCell>
                                                <TableCell><TextField type="number" inputProps={{ step: "0.001" }} value={it.nett_weight} onChange={(e) => setItem(idx, "nett_weight", e.target.value)} size="small" variant="standard" /></TableCell>
                                                <TableCell><TextField type="number" inputProps={{ step: "0.001" }} value={it.gross_weight} onChange={(e) => setItem(idx, "gross_weight", e.target.value)} size="small" variant="standard" /></TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                            <TableCell colSpan={4} sx={{ textAlign: "right", fontWeight: 700, fontSize: 12 }}>Total</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: 12 }}>{totNett.toFixed(3)} Kgs.</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: 12 }}>{totGross.toFixed(3)} Kgs.</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Box>
                        </Box>

                        <Box>
                            <Typography sx={labelSx}>Packing Specification</Typography>
                            <TextField value={form.packing_specification || ""} onChange={(e) => setField("packing_specification", e.target.value)} fullWidth size="small" multiline minRows={2} sx={inputSx} />
                        </Box>
                        <Box sx={{ maxWidth: 360 }}>
                            <Typography sx={labelSx}>LUT No & Date</Typography>
                            <TextField value={form.lut_no || ""} onChange={(e) => setField("lut_no", e.target.value)} fullWidth size="small" sx={inputSx} />
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
                <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 700, color: "text.secondary" }}>Close</Button>
                {savedPL && (
                    <>
                        <Tooltip title="Download PDF"><Button type="button" onClick={handlePdf} startIcon={<PictureAsPdfIcon />} sx={{ textTransform: "none", fontWeight: 700 }}>PDF</Button></Tooltip>
                        <Tooltip title="Download Excel"><Button type="button" onClick={handleExcel} startIcon={<GridOnIcon />} sx={{ textTransform: "none", fontWeight: 700, color: "#15803D" }}>Excel</Button></Tooltip>
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

export default PackingListModal;
