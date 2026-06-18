import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import RobotoRegular from "../../assets/fonts/Roboto-Regular.ttf";
import RobotoBold from "../../assets/fonts/Roboto-Bold.ttf";

Font.register({
    family: "Roboto",
    fonts: [{ src: RobotoRegular }, { src: RobotoBold, fontWeight: "bold" }],
});

const B = "#000";
const s = StyleSheet.create({
    page: { padding: 24, fontFamily: "Roboto", fontSize: 7.5, color: B, flexDirection: "column" },
    title: { textAlign: "center", fontSize: 13, fontWeight: "bold", marginBottom: 4 },
    box: { borderWidth: 1, borderColor: B },
    row: { flexDirection: "row" },
    cell: { borderColor: B, padding: 3 },
    label: { fontWeight: "bold" },
    val: { marginTop: 1 },
    th: { fontWeight: "bold", textAlign: "center", padding: 3, borderColor: B },
    td: { padding: 3, borderColor: B },
});

const fmt2 = (v) => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt3 = (v) => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".") : "";

const invNoDate = (ci) => {
    let t = ci.invoice_no || "";
    if (ci.invoice_date) t = `${t}  Dt. ${fmtDate(ci.invoice_date)}`.trim();
    return t;
};
const buyersOrder = (ci) => {
    let t = ci.buyers_order_no || "";
    if (ci.buyers_order_date) t = `${t}  Dt. ${fmtDate(ci.buyers_order_date)}`.trim();
    return t;
};
const marksText = (ci) => {
    const f = (ci.marks_from || "").trim(), t = (ci.marks_to || "").trim();
    if (f && t) return `${f}\nTO\n${t}`;
    return f || t || "";
};

const Field = ({ label, value, style }) => (
    <View style={[s.cell, style]}>
        <Text style={s.label}>{label}</Text>
        {value ? <Text style={s.val}>{value}</Text> : null}
    </View>
);

// Shared header block
const DocHeader = ({ ci }) => (
    <View style={s.box}>
        <View style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
            <Field label="Exporter:" value={ci.exporter} style={{ width: "50%", borderRightWidth: 1 }} />
            <View style={{ width: "50%" }}>
                <View style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
                    <Field label="Invoice No & Date" value={invNoDate(ci)} style={{ width: "40%", borderRightWidth: 1 }} />
                    <Field label="Exporters Ref." value={ci.exporters_ref} style={{ width: "30%", borderRightWidth: 1 }} />
                    <Field label="GST NO." value={ci.gst_no} style={{ width: "30%" }} />
                </View>
                <Field label="Buyers Order No. & Date:" value={buyersOrder(ci)} style={{ flexGrow: 1 }} />
            </View>
        </View>
        <View style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
            <Field label="Consigned to the order of:" value={ci.consigned_to_order_of} style={{ width: "50%", borderRightWidth: 1 }} />
            <View style={{ width: "50%" }}>
                <Field label="Terms of Delivery:" value={ci.terms_of_delivery} style={{ borderBottomWidth: 1 }} />
                <Field label="Applicant:" value={ci.applicant} style={{ flexGrow: 1 }} />
            </View>
        </View>
        <View style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
            <View style={{ width: "50%", borderRightWidth: 1, borderColor: B }}>
                <Field label="Importer/Notify Party:" value={ci.importer_notify_party} style={{ borderBottomWidth: 1, flexGrow: 1 }} />
                <Field label="Place of Supply:" value={ci.place_of_supply} />
            </View>
            <Field label="Terms of Delivery and Payment:" value={ci.terms_of_delivery_and_payment} style={{ width: "50%" }} />
        </View>
        <View style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
            <Field label="Vessel/Flight No:" value={ci.vessel_flight_no} style={{ width: "25%", borderRightWidth: 1 }} />
            <Field label="Port of Loading:" value={ci.port_of_loading} style={{ width: "25%", borderRightWidth: 1 }} />
            <Field label="Port of Discharge:" value={ci.port_of_discharge} style={{ width: "25%", borderRightWidth: 1 }} />
            <Field label="Place of Delivery:" value={ci.place_of_delivery} style={{ width: "25%" }} />
        </View>
        <View style={s.row}>
            <Field label="Pre-carriage by:" value={ci.pre_carriage_by} style={{ width: "25%", borderRightWidth: 1 }} />
            <Field label="Place of Receipt of by Pre-carriage:" value={ci.place_of_receipt} style={{ width: "25%", borderRightWidth: 1 }} />
            <Field label="Country of Origin:" value={ci.country_of_origin} style={{ width: "25%", borderRightWidth: 1 }} />
            <Field label="Final Destination:" value={ci.final_destination} style={{ width: "25%" }} />
        </View>
    </View>
);

