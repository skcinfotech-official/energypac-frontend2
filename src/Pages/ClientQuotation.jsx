import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
    getProformaInvoices, 
    getProformaInvoiceById, 
    lockProformaInvoice, 
    unlockProformaInvoice,
    sendProformaInvoice,
    acceptProformaInvoice,
    cancelProformaInvoice
} from "../services/salesService";
import { FaPlus, FaSearch, FaEye, FaEdit, FaPaperPlane, FaCheck, FaBan, FaTimes, FaBoxOpen } from "react-icons/fa";
import ClientQuotationModal from "../components/sales/ClientQuotationModal";
import ClientQuotationDetailsModal from "../components/sales/ClientQuotationDetailsModal";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PasswordConfirmModal from "../components/ui/PasswordConfirmModal";

const ClientQuotation = () => {
    const [searchText, setSearchText] = useState("");
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);

    // Alert State
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });

    // Dialog and Password Modal States
    const [confirm, setConfirm] = useState({
        open: false,
        title: "",
        message: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        loading: false,
        confirmButtonClass: "bg-red-600 hover:bg-red-500",
        iconBgClass: "bg-red-100 text-red-600",
        icon: undefined,
        action: null
    });
    const [passwordModal, setPasswordModal] = useState({ 
        open: false, 
        onConfirm: null, 
        title: "", 
        message: "", 
        loading: false 
    });

    const [searchParams] = useSearchParams();

    const getStatusStyle = (status) => {
        switch (status) {
            case 'DRAFT': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'SENT': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'ACCEPTED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-200';
        }
    };

    const handleSendInvoice = (id) => {
        setConfirm({
            open: true,
            title: "Send Proforma Invoice?",
            message: "Are you sure you want to send this proforma invoice? This will move its status from DRAFT to SENT.",
            confirmText: "Send",
            confirmButtonClass: "bg-blue-600 hover:bg-blue-500",
            iconBgClass: "bg-blue-100 text-blue-600",
            icon: FaPaperPlane,
            action: async () => {
                setConfirm(prev => ({ ...prev, loading: true }));
                try {
                    await sendProformaInvoice(id);
                    setAlert({ open: true, type: "success", message: "Proforma invoice sent successfully" });
                    fetchInvoices(currentPage, searchText);
                } catch (error) {
                    console.error("Failed to send proforma invoice", error);
                    const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to send proforma invoice";
                    setAlert({ open: true, type: "error", message: errorMsg });
                } finally {
                    setConfirm({ open: false });
                }
            }
        });
    };

    const handleAcceptInvoice = (id) => {
        setConfirm({
            open: true,
            title: "Accept Proforma Invoice?",
            message: "Are you sure you want to accept this proforma invoice? This will move its status from SENT to ACCEPTED and lock all further editing.",
            confirmText: "Accept",
            confirmButtonClass: "bg-emerald-600 hover:bg-emerald-500",
            iconBgClass: "bg-emerald-100 text-emerald-600",
            icon: FaCheck,
            action: async () => {
                setConfirm(prev => ({ ...prev, loading: true }));
                try {
                    await acceptProformaInvoice(id);
                    setAlert({ open: true, type: "success", message: "Proforma invoice accepted successfully" });
                    fetchInvoices(currentPage, searchText);
                } catch (error) {
                    console.error("Failed to accept proforma invoice", error);
                    const respData = error.response?.data;
                    let errorMsg = respData?.error || respData?.detail || respData?.message || "Failed to accept proforma invoice";
                    if (respData?.insufficient_items && Array.isArray(respData.insufficient_items)) {
                        const itemList = respData.insufficient_items.map(
                            i => `${i.product} (stock: ${i.available}, need: ${i.required})`
                        ).join("; ");
                        errorMsg = `Insufficient stock: ${itemList}`;
                    }
                    setAlert({ open: true, type: "error", message: errorMsg });
                } finally {
                    setConfirm({ open: false });
                }
            }
        });
    };

    const handleCancelInvoice = (id) => {
        setConfirm({
            open: true,
            title: "Cancel Proforma Invoice?",
            message: "Are you sure you want to cancel this proforma invoice? This action cannot be undone and requires password authentication.",
            confirmText: "Proceed",
            confirmButtonClass: "bg-red-600 hover:bg-red-500",
            iconBgClass: "bg-red-100 text-red-600",
            icon: FaTimes,
            action: () => {
                setConfirm(prev => ({ ...prev, open: false }));
                setPasswordModal({
                    open: true,
                    title: "Confirm Cancellation",
                    message: "Please enter your password to cancel this proforma invoice.",
                    loading: false,
                    onConfirm: async (password) => {
                        setPasswordModal(prev => ({ ...prev, loading: true }));
                        try {
                            await cancelProformaInvoice(id, { confirm_password: password });
                            setAlert({ open: true, type: "success", message: "Proforma invoice cancelled successfully" });
                            fetchInvoices(currentPage, searchText);
                            setPasswordModal({ open: false });
                        } catch (error) {
                            console.error("Failed to cancel proforma invoice", error);
                            const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.response?.data?.message || "Failed to cancel proforma invoice";
                            setAlert({ open: true, type: "error", message: errorMsg });
                            setPasswordModal(prev => ({ ...prev, loading: false }));
                        }
                    }
                });
            }
        });
    };

    useEffect(() => {
        const viewId = searchParams.get("view_id");
        if (viewId) {
            const fetchInvoice = async () => {
                try {
                    const data = await getProformaInvoiceById(viewId);
                    if (data) {
                        setSelectedInvoice(data);
                        setViewModalOpen(true);
                    }
                } catch (err) {
                    console.error("Failed to load invoice details", err);
                }
            };
            fetchInvoice();
        }
    }, [searchParams]);

    const fetchInvoices = async (page = 1, search = "") => {
        setLoading(true);
        try {
            const data = await getProformaInvoices(page, search);
            setInvoices(data.results || []);
            setTotalCount(data.count || 0);
            setNextPage(data.next);
            setPrevPage(data.previous);
        } catch (error) {
            console.error("Failed to fetch proforma invoices", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices(currentPage, searchText);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText, currentPage]);

    const handleSearch = (e) => {
        setSearchText(e.target.value);
        setCurrentPage(1);
    };

    const handleNext = () => {
        if (nextPage) setCurrentPage((prev) => prev + 1);
    };

    const handlePrev = () => {
        if (prevPage) setCurrentPage((prev) => prev - 1);
    };

    const handleEdit = async (item) => {
        try {
            await lockProformaInvoice(item.id);
            setSelectedInvoice(item);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Failed to lock proforma invoice", error);
            setAlert({
                open: true,
                type: "error",
                message: "Failed to acquire lock. The invoice may be currently edited by another user."
            });
        }
    };

    const handleModalClose = async () => {
        if (selectedInvoice) {
            try {
                await unlockProformaInvoice(selectedInvoice.id);
            } catch (error) {
                console.error("Failed to release lock", error);
            }
        }
        setIsModalOpen(false);
        setSelectedInvoice(null);
    };


    return (
        <div className="p-1 sm:p-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* HEADER */}
                <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Proforma Invoices</h3>
                        <span className="text-sm text-slate-500 font-semibold mt-1 block">
                            Total Records: {totalCount}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-500 hover:shadow-md hover:shadow-blue-200/50 transition-all active:scale-[0.98]"
                        >
                            <FaPlus className="text-xs" />
                            New Proforma Invoice
                        </button>
                    </div>
                </div>

                {/* SEARCH BAR */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="max-w-md">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">
                            Search Invoices
                        </label>
                        <div className="relative">
                            <input
                                value={searchText}
                                onChange={handleSearch}
                                placeholder="Search by exporter, consignee, applicant..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                            />
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                </div>

                {/* TABLE LIST */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-700 uppercase text-[10px] font-bold tracking-widest">
                                <th className="px-4 py-3 text-xs font-bold text-slate-600">PI Number / Ref</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-600">PI Date</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-600">Applicant Importer</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-600 text-right">Total Amount</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-600 text-center">Status</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-600 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-12 text-center text-slate-400 font-semibold">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
                                            <span>Loading proforma invoices...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : invoices.length > 0 ? (
                                invoices.map((item) => {
                                    const status = (item.status || "DRAFT").toUpperCase();
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-4 py-3 text-xs font-bold whitespace-nowrap">
                                                <span className="font-mono text-blue-600 block">
                                                    {item.pi_number || `#${item.id?.substring(0, 8) || "N/A"}`}
                                                </span>
                                                {item.is_stock_sale ? (
                                                    <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded-md border border-amber-200">
                                                        <FaBoxOpen size={8} /> STOCK SALE
                                                    </span>
                                                ) : item.requisition_number ? (
                                                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                                                        Req: {item.requisition_number}
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap font-medium">
                                                {item.pi_date}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate font-medium">
                                                {item.applicant_importer}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-bold text-slate-800 font-mono whitespace-nowrap">
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mr-1.5">{item.currency}</span>
                                                {Number(item.grand_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusStyle(status)}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedInvoice(item);
                                                            setViewModalOpen(true);
                                                        }}
                                                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="View Details"
                                                    >
                                                        <FaEye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (status === 'ACCEPTED' || status === 'CANCELLED') return;
                                                            handleEdit(item);
                                                        }}
                                                        disabled={status === 'ACCEPTED' || status === 'CANCELLED'}
                                                        className={`p-2 rounded-xl transition-all ${
                                                            status === 'ACCEPTED' || status === 'CANCELLED'
                                                                ? "text-slate-300 cursor-not-allowed opacity-40"
                                                                : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                        }`}
                                                        title={
                                                            status === 'ACCEPTED' ? "Cannot edit accepted proforma invoice" :
                                                            status === 'CANCELLED' ? "Cannot edit cancelled proforma invoice" :
                                                            "Edit Proforma Invoice"
                                                        }
                                                    >
                                                        <FaEdit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (status !== 'DRAFT') return;
                                                            handleSendInvoice(item.id);
                                                        }}
                                                        disabled={status !== 'DRAFT'}
                                                        className={`p-2 rounded-xl transition-all ${
                                                            status === 'DRAFT'
                                                                ? "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                                                : "text-slate-300 cursor-not-allowed opacity-40"
                                                        }`}
                                                        title={status === 'DRAFT' ? "Send Proforma Invoice" : "Invoice already sent"}
                                                    >
                                                        <FaPaperPlane size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (status !== 'SENT') return;
                                                            handleAcceptInvoice(item.id);
                                                        }}
                                                        disabled={status !== 'SENT'}
                                                        className={`p-2 rounded-xl transition-all ${
                                                            status === 'SENT'
                                                                ? "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                                                : "text-slate-300 cursor-not-allowed opacity-40"
                                                        }`}
                                                        title={
                                                            status === 'SENT' ? "Accept Proforma Invoice" :
                                                            status === 'ACCEPTED' ? "Invoice already accepted" :
                                                            "Cannot accept invoice in current state"
                                                        }
                                                    >
                                                        <FaCheck size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (status !== 'SENT') return;
                                                            handleCancelInvoice(item.id);
                                                        }}
                                                        disabled={status !== 'SENT'}
                                                        className={`p-2 rounded-xl transition-all ${
                                                            status === 'SENT'
                                                                ? "text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                                                                : "text-slate-300 cursor-not-allowed opacity-40"
                                                        }`}
                                                        title={
                                                            status === 'SENT' ? "Cancel Proforma Invoice" :
                                                            status === 'CANCELLED' ? "Invoice already cancelled" :
                                                            "Cannot cancel invoice in current state"
                                                        }
                                                    >
                                                        <FaTimes size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-semibold italic">
                                        No proforma invoices found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={handlePrev}
                        disabled={!prevPage}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                        ← Previous
                    </button>

                    <span className="text-xs font-bold text-slate-400">Page {currentPage}</span>

                    <button
                        onClick={handleNext}
                        disabled={!nextPage}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* CREATE / EDIT MODAL */}
            <ClientQuotationModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={(msg) => {
                    fetchInvoices(currentPage, searchText);
                    setAlert({ open: true, type: "success", message: msg || "Invoice operation successful" });
                }}
                invoice={selectedInvoice}
            />

            {/* DETAILS MODAL */}
            <ClientQuotationDetailsModal
                isOpen={viewModalOpen}
                onClose={() => {
                    setViewModalOpen(false);
                    setSelectedInvoice(null);
                }}
                invoice={selectedInvoice}
            />

            {/* CONFIRM DIALOG */}
            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                message={confirm.message}
                confirmText={confirm.confirmText}
                cancelText={confirm.cancelText}
                loading={confirm.loading}
                onConfirm={confirm.action}
                onCancel={() => setConfirm({ ...confirm, open: false })}
                icon={confirm.icon}
                confirmButtonClass={confirm.confirmButtonClass}
                iconBgClass={confirm.iconBgClass}
            />

            {/* PASSWORD CONFIRM MODAL */}
            <PasswordConfirmModal
                open={passwordModal.open}
                title={passwordModal.title}
                message={passwordModal.message}
                loading={passwordModal.loading}
                onConfirm={passwordModal.onConfirm}
                onCancel={() => setPasswordModal({ open: false })}
            />

            {/* ALERT TOAST */}
            <AlertToast
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ ...alert, open: false })}
            />
        </div>
    );
};

export default ClientQuotation;
