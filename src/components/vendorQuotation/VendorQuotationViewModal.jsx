import { useEffect, useState } from "react";
import { getVendorQuotationById } from "../../services/vendorQuotationService";
import { HiX, HiInformationCircle } from "react-icons/hi";
import { FaFileInvoiceDollar, FaUserTie, FaBoxOpen, FaClipboardList, FaCalendarAlt } from "react-icons/fa";

const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode?.toString().toUpperCase()) {
        case "USD": return "$";
        case "INR": return "₹";
        case "EUR": return "€";
        case "GBP": return "£";
        case "JPY": return "¥";
        case "CAD": return "C$";
        case "AUD": return "A$";
        default: return currencyCode || "₹";
    }
};

const formatAmount = (amount, currencyCode) => {
    const num = Number(amount) || 0;
    const locale = currencyCode?.toString().toUpperCase() === "INR" ? "en-IN" : "en-US";
    return num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center  justify-center z-100 p-4 animate-in fade-in duration-300"
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
                            <div className="bg-white border boundary-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Column 1: General Info */}
                                    <div className="space-y-2 text-sm">
                                        
                                        <div className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <FaFileInvoiceDollar className="text-blue-600" />
                                            <span>{data.quotation_number || "Draft Quotation"}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                                <FaCalendarAlt className="text-slate-400 w-4" />
                                                <span className="font-semibold text-slate-500">Quoted Date:</span>{" "}
                                                <span className="text-slate-800">{data.quotation_date}</span>
                                            </div>
                                        <div className="space-y-1.5 text-slate-600">
                                            <div>
                                                <span className="font-semibold text-slate-500">Requisition:</span>{" "}
                                                <span className="font-mono text-slate-800">{data.requisition_number}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency:</span>
                                                <span className="bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded">
                                                    {data.currency} ({getCurrencySymbol(data.currency)})
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Vendor Details */}
                                    <div className="space-y-1.5 text-sm text-slate-600">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            <FaUserTie /> Vendor Details
                                        </h4>
                                        <div>
                                            <span className="font-semibold text-slate-500">Vendor:</span>{" "}
                                            <span className="font-bold text-slate-800">{data.vendor_name}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-500">Code:</span>{" "}
                                            <span className="font-mono text-slate-800">{data.vendor_code}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {(data.gst_number || data?.vendor?.gst_number) && (
                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                    GST: {data.gst_number || data?.vendor?.gst_number}
                                                </span>
                                            )}
                                            {(data.pan_number || data?.vendor?.pan_number) && (
                                                <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                    PAN: {data.pan_number || data?.vendor?.pan_number}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 3: Terms & Reference */}
                                    <div className="space-y-1.5 text-sm text-slate-600">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            <FaClipboardList /> Quotation Terms
                                        </h4>
                                        <div>
                                            <span className="font-semibold text-slate-500">Ref No:</span>{" "}
                                            <span className="text-slate-800 font-bold">{data.reference_number || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-500">Valid Until:</span>{" "}
                                            <span className="text-slate-800">{data.validity_date || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-500">Payment:</span>{" "}
                                            <span className="text-slate-800">{data.payment_terms || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-500">Delivery:</span>{" "}
                                            <span className="text-slate-800">{data.delivery_terms || "-"}</span>
                                        </div>
                                    </div>
                                </div>

                                {data.remarks && (
                                    <div className="pt-3 border-t border-slate-100 text-sm text-slate-600 italic bg-slate-50/50 p-2.5 rounded-lg">
                                        <span className="font-bold not-italic text-slate-500 mr-1.5">Remarks:</span> {data.remarks}
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
                                            <th className="px-5 py-3 text-right">Rate ({data.currency})</th>
                                            <th className="px-5 py-3 text-right">Amount ({data.currency})</th>
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
                                                    {parseFloat(item.quoted_rate) === 0 ? "N/A" : `${getCurrencySymbol(data.currency)} ${formatAmount(item.quoted_rate, data.currency)}`}
                                                </td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-900">
                                                    {getCurrencySymbol(data.currency)} {formatAmount(item.amount, data.currency)}
                                                </td>
                                                <td className="px-5 py-3 text-slate-500 italic max-w-xs truncate">
                                                    {item.remarks || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* Table Footer Total */}
                                    <tfoot className="bg-slate-50 font-bold text-slate-900">
                                        <tr>
                                            <td colSpan="3" className="px-5 py-3 text-right text-slate-600 uppercase text-xs tracking-wider border-t border-slate-200">Total Amount</td>
                                            <td className="px-5 py-3 text-right text-base border-t border-slate-200 font-black">
                                                {getCurrencySymbol(data.currency)} {formatAmount(data.total_amount, data.currency)}
                                            </td>
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
