import { useState, useEffect } from "react";
import { FaTimes, FaFileInvoiceDollar, FaGlobe, FaAnchor, FaListUl, FaStickyNote, FaPrint } from "react-icons/fa";
import { getProformaInvoiceById } from "../../services/salesService";
import { pdf } from "@react-pdf/renderer";
import ClientQuotationPDF from "./ClientQuotationPDF";

const ClientQuotationDetailsModal = ({ isOpen, onClose, invoice }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const lcNumber = details?.lc_number || details?.lc || "";
    const requisitionNumber = details?.requisition_number || details?.requisition || details?.requisition_no || "";
    const handlingNotes = details?.notes || details?.handling_notes || "";

    useEffect(() => {
        if (isOpen && invoice?.id) {
            const fetchDetails = async () => {
                setLoading(true);
                try {
                    const data = await getProformaInvoiceById(invoice.id);
                    setDetails(data);
                } catch (err) {
                    console.error("Failed to fetch proforma invoice details", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchDetails();
        } else {
            setDetails(null);
        }
    }, [isOpen, invoice]);

    const handlePrint = async () => {
        if (!details) return;
        setGeneratingPdf(true);
        try {
            const blob = await pdf(<ClientQuotationPDF quotation={details} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (err) {
            console.error("Failed to generate PDF", err);
            alert("Failed to generate print document");
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FaFileInvoiceDollar className="text-blue-600" />
                        Proforma Invoice Details
                    </h2>
                    <div className="flex items-center gap-2">
                        {details && (
                            <button
                                onClick={handlePrint}
                                disabled={generatingPdf}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 active:scale-95 disabled:opacity-50"
                            >
                                {generatingPdf ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                                        Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <FaPrint size={13} />
                                        Print Invoice
                                    </>
                                )}
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all">
                            <FaTimes size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                            <span className="font-semibold text-sm">Fetching detailed invoice sheet...</span>
                        </div>
                    ) : details ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            
                            {/* TOP IDENTIFIERS */}
                            <div className="flex flex-col sm:flex-row sm:justify-between items-start border-b border-slate-100 pb-5 gap-4">
                                <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h1 className="text-xl font-bold text-slate-800 font-mono">
                                            {details.pi_number || `#${details.id?.substring(0, 8) || "N/A"}`}
                                        </h1>
                                        
                                        {lcNumber && (
                                            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-100 font-mono">
                                                L/C: {lcNumber}
                                            </span>
                                        )}
                                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                                            (details.status || "DRAFT").toUpperCase() === 'DRAFT' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                            (details.status || "DRAFT").toUpperCase() === 'SENT' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            (details.status || "DRAFT").toUpperCase() === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            (details.status || "DRAFT").toUpperCase() === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                            'bg-slate-50 text-slate-500 border-slate-200'
                                        }`}>
                                            STATUS: {(details.status || "DRAFT").toUpperCase()}
                                        </span>
                                    </div>
                                    {requisitionNumber && (
                                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[13px] font-bold border border-slate-200 font-mono">
                                                REQ: {requisitionNumber}
                                            </span>
                                        )}
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">PI Issued Date</p>
                                    <p className="text-sm font-bold text-slate-700 mt-0.5">{details.pi_date}</p>
                                    <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">Payment Due</p>
                                    <p className="text-sm font-bold text-slate-700 mt-0.5">{details.payment_due_date || "N/A"}</p>
                                </div>
                            </div>

                            {/* PARTIES CARDS */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Exporter Beneficiary</p>
                                        <p className="text-sm font-bold text-slate-800 leading-snug">{details.exporter_beneficiary}</p>
                                    </div>
                                    {details.exporter_reference && (
                                        <p className="text-[10px] font-bold text-slate-500 font-mono">Ref: {details.exporter_reference}</p>
                                    )}
                                    {details.gst_number && (
                                        <p className="text-[10px] font-bold text-slate-500 font-mono">GSTIN: {details.gst_number}</p>
                                    )}
                                </div>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Consignee</p>
                                    <p className="text-sm font-bold text-slate-800 leading-snug">{details.consignee}</p>
                                </div>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Applicant Importer</p>
                                    <p className="text-sm font-bold text-slate-800 leading-snug">{details.applicant_importer}</p>
                                </div>
                            </div>

                            {/* PORT & LOGISTICS */}
                            <div className="p-4 bg-blue-50/30 border border-blue-100/50 rounded-2xl space-y-4">
                                <div className="flex items-center gap-2 border-b border-blue-100/30 pb-2">  
                                    <FaAnchor className="text-blue-500" size={13} />
                                    <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Logistics & Shipping</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Port of Loading</p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1">{details.port_of_loading || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Port of Discharge</p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1">{details.port_of_discharge || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pre-carriage By</p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1">{details.pre_carriage_by || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Place of Receipt</p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1">{details.place_of_receipt || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-blue-100/30 pt-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Country of Origin</p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1">{details.country_of_origin || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Destination</p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1">{details.final_destination || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terms of Delivery</p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1">{details.terms_of_delivery || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terms of Payment</p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1">{details.terms_of_payment || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* CURRENCY INFO */}
                            <div className="flex items-center gap-2 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                <FaGlobe className="text-emerald-600" size={14} />
                                <div className="text-xs text-emerald-800 font-semibold flex flex-wrap gap-x-4">
                                    <span>Currency: <strong className="font-bold">{details.currency}</strong></span>
                                    <span>Conversion Rate: <strong className="font-bold">1 {details.currency} = {details.conversion_rate} INR</strong></span>
                                </div>
                            </div>

                            {/* ITEMS TABLE */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2.5 ml-0.5">Item Breakdown</h3>
                                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-100">
                                            <tr>
                                                <th className="px-4 py-3.5 w-12 text-center">#</th>
                                                <th className="px-4 py-3.5">Product</th>
                                                <th className="px-4 py-3.5 w-32 text-center">HSN Code</th>
                                                <th className="px-4 py-3.5 w-24 text-right">Quantity</th>
                                                <th className="px-4 py-3.5 w-36 text-right">Unit Price ({details.currency})</th>
                                                <th className="px-4 py-3.5 w-36 text-right">Total ({details.currency})</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {details.items?.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 text-center font-semibold text-slate-400">{idx + 1}</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800">
                                                        <div>{item.product_name || item.item_name || "Product"}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.product}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-500">{item.hsn_code}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-700">{Number(item.quantity || 0).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-slate-600">{Number(item.unit_price || 0).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-800">{Number(item.amount || (Number(item.quantity || 0) * Number(item.unit_price || 0))).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        {details.items && details.items.length > 0 && (
                                            <tfoot className="bg-slate-50/80 font-bold text-slate-700 border-t border-slate-100 text-xs">
                                                <tr>
                                                    <td colSpan="5" className="px-4 py-2 text-right">Subtotal Amount:</td>
                                                    <td className="px-4 py-2 text-right text-blue-600 font-black">
                                                        {details.currency} {details.items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colSpan="5" className="px-4 py-2 text-right">Grand Total:</td>
                                                    <td className="px-4 py-2 text-right text-blue-700 font-black">
                                                        {details.currency} {Number(details.grand_total || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                                {Number(details.amount_received || 0) > 0 && (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-2 text-right">Amount Received:</td>
                                                        <td className="px-4 py-2 text-right text-emerald-600 font-black">
                                                            {details.currency} {Number(details.amount_received || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                )}
                                                {Number(details.balance || 0) > 0 && (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-2 text-right">Balance Due:</td>
                                                        <td className="px-4 py-2 text-right text-rose-600 font-black">
                                                            {details.currency} {Number(details.balance || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>

                            {/* TERMS & NOTES */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                {/* Terms & Conditions */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-1.5">
                                        <FaListUl className="text-slate-400" size={13} />
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Terms & Conditions</h4>
                                    </div>
                                    <ul className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                                        {details.terms_and_conditions && details.terms_and_conditions.length > 0 ? (
                                            details.terms_and_conditions.map((termStr, index) => {
                                                const colonIdx = termStr.indexOf(":");
                                                let key = "";
                                                let value = termStr;
                                                if (colonIdx !== -1) {
                                                    key = termStr.substring(0, colonIdx).trim();
                                                    value = termStr.substring(colonIdx + 1).trim();
                                                }
                                                return (
                                                    <li key={index} className="px-4 py-2.5 text-xs font-semibold text-slate-700 flex items-start justify-between gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-blue-500 font-bold">•</span>
                                                            {key ? (
                                                                <span className="font-bold text-slate-800">{key}:</span>
                                                            ) : (
                                                                <span className="font-medium text-slate-400">Term #{index + 1}:</span>
                                                            )}
                                                        </div>
                                                        <div className="text-right text-slate-600 font-semibold">{value}</div>
                                                    </li>
                                                );
                                            })
                                        ) : (
                                            <li className="px-4 py-3 text-slate-400 italic text-xs">No specific terms and conditions declared</li>
                                        )}
                                    </ul>
                                </div>

                                {/* Handling Notes */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-1.5">
                                        <FaStickyNote className="text-slate-400" size={13} />
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Handling Notes</h4>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-600 leading-relaxed min-h-[80px]">
                                        {handlingNotes || <span className="text-slate-400 italic font-normal">No additional handling notes provided.</span>}
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400 font-semibold italic">
                            Failed to display invoice details sheet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientQuotationDetailsModal;