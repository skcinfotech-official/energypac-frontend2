import { useEffect, useState } from "react";
import { getVendorQuotationById, updateQuotation } from "../../services/vendorQuotationService";
import { exchangeRateService } from "../../services/exchangeRateService";
import { HiX, HiInformationCircle, HiRefresh } from "react-icons/hi";
import { FaFileInvoiceDollar, FaUserTie, FaBoxOpen, FaClipboardList, FaSave, FaCalendarAlt } from "react-icons/fa";

const VendorQuotationEditModal = ({ open, onClose, quotationId, onSuccess }) => {
    const [data, setData] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [currency, setCurrency] = useState("INR");
    const [exchangeRate, setExchangeRate] = useState(1.0);
    const [rateLoading, setRateLoading] = useState(false);

    useEffect(() => {
        if (open && quotationId) {
            loadDetails();
        } else {
            setData(null);
            setItems([]);
        }
    }, [open, quotationId,]);

    const loadDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getVendorQuotationById(quotationId);
            setData(res);
            setCurrency(res.currency || "INR");
            
            // If it's a USD quotation, fetch the rate used (or current if not stored)
            if (res.currency === "USD") {
                // If the backend doesn't provide the historical rate, we fetch current
                // But usually we should use what's in the data.
                // For now, let's fetch current to show what it would be worth now if not provided.
                try {
                    const rateData = await exchangeRateService.getCurrentRate();
                    setExchangeRate(rateData.rate);
                } catch (e) {
                    console.error("Exchange rate fetch failed", e);
                }
            }

            // Initialize editable items
            if (res.items) {
                setItems(res.items.map(item => ({
                    ...item,
                    quoted_rate: item.quoted_rate || ""
                })));
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load quotation details.");
        } finally {
            setLoading(false);
        }
    };

    const handleRateChange = (index, value) => {
        const newItems = [...items];
        newItems[index].quoted_rate = value;
        setItems(newItems);
    };

    const calculateRowAmount = (qty, rate) => {
        const q = parseFloat(qty) || 0;
        const r = parseFloat(rate) || 0;
        return (q * r).toFixed(2);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity || 0) * parseFloat(item.quoted_rate || 0));
        }, 0);
    };

    const totalAmount = calculateTotal();
    const totalAmountINR = currency === "USD" ? totalAmount * exchangeRate : totalAmount;

    const handleSubmit = async () => {
        setSubmitting(true);
        setError("");
        try {
            // Construct payload. 
            // For PATCH, typically we send the list of items to update.
            // We include 'id' to identify the quotation item (not vendor_item) as we are editing an existing quote.
            const payload = {
                items: items.map(item => ({
                    id: item.id,
                    vendor_item: item.vendor_item,
                    quoted_rate: parseFloat(item.quoted_rate) || 0
                }))
            };

            await updateQuotation(quotationId, payload);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to update quotation.");
        } finally {
            setSubmitting(false);
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
                            Edit Quotation
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
                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
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
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs">
                                                {(data.gst_number || data?.vendor?.gst_number) && (
                                                    <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">GST: {data.gst_number || data?.vendor?.gst_number}</span>
                                                )}
                                                {(data.pan_number || data?.vendor?.pan_number) && (
                                                    <span className="font-bold text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">PAN: {data.pan_number || data?.vendor?.pan_number}</span>
                                                )}
                                                {(data.bank_name || data?.vendor?.bank_name || data.bank_account_number || data?.vendor?.bank_account_number || data?.account_number || data?.vendor?.account_number) && (
                                                    <span className="text-slate-500 italic flex gap-2">
                                                        <span>{data.bank_name || data?.vendor?.bank_name}</span> |
                                                        <span>{data.bank_account_number || data?.vendor?.bank_account_number || data?.account_number || data?.vendor?.account_number}</span> |
                                                        <span>{data.ifsc_code || data?.vendor?.ifsc_code}</span>
                                                    </span>
                                                )}
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
                                        <div className="flex justify-end gap-2 items-center mt-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Currency:</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${currency === "USD" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                                                {currency}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
                                        <FaClipboardList /> Edit Rates
                                    </h3>
                                    <div className="text-sm font-bold text-slate-900">
                                        Total Items: {items.length}
                                    </div>
                                </div>

                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase">
                                        <tr>
                                            <th className="px-5 py-3">Product</th>
                                            <th className="px-5 py-3 text-right">Quantity</th>
                                            <th className="px-5 py-3 text-right">Rate ({currency})</th>
                                            <th className="px-5 py-3 text-right">Amount ({currency})</th>
                                            {currency === "USD" && <th className="px-5 py-3 text-right">Amount (INR)</th>}
                                            <th className="px-5 py-3">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((item, idx) => (
                                            <tr key={item.id} className="odd:bg-slate-100 even:bg-white hover:bg-slate-200   ">
                                                <td className="px-5 py-3">
                                                    <div className="font-medium text-slate-800">{item.product_name}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{item.product_code}</div>
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium text-slate-700">
                                                    {item.quantity} <span className="text-xs text-slate-400">{item.unit}</span>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="text-right border border-slate-300 rounded px-2 py-1 w-32 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={item.quoted_rate}
                                                        onChange={(e) => handleRateChange(idx, e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-900">
                                                    {currency === "USD" ? "$" : "₹"} {calculateRowAmount(item.quantity, item.quoted_rate)}
                                                </td>
                                                {currency === "USD" && (
                                                    <td className="px-5 py-3 text-right font-bold text-blue-600">
                                                        ₹ {(parseFloat(calculateRowAmount(item.quantity, item.quoted_rate)) * exchangeRate).toFixed(2)}
                                                    </td>
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
                                            <td colSpan={currency === "USD" ? "4" : "3"} className="px-5 py-3 text-right text-slate-600 uppercase text-xs tracking-wider">Total Amount</td>
                                            <td className="px-5 py-3 text-right text-base border-t border-slate-200 whitespace-nowrap">
                                                <div className="flex flex-col items-end">
                                                    <span>{totalAmount.toLocaleString('en-IN', { style: 'currency', currency: currency })}</span>
                                                    {currency === "USD" && (
                                                        <span className="text-xs text-blue-600 font-semibold">
                                                            (Approx {totalAmountINR.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-slate-400">No data found</div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="bg-white hover:bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-lg border border-slate-300 flex items-center gap-2"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !data}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        {submitting ? "Updating..." : "Update Quotation"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VendorQuotationEditModal;
