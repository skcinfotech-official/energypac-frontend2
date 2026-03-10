
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
    col1: { width: '8%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col2: { width: '40%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
    col3: { width: '12%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col4: { width: '12%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col5: { width: '12%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    col6: { width: '16%', padding: 4, textAlign: 'right' },

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
    const formatCurrency = (val) => Number(val || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
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
                        <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>QUOTATION REF:</Text>
                            <Text style={styles.detailsValue}>{details.quotation_number}</Text>
                        </View>
                        <View style={[styles.detailsRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.detailsLabel}>STATUS:</Text>
                            <Text style={styles.detailsValue}>{details.status}</Text>
                        </View>
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
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>SL NO</Text>
                        <Text style={styles.col2}>PRODUCT / ITEM</Text>
                        <Text style={styles.col3}>HSN CODE</Text>
                        <Text style={styles.col4}>QTY</Text>
                        <Text style={styles.col5}>RATE</Text>
                        <Text style={styles.col6}>AMOUNT</Text>
                    </View>

                    {details.items?.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
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
                        <Text style={[styles.totalsLabelBlock, { color: '#dc2626' }]}>NET PAYABLE</Text>
                        <Text style={[styles.totalsValueBlock, { color: '#dc2626' }]}>{formatCurrency(details.total_amount - details.advance_amount)}</Text>
                    </View>
                </View>

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

