import { useState, useEffect, useCallback } from "react";
import {
    Box, Card, Typography, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Tooltip, Chip,
    CircularProgress, InputAdornment, Button, Menu, MenuItem, ListItemIcon, ListItemText,
} from "@mui/material";
import {
    Search as SearchIcon, Edit as EditIcon,
    PictureAsPdf as PdfIcon, GridOn as ExcelIcon, Add as AddIcon,
    MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";

import { getTaxInvoices, downloadTaxInvoiceExcel } from "../services/domesticService";
import TaxInvoiceDocPDF from "../components/domestic/TaxInvoiceDocPDF";
import TaxInvoiceModal from "../components/domestic/TaxInvoiceModal";
import AlertToast from "../components/ui/AlertToast";

const PRIMARY_C = "#1565C0";
const f2 = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusChip = (st) => {
    const map = { GENERATED: { bg: "#E0F2FE", c: "#0369A1" }, DRAFT: { bg: "#F1F5F9", c: "#475569" }, CANCELLED: { bg: "#FEE2E2", c: "#B91C1C" } };
    const x = map[st] || map.DRAFT;
    return <Chip label={st} size="small" sx={{ bgcolor: x.bg, color: x.c, fontWeight: 700, fontSize: 10, height: 20 }} />;
};

const TaxInvoiceList = ({ kind = "PRODUCT" }) => {
    const isService = kind === "SERVICE";
    const [search, setSearch] = useState("");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [modal, setModal] = useState({ open: false, tiId: null });
    const closeModal = () => setModal({ open: false, tiId: null });

    const [actionMenu, setActionMenu] = useState({ anchorEl: null, ti: null });
    const openActionMenu = (e, ti) => { e.stopPropagation(); setActionMenu({ anchorEl: e.currentTarget, ti }); };
    const closeActionMenu = () => setActionMenu({ anchorEl: null, ti: null });
    const runAction = (fn) => () => { const ti = actionMenu.ti; closeActionMenu(); fn(ti); };

    const fetchData = useCallback(async (q = "") => {
        setLoading(true);
        try {
            const data = await getTaxInvoices({ search: q, kind });
            setRows(data?.results || data || []);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, type: "error", message: "Failed to load tax invoices" });
        } finally {
            setLoading(false);
        }
    }, [kind]);

    useEffect(() => {
        const t = setTimeout(() => fetchData(search), 300);
        return () => clearTimeout(t);
    }, [search, fetchData]);

    const handlePdf = async (ti) => {
        try {
            const blob = await pdf(<TaxInvoiceDocPDF ti={ti} />).toBlob();
            saveAs(blob, `${ti.ti_number.replace(/\//g, "_")}.pdf`);
        } catch (err) { console.error(err); toast.error("Failed to generate PDF"); }
    };
    const handleExcel = async (ti) => {
        try {
            const blob = await downloadTaxInvoiceExcel(ti.id);
            saveAs(blob, `${ti.ti_number.replace(/\//g, "_")}.xlsx`);
        } catch (err) { console.error(err); toast.error("Failed to download Excel"); }
    };

    return (
        <Box sx={{ p: { xs: 0.5, sm: 1 } }}>
            <Card>
                <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{isService ? "Service Invoices" : "Tax Invoices (Domestic)"}</Typography>
                        <Typography variant="caption" color="text.disabled">
                            {isService
                                ? "Standalone service GST invoices — create, edit, download PDF/Excel"
                                : "Domestic product GST invoices (from Proforma Invoice) — view, edit, download PDF/Excel"}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                        <TextField size="small" placeholder="Search TI / Invoice / Party..." value={search} onChange={(e) => setSearch(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ minWidth: 300 }} />
                        {isService && (
                            <Button variant="contained" startIcon={<AddIcon />}
                                onClick={() => setModal({ open: true, tiId: null })}
                                sx={{ textTransform: "none", fontWeight: 700, bgcolor: PRIMARY_C, whiteSpace: "nowrap" }}>
                                New Service Invoice
                            </Button>
                        )}
                    </Box>
                </Box>
                <TableContainer>
                    <Table size="small" sx={{ "& .MuiTableCell-root": { fontSize: "0.72rem" } }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                {["TI Number", ...(isService ? [] : ["Type", "PI Number"]), "Invoice No", "Bill To", "After Tax (INR)", "Status", "Actions"].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "text.secondary", textAlign: h === "Actions" ? "center" : "left" }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={isService ? 6 : 8} sx={{ textAlign: "center", py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
                            ) : rows.length === 0 ? (
                                <TableRow><TableCell colSpan={isService ? 6 : 8} sx={{ textAlign: "center", py: 6, fontStyle: "italic", color: "text.disabled" }}>No {isService ? "service" : "tax"} invoices found</TableCell></TableRow>
                            ) : rows.map(ti => (
                                <TableRow key={ti.id} hover>
                                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: PRIMARY_C }}>{ti.ti_number}</TableCell>
                                    {!isService && <TableCell><Chip label={ti.kind === "SERVICE" ? "Service" : "Product"} size="small" sx={{ fontSize: 10, height: 20, fontWeight: 700, bgcolor: ti.kind === "SERVICE" ? "#F5F3FF" : "#ECFEFF", color: ti.kind === "SERVICE" ? "#6D28D9" : "#0E7490" }} /></TableCell>}
                                    {!isService && <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{ti.pi_number || "—"}</TableCell>}
                                    <TableCell sx={{ fontSize: 12 }}>{ti.invoice_no || "—"}</TableCell>
                                    <TableCell sx={{ fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ti.bill_to_name || "—"}</TableCell>
                                    <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{f2(ti.total_amount_after_tax)}</TableCell>
                                    <TableCell>{statusChip(ti.status)}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                                            <Tooltip title="Actions"><IconButton size="small" onClick={(e) => openActionMenu(e, ti)}><MoreVertIcon fontSize="small" /></IconButton></Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            <Menu
                anchorEl={actionMenu.anchorEl}
                open={Boolean(actionMenu.anchorEl)}
                onClose={closeActionMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 190, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" } }}
            >
                <MenuItem onClick={runAction((ti) => setModal({ open: true, tiId: ti.id }))}>
                    <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Edit</ListItemText>
                </MenuItem>
                <MenuItem onClick={runAction((ti) => handlePdf(ti))}>
                    <ListItemIcon><PdfIcon fontSize="small" sx={{ color: "#b91c1c" }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Download PDF</ListItemText>
                </MenuItem>
                <MenuItem onClick={runAction((ti) => handleExcel(ti))}>
                    <ListItemIcon><ExcelIcon fontSize="small" sx={{ color: "#15803D" }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Download Excel</ListItemText>
                </MenuItem>
            </Menu>

            {modal.open && (
                <TaxInvoiceModal
                    isOpen={modal.open}
                    tiId={modal.tiId}
                    proformaInvoiceId={null}
                    initialKind={kind}
                    onClose={closeModal}
                    onSuccess={() => fetchData(search)}
                />
            )}

            <AlertToast open={alert.open} type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, open: false })} />
        </Box>
    );
};

export default TaxInvoiceList;
