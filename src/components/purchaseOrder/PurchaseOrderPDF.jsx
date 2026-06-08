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
    page: { 
        padding: 30, 
        paddingBottom: 40, 
        fontFamily: 'Roboto', 
        fontSize: 8, 
        color: '#000' 
    },
    
    // Watermark
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
        color: '#e2f0fd',
        transform: 'rotate(-45deg)',
        opacity: 0.5,
        letterSpacing: 10,
    },

    // Table Structure
    table: { 
        marginTop: 10, 
        borderWidth: 1, 
        borderColor: '#000' 
    },
    tableHeader: { 
        flexDirection: 'row', 
        borderBottomWidth: 1, 
        borderBottomColor: '#000', 
        fontWeight: 'bold',
        backgroundColor: '#E5E7EB',
        alignItems: 'center'
    },
    tableRow: { 
        flexDirection: 'row', 
        borderBottomWidth: 1, 
        borderBottomColor: '#000',
        alignItems: 'center',
        minHeight: 24
    },
    col1: { width: '7%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col2: { width: '33%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
    col3: { width: '10%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col4: { width: '10%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    col5: { width: '8%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    col_rate: { width: '14%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    col6: { width: '18%', padding: 4, textAlign: 'right' }
});

const EnergypacLogo = () => (
    <Image 
        src={`${window.location.origin}/logo.jpeg`} 
        style={{ width: 180, height: 25, marginBottom: 5 }} 
    />
);

const getCurrencySymbol = (code) => {
    switch (code?.toUpperCase()) {
        case "USD": return "$";
        case "EUR": return "€";
        case "GBP": return "£";
        case "JPY": return "¥";
        case "INR": return "₹";
        default: return code || "₹";
    }
};

const PurchaseOrderPDF = ({ details }) => {
    const poCurrency = (details.currency || 'INR').toUpperCase();

    const formatCurrency = (val, curr = "INR") => {
        const c = curr?.toString().trim().toUpperCase() || "INR";
        const symbol = getCurrencySymbol(c);
        const locale = c === 'INR' ? 'en-IN' : 'en-US';

        return `${symbol} ${Number(val || 0).toLocaleString(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        }).replace(/\//g, '.');
    };

    // Standard fallback terms if none selected/provided
    const defaultTerms = [
        "Price: Ex-Works.",
        "GST: 0.1% Extra as we shall Exporting these items.",
        "Delivery: Within 4-6 weeks.",
        "Payment: 25% advance & balance against Proforma Invoice before dispatch.",
        "Warranty: One year from the date of dispatch.",
        "Test Certificates: You will have to provide us with all Test Certificates and Catalogues.",
        "Packing: The above rates are inclusive of Standard Gunny Bags Packing.",
        "Tolerance: ± on Qty & Value."
    ];

    const rawTerms = details.terms_and_conditions && details.terms_and_conditions.length > 0
        ? details.terms_and_conditions
        : (details.selectedTerms && details.selectedTerms.length > 0 ? details.selectedTerms : defaultTerms);

    const termsToRender = rawTerms.map((term, index) => {
        let label = `Term ${index + 1}`;
        let value = '';

        if (typeof term === 'string') {
            const colonIdx = term.indexOf(':');
            if (colonIdx !== -1) {
                label = term.substring(0, colonIdx).trim();
                value = term.substring(colonIdx + 1).trim();
            } else {
                value = term.trim();
            }
        } else if (Array.isArray(term)) {
            if (term.length >= 2) {
                label = term[0];
                value = term[1];
            } else if (term.length === 1) {
                value = term[0];
            }
        } else if (term && typeof term === 'object') {
            if (term.type || term.key || term.label) {
                label = term.type || term.key || term.label;
                value = term.value || '';
            } else {
                const keys = Object.keys(term);
                if (keys.length > 0) {
                    label = keys[0];
                    value = term[keys[0]] || '';
                }
            }
        }

        return {
            id: `term-${index}`,
            label: label,
            value: value
        };
    }).filter(Boolean);

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* DIAGONAL WATERMARK */}
                <View style={styles.watermarkContainer} fixed>
                    <Text style={styles.watermarkText}>ENERGYPAC</Text>
                </View>

                {/* 1. Letterhead */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1.5, borderBottomColor: '#000', paddingBottom: 6, marginBottom: 8 }}>
                    <EnergypacLogo />
                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0E5EB3' }}>ENERGYPAC ENGINEERING LTD.</Text>
                        <Text style={{ fontSize: 6.5, color: '#333', marginTop: 1.5 }}>KB-22, "Bhakta Tower", 4th Floor, Sector -III,</Text>
                        <Text style={{ fontSize: 6.5, color: '#333' }}>Salt Lake City, KOLKATA - 700 098, INDIA.</Text>
                        <Text style={{ fontSize: 6.5, color: '#333' }}>Tel. : 033 4006 5853, GSTIN : 19AABCE4975G1ZE, FCRN : F06234</Text>
                        <Text style={{ fontSize: 6.5, color: '#333' }}>E-mail : energypackolkata@gmail.com | eel@energypacindia.in</Text>
                    </View>
                </View>

                {/* 2. Purchase Order Details Box */}
                <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 8 }}>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', padding: 4, alignItems: 'center', backgroundColor: '#F9FAFB' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>Purchase order note sheet</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        {/* Left Vendor Info */}
                        <View style={{ width: '55%', padding: 5, borderRightWidth: 1, borderRightColor: '#000', minHeight: 70 }}>
                            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#000' }}>M/S. {details.vendor_name || details.vendor?.vendor_name || details.vendor?.name}</Text>
                            <Text style={{ fontSize: 7.5, color: '#333', marginTop: 2, lineHeight: 1.2 }}>
                                {details.vendor_details?.address || details.vendor?.address || details.vendor_address || ''}
                            </Text>
                            {(details.vendor_details?.gst_number || details.vendor_details?.gst_no || details.vendor?.gst_number || details.vendor?.gst_no || details.vendor_gst) && (
                                <Text style={{ fontSize: 7.5, fontWeight: 'bold', color: '#000', marginTop: 4 }}>
                                    GST NO : {details.vendor_details?.gst_number || details.vendor_details?.gst_no || details.vendor?.gst_number || details.vendor?.gst_no || details.vendor_gst}
                                </Text>
                            )}
                        </View>
                        {/* Right PO Details */}
                        <View style={{ width: '45%', padding: 5, minHeight: 70 }}>
                            <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                                <Text style={{ width: '30%', fontSize: 7.5, fontWeight: 'bold' }}>P.O. NO :</Text>
                                <Text style={{ width: '70%', fontSize: 7.5, fontWeight: 'bold' }}>{details.po_number}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                                <Text style={{ width: '30%', fontSize: 7.5, fontWeight: 'bold' }}>DATE :</Text>
                                <Text style={{ width: '70%', fontSize: 7.5 }}>{formatDate(details.created_at || details.po_date)}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                                <Text style={{ width: '30%', fontSize: 7.5, fontWeight: 'bold' }}>YOUR REF :</Text>
                                <Text style={{ width: '70%', fontSize: 7.5, lineHeight: 1.2 }}>{details.requisition_number || 'Verbal'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                                <Text style={{ width: '30%', fontSize: 7.5, fontWeight: 'bold' }}>CURRENCY :</Text>
                                <Text style={{ width: '70%', fontSize: 7.5 }}>{poCurrency}</Text>
                            </View>
                            {poCurrency !== 'INR' && details.conversion_rate && (
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={{ width: '30%', fontSize: 7.5, fontWeight: 'bold' }}>CONV. RATE :</Text>
                                    <Text style={{ width: '70%', fontSize: 7.5 }}>1 {poCurrency} = ₹{parseFloat(details.conversion_rate)}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    {/* Kind Attention Row */}
                    {details.contact_person && (
                        <View style={{ borderTopWidth: 1, borderTopColor: '#000', padding: 3, alignItems: 'center', backgroundColor: '#F9FAFB' }}>
                            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>KIND ATTENTION : {details.contact_person.toUpperCase()}</Text>
                        </View>
                    )}
                </View>

                {/* 3. Subject and Project */}
                {(details.subject || details.project_name || details.project) && (
                    <View style={{ borderWidth: 1, borderColor: '#000', padding: 4, backgroundColor: '#F3F4F6', marginBottom: 8 }}>
                        {details.subject && (
                            <View style={{ flexDirection: 'row', marginBottom: 1 }}>
                                <Text style={{ fontSize: 7.5, fontWeight: 'bold', width: 60 }}>SUBJECT : </Text>
                                <Text style={{ fontSize: 7.5, fontWeight: 'bold', textDecoration: 'underline' }}>{details.subject.toUpperCase()}</Text>
                            </View>
                        )}
                        {(details.project_name || details.project) && (
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={{ fontSize: 7.5, fontWeight: 'bold', width: 60 }}>PROJECT : </Text>
                                <Text style={{ fontSize: 7.5, fontWeight: 'bold', textDecoration: 'underline' }}>{(details.project_name || details.project || '').toUpperCase()}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* 4. Items Table */}
                <View style={styles.table}>
                    <View style={[styles.tableHeader, { backgroundColor: '#E5E7EB' }]} fixed>
                        <Text style={styles.col1}>SL. NO.</Text>
                        <Text style={styles.col2}>DESCRIPTION</Text>
                        <Text style={styles.col3}>HS CODE</Text>
                        <Text style={styles.col4}>TOTAL QTY</Text>
                        <Text style={styles.col5}>U.O.M</Text>
                        <Text style={styles.col_rate}>RATE ({poCurrency})</Text>
                        <Text style={styles.col6}>AMOUNT ({poCurrency})</Text>
                    </View>

                    {details.items?.map((item, index) => (
                        <View key={index} style={styles.tableRow} wrap={false}>
                            <Text style={styles.col1}>{index + 1}</Text>
                            <View style={styles.col2}>
                                <Text style={{ fontWeight: 'bold', fontSize: 8 }}>{item.product_name}</Text>
                                {item.description && item.description !== item.product_name && (
                                    <Text style={{ fontSize: 7, color: '#444', marginTop: 1.5 }}>{item.description}</Text>
                                )}
                            </View>
                            <Text style={styles.col3}>{item.hsn_code || item.hs_code || '-'}</Text>
                            <Text style={styles.col4}>
                                {parseFloat(item.quantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                            <Text style={styles.col5}>{item.unit || item.uom || 'KGS'}</Text>
                            <Text style={styles.col_rate}>{formatCurrency(item.rate, details.currency)}</Text>
                            <Text style={styles.col6}>{formatCurrency(item.amount, details.currency)}</Text>
                        </View>
                    ))}
                </View>

                {/* 5. Subtotals & Terms Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }} wrap={false}>
                    {/* Left: Amount in words and Terms & Conditions */}
                    <View style={{ width: '55%', paddingRight: 10 }}>
                        {details.amount_in_words && (
                            <Text style={{ fontSize: 7.5, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 }}>
                                AMOUNT IN WORD : {details.amount_in_words}
                            </Text>
                        )}
                        
                        {/* Terms Section */}
                        {termsToRender.length > 0 && (
                            <View>
                                <Text style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 4, fontSize: 8 }}>Terms & Conditions:-</Text>
                                {termsToRender.map((term, idx) => (
                                    <View key={term.id} style={{ flexDirection: 'row', marginBottom: 2 }}>
                                        <Text style={{ width: '12px', fontSize: 7.5, fontWeight: 'bold' }}>{idx + 1}</Text>
                                        <Text style={{ width: '80px', fontSize: 7.5, fontWeight: 'bold' }}>{term.label}</Text>
                                        <Text style={{ width: '8px', fontSize: 7.5, fontWeight: 'bold' }}>:</Text>
                                        <Text style={{ width: '200px', fontSize: 7.5, lineHeight: 1.1 }}>{term.value}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                    
                    {/* Right: Subtotal Table */}
                    <View style={{ width: '45%', borderWidth: 1, borderColor: '#000', alignSelf: 'flex-start' }}>
                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' }}>
                            <Text style={{ width: '60%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', fontWeight: 'bold', textAlign: 'right', fontSize: 7.5 }}>SUB TOTAL</Text>
                            <Text style={{ width: '40%', padding: 4, textAlign: 'right', fontWeight: 'bold', fontSize: 7.5 }}>
                                {formatCurrency(details.total_amount - (details.freight_cost || 0) - (details.cgst_amount || 0) - (details.sgst_amount || 0) - (details.igst_amount || 0), details.currency)}
                            </Text>
                        </View>
                        {parseFloat(details.freight_cost) > 0 && (
                            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' }}>
                                <Text style={{ width: '60%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', fontWeight: 'bold', textAlign: 'right', fontSize: 7.5 }}>FREIGHT COST</Text>
                                <Text style={{ width: '40%', padding: 4, textAlign: 'right', fontWeight: 'bold', fontSize: 7.5 }}>{formatCurrency(details.freight_cost, details.currency)}</Text>
                            </View>
                        )}
                        {parseFloat(details.sgst_amount) > 0 && (
                            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' }}>
                                <Text style={{ width: '60%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', fontWeight: 'bold', textAlign: 'right', fontSize: 7.5 }}>SGST @ {details.sgst_percentage}%</Text>
                                <Text style={{ width: '40%', padding: 4, textAlign: 'right', fontWeight: 'bold', fontSize: 7.5 }}>{formatCurrency(details.sgst_amount, details.currency)}</Text>
                            </View>
                        )}
                        {parseFloat(details.cgst_amount) > 0 && (
                            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' }}>
                                <Text style={{ width: '60%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', fontWeight: 'bold', textAlign: 'right', fontSize: 7.5 }}>CGST @ {details.cgst_percentage}%</Text>
                                <Text style={{ width: '40%', padding: 4, textAlign: 'right', fontWeight: 'bold', fontSize: 7.5 }}>{formatCurrency(details.cgst_amount, details.currency)}</Text>
                            </View>
                        )}
                        {parseFloat(details.igst_amount) > 0 && (
                            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' }}>
                                <Text style={{ width: '60%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', fontWeight: 'bold', textAlign: 'right', fontSize: 7.5 }}>IGST @ {details.igst_percentage}%</Text>
                                <Text style={{ width: '40%', padding: 4, textAlign: 'right', fontWeight: 'bold', fontSize: 7.5 }}>{formatCurrency(details.igst_amount, details.currency)}</Text>
                            </View>
                        )}
                        <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6' }}>
                            <Text style={{ width: '60%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', fontWeight: 'bold', textAlign: 'right', fontSize: 8 }}>INVOICE TOTAL</Text>
                            <Text style={{ width: '40%', padding: 4, textAlign: 'right', fontWeight: 'bold', fontSize: 8, color: '#0E5EB3' }}>{formatCurrency(details.total_amount, details.currency)}</Text>
                        </View>
                    </View>
                </View>

                {/* 6. Addresses & Initial Signatures Acknowledge Block */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }} wrap={false}>
                    {/* Left Address Column */}
                    <View style={{ width: '55%', paddingRight: 10 }}>
                        <Text style={{ fontSize: 7, fontWeight: 'bold', textDecoration: 'underline', marginBottom: 2 }}>Bill To</Text>
                        {(details.bill_to_name || (!details.bill_to && !details.bill_to_address)) && (
                            <Text style={{ fontSize: 6.5, fontWeight: 'bold' }}>{details.bill_to_name || 'ENERGYPAC ENGINEERING LIMITED.'}</Text>
                        )}
                        <Text style={{ fontSize: 6.5, color: '#444', lineHeight: 1.2 }}>
                            {details.bill_to || details.bill_to_address || 'KB-22, BHAKTA TOWER, 4TH FLOOR, SEC-3\nSALT LAKE, KOLKATA - 700106 WEST BENGAL, INDIA.'}
                        </Text>
                        
                        {(details.ship_to || details.ship_to_address || details.ship_to_name) && (
                            <>
                                <Text style={{ fontSize: 7, fontWeight: 'bold', textDecoration: 'underline', marginTop: 6, marginBottom: 2 }}>Ship To</Text>
                                {details.ship_to_name && (
                                    <Text style={{ fontSize: 6.5, fontWeight: 'bold' }}>{details.ship_to_name}</Text>
                                )}
                                <Text style={{ fontSize: 6.5, color: '#444', lineHeight: 1.2 }}>
                                    {details.ship_to || details.ship_to_address}
                                </Text>
                            </>
                        )}
                    </View>
                    
                    {/* Right Acknowledge Header */}
                    <View style={{ width: '45%', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                        <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica', fontStyle: 'italic', marginBottom: 4 }}>Kindly acknowledge receipt of the order.</Text>
                        <Text style={{ fontSize: 7.5, fontWeight: 'bold', marginBottom: 2 }}>Thanking You</Text>
                        <Text style={{ fontSize: 7.5, marginBottom: 2 }}>Yours faithfully,</Text>
                        <Text style={{ fontSize: 7.5, fontWeight: 'bold', color: '#333' }}>For Energypac Engineering Limited.</Text>
                    </View>
                </View>

                {/* 7. Signatures Block — blank for manual signing */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 35 }} wrap={false}>
                    <View style={{ width: '50%', alignItems: 'flex-start' }}>
                        <View style={{ marginTop: 25, width: '130px', borderTopWidth: 1, borderTopColor: '#000', paddingTop: 3 }}>
                            <Text style={{ fontSize: 7.5, fontWeight: 'bold' }}>Checked By</Text>
                        </View>
                    </View>
                    <View style={{ width: '50%', alignItems: 'flex-end' }}>
                        <View style={{ marginTop: 25, width: '150px', borderTopWidth: 1, borderTopColor: '#000', paddingTop: 3, alignItems: 'center' }}>
                            <Text style={{ fontSize: 7.5, fontWeight: 'bold' }}>Authorized Signatory</Text>
                        </View>
                    </View>
                </View>

                {/* Dynamic Footer with Page Numbering */}
                <Text style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontSize: 7.5,
                    color: '#666'
                }} render={({ pageNumber, totalPages }) => (
                    `Page ${pageNumber} of ${totalPages}`
                )} fixed />

            </Page>
        </Document>
    );
};

export default PurchaseOrderPDF;