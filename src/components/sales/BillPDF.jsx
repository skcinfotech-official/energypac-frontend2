import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import RobotoRegular from '../../assets/fonts/Roboto-Regular.ttf';
import RobotoBold from '../../assets/fonts/Roboto-Bold.ttf';
// import RobotoItalic from '../../assets/fonts/Roboto-Italic.ttf';

Font.register({
    family: 'Roboto',
    fonts: [
        { src: RobotoRegular },
        { src: RobotoBold,   fontWeight: 'bold' },
        // { src: RobotoItalic, fontStyle: 'italic' },
    ],
});

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    page: {
        padding: 14,
        paddingBottom: 30,          // leave room for PTO footer
        fontFamily: 'Roboto',
        fontSize: 7.5,
        color: '#000',
    },

    // ── Watermark ──
    watermarkContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    watermarkText: {
        fontSize: 70,
        fontWeight: 'bold',
        color: '#75b4d1',
        transform: 'rotate(-45deg)',
        opacity: 0.18,
        letterSpacing: 10,
    },

    // ── PTO footer — fixed, visible on every page except the last ──
    ptoFooter: {
        position: 'absolute',
        bottom: 10,
        left: 14,
        right: 14,
        textAlign: 'right',
        fontSize: 8,
        fontWeight: 'bold',
        color: '#000',
    },

    // ── Title ──
    docTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },

    // ── Generic table cells ──
    cell:          { padding: 3, fontSize: 7.5 },
    cellBold:      { padding: 3, fontSize: 7.5, fontWeight: 'bold' },
    cellSmall:     { padding: 3, fontSize: 6.8 },
    cellCenter:    { padding: 3, fontSize: 7.5, textAlign: 'center' },
    cellRight:     { padding: 3, fontSize: 7.5, textAlign: 'right' },
    cellRightBold: { padding: 3, fontSize: 7.5, textAlign: 'right', fontWeight: 'bold' },

    // ── Borders ──
    bordered:     { borderWidth: 0.5,       borderColor: '#000' },
    borderBottom: { borderBottomWidth: 0.5, borderBottomColor: '#000' },
    borderRight:  { borderRightWidth:  0.5, borderRightColor:  '#000' },
    borderTop:    { borderTopWidth:    0.5, borderTopColor:    '#000' },
    borderLeft:   { borderLeftWidth:   0.5, borderLeftColor:   '#000' },

    // ── Flex helpers ──
    row: { flexDirection: 'row' },
    col: { flexDirection: 'column' },

    // ── Page-break avoidance (break-inside: avoid) ──
    noBreak: { breakInside: 'avoid' },
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (val) =>
    Number(val || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const fmtDate = (date) =>
    date
        ? new Date(date)
              .toLocaleDateString('en-GB', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
              })
              .replace(/\//g, '.')
        : '';

const multiLine = (str = '') =>
    (str || '').split('\n').map((line, i) => <Text key={i}>{line}</Text>);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const BillPDF = ({ details }) => {

    // ── Always-fixed Energypac identity ──
    const STATIC = {
        exporter_name:     'ENERGYPAC ENGINEERING LIMITED',
        exporter_address:  'PLOT NO. 22, KB BLOCK, 4TH FLOOR\nSECTOR-III, SALT LAKE\nKOLKATA-700098\nWEST BENGAL, INDIA.',
        iec_no:            'IEC NO. 0205015794',
        gst_no:            '19AABCE4975G1ZE',
        applicant_name:    'ENERGYPAC ENGINEERING LTD.',
        applicant_address: 'BARUIPARA ASHULIA, SAVAR\nDHAKA-1345, BANGLADESH,',
        applicant_bin_tin: 'E-BIN NO. 001230413-0403 AND TIN: 785525797245',
        lut_no:            'LUT NO. AD1905250273129 DT. 30.05.2025',
        place_of_supply:   'KOLKATA (INDIA)',
        port_of_loading:   'PETRAPOLE LCS (INDIA)',
        pre_carriage:      'BY ROAD',
        place_of_receipt:  'PETRAPOLE LCS (INDIA)',
        country_of_origin: 'INDIA',
    };

    // ── Dynamic fields ──
    const invoice_no        = details.bill_number        || '';
    const invoice_date      = fmtDate(details.bill_date) || '';
    const buyers_order_no   = details.wo_number          || '';
    const terms_of_delivery = details.terms_of_delivery_payment || 'CPT BENEPOLE BY ROAD, BANGLADESH (INCOTERMS-2020)'; 
    const consignee_name    = details.consignee_name     || 'COMMUNITY BANK BANGLADESH PLC.';                    
    const consignee_address = details.consignee_address  || 'CORPORATE BRANCH, DHAKA,\nBANGLADESH';             
    const consignee_bin     = details.consignee_bin      || 'BIN: 001810084-0101';                               
    const importer_name     = details.importer_name      || 'ENERGYPAC ENGINEERING LTD.';                       
    const importer_address  = details.importer_address   || 'BARUIPARA, ASHULIA, SAVAR\nDHAKA-1345, BANGLADESH';
    const importer_bin_tin  = details.importer_bin_tin   || 'E-BIN NO. 001230413-0403 AND TIN: 785525797245';   
    const dc_no             = details.dc_no              || 'DC NO. 365125010228 DT. 20.08.2025.';               
    const irc_no            = details.irc_no             || 'IRC NO. 260326120028119';                           
    const importer_bin2     = details.importer_bin2      || 'IMPORTER BIN: 001230413-0403, TIN: 785525797245';  
    const insurance_no      = details.insurance_no       || 'INSURANCE NO. CIC/LO/MC-0425/08/2025 DATED 18/08/2025\nCENTRAL INSURANCE COMPANY LTD., LOCAL OFFICE, 93,MOTIJHEEL, 1ST FLOOR,DHAKA-1000, BANGLADESH'; 
    const vessel            = details.vessel_flight_no   || 'BY ROAD';                                          
    const port_of_discharge = details.port_of_discharge  || 'BENAPOLE LAND PORT\nBANGLADESH';                   
    const place_of_delivery = details.place_of_delivery  || 'BENAPOLE LAND PORT\nBANGLADESH';                   
    const final_destination = details.final_destination  || 'DHAKA/BANGLADESH';                                 
    const port_of_loading   = details.port_of_loading    || STATIC.port_of_loading;
    const pre_carriage_by   = details.pre_carriage_by    || STATIC.pre_carriage;
    const marks_nos         = details.marks_nos          || '';                                                  
    const kind_of_pkgs      = details.kind_of_pkgs       || '';                                                  
    const proforma_ref      = details.proforma_ref       || buyers_order_no;

    // ── Your original line items from details.items ──
    const items = details.items || [];

    // ── Your original totals ──
    const subtotal         = details.subtotal         || 0;
    const cgst_amount      = details.cgst_amount      || 0;
    const sgst_amount      = details.sgst_amount      || 0;
    const igst_amount      = details.igst_amount      || 0;
    const cgst_percentage  = details.cgst_percentage  || 0;
    const sgst_percentage  = details.sgst_percentage  || 0;
    const igst_percentage  = details.igst_percentage  || 0;
    const total_amount     = details.total_amount     || 0;
    const advance_deducted = details.advance_deducted || 0;
    const freight_cost     = details.freight_cost     || 0;
    const net_payable      = details.net_payable      || 0;
    const amount_paid      = details.amount_paid      || 0;
    const balance          = details.balance          || 0;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* ── WATERMARK (fixed on every page) ── */}
                <View style={styles.watermarkContainer} fixed>
                    <Text style={styles.watermarkText}>ENERGYPAC</Text>
                </View>

                {/* ── PTO FOOTER — "P.T.O →" on every page except the last ── */}
                <Text
                    style={styles.ptoFooter}
                    render={({ pageNumber, totalPages }) =>
                        pageNumber < totalPages ? 'P.T.O \u2192' : ''
                    }
                    fixed
                />

                {/* ── TITLE ── */}
                <Text style={styles.docTitle}>COMMERCIAL INVOICE</Text>

                {/* ════════════════════════════════════════════════════════════
                    ROW 1 — Exporter | Invoice No & Date | Exporters Ref | GST
                ════════════════════════════════════════════════════════════ */}
                <View style={[styles.row, styles.bordered, styles.noBreak]} wrap={false}>
                    <View style={[{ width: '38%' }, styles.borderRight]}>
                        <Text style={styles.cellBold}>Exporter:</Text>
                        <Text style={[styles.cell, { fontWeight: 'bold' }]}>{STATIC.exporter_name}</Text>
                        <View style={styles.cell}>{multiLine(STATIC.exporter_address)}</View>
                    </View>
                    <View style={[{ width: '28%' }, styles.borderRight]}>
                        <View style={styles.borderBottom}>
                            <Text style={styles.cellBold}>Invoice No &amp; Date</Text>
                        </View>
                        <View style={styles.borderBottom}>
                            <Text style={styles.cell}>{invoice_no} Dt. {invoice_date}</Text>
                        </View>
                        <View style={styles.borderBottom}>
                            <Text style={styles.cellBold}>Buyers Order No. &amp; Date: {buyers_order_no}</Text>
                        </View>
                        {/* <View style={styles.borderBottom}>
                            <Text style={styles.cellBold}>Terms of Delivery:</Text>
                        </View>
                        <Text style={styles.cell}>{terms_of_delivery}</Text> */}
                    </View>
                    {/* <View style={[{ width: '17%' }, styles.borderRight]}>
                        <Text style={styles.cellBold}>Exporters Ref.</Text>
                        <Text style={styles.cell}>{STATIC.iec_no}</Text>
                    </View> */}
                    <View style={{ width: '17%' }}>
                        <Text style={styles.cellBold}>GST NO.</Text>
                        <Text style={styles.cell}>{STATIC.gst_no}</Text>
                    </View>
                </View>

                {/* ════════════════════════════════════════════════════════════
                    ROW 2 — Consignee | Applicant
                ════════════════════════════════════════════════════════════ */}
                {/* <View style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                    <View style={[{ width: '50%' }, styles.borderRight]}>
                        <Text style={styles.cellBold}>Consigned to the order of:</Text>
                        <Text style={[styles.cell, { fontWeight: 'bold' }]}>{consignee_name}</Text>
                        <View style={styles.cell}>{multiLine(consignee_address)}</View>
                        <Text style={styles.cell}>{consignee_bin}</Text>
                    </View>
                    <View style={{ width: '50%' }}>
                        <Text style={styles.cellBold}>Applicant:-</Text>
                        <Text style={[styles.cell, { fontWeight: 'bold' }]}>{STATIC.applicant_name}</Text>
                        <View style={styles.cell}>{multiLine(STATIC.applicant_address)}</View> */}
                        {/* <Text style={styles.cell}>{STATIC.applicant_bin_tin}</Text> */}
                    {/* </View>
                </View> */}

                {/* ════════════════════════════════════════════════════════════
                    ROW 3 — Importer / Notify | Terms of Delivery & Payment
                ════════════════════════════════════════════════════════════ */}
                <View style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                    <View style={[{ width: '50%' }, styles.borderRight]}>
                        <Text style={styles.cellBold}>Importer/Notify Party:</Text>
                        <Text style={[styles.cell, { fontWeight: 'bold' }]}>{importer_name}</Text>
                        <View style={styles.cell}>{multiLine(importer_address)}</View>
                        {/* <Text style={styles.cell}>{importer_bin_tin}</Text> */}
                    </View> 
                    <View style={{ width: '50%' }}>
                        <Text style={styles.cellBold}>Terms of Delivery and Payment:</Text>
                        <Text style={styles.cell}>{terms_of_delivery}</Text>
                        {/* <Text style={styles.cell}>{dc_no}</Text>
                        <Text style={styles.cell}>{irc_no}</Text>
                        <Text style={styles.cell}>{importer_bin2}</Text>
                        <View style={styles.cell}>{multiLine(insurance_no)}</View> */}
                    </View>
                </View>

                {/* ── Place of Supply ── */}
                <View style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                    <Text style={styles.cell}>
                        <Text style={{ fontWeight: 'bold' }}>Place of Supply: </Text>
                        {STATIC.place_of_supply}
                    </Text>
                </View>

                {/* ════════════════════════════════════════════════════════════
                    ROW 4 — Vessel / Port grid
                ════════════════════════════════════════════════════════════ */}
                {[
                    [
                        { label: 'Vessel/Flight No:',  value: vessel,                   w: '15%' },
                        { label: 'Port of Loading:',   value: port_of_loading,          w: '25%' },
                        { label: 'Port of Discharge:', value: port_of_discharge,         w: '30%' },
                        { label: 'Place of Delivery:', value: place_of_delivery,         w: '30%' },
                    ],
                    [
                        { label: 'Pre-carriage by:',                     value: pre_carriage_by,          w: '15%' },
                        { label: 'Place of Receipt of by Pre-carriage:',  value: STATIC.place_of_receipt,  w: '25%' },
                        { label: 'Country of Origin:',                   value: STATIC.country_of_origin, w: '30%' },
                        { label: 'Final Destination:',                   value: final_destination,         w: '30%' },
                    ],
                ].map((rowDef, ri) => (
                    <View key={ri} style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                        {rowDef.map((col, ci) => (
                            <View key={ci} style={[{ width: col.w }, ci < rowDef.length - 1 && styles.borderRight]}>
                                <Text style={styles.cellBold}>{col.label}</Text>
                                <View style={styles.cell}>{multiLine(col.value)}</View>
                            </View>
                        ))}
                    </View>
                ))}

                {/* ════════════════════════════════════════════════════════════
                    ITEMS TABLE — Header
                ════════════════════════════════════════════════════════════ */}
                <View style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                    {[
                        { label: 'SL\nNO',          w: '5%'  },
                        { label: 'PRODUCT / ITEM',  w: '37%' },
                        { label: 'HSN/SAC',         w: '12%' },
                        { label: 'QTY',             w: '10%' },
                        { label: 'RATE',            w: '12%' },
                        { label: 'AMOUNT',          w: '12%' },
                        { label: 'TOTAL',           w: '24%' },
                    ].map((h, hi) => (
                        <View key={hi} style={[{ width: h.w }, hi < 5 && styles.borderRight]}>
                            <Text style={[styles.cellBold, { textAlign: 'center' }]}>{h.label}</Text>
                        </View>
                    ))}
                </View>

                {/* ════════════════════════════════════════════════════════════
                    ITEMS TABLE — Body (your original details.items)
                ════════════════════════════════════════════════════════════ */}
                {items.map((item, index) => (
                    <View
                        key={index}
                        style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]}
                        wrap={false}
                    >
                        {/* SL NO */}
                        <View style={[{ width: '5%' }, styles.borderRight]}>
                            <Text style={styles.cellCenter}>{index + 1}</Text>
                        </View>

                        {/* PRODUCT / ITEM */}
                        <View style={[{ width: '37%' }, styles.borderRight]}>
                            <Text style={[styles.cell, { fontWeight: 'bold' }]}>{item.item_name}</Text>
                            {/* {item.item_code ? (
                                <Text style={[styles.cellSmall, { color: '#444' }]}>{item.item_code}</Text>
                            ) : null} */}
                            {item.description && item.description !== item.item_name ? (
                                <Text style={[styles.cellSmall, { color: '#444' }]}>{item.description}</Text>
                            ) : null}
                        </View>

                        {/* HSN/SAC */}
                        <View style={[{ width: '12%' }, styles.borderRight]}>
                            {/* {item.description && item.description !== item.item_name ? (
                                <Text style={[styles.cellSmall, { color: '#444' }]}>{item.description}</Text>
                            ) : null} */}
                            <Text style={styles.cellCenter}>{item.hsn_code}</Text>
                        </View>

                        {/* QTY */}
                        <View style={[{ width: '10%' }, styles.borderRight]}>
                            <Text style={styles.cellCenter}>{item.delivered_quantity} {item.unit}</Text>
                        </View>

                        {/* RATE */}
                        <View style={[{ width: '12%' }, styles.borderRight]}>
                            <Text style={styles.cellRight}>{fmt(item.rate)}</Text>
                        </View>

                        {/* AMOUNT */}
                        <View style={[{ width: '12%' }, styles.borderRight]}>
                            <Text style={styles.cellRight}>{fmt(item.amount)}</Text>
                        </View>

                        {/* TOTAL */}
                        <View style={{ width: '24%' }}>
                            <Text style={styles.cellRight}>{fmt(item.amount)}</Text>
                        </View>
                    </View>
                ))}

                {/* ════════════════════════════════════════════════════════════
                    TOTALS SECTION
                ════════════════════════════════════════════════════════════ */}
                {/* SUB TOTAL */}
                <View style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                    <View style={[{ width: '76%' }, styles.borderRight]}>
                        <Text style={styles.cellRightBold}>SUB TOTAL</Text>
                    </View>
                    <View style={{ width: '24%' }}>
                        <Text style={styles.cellRightBold}>{fmt(subtotal)}</Text>
                    </View>
                </View>

                {/* CGST */}
                {parseFloat(cgst_amount) > 0 && (
                    <View style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                        <View style={[{ width: '76%' }, styles.borderRight]}>
                            <Text style={styles.cellRightBold}>CGST @ {cgst_percentage}%</Text>
                        </View>
                        <View style={{ width: '24%' }}>
                            <Text style={styles.cellRightBold}>{fmt(cgst_amount)}</Text>
                        </View>
                    </View>
                )}

                {/* SGST */}
                {parseFloat(sgst_amount) > 0 && (
                    <View style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                        <View style={[{ width: '76%' }, styles.borderRight]}>
                            <Text style={styles.cellRightBold}>SGST @ {sgst_percentage}%</Text>
                        </View>
                        <View style={{ width: '24%' }}>
                            <Text style={styles.cellRightBold}>{fmt(sgst_amount)}</Text>
                        </View>
                    </View>
                )}

                {/* IGST */}
                {parseFloat(igst_amount) > 0 && (
                    <View style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                        <View style={[{ width: '76%' }, styles.borderRight]}>
                            <Text style={styles.cellRightBold}>IGST @ {igst_percentage}%</Text>
                        </View>
                        <View style={{ width: '24%' }}>
                            <Text style={styles.cellRightBold}>{fmt(igst_amount)}</Text>
                        </View>
                    </View>
                )}

                {/* TOTAL BILL AMOUNT */}
                <View style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                    <View style={[{ width: '76%' }, styles.borderRight]}>
                        <Text style={styles.cellRightBold}>TOTAL BILL AMOUNT</Text>
                    </View>
                    <View style={{ width: '24%' }}>
                        <Text style={styles.cellRightBold}>{fmt(total_amount)}</Text>
                    </View>
                </View>

                {/* ADVANCE DEDUCTED */}
                <View style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                    <View style={[{ width: '76%' }, styles.borderRight]}>
                        <Text style={styles.cellRightBold}>ADVANCE DEDUCTED</Text>
                    </View>
                    <View style={{ width: '24%' }}>
                        <Text style={styles.cellRightBold}>{fmt(advance_deducted)}</Text>
                    </View>
                </View>

                {/* FREIGHT COST */}
                {parseFloat(freight_cost) > 0 && (
                    <View style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                        <View style={[{ width: '76%' }, styles.borderRight]}>
                            <Text style={styles.cellRightBold}>FREIGHT COST</Text>
                        </View>
                        <View style={{ width: '24%' }}>
                            <Text style={styles.cellRightBold}>{fmt(freight_cost)}</Text>
                        </View>
                    </View>
                )}

                {/* NET PAYABLE */}
                <View style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                    <View style={[{ width: '76%' }, styles.borderRight]}>
                        <Text style={[styles.cellRightBold, { color: '#1a56db' }]}>NET PAYABLE</Text>
                    </View>
                    <View style={{ width: '24%' }}>
                        <Text style={[styles.cellRightBold, { color: '#1a56db' }]}>{fmt(net_payable)}</Text>
                    </View>
                </View>

                {/* AMOUNT PAID */}
                <View style={[styles.row, styles.borderBottom, styles.borderLeft, styles.borderRight, styles.noBreak]} wrap={false}>
                    <View style={[{ width: '76%' }, styles.borderRight]}>
                        <Text style={styles.cellRightBold}>AMOUNT PAID</Text>
                    </View>
                    <View style={{ width: '24%' }}>
                        <Text style={styles.cellRightBold}>{fmt(amount_paid)}</Text>
                    </View>
                </View>

                {/* BALANCE DUE */}
                <View style={[styles.row, styles.bordered, styles.noBreak]} wrap={false}>
                    <View style={[{ width: '76%' }, styles.borderRight]}>
                        <Text style={[styles.cellRightBold, { color: '#dc2626' }]}>BALANCE DUE</Text>
                    </View>
                    <View style={{ width: '24%' }}>
                        <Text style={[styles.cellRightBold, { color: '#dc2626' }]}>{fmt(balance)}</Text>
                    </View>
                </View>

                {/* Amount in words */}
                {details.amount_in_words ? (
                    <Text style={[styles.cell, { fontWeight: 'bold', marginTop: 6, textTransform: 'uppercase' }]}>
                        AMOUNT IN WORDS: {details.amount_in_words}
                    </Text>
                ) : null}

                {/* Remarks */}
                {details.remarks ? (
                    <View style={[{ marginTop: 8 }, styles.noBreak]} wrap={false}>
                        <Text style={[styles.cellBold, { textDecoration: 'underline' }]}>Remarks:-</Text>
                        <Text style={styles.cell}>{details.remarks}</Text>
                    </View>
                ) : null}

                {/* ════════════════════════════════════════════════════════════
                    FOOTER — Notes | Signature
                ════════════════════════════════════════════════════════════ */}
                <View style={[styles.row, styles.bordered, { marginTop: 10 }, styles.noBreak]} wrap={false}>
                    {/* Notes */}
                    <View style={[{ width: '63%' }, styles.borderRight]}>
                        <Text style={styles.cellBold}>Signature</Text>
                        <View style={styles.cell}>
                            <Text>(1) The goods are of India Origin</Text>
                            <Text>(2) Country of Origin was printed clearly on package/boxes/cartons of goods.</Text>
                            <Text>
                                (3) The goods Description, Quality, Quantity, other particulars and price herein
                                invoiced{'\n'}    conformity to Proforma Invoice No: {proforma_ref}
                            </Text>
                        </View>
                        <Text style={[styles.cell, { fontWeight: 'bold', marginTop: 4 }]}>
                            {STATIC.lut_no}
                        </Text>
                    </View>

                    {/* Signature block */}
                    <View style={[{ width: '37%' }, styles.col, { alignItems: 'center', justifyContent: 'center', padding: 8 }]}>
                        <Text style={[styles.cell, { fontWeight: 'bold', marginBottom: 30 }]}>
                            Energypac Engineering Ltd.
                        </Text>
                        <View style={{ borderTopWidth: 1, borderTopColor: '#000', width: '80%', marginBottom: 4 }} />
                        <Text style={[styles.cell, { textAlign: 'center' }]}>(Authorised Signatory)</Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
};

export default BillPDF;