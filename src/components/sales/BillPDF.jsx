
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
    page: { padding: 40, fontFamily: 'Roboto', fontSize: 10, color: '#333' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 20 },
    companyDetails: { width: '50%' },
    titleSection: { width: '40%', alignItems: 'flex-end' },
    companyName: { fontSize: 24, fontWeight: 'bold', color: '#1a56db', marginBottom: 4 },
    companySub: { fontSize: 10, color: '#666', marginBottom: 2 },
    docTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    row: { flexDirection: 'row', marginBottom: 4 },
    label: { width: 80, color: '#666', textAlign: 'right', marginRight: 10 },
    value: { fontWeight: 'bold', textAlign: 'right' },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#1a56db', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    clientInfo: { marginBottom: 20 },
    table: { marginTop: 20, marginBottom: 20 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#cbd5e1' },
    tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    col1: { width: '5%' },
    col2: { width: '40%' },
    col3: { width: '15%', textAlign: 'right' },
    col4: { width: '20%', textAlign: 'right' },
    col5: { width: '20%', textAlign: 'right' },
    headerCell: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
    cell: { fontSize: 9, color: '#334155' },
    totals: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
    totalBox: { width: '50%' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    grandTotal: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: '#1a56db', marginTop: 4, paddingTop: 4, fontWeight: 'bold', color: '#1a56db', fontSize: 12 },
    footer: { position: 'absolute', bottom: 40, left: 40, right: 40, textAlign: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20, color: '#94a3b8', fontSize: 8 },
    remarksSection: {
        marginTop: 20,
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 4
    }
});

const BillPDF = ({ details }) => {
    const formatCurrency = (val) => Number(val || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB') : '';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.companyDetails}>
                        <Text style={styles.companyName}>ENERGYPAC</Text>
                        <Text style={styles.companySub}>Leading Energy Solutions Provider</Text>
                        <Text style={styles.companySub}>GSTIN: 27ABCDE1234F1Z5</Text>
                    </View>
                    <View style={styles.titleSection}>
                        <Text style={styles.docTitle}>INVOICE</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Bill No:</Text>
                            <Text style={styles.value}>{details.bill_number}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Date:</Text>
                            <Text style={styles.value}>{formatDate(details.bill_date)}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>WO Ref:</Text>
                            <Text style={styles.value}>{details.wo_number}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.clientInfo}>
                    <Text style={styles.sectionTitle}>Bill To</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 2 }}>{details.client_name}</Text>
                    {details.contact_person && <Text style={styles.companySub}>{details.contact_person}</Text>}
                    {details.email && <Text style={styles.companySub}>{details.email}</Text>}
                    {details.phone && <Text style={styles.companySub}>{details.phone}</Text>}
                    {details.address && <Text style={[styles.companySub, { marginTop: 4, width: '60%' }]}>{details.address}</Text>}
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.col1]}>#</Text>
                        <Text style={[styles.headerCell, styles.col2]}>Item Description</Text>
                        <Text style={[styles.headerCell, styles.col3]}>Qty</Text>
                        <Text style={[styles.headerCell, styles.col4]}>Rate</Text>
                        <Text style={[styles.headerCell, styles.col5]}>Amount</Text>
                    </View>
                    {details.items?.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.cell, styles.col1]}>{index + 1}</Text>
                            <View style={styles.col2}>
                                <Text style={[styles.cell, { fontWeight: 'bold' }]}>{item.item_name}</Text>
                                {item.item_code ? <Text style={[styles.cell, { fontSize: 8, color: '#64748B' }]}>{item.item_code}</Text> : null}
                                {/* Include description if it's not the same as item name */}
                                {item.description && item.description !== item.item_name && <Text style={[styles.cell, { fontSize: 8, color: '#64748B' }]}>{item.description}</Text>}
                            </View>
                            <Text style={[styles.cell, styles.col3]}>{item.delivered_quantity} {item.unit}</Text>
                            <Text style={[styles.cell, styles.col4]}>{formatCurrency(item.rate)}</Text>
                            <Text style={[styles.cell, styles.col5]}>{formatCurrency(item.amount)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.totals}>
                    <View style={styles.totalBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.companySub}>Subtotal</Text>
                            <Text style={styles.value}>{formatCurrency(details.subtotal)}</Text>
                        </View>

                        {/* TAXES */}
                        {parseFloat(details.cgst_amount) > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.companySub}>CGST ({details.cgst_percentage}%)</Text>
                                <Text style={styles.value}>{formatCurrency(details.cgst_amount)}</Text>
                            </View>
                        )}
                        {parseFloat(details.sgst_amount) > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.companySub}>SGST ({details.sgst_percentage}%)</Text>
                                <Text style={styles.value}>{formatCurrency(details.sgst_amount)}</Text>
                            </View>
                        )}
                        {parseFloat(details.igst_amount) > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.companySub}>IGST ({details.igst_percentage}%)</Text>
                                <Text style={styles.value}>{formatCurrency(details.igst_amount)}</Text>
                            </View>
                        )}
                        {/* Total Tax */}
                        <View style={styles.totalRow}>
                            <Text style={styles.companySub}>Total Tax</Text>
                            <Text style={styles.value}>{formatCurrency(details.total_gst)}</Text>
                        </View>

                        {/* Total Amount */}
                        <View style={styles.grandTotal}>
                            <Text>Total Bill Amount</Text>
                            <Text>{formatCurrency(details.total_amount)}</Text>
                        </View>

                        <View style={styles.totalRow}>
                            <Text style={styles.companySub}>Advance Deducted</Text>
                            <Text style={styles.value}>{formatCurrency(details.advance_deducted)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={[styles.companySub, { fontWeight: 'bold', color: '#1a56db' }]}>Net Payable</Text>
                            <Text style={[styles.value, { color: '#1a56db' }]}>{formatCurrency(details.net_payable)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.companySub}>Amount Paid</Text>
                            <Text style={styles.value}>{formatCurrency(details.amount_paid)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={[styles.companySub, { fontWeight: 'bold' }]}>Balance Due</Text>
                            <Text style={[styles.value, { color: '#dc2626' }]}>{formatCurrency(details.balance)}</Text>
                        </View>
                    </View>
                </View>


                {/* Remarks */}
                {details.remarks && (
                    <View style={styles.remarksSection}>
                        <Text style={styles.sectionTitle}>Remarks</Text>
                        <Text style={styles.companySub}>{details.remarks}</Text>
                    </View>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Thank you for your business!</Text>
                    <Text style={styles.footerText}>Authorized Signatory</Text>
                </View>
            </Page>
        </Document>
    );
};

export default BillPDF;
