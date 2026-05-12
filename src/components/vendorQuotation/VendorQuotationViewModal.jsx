import { useEffect, useState } from "react";
import { getVendorQuotationById } from "../../services/vendorQuotationService";
import { HiX, HiInformationCircle } from "react-icons/hi";
import { FaFileInvoiceDollar, FaUserTie, FaBoxOpen, FaClipboardList, FaCalendarAlt } from "react-icons/fa";

const VendorQuotationViewModal = ({ open, onClose, quotationId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open && quotationId) {
            loadDetails();
        } else {
            setData(null);
        }
    }, [open, quotationId]);

    const loadDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getVendorQuotationById(quotationId);
            setData(res);
        } catch (err) {
            console.error(err);
            setError("Failed to load quotation details.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-100 p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-visible"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <FaFileInvoiceDollar className="text-blue-600" />
                            Quotation Details
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-200"
                    >
                        <HiX size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                            <HiInformationCircle className="text-xl shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12 text-slate-500 animate-pulse">Loading details...</div>
                    ) : data ? (
                        <>
                            {/* Top Card: Info */}
                            <div className="bg-white border boundary-slate-200 rounded-xl p-5 shadow-sm">
                                <div className="flex flex-wrap justify-between gap-6">
                                    {/* Left: General Info */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
                                            <span>{data.quotation_number || "Draft Quotation"}</span>
                                        </div>

                                        <div className="space-y-1 text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <FaCalendarAlt className="text-slate-400 w-4" />
                                                <span className="font-semibold">Quoted Date:</span> {data.quotation_date}
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                                                {(data.gst_number || data?.vendor?.gst_number) && (
                                                    <div className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">
                                                        <span className="font-bold">GST:</span> {data.gst_number || data?.vendor?.gst_number}
                                                    </div>
                                                )}
                                                {(data.pan_number || data?.vendor?.pan_number) && (
                                                    <div className="text-[10px] px-1.5 py-0.5 bg-slate-50 text-slate-700 rounded border border-slate-200">
                                                        <span className="font-bold">PAN:</span> {data.pan_number || data?.vendor?.pan_number}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Terms & Validity */}
                                    <div className="text-right space-y-2 text-sm">
                                        <div className="flex flex-col items-start bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 mb-2">
                                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Input Currency</span>
                                            <span className="text-sm font-black text-blue-700 leading-none">
                                                {data.currency?.toString().toUpperCase()}
                                            </span>
                                        </div>
                                        {data.currency?.toString().trim().toUpperCase() !== 'INR' && (
                                            <div className="flex flex-col items-start bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Exchange Rate</span>
                                                <span className="text-sm font-bold text-slate-600 leading-none">1 {data.currency} = ₹ {Number(data.exchange_rate).toFixed(2)}</span>
                                            </div>
                                        )}
                                        {/* <div className="bg-amber-50 text-amber-900 px-3 py-1 rounded-lg border border-amber-100 inline-block mb-2">
                                            <span className="font-semibold">Valid Until:</span> {data.validity_date}
                                        </div>
                                        <div><span className="text-slate-500 font-semibold">Ref No:</span> {data.reference_number || "-"}</div>
                                        <div><span className="text-slate-500 font-semibold">Payment:</span> {data.payment_terms || "-"}</div>
                                        <div><span className="text-slate-500 font-semibold">Delivery:</span> {data.delivery_terms || "-"}</div> */}
                                    </div>
                                </div>

                                {data.remarks && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 italic bg-slate-50/50 p-2 rounded">
                                        <span className="font-semibold not-italic text-slate-500 mr-1">Remarks:</span> {data.remarks}
                                    </div>
                                )}

                                {/* Bank Details */}
                                {(data.bank_name || data?.vendor?.bank_name || data.bank_account_number || data?.vendor?.bank_account_number || data?.account_number || data?.vendor?.account_number) && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-700 mb-3">
                                            Bank Details
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="block text-slate-500 text-xs">Bank Name:</span>
                                                <span className="font-medium text-slate-800">{data.bank_name || data?.vendor?.bank_name || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="block text-slate-500 text-xs">Account Name:</span>
                                                <span className="font-medium text-slate-800">{data.account_name || data?.vendor?.account_name || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="block text-slate-500 text-xs">Account Number:</span>
                                                <span className="font-medium text-slate-800">{data.bank_account_number || data?.vendor?.bank_account_number || data?.account_number || data?.vendor?.account_number || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="block text-slate-500 text-xs">IFSC Code:</span>
                                                <span className="font-medium text-slate-800">{data.ifsc_code || data?.vendor?.ifsc_code || "-"}</span>
                                            </div>
                                            {(data.swift_code || data?.vendor?.swift_code) && (
                                                <div>
                                                    <span className="block text-slate-500 text-xs">Swift Code:</span>
                                                    <span className="font-medium text-slate-800">{data.swift_code || data?.vendor?.swift_code}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Items Table */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
                                        <FaClipboardList /> Quoted Items
                                    </h3>
                                    <div className="text-sm font-bold text-slate-900">
                                        Total Items: {data.total_items}
                                    </div>
                                </div>

                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase">
                                        <tr>
                                            <th className="px-5 py-3">Product</th>
                                            <th className="px-5 py-3 text-right">Quantity</th>
                                            <th className="px-5 py-3 text-right">Rate (INR)</th>
                                            <th className="px-5 py-3 text-right">Amount (INR)</th>
                                            {data.currency?.toString().trim().toUpperCase() !== 'INR' && (
                                                <>
                                                    <th className="px-5 py-3 text-right bg-blue-50/20">Original Rate</th>
                                                    <th className="px-5 py-3 text-right bg-blue-50/20">Original Amount</th>
                                                </>
                                            )}
                                            <th className="px-5 py-3">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.items?.map((item) => (
                                            <tr key={item.id} className="odd:bg-slate-100 even:bg-white hover:bg-slate-200   ">
                                                <td className="px-5 py-3">
                                                    <div className="font-medium text-slate-800">{item.product_name}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{item.product_code}</div>
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium text-slate-700">
                                                    {Number(item.quantity).toFixed(2)} <span className="text-xs text-slate-400">{item.unit}</span>
                                                </td>
                                                <td className="px-5 py-3 text-right text-slate-700">
                                                    {parseFloat(item.quoted_rate) === 0 ? "N/A" : `₹ ${Number(item.quoted_rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                </td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-900">
                                                    ₹ {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                {data.currency?.toString().trim().toUpperCase() !== 'INR' && (
                                                    <>
                                                        <td className="px-5 py-3 text-right text-blue-600 bg-blue-50/10">
                                                            {parseFloat(item.original_rate || item.original_quoted_rate || item.quoted_rate) === 0 ? "N/A" : `${data.currency?.toString().trim().toUpperCase() === 'USD' ? '$' : '₹'} ${Number(item.original_rate || item.original_quoted_rate || item.quoted_rate).toFixed(2)}`}
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-bold text-blue-700 bg-blue-50/10">
                                                            {data.currency?.toString().trim().toUpperCase() === 'USD' ? '$' : '₹'} {Number(item.original_amount || item.amount).toFixed(2)}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="px-5 py-3 text-slate-500 italic max-w-xs truncate">
                                                    {item.remarks || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* Table Footer Total */}
                                    <tfoot className="bg-slate-50 font-bold text-slate-900">
                                        <tr>
                                            <td colSpan="3" className="px-5 py-3 text-right text-slate-600 uppercase text-xs tracking-wider border-t border-slate-200">Total (INR)</td>
                                            <td className="px-5 py-3 text-right text-base border-t border-slate-200 font-black">
                                                ₹ {Number(data.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            {data.currency?.toString().trim().toUpperCase() !== 'INR' && (
                                                <>
                                                    <td className="px-5 py-3 text-right text-base border-t border-slate-200 text-blue-700 bg-blue-50/30">
                                                        {data.currency?.toString().trim().toUpperCase() === 'USD' ? '$' : '₹'} {Number(data.original_total_amount).toFixed(2)}
                                                    </td>
                                                    <td className="bg-blue-50/30 border-t border-slate-200"></td>
                                                </>
                                            )}
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Meta Footer */}
                            <div className="text-xs text-slate-400 text-right">
                                Created by {data.created_by_name} on {new Date(data.created_at).toLocaleString()}
                            </div>

                        </>
                    ) : (
                        <div className="text-center py-12 text-slate-400">No data found</div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VendorQuotationViewModal;
