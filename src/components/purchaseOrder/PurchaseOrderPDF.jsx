
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
    col2: { width: '35%' },
    col3: { width: '15%' },
    col4: { width: '15%', textAlign: 'right' },
    col5: { width: '15%', textAlign: 'right' },
    col6: { width: '15%', textAlign: 'right' },
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

const PurchaseOrderPDF = ({ details }) => {
    const formatCurrency = (val) => Number(val || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyDetails}>
                        <Text style={styles.companyName}>ENERGYPAC</Text>
                        <Text style={styles.companySub}>Leading Energy Solutions Provider</Text>
                        <Text style={styles.companySub}>contact@energypac.com | +91 98765 43210</Text>
                    </View>
                    <View style={styles.titleSection}>
                        <Text style={styles.docTitle}>PURCHASE ORDER</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>PO Number:</Text>
                            <Text style={styles.value}>{details.po_number}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Date:</Text>
                            <Text style={styles.value}>{formatDate(details.created_at)}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Status:</Text>
                            <Text style={styles.value}>{details.status}</Text>
                        </View>
                    </View>
                </View>

                {/* Vendor Info */}
                <View style={styles.clientInfo}>
                    <Text style={styles.sectionTitle}>Vendor Details</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 2 }}>{details.vendor_name}</Text>
                    {details.contact_person && <Text style={styles.companySub}>{details.contact_person}</Text>}
                    {details.vendor_email && <Text style={styles.companySub}>{details.vendor_email}</Text>}
                    {details.vendor_phone && <Text style={styles.companySub}>{details.vendor_phone}</Text>}
                    {details.vendor_address && <Text style={[styles.companySub, { marginTop: 4, width: '60%' }]}>{details.vendor_address}</Text>}

                    <View style={{ marginTop: 8, flexDirection: 'row', gap: 20 }}>
                        <Text style={[styles.companySub, { color: '#444' }]}>Requisition Ref: <Text style={{ fontWeight: 'bold' }}>{details.requisition_number}</Text></Text>
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.col1]}>#</Text>
                        <Text style={[styles.headerCell, styles.col2]}>Product / Item</Text>
                        <Text style={[styles.headerCell, styles.col3]}>HSN Code</Text>
                        <Text style={[styles.headerCell, styles.col4]}>Qty</Text>
                        <Text style={[styles.headerCell, styles.col5]}>Rate</Text>
                        <Text style={[styles.headerCell, styles.col6]}>Amount</Text>
                    </View>

                    {details.items?.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.cell, styles.col1]}>{index + 1}</Text>
                            <View style={styles.col2}>
                                <Text style={[styles.cell, { fontWeight: 'bold' }]}>{item.product_name}</Text>
                                {item.product_code ? <Text style={[styles.cell, { fontSize: 8, color: '#64748B' }]}>{item.product_code}</Text> : null}
                                {item.description && item.description !== item.product_name ? <Text style={[styles.cell, { fontSize: 8, color: '#64748B' }]}>{item.description}</Text> : null}
                            </View>
                            <Text style={[styles.cell, styles.col3]}>{item.hsn_code}</Text>
                            <Text style={[styles.cell, styles.col4]}>{parseFloat(item.quantity || 0).toFixed(2)} {item.unit}</Text>
                            <Text style={[styles.cell, styles.col5]}>{formatCurrency(item.rate)}</Text>
                            <Text style={[styles.cell, styles.col6]}>{formatCurrency(item.amount)}</Text>
                        </View>
                    ))}
                </View>

                {/* Financials Breakdown */}
                <View style={styles.totals}>
                    <View style={styles.totalBox}>
                        <View style={styles.grandTotal}>
                            <Text>Total Amount</Text>
                            <Text>{formatCurrency(details.total_amount)}</Text>
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

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        This is a computer-generated document. No signature is required.
                    </Text>
                    <Text style={styles.footerText}>
                        Thank you for partner with EnergyPac!
                    </Text>
                </View>

            </Page>
        </Document>
    );
};

export default PurchaseOrderPDF;
