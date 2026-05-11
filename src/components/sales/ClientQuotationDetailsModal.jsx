
import { useState, useEffect } from "react";
import { FaTimes, FaFileInvoiceDollar, FaPrint } from "react-icons/fa";
import { getClientQuotationById, getClientQueryById } from "../../services/salesService";
import { pdf } from "@react-pdf/renderer";
import ClientQuotationPDF from "./ClientQuotationPDF";

const ClientQuotationDetailsModal = ({ isOpen, onClose, quotation }) => {
    const [details, setDetails] = useState(null);
    const [clientQuery, setClientQuery] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [viewCurrency, setViewCurrency] = useState('INR');

    const handlePrint = async () => {
        if (!details) return;
        setGeneratingPdf(true);
        try {
            // Merge details with clientQuery for the PDF
            const mergedQuotation = {
                ...details,
                address: details.address || details.client_details?.address || clientQuery?.address,
                contact_person: details.contact_person || details.client_details?.contact_person || clientQuery?.contact_person,
                phone: details.phone || details.client_details?.phone || clientQuery?.phone,
                email: details.email || details.client_details?.email || clientQuery?.email,
            };
            const blob = await pdf(<ClientQuotationPDF quotation={mergedQuotation} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setGeneratingPdf(false);
        }
    };

    useEffect(() => {
        if (isOpen && quotation?.id) {
            const fetchDetails = async () => {
                setLoading(true);
                try {
                    const data = await getClientQuotationById(quotation.id);
                    setDetails(data);

                    // If client info is missing, try to fetch from the linked client query
                    if (data.client_query && (!data.address || !data.contact_person)) {
                        try {
                            const queryData = await getClientQueryById(data.client_query);
                            setClientQuery(queryData);
                        } catch (err) {
                            console.error("Failed to fetch client query details", err);
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch quotation details", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchDetails();
        } else {
            setDetails(null);
            setViewCurrency('INR');
        }
    }, [isOpen, quotation]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl flex flex-col h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FaFileInvoiceDollar className="text-blue-600" />
                        Quotation Details
                    </h2>
                    <div className="flex items-center gap-2">
                        {details && (
                            <button
                                onClick={handlePrint}
                                disabled={generatingPdf}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-full transition-all"
                                title="Print / Preview PDF"
                            >
                                {generatingPdf ? <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div> : <FaPrint />}
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-8 py-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                            Loading details...
                        </div>
                    ) : details ? (
                        <div className="space-y-8">
                            {/* Top Info */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800 mb-1">{details.quotation_number}</h1>
                                    <p className="text-sm text-slate-500">Created on {details.quotation_date}</p>
                                    <div className="mt-4">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</p>
                                        <p className="text-lg font-medium text-slate-900">{details.client_name || details.client_details?.name}</p>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Address</p>
                                        <p className="text-sm font-medium text-slate-700">
                                            {details.address || details.client_details?.address || clientQuery?.address || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4 ${details.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                                        details.status === 'SENT' ? 'bg-blue-100 text-blue-600' :
                                            details.status === 'ACCEPTED' ? 'bg-green-100 text-green-600' :
                                                'bg-red-100 text-red-600'
                                        }`}>
                                        {details.status}
                                    </div>
                                    <p className="text-sm text-slate-500">Valid until: <span className="font-semibold text-slate-700">{details.validity_date}</span></p>
                                    <div className="mt-10 flex flex-col items-end">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</p>
                                        <p className="text-sm font-semibold text-slate-700">{details.contact_person || details.client_details?.contact_person || clientQuery?.contact_person || 'N/A'}</p>
                                        <p className="text-sm text-slate-600">{details.phone || details.client_details?.phone || clientQuery?.phone || 'N/A'}</p>
                                        <p className="text-sm text-slate-600">{details.email || details.client_details?.email || clientQuery?.email || 'N/A'}</p>
                                    </div>
                                    {details.currency !== 'INR' && (
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-right">
                                            <p className="text-[10px] font-bold text-blue-400 uppercase leading-none mb-1">Exchange Rate</p>
                                            <p className="text-sm font-black text-blue-700">1 {details.currency} = ₹ {Number(details.exchange_rate).toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>  
                                
                            </div>

                            {/* View Toggle */}
                            {details.currency !== 'INR' && (
                                <div className="flex justify-center mb-6">
                                    <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
                                        <button
                                            onClick={() => setViewCurrency('INR')}
                                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                                                viewCurrency === 'INR'
                                                    ? 'bg-white text-blue-600 shadow-md transform scale-105'
                                                    : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            INR View
                                        </button>
                                        <button
                                            onClick={() => setViewCurrency(details.currency)}
                                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                                                viewCurrency !== 'INR'
                                                    ? 'bg-white text-blue-600 shadow-md transform scale-105'
                                                    : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            {details.currency} View
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Exchange Rate Info (Only shown in Foreign Currency View) */}
                            {viewCurrency !== 'INR' && details.exchange_rate && (
                                <div className="flex justify-center -mt-4 mb-6">
                                    <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full border border-blue-100 text-xs font-bold flex items-center gap-2 animate-pulse">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        Exchange Rate: 1 {details.currency} = {Number(details.exchange_rate).toFixed(2)} INR
                                    </div>
                                </div>
                            )}

                            {/* Terms Grid */}
                            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Payment Terms</p>
                                    <p className="text-sm font-medium text-slate-700">{details.payment_terms || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Delivery Terms</p>
                                    <p className="text-sm font-medium text-slate-700">{details.delivery_terms || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Remarks</p>
                                    <p className="text-sm text-slate-600 italic">{details.remarks || "No remarks"}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase mb-2 text-slate-500">Item Breakdown</h3>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3">Item</th>
                                                <th className="px-4 py-3 w-28 border-l border-slate-100">HSN</th>
                                                <th className="px-4 py-3 w-16 text-right border-l border-slate-100">Qty</th>
                                                <th className="px-4 py-3 w-32 text-right border-l border-slate-100">Rate ({viewCurrency})</th>
                                                <th className="px-4 py-3 w-32 text-right border-l border-slate-100">Amount ({viewCurrency})</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {details.items?.map((item, idx) => (
                                                <tr key={idx} className="odd:bg-slate-50 even:bg-white hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-slate-800">{item.item_name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">{item.item_code}</div>
                                                        {item.from_stock && <span className="mt-1 inline-block text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">STOCK</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs border-l border-slate-100">{item.hsn_code}</td>
                                                    <td className="px-4 py-3 text-right border-l border-slate-100 whitespace-nowrap">{Number(item.quantity).toFixed(2)} {item.unit}</td>
                                                    <td className="px-4 py-3 text-right border-l border-slate-100 text-slate-600">
                                                        {viewCurrency === 'INR' 
                                                            ? Number(item.rate).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                                                            : Number(item.original_rate || item.rate / details.exchange_rate).toLocaleString('en-US', { style: 'currency', currency: details.currency })
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3 text-right border-l border-slate-100 font-bold text-slate-800">
                                                        {viewCurrency === 'INR'
                                                            ? Number(item.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                                                            : Number(item.original_amount || item.amount / details.exchange_rate).toLocaleString('en-US', { style: 'currency', currency: details.currency })
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end">
                                <div className="w-72 space-y-2">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Subtotal ({viewCurrency})</span>
                                        <span className="font-medium">
                                            {viewCurrency === 'INR'
                                                ? Number(details.subtotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                                                : Number(details.original_subtotal || details.subtotal / details.exchange_rate).toLocaleString('en-US', { style: 'currency', currency: details.currency })
                                            }
                                        </span>
                                    </div>

                                    {/* Tax Breakdown */}
                                    <div className="py-2 border-y border-slate-100 space-y-1">
                                        {viewCurrency === 'INR' ? (
                                            <>
                                                {(details.cgst_amount > 0 || details.taxes?.cgst?.amount > 0) && (
                                                    <div className="flex justify-between text-xs text-slate-500">
                                                        <span>CGST ({details.cgst_percentage || details.taxes?.cgst?.percentage}%)</span>
                                                        <span>{Number(details.cgst_amount || details.taxes?.cgst?.amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                                    </div>
                                                )}
                                                {(details.sgst_amount > 0 || details.taxes?.sgst?.amount > 0) && (
                                                    <div className="flex justify-between text-xs text-slate-500">
                                                        <span>SGST ({details.sgst_percentage || details.taxes?.sgst?.percentage}%)</span>
                                                        <span>{Number(details.sgst_amount || details.taxes?.sgst?.amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                                    </div>
                                                )}
                                                {(details.igst_amount > 0 || details.taxes?.igst?.amount > 0) && (
                                                    <div className="flex justify-between text-xs text-slate-500">
                                                        <span>IGST ({details.igst_percentage || details.taxes?.igst?.percentage}%)</span>
                                                        <span>{Number(details.igst_amount || details.taxes?.igst?.amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex justify-between text-xs text-slate-500 italic">
                                                <span>Total Tax ({details.currency})</span>
                                                <span>{Number(details.original_total_tax || details.total_gst / details.exchange_rate).toLocaleString('en-US', { style: 'currency', currency: details.currency })}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm font-medium text-slate-700 pt-1">
                                            <span>{viewCurrency === 'INR' ? 'Total Tax' : 'Total Tax Amount'}</span>
                                            <span>
                                                {viewCurrency === 'INR'
                                                    ? Number(details.total_gst || details.taxes?.total_tax || (Number(details.cgst_amount || details.taxes?.cgst?.amount || 0) + Number(details.sgst_amount || details.taxes?.sgst?.amount || 0) + Number(details.igst_amount || details.taxes?.igst?.amount || 0))).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                                                    : Number(details.original_total_tax || (details.total_gst || (Number(details.cgst_amount || details.taxes?.cgst?.amount || 0) + Number(details.sgst_amount || details.taxes?.sgst?.amount || 0) + Number(details.igst_amount || details.taxes?.igst?.amount || 0))) / details.exchange_rate).toLocaleString('en-US', { style: 'currency', currency: details.currency })
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-lg font-bold text-blue-600 pt-1 border-t-2 border-slate-100">
                                        <span>Total Amount</span>
                                        <span>
                                            {viewCurrency === 'INR'
                                                ? Number(details.total_amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                                                : Number(details.original_total_amount || details.total_amount / details.exchange_rate).toLocaleString('en-US', { style: 'currency', currency: details.currency })
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400">Failed to load details</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientQuotationDetailsModal;