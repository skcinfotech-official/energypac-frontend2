
import { useState, useEffect } from "react";
import { FaTimes, FaFileInvoiceDollar, FaPrint } from "react-icons/fa";
import { getClientQuotationSummary } from "../../services/salesService";
import { pdf } from "@react-pdf/renderer";
import ClientQuotationPDF from "./ClientQuotationPDF";

const ClientQuotationDetailsModal = ({ isOpen, onClose, quotation }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const handlePrint = async () => {
        if (!details) return;
        setGeneratingPdf(true);
        try {
            const blob = await pdf(<ClientQuotationPDF quotation={details} />).toBlob();
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
                    const data = await getClientQuotationSummary(quotation.id);
                    setDetails(data);
                } catch (err) {
                    console.error("Failed to fetch quotation details", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchDetails();
        } else {
            setDetails(null);
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
                                        <p className="text-lg font-medium text-slate-900">{details.client_name}</p>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Address</p>
                                        <p className="text-sm font-medium text-slate-700">{details.address}</p>
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
                                    <div className="mt-10">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</p>
                                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{details.contact_person}</p>
                                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{details.phone}</p>
                                        <p className="text-sm font-medium text-slate-700">{details.email}</p>
                                    </div>
                                </div>  
                                
                            </div>

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
                                                <th className="px-4 py-3 w-32 border-l border-slate-100">HSN Code</th>
                                                <th className="px-4 py-3 w-32 border-l border-slate-100">Code</th>
                                                <th className="px-4 py-3 w-24 text-right border-l border-slate-100">Qty</th>
                                                <th className="px-4 py-3 w-32 text-right border-l border-slate-100">Rate</th>
                                                <th className="px-4 py-3 w-32 text-right border-l border-slate-100">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {details.items?.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-medium text-slate-800">
                                                        {item.item_name}
                                                        {item.from_stock && <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">STOCK</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs border-l border-slate-100">{item.hsn_code}</td>
                                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs border-l border-slate-100">{item.item_code}</td>
                                                    <td className="px-4 py-3 text-right border-l border-slate-100">{item.quantity} {item.unit}</td>
                                                    <td className="px-4 py-3 text-right border-l border-slate-100">{Number(item.rate).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-700 border-l border-slate-100">{Number(item.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
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
                                        <span>Subtotal</span>
                                        <span className="font-medium">{Number(details.subtotal).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                    </div>

                                    {/* Tax Breakdown */}
                                    {details.taxes && (
                                        <div className="py-2 border-y border-slate-100 space-y-1">
                                            {details.taxes.cgst?.amount > 0 && (
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>CGST ({details.taxes.cgst.percentage}%)</span>
                                                    <span>{Number(details.taxes.cgst.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                                </div>
                                            )}
                                            {details.taxes.sgst?.amount > 0 && (
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>SGST ({details.taxes.sgst.percentage}%)</span>
                                                    <span>{Number(details.taxes.sgst.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                                </div>
                                            )}
                                            {details.taxes.igst?.amount > 0 && (
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>IGST ({details.taxes.igst.percentage}%)</span>
                                                    <span>{Number(details.taxes.igst.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm font-medium text-slate-700 pt-1">
                                                <span>Total Tax</span>
                                                <span>{Number(details.taxes.total_tax).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-lg font-bold text-blue-600 pt-1 border-t-2 border-slate-100">
                                        <span>Total Amount</span>
                                        <span>{Number(details.total_amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
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
