import { useState, useEffect } from "react";
import { FaPlus, FaSearch, FaEye, FaCheck, FaTimes, FaUndoAlt, FaBoxOpen, FaTruck } from "react-icons/fa";
import {
    getSalesReturns, approveSalesReturn, cancelSalesReturn,
    getPurchaseReturns, approvePurchaseReturn, cancelPurchaseReturn,
} from "../services/returnsService";
import SalesReturnModal from "../components/returns/SalesReturnModal";
import PurchaseReturnModal from "../components/returns/PurchaseReturnModal";
import ReturnDetailsModal from "../components/returns/ReturnDetailsModal";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const Returns = () => {
    const [activeTab, setActiveTab] = useState("sales");
    const [searchText, setSearchText] = useState("");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [viewItem, setViewItem] = useState(null);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [confirm, setConfirm] = useState({ open: false, title: "", message: "", action: null, loading: false, confirmButtonClass: "", iconBgClass: "", icon: undefined });

    const fetchData = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const res = activeTab === "sales"
                ? await getSalesReturns(page, search)
                : await getPurchaseReturns(page, search);
            setData(res.results || []);
            setTotalCount(res.count || 0);
            setNextPage(res.next);
            setPrevPage(res.previous);
        } catch (err) {
            console.error("Failed to fetch returns", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        setSearchText("");
    }, [activeTab]);

    useEffect(() => {
        const timer = setTimeout(() => fetchData(currentPage, searchText), 400);
        return () => clearTimeout(timer);
    }, [searchText, currentPage, activeTab]);

    const getStatusStyle = (s) => {
        switch (s) {
            case 'DRAFT': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-200';
        }
    };

    const handleApprove = (id) => {
        setConfirm({
            open: true,
            title: `Approve ${activeTab === "sales" ? "Sales" : "Purchase"} Return?`,
            message: activeTab === "sales"
                ? "Stock will be restored (except unusable items) and a Credit Note will be generated."
                : "Stock will be deducted (items going back to vendor) and a Debit Note will be generated.",
            confirmText: "Approve",
            confirmButtonClass: "bg-emerald-600 hover:bg-emerald-500",
            iconBgClass: "bg-emerald-100 text-emerald-600",
            icon: FaCheck,
            action: async () => {
                setConfirm(prev => ({ ...prev, loading: true }));
                try {
                    const res = activeTab === "sales"
                        ? await approveSalesReturn(id)
                        : await approvePurchaseReturn(id);
                    setAlert({ open: true, type: "success", message: res.message || "Return approved" });
                    fetchData(currentPage, searchText);
                } catch (err) {
                    const msg = err.response?.data?.error || "Failed to approve return";
                    setAlert({ open: true, type: "error", message: msg });
                } finally {
                    setConfirm({ open: false });
                }
            }
        });
    };

    const handleCancel = (id) => {
        setConfirm({
            open: true,
            title: `Cancel ${activeTab === "sales" ? "Sales" : "Purchase"} Return?`,
            message: "This will cancel the return. If it was approved, stock changes will be reversed.",
            confirmText: "Cancel Return",
            confirmButtonClass: "bg-red-600 hover:bg-red-500",
            iconBgClass: "bg-red-100 text-red-600",
            icon: FaTimes,
            action: async () => {
                setConfirm(prev => ({ ...prev, loading: true }));
                try {
                    const res = activeTab === "sales"
                        ? await cancelSalesReturn(id)
                        : await cancelPurchaseReturn(id);
                    setAlert({ open: true, type: "success", message: res.message || "Return cancelled" });
                    fetchData(currentPage, searchText);
                } catch (err) {
                    const msg = err.response?.data?.error || "Failed to cancel return";
                    setAlert({ open: true, type: "error", message: msg });
                } finally {
                    setConfirm({ open: false });
                }
            }
        });
    };

    return (
        <div className="p-1 sm:p-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* HEADER */}
                <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            <FaUndoAlt className="text-blue-600" /> Returns Management
                        </h3>
                        <span className="text-sm text-slate-500 font-semibold mt-1 block">Total: {totalCount}</span>
                    </div>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-500 hover:shadow-md transition-all active:scale-[0.98]"
                    >
                        <FaPlus className="text-xs" />
                        New {activeTab === "sales" ? "Sales" : "Purchase"} Return
                    </button>
                </div>

                {/* TABS */}
                <div className="px-6 pt-4 border-b border-slate-100 flex gap-1">
                    <button
                        onClick={() => setActiveTab("sales")}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition-all ${
                            activeTab === "sales"
                                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                        <FaBoxOpen size={14} /> Sales Returns
                    </button>
                    <button
                        onClick={() => setActiveTab("purchase")}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition-all ${
                            activeTab === "purchase"
                                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                        <FaTruck size={14} /> Purchase Returns
                    </button>
                </div>

                {/* SEARCH */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="max-w-md relative">
                        <input
                            value={searchText}
                            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                            placeholder={`Search ${activeTab === "sales" ? "sales" : "purchase"} returns...`}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                <th className="px-4 py-3">Return No.</th>
                                <th className="px-4 py-3">{activeTab === "sales" ? "PI Number" : "PO Number"}</th>
                                {activeTab === "purchase" && <th className="px-4 py-3">Vendor</th>}
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-center">{activeTab === "sales" ? "Credit Note" : "Debit Note"}</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="8" className="px-4 py-12 text-center text-slate-400 font-semibold">
                                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    Loading...
                                </td></tr>
                            ) : data.length > 0 ? data.map(item => {
                                const st = (item.status || "DRAFT").toUpperCase();
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3 text-xs font-bold font-mono text-blue-600">{item.return_number}</td>
                                        <td className="px-4 py-3 text-xs font-mono text-slate-600">
                                            {activeTab === "sales" ? item.pi_number : item.po_number}
                                        </td>
                                        {activeTab === "purchase" && (
                                            <td className="px-4 py-3 text-sm text-slate-600 font-medium max-w-[150px] truncate">{item.vendor_name}</td>
                                        )}
                                        <td className="px-4 py-3 text-sm text-slate-600 font-medium">{item.return_date}</td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-slate-800 font-mono">
                                            <span className="text-[10px] text-slate-400 mr-1">{item.currency}</span>
                                            {Number(item.total_return_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {(activeTab === "sales" ? item.credit_note_number : item.debit_note_number) ? (
                                                <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    {activeTab === "sales" ? item.credit_note_number : item.debit_note_number}
                                                </span>
                                            ) : <span className="text-xs text-slate-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusStyle(st)}`}>{st}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => setViewItem(item)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="View Details">
                                                    <FaEye size={15} />
                                                </button>
                                                <button
                                                    onClick={() => st === 'DRAFT' && handleApprove(item.id)}
                                                    disabled={st !== 'DRAFT'}
                                                    className={`p-2 rounded-xl transition-all ${st === 'DRAFT' ? 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50' : 'text-slate-300 cursor-not-allowed opacity-40'}`}
                                                    title={st === 'DRAFT' ? "Approve" : "Cannot approve"}
                                                >
                                                    <FaCheck size={14} />
                                                </button>
                                                <button
                                                    onClick={() => st !== 'CANCELLED' && handleCancel(item.id)}
                                                    disabled={st === 'CANCELLED'}
                                                    className={`p-2 rounded-xl transition-all ${st !== 'CANCELLED' ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-50' : 'text-slate-300 cursor-not-allowed opacity-40'}`}
                                                    title={st === 'CANCELLED' ? "Already cancelled" : "Cancel return"}
                                                >
                                                    <FaTimes size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-400 font-semibold italic">
                                    No {activeTab === "sales" ? "sales" : "purchase"} returns found
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <button onClick={() => prevPage && setCurrentPage(p => p - 1)} disabled={!prevPage} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed">← Previous</button>
                    <span className="text-xs font-bold text-slate-400">Page {currentPage}</span>
                    <button onClick={() => nextPage && setCurrentPage(p => p + 1)} disabled={!nextPage} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
                </div>
            </div>

            {/* CREATE MODALS */}
            {activeTab === "sales" ? (
                <SalesReturnModal
                    isOpen={createModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onSuccess={(msg) => { fetchData(currentPage, searchText); setAlert({ open: true, type: "success", message: msg }); }}
                />
            ) : (
                <PurchaseReturnModal
                    isOpen={createModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onSuccess={(msg) => { fetchData(currentPage, searchText); setAlert({ open: true, type: "success", message: msg }); }}
                />
            )}

            {/* DETAILS MODAL */}
            <ReturnDetailsModal
                isOpen={!!viewItem}
                onClose={() => setViewItem(null)}
                returnData={viewItem}
                type={activeTab}
            />

            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                message={confirm.message}
                confirmText={confirm.confirmText}
                loading={confirm.loading}
                onConfirm={confirm.action}
                onCancel={() => setConfirm({ open: false })}
                icon={confirm.icon}
                confirmButtonClass={confirm.confirmButtonClass}
                iconBgClass={confirm.iconBgClass}
            />

            <AlertToast open={alert.open} type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, open: false })} />
        </div>
    );
};

export default Returns;
