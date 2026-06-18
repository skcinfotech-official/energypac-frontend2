import { useState, useEffect, useCallback } from "react";
import {
    Box, Card, Typography, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Tooltip, Chip,
    CircularProgress, InputAdornment, Menu, MenuItem, ListItemIcon, ListItemText,
} from "@mui/material";
import {
    Search as SearchIcon, Edit as EditIcon,
    PictureAsPdf as PdfIcon, GridOn as ExcelIcon,
    Inventory2 as PackingIcon, MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";

import {
    getCommercialInvoices, downloadCommercialInvoiceExcel, getPackingLists,
} from "../services/commercialService";
import { CommercialInvoicePDF } from "../components/commercial/CommercialDocPDF";
import CommercialInvoiceModal from "../components/commercial/CommercialInvoiceModal";
import PackingListModal from "../components/commercial/PackingListModal";
import AlertToast from "../components/ui/AlertToast";

const fmt2 = (v) => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusChip = (status) => {
    const map = {
        GENERATED: { bg: "#E0F2FE", color: "#0369A1" },
        DRAFT: { bg: "#F1F5F9", color: "#475569" },
        CANCELLED: { bg: "#FEE2E2", color: "#B91C1C" },
    };
    const s = map[status] || map.DRAFT;
    return <Chip label={status} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 10, height: 20 }} />;
};

const CommercialInvoiceList = () => {
    const [search, setSearch] = useState("");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [ciModal, setCiModal] = useState({ open: false, ciId: null });
    const [plModal, setPlModal] = useState({ open: false, ciId: null, plId: null });

    const [actionMenu, setActionMenu] = useState({ anchorEl: null, ci: null });
    const openActionMenu = (e, ci) => { e.stopPropagation(); setActionMenu({ anchorEl: e.currentTarget, ci }); };
    const closeActionMenu = () => setActionMenu({ anchorEl: null, ci: null });
    const runAction = (fn) => () => { const ci = actionMenu.ci; closeActionMenu(); fn(ci); };

    const fetchData = useCallback(async (q = "") => {
        setLoading(true);
        try {
            const data = await getCommercialInvoices({ search: q });
            setRows(data?.results || data || []);
        } catch (err) {
            console.error("Failed to load commercial invoices", err);
            setAlert({ open: true, type: "error", message: "Failed to load commercial invoices" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => fetchData(search), 300);
        return () => clearTimeout(t);
    }, [search, fetchData]);

    const handlePdf = async (ci) => {
        try {
            const blob = await pdf(<CommercialInvoicePDF ci={ci} />).toBlob();
            saveAs(blob, `${ci.ci_number.replace(/\//g, "_")}.pdf`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate PDF");
        }
    };

    const handleExcel = async (ci) => {
        try {
            const blob = await downloadCommercialInvoiceExcel(ci.id);
            saveAs(blob, `${ci.ci_number.replace(/\//g, "_")}.xlsx`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to download Excel");
        }
    };

    const openPackingList = async (ci) => {
        try {
            const data = await getPackingLists({ commercial_invoice: ci.id });
            const list = data?.results || data || [];
            if (list.length > 0) {
                setPlModal({ open: true, ciId: ci.id, plId: list[0].id });
            } else {
                setPlModal({ open: true, ciId: ci.id, plId: null });
            }
        } catch (err) {
            console.error(err);
            setPlModal({ open: true, ciId: ci.id, plId: null });
        }
    };

    return (
        <Box sx={{ p: { xs: 0.5, sm: 1 } }}>
            <Card>
                <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Commercial Invoices</Typography>
                        <Typography variant="caption" color="text.disabled">Export invoices &amp; packing lists — view, edit, download PDF/Excel</Typography>
                    </Box>
                    <TextField
                        size="small"
                        placeholder="Search CI / PI / Invoice No..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                        sx={{ minWidth: 280 }}
                    />
                </Box>

                <TableContainer>
                    <Table size="small" sx={{ "& .MuiTableCell-root": { fontSize: "0.72rem" } }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                {["CI Number", "PI Number", "Invoice No", "Date", "Currency", "CPT Value", "Status", "Packing List", "Actions"].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "text.secondary", textAlign: h === "Actions" ? "center" : "left" }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={9} sx={{ textAlign: "center", py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
                            ) : rows.length === 0 ? (
                                <TableRow><TableCell colSpan={9} sx={{ textAlign: "center", py: 6, fontStyle: "italic", color: "text.disabled" }}>No commercial invoices found</TableCell></TableRow>
                            ) : rows.map(ci => (
                                <TableRow key={ci.id} hover>
                                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: "#0E7490" }}>{ci.ci_number}</TableCell>
                                    <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{ci.pi_number}</TableCell>
                                    <TableCell sx={{ fontSize: 12 }}>{ci.invoice_no || "—"}</TableCell>
                                    <TableCell sx={{ fontSize: 12 }}>{ci.invoice_date || "—"}</TableCell>
                                    <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{ci.currency}</TableCell>
                                    <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{fmt2(ci.total_cpt_value)}</TableCell>
                                    <TableCell>{statusChip(ci.status)}</TableCell>
                                    <TableCell>
                                        {ci.has_packing_list
                                            ? <Chip label="Created" size="small" sx={{ bgcolor: "#DCFCE7", color: "#15803D", fontWeight: 700, fontSize: 10, height: 20 }} />
                                            : <Chip label="None" size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                                            <Tooltip title="Actions"><IconButton size="small" onClick={(e) => openActionMenu(e, ci)}><MoreVertIcon fontSize="small" /></IconButton></Tooltip>
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
                PaperProps={{ sx: { borderRadius: 2, minWidth: 220, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" } }}
            >
                <MenuItem onClick={runAction((ci) => setCiModal({ open: true, ciId: ci.id }))}>
                    <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Edit Commercial Invoice</ListItemText>
                </MenuItem>
                <MenuItem onClick={runAction((ci) => handlePdf(ci))}>
                    <ListItemIcon><PdfIcon fontSize="small" sx={{ color: "#b91c1c" }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Download PDF</ListItemText>
                </MenuItem>
                <MenuItem onClick={runAction((ci) => handleExcel(ci))}>
                    <ListItemIcon><ExcelIcon fontSize="small" sx={{ color: "#15803D" }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>Download Excel</ListItemText>
                </MenuItem>
                <MenuItem onClick={runAction((ci) => openPackingList(ci))}>
                    <ListItemIcon><PackingIcon fontSize="small" sx={{ color: "#B45309" }} /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}>
                        {actionMenu.ci?.has_packing_list ? "View / Edit Packing List" : "Create Packing List"}
                    </ListItemText>
                </MenuItem>
            </Menu>

            {ciModal.open && (
                <CommercialInvoiceModal
                    isOpen={ciModal.open}
                    ciId={ciModal.ciId}
                    onClose={() => setCiModal({ open: false, ciId: null })}
                    onGeneratePackingList={(ci) => { setCiModal({ open: false, ciId: null }); openPackingList(ci); }}
                    onSuccess={() => { fetchData(search); }}
                />
            )}

            {plModal.open && (
                <PackingListModal
                    isOpen={plModal.open}
                    commercialInvoiceId={plModal.ciId}
                    plId={plModal.plId}
                    onClose={() => setPlModal({ open: false, ciId: null, plId: null })}
                    onSuccess={() => { fetchData(search); }}
                />
            )}

            <AlertToast open={alert.open} type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, open: false })} />
        </Box>
    );
};

export default CommercialInvoiceList;
