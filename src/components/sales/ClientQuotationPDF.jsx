import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const numberToWords = (num) => {
  if (num === 0) return "Zero";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const g = ["", "Thousand", "Million", "Billion", "Trillion"];
  
  const helper = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + helper(n % 100) : "");
  };
  
  const cleanNum = Math.floor(num);
  const cents = Math.round((num - cleanNum) * 100);
  
  let parts = [];
  let temp = cleanNum;
  let groupIdx = 0;
  
  while (temp > 0) {
    let chunk = temp % 1000;
    if (chunk > 0) {
      let chunkStr = helper(chunk);
      parts.unshift(chunkStr + (g[groupIdx] ? " " + g[groupIdx] : ""));
    }
    temp = Math.floor(temp / 1000);
    groupIdx++;
  }
  
  let result = parts.join(", ");
  if (cents > 0) {
    result += " and " + helper(cents) + " Cents";
  }
  return result + " Only";
};

const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 7, color: '#000' },
  
  // Bordered Container
  outerContainer: { borderWidth: 1, borderColor: '#000', flexDirection: 'column' },
  
  // Title Header
  titleRow: { borderBottomWidth: 1, borderBottomColor: '#000', padding: 5, alignItems: 'center' },
  titleText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5 },
  
  // Flex Box rows
  flexRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  
  // Exporter Layout column widths
  colLeft: { width: '55%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
  colRight: { width: '45%', padding: 4 },
  
  // Split cells inside colRight
  splitRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  cellHalf: { width: '50%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
  cellHalfLast: { width: '50%', padding: 4 },
  
  // Text stylings
  label: { fontSize: 6, fontWeight: 'bold', color: '#444', marginBottom: 1, textTransform: 'uppercase' },
  boldText: { fontSize: 7.5, fontWeight: 'bold' },
  text: { fontSize: 7, lineHeight: 1.2 },
  
  // Items Table area
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#000', fontWeight: 'bold', backgroundColor: '#f0f0f0', alignItems: 'center', minHeight: 18 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', alignItems: 'flex-start' },
  
  thText: { fontSize: 6.5, fontWeight: 'bold', textAlign: 'center' },
  
  tColSl: { width: '6%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  tColDesc: { width: '48%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
  tColHsn: { width: '12%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  tColQty: { width: '10%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  tColUom: { width: '8%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
  tColRate: { width: '8%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
  tColAmt: { width: '8%', padding: 4, textAlign: 'right' },
  
  // Totals Area
  totalsRow: { flexDirection: 'row', fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#000' },
  totalsTextCol: { width: '66%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'left', fontWeight: 'bold', fontSize: 7.5 },
  totalsTypeCol: { width: '26%', padding: 4, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center', fontWeight: 'bold', fontSize: 7.5 },
  totalsValCol: { width: '8%', padding: 4, textAlign: 'right', fontWeight: 'bold', fontSize: 7.5 },
  
  // Bottom block layout
  bottomContainer: { flexDirection: 'row' },
  termsCol: { width: '60%', padding: 5, borderRightWidth: 1, borderRightColor: '#000' },
  signCol: { width: '40%', padding: 5, justifyContent: 'space-between', minHeight: 70 },
  
  termsHeading: { fontSize: 7.5, fontWeight: 'bold', textDecoration: 'underline', marginBottom: 4 },
  termText: { fontSize: 6.5, marginBottom: 2.5, lineHeight: 1.1 },
  
  signFor: { fontSize: 7, fontWeight: 'bold', textAlign: 'center' },
  signLabel: { fontSize: 7, fontWeight: 'bold', textAlign: 'center', borderTopWidth: 1, borderTopColor: '#000', width: '80%', alignSelf: 'center', pt: 3 }
});

const ClientQuotationPDF = ({ quotation }) => {
  if (!quotation) return null;

  const lcNumber = quotation.lc_number || quotation.lc || "";
  const requisitionNumber = quotation.requisition_number || quotation.requisition || quotation.requisition_no || "";
  const handlingNotes = quotation.notes || quotation.handling_notes || "";

  // Format final destination
  const getDestination = () => {
    if (quotation.final_destination) {
      return quotation.final_destination.toUpperCase();
    }
    if (quotation.port_of_discharge) {
      const parts = quotation.port_of_discharge.split(",");
      return parts[parts.length - 1]?.trim().toUpperCase() || "BANGLADESH";
    }
    return "BANGLADESH";
  };

  // Render a dynamic row with auto-proportional column scaling
  const renderDynamicRow = (items) => {
    if (!items || items.length === 0) return null;
    
    const colWidth = items.length === 3 ? '33.3%' : (items.length === 2 ? '50%' : '100%');
    
    return (
      <View style={styles.flexRow}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          
          if (item.isGroup) {
            const innerCols = [];
            if (item.col1) innerCols.push(item.col1);
            if (item.col2) innerCols.push(item.col2);
            
            const innerWidth = innerCols.length === 2 ? '50%' : '100%';
            
            return (
              <View key={idx} style={{ width: colWidth, borderRightWidth: isLast ? 0 : 1, borderRightColor: '#000', flexDirection: 'row' }}>
                {innerCols.map((c, cIdx) => {
                  const cLast = cIdx === innerCols.length - 1;
                  return (
                    <View key={cIdx} style={{ width: innerWidth, padding: 4, borderRightWidth: cLast ? 0 : 1, borderRightColor: '#000' }}>
                      <Text style={styles.label}>{c.label}</Text>
                      <Text style={styles.boldText}>{c.value}</Text>
                    </View>
                  );
                })}
              </View>
            );
          }
          
          return (
            <View key={idx} style={{ width: colWidth, padding: 4, borderRightWidth: isLast ? 0 : 1, borderRightColor: '#000' }}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={item.isBold ? styles.boldText : styles.text}>{item.value}</Text>
              {item.extraText && (
                <Text style={[styles.text, { fontWeight: 'bold', marginTop: 2 }]}>{item.extraText}</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // Row 2: Consignee & Applicant
  const row2Items = [];
  if (quotation.consignee) {
    row2Items.push({ label: "Consignee:", value: quotation.consignee, isBold: true });
  }
  if (quotation.applicant_importer) {
    row2Items.push({ 
      label: "Applicant/Importer/Notify Party:", 
      value: quotation.applicant_importer, 
      isBold: true
    });
  }

  // Row 3: Origin & Destination
  const row3Items = [];
  if (quotation.country_of_origin) {
    row3Items.push({ label: "Country of Origin:", value: quotation.country_of_origin, isBold: true });
  }
  const dest = getDestination();
  if (dest) {
    row3Items.push({ label: "Final Destination:", value: dest, isBold: true });
  }

  // Row 4: Pre-carriage & Terms of Delivery
  const row4Items = [];
  if (quotation.pre_carriage_by || quotation.place_of_receipt) {
    row4Items.push({
      isGroup: true,
      col1: quotation.pre_carriage_by ? { label: "Pre-carriage by:", value: quotation.pre_carriage_by } : null,
      col2: quotation.place_of_receipt ? { label: "Place of Receipt by Pre-carriage:", value: quotation.place_of_receipt } : null
    });
  }
  if (quotation.terms_of_delivery) {
    row4Items.push({ label: "Terms of Delivery:", value: quotation.terms_of_delivery, isBold: true });
  }

  // Row 5: Ports & Payment Terms
  const row5Items = [];
  if (quotation.port_of_loading) {
    row5Items.push({ label: "Port of Loading:", value: quotation.port_of_loading });
  }
  if (quotation.port_of_discharge) {
    row5Items.push({ label: "Port of Discharge:", value: quotation.port_of_discharge });
  }
  if (quotation.terms_of_payment) {
    row5Items.push({ label: "Terms of Payment:", value: quotation.terms_of_payment });
  }

  // Total label dynamically tracking freight charges
  const totalLabel = quotation.freight_cost && Number(quotation.freight_cost) > 0
    ? `GRAND TOTAL (INCLUDING OF FREIGHT CHARGES ${quotation.currency || "USD"} ${Number(quotation.freight_cost).toFixed(2)})`
    : `GRAND TOTAL`;

  const hasTerms = quotation.terms_and_conditions && quotation.terms_and_conditions.length > 0;
  const hasNotes = handlingNotes.trim() !== "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.outerContainer}>
          
          {/* Header Title */}
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>Proforma invoice note sheet</Text>
          </View>
          
          {/* Row 1: Exporter Info (Static) & Invoice No/Date (Dynamic) */}
          <View style={styles.flexRow}>
            <View style={styles.colLeft}>
              <Text style={styles.label}>Beneficiary/Exporter:</Text>
              <Text style={[styles.boldText, { fontSize: 8.5, marginBottom: 2 }]}>
                {quotation.exporter_beneficiary || "ENERGYPAC ENGINEERING LIMITED."}
              </Text>
              <Text style={styles.text}>PLOT NO. 22, KB BLOCK 4TH FLOOR SECTOR-III, SALT LAKE</Text>
              <Text style={styles.text}>KOLKATA-700098, WEST BENGAL, INDIA.</Text>
            </View>
            
            <View style={styles.colRight}>
              {/* Proforma Invoice No & Date */}
              <View style={[styles.splitRow, { marginTop: -4, marginLeft: -4, marginRight: -4, borderBottomWidth: (requisitionNumber || lcNumber || quotation.exporter_reference) ? 1 : 0 }]}>
                <View style={[styles.cellHalfLast, { width: '100%' }]}>
                  <Text style={styles.label}>Proforma Invoice No. & Date:</Text>
                  <Text style={[styles.boldText, { fontFamily: 'Courier-Bold' }]}>{quotation.pi_number || "N/A"}</Text>
                  <Text style={[styles.text, { marginTop: 1 }]}>DTD. <Text style={{ fontWeight: 'bold' }}>{quotation.pi_date || "N/A"}</Text></Text>
                </View>
              </View>

              {/* Requisition Number */}
              {requisitionNumber ? (
                <View style={[styles.splitRow, { marginLeft: -4, marginRight: -4, borderBottomWidth: (lcNumber || quotation.exporter_reference) ? 1 : 0 }]}>
                  <View style={[styles.cellHalfLast, { width: '100%', paddingVertical: 3 }]}>
                    <Text style={styles.label}>Requisition Number:</Text>
                    <Text style={styles.boldText}>{requisitionNumber}</Text>
                  </View>
                </View>
              ) : null}

              {/* Exporter Reference */}
              {quotation.exporter_reference ? (
                <View style={[styles.splitRow, { marginLeft: -4, marginRight: -4, borderBottomWidth: lcNumber ? 1 : 0 }]}>
                  <View style={[styles.cellHalfLast, { width: '100%', paddingVertical: 3 }]}>
                    <Text style={styles.label}>Exporter Reference:</Text>
                    <Text style={[styles.boldText, { fontFamily: 'Courier-Bold' }]}>{quotation.exporter_reference}</Text>
                  </View>
                </View>
              ) : null}

              {/* GST NO & LC Number Row */}
              <View style={{ flexDirection: 'row', marginLeft: -4, marginRight: -4, marginBottom: -4 }}>
                <View style={[styles.cellHalf, { borderRightWidth: lcNumber ? 1 : 0, borderBottomWidth: 0, width: lcNumber ? '50%' : '100%' }]}>
                  <Text style={styles.label}>GST NO.:</Text>
                  <Text style={[styles.text, { fontWeight: 'bold' }]}>{quotation.gst_number || "19AABCE4975G1ZE"}</Text>
                </View>
                {lcNumber ? (
                  <View style={[styles.cellHalfLast, { borderBottomWidth: 0, width: '50%' }]}>
                    <Text style={styles.label}>L/C Number:</Text>
                    <Text style={[styles.text, { fontWeight: 'bold', fontFamily: 'Courier-Bold' }]}>{lcNumber}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
          
          {/* Render Rows Dynamically based on API response values */}
          {renderDynamicRow(row2Items)}
          {renderDynamicRow(row3Items)}
          {renderDynamicRow(row4Items)}
          {renderDynamicRow(row5Items)}
          
          {/* Items Table */}
          <View style={{ flexDirection: 'column' }}>
            <View style={styles.tableHeader} fixed>
              <View style={styles.tColSl}><Text style={styles.thText}>SL #</Text></View>
              <View style={styles.tColDesc}><Text style={[styles.thText, { textAlign: 'left' }]}>DESCRIPTION OF GOODS</Text></View>
              <View style={styles.tColHsn}><Text style={styles.thText}>HS CODE</Text></View>
              <View style={styles.tColQty}><Text style={styles.thText}>QTY</Text></View>
              <View style={styles.tColUom}><Text style={styles.thText}>U.O.M.</Text></View>
              <View style={styles.tColRate}><Text style={styles.thText}>RATE</Text></View>
              <View style={styles.tColAmt}><Text style={styles.thText}>TOTAL AMOUNT{"\n"}({quotation.currency || "USD"})</Text></View>
            </View>
            
            {quotation.items?.map((item, idx) => (
              <View key={idx} style={styles.tableRow} wrap={false}>
                <View style={styles.tColSl}>
                  <Text style={{ fontWeight: 'bold' }}>{idx + 1}</Text>
                </View>
                <View style={styles.tColDesc}>
                  <Text style={{ fontWeight: 'bold', fontSize: 7.5 }}>{item.product_name || item.item_name || "Product"}</Text>
                  {item.description && item.description !== item.product_name && (
                    <Text style={{ fontSize: 6.5, color: '#444', marginTop: 2 }}>{item.description}</Text>
                  )}
                </View>
                <View style={styles.tColHsn}>
                  <Text style={{ fontFamily: 'Courier', fontSize: 7.5, fontWeight: 'bold' }}>{item.hsn_code || "-"}</Text>
                </View>
                <View style={styles.tColQty}>
                  <Text style={{ fontWeight: 'bold' }}>{Number(item.quantity || 0).toFixed(0)}</Text>
                </View>
                <View style={styles.tColUom}>
                  <Text style={{ fontWeight: 'bold' }}>{item.unit || "KGS"}</Text>
                </View>
                <View style={styles.tColRate}>
                  <Text style={{ fontWeight: 'bold' }}>{Number(item.unit_price || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.tColAmt}>
                  <Text style={{ fontWeight: 'bold' }}>{Number(item.amount || (item.quantity * item.unit_price)).toFixed(2)}</Text>
                </View>
              </View>
            )) || null}
            
            {/* Subtotal Row */}
            <View style={styles.totalsRow}>
              <View style={styles.totalsTextCol}>
                <Text style={{ fontWeight: 'bold' }}>
                  {handlingNotes || ""}
                </Text>
              </View>
              <View style={styles.totalsTypeCol}>
                <Text style={{ fontWeight: 'bold' }}>SUBTOTAL</Text>
              </View>
              <View style={styles.totalsValCol}>
                <Text style={{ fontWeight: 'bold' }}>
                  {(quotation.items?.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0) || 0).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Grand Total Row */}
            <View style={styles.totalsRow}>
              <View style={styles.totalsTextCol}>
                <Text style={{ fontWeight: 'bold' }}>
                  {!handlingNotes ? totalLabel : ""}
                </Text>
              </View>
              <View style={styles.totalsTypeCol}>
                <Text style={{ fontWeight: 'bold' }}>CPT PRICE (GRAND TOTAL)</Text>
              </View>
              <View style={styles.totalsValCol}>
                <Text style={{ fontWeight: 'bold' }}>{Number(quotation.grand_total || 0).toFixed(2)}</Text>
              </View>
            </View>

            {/* Amount Received Row */}
            {Number(quotation.amount_received || 0) > 0 ? (
              <View style={styles.totalsRow}>
                <View style={styles.totalsTextCol}>
                  <Text></Text>
                </View>
                <View style={styles.totalsTypeCol}>
                  <Text style={{ fontWeight: 'bold' }}>AMOUNT RECEIVED</Text>
                </View>
                <View style={styles.totalsValCol}>
                  <Text style={{ fontWeight: 'bold' }}>{Number(quotation.amount_received).toFixed(2)}</Text>
                </View>
              </View>
            ) : null}

            {/* Balance Due Row */}
            {Number(quotation.balance || 0) > 0 ? (
              <View style={styles.totalsRow}>
                <View style={styles.totalsTextCol}>
                  <Text></Text>
                </View>
                <View style={styles.totalsTypeCol}>
                  <Text style={{ fontWeight: 'bold' }}>BALANCE DUE</Text>
                </View>
                <View style={styles.totalsValCol}>
                  <Text style={{ fontWeight: 'bold' }}>{Number(quotation.balance).toFixed(2)}</Text>
                </View>
              </View>
            ) : null}
          </View>
          
          {/* Bottom section: Terms and Signature */}
          <View style={styles.bottomContainer} wrap={false}>
            {hasTerms ? (
              <>
                <View style={[styles.termsCol, { width: '65%' }]}>
                  <Text style={styles.termsHeading}>Terms & Conditions:</Text>
                  {quotation.terms_and_conditions.map((termStr, index) => (
                    <Text key={index} style={styles.termText}>
                      {index + 1}. {termStr}
                    </Text>
                  ))}
                </View>
                <View style={[styles.signCol, { width: '35%' }]}>
                  <Text style={styles.signFor}>For Energypac Engineering Limited</Text>
                  <View style={{ marginVertical: 10, alignItems: 'center' }}>
                    <View style={{ width: 80, height: 1.5, backgroundColor: '#0E5EB3', transform: 'rotate(-5deg)' }} />
                  </View>
                  <Text style={styles.signLabel}>Exporter</Text>
                </View>
              </>
            ) : (
              <View style={[styles.signCol, { width: '100%', minHeight: 90, paddingVertical: 15 }]}>
                <Text style={styles.signFor}>For Energypac Engineering Limited</Text>
                <View style={{ marginVertical: 15, alignItems: 'center' }}>
                  <View style={{ width: 100, height: 1.5, backgroundColor: '#0E5EB3', transform: 'rotate(-5deg)' }} />
                </View>
                <Text style={styles.signLabel}>Exporter</Text>
              </View>
            )}
          </View>
          
        </View>
      </Page>
    </Document>
  );
};

export default ClientQuotationPDF;
