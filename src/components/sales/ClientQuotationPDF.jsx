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
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', fontWeight: 'bold', backgroundColor: '#f9f9f9' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  
  // Dynamic columns for Foreign Currency (adds Original fields)
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
  
  // Totals for FC
  totalsLabelBlock_fc: { width: '82%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right', fontWeight: 'bold' },
  totalsValueBlock_fc: { width: '18%', padding: 4, textAlign: 'right', fontWeight: 'bold' },

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

const ClientQuotationPDF = ({ quotation }) => {
  const formatCurrency = (val, curr = "INR") => {
    const c = curr?.toString().trim().toUpperCase() || "INR";
    const symbol = c === "USD" ? "$" : "₹";
    
    const num = Number(val || 0);
    // Use manual formatting for PDF to avoid locale issues
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

        <Text style={styles.docTitle}>Seller Note Sheet</Text>

        {/* 2. Client & Quotation Details */}
        <View style={styles.topSection}>
          <View style={styles.clientInfo}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>To,</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 10 }}>{quotation.client_name || quotation.client_details?.name}</Text>
            <Text>{quotation.address || quotation.client_details?.address || 'N/A'}</Text>
            <Text>Ph: {quotation.phone || quotation.client_details?.phone || 'N/A'}</Text>
            <Text>Email: {quotation.email || quotation.client_details?.email || 'N/A'}</Text>
          </View>

          <View style={styles.detailsBox}>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>QUOTATION NO:</Text>
              <Text style={styles.detailsValue}>{quotation.quotation_number}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>DATE:</Text>
              <Text style={styles.detailsValue}>{formatDate(quotation.quotation_date)}</Text>
            </View>
            <View style={[styles.detailsRow, { borderBottomWidth: 1 }]}>
              <Text style={styles.detailsLabel}>VALID UNTIL:</Text>
              <Text style={styles.detailsValue}>{formatDate(quotation.validity_date)}</Text>
            </View>
            <View style={[styles.detailsRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailsLabel}>CURRENCY:</Text>
              <Text style={styles.detailsValue}>{quotation.currency?.toString().toUpperCase()}</Text>
            </View>
            {quotation.currency?.toString().trim().toUpperCase() !== 'INR' && (
              <View style={[styles.detailsRow, { borderTopWidth: 1, borderTopColor: '#000', borderBottomWidth: 0 }]}>
                <Text style={styles.detailsLabel}>EXCH. RATE:</Text>
                <Text style={styles.detailsValue}>1 {quotation.currency} = INR {Number(quotation.exchange_rate).toFixed(2)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 3. Subject & Attention */}
        {(quotation.contact_person || quotation.client_details?.contact_person) && (
          <View style={styles.textBlock}>
            <Text style={styles.boldLabel}>KIND ATTENTION:</Text>
            <Text>{quotation.contact_person || quotation.client_details?.contact_person}</Text>
          </View>
        )}
        {quotation.subject && (
          <View style={styles.textBlock}>
            <Text style={styles.boldLabel}>SUBJECT:</Text>
            <Text>{quotation.subject}</Text>
          </View>
        )}

        {/* 4. Items Table */}
        <View style={styles.table}>
          {quotation.currency?.toString().trim().toUpperCase() !== 'INR' ? (
            <View style={styles.tableHeader}>
              <Text style={styles.col1_fc}>SL</Text>
              <Text style={styles.col2_fc}>ITEM</Text>
              <Text style={styles.col3_fc}>HSN</Text>
              <Text style={styles.col4_fc}>QTY</Text>
              <Text style={styles.col7_fc}>RATE({quotation.currency})</Text>
              <Text style={styles.col8_fc}>AMOUNT({quotation.currency})</Text>
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

          {quotation.items?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              {quotation.currency?.toString().trim().toUpperCase() !== 'INR' ? (
                <>
                  <Text style={styles.col1_fc}>{index + 1}</Text>
                  <View style={styles.col2_fc}>
                    <Text style={{ fontWeight: 'bold' }}>{item.item_name}</Text>
                    {item.item_code && <Text style={{ fontSize: 7, color: '#444' }}>{item.item_code}</Text>}
                  </View>
                  <Text style={styles.col3_fc}>{item.hsn_code}</Text>
                  <Text style={styles.col4_fc}>{parseFloat(item.quantity || 0).toFixed(2)} {item.unit}</Text>
                  <Text style={styles.col7_fc}>{formatCurrency(item.original_rate || item.rate, quotation.currency)}</Text>
                  <Text style={styles.col8_fc}>{formatCurrency(item.original_amount || item.amount, quotation.currency)}</Text>
                  <Text style={styles.col5_fc}>{formatCurrency(item.rate, 'INR')}</Text>
                  <Text style={styles.col6_fc}>{formatCurrency(item.amount, 'INR')}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.col1}>{index + 1}</Text>
                  <View style={styles.col2}>
                    <Text style={{ fontWeight: 'bold' }}>{item.item_name}</Text>
                    {item.item_code && <Text style={{ fontSize: 8, color: '#444' }}>{item.item_code}</Text>}
                  </View>
                  <Text style={styles.col3}>{item.hsn_code}</Text>
                  <Text style={styles.col4}>{parseFloat(item.quantity || 0).toFixed(2)} {item.unit}</Text>
                  <Text style={styles.col5}>{formatCurrency(item.rate, 'INR')}</Text>
                  <Text style={styles.col6}>{formatCurrency(item.amount, 'INR')}</Text>
                </>
              )}
            </View>
          ))}

          {/* 5. Totals (INR) */}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabelBlock}>SUB TOTAL (INR)</Text>
            <Text style={styles.totalsValueBlock}>{formatCurrency(quotation.subtotal, 'INR')}</Text>
          </View>
          {(Number(quotation.cgst_amount) > 0 || Number(quotation.taxes?.cgst?.amount) > 0) && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabelBlock}>CGST @ {quotation.cgst_percentage || quotation.taxes?.cgst?.percentage}% (INR)</Text>
              <Text style={styles.totalsValueBlock}>{formatCurrency(quotation.cgst_amount || quotation.taxes?.cgst?.amount, 'INR')}</Text>
            </View>
          )}
          {(Number(quotation.sgst_amount) > 0 || Number(quotation.taxes?.sgst?.amount) > 0) && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabelBlock}>SGST @ {quotation.sgst_percentage || quotation.taxes?.sgst?.percentage}% (INR)</Text>
              <Text style={styles.totalsValueBlock}>{formatCurrency(quotation.sgst_amount || quotation.taxes?.sgst?.amount, 'INR')}</Text>
            </View>
          )}
          {(Number(quotation.igst_amount) > 0 || Number(quotation.taxes?.igst?.amount) > 0) && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabelBlock}>IGST @ {quotation.igst_percentage || quotation.taxes?.igst?.percentage}% (INR)</Text>
              <Text style={styles.totalsValueBlock}>{formatCurrency(quotation.igst_amount || quotation.taxes?.igst?.amount, 'INR')}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabelBlock}>TOTAL TAX (INR)</Text>
            <Text style={styles.totalsValueBlock}>{formatCurrency(
                quotation.total_gst || 
                quotation.taxes?.total ||
                (
                    Number(quotation.cgst_amount || 0) + 
                    Number(quotation.sgst_amount || 0) + 
                    Number(quotation.igst_amount || 0)
                ), 
                'INR'
            )}</Text>
          </View>
          <View style={[styles.totalsRow, { backgroundColor: '#f0f0f0' }]}>
            <Text style={styles.totalsLabelBlock}>TOTAL AMOUNT (INR)</Text>
            <Text style={styles.totalsValueBlock}>{formatCurrency(quotation.total_amount, 'INR')}</Text>
          </View>

          {/* 6. Original Currency Summary (Non-INR) */}
          {quotation.currency?.toString().trim().toUpperCase() !== 'INR' && (
            <View style={{ marginTop: 10, padding: 5, backgroundColor: '#f0f8ff', borderWidth: 1, borderColor: '#accce6' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 8, marginBottom: 4, color: '#2d5a84' }}>ORIGINAL CURRENCY SUMMARY ({quotation.currency})</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={{ fontSize: 8 }}>Subtotal ({quotation.currency})</Text>
                <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{formatCurrency(quotation.original_subtotal, quotation.currency)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={{ fontSize: 8 }}>Total Tax ({quotation.currency})</Text>
                <Text style={{ fontSize: 8, fontWeight: 'bold' }}>
                    {formatCurrency(
                        quotation.original_total_tax || 
                        ((quotation.total_gst || (Number(quotation.cgst_amount || 0) + Number(quotation.sgst_amount || 0) + Number(quotation.igst_amount || 0))) / quotation.exchange_rate), 
                        quotation.currency
                    )}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#accce6', pt: 2 }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Total ({quotation.currency})</Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(quotation.original_total_amount, quotation.currency)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Amount in Words */}
        {quotation.amount_in_words && (
          <Text style={styles.amountInWords}>AMOUNT IN WORDS: {quotation.amount_in_words}</Text>
        )}

        {/* Terms / Remarks */}
        {quotation.terms && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms & Conditions:-</Text>
            <Text style={{ fontSize: 9 }}>{quotation.terms}</Text>
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

export default ClientQuotationPDF;

