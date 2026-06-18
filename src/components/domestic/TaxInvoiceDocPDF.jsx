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
    page: { padding: 18, fontFamily: "Roboto", fontSize: 8.5, color: B, flexDirection: "column" },
    box: { borderWidth: 1, borderColor: B },
    row: { flexDirection: "row" },
    cell: { borderColor: B, padding: 2.5 },
    bold: { fontWeight: "bold" },
    th: { fontWeight: "bold", textAlign: "center", padding: 2.5, borderColor: B, fontSize: 7.5 },
    td: { padding: 2.5, borderColor: B, fontSize: 7.5 },
});

const f2 = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fdate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".") : "");
const rate = (v) => (Number(v || 0) ? `${Number(v)}%` : "-");

// item column widths (% of page) — header & body share these.
// Description trimmed; SGST/CGST/IGST widened so amounts sit inside their cells.
const WI = { sl: "3%", desc: "17%", hs: "6%", qty: "4%", rate: "8%", amount: "9%", taxable: "9%", sgstR: "3.5%", sgstA: "8%", cgstR: "3.5%", cgstA: "8%", igstR: "3.5%", igstA: "8%", total: "9.5%" };
// width spanned by Sl+Desc+HS+Qty+Rate — the "TOTAL :" label cell (keeps Amount total under Amount)
const TOTAL_LABEL_W = "38%";

const LV = ({ label, value, style }) => (
    <View style={[s.cell, style]}>
        <Text><Text style={s.bold}>{label}</Text>{value ? ` ${value}` : ""}</Text>
    </View>
);

