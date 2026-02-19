import RobotoRegular from '../../assets/fonts/Roboto-Regular.ttf';
import RobotoBold from '../../assets/fonts/Roboto-Bold.ttf';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: RobotoRegular },
    { src: RobotoBold, fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 10,
    fontFamily: 'Roboto',
    color: '#333333'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 20
  },
  companyDetails: {
    width: '50%'
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a56db',
    marginBottom: 4
  },
  companySub: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2
  },
  quotationDetails: {
    width: '40%',
    alignItems: 'flex-end'
  },
  quotationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  detailLabel: {
    width: 80,
    color: '#666666',
    textAlign: 'right',
    marginRight: 10
  },
  detailValue: {
    fontWeight: 'bold',
    textAlign: 'right'
  },
  billTo: {
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a56db',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4
  },
  table: {
    marginBottom: 30
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    minHeight: 25,
    alignItems: 'center'
  },
  tableHeader: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE'
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 9,
    color: '#64748B'
  },
  tableCell: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 9
  },
  colItem: { width: '40%' },
  colQty: { width: '15%', textAlign: 'right' },
  colRate: { width: '15%', textAlign: 'right' },
  colAmount: { width: '15%', textAlign: 'right' },

  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 30
  },
  totalsBox: {
    width: '40%'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 2
  },
  totalLabel: {
    color: '#666666'
  },
  totalValue: {
    fontWeight: 'bold'
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#1a56db'
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a56db'
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a56db'
  },
  termsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 4
  },
  termCol: {
    width: '30%'
  },
  termLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  termValue: {
    fontSize: 9,
    color: '#333333'
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 20
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 8,
    marginBottom: 4
  }
});

const ClientQuotationPDF = ({ quotation }) => {

  const formatCurrency = (amount) => {
    return Number(amount).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

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
          <View style={styles.quotationDetails}>
            <Text style={styles.quotationTitle}>QUOTATION</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quotation No:</Text>
              <Text style={styles.detailValue}>{quotation.quotation_number}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatDate(quotation.quotation_date)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Valid Until:</Text>
              <Text style={styles.detailValue}>{formatDate(quotation.validity_date)}</Text>
            </View>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billTo}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.clientName}>{quotation.client_name}</Text>
          <Text style={styles.termLabel}>{quotation.contact_person}</Text>
          <Text style={styles.companySub}>{quotation.phone}</Text>
          <Text style={styles.companySub}>{quotation.email}</Text>
          <Text style={styles.companySub}>{quotation.address}</Text>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderCell, styles.colItem]}>Item Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>HSN Code</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Quantity</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
          </View>

          {quotation.items?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, styles.colItem]}>
                <Text>{item.item_name}</Text>
                <Text style={{ fontSize: 8, color: '#64748B', marginTop: 2 }}>
                  Code: {item.item_code}
                </Text>
              </View>
              <Text style={[styles.tableCell, styles.colQty]}>{item.hsn_code}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {item.quantity} {item.unit}
              </Text>
              <Text style={[styles.tableCell, styles.colRate]}>
                {formatCurrency(item.rate)}
              </Text>
              <Text style={[styles.tableCell, styles.colAmount]}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(quotation.subtotal)}
              </Text>
            </View>

            {quotation.taxes?.cgst?.amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  CGST ({quotation.taxes.cgst.percentage}%)
                </Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(quotation.taxes.cgst.amount)}
                </Text>
              </View>
            )}

            {quotation.taxes?.sgst?.amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  SGST ({quotation.taxes.sgst.percentage}%)
                </Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(quotation.taxes.sgst.amount)}
                </Text>
              </View>
            )}

            {quotation.taxes?.igst?.amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  IGST ({quotation.taxes.igst.percentage}%)
                </Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(quotation.taxes.igst.amount)}
                </Text>
              </View>
            )}

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Amount</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(quotation.total_amount)}
              </Text>
            </View>

          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a computer-generated document. No signature is required.
          </Text>
          <Text style={styles.footerText}>
            Thank you for your business!
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default ClientQuotationPDF;
