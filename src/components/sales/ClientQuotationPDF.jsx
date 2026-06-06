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
    page: { padding: 30, paddingBottom: 40, fontFamily: 'Roboto', fontSize: 8, color: '#000' },
    watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
    watermarkText: { fontSize: 70, fontWeight: 'bold', color: '#e2f0fd', transform: 'rotate(-45deg)', opacity: 0.5, letterSpacing: 10 },
    table: { marginTop: 10, borderWidth: 1, borderColor: '#000' },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', fontWeight: 'bold', backgroundColor: '#E5E7EB', alignItems: 'center' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', alignItems: 'center', minHeight: 24 },
    col1: { width: '6%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col2: { width: '34%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
    col3: { width: '10%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col4: { width: '10%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    col5: { width: '8%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    colRate: { width: '14%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    col6: { width: '18%', padding: 4, textAlign: 'right' },
    label: { fontSize: 6.5, fontWeight: 'bold', color: '#444', marginBottom: 1, textTransform: 'uppercase' },
});

const EnergypacLogo = () => (
    <Image src={`${window.location.origin}/logo.jpeg`} style={{ width: 180, height: 25, marginBottom: 5 }} />
);

const ClientQuotationPDF = ({ quotation }) => {
    if (!quotation) return null;

    const curr = quotation.currency || 'USD';
    const symbol = curr === 'INR' ? '₹' : (curr === 'USD' ? '$' : curr);

    const fmt = (val) => `${symbol} ${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
    };

    const items = quotation.items || [];
    const subtotal = items.reduce((s, i) => s + (Number(i.quantity || 0) * Number(i.unit_price || 0)), 0);
    const grandTotal = Number(quotation.grand_total || subtotal);

    const termsRaw = quotation.terms_and_conditions || [];
    const terms = termsRaw.map((t, i) => {
        if (typeof t === 'string') {
            const idx = t.indexOf(':');
            return idx !== -1 ? { label: t.substring(0, idx).trim(), value: t.substring(idx + 1).trim() } : { label: `Term ${i + 1}`, value: t };
        }
        if (t && typeof t === 'object') return { label: t.key || t.label || `Term ${i + 1}`, value: t.value || '' };
        return null;
    }).filter(Boolean);

    const InfoRow = ({ label, value }) => value ? (
        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={{ width: '35%', fontSize: 7.5, fontWeight: 'bold' }}>{label} :</Text>
            <Text style={{ width: '65%', fontSize: 7.5 }}>{value}</Text>
        </View>
    ) : null;

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                <View style={styles.watermarkContainer} fixed>
                    <Text style={styles.watermarkText}>ENERGYPAC</Text>
                </View>

                {/* Letterhead */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1.5, borderBottomColor: '#000', paddingBottom: 6, marginBottom: 8 }}>
                    <EnergypacLogo />
                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0E5EB3' }}>ENERGYPAC ENGINEERING LTD.</Text>
                        <Text style={{ fontSize: 6.5, color: '#333', marginTop: 1.5 }}>KB-22, "Bhakta Tower", 4th Floor, Sector-III,</Text>
                        <Text style={{ fontSize: 6.5, color: '#333' }}>Salt Lake City, KOLKATA - 700 098, INDIA.</Text>
                        <Text style={{ fontSize: 6.5, color: '#333' }}>Tel. : 033 4006 5853, GSTIN : 19AABCE4975G1ZE</Text>
                        <Text style={{ fontSize: 6.5, color: '#333' }}>E-mail : energypackolkata@gmail.com | eel@energypacindia.in</Text>
                    </View>
                </View>

                {/* Title */}
                <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 8 }}>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', padding: 4, alignItems: 'center', backgroundColor: '#F9FAFB' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>PROFORMA INVOICE</Text>
                    </View>

                    {/* Two columns: Exporter + Invoice Details */}
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ width: '55%', padding: 5, borderRightWidth: 1, borderRightColor: '#000', minHeight: 70 }}>
                            <Text style={styles.label}>Beneficiary / Exporter:</Text>
                            <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2 }}>{quotation.exporter_beneficiary || 'ENERGYPAC ENGINEERING LIMITED.'}</Text>
                            <Text style={{ fontSize: 6.5, color: '#333', lineHeight: 1.2 }}>KB-22, Bhakta Tower, 4th Floor, Sector-III,{'\n'}Salt Lake City, Kolkata - 700098, India.</Text>
                            {quotation.gst_number && (
                                <Text style={{ fontSize: 7.5, fontWeight: 'bold', marginTop: 4 }}>GSTIN : {quotation.gst_number}</Text>
                            )}
                        </View>
                        <View style={{ width: '45%', padding: 5 }}>
                            <InfoRow label="PI NO" value={quotation.pi_number} />
                            <InfoRow label="DATE" value={formatDate(quotation.pi_date)} />
                            <InfoRow label="REQUISITION" value={quotation.requisition_number || (quotation.is_stock_sale ? 'STOCK SALE' : 'N/A')} />
                            {quotation.exporter_reference && <InfoRow label="EXPORTER REF" value={quotation.exporter_reference} />}
                            {quotation.lc_number && <InfoRow label="L/C NUMBER" value={quotation.lc_number} />}
                            <InfoRow label="CURRENCY" value={curr} />
                        </View>
                    </View>
                </View>

                {/* Consignee & Importer */}
                {(quotation.consignee || quotation.applicant_importer) && (
                    <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 8, flexDirection: 'row' }}>
                        {quotation.consignee && (
                            <View style={{ width: quotation.applicant_importer ? '50%' : '100%', padding: 5, borderRightWidth: quotation.applicant_importer ? 1 : 0, borderRightColor: '#000' }}>
                                <Text style={styles.label}>Consignee:</Text>
                                <Text style={{ fontSize: 7.5, fontWeight: 'bold', lineHeight: 1.2 }}>{quotation.consignee}</Text>
                            </View>
                        )}
                        {quotation.applicant_importer && (
                            <View style={{ width: quotation.consignee ? '50%' : '100%', padding: 5 }}>
                                <Text style={styles.label}>Applicant / Importer:</Text>
                                <Text style={{ fontSize: 7.5, fontWeight: 'bold', lineHeight: 1.2 }}>{quotation.applicant_importer}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Shipping Details */}
                {(quotation.country_of_origin || quotation.final_destination || quotation.port_of_loading || quotation.port_of_discharge || quotation.terms_of_delivery || quotation.terms_of_payment) && (
                    <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', borderBottomWidth: (quotation.port_of_loading || quotation.port_of_discharge || quotation.terms_of_delivery || quotation.terms_of_payment) ? 1 : 0, borderBottomColor: '#000' }}>
                            {quotation.country_of_origin && (
                                <View style={{ width: '50%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' }}>
                                    <Text style={styles.label}>Country of Origin:</Text>
                                    <Text style={{ fontSize: 7.5, fontWeight: 'bold' }}>{quotation.country_of_origin}</Text>
                                </View>
                            )}
                            {quotation.final_destination && (
                                <View style={{ width: '50%', padding: 4 }}>
                                    <Text style={styles.label}>Final Destination:</Text>
                                    <Text style={{ fontSize: 7.5, fontWeight: 'bold' }}>{quotation.final_destination}</Text>
                                </View>
                            )}
                        </View>
                        {(quotation.port_of_loading || quotation.port_of_discharge) && (
                            <View style={{ flexDirection: 'row', borderBottomWidth: (quotation.terms_of_delivery || quotation.terms_of_payment) ? 1 : 0, borderBottomColor: '#000' }}>
                                {quotation.port_of_loading && (
                                    <View style={{ width: '50%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' }}>
                                        <Text style={styles.label}>Port of Loading:</Text>
                                        <Text style={{ fontSize: 7.5 }}>{quotation.port_of_loading}</Text>
                                    </View>
                                )}
                                {quotation.port_of_discharge && (
                                    <View style={{ width: '50%', padding: 4 }}>
                                        <Text style={styles.label}>Port of Discharge:</Text>
                                        <Text style={{ fontSize: 7.5 }}>{quotation.port_of_discharge}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                        {(quotation.terms_of_delivery || quotation.terms_of_payment) && (
                            <View style={{ flexDirection: 'row' }}>
                                {quotation.terms_of_delivery && (
                                    <View style={{ width: '50%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' }}>
                                        <Text style={styles.label}>Terms of Delivery:</Text>
                                        <Text style={{ fontSize: 7.5, fontWeight: 'bold' }}>{quotation.terms_of_delivery}</Text>
                                    </View>
                                )}
                                {quotation.terms_of_payment && (
                                    <View style={{ width: '50%', padding: 4 }}>
                                        <Text style={styles.label}>Terms of Payment:</Text>
                                        <Text style={{ fontSize: 7.5, fontWeight: 'bold' }}>{quotation.terms_of_payment}</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader} fixed>
                        <Text style={styles.col1}>SL.</Text>
                        <Text style={styles.col2}>DESCRIPTION OF GOODS</Text>
                        <Text style={styles.col3}>HS CODE</Text>
                        <Text style={styles.col4}>QTY</Text>
                        <Text style={styles.col5}>U.O.M</Text>
                        <Text style={styles.colRate}>RATE ({curr})</Text>
                        <Text style={styles.col6}>AMOUNT ({curr})</Text>
                    </View>
                    {items.map((item, index) => (
                        <View key={index} style={styles.tableRow} wrap={false}>
                            <Text style={styles.col1}>{index + 1}</Text>
                            <View style={styles.col2}>
                                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>{item.product_name || item.item_name}</Text>
                                {item.description && item.description !== item.product_name && (
                                    <Text style={{ fontSize: 7, color: '#444', marginTop: 1 }}>{item.description}</Text>
                                )}
                            </View>
                            <Text style={styles.col3}>{item.hsn_code || '-'}</Text>
                            <Text style={styles.col4}>{Number(item.quantity || 0).toFixed(2)}</Text>
                            <Text style={styles.col5}>{item.unit || 'KGS'}</Text>
                            <Text style={styles.colRate}>{Number(item.unit_price || 0).toFixed(2)}</Text>
                            <Text style={styles.col6}>{Number(item.amount || (item.quantity * item.unit_price) || 0).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals & Terms */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }} wrap={false}>
                    {/* Left: Terms */}
                    <View style={{ width: '55%', paddingRight: 10 }}>
                        {terms.length > 0 && (
                            <View>
                                <Text style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 4, fontSize: 8 }}>Terms & Conditions:</Text>
                                {terms.map((term, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', marginBottom: 2 }}>
                                        <Text style={{ width: 12, fontSize: 7.5, fontWeight: 'bold' }}>{idx + 1}</Text>
                                        <Text style={{ width: 80, fontSize: 7.5, fontWeight: 'bold' }}>{term.label}</Text>
                                        <Text style={{ width: 8, fontSize: 7.5 }}>:</Text>
                                        <Text style={{ flex: 1, fontSize: 7.5, lineHeight: 1.1 }}>{term.value}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Right: Subtotal Box */}
                    <View style={{ width: '45%', borderWidth: 1, borderColor: '#000', alignSelf: 'flex-start' }}>
                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' }}>
                            <Text style={{ width: '60%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', fontWeight: 'bold', textAlign: 'right', fontSize: 7.5 }}>SUB TOTAL</Text>
                            <Text style={{ width: '40%', padding: 4, textAlign: 'right', fontWeight: 'bold', fontSize: 7.5 }}>{fmt(subtotal)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6' }}>
                            <Text style={{ width: '60%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', fontWeight: 'bold', textAlign: 'right', fontSize: 8 }}>GRAND TOTAL</Text>
                            <Text style={{ width: '40%', padding: 4, textAlign: 'right', fontWeight: 'bold', fontSize: 8, color: '#0E5EB3' }}>{fmt(grandTotal)}</Text>
                        </View>
                    </View>
                </View>

                {/* Signature */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 30 }} wrap={false}>
                    <View style={{ width: '45%', alignItems: 'center' }}>
                        <Text style={{ fontSize: 7.5, marginBottom: 2 }}>Yours faithfully,</Text>
                        <Text style={{ fontSize: 7.5, fontWeight: 'bold', color: '#333' }}>For Energypac Engineering Limited.</Text>
                        <View style={{ marginTop: 30, width: 120, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 3, alignItems: 'center' }}>
                            <Text style={{ fontSize: 7.5, fontWeight: 'bold' }}>Authorized Signatory</Text>
                        </View>
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
