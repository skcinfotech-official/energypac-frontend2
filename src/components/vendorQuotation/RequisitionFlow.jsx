import { useEffect, useState } from "react";
import { getRequisitionFlow } from "../../services/vendorQuotationService";
import { FaBoxOpen, FaUserTie, FaCalendarAlt, FaInfoCircle, FaSearch } from "react-icons/fa";
import RequisitionSelector from "../common/RequisitionSelector";

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

const RequisitionFlow = ({ requisitionId: propRequisitionId }) => {
    const [selectedRequisition, setSelectedRequisition] = useState(propRequisitionId || "");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (propRequisitionId) {
            setSelectedRequisition(propRequisitionId);
        }
    }, [propRequisitionId]);

    useEffect(() => {
        const loadFlow = async () => {
            if (!selectedRequisition) return;

            setLoading(true);
            setError(null);

            try {
                const res = await getRequisitionFlow(selectedRequisition);
                setData(res);
            } catch (err) {
                console.error(err);
                setError("Failed to load requisition flow");
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        loadFlow();
    }, [selectedRequisition]);

    // Render logic helpers
    const { requisition, vendor_assignments = [] } = data || {};

    return (
        <div className="space-y-4">
            {/* Filter / Selector */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-full max-w-md">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Select Requisition to View Flow</label>
                    <RequisitionSelector
                        value={selectedRequisition}
                        onChange={(id) => setSelectedRequisition(id)}
                        placeholder="Search Requisition..."
                    />
                </div>
            </div>

            {loading && (
                <div className="p-8 text-center text-slate-500 text-sm animate-pulse bg-white rounded-xl border border-slate-200">
                    Loading flow data...
                </div>
            )}

            {error && (
                <div className="p-4 text-center text-red-500 bg-red-50 text-sm rounded-xl border border-red-100">
                    {error}
                </div>
            )}

            {!loading && !data && !error && (
                <div className="p-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                    <FaSearch className="mx-auto text-3xl mb-3 opacity-20" />
                    <p>Select a Requisition to view its assignment and quotation flow.</p>
                </div>
            )}

            {data && requisition && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">

                    {/* 1. COMPACT REQUISITION SUMMARY HEADER */}
                    <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                <FaBoxOpen className="text-blue-500" />
                                <span className="text-slate-500 font-medium">REQ:</span>
                                <span>{requisition.requisition_number}</span>
                            </div>

                            <div className="flex items-center gap-1.5 font-medium text-slate-600">
                                <FaCalendarAlt className="text-slate-400" />
                                <span>{requisition.requisition_date}</span>
                            </div>

                            <div className="flex items-center gap-1.5 font-medium text-slate-600">
                                <FaUserTie className="text-slate-400" />
                                <span>{requisition.created_by_name}</span>
                            </div>

                            <div className="flex-1"></div>

                            {requisition.remarks && (
                                <div className="text-slate-500 italic max-w-md truncate" title={requisition.remarks}>
                                    "{requisition.remarks}"
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. COMPACT TABLE */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 uppercase text-xs font-bold tracking-wider">
                                    <th className="px-3 py-2 w-[15%] border-r border-slate-300">Vendor</th>
                                    <th className="px-3 py-2 w-[15%] border-r border-slate-300">Contact</th>
                                    <th className="px-3 py-2 w-[30%] border-r border-slate-300">Assigned Items</th>
                                    <th className="px-3 py-2 w-[40%]">Quotations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300 text-sm text-slate-800">
                                {vendor_assignments.length > 0 ? (
                                    vendor_assignments.map((assignment, idx) => {
                                        const { vendor, assigned_items } = assignment;
                                        return (
                                            <tr key={idx} className="odd:bg-slate-100 even:bg-white hover:bg-slate-200   transition-colors">

                                                {/* Vendor Details */}
                                                <td className="px-3 py-3 align-top border-r border-slate-300">
                                                    <div className="font-bold text-slate-900 text-base mb-1">
                                                        {vendor.vendor_name}
                                                    </div>
                                                    <div className="font-mono text-sm text-slate-600 bg-slate-100 px-1 rounded w-fit mb-1 border border-slate-200">
                                                        {vendor.vendor_code}
                                                    </div>
                                                    <div className="text-[11px] text-slate-600 leading-tight space-y-0.5">
                                                        {vendor.gst_number && <div className="font-bold text-blue-600">GST: {vendor.gst_number}</div>}
                                                        {vendor.pan_number && <div className="font-bold text-slate-500">PAN: {vendor.pan_number}</div>}
                                                        {(vendor.bank_account_number || vendor.account_number || vendor.bank_name) && (
                                                            <div className="mt-1 text-slate-800 text-[10px] space-y-0.5 border-t border-slate-200 pt-1">
                                                                <div><span className="text-slate-500">Bank:</span> {vendor.bank_name || "-"}</div>
                                                                <div><span className="text-slate-500">Name:</span> {vendor.account_name || "-"}</div>
                                                                <div><span className="text-slate-500">A/C:</span> {vendor.bank_account_number || vendor.account_number || "-"}</div>
                                                                <div><span className="text-slate-500">IFSC:</span> {vendor.ifsc_code || "-"}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Contact Info */}
                                                <td className="px-3 py-3 align-top border-r border-slate-300">
                                                    <div className="font-bold text-slate-800 mb-1 text-sm">
                                                        {vendor.contact_person}
                                                    </div>
                                                    <div className="text-slate-600 text-sm">
                                                        {vendor.phone}
                                                    </div>
                                                    <div className="text-slate-600 text-sm truncate max-w-37.5" title={vendor.email}>
                                                        {vendor.email}
                                                    </div>
                                                </td>

                                                {/* Assigned Items */}
                                                <td className="px-3 py-3 align-top border-r border-slate-300">
                                                    {assigned_items && assigned_items.length > 0 ? (
                                                        <div className="border border-slate-200 rounded overflow-hidden">
                                                            <div className="flex bg-slate-100 text-sm font-bold text-slate-900 uppercase px-3 py-1.5 border-b border-slate-200">
                                                                <div className="font-bold flex-1">Product</div>
                                                                <div className="w-16 text-right">Qty</div>
                                                            </div>

                                                            <div className="divide-y divide-slate-200">
                                                                {assigned_items.map((item, i) => (
                                                                    <div key={i} className="flex justify-between items-center px-3 py-2">
                                                                        <div>
                                                                            <div className="font-medium text-slate-800 text-sm truncate max-w-35" title={item.product?.item_name}>
                                                                                {item.product?.item_name || "Unknown"}
                                                                            </div>
                                                                            <div className="text-xs text-slate-600 font-mono">
                                                                                {item.product?.item_code}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right whitespace-nowrap">
                                                                            <span className="font-bold text-slate-900 text-[13px]">{Number(item.quantity).toFixed(2)}</span>
                                                                            <span className="text-xs text-slate-500 ml-1">{item.product?.unit}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-sm">No items</span>
                                                    )}
                                                </td>

                                                {/* Quotations / Status */}
                                                <td className="px-3 py-3 align-top">
                                                    <div className="mt-1">
                                                        {assignment.quotations && assignment.quotations.length > 0 ? (
                                                            <div className="space-y-4">
                                                                {assignment.quotations.map((q, qIdx) => (
                                                                    <div key={qIdx} className={`border rounded-lg overflow-hidden ${q.is_selected ? 'border-green-400 bg-green-50' : 'border-slate-300 bg-slate-50'}`}>
                                                                        {/* Quotation Header */}
                                                                        <div className="flex justify-between items-center px-3 py-2 bg-slate-100 border-b border-slate-200">
                                                                            <div>
                                                                                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                                                    {q.quotation_number}
                                                                                    {q.is_selected && (
                                                                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200 font-bold">
                                                                                            Selected
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-xs text-slate-500 mt-0.5">
                                                                                    {q.quotation_date}
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="font-bold text-slate-900 text-base">
                                                                                    {getCurrencySymbol(q.currency)} {formatAmount(q.total_amount, q.currency)}
                                                                                </div>
                                                                                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total</div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Quotation Items */}
                                                                        <div className="p-2">
                                                                            <table className="w-full text-xs border-collapse">
                                                                                <thead className="text-slate-500 font-semibold border-b border-slate-200 text-xs bg-slate-50">
                                                                                    <tr>
                                                                                        <th className="py-1 px-2 text-left">Item</th>
                                                                                        <th className="py-1 px-2 text-right">Qty</th>
                                                                                        <th className="py-1 px-2 text-right">Rate</th>
                                                                                        <th className="py-1 px-2 text-right">Amt</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-slate-200">
                                                                                    {q.items && q.items.map((qItem, qi) => (
                                                                                        <tr key={qi}>
                                                                                            <td className="py-1 px-2 align-top">
                                                                                                <div className="text-slate-800 font-medium truncate max-w-30" title={qItem.product_name}>
                                                                                                    {qItem.product_name}
                                                                                                </div>
                                                                                                <div className="text-slate-500 font-mono text-xs">{qItem.product_code}</div>
                                                                                            </td>
                                                                                            <td className="py-1 px-2 text-right align-top text-slate-800">
                                                                                                <span className="font-bold text-slate-900 text-xs">{Number(qItem.quantity).toFixed(2)}</span>
                                                                                                {/* <span className="text-xs text-slate-500 ml-1">{qItem.unit}</span> */}
                                                                                            </td>
                                                                                            <td className="py-1 px-2 text-right align-top text-slate-800">
                                                                                                {parseFloat(qItem.quoted_rate) === 0 ? "N/A" : `${getCurrencySymbol(q.currency)} ${formatAmount(qItem.quoted_rate, q.currency)}`}
                                                                                            </td>
                                                                                            <td className="py-1 px-2 text-right align-top font-semibold text-slate-900">
                                                                                                {getCurrencySymbol(q.currency)} {formatAmount(qItem.amount, q.currency)}
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-6 bg-amber-50 rounded-lg border border-amber-200 border-dashed text-amber-800">
                                                                <span className="font-bold text-sm">Pending Quotation</span>
                                                                <span className="text-xs opacity-80 mt-1">No offers received yet</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-slate-500 text-sm">
                                            No vendors assigned.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default RequisitionFlow;