// Full-table column widths (used by the unified header row)
const W = { marks: "12%", pkgs: "11%", desc: "42%", qty: "9%", c5: "13%", c6: "13%" };
// Widths WITHIN the "rest" container (88% wide) — proportional to W so columns
// line up exactly with the header above.
const REST_W = "88%";
const WR = { pkgs: "12.5%", desc: "47.73%", qty: "10.23%", c5: "14.77%", c6: "14.77%" };
const WORDS_LEFT = "85.23%";   // REST minus c6
const num = { fontSize: 7 };

const ItemRowRest = ({ it, hs, c5, c6 }) => (
    <View style={s.row} wrap={false}>
        <Text style={[s.td, { width: WR.pkgs, borderRightWidth: 1 }]}>{it.no_kind_pkgs}</Text>
        <View style={[s.td, { width: WR.desc, borderRightWidth: 1 }]}>
            <Text>{it.description}</Text>
            {hs ? <Text style={{ fontWeight: "bold", textAlign: "center", marginTop: 2 }}>HS CODE NO. {hs}</Text> : null}
        </View>
        <Text style={[s.td, num, { width: WR.qty, borderRightWidth: 1, textAlign: "center" }]}>
            {`${Number(it.quantity || 0)} ${it.unit || ""}`.trim()}
        </Text>
        <Text style={[s.td, num, { width: WR.c5, borderRightWidth: 1, textAlign: "right" }]}>{c5}</Text>
        <Text style={[s.td, num, { width: WR.c6, textAlign: "right" }]}>{c6}</Text>
    </View>
);

const FillerRest = () => (
    <View style={[s.row, { flexGrow: 1 }]}>
        <Text style={[s.td, { width: WR.pkgs, borderRightWidth: 1 }]}> </Text>
        <Text style={[s.td, { width: WR.desc, borderRightWidth: 1 }]}> </Text>
        <Text style={[s.td, { width: WR.qty, borderRightWidth: 1 }]}> </Text>
        <Text style={[s.td, { width: WR.c5, borderRightWidth: 1 }]}> </Text>
        <Text style={[s.td, { width: WR.c6 }]}> </Text>
    </View>
);

// Full-height items area: one unified header row (aligned), then the body —
// Marks value column (spanning) on the left + the rest rows on the right.
const ItemsArea = ({ ci, col5Head, col6Head, children }) => (
    <View style={[s.box, { borderTopWidth: 0, flexGrow: 1, flexDirection: "column" }]}>
        {/* Unified header row — all cells share one height, so they align */}
        <View style={[s.row, { borderBottomWidth: 1, borderColor: B, backgroundColor: "#EFEFEF" }]}>
            <Text style={[s.th, { width: W.marks, borderRightWidth: 1 }]}>Marks & Nos/{"\n"}Container No.</Text>
            <Text style={[s.th, { width: W.pkgs, borderRightWidth: 1 }]}>No & Kind of{"\n"}Pkgs.</Text>
            <Text style={[s.th, { width: W.desc, borderRightWidth: 1 }]}>Description of Goods</Text>
            <Text style={[s.th, { width: W.qty, borderRightWidth: 1 }]}>Qty{"\n"}Set./Nos.</Text>
            <Text style={[s.th, { width: W.c5, borderRightWidth: 1 }]}>{col5Head}</Text>
            <Text style={[s.th, { width: W.c6 }]}>{col6Head}</Text>
        </View>
        {/* Body row: spanning Marks column + the rest sub-rows */}
        <View style={[s.row, { flexGrow: 1 }]}>
            <View style={{ width: W.marks, borderRightWidth: 1, borderColor: B, justifyContent: "center", alignItems: "center", padding: 3 }}>
                <Text style={{ textAlign: "center" }}>{marksText(ci)}</Text>
            </View>
            <View style={{ width: REST_W, flexDirection: "column" }}>
                {children}
            </View>
        </View>
    </View>
);

