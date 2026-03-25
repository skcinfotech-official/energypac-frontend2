import React, { useEffect, useState } from "react";
import { fetchFinancePurchaseOrders } from "../services/financeService";
import { FaEye, FaSearch, FaFilter, FaMoneyBillWave, FaCalendarAlt, FaUserTie } from "react-icons/fa";
import AlertToast from "../components/ui/AlertToast";
import VendorSelector from "../components/common/VendorSelector";
import FinancePOModal from "../components/purchaseOrder/FinancePOModal";
import POItemsModal from "../components/purchaseOrder/POItemsModal";
import RecordPaymentModal from "../components/purchaseOrder/RecordPaymentModal";
import PaymentHistoryModal from "../components/purchaseOrder/PaymentHistoryModal";
import { FaHistory } from "react-icons/fa";

const FinancePOList = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);

    // Modal States
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [itemsModalOpen, setItemsModalOpen] = useState(false);
    const [selectedPOId, setSelectedPOId] = useState(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [vendor, setVendor] = useState("");
    const [ordering, setOrdering] = useState("-po_date"); // Default ordering

    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
    });

    const loadData = async (pageNum = 1) => {
        setLoading(true);
        try {
            const params = {
                page: pageNum,
                search: search,
                status: status,
                vendor: vendor,
                ordering: ordering
            };
            const data = await fetchFinancePurchaseOrders(params);

            setList(data.results || []);
            setCount(data.count || 0);
            setNext(data.next);
            setPrevious(data.previous);
            setPage(pageNum);
        } catch (err) {
            console.error("Failed to fetch finance POs", err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to load purchase orders",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(page);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, status, vendor, ordering, page]);


    const formatCurrency = (amount) => {
        return Number(amount || 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            case 'PARTIALLY_RECEIVED': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <FaMoneyBillWave className="text-emerald-600" />
                        Purchase Orders (Finance View)
                    </h1>
                    <p className="text-slate-500 mt-1">Track payments, balances, and financial status of all purchase orders</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Orders</p>
                        <p className="text-xl font-bold text-slate-800">{count}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Search */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search PO</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="PO Number..."
                                value={search}
                                onChange={(e) => {setSearch(e.target.value); setPage(1);}}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                        <select
                            value={status}
                            onChange={(e) => {setStatus(e.target.value); setPage(1);}}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="PARTIALLY_RECEIVED">Partially Received</option>
                        </select>
                    </div>

                    {/* Vendor Filter */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vendor</label>
                        <VendorSelector
                            value={vendor}
                            onChange={(id) => {setVendor(id); setPage(1);}}
                            placeholder="All Vendors"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">PO Details</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vendor Info</th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-600" onClick={() => setOrdering(ordering === '-total_amount' ? 'total_amount' : '-total_amount')}>
                                    Total Amount
                                </th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-600" onClick={() => setOrdering(ordering === '-balance' ? 'balance' : '-balance')}>
                                    Due Balance
                                </th>
                                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && list.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-8">
                                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : list.length > 0 ? (
                                list.map((po) => (
                                    <tr 
                                        key={po.id} 
                                        className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setSelectedPO(po);
                                            setDetailsModalOpen(true);
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 self-start text-xs mb-1">
                                                    {po.po_number}
                                                </span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                                                    <FaCalendarAlt size={10} />
                                                    {new Date(po.po_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                    <FaUserTie size={12} className="text-slate-400" />
                                                    {po.vendor_name}
                                                </span>
                                                <span className="text-[11px] text-slate-500 font-medium">GST: {po.vendor_gst || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-bold text-slate-800">
                                                {formatCurrency(po.total_amount)}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-semibold uppercase">
                                                Items: {po.total_items_count}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-bold text-emerald-600">
                                                {formatCurrency(po.amount_paid)}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-semibold uppercase">
                                                {po.payment_count} Payments
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`text-sm font-bold ${po.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {formatCurrency(po.balance)}
                                            </div>
                                            {po.balance > 0 && (
                                                <div className="flex justify-end mt-1">
                                                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-red-500" 
                                                            style={{ width: `${Math.min(100, (po.balance / po.total_amount) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(po.status)}`}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    title="View Details"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setItemsModalOpen(false);
                                                        setPaymentModalOpen(false);
                                                        setHistoryModalOpen(false);
                                                        setSelectedPO(po);
                                                        setDetailsModalOpen(true);
                                                    }}
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                    title="Record Payment"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDetailsModalOpen(false);
                                                        setItemsModalOpen(false);
                                                        setHistoryModalOpen(false);
                                                        setSelectedPO(po);
                                                        setPaymentModalOpen(true);
                                                    }}
                                                >
                                                    <FaMoneyBillWave />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                                                    title="Payment History"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDetailsModalOpen(false);
                                                        setItemsModalOpen(false);
                                                        setPaymentModalOpen(false);
                                                        setSelectedPOId(po.id);
                                                        setHistoryModalOpen(true);
                                                    }}
                                                >
                                                    <FaHistory size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                                <FaSearch size={24} />
                                            </div>
                                            <p className="text-slate-500 font-medium">No purchase orders found matching your criteria</p>
                                            <button 
                                                onClick={() => {setSearch(""); setStatus(""); setVendor(""); setPage(1);}}
                                                className="mt-2 text-emerald-600 font-bold hover:underline"
                                            >
                                                Clear all filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-semibold">
                        Showing <span className="text-slate-800">{list.length}</span> of <span className="text-slate-800">{count}</span> entries
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => previous && loadData(page - 1)}
                            disabled={!previous}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => next && loadData(page + 1)}
                            disabled={!next}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            </div>

            <FinancePOModal
                open={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                data={selectedPO}
                onViewItems={(id) => {
                    setSelectedPOId(id);
                    setItemsModalOpen(true);
                }}
                onRecordPayment={(data) => {
                    setSelectedPO(data);
                    setPaymentModalOpen(true);
                }}
                onShowHistory={(id) => {
                    setSelectedPOId(id);
                    setHistoryModalOpen(true);
                }}
            />
            <POItemsModal
                open={itemsModalOpen}
                onClose={() => setItemsModalOpen(false)}
                poId={selectedPOId}
            />

            <RecordPaymentModal
                open={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                poData={selectedPO}
                onSuccess={(msg) => {
                    setToast({ open: true, type: "success", message: msg });
                    loadData(page);
                }}
            />

            <PaymentHistoryModal
                open={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                poId={selectedPOId}
            />

            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />
        </>
    );
};

export default FinancePOList;
