import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import RobotoRegular from "../../assets/fonts/Roboto-Regular.ttf";
import RobotoBold from "../../assets/fonts/Roboto-Bold.ttf";

Font.register({
    family: "Roboto",
    fonts: [{ src: RobotoRegular }, { src: RobotoBold, fontWeight: "bold" }],
});

const COMPANY = {
    name: "ENERGYPAC ENGINEERING LIMITED",
    address: "KB-22 'BHAKTA TOWER', 4TH FL, SECTOR-III, SALT LAKE, KOLKATA - 700 106.",
    gstin: "19AABCE4975G1ZE",
};

const B = "#000";
const s = StyleSheet.create({
    page: { padding: 20, fontFamily: "Roboto", fontSize: 9, color: B, flexDirection: "column" },
    box: { borderWidth: 1, borderColor: B },
    row: { flexDirection: "row" },
    cell: { borderColor: B, padding: 3.5 },
    label: { fontSize: 7.5, color: "#475569", fontWeight: "bold", textTransform: "uppercase" },
    value: { fontSize: 9, marginTop: 1 },
    th: { fontWeight: "bold", textAlign: "center", padding: 3, borderColor: B, fontSize: 8, backgroundColor: "#f1f5f9" },
    td: { padding: 3, borderColor: B, fontSize: 8 },
    cardLabel: { fontSize: 7.5, fontWeight: "bold", color: "#475569", textTransform: "uppercase" },
    cardValue: { fontSize: 11, fontWeight: "bold", marginTop: 2 },
    cardSub: { fontSize: 7, color: "#64748b", marginTop: 1 },
});

const f2 = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fdate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const Field = ({ label, value, w, last }) => (
    <View style={[s.cell, { width: w, borderRightWidth: last ? 0 : 1 }]}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.value}>{value || "—"}</Text>
    </View>
);

const TransporterLedgerPDF = ({ ledger }) => {
    if (!ledger) return null;
    const t = ledger.transporter || {};
    const sum = ledger.summary || {};
    const entries = ledger.entries || [];

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={s.page}>
                {/* Header */}
                <View style={{ marginBottom: 4 }}>
                    <Text style={{ textAlign: "center", fontSize: 14, fontWeight: "bold" }}>{COMPANY.name}</Text>
                    <Text style={{ textAlign: "center", fontSize: 8 }}>{COMPANY.address}</Text>
                    <Text style={{ textAlign: "center", fontSize: 8 }}>GSTIN: {COMPANY.gstin}</Text>
                </View>

                {/* Title */}
                <View style={[s.box, { padding: 4, backgroundColor: "#0f172a" }]}>
                    <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "bold", color: "#fff" }}>
                        TRANSPORTER LEDGER
                    </Text>
                </View>

                {/* Transporter info */}
                <View style={[s.box, s.row, { borderTopWidth: 0 }]}>
                    <Field label="Code" value={t.transporter_code} w="15%" />
                    <Field label="Transporter" value={t.name} w="35%" />
                    <Field label="Contact" value={t.contact_person || t.phone} w="25%" />
                    <Field label="GSTIN" value={t.gst_number} w="25%" last />
                </View>

                {/* Summary cards */}
                <View style={[s.row, { marginTop: 8 }]}>
                    <View style={[s.box, { width: "33.33%", padding: 5, backgroundColor: "#fef2f2" }]}>
                        <Text style={s.cardLabel}>Buy Payable Balance</Text>
                        <Text style={[s.cardValue, { color: "#b91c1c" }]}>INR {f2(sum.buy_balance)}</Text>
                        <Text style={s.cardSub}>Billed {f2(sum.buy_billed)} · Paid {f2(sum.buy_paid)}</Text>
                    </View>
                    <View style={[s.box, { width: "33.33%", padding: 5, backgroundColor: "#eff6ff", borderLeftWidth: 0 }]}>
                        <Text style={s.cardLabel}>Sell Recoverable Balance</Text>
                        <Text style={[s.cardValue, { color: "#1d4ed8" }]}>INR {f2(sum.sell_balance)}</Text>
                        <Text style={s.cardSub}>Billed {f2(sum.sell_billed)} · Recd {f2(sum.sell_paid)}</Text>
                    </View>
                    <View style={[s.box, { width: "33.34%", padding: 5, backgroundColor: "#f8fafc", borderLeftWidth: 0 }]}>
                        <Text style={s.cardLabel}>Shipments</Text>
                        <Text style={[s.cardValue, { color: "#1e293b" }]}>{entries.length}</Text>
                    </View>
                </View>

                {/* Entries table */}
                <Text style={{ fontSize: 9, fontWeight: "bold", marginTop: 12, marginBottom: 3 }}>
                    Shipment Entries
                </Text>
                <View style={s.box}>
                    <View style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
                        <Text style={[s.th, { width: "16%", borderRightWidth: 1, textAlign: "left" }]}>Transport No</Text>
                        <Text style={[s.th, { width: "8%", borderRightWidth: 1 }]}>Side</Text>
                        <Text style={[s.th, { width: "22%", borderRightWidth: 1, textAlign: "left" }]}>Reference</Text>
                        <Text style={[s.th, { width: "12%", borderRightWidth: 1 }]}>Dispatch</Text>
                        <Text style={[s.th, { width: "13%", borderRightWidth: 1 }]}>Freight</Text>
                        <Text style={[s.th, { width: "12%", borderRightWidth: 1 }]}>Paid</Text>
                        <Text style={[s.th, { width: "12%", borderRightWidth: 1 }]}>Balance</Text>
                        <Text style={[s.th, { width: "5%" }]}>Status</Text>
                    </View>
                    {entries.length === 0 ? (
                        <View style={s.row}>
                            <Text style={[s.td, { width: "100%", textAlign: "center", color: "#94a3b8" }]}>No shipments</Text>
                        </View>
                    ) : (
                        entries.map((e, i) => (
                            <View key={i} style={[s.row, { borderBottomWidth: i === entries.length - 1 ? 0 : 1, borderColor: B }]}>
                                <Text style={[s.td, { width: "16%", borderRightWidth: 1 }]}>{e.transport_number}</Text>
                                <Text style={[s.td, { width: "8%", borderRightWidth: 1, textAlign: "center" }]}>{e.direction}</Text>
                                <Text style={[s.td, { width: "22%", borderRightWidth: 1 }]}>{e.reference || "—"}</Text>
                                <Text style={[s.td, { width: "12%", borderRightWidth: 1, textAlign: "center" }]}>{fdate(e.dispatch_date)}</Text>
                                <Text style={[s.td, { width: "13%", borderRightWidth: 1, textAlign: "right" }]}>{f2(e.total_cost)}</Text>
                                <Text style={[s.td, { width: "12%", borderRightWidth: 1, textAlign: "right" }]}>{f2(e.amount_paid)}</Text>
                                <Text style={[s.td, { width: "12%", borderRightWidth: 1, textAlign: "right" }]}>{f2(e.balance)}</Text>
                                <Text style={[s.td, { width: "5%", textAlign: "center", fontSize: 7 }]}>{(e.payment_status || "").replace(/_/g, " ")}</Text>
                            </View>
                        ))
                    )}
                </View>

                <Text style={{ marginTop: 14, fontSize: 7, textAlign: "center", color: "#94a3b8" }}>
                    Generated on {fdate(new Date())} · {COMPANY.name} · All amounts in INR
                </Text>
            </Page>
        </Document>
    );
};

export default TransporterLedgerPDF;
