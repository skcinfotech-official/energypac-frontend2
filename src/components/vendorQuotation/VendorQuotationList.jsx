import { useEffect, useState } from "react";
import { getVendorQuotationsList } from "../../services/vendorQuotationService";
import { FaEye, FaSearch, FaFileInvoiceDollar, FaEdit } from "react-icons/fa";
import VendorQuotationViewModal from "./VendorQuotationViewModal";
import VendorQuotationEditModal from "./VendorQuotationEditModal";
import AlertToast from "../ui/AlertToast";

const VendorQuotationList = ({ initialViewId }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });

    // View Modal State
    const [viewId, setViewId] = useState(null);
    const [openView, setOpenView] = useState(false);

    // Edit Modal State
    const [editId, setEditId] = useState(null);
    const [openEdit, setOpenEdit] = useState(false);

    const loadData = async (url = null) => {
        setLoading(true);
        try {
            // Fetch all quotations (paginated)
            const res = await getVendorQuotationsList(url);
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

    useEffect(() => {
        loadData();
    }, []);

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

            {/* HEADER / TOOLBAR */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FaFileInvoiceDollar className="text-blue-600" />
                    All Quotations <span className="text-sm font-normal text-slate-500">({count})</span>
                </h3>
                <button
                    onClick={() => loadData()}
                    className="text-sm text-blue-600 font-semibold hover:underline"
                >
                    Refresh
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
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
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-2 font-bold text-slate-900 text-base">
                                            {row.quotation_number || <span className="text-slate-500 italic">Draft</span>}
                                        </td>
                                        <td className="px-4 py-2 text-slate-700 font-mono text-sm">
                                            {row.requisition_number}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="font-bold text-slate-900">{row.vendor_name}</div>
                                            <div className="text-xs text-slate-500 font-mono">{row.vendor_code}</div>
                                        </td>
                                        <td className="px-4 py-2 text-slate-700 text-sm">
                                            {row.quotation_date}
                                        </td>
                                        <td className="px-4 py-2 text-right font-bold text-slate-900">
                                            ₹ {row.total_amount}
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
                                                <button
                                                    onClick={() => handleEdit(row.id)}
                                                    className="p-2 text-blue-500 hover:text-blue-600 hover:bg-green-50 rounded-full transition-all"
                                                    title="Edit Quotation"
                                                >
                                                    <FaEdit />
                                                </button>
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


