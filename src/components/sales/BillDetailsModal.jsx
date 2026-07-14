import { useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
    Table, TableContainer, TableHead, TableBody, TableRow, TableCell,
    CircularProgress, Alert, ToggleButton, ToggleButtonGroup, Divider, Chip, IconButton,
} from "@mui/material";
import {
    Close as CloseIcon,
    FileDownload as FileDownloadIcon,
    Print as PrintIcon,
    ReceiptLong as BillIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getBillById } from "../../services/salesService";
import { pdf } from "@react-pdf/renderer";
import BillPDF from "./BillPDF";
import { toast } from "react-hot-toast";

const getCurrencySymbol = (code) => {
    switch (code?.toUpperCase()) {
        case "USD": return "$";
        case "EUR": return "€";
        case "GBP": return "£";
        case "JPY": return "¥";
        case "CAD": return "C$";
        case "AUD": return "A$";
        case "INR": return "₹";
        default: return code || "₹";
    }
};

const LABEL = {
    fontSize: 10, fontWeight: 900, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.05em",
};
const VALUE = { fontSize: 13, fontWeight: 700, color: "#0f172a", mt: 0.25, wordBreak: "break-word" };
const TH = {
    fontSize: 10, fontWeight: 900, color: "#475569", textTransform: "uppercase",
    letterSpacing: "0.05em", bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0",
    py: 1, whiteSpace: "nowrap",
};
const TD = { fontSize: 13, py: 1, borderBottom: "1px solid #f1f5f9" };

/** One label/value pair. The header is just a grid of these — no nested cards. */
function Field({ label, children }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography sx={LABEL}>{label}</Typography>
            <Box sx={VALUE}>{children || <Box component="span" sx={{ color: "#cbd5e1" }}>—</Box>}</Box>
        </Box>
    );
}

/** One line of the money summary. */
function Line({ label, value, strong, color, small }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", py: 0.4 }}>
            <Typography sx={{ fontSize: small ? 11 : 12.5, color: color || "#64748b", fontWeight: strong ? 800 : 500 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: small ? 11 : 13, fontFamily: "monospace", fontWeight: strong ? 900 : 700, color: color || "#0f172a" }}>
                {value}
            </Typography>
        </Box>
    );
}

