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
    bold: { fontWeight: "bold" },
    th: { fontWeight: "bold", textAlign: "center", padding: 3, borderColor: B, fontSize: 8, backgroundColor: "#f1f5f9" },
    td: { padding: 3, borderColor: B, fontSize: 8 },
    label: { fontSize: 7.5, color: "#475569", fontWeight: "bold", textTransform: "uppercase" },
    value: { fontSize: 9, marginTop: 1 },
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

const TransportNoteSheetPDF = ({ note }) => {
    if (!note) return null;
    const items = note.consignment_items || [];
    const costs = note.cost_items || [];

    return (
        <Document>
            <Page size="A4" style={s.page}>
                {/* Header */}
                <View style={{ marginBottom: 4 }}>
                    <Text style={{ textAlign: "center", fontSize: 14, fontWeight: "bold" }}>{COMPANY.name}</Text>
                    <Text style={{ textAlign: "center", fontSize: 8 }}>{COMPANY.address}</Text>
                    <Text style={{ textAlign: "center", fontSize: 8 }}>GSTIN: {COMPANY.gstin}</Text>
                </View>

                {/* Title */}
                <View style={[s.box, { padding: 4, backgroundColor: "#0f172a" }]}>
                    <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "bold", color: "#fff" }}>
                        TRANSPORT NOTE SHEET
                    </Text>
                </View>

                {/* Meta row 1 */}
                <View style={[s.box, s.row, { borderTopWidth: 0 }]}>
                    <Field label="Transport No." value={note.transport_number} w="25%" />
                    <Field label="Type" value={note.direction === "BUY" ? "Inbound (Purchase)" : "Outbound (Sale)"} w="25%" />
                    <Field label={note.ref_label} value={note.ref_number} w="25%" />
                    <Field label={note.party_label} value={note.party_name} w="25%" last />
                </View>

                {/* Meta row 2 — transporter & carrier */}
                <View style={[s.box, s.row, { borderTopWidth: 0 }]}>
                    <Field label="Transporter" value={note.transporter_name} w="25%" />
                    <Field label="Contact" value={note.transporter_contact} w="25%" />
                    <Field label="Vehicle No." value={note.vehicle_number} w="25%" />
                    <Field label="LR / CN No." value={note.lr_number} w="25%" last />
                </View>

                {/* Meta row 3 — driver & dates */}
                <View style={[s.box, s.row, { borderTopWidth: 0 }]}>
                    <Field label="Driver" value={note.driver_name} w="25%" />
                    <Field label="Driver Contact" value={note.driver_contact} w="25%" />
                    <Field label="Dispatch Date" value={fdate(note.dispatch_date)} w="25%" />
                    <Field label="Exp. Delivery" value={fdate(note.expected_delivery_date)} w="25%" last />
                </View>

                {/* Meta row 4 — route */}
                <View style={[s.box, s.row, { borderTopWidth: 0 }]}>
                    <Field label="Dispatch From" value={note.dispatch_from} w="50%" />
                    <Field label="Dispatch To" value={note.dispatch_to} w="50%" last />
                </View>

                {/* Consignment items */}
                <Text style={{ fontSize: 9, fontWeight: "bold", marginTop: 10, marginBottom: 3 }}>
                    Consignment Items (this shipment)
                </Text>
                <View style={s.box}>
                    <View style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
                        <Text style={[s.th, { width: "8%", borderRightWidth: 1 }]}>Sl</Text>
                        <Text style={[s.th, { width: "20%", borderRightWidth: 1 }]}>Item Code</Text>
                        <Text style={[s.th, { width: "44%", borderRightWidth: 1, textAlign: "left" }]}>Description</Text>
                        <Text style={[s.th, { width: "14%", borderRightWidth: 1 }]}>Qty</Text>
                        <Text style={[s.th, { width: "14%" }]}>Unit</Text>
                    </View>
                    {items.length === 0 ? (
                        <View style={s.row}>
                            <Text style={[s.td, { width: "100%", textAlign: "center", color: "#94a3b8" }]}>
                                No item-level consignment recorded
                            </Text>
                        </View>
                    ) : (
                        items.map((it, i) => (
                            <View key={i} style={[s.row, { borderBottomWidth: i === items.length - 1 ? 0 : 1, borderColor: B }]}>
                                <Text style={[s.td, { width: "8%", borderRightWidth: 1, textAlign: "center" }]}>{i + 1}</Text>
                                <Text style={[s.td, { width: "20%", borderRightWidth: 1 }]}>{it.product_code}</Text>
                                <Text style={[s.td, { width: "44%", borderRightWidth: 1 }]}>{it.product_name}</Text>
                                <Text style={[s.td, { width: "14%", borderRightWidth: 1, textAlign: "right" }]}>{f2(it.quantity)}</Text>
                                <Text style={[s.td, { width: "14%", textAlign: "center" }]}>{it.unit}</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Freight cost breakdown */}
                <Text style={{ fontSize: 9, fontWeight: "bold", marginTop: 10, marginBottom: 3 }}>
                    Freight Cost Breakdown
                </Text>
                <View style={s.box}>
                    <View style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
                        <Text style={[s.th, { width: "30%", borderRightWidth: 1, textAlign: "left" }]}>Cost Type</Text>
                        <Text style={[s.th, { width: "50%", borderRightWidth: 1, textAlign: "left" }]}>Description</Text>
                        <Text style={[s.th, { width: "20%" }]}>Amount ({note.currency})</Text>
                    </View>
                    {costs.map((c, i) => (
                        <View key={i} style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
                            <Text style={[s.td, { width: "30%", borderRightWidth: 1 }]}>{c.cost_type}</Text>
                            <Text style={[s.td, { width: "50%", borderRightWidth: 1 }]}>{c.description || "—"}</Text>
                            <Text style={[s.td, { width: "20%", textAlign: "right" }]}>{f2(c.amount)}</Text>
                        </View>
                    ))}
                    <View style={s.row}>
                        <Text style={[s.td, { width: "80%", borderRightWidth: 1, textAlign: "right", fontWeight: "bold" }]}>
                            TOTAL FREIGHT
                        </Text>
                        <Text style={[s.td, { width: "20%", textAlign: "right", fontWeight: "bold" }]}>{f2(note.total_cost)}</Text>
                    </View>
                </View>

                {/* Payment status */}
                <View style={[s.box, s.row, { marginTop: 8 }]}>
                    <Field label="Total Freight" value={`${note.currency} ${f2(note.total_cost)}`} w="25%" />
                    <Field label="Paid" value={`${note.currency} ${f2(note.amount_paid)}`} w="25%" />
                    <Field label="Balance" value={`${note.currency} ${f2(note.balance)}`} w="25%" />
                    <Field label="Payment Status" value={note.payment_status} w="25%" last />
                </View>

                {/* Remarks */}
                {note.remarks ? (
                    <View style={[s.box, { marginTop: 8, padding: 4 }]}>
                        <Text style={s.label}>Remarks</Text>
                        <Text style={{ fontSize: 8.5, marginTop: 2 }}>{note.remarks}</Text>
                    </View>
                ) : null}

                {/* Signatures */}
                <View style={[s.row, { marginTop: 40, justifyContent: "space-between" }]}>
                    <View style={{ width: "30%", borderTopWidth: 1, borderColor: B, paddingTop: 3 }}>
                        <Text style={{ textAlign: "center", fontSize: 8 }}>Prepared By</Text>
                    </View>
                    <View style={{ width: "30%", borderTopWidth: 1, borderColor: B, paddingTop: 3 }}>
                        <Text style={{ textAlign: "center", fontSize: 8 }}>Driver / Transporter</Text>
                    </View>
                    <View style={{ width: "30%", borderTopWidth: 1, borderColor: B, paddingTop: 3 }}>
                        <Text style={{ textAlign: "center", fontSize: 8 }}>Authorised Signatory</Text>
                    </View>
                </View>

                <Text style={{ marginTop: 14, fontSize: 7, textAlign: "center", color: "#94a3b8" }}>
                    Generated on {fdate(note.generated_on)} · {COMPANY.name}
                </Text>
            </Page>
        </Document>
    );
};

export default TransportNoteSheetPDF;