const TaxInvoiceDocPDF = ({ ti }) => {
    if (!ti) return null;
    const service = ti.kind === "SERVICE";
    const title = service ? "SERVICE TAX INVOICE" : "TAX INVOICE";
    const descH = service ? "Work Description" : "Product Description";
    const codeH = service ? "SAC Code" : "H.S. Code";
    const items = ti.items || [];
    const sum = (k) => items.reduce((a, it) => a + Number(it[k] || 0), 0);

    return (
        <Document>
            <Page size="A4" style={s.page}>
                {/* Company header — centered across full page width; copy label floats top-right */}
                <View style={{ position: "relative" }}>
                    <Text style={{ position: "absolute", top: 0, right: 0, fontSize: 7 }}>{ti.copy_label}</Text>
                    <View style={{ width: "100%" }}>
                        <Text style={{ textAlign: "center", fontSize: 14, fontWeight: "bold" }}>{ti.company_name}</Text>
                        <Text style={{ textAlign: "center", fontSize: 8.5 }}>{ti.company_address}</Text>
                        <Text style={{ textAlign: "center", fontSize: 8.5 }}>GSTIN: {ti.company_gstin}    PAN NO. {ti.company_pan}</Text>
                        <Text style={{ textAlign: "center", fontSize: 8.5 }}>IEC NO. {ti.company_iec}</Text>
                    </View>
                </View>

                {/* Title */}
                <View style={[s.box, { marginTop: 4, padding: 3.5 }]}>
                    <Text style={{ textAlign: "center", fontSize: 13, fontWeight: "bold" }}>{title}</Text>
                </View>

                {/* Invoice meta */}
                <View style={[s.box, { borderTopWidth: 0 }]}>
                    <View style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
                        <LV label="INVOICE NO. :" value={ti.invoice_no} style={{ width: "50%", borderRightWidth: 1 }} />
                        <LV label={service ? "WORK ORDER NO. :" : "VENDOR CODE :"} value={service ? ti.work_order_no : ti.vendor_code} style={{ width: "50%" }} />
                    </View>
                    <View style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
                        <LV label="INVOICE DATE :" value={fdate(ti.invoice_date)} style={{ width: "50%", borderRightWidth: 1 }} />
                        <LV label={service ? "PLACE OF SUPPLY & SERVICE :" : "VEHICLE NO. :"} value={service ? ti.place_of_supply : `${ti.vehicle_no || ""}   MODE OF TRANSPORT : ${ti.mode_of_transport || ""}`} style={{ width: "50%" }} />
                    </View>
                    <View style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
                        <LV label={service ? "WORK ORDER :" : "CHALLAN NO. :"} value={service ? ti.work_order_no : `${ti.challan_no || ""}${ti.challan_date ? "  DTD. " + fdate(ti.challan_date) : ""}`} style={{ width: "50%", borderRightWidth: 1 }} />
                        <LV label={service ? "" : "PLACE OF SUPPLY :"} value={service ? "" : ti.place_of_supply} style={{ width: "50%" }} />
                    </View>
                    <View style={s.row}>
                        <View style={{ width: "50%", borderRightWidth: 1, borderColor: B, flexDirection: "row" }}>
                            <LV label="STATE :" value={ti.state} style={{ flexGrow: 1 }} />
                            <Text style={[s.cell, s.bold, { width: 32, textAlign: "center", borderLeftWidth: 1 }]}>CODE</Text>
                            <Text style={[s.cell, { width: 30, textAlign: "center", borderLeftWidth: 1 }]}>{ti.state_code}</Text>
                        </View>
                        <LV label="BUYER'S ORDER NO. :" value={service ? "" : `${ti.buyers_order_no || ""}${ti.buyers_order_date ? "  DTD. " + fdate(ti.buyers_order_date) : ""}`} style={{ width: "50%" }} />
                    </View>
                </View>

                {/* Bill To / Shipping */}
                <View style={[s.box, { borderTopWidth: 0 }]}>
                    <View style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
                        <Text style={[s.th, { width: "50%", borderRightWidth: 1 }]}>BILL TO PARTY</Text>
                        <Text style={[s.th, { width: "50%" }]}>SHIPPING ADDRESS</Text>
                    </View>
                    {[
                        ["NAME :", ti.bill_to_name, "NAME :", ti.ship_to_name],
                        ["ADDRESS :", ti.bill_to_address, "ADDRESS :", ti.ship_to_address],
                        ["GSTIN :", ti.bill_to_gstin, "PROJECT NAME :", ti.ship_to_project],
                        ["STATE/COUNTRY :", ti.bill_to_state, "STATE/COUNTRY :", ti.ship_to_state],
                    ].map((rw, i) => (
                        <View key={i} style={i < 3 ? [s.row, { borderBottomWidth: 1, borderColor: B }] : s.row}>
                            <LV label={rw[0]} value={rw[1]} style={{ width: "50%", borderRightWidth: 1 }} />
                            <LV label={rw[2]} value={rw[3]} style={{ width: "50%" }} />
                        </View>
                    ))}
                </View>

                {/* Items */}
                <View style={[s.box, { borderTopWidth: 0, flexGrow: 1, flexDirection: "column" }]}>
                    {/* header (2 rows) */}
                    <View style={[s.row, { borderBottomWidth: 1, borderColor: B, backgroundColor: "#EFEFEF", minHeight: 26 }]}>
                        <Text style={[s.th, { width: WI.sl, borderRightWidth: 1 }]}>Sl. No.</Text>
                        <Text style={[s.th, { width: WI.desc, borderRightWidth: 1 }]}>{descH}</Text>
                        <Text style={[s.th, { width: WI.hs, borderRightWidth: 1 }]}>{codeH}</Text>
                        <Text style={[s.th, { width: WI.qty, borderRightWidth: 1 }]}>Qty</Text>
                        <Text style={[s.th, { width: WI.rate, borderRightWidth: 1 }]}>Rate</Text>
                        <Text style={[s.th, { width: WI.amount, borderRightWidth: 1 }]}>Amount</Text>
                        <Text style={[s.th, { width: WI.taxable, borderRightWidth: 1 }]}>Taxable value</Text>
                        {[["SGST", WI.sgstR, WI.sgstA], ["CGST", WI.cgstR, WI.cgstA], ["IGST", WI.igstR, WI.igstA]].map(([lbl, wr, wa], i) => (
                            <View key={i} style={{ width: `${parseFloat(wr) + parseFloat(wa)}%`, borderRightWidth: 1, borderColor: B }}>
                                <Text style={[s.th, { borderBottomWidth: 1 }]}>{lbl}</Text>
                                <View style={s.row}>
                                    <Text style={[s.th, { width: `${(parseFloat(wr) / (parseFloat(wr) + parseFloat(wa))) * 100}%`, borderRightWidth: 1 }]}>Rate</Text>
                                    <Text style={[s.th, { width: `${(parseFloat(wa) / (parseFloat(wr) + parseFloat(wa))) * 100}%` }]}>Amount</Text>
                                </View>
                            </View>
                        ))}
                        <Text style={[s.th, { width: WI.total }]}>Total Amount (INR)</Text>
                    </View>
                    {/* item rows */}
                    {items.map((it, i) => (
                        <View key={i} style={s.row} wrap={false}>
                            <Text style={[s.td, { width: WI.sl, borderRightWidth: 1, textAlign: "center" }]}>{i + 1}</Text>
                            <Text style={[s.td, { width: WI.desc, borderRightWidth: 1 }]}>{it.description}</Text>
                            <Text style={[s.td, { width: WI.hs, borderRightWidth: 1, textAlign: "center" }]}>{it.hs_sac_code}</Text>
                            <Text style={[s.td, { width: WI.qty, borderRightWidth: 1, textAlign: "center" }]}>{`${Number(it.quantity || 0)} ${it.unit || ""}`.trim()}</Text>
                            <Text style={[s.td, { width: WI.rate, borderRightWidth: 1, textAlign: "right" }]}>{f2(it.rate)}</Text>
                            <Text style={[s.td, { width: WI.amount, borderRightWidth: 1, textAlign: "right" }]}>{f2(it.amount)}</Text>
                            <Text style={[s.td, { width: WI.taxable, borderRightWidth: 1, textAlign: "right" }]}>{f2(it.taxable_value)}</Text>
                            <Text style={[s.td, { width: WI.sgstR, borderRightWidth: 1, textAlign: "center" }]}>{rate(it.sgst_rate)}</Text>
                            <Text style={[s.td, { width: WI.sgstA, borderRightWidth: 1, textAlign: "right" }]}>{f2(it.sgst_amount)}</Text>
                            <Text style={[s.td, { width: WI.cgstR, borderRightWidth: 1, textAlign: "center" }]}>{rate(it.cgst_rate)}</Text>
                            <Text style={[s.td, { width: WI.cgstA, borderRightWidth: 1, textAlign: "right" }]}>{f2(it.cgst_amount)}</Text>
                            <Text style={[s.td, { width: WI.igstR, borderRightWidth: 1, textAlign: "center" }]}>{rate(it.igst_rate)}</Text>
                            <Text style={[s.td, { width: WI.igstA, borderRightWidth: 1, textAlign: "right" }]}>{Number(it.igst_amount || 0) ? f2(it.igst_amount) : "-"}</Text>
                            <Text style={[s.td, { width: WI.total, textAlign: "right" }]}>{f2(it.total_amount)}</Text>
                        </View>
                    ))}
                    {/* filler */}
                    <View style={[s.row, { flexGrow: 1 }]}>
                        {Object.values(WI).map((w, i) => (
                            <Text key={i} style={[s.td, { width: w, borderRightWidth: i < 13 ? 1 : 0 }]}> </Text>
                        ))}
                    </View>
                    {/* total row — column-wise totals aligned under each column */}
                    <View style={[s.row, { borderTopWidth: 1, borderColor: B }]}>
                        <Text style={[s.td, s.bold, { width: TOTAL_LABEL_W, borderRightWidth: 1 }]}>TOTAL :</Text>
                        <Text style={[s.td, s.bold, { width: WI.amount, borderRightWidth: 1, textAlign: "right" }]}>{f2(sum("amount"))}</Text>
                        <Text style={[s.td, s.bold, { width: WI.taxable, borderRightWidth: 1, textAlign: "right" }]}>{f2(ti.total_amount_before_tax)}</Text>
                        <Text style={[s.td, { width: WI.sgstR, borderRightWidth: 1 }]}> </Text>
                        <Text style={[s.td, s.bold, { width: WI.sgstA, borderRightWidth: 1, textAlign: "right" }]}>{f2(sum("sgst_amount"))}</Text>
                        <Text style={[s.td, { width: WI.cgstR, borderRightWidth: 1 }]}> </Text>
                        <Text style={[s.td, s.bold, { width: WI.cgstA, borderRightWidth: 1, textAlign: "right" }]}>{f2(sum("cgst_amount"))}</Text>
                        <Text style={[s.td, { width: WI.igstR, borderRightWidth: 1 }]}> </Text>
                        <Text style={[s.td, s.bold, { width: WI.igstA, borderRightWidth: 1, textAlign: "right" }]}>{Number(sum("igst_amount")) ? f2(sum("igst_amount")) : "-"}</Text>
                        <Text style={[s.td, s.bold, { width: WI.total, textAlign: "right" }]}>{f2(ti.total_amount_after_tax)}</Text>
                    </View>
                </View>

                {/* Words + summary */}
                <View style={[s.box, { borderTopWidth: 0, flexDirection: "row" }]}>
                    <View style={{ width: "55%", borderRightWidth: 1, borderColor: B }}>
                        <Text style={[s.th, { borderBottomWidth: 1, textAlign: "center" }]}>TOTAL INVOICE AMOUNT IN WORD</Text>
                        <Text style={[s.td, s.bold, { padding: 4 }]}>{ti.amount_in_words}</Text>
                    </View>
                    <View style={{ width: "45%" }}>
                        {[
                            ["TOTAL AMOUNT BEFORE TAX :", ti.total_amount_before_tax],
                            ["TOTAL TAX AMOUNT :", ti.total_tax_amount],
                            ["TOTAL AMOUNT AFTER TAX (INR) :", ti.total_amount_after_tax],
                        ].map(([lbl, val], i) => (
                            <View key={i} style={[s.row, { borderBottomWidth: 1, borderColor: B }]}>
                                <Text style={[s.td, s.bold, { width: "68%", borderRightWidth: 1 }]}>{lbl}</Text>
                                <Text style={[s.td, { width: "32%", textAlign: "right" }]}>{f2(val)}</Text>
                            </View>
                        ))}
                        <View style={s.row}>
                            <Text style={[s.td, s.bold, { width: "68%", borderRightWidth: 1 }]}>GST ON REVERSE CHARGE :</Text>
                            <Text style={[s.td, { width: "32%", textAlign: "center" }]}>{ti.gst_on_reverse_charge}</Text>
                        </View>
                    </View>
                </View>

                {/* Bank + signatory */}
                <View style={[s.box, { borderTopWidth: 0, flexDirection: "row" }]}>
                    <View style={{ width: "55%", borderRightWidth: 1, borderColor: B }}>
                        <Text style={[s.th, { borderBottomWidth: 1, textAlign: "center" }]}>BANK DETAIL</Text>
                        <Text style={[s.td]}>Bank Name : {ti.bank_name}</Text>
                        <Text style={[s.td]}>Bank A/C : {ti.bank_account}</Text>
                        <Text style={[s.td, { borderBottomWidth: 1 }]}>Bank IFSC : {ti.bank_ifsc}</Text>
                        <Text style={[s.th, { borderBottomWidth: 1, textAlign: "center" }]}>TERMS OF PAYMENT</Text>
                        {(ti.terms_of_payment || []).map((t, i) => (
                            <Text key={i} style={[s.td]}>{t}</Text>
                        ))}
                    </View>
                    <View style={{ width: "45%", padding: 4, justifyContent: "space-between" }}>
                        <Text style={{ textAlign: "center", color: "#1d4ed8" }}>Certified that the particulars given above are true and correct</Text>
                        <View>
                            <Text style={{ textAlign: "center", fontWeight: "bold", marginTop: 16 }}>For, {ti.company_name}</Text>
                            <Text style={{ textAlign: "center", marginTop: 22 }}>AUTHORISED SIGNATORY</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default TaxInvoiceDocPDF;