const BillDetailsModal = ({ isOpen, onClose, loading, details }) => {
    const [viewCurrency, setViewCurrency] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    if (!isOpen) return null;

    const billCurrency = details?.currency || "INR";
    const convRate = parseFloat(details?.conversion_rate || 1);
    const activeCurrency = viewCurrency || billCurrency;
    const isForeign = billCurrency !== "INR";

    const fmt = (amount, currency) => {
        const curr = currency || activeCurrency;
        const num = Number(amount || 0);
        const locale = curr?.toUpperCase() === "INR" ? "en-IN" : "en-US";
        return `${getCurrencySymbol(curr)} ${num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const toView = (val) => {
        const num = Number(val || 0);
        if (activeCurrency === billCurrency) return num;
        if (activeCurrency === "INR" && isForeign) return num * convRate;
        return num;
    };
    const money = (val) => fmt(toView(val), activeCurrency);

    const handlePrint = async () => {
        if (!details) return;
        setGeneratingPdf(true);
        try {
            const blob = await pdf(<BillPDF details={details} />).toBlob();
            window.open(URL.createObjectURL(blob), "_blank");
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const handleExport = async () => {
        if (!details?.id) return;
        setExporting(true);
        try {
            const data = await getBillById(details.id);
            const wb = XLSX.utils.book_new();

            const wsData = [
                ["BILL DETAILED REPORT"],
                ["Generated At:", new Date().toLocaleString()],
                [],
                ["BILL INFORMATION"],
                ["Bill Number", data.bill_number],
                ["Bill Date", data.bill_date],
                ["Status", data.status],
                ["Created By", data.created_by],
                [],
                ["PROFORMA INVOICE DETAILS"],
                ["PI Number", data.proforma_invoice?.pi_number],
                ["PI Date", data.proforma_invoice?.pi_date],
                ["PI Status", data.proforma_invoice?.status],
                [],
                ["CLIENT INFORMATION"],
                ["Client Name", data.client_details?.name],
                ["Contact Person", data.client_details?.contact_person],
                ["Phone", data.client_details?.phone],
                ["Email", data.client_details?.email],
                ["Address", data.client_details?.address],
                [],
                ["BILL ITEMS"],
                ["Item Code", "Item Name", "Description", "HSN Code", "Unit", "Ordered Qty", "Previously Delivered", "Current Delivered", "Pending Qty", "Rate", "Amount", "Remarks"],
            ];

            (data.items || []).forEach((item) => {
                wsData.push([
                    item.product_code || item.item_code,
                    item.item_name,
                    item.description,
                    item.hsn_code,
                    item.unit,
                    item.ordered_quantity ?? (item.quantity || 0),
                    item.previously_delivered ?? 0,
                    item.delivered_quantity ?? (item.quantity || 0),
                    item.pending_quantity ?? 0,
                    item.rate,
                    item.amount,
                    item.remarks,
                ]);
            });

            wsData.push([]);
            wsData.push(["FINANCIAL SUMMARY"]);
            const financials = data.financial || {};
            wsData.push(["Subtotal", financials.subtotal]);
            if (financials.cgst?.amount > 0) wsData.push([`CGST (${financials.cgst.percentage}%)`, financials.cgst.amount]);
            if (financials.sgst?.amount > 0) wsData.push([`SGST (${financials.sgst.percentage}%)`, financials.sgst.amount]);
            if (financials.igst?.amount > 0) wsData.push([`IGST (${financials.igst.percentage}%)`, financials.igst.amount]);
            wsData.push(["Total Tax", financials.total_tax]);
            wsData.push(["Total Amount", financials.total_amount]);
            wsData.push(["Advance Deducted", financials.advance_deducted]);
            wsData.push(["Net Payable", financials.net_payable]);
            wsData.push(["Amount Paid", financials.amount_paid]);
            wsData.push(["Balance Due", financials.balance]);
            wsData.push([]);
            wsData.push(["Remarks", data.remarks]);

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws["!cols"] = [
                { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 10 }, { wch: 8 },
                { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
                { wch: 15 }, { wch: 20 },
            ];
            XLSX.utils.book_append_sheet(wb, ws, "Bill Details");

            const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            saveAs(
                new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" }),
                `Bill_Details_${data.bill_number.replace(/\//g, "-")}.xlsx`
            );
            toast.success("Bill detailed report downloaded successfully");
        } catch (error) {
            console.error("Failed to export bill details", error);
            toast.error("Failed to export bill details");
        } finally {
            setExporting(false);
        }
    };

    const balance = Number(details?.balance || 0);

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, height: "90vh", display: "flex", flexDirection: "column" } }}
        >
            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <DialogTitle sx={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                bgcolor: "#1a1a2e", color: "white", py: 1.75, px: 2.5, flexShrink: 0, gap: 1,
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                    <BillIcon sx={{ color: "#0ea5e9", fontSize: 22 }} />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 16, textTransform: "uppercase" }}>Bill Details</Typography>
                        <Typography sx={{ color: "#cbd5e1", fontSize: 10, fontFamily: "monospace" }}>
                            {details?.bill_number || "—"}{details?.client_name ? ` · ${details.client_name}` : ""}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {details && (
                        <>
                            <Button
                                size="small" startIcon={<PrintIcon sx={{ fontSize: 15 }} />}
                                onClick={handlePrint} disabled={generatingPdf}
                                sx={{ color: "#cbd5e1", fontWeight: 800, fontSize: 11, textTransform: "uppercase", "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "white" } }}
                            >
                                {generatingPdf ? "PDF…" : "Print"}
                            </Button>
                            <Button
                                size="small" startIcon={<FileDownloadIcon sx={{ fontSize: 15 }} />}
                                onClick={handleExport} disabled={exporting}
                                sx={{ color: "#6ee7b7", fontWeight: 800, fontSize: 11, textTransform: "uppercase", "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
                            >
                                {exporting ? "Exporting…" : "Excel"}
                            </Button>
                        </>
                    )}
                    <IconButton onClick={onClose} size="small" sx={{ color: "#cbd5e1", "&:hover": { color: "white" } }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            {/* ── BODY ───────────────────────────────────────────────────── */}
            <DialogContent sx={{ p: 2, bgcolor: "#f8fafc", flex: 1, overflowY: "auto" }}>
                {loading ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 1.5 }}>
                        <CircularProgress size={32} />
                        <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>Loading bill details…</Typography>
                    </Box>
                ) : !details ? (
                    <Alert severity="error">Failed to load bill details.</Alert>
                ) : (
                    <>
                        {/* Bill + client — one flat grid */}
                        <Box sx={{ p: 2, mb: 2, bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.75, gap: 1, flexWrap: "wrap" }}>
                                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                    <Chip
                                        label={details.status}
                                        size="small"
                                        sx={{
                                            fontWeight: 900, fontSize: 10, height: 22,
                                            bgcolor: details.status === "PAID" ? "#ecfdf5" : details.status === "CANCELLED" ? "#fef2f2" : "#eff6ff",
                                            color: details.status === "PAID" ? "#047857" : details.status === "CANCELLED" ? "#b91c1c" : "#1d4ed8",
                                        }}
                                    />
                                    {details.bill_type && (
                                        <Chip label={details.bill_type} size="small"
                                            sx={{ fontWeight: 900, fontSize: 10, height: 22, bgcolor: "#f1f5f9", color: "#475569" }} />
                                    )}
                                </Box>

                                {/* Currency toggle only matters on a foreign bill */}
                                {isForeign && (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                        <Typography sx={{ fontSize: 10, color: "#7c3aed", fontWeight: 800 }}>
                                            1 {billCurrency} = ₹{convRate.toFixed(2)}
                                        </Typography>
                                        <ToggleButtonGroup
                                            value={activeCurrency} exclusive size="small"
                                            onChange={(_e, v) => v && setViewCurrency(v)}
                                            sx={{ "& .MuiToggleButton-root": { fontSize: 10, fontWeight: 900, px: 1.25, py: 0.3, textTransform: "none" } }}
                                        >
                                            <ToggleButton value={billCurrency}>{billCurrency}</ToggleButton>
                                            <ToggleButton value="INR">INR</ToggleButton>
                                        </ToggleButtonGroup>
                                    </Box>
                                )}
                            </Box>

                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
                                <Field label="Bill No.">
                                    <Box component="span" sx={{ fontFamily: "monospace" }}>{details.bill_number}</Box>
                                </Field>
                                <Field label="Bill Date">{details.bill_date}</Field>
                                <Field label="Proforma Invoice">
                                    <Box component="span" sx={{ fontFamily: "monospace" }}>{details.pi_number}</Box>
                                </Field>
                                <Field label="Created By">{details.created_by_name}</Field>

                                <Field label="Client">{details.client_name}</Field>
                                <Field label="Contact Person">{details.contact_person}</Field>
                                <Field label="Phone">{details.phone}</Field>
                                <Field label="Email">{details.email}</Field>
                            </Box>

                            {(details.address || details.remarks) && (
                                <>
                                    <Divider sx={{ my: 1.75 }} />
                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                                        <Field label="Address">{details.address}</Field>
                                        <Field label="Remarks">{details.remarks}</Field>
                                    </Box>
                                </>
                            )}
                        </Box>

                        {/* Items + money side by side on desktop, stacked on mobile */}
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" }, gap: 2, alignItems: "start" }}>
                            <Box>
                                <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
                                    Bill Items ({details.items?.length || 0})
                                </Typography>
                                <TableContainer sx={{ bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: 2 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ ...TH, width: 36 }}>#</TableCell>
                                                <TableCell sx={TH}>Item</TableCell>
                                                <TableCell sx={TH} align="center">HSN</TableCell>
                                                <TableCell sx={TH} align="right">Qty</TableCell>
                                                <TableCell sx={TH} align="right">Rate</TableCell>
                                                <TableCell sx={TH} align="right">Amount</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {(details.items || []).map((item, idx) => {
                                                const delivered = item.delivered_quantity ?? item.quantity ?? 0;
                                                const ordered = item.ordered_quantity;
                                                return (
                                                    <TableRow key={item.id || idx} hover>
                                                        <TableCell sx={{ ...TD, color: "#94a3b8", fontWeight: 800 }}>{idx + 1}</TableCell>
                                                        <TableCell sx={TD}>
                                                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.item_name}</Typography>
                                                            <Typography sx={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>
                                                                {item.product_code || item.item_code}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ ...TD, fontFamily: "monospace", fontSize: 11, color: "#64748b" }} align="center">
                                                            {item.hsn_code || "—"}
                                                        </TableCell>
                                                        <TableCell sx={{ ...TD, fontWeight: 700 }} align="right">
                                                            {Number(delivered).toFixed(2)}
                                                            <Typography component="span" sx={{ ml: 0.5, fontSize: 10, color: "#94a3b8" }}>{item.unit}</Typography>
                                                            {ordered != null && Number(ordered) !== Number(delivered) && (
                                                                <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>of {Number(ordered).toFixed(2)}</Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell sx={{ ...TD, fontFamily: "monospace" }} align="right">{money(item.rate)}</TableCell>
                                                        <TableCell sx={{ ...TD, fontFamily: "monospace", fontWeight: 800 }} align="right">{money(item.amount)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>

                            {/* Money — one column, no nested paper */}
                            <Box sx={{ bgcolor: "white", border: "1px solid #e2e8f0", borderRadius: 2, p: 2, position: { lg: "sticky" }, top: 0 }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
                                    Summary ({activeCurrency})
                                </Typography>

                                <Line label="Subtotal" value={money(details.subtotal)} />
                                {parseFloat(details.cgst_amount) > 0 && <Line small label={`CGST ${details.cgst_percentage}%`} value={money(details.cgst_amount)} />}
                                {parseFloat(details.sgst_amount) > 0 && <Line small label={`SGST ${details.sgst_percentage}%`} value={money(details.sgst_amount)} />}
                                {parseFloat(details.igst_amount) > 0 && <Line small label={`IGST ${details.igst_percentage}%`} value={money(details.igst_amount)} />}
                                {parseFloat(details.total_gst) > 0 && <Line label="Total GST" value={money(details.total_gst)} />}

                                <Divider sx={{ my: 0.75 }} />
                                <Line strong label="Total Amount" value={money(details.total_amount)} />
                                {parseFloat(details.discount_amount) > 0 && (
                                    <Line label="Less: Discount" value={`− ${money(details.discount_amount)}`} color="#b91c1c" />
                                )}
                                <Line label="Amount Paid" value={money(details.amount_paid)} color="#047857" />

                                <Divider sx={{ my: 0.75 }} />
                                <Box sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 1.5, px: 1.5, py: 1, mb: 1 }}>
                                    <Line strong label="Net Payable" value={money(details.net_payable)} color="#1d4ed8" />
                                </Box>
                                <Box sx={{
                                    bgcolor: balance > 0 ? "#fef2f2" : "#ecfdf5",
                                    border: `1px solid ${balance > 0 ? "#fecaca" : "#a7f3d0"}`,
                                    borderRadius: 1.5, px: 1.5, py: 1,
                                }}>
                                    <Line strong label="Balance Due" value={money(details.balance)} color={balance > 0 ? "#b91c1c" : "#047857"} />
                                </Box>
                            </Box>
                        </Box>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 2.5, py: 1.5, bgcolor: "white", borderTop: "1px solid #e2e8f0", flexShrink: 0 }}>
                <Button onClick={onClose} sx={{ textTransform: "uppercase", fontWeight: 900, fontSize: 12, color: "#64748b" }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BillDetailsModal;
