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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
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
                                                <FaBoxOpen className="text-slate-400 w-4" />
                                                <span className="font-semibold">Requisition:</span> {data.requisition_number}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FaUserTie className="text-slate-400 w-4" />
                                                <span className="font-semibold">Vendor:</span> {data.vendor_name}
                                                <span className="text-xs bg-slate-100 px-1.5 rounded-md text-slate-500">{data.vendor_code}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FaCalendarAlt className="text-slate-400 w-4" />
                                                <span className="font-semibold">Quoted Date:</span> {data.quotation_date}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Terms & Validity */}
                                    <div className="text-right space-y-2 text-sm">
                                        <div className="bg-amber-50 text-amber-900 px-3 py-1 rounded-lg border border-amber-100 inline-block mb-2">
                                            <span className="font-semibold">Valid Until:</span> {data.validity_date}
                                        </div>
                                        <div><span className="text-slate-500 font-semibold">Ref No:</span> {data.reference_number || "-"}</div>
                                        <div><span className="text-slate-500 font-semibold">Payment:</span> {data.payment_terms || "-"}</div>
                                        <div><span className="text-slate-500 font-semibold">Delivery:</span> {data.delivery_terms || "-"}</div>
                                    </div>
                                </div>

                                {data.remarks && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 italic bg-slate-50/50 p-2 rounded">
                                        <span className="font-semibold not-italic text-slate-500 mr-1">Remarks:</span> {data.remarks}
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
                                            <th className="px-5 py-3 text-right">Quoted Rate</th>
                                            <th className="px-5 py-3 text-right">Amount</th>
                                            <th className="px-5 py-3">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.items?.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                <td className="px-5 py-3">
                                                    <div className="font-medium text-slate-800">{item.product_name}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{item.product_code}</div>
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium text-slate-700">
                                                    {item.quantity} <span className="text-xs text-slate-400">{item.unit}</span>
                                                </td>
                                                <td className="px-5 py-3 text-right text-slate-700">
                                                    ₹ {item.quoted_rate}
                                                </td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-900">
                                                    ₹ {item.amount}
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
                                            <td colSpan="3" className="px-5 py-3 text-right text-slate-600 uppercase text-xs tracking-wider">Total Amount</td>
                                            <td className="px-5 py-3 text-right text-base border-t border-slate-200">₹ {data.total_amount}</td>
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
