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
    page: { padding: 30, paddingBottom: 60, fontFamily: 'Roboto', fontSize: 9, color: '#000' },

    // 1. Letterhead
    letterhead: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 6, marginBottom: 15 },
    logoStyle: { width: 180, height: 25, marginBottom: 5 },
    companyInfo: { alignItems: 'flex-end', justifyContent: 'center' },
    companyName: { fontSize: 10, fontWeight: 'bold', color: '#0E5EB3' },
    companySub: { fontSize: 6.5, color: '#333', marginTop: 1 },
    docTitle: { fontSize: 12, fontWeight: 'bold', textDecoration: 'underline', textAlign: 'center', marginBottom: 15 },

    // 2. Top Info Sections
    topSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    leftBox: { width: '45%' },
    detailsBox: { width: '50%', borderWidth: 1, borderColor: '#000' },
    detailsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    detailsLabel: { width: '45%', padding: 4, fontWeight: 'bold', borderRightWidth: 1, borderRightColor: '#000' },
    detailsValue: { width: '55%', padding: 4 },

    // 3. Table Structure
    table: { marginTop: 15, borderWidth: 1, borderColor: '#000' },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', fontWeight: 'bold', backgroundColor: '#f0f0f0' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
    
    col1: { width: '8%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col2: { width: '37%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
    col3: { width: '15%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col4: { width: '15%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    col5: { width: '25%', padding: 4 },

    // 4. Extras
    remarksSection: { marginTop: 15 },
    remarksTitle: { fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 },
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
        opacity: 0.2,
        letterSpacing: 10,
    },
});

const RequisitionPDF = ({ details }) => {
    const formatDate = (date) => {
        if (!date) return '';
        try {
            return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
        } catch (e) {
            return date;
        }
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* DIAGONAL WATERMARK */}
                <View style={styles.watermarkContainer} fixed>
                    <Text style={styles.watermarkText}>ENERGYPAC</Text>
                </View>

                {/* 1. Letterhead */}
                <View style={styles.letterhead}>
                    <Image src={`${window.location.origin}/logo.jpeg`} style={styles.logoStyle} />
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>ENERGYPAC ENGINEERING LTD.</Text>
                        <Text style={styles.companySub}>KB-22, "Bhakta Tower", 4th Floor, Sector -III,</Text>
                        <Text style={styles.companySub}>Salt Lake City, KOLKATA - 700 098, INDIA.</Text>
                        <Text style={styles.companySub}>Tel.: 033 4006 5853 | GSTIN: 19AABCE4975G1ZE | FCRN: F06234</Text>
                        <Text style={styles.companySub}>E-mail: energypackolkata@gmail.com | eel@energypacindia.in</Text>
                    </View>
                </View>

                <Text style={styles.docTitle}>REQUISITION REPORT</Text>

                {/* 2. Requisition Info Block */}
                <View style={styles.topSection}>
                    <View style={styles.leftBox}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Department: Engineering / Operations</Text>
                        <Text style={{ color: '#444' }}>Requisition for stock items and services.</Text>
                    </View>

                    <View style={styles.detailsBox}>
                        <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>REQUISITION NO:</Text>
                            <Text style={styles.detailsValue}>{details.requisition_number}</Text>
                        </View>
                        <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>DATE:</Text>
                            <Text style={styles.detailsValue}>{formatDate(details.requisition_date)}</Text>
                        </View>
                        <View style={[styles.detailsRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.detailsLabel}>STATUS:</Text>
                            <Text style={[styles.detailsValue, { fontWeight: 'bold', color: details.is_assigned ? '#15803d' : '#b45309' }]}>
                                {details.is_assigned ? 'ASSIGNED' : 'PENDING'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 3. Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>SL NO</Text>
                        <Text style={styles.col2}>PRODUCT / ITEM</Text>
                        <Text style={styles.col3}>CODE</Text>
                        <Text style={styles.col4}>QUANTITY</Text>
                        <Text style={styles.col5}>REMARKS</Text>
                    </View>

                    {details.items?.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.col1}>{index + 1}</Text>
                            <View style={styles.col2}>
                                <Text style={{ fontWeight: 'bold' }}>{item.product_name}</Text>
                            </View>
                            <Text style={styles.col3}>{item.product_code || 'N/A'}</Text>
                            <Text style={styles.col4}>
                                {parseFloat(item.quantity || 0).toFixed(2)} {item.unit || ''}
                            </Text>
                            <Text style={styles.col5}>{item.remarks || '-'}</Text>
                        </View>
                    ))}
                </View>

                {/* Remarks */}
                {details.remarks && (
                    <View style={styles.remarksSection}>
                        <Text style={styles.remarksTitle}>Remarks / Internal Notes:-</Text>
                        <Text style={{ fontSize: 9, lineHeight: 1.4 }}>{details.remarks}</Text>
                    </View>
                )}

                <Text style={{ marginTop: 25 }}>Prepared By: {details.created_by_name || '—'}</Text>

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLine}>Prepared By</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLine}>Checked By</Text>
                    </View>
                    <View style={[styles.signatureBox, { alignItems: 'flex-end' }]}>
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

export default RequisitionPDF;
