import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import RobotoRegular from '../../assets/fonts/Roboto-Regular.ttf';
import RobotoBold from '../../assets/fonts/Roboto-Bold.ttf';

Font.register({
    family: 'Roboto',
    fonts: [
        { src: RobotoRegular },
        { src: RobotoBold, fontWeight: 'bold' }
    ]
});

const styles = StyleSheet.create({
    page: { padding: 24, paddingBottom: 40, fontFamily: 'Roboto', fontSize: 8, color: '#000' },

    // ── Header grid (mirrors the printed Proforma Invoice form) ──
    grid: { borderWidth: 1, borderColor: '#000' },
    gridTitle: { borderBottomWidth: 1, borderBottomColor: '#000', padding: 5, alignItems: 'center' },
    row: { flexDirection: 'row' },
    rowBB: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    cellR: { borderRightWidth: 1, borderRightColor: '#000' },
    pad: { padding: 4 },
    hlabel: { fontSize: 7, fontWeight: 'bold', color: '#000' },
    hvalue: { fontSize: 8, fontWeight: 'bold', marginTop: 2, lineHeight: 1.3 },

    // ── Items table ──
    table: { marginTop: 6, borderWidth: 1, borderColor: '#000' },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', fontWeight: 'bold', backgroundColor: '#E5E7EB', alignItems: 'center' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', alignItems: 'stretch', minHeight: 30 },
    col1: { width: '5%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col2: { width: '38%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
    col3: { width: '12%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col4: { width: '9%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    col5: { width: '8%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    colRate: { width: '12%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    col6: { width: '16%', padding: 4, textAlign: 'right' },
});

// Small header field: bold label above a bold value. Declared at module scope
// so it is not re-created on every render.
const Field = ({ label, value, valueSize, minHeight }) => (
    <>
        <Text style={styles.hlabel}>{label}</Text>
        <Text style={[styles.hvalue, valueSize ? { fontSize: valueSize } : null, minHeight ? { minHeight } : null]}>{value || ''}</Text>
    </>
);

const ClientQuotationPDF = ({ quotation, verification }) => {
    if (!quotation) return null;

    const curr = quotation.currency || 'USD';

    const num2 = (val) => Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
    };

    // Extract verified authorized signatory (if the PI has been signed off)
    const getVerifiedUser = () => {
        if (!verification || !verification.verifiers) return null;
        return verification.verifiers.find(v => v.role === 'AUTHORIZED_SIGNATORY');
    };
    const signatory = getVerifiedUser();

    const items = quotation.items || [];
    const subtotal = items.reduce((s, i) => s + (Number(i.quantity || 0) * Number(i.unit_price || 0)), 0);
    const grandTotal = Number(quotation.grand_total || subtotal);

    // Header-level freight entered on the PI. 0 -> plain "GRAND TOTAL".
    const freightCharges = Number(quotation.freight_charges || 0);
    const grandLabel = freightCharges > 0
        ? `GRAND TOTAL (INCLUDING OF FREIGHT CHARGES ${curr} ${num2(freightCharges)})`
        : 'GRAND TOTAL';

    // Project-reference line (under Invoice No / Ref / GST):
    // requisition number(s) the PI is built on; if none (stock sale / direct),
    // fall back to the manually-entered Project Name.
    const reqRefs = (Array.isArray(quotation.requisition_numbers) && quotation.requisition_numbers.length)
        ? quotation.requisition_numbers.filter(Boolean).join(', ')
        : (quotation.requisition_number || '');
    const projectRef = reqRefs || quotation.project_name || '';

    const termsRaw = quotation.terms_and_conditions || [];
    const terms = termsRaw.map((t) => {
        if (typeof t === 'string') {
            const idx = t.indexOf(':');
            return idx !== -1 ? { label: t.substring(0, idx).trim(), value: t.substring(idx + 1).trim(), bold: false } : { label: '', value: t, bold: false };
        }
        if (t && typeof t === 'object') return { label: t.key || t.label || '', value: t.value || '', bold: !!t.bold };
        return null;
    }).filter(Boolean);

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* L/C No & Date — at the very top, centred (only when filled) */}
                {quotation.lc_number ? (
                    <View style={{ alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>L/C No &amp; Date: {quotation.lc_number}</Text>
                    </View>
                ) : null}

                {/* ══════════ HEADER GRID ══════════ */}
                <View style={styles.grid}>

                    {/* Title */}
                    <View style={styles.gridTitle}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>PROFORMA INVOICE</Text>
                    </View>

                    {/* Row 1: Beneficiary | (Invoice No & Date / Exporters Ref / GST) + Project line */}
                    <View style={styles.rowBB}>
                        <View style={[{ width: '50%', minHeight: 64 }, styles.cellR, styles.pad]}>
                            <Text style={styles.hlabel}>Beneficiary / Exporter:</Text>
                            <Text style={{ fontSize: 8, fontWeight: 'bold', lineHeight: 1.3, marginTop: 2 }}>
                                {quotation.exporter_beneficiary || 'ENERGYPAC ENGINEERING LIMITED.'}
                            </Text>
                        </View>
                        <View style={{ width: '50%' }}>
                            <View style={styles.rowBB}>
                                <View style={[{ width: '38%' }, styles.cellR, styles.pad]}>
                                    <Text style={styles.hlabel}>Proforma Invoice No. & Date</Text>
                                    <Text style={styles.hvalue}>
                                        {quotation.pi_number}{quotation.pi_date ? `  DT. ${formatDate(quotation.pi_date)}` : ''}
                                    </Text>
                                </View>
                                <View style={[{ width: '30%' }, styles.cellR, styles.pad]}>
                                    <Field label="Exporters Ref." value={quotation.exporter_reference} valueSize={7.5} />
                                </View>
                                <View style={[{ width: '32%' }, styles.pad]}>
                                    <Text style={styles.hlabel}>GST NO.</Text>
                                    <Text style={{ fontSize: 7.5, fontWeight: 'bold', marginTop: 2 }}>{quotation.gst_number || ''}</Text>
                                </View>
                            </View>
                            <View style={[styles.pad, { flex: 1, justifyContent: 'center' }]}>
                                <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{projectRef}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Row 2: Consignee + Country/Destination | Applicant/Importer */}
                    <View style={styles.rowBB}>
                        <View style={[{ width: '50%' }, styles.cellR]}>
                            <View style={[styles.pad, { borderBottomWidth: 1, borderBottomColor: '#000', minHeight: 34 }]}>
                                <Text style={styles.hlabel}>Consignee:</Text>
                                <Text style={{ fontSize: 7.5, fontWeight: 'bold', marginTop: 2, lineHeight: 1.3 }}>{quotation.consignee || ''}</Text>
                            </View>
                            <View style={styles.row}>
                                <View style={[{ width: '50%' }, styles.cellR, styles.pad]}>
                                    <Field label="Country of Origin:" value={quotation.country_of_origin} />
                                </View>
                                <View style={[{ width: '50%' }, styles.pad]}>
                                    <Field label="Final Destination:" value={quotation.final_destination} />
                                </View>
                            </View>
                        </View>
                        <View style={[{ width: '50%' }, styles.pad]}>
                            <Text style={styles.hlabel}>Applicant / Importer / Notify Party:</Text>
                            <Text style={{ fontSize: 7.5, fontWeight: 'bold', marginTop: 2, lineHeight: 1.3 }}>{quotation.applicant_importer || ''}</Text>
                        </View>
                    </View>

                    {/* Row 3: Pre-carriage / Place of Receipt | Terms of Delivery */}
                    <View style={styles.rowBB}>
                        <View style={[{ width: '50%' }, styles.cellR, styles.row]}>
                            <View style={[{ width: '50%' }, styles.cellR, styles.pad]}>
                                <Field label="Pre-carriage by:" value={quotation.pre_carriage_by} />
                            </View>
                            <View style={[{ width: '50%' }, styles.pad]}>
                                <Field label="Place of Receipt by Pre carriage:" value={quotation.place_of_receipt} />
                            </View>
                        </View>
                        <View style={[{ width: '50%' }, styles.pad]}>
                            <Field label="Terms of Delivery:" value={quotation.terms_of_delivery} />
                        </View>
                    </View>

                    {/* Row 4: Port of Loading | Port of Discharge | Terms of Payment */}
                    <View style={styles.row}>
                        <View style={[{ width: '50%' }, styles.cellR, styles.pad]}>
                            <Field label="Port of Loading:" value={quotation.port_of_loading} />
                        </View>
                        <View style={[{ width: '22%' }, styles.cellR, styles.pad]}>
                            <Field label="Port of Discharge:" value={quotation.port_of_discharge} />
                        </View>
                        <View style={[{ width: '28%' }, styles.pad]}>
                            <Field label="Terms of Payment:" value={quotation.terms_of_payment} />
                        </View>
                    </View>
                </View>

                {/* ══════════ ITEMS TABLE ══════════ */}
                <View style={styles.table}>
                    <View style={styles.tableHeader} fixed>
                        <Text style={styles.col1}>SL #</Text>
                        <Text style={styles.col2}>DESCRIPTION OF GOODS</Text>
                        <Text style={styles.col3}>HS CODE</Text>
                        <Text style={styles.col4}>QTY</Text>
                        <Text style={styles.col5}>U.O.M.</Text>
                        <Text style={styles.colRate}>RATE ({curr})</Text>
                        <Text style={styles.col6}>TOTAL AMOUNT ({curr})</Text>
                    </View>

                    {items.map((item, index) => (
                        <View key={index} style={styles.tableRow} wrap={false}>
                            <Text style={styles.col1}>{index + 1}</Text>
                            <View style={styles.col2}>
                                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>{item.product_name || item.item_name}</Text>
                                {item.description && item.description !== item.product_name && (
                                    <Text style={{ fontSize: 7, color: '#333', marginTop: 1 }}>{item.description}</Text>
                                )}
                            </View>
                            <Text style={styles.col3}>{item.hsn_code || '-'}</Text>
                            <Text style={styles.col4}>{Number(item.quantity || 0).toFixed(2)}</Text>
                            <Text style={styles.col5}>{item.unit || 'KGS'}</Text>
                            <Text style={styles.colRate}>{Number(item.unit_price || 0).toFixed(2)}</Text>
                            <Text style={styles.col6}>{Number(item.amount || (item.quantity * item.unit_price) || 0).toFixed(2)}</Text>
                        </View>
                    ))}

                    {/* Grand total row */}
                    <View style={styles.row} wrap={false}>
                        <Text style={{ width: '72%', padding: 4, fontWeight: 'bold', fontSize: 8, borderRightWidth: 1, borderRightColor: '#000' }}>
                            {grandLabel}
                        </Text>
                        <Text style={{ width: '12%', padding: 4, fontWeight: 'bold', fontSize: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' }}>
                            CPT PRICE
                        </Text>
                        <Text style={{ width: '16%', padding: 4, fontWeight: 'bold', fontSize: 8.5, textAlign: 'right' }}>
                            {num2(grandTotal)}
                        </Text>
                    </View>
                </View>

                {/* ══════════ TERMS & CONDITIONS ══════════ */}
                {terms.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                        <Text style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: 8.5, marginBottom: 3 }}>Terms &amp; Conditions:</Text>
                        {terms.map((term, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', marginBottom: 2 }} wrap={false}>
                                <Text style={{ width: 16, fontSize: 8, fontWeight: 'bold' }}>{idx + 1}.</Text>
                                <Text style={{ flex: 1, fontSize: 8, lineHeight: 1.2 }}>
                                    {term.label ? <Text style={{ fontWeight: 'bold' }}>{term.label}: </Text> : null}
                                    <Text style={{ fontWeight: term.bold ? 'bold' : 'normal' }}>{term.value}</Text>
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* ══════════ SIGNATURE BOX ══════════ */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }} wrap={false}>
                    <View style={{ width: '42%', borderWidth: 1, borderColor: '#000' }}>
                        <Text style={{ padding: 4, fontWeight: 'bold', fontSize: 8, borderBottomWidth: 1, borderBottomColor: '#000' }}>
                            For Energypac Engineering Limited
                        </Text>
                        <View style={{ height: 56, alignItems: 'center', justifyContent: 'center' }}>
                            {signatory && signatory.status === 'VERIFIED' && signatory.signature_base64 ? (
                                <Image src={signatory.signature_base64} style={{ width: 100, height: 38, objectFit: 'contain' }} />
                            ) : null}
                            {signatory && signatory.status === 'VERIFIED' && (
                                <Text style={{ fontSize: 7.5, fontWeight: 'bold', color: '#10b981', marginTop: 2 }}>✓ {signatory.full_name}</Text>
                            )}
                        </View>
                        <Text style={{ padding: 4, fontWeight: 'bold', fontSize: 8, borderTopWidth: 1, borderTopColor: '#000' }}>
                            Exporter
                        </Text>
                    </View>
                </View>

                {/* Page Number */}
                <Text style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', fontSize: 7.5, color: '#666' }}
                    render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
            </Page>
        </Document>
    );
};

export default ClientQuotationPDF;
