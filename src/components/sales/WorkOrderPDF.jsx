
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
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
    page: { padding: 30, paddingBottom: 60, fontFamily: 'Roboto', fontSize: 9, color: '#000' },

    // 1. Letterhead
    headerCenter: { alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 10 },
    companyName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    companySub: { fontSize: 9, marginBottom: 2 },
    docTitle: { fontSize: 12, fontWeight: 'bold', textDecoration: 'underline', textAlign: 'center', marginBottom: 15 },

    // 2. Top Info Sections
    topSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    clientInfo: { width: '45%' },
    detailsBox: { width: '50%', borderWidth: 1, borderColor: '#000' },
    detailsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    detailsLabel: { width: '35%', padding: 4, fontWeight: 'bold', borderRightWidth: 1, borderRightColor: '#000' },
    detailsValue: { width: '65%', padding: 4 },

    // 3. Subject & Attention
    textBlock: { marginBottom: 4, flexDirection: 'row' },
    boldLabel: { fontWeight: 'bold', marginRight: 5 },

    // 4. Table Structure
    table: { marginTop: 15, borderWidth: 1, borderColor: '#000' },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    col6: { width: '16%', padding: 4, textAlign: 'right' },

    // Dynamic columns for Foreign Currency (International)
    col1_fc: { width: '4%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col2_fc: { width: '22%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
    col3_fc: { width: '8%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col4_fc: { width: '8%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col5_fc: { width: '13%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    col6_fc: { width: '15%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    col7_fc: { width: '14%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    col8_fc: { width: '16%', padding: 4, textAlign: 'right' },

    // 5. Totals Section
    totalsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    totalsLabelBlock: { width: '84%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right', fontWeight: 'bold' },
    totalsValueBlock: { width: '16%', padding: 4, textAlign: 'right', fontWeight: 'bold' },

    // 6. Extras
    amountInWords: { marginTop: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    termsSection: { marginTop: 15 },
    termsTitle: { fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 },
    signatureSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 50 },
    signatureBox: { alignItems: 'center' },
    signatureLine: { width: 150, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5, textAlign: 'center', fontWeight: 'bold' },

    pageFooter: {
        position: 'absolute',
        bottom: 16,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 9,
        fontWeight: 'bold',
    },

    watermarkContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    watermarkText: {
        fontSize: 70,
        fontWeight: 'bold',
        color: '#75b4d1',
        transform: 'rotate(-45deg)',
        opacity: 0.35,
        letterSpacing: 10,
    },
});

const WorkOrderPDF = ({ details }) => {
    const isInternational = details.currency && details.currency.toUpperCase() !== 'INR';

    const formatCurrency = (val, curr = "INR") => {
        const c = curr?.toString().trim().toUpperCase() || "INR";
        const symbol = c === "USD" ? "$" : (c === "INR" ? "₹" : c);
        
        const num = Number(val || 0);
        const formatted = num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        return `${symbol} ${formatted}`;
    };

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.') : '';

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* DIAGONAL WATERMARK */}
                <View style={styles.watermarkContainer} fixed>
                    <Text style={styles.watermarkText}>ENERGYPAC</Text>
                </View>

                {/* 1. Letterhead */}
                <View style={styles.headerCenter}>
                    <Text style={styles.companyName}>ENERGYPAC ENGINEERING LTD.</Text>
                    <Text style={styles.companySub}>KB-22, "Bhakta Tower", 4th Floor, Sector -III,</Text>
                    <Text style={styles.companySub}>Salt Lake City, KOLKATA - 700 098, INDIA.</Text>
                    <Text style={styles.companySub}>Tel.: 033 4006 5853 | GSTIN: 19AABCE4975G1ZE | FCRN: F06234</Text>
                    <Text style={styles.companySub}>E-mail: energypackolkata@gmail.com | eel@energypacindia.in</Text>
                </View>

                <Text style={styles.docTitle}>WORK ORDER</Text>

                {/* 2. Client & WO Details */}
                <View style={styles.topSection}>
                    <View style={styles.clientInfo}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>To,</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 10 }}>{details.client_name}</Text>
                        <Text>{details.address}</Text>
                        {details.phone && <Text>Ph: {details.phone}</Text>}
                        {details.email && <Text>Email: {details.email}</Text>}
                    </View>

                    <View style={styles.detailsBox}>
                        <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>W.O. NO:</Text>
                            <Text style={styles.detailsValue}>{details.wo_number}</Text>
                        </View>
                        <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>DATE:</Text>
                            <Text style={styles.detailsValue}>{formatDate(details.wo_date)}</Text>
                        </View>
                        <View style={[styles.detailsRow, { borderBottomWidth: 1 }]}>
                            <Text style={styles.detailsLabel}>QUOTATION REF:</Text>
                            <Text style={styles.detailsValue}>{details.quotation_number}</Text>
                        </View>
                        {isInternational ? (
                            <View style={[styles.detailsRow, { borderBottomWidth: 0, backgroundColor: '#f0f8ff' }]}>
                                <Text style={styles.detailsLabel}>EXCH. RATE:</Text>
                                <Text style={styles.detailsValue}>1 {details.currency} = INR {Number(details.exchange_rate).toFixed(2)}</Text>
                            </View>
                        ) : (
                            <View style={[styles.detailsRow, { borderBottomWidth: 0 }]}>
                                <Text style={styles.detailsLabel}>STATUS:</Text>
                                <Text style={styles.detailsValue}>{details.status}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 3. Subject & Attention */}
                {details.contact_person && (
                    <View style={styles.textBlock}>
                        <Text style={styles.boldLabel}>KIND ATTENTION:</Text>
                        <Text>{details.contact_person}</Text>
                    </View>
                )}
                {details.subject && (
                    <View style={styles.textBlock}>
                        <Text style={styles.boldLabel}>SUBJECT:</Text>
                        <Text>{details.subject}</Text>
                    </View>
                )}

                {/* 4. Items Table */}
                <View style={styles.table}>
                    {isInternational ? (
                        <View style={styles.tableHeader}>
                            <Text style={styles.col1_fc}>SL</Text>
                            <Text style={styles.col2_fc}>ITEM</Text>
                            <Text style={styles.col3_fc}>HSN</Text>
                            <Text style={styles.col4_fc}>QTY</Text>
                            <Text style={styles.col7_fc}>RATE({details.currency})</Text>
                            <Text style={styles.col8_fc}>AMOUNT({details.currency})</Text>
                            <Text style={styles.col5_fc}>RATE(INR)</Text>
                            <Text style={styles.col6_fc}>AMOUNT(INR)</Text>
                        </View>
                    ) : (
                        <View style={styles.tableHeader}>
                            <Text style={styles.col1}>SL NO</Text>
                            <Text style={styles.col2}>PRODUCT / ITEM</Text>
                            <Text style={styles.col3}>HSN CODE</Text>
                            <Text style={styles.col4}>QTY</Text>
                            <Text style={styles.col5}>RATE</Text>
                            <Text style={styles.col6}>AMOUNT</Text>
                        </View>
                    )}

                    {details.items?.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            {isInternational ? (
                                <>
                                    <Text style={styles.col1_fc}>{index + 1}</Text>
                                    <View style={styles.col2_fc}>
                                        <Text style={{ fontWeight: 'bold' }}>{item.item_name}</Text>
                                        {item.item_code && <Text style={{ fontSize: 7, color: '#444' }}>{item.item_code}</Text>}
                                        {item.remarks && <Text style={{ fontSize: 7, color: '#555' }}>Rem: {item.remarks}</Text>}
                                    </View>
                                    <Text style={styles.col3_fc}>{item.hsn_code}</Text>
                                    <Text style={styles.col4_fc}>{parseFloat(item.ordered_quantity || 0).toFixed(2)} {item.unit}</Text>
                                    <Text style={styles.col7_fc}>{formatCurrency(item.original_rate || (item.rate / (details.exchange_rate || 1)), details.currency)}</Text>
                                    <Text style={styles.col8_fc}>{formatCurrency(item.original_amount || (item.amount / (details.exchange_rate || 1)), details.currency)}</Text>
                                    <Text style={styles.col5_fc}>{formatCurrency(item.rate, 'INR')}</Text>
                                    <Text style={styles.col6_fc}>{formatCurrency(item.amount, 'INR')}</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.col1}>{index + 1}</Text>
                                    <View style={styles.col2}>
                                        <Text style={{ fontWeight: 'bold' }}>{item.item_name}</Text>
                                        {item.item_code && <Text style={{ fontSize: 8, color: '#444' }}>{item.item_code}</Text>}
                                        {item.description && item.description !== item.item_name && <Text style={{ fontSize: 8, color: '#444' }}>{item.description}</Text>}
                                        {item.remarks && <Text style={{ fontSize: 8, color: '#555' }}>Remark: {item.remarks}</Text>}
                                    </View>
                                    <Text style={styles.col3}>{item.hsn_code}</Text>
                                    <Text style={styles.col4}>{parseFloat(item.ordered_quantity || 0).toFixed(2)} {item.unit}</Text>
                                    <Text style={styles.col5}>{formatCurrency(item.rate)}</Text>
                                    <Text style={styles.col6}>{formatCurrency(item.amount)}</Text>
                                </>
                            )}
                        </View>
                    ))}

                    {/* 5. Totals */}
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabelBlock}>SUB TOTAL</Text>
                        <Text style={styles.totalsValueBlock}>{formatCurrency(details.subtotal)}</Text>
                    </View>
                    {parseFloat(details.cgst_amount) > 0 && (
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabelBlock}>CGST @ {details.cgst_percentage}%</Text>
                            <Text style={styles.totalsValueBlock}>{formatCurrency(details.cgst_amount)}</Text>
                        </View>
                    )}
                    {parseFloat(details.sgst_amount) > 0 && (
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabelBlock}>SGST @ {details.sgst_percentage}%</Text>
                            <Text style={styles.totalsValueBlock}>{formatCurrency(details.sgst_amount)}</Text>
                        </View>
                    )}
                    {parseFloat(details.igst_amount) > 0 && (
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabelBlock}>IGST @ {details.igst_percentage}%</Text>
                            <Text style={styles.totalsValueBlock}>{formatCurrency(details.igst_amount)}</Text>
                        </View>
                    )}
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabelBlock}>TOTAL AMOUNT</Text>
                        <Text style={styles.totalsValueBlock}>{formatCurrency(details.total_amount)}</Text>
                    </View>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabelBlock}>ADVANCE PAID</Text>
                        <Text style={styles.totalsValueBlock}>{formatCurrency(details.advance_amount)}</Text>
                    </View>
                    <View style={[styles.totalsRow, { borderBottomWidth: 0 }]}>
                        <Text style={[styles.totalsLabelBlock, { color: '#dc2626' }]}>NET PAYABLE (INR)</Text>
                        <Text style={[styles.totalsValueBlock, { color: '#dc2626' }]}>{formatCurrency(details.total_amount - details.advance_amount)}</Text>
                    </View>
                </View>

                {/* Original Currency Summary Block */}
                {isInternational && (
                    <View style={{ marginTop: 10, padding: 5, backgroundColor: '#f0f8ff', borderWidth: 1, borderColor: '#accce6' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 8, marginBottom: 4, color: '#2d5a84' }}>ORIGINAL CURRENCY SUMMARY ({details.currency})</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={{ fontSize: 8 }}>Subtotal ({details.currency})</Text>
                            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{formatCurrency(details.original_subtotal || (details.subtotal / (details.exchange_rate || 1)), details.currency)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={{ fontSize: 8 }}>Total Tax ({details.currency})</Text>
                            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>
                                {formatCurrency(
                                    details.original_total_tax || 
                                    ((Number(details.cgst_amount || 0) + Number(details.sgst_amount || 0) + Number(details.igst_amount || 0)) / (details.exchange_rate || 1)), 
                                    details.currency
                                )}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={{ fontSize: 8 }}>Advance Received ({details.currency})</Text>
                            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{formatCurrency(details.original_advance_amount || (details.advance_amount / (details.exchange_rate || 1)), details.currency)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#accce6', pt: 2 }}>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Net Payable ({details.currency})</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(details.original_net_payable || ((details.total_amount - details.advance_amount) / (details.exchange_rate || 1)), details.currency)}</Text>
                        </View>
                    </View>
                )}

                {/* Amount in Words */}
                {details.amount_in_words && (
                    <Text style={styles.amountInWords}>AMOUNT IN WORDS: {details.amount_in_words}</Text>
                )}

                {/* Remarks */}
                {details.remarks && (
                    <View style={styles.termsSection}>
                        <Text style={styles.termsTitle}>Remarks:-</Text>
                        <Text style={{ fontSize: 9 }}>{details.remarks}</Text>
                    </View>
                )}

                <Text style={{ marginTop: 20 }}>Thanking You,</Text>

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLine}>Checked By</Text>
                    </View>
                    <View style={[styles.signatureBox, { alignItems: 'flex-end' }]}>
                        <Text style={{ marginBottom: 30 }}>For Energypac Engineering Limited.</Text>
                        <Text style={styles.signatureLine}>(Authorized Signatory)</Text>
                    </View>
                </View>

                <Text style={styles.pageFooter}>
                    *** This is a Computer Generated Document. No Signature Required. ***
                </Text>

            </Page>
        </Document>
    );
};

export default WorkOrderPDF;

