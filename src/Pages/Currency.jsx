import { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaEye, FaGlobe } from "react-icons/fa";

import CurrencyModal from "../components/currencies/CurrencyModal";
import CurrencyViewModal from "../components/currencies/CurrencyViewModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AlertToast from "../components/ui/AlertToast";
import PasswordConfirmModal from "../components/ui/PasswordConfirmModal";
import { getCurrencies, deleteCurrency, getCurrency } from "../services/currencyService";

export default function Currency() {
    const [currencies, setCurrencies] = useState([]);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);

    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editCurrency, setEditCurrency] = useState(null);

    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [passwordModal, setPasswordModal] = useState({ open: false, onConfirm: null, loading: false });

    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewCurrency, setViewCurrency] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState(""); // "" | "active" | "inactive"

    // Page state
    const [page, setPage] = useState(1);

    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
    });

    /* =========================
       FETCH — accepts explicit pageNum
       ========================= */
    const fetchCurrencies = async (pageNum = 1) => {
        try {
            setLoading(true);

            // Build URL with page number when not on page 1
            const pageUrl = pageNum > 1 ? `/api/currencies?page=${pageNum}` : undefined;

            const res = await getCurrencies({
                url: pageUrl,
                search: searchText,
                isActive:
                    statusFilter === "active"
                        ? true
                        : statusFilter === "inactive"
                            ? false
                            : null,
            });

            // Handle standard paginated response vs raw list response
            const results = res.data?.results || res.results || res.data || [];
            const totalCount = res.data?.count ?? res.count ?? results.length;
            const nextUrl = res.data?.next ?? res.next ?? null;
            const prevUrl = res.data?.previous ?? res.previous ?? null;

            setCurrencies(results);
            setCount(totalCount);
            setNext(nextUrl);
            setPrevious(prevUrl);

            setPage(pageNum);
        } catch (err) {
            console.error(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to load currencies",
            });
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       EFFECT: search/filter change → debounce + RESET to page 1
       ========================= */
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCurrencies(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText, statusFilter]);

    /* =========================
       PAGINATION HANDLER
       ========================= */
    const handlePageChange = (newPage) => {
        fetchCurrencies(newPage);
    };

    /* =========================
       ACTION HANDLERS
       ========================= */
    const handleAddCurrency = () => {
        setEditCurrency(null);
        setOpenModal(true);
    };

    const handleEdit = (currency) => {
        setEditCurrency(currency);
        setOpenModal(true);
    };

    const handleDelete = (currency) => {
        setSelectedCurrency(currency);
        setShowConfirm(true);
    };

    const handleView = async (currency) => {
        setViewModalOpen(true);
        setViewLoading(true);
        setViewCurrency(null);
        try {
            const res = await getCurrency(currency.id);
            setViewCurrency(res.data);
        } catch (err) {
            console.error(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to load currency details",
            });
            setViewModalOpen(false);
        } finally {
            setViewLoading(false);
        }
    };

    const handleCurrencySuccess = (mode) => {
        setToast({
            open: true,
            type: "success",
            message:
                mode === "edit"
                    ? "Currency updated successfully"
                    : "Currency added successfully",
        });
        fetchCurrencies(mode === "edit" ? page : 1);
    };

    const confirmDelete = () => {
        setShowConfirm(false);
        setPasswordModal({
            open: true,
            loading: false,
            onConfirm: async (password) => {
                setPasswordModal(prev => ({ ...prev, loading: true }));
                try {
                    const res = await deleteCurrency(selectedCurrency.id, { confirm_password: password });
                    setToast({
                        open: true,
                        type: "success",
                        message: res.data?.message || res.message || "Currency deleted successfully",
                    });
                    fetchCurrencies(1);
                    setPasswordModal({ open: false });
                } catch (err) {
                    console.error(err);
                    const errorMsg = err.response?.data?.message || err.response?.data?.detail || "Failed to delete currency";
                    setToast({
                        open: true,
                        type: "error",
                        message: errorMsg,
                    });
                    setPasswordModal(prev => ({ ...prev, loading: false }));
                } finally {
                    setSelectedCurrency(null);
                }
            }
        });
    };

    return (
        <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                {/* HEADER */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FaGlobe className="text-blue-600" /> Currencies
                        </h3>
                        <span className="text-sm text-slate-500 font-semibold">
                            Total: {count}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAddCurrency}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500"
                        >
                            <FaPlus className="text-xs" />
                            Add Currency
                        </button>
                    </div>
                </div>

                {/* SEARCH & FILTER */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex flex-wrap gap-4 items-end">

                        {/* Search Currency */}
                        <div className="flex-1 min-w-55">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Search Currency
                            </label>
                            <input
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search by code, name, symbol"
                                className="input"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="w-40">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input"
                            >
                                <option value="">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-slate-800 uppercase text-[10px] font-bold tracking-widest">
                                <th className="px-6 py-4 text-[13px]">Code</th>
                                <th className="px-6 py-4 text-[13px]">Currency Name</th>
                                <th className="px-6 py-4 text-[13px]">Symbol</th>
                                <th className="px-6 py-4 text-[13px]">Status</th>
                                <th className="px-6 py-4 text-[13px] text-center">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-6 text-center text-slate-500">
                                        Loading currencies...
                                    </td>
                                </tr>
                            )}

                            {!loading && currencies.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-6 text-center text-slate-500">
                                        No currencies found
                                    </td>
                                </tr>
                            )}

                            {currencies.map((c) => (
                                <tr key={c.id} className="odd:bg-slate-100 even:bg-white hover:bg-slate-200 transition">
                                    <td className="px-6 py-4 font-mono text-blue-600 font-bold text-[14px]">
                                        {c.code}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-800 text-[14px]">
                                        {c.name}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700 text-[16px] font-mono">
                                        {c.symbol || "-"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
                                            ${c.is_active
                                                ? 'bg-green-55 text-green-700'
                                                : 'bg-red-50 text-red-600'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {c.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleView(c)}
                                                className="text-slate-500 hover:text-blue-600"
                                                title="View"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(c)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Edit"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Delete"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => previous && handlePageChange(page - 1)}
                        disabled={!previous}
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40"
                    >
                        ← Previous
                    </button>

                    <span className="text-xs text-slate-400">Page {page}</span>

                    <button
                        onClick={() => next && handlePageChange(page + 1)}
                        disabled={!next}
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* MODALS */}
            <CurrencyModal
                key={editCurrency ? editCurrency.id : "add"}
                open={openModal}
                onClose={() => setOpenModal(false)}
                mode={editCurrency ? "edit" : "add"}
                currency={editCurrency}
                onSuccess={handleCurrencySuccess}
            />

            <CurrencyViewModal
                open={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                data={viewCurrency}
                loading={viewLoading}
            />

            {/* CONFIRM DELETE */}
            <ConfirmDialog
                open={showConfirm}
                title="Delete Currency"
                message={`Are you sure you want to delete "${selectedCurrency?.name}" (${selectedCurrency?.code})?`}
                confirmText="Delete"
                loading={deleting}
                onCancel={() => setShowConfirm(false)}
                onConfirm={confirmDelete}
            />

            {/* TOAST */}
            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />

            <PasswordConfirmModal
                open={passwordModal.open}
                loading={passwordModal.loading}
                title="Confirm Delete"
                message={`Please enter your password to delete "${selectedCurrency?.name}".`}
                onConfirm={passwordModal.onConfirm}
                onCancel={() => setPasswordModal({ open: false })}
            />
        </div>
    );
}
