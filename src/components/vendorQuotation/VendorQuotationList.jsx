import { useEffect, useState } from "react";
import { getVendorQuotationsList } from "../../services/vendorQuotationService";
import { FaEye, FaSearch, FaFileInvoiceDollar, FaEdit, FaPlus } from "react-icons/fa";
import VendorQuotationViewModal from "./VendorQuotationViewModal";
import VendorQuotationEditModal from "./VendorQuotationEditModal";
import AlertToast from "../ui/AlertToast";
import RequisitionSelector from "../common/RequisitionSelector";
import VendorSelector from "../common/VendorSelector";

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

const VendorQuotationList = ({ initialViewId, onNewQuotation }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });

    // Filter States
    const [selectedRequisition, setSelectedRequisition] = useState(null);
    const [selectedVendor, setSelectedVendor] = useState(null);

    // View Modal State
    const [viewId, setViewId] = useState(null);
    const [openView, setOpenView] = useState(false);

    // Edit Modal State
    const [editId, setEditId] = useState(null);
    const [openEdit, setOpenEdit] = useState(false);

    const loadData = async (url = null, reqId = selectedRequisition, vendId = selectedVendor) => {
        setLoading(true);
        try {
            // Fetch quotations matching the conditional filters
            const res = await getVendorQuotationsList(url, reqId, vendId);
            setData(res.results || []);
            setCount(res.count || 0);
            setNext(res.next);
            setPrevious(res.previous);
        } catch (err) {
            console.error("Failed to load quotations list", err);
            setToast({ open: true, type: "error", message: "Failed to load quotations" });
        } finally {
            setLoading(false);
        }
    };

    // Reload list when requisition or vendor filters change
    useEffect(() => {
        loadData(null, selectedRequisition, selectedVendor);
    }, [selectedRequisition, selectedVendor]);

    useEffect(() => {
        if (initialViewId) {
            handleView(initialViewId);
        }
    }, [initialViewId]);

    const handleView = (id) => {
        setViewId(id);
        setOpenView(true);
    };

    const handleEdit = (id) => {
        setEditId(id);
        setOpenEdit(true);
    };

    const handleEditSuccess = () => {
        loadData(); // Refresh list to show updated totals if any
        setToast({ open: true, type: "success", message: "Quotation updated successfully" });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

            <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
                {/* HEADER / TOOLBAR */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FaFileInvoiceDollar className="text-blue-600" />
                            Vendor Quotations
                        </h3>
                        <span className="text-xs text-slate-400 font-bold uppercase">
                            Total: {count}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => loadData()}
                            className="text-xs bg-white text-slate-700 hover:text-blue-600 font-bold px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition"
                        >
                            Refresh
                        </button>
                        <button
                            onClick={onNewQuotation}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
                        >
                            <FaPlus className="text-xs" />
                            New Quotation
                        </button>
                    </div>
                </div>

                {/* SEARCH & FILTER */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative z-30">
                            <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1">
                                Filter by Requisition
                            </label>
                            <RequisitionSelector
                                value={selectedRequisition}
                                onChange={(id) => setSelectedRequisition(id)}
                                placeholder="All Requisitions"
                            />
                        </div>
                        <div className="relative z-20">
                            <label className="block text-xs font-semibold text-slate-600 mb-1 ml-1">
                                Filter by Vendor
                            </label>
                            <VendorSelector
                                value={selectedVendor}
                                onChange={(id) => setSelectedVendor(id)}
                                placeholder="All Vendors"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Quotation No</th>
                                <th className="px-6 py-4">Requisition</th>
                                <th className="px-6 py-4">Vendor</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Total Amount</th>
                                <th className="px-6 py-4 text-center">Items</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500 animate-pulse">
                                        Loading records...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">
                                        No quotations found.
                                    </td>
                                </tr>
                            ) : (
                                data.map((row) => (
                                    <tr key={row.id} className="odd:bg-slate-100 even:bg-white hover:bg-slate-200  transition-colors group ">
                                        <td className="px-4 py-2 font-bold text-slate-900 text-base">
                                            {row.quotation_number || <span className="text-slate-500 italic">Draft</span>}
                                        </td>
                                        <td className="px-4 py-2 text-slate-700 font-mono text-sm">
                                            {row.requisition_number}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="font-bold text-slate-900">{row.vendor_name}</div>
                                            <div className="text-xs text-slate-500 font-mono flex gap-2">
                                                <span>{row.vendor_code}</span>
                                                {row.gst_number && <span className="text-blue-600 font-bold">GST: {row.gst_number}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-slate-700 text-sm">
                                            {row.quotation_date}
                                        </td>
                                        <td className="px-4 py-2 text-right font-bold text-slate-900">
                                            {getCurrencySymbol(row.currency)} {formatAmount(row.total_amount, row.currency)}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-sm font-bold border border-slate-200">
                                                {row.total_items}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleView(row.id)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                                {/* <button
                                                    onClick={() => handleEdit(row.id)}
                                                    className="p-2 text-blue-500 hover:text-blue-600 hover:bg-green-50 rounded-full transition-all"
                                                    title="Edit Quotation"
                                                >
                                                    <FaEdit />
                                                </button> */}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="px-6 py-4 border-t border-slate-300 flex items-center justify-between bg-slate-50">
                    <button
                        onClick={() => previous && loadData(previous)}
                        disabled={!previous}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                    >
                        &larr; Previous
                    </button>
                    <button
                        onClick={() => next && loadData(next)}
                        disabled={!next}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                    >
                        Next &rarr;
                    </button>
                </div>
            </div>

            {/* VIEW MODAL */}
            <VendorQuotationViewModal
                open={openView}
                onClose={() => setOpenView(false)}
                quotationId={viewId}
            />

            {/* EDIT MODAL */}
            <VendorQuotationEditModal
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                quotationId={editId}
                onSuccess={handleEditSuccess}
            />

            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />
        </div>
    );
};

export default VendorQuotationList;


