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
    col2: { width: '30%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
    col3: { width: '10%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col4: { width: '10%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    col5: { width: '8%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    colRate: { width: '14%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    col6: { width: '22%', padding: 4, textAlign: 'right' },
    label: { fontSize: 6.5, fontWeight: 'bold', color: '#444', marginBottom: 1, textTransform: 'uppercase' },
});

const EnergypacLogo = () => (
    <Image src={`${window.location.origin}/logo.jpeg`} style={{ width: 180, height: 25, marginBottom: 5 }} />
);

const BillPDF = ({ details }) => {
    if (!details) return null;

    const fmt = (val) => `₹ ${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
    };

    const items = details.items || [];
    const subtotal = parseFloat(details.subtotal || 0);
    const cgstPct = parseFloat(details.cgst_percentage || 0);
    const sgstPct = parseFloat(details.sgst_percentage || 0);
    const igstPct = parseFloat(details.igst_percentage || 0);
    const cgstAmt = parseFloat(details.cgst_amount || 0);
    const sgstAmt = parseFloat(details.sgst_amount || 0);
    const igstAmt = parseFloat(details.igst_amount || 0);
    const totalGst = cgstAmt + sgstAmt + igstAmt;
    const discountAmt = parseFloat(details.discount_amount || 0);
    const totalAmount = parseFloat(details.total_amount || 0);
    const advanceDeducted = parseFloat(details.advance_deducted || 0);
    const netPayable = parseFloat(details.net_payable || 0);
    const amountPaid = parseFloat(details.amount_paid || 0);
    const balance = parseFloat(details.balance || 0);

    const InfoRow = ({ label, value }) => value ? (
        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
            <Text style={{ width: '35%', fontSize: 7.5, fontWeight: 'bold' }}>{label} :</Text>
            <Text style={{ width: '65%', fontSize: 7.5 }}>{value}</Text>
        </View>
    ) : null;

    const TotalRow = ({ label, value, bold, color }) => (
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' }}>
            <Text style={{ width: '60%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', fontWeight: bold ? 'bold' : 'normal', textAlign: 'right', fontSize: 7.5, color: color || '#000' }}>{label}</Text>
            <Text style={{ width: '40%', padding: 4, textAlign: 'right', fontWeight: bold ? 'bold' : 'normal', fontSize: 7.5, color: color || '#000' }}>{value}</Text>
        </View>
    );

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

                {/* Title + Details */}
                <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 8 }}>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', padding: 4, alignItems: 'center', backgroundColor: '#F9FAFB' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>TAX INVOICE / BILL</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        {/* Left: Client Info */}
                        <View style={{ width: '55%', padding: 5, borderRightWidth: 1, borderRightColor: '#000', minHeight: 70 }}>
                            <Text style={styles.label}>Bill To:</Text>
                            <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2 }}>{details.client_name}</Text>
                            {details.address && <Text style={{ fontSize: 6.5, color: '#333', lineHeight: 1.2 }}>{details.address}</Text>}
                            {details.contact_person && <Text style={{ fontSize: 7, marginTop: 3 }}>Contact: {details.contact_person}</Text>}
                            {details.phone && <Text style={{ fontSize: 7 }}>Phone: {details.phone}</Text>}
                            {details.email && <Text style={{ fontSize: 7 }}>Email: {details.email}</Text>}
                        </View>
                        {/* Right: Bill Details */}
                        <View style={{ width: '45%', padding: 5 }}>
                            <InfoRow label="BILL NO" value={details.bill_number} />
                            <InfoRow label="DATE" value={formatDate(details.bill_date)} />
                            <InfoRow label="PI NUMBER" value={details.pi_number} />
                            <InfoRow label="BILL TYPE" value={details.bill_type || 'DOMESTIC'} />
                            <InfoRow label="STATUS" value={details.status} />
                            <InfoRow label="CREATED BY" value={details.created_by_name} />
                        </View>
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader} fixed>
                        <Text style={styles.col1}>SL.</Text>
                        <Text style={styles.col2}>DESCRIPTION</Text>
                        <Text style={styles.col3}>HSN CODE</Text>
                        <Text style={styles.col4}>QTY</Text>
                        <Text style={styles.col5}>UNIT</Text>
                        <Text style={styles.colRate}>RATE (INR)</Text>
                        <Text style={styles.col6}>AMOUNT (INR)</Text>
                    </View>
                    {items.map((item, index) => (
                        <View key={index} style={styles.tableRow} wrap={false}>
                            <Text style={styles.col1}>{index + 1}</Text>
                            <View style={styles.col2}>
                                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>{item.item_name}</Text>
                                {(item.product_code || item.item_code) && (
                                    <Text style={{ fontSize: 6.5, color: '#444', marginTop: 1 }}>{item.product_code || item.item_code}</Text>
                                )}
                            </View>
                            <Text style={styles.col3}>{item.hsn_code || '-'}</Text>
                            <Text style={styles.col4}>{Number(item.quantity || 0).toFixed(2)}</Text>
                            <Text style={styles.col5}>{item.unit || 'PCS'}</Text>
                            <Text style={styles.colRate}>{Number(item.rate || 0).toFixed(2)}</Text>
                            <Text style={styles.col6}>{Number(item.amount || (item.quantity * item.rate) || 0).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }} wrap={false}>
                    <View style={{ width: '50%', borderWidth: 1, borderColor: '#000' }}>
                        <TotalRow label="SUB TOTAL" value={fmt(subtotal)} bold />
                        {cgstPct > 0 && <TotalRow label={`CGST @ ${cgstPct}%`} value={fmt(cgstAmt)} />}
                        {sgstPct > 0 && <TotalRow label={`SGST @ ${sgstPct}%`} value={fmt(sgstAmt)} />}
                        {igstPct > 0 && <TotalRow label={`IGST @ ${igstPct}%`} value={fmt(igstAmt)} />}
                        {totalGst > 0 && <TotalRow label="TOTAL GST" value={fmt(totalGst)} bold />}
                        {discountAmt > 0 && <TotalRow label="DISCOUNT" value={`- ${fmt(discountAmt)}`} />}
                        <TotalRow label="TOTAL AMOUNT" value={fmt(totalAmount)} bold />
                        {advanceDeducted > 0 && <TotalRow label="ADVANCE DEDUCTED" value={`- ${fmt(advanceDeducted)}`} />}
                        <TotalRow label="NET PAYABLE" value={fmt(netPayable)} bold color="#0E5EB3" />
                        <TotalRow label="AMOUNT PAID" value={fmt(amountPaid)} bold />
                        <View style={{ flexDirection: 'row', backgroundColor: balance > 0 ? '#FEF2F2' : '#F0FDF4' }}>
                            <Text style={{ width: '60%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', fontWeight: 'bold', textAlign: 'right', fontSize: 8, color: balance > 0 ? '#dc2626' : '#16a34a' }}>BALANCE DUE</Text>
                            <Text style={{ width: '40%', padding: 4, textAlign: 'right', fontWeight: 'bold', fontSize: 8, color: balance > 0 ? '#dc2626' : '#16a34a' }}>{fmt(balance)}</Text>
                        </View>
                    </View>
                </View>

                {/* Remarks */}
                {details.remarks && (
                    <View style={{ marginTop: 8 }} wrap={false}>
                        <Text style={{ fontWeight: 'bold', fontSize: 7.5, textDecoration: 'underline', marginBottom: 2 }}>Remarks:</Text>
                        <Text style={{ fontSize: 7.5 }}>{details.remarks}</Text>
                    </View>
                )}

                {/* Signature */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }} wrap={false}>
                    <View style={{ width: '45%' }}>
                        <View style={{ marginTop: 30, width: 130, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 3 }}>
                            <Text style={{ fontSize: 7.5, fontWeight: 'bold' }}>Receiver's Signature</Text>
                        </View>
                    </View>
                    <View style={{ width: '45%', alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 7.5, marginBottom: 2 }}>For Energypac Engineering Limited.</Text>
                        <View style={{ marginTop: 30, width: 130, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 3, alignItems: 'center' }}>
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

export default BillPDF;