// ── Commercial Invoice ───────────────────────────────────────────────────────
export const CommercialInvoicePDF = ({ ci }) => {
    if (!ci) return null;
    const cur = ci.currency || "US$";
    const items = ci.items || [];
    const totals = [
        ["Total FCA Value (USD):", ci.total_fca_value],
        ["Total Freight (USD):", ci.total_freight],
        ["Total CPT Value (USD):", ci.total_cpt_value],
    ];
    return (
        <Document>
            <Page size="A4" style={s.page}>
                <Text style={s.title}>COMMERCIAL INVOICE</Text>
                <DocHeader ci={ci} />

                <ItemsArea ci={ci} col5Head={`Unit\nPrice\n${cur}`} col6Head={`Total\nAmount\n${cur}`}>
                    {items.map((it, i) => (
                        <ItemRowRest key={i} it={it} hs={it.hs_code} c5={fmt2(it.unit_price)} c6={fmt2(it.total_amount)} />
                    ))}
                    <FillerRest />
                    {totals.map(([lbl, val], i) => (
                        <View key={i} style={s.row}>
                            <Text style={[s.td, { width: WR.pkgs, borderRightWidth: 1 }]}> </Text>
                            <View style={[s.td, { width: WR.desc, borderRightWidth: 1, flexDirection: "row", justifyContent: "flex-end" }]}>
                                <Text style={s.label}>{lbl} </Text>
                                <Text style={num}>{fmt2(val)}</Text>
                            </View>
                            <Text style={[s.td, { width: WR.qty, borderRightWidth: 1 }]}> </Text>
                            <Text style={[s.td, { width: WR.c5, borderRightWidth: 1 }]}> </Text>
                            <Text style={[s.td, { width: WR.c6 }]}> </Text>
                        </View>
                    ))}
                    <View style={[s.row, { borderTopWidth: 1, borderColor: B }]}>
                        <View style={[s.td, { width: WORDS_LEFT, borderRightWidth: 1 }]}>
                            <Text><Text style={s.label}>Total Chargeable amount (US$): </Text>{ci.amount_in_words}</Text>
                        </View>
                        <Text style={[s.td, num, { width: WR.c6, textAlign: "right", fontWeight: "bold" }]}>{fmt2(ci.total_cpt_value)}</Text>
                    </View>
                </ItemsArea>

                {/* Footer: declarations | signature */}
                <View style={[s.box, { borderTopWidth: 0 }]}>
                    <View style={s.row}>
                        <View style={[s.td, { width: "70%", borderRightWidth: 1 }]}>
                            {ci.project_name ? (
                                <Text style={{ marginBottom: 3 }}><Text style={s.label}>PROJECT NAME : </Text>{ci.project_name}</Text>
                            ) : null}
                            {(ci.declarations || []).map((d, i) => (
                                <Text key={i} style={{ marginBottom: 1 }}>{`(${i + 1}) ${d}`}</Text>
                            ))}
                            {ci.lut_no ? <Text style={[s.label, { marginTop: 2 }]}>{`LUT NO. ${ci.lut_no}`}</Text> : null}
                        </View>
                        <View style={[s.td, { width: "30%", minHeight: 70 }]}>
                            <Text>Signature</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

// ── Packing List ──────────────────────────────────────────────────────────────
export const PackingListPDF = ({ pl }) => {
    if (!pl || !pl.commercial_invoice_data) return null;
    const ci = pl.commercial_invoice_data;
    const items = pl.items || [];
    return (
        <Document>
            <Page size="A4" style={s.page}>
                <Text style={s.title}>PACKING LIST</Text>
                <DocHeader ci={ci} />

                <ItemsArea ci={ci} col5Head={"NETT\nWEIGHT\nKGS."} col6Head={"GROSS\nWEIGHT\nKGS."}>
                    {items.map((it, i) => (
                        <ItemRowRest key={i} it={it} hs={it.hs_code} c5={`${fmt3(it.nett_weight)} Kgs.`} c6={`${fmt3(it.gross_weight)} Kgs.`} />
                    ))}
                    <FillerRest />
                    <View style={[s.row, { borderTopWidth: 1, borderColor: B }]}>
                        <Text style={[s.td, { width: WR.pkgs, borderRightWidth: 1 }]}> </Text>
                        <Text style={[s.td, { width: WR.desc, borderRightWidth: 1 }]}> </Text>
                        <Text style={[s.td, { width: WR.qty, borderRightWidth: 1 }]}> </Text>
                        <Text style={[s.td, num, { width: WR.c5, borderRightWidth: 1, textAlign: "right", fontWeight: "bold" }]}>{`${fmt3(pl.total_nett_weight)} Kgs.`}</Text>
                        <Text style={[s.td, num, { width: WR.c6, textAlign: "right", fontWeight: "bold" }]}>{`${fmt3(pl.total_gross_weight)} Kgs.`}</Text>
                    </View>
                </ItemsArea>

                {/* Footer */}
                <View style={[s.box, { borderTopWidth: 0 }]}>
                    <View style={s.row}>
                        <View style={[s.td, { width: "70%", borderRightWidth: 1 }]}>
                            <Text style={[s.label, { marginBottom: 2 }]}>The goods are of Indian Origin</Text>
                            {pl.packing_specification ? (
                                <Text><Text style={s.label}>Packing Specification: </Text>{pl.packing_specification}</Text>
                            ) : null}
                            {pl.lut_no ? <Text style={[s.label, { marginTop: 2 }]}>{`LUT NO. ${pl.lut_no}`}</Text> : null}
                        </View>
                        <View style={[s.td, { width: "30%", minHeight: 70 }]}>
                            <Text>Signature</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
