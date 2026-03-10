import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchPurchaseOrders, getPurchaseOrderReport, cancelPurchaseOrder } from "../services/purchaseOrderService";
import { FaEye, FaFileExcel, FaTimes, FaSearch } from "react-icons/fa";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PurchaseOrderModal from "../components/purchaseOrder/PurchaseOrderModal";
import VendorSelector from "../components/common/VendorSelector";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PasswordConfirmModal from "../components/ui/PasswordConfirmModal";

const PurchaseOrderList = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();

    // Pagination State
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [page, setPage] = useState(1);
    const [confirm, setConfirm] = useState({ open: false, action: null });
    const [passwordModal, setPasswordModal] = useState({ open: false, onConfirm: null, loading: false });

    // ✅ Search state
    const [searchText, setSearchText] = useState("");

    /* =========================
       REPORT STATE
       ========================= */
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState("date_range"); // date_range, pending, vendor
    const [reportParams, setReportParams] = useState({
        start_date: "",
        end_date: "",
        vendor_id: "",
        vendor_name: ""
    });

    const [downloading, setDownloading] = useState(false);

    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
    });

    /* =========================
       FETCH — accepts explicit pageNum
       ========================= */
    const loadData = async (pageNum = 1) => {
        setLoading(true);
        try {
            const res = await fetchPurchaseOrders(pageNum, searchText);
            const data = res.data ? res.data : res;

            if (data && data.results) {
                setList(data.results);
                setCount(data.count || data.results.length);
                setNext(data.next);
                setPrevious(data.previous);
            } else if (Array.isArray(data)) {
                setList(data);
                setCount(data.length);
                setNext(null);
                setPrevious(null);
            } else {
                setList([]);
                setCount(0);
            }
            setPage(pageNum);

        } catch (err) {
            console.error(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to load purchase orders",
            });
            setList([]);
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       EFFECT: search change → debounce + RESET to page 1
       (page is intentionally NOT in the dependency array)
       ========================= */
    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(1); // ✅ always page 1 when search changes
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText]);

    // Check for view_id query param (deep linking from Dashboard)
    useEffect(() => {
        const viewId = searchParams.get("view_id");
        if (viewId && viewId.length === 36) {
            setSelectedPO({ id: viewId });
            setModalOpen(true);
        }
    }, [searchParams]);

    /* =========================
       REPORT HANDLER
       ========================= */
    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const params = {};
            let filenamePrefix = "PurchaseOrder_Report";

            if (reportType === "date_range") {
                if (!reportParams.start_date || !reportParams.end_date) {
                    setToast({ open: true, type: "error", message: "Please select start and end dates" });
                    setDownloading(false);
                    return;
                }
                params.start_date = reportParams.start_date;
                params.end_date = reportParams.end_date;
                filenamePrefix = `PO_Report_${params.start_date}_to_${params.end_date}`;

            } else if (reportType === "pending") {
                params.status = "PENDING";
                filenamePrefix = "Pending_PO_Report";

            } else if (reportType === "vendor") {
                if (!reportParams.vendor_id) {
                    setToast({ open: true, type: "error", message: "Please select a vendor" });
                    setDownloading(false);
                    return;
                }
                params.vendor = reportParams.vendor_id;
                const vName = reportParams.vendor_name || "Vendor";
                filenamePrefix = `PO_Report_${vName.replace(/\s+/g, '_')}`;
            }

            const res = await getPurchaseOrderReport(params);
            const data = res.data;
            const reportData = data.purchase_orders || [];

            const wb = XLSX.utils.book_new();

            const finalSheetData = [
                [data.report_type || "Purchase Order Report"],
                ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()],
                [],
                ["SUMMARY"],
                ["Total POs:", data.summary?.total_purchase_orders || 0],
                ["Total Value:", data.summary?.total_value || 0],
                ["Pending POs:", data.summary?.pending_pos || 0],
                ["Partially Received:", data.summary?.partially_received_pos || 0],
                ["Completed POs:", data.summary?.completed_pos || 0],
                [],
                ["PO Number", "Date", "Vendor Name", "Vendor Code", "Req No", "Total Amount", "Status", "Item Code", "Item Name", "Quantity", "Rate", "Amount", "Purchased"]
            ];

            reportData.forEach(po => {
                if (po.items && po.items.length > 0) {
                    po.items.forEach(item => {
                        finalSheetData.push([
                            po.po_number, po.po_date, po.vendor_name, po.vendor_code,
                            po.requisition_number, po.total_amount, po.status,
                            item.product_code, item.product_name, item.quantity,
                            item.rate, item.amount, item.is_received ? "Yes" : "No"
                        ]);
                    });
                } else {
                    finalSheetData.push([
                        po.po_number, po.po_date, po.vendor_name, po.vendor_code,
                        po.requisition_number, po.total_amount, po.status,
                        "-", "-", "-", "-", "-", "-"
                    ]);
                }
            });

            const worksheet = XLSX.utils.aoa_to_sheet(finalSheetData);
            XLSX.utils.book_append_sheet(wb, worksheet, "PO Report");

            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
            saveAs(blob, `${filenamePrefix}.xlsx`);

            setShowReportModal(false);
            setToast({ open: true, type: "success", message: "Report downloaded successfully" });

        } catch (err) {
            console.error("Download failed", err);
            setToast({ open: true, type: "error", message: "Failed to download report" });
        } finally {
            setDownloading(false);
        }
    };

    const handleView = (row) => {
        setSelectedPO(row);
        setModalOpen(true);
    };

    const handleCancelPO = (poId) => {
        const po = list.find(p => p.id === poId);
        setConfirm({
            open: true,
            title: "Cancel Purchase Order?",
            description: `Are you sure you want to cancel Purchase Order "${po?.po_number}"? This action cannot be undone.`,
            action: () => {
                setConfirm(prev => ({ ...prev, open: false }));
                setPasswordModal({
                    open: true,
                    loading: false,
                    onConfirm: async (password) => {
                        setPasswordModal(prev => ({ ...prev, loading: true }));
                        try {
                            const res = await cancelPurchaseOrder(poId, { confirm_password: password });
                            setToast({
                                open: true,
                                type: "success",
                                message: res.data?.message || res.message || "Purchase Order cancelled successfully",
                            });
                            loadData(page);
                            setPasswordModal({ open: false });
                        } catch (err) {
                            console.error(err);
                            const errorMsg = err.response?.data?.message || err.response?.data?.detail || "Failed to cancel Purchase Order";
                            setToast({ open: true, type: "error", message: errorMsg });
                            setPasswordModal(prev => ({ ...prev, loading: false }));
                        }
                    }
                });
            }
        });
    };

    return (
        <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800">Purchase Orders</h3>
                        <span className="text-sm text-slate-500 font-semibold">
                            Total: {count}
                        </span>
                    </div>

                    <button
                        onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                            setReportParams(prev => ({ ...prev, start_date: firstDay, end_date: today }));
                            setShowReportModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500"
                    >
                        <FaFileExcel className="text-sm" />
                        Download Report
                    </button>
                </div>

                {/* ✅ SEARCH BAR */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-55">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Search Purchase Order
                            </label>
                            <div className="relative">
                                <input
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder="Search by PO number, vendor..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-slate-800 uppercase text-[10px] font-bold tracking-widest">
                                <th className="px-6 py-4 text-[13px]">PO No</th>
                                <th className="px-6 py-4 text-[13px]">Req No</th>
                                <th className="px-6 py-4 text-[13px]">Vendor</th>
                                <th className="px-6 py-4 text-[13px]">PO Date</th>
                                <th className="px-6 py-4 text-[13px] text-right">Total Amount</th>
                                <th className="px-6 py-4 text-[13px]">Status</th>
                                <th className="px-6 py-4 text-[13px] text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-6 text-center text-slate-500">
                                        Loading purchase orders...
                                    </td>
                                </tr>
                            ) : list.length > 0 ? (
                                list.map((row) => (
                                    <tr key={row.id} className="odd:bg-slate-100 even:bg-white hover:bg-slate-200 transition">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => handleView(row)}>
                                                {row.po_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {row.requisition_number}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            <div className="font-medium">{row.vendor_name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-semibold">
                                            {new Date(row.po_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800">
                                            {parseFloat(row.total_amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const allReceived = row.items && row.items.length > 0 && row.items.every(i => i.is_received);
                                                const someReceived = row.items && row.items.length > 0 && row.items.some(i => i.is_received);

                                                let displayStatus = row.status;
                                                if (allReceived) displayStatus = 'COMPLETED';
                                                else if (someReceived) displayStatus = 'PARTIALLY_RECEIVED';

                                                let statusText = displayStatus;
                                                if (displayStatus === 'PENDING') statusText = 'Pending';
                                                else if (displayStatus === 'PARTIALLY_RECEIVED') statusText = 'Partially Received';
                                                else if (displayStatus === 'COMPLETED') statusText = 'Completed';
                                                else if (displayStatus === 'CANCELLED') statusText = 'Cancelled';

                                                return (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                        ${displayStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                            displayStatus === 'PARTIALLY_RECEIVED' ? 'bg-blue-100 text-blue-800' :
                                                                displayStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                                                    displayStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                                        'bg-slate-100 text-slate-800'}`}>
                                                        {statusText}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-3">
                                                <button
                                                    className="text-slate-500 hover:text-blue-600"
                                                    title="View"
                                                    onClick={() => handleView(row)}
                                                >
                                                    <FaEye />
                                                </button>
                                                {row.status !== 'COMPLETED' && row.status !== 'CANCELLED' && (
                                                    <button
                                                        onClick={() => handleCancelPO(row.id)}
                                                        title="Cancel PO"
                                                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                    >
                                                        <FaTimes size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-6 text-center text-slate-500">
                                        No purchase orders found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => previous && loadData(page - 1)}
                        disabled={!previous}
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40"
                    >
                        ← Previous
                    </button>

                    <span className="text-xs text-slate-400">Page {page}</span>

                    <button
                        onClick={() => next && loadData(page + 1)}
                        disabled={!next}
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40"
                    >
                        Next →
                    </button>
                </div>
            </div>

            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />

            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                message={confirm.description}
                confirmText={confirm.confirmText || "Confirm"}
                onConfirm={confirm.action}
                onCancel={() => setConfirm({ ...confirm, open: false })}
            />

            <PasswordConfirmModal
                open={passwordModal.open}
                loading={passwordModal.loading}
                title="Confirm Cancellation"
                message={`Please enter your password to cancel this Purchase Order.`}
                onConfirm={passwordModal.onConfirm}
                onCancel={() => setPasswordModal({ open: false })}
            />

            <PurchaseOrderModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                data={selectedPO}
                onShowAlert={(type, message) => setToast({ open: true, type, message })}
                onUpdate={() => loadData(page)}
            />

            {/* REPORT MODAL */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FaFileExcel className="text-emerald-600" /> Export PO Report
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600 font-medium">Select Report Type:</p>

                            <div className="space-y-3">
                                {/* Date Range Option */}
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="date_range"
                                        checked={reportType === "date_range"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Date Range</span>
                                </label>
                                {reportType === "date_range" && (
                                    <div className="pl-8 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                                        <input
                                            type="date"
                                            className="input text-xs"
                                            value={reportParams.start_date}
                                            onChange={(e) => setReportParams({ ...reportParams, start_date: e.target.value })}
                                        />
                                        <input
                                            type="date"
                                            className="input text-xs"
                                            value={reportParams.end_date}
                                            onChange={(e) => setReportParams({ ...reportParams, end_date: e.target.value })}
                                        />
                                    </div>
                                )}

                                {/* Pending PO Option */}
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="pending"
                                        checked={reportType === "pending"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Pending Purchase Orders</span>
                                </label>

                                {/* Vendor Option */}
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="vendor"
                                        checked={reportType === "vendor"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Specific Vendor</span>
                                </label>
                                {reportType === "vendor" && (
                                    <div className="pl-8 animate-in fade-in slide-in-from-top-2">
                                        <VendorSelector
                                            value={reportParams.vendor_id}
                                            onChange={(id) => setReportParams({ ...reportParams, vendor_id: id })}
                                            placeholder="Search and Select Vendor"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDownloadReport}
                                disabled={downloading}
                                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
                            >
                                {downloading ? "Downloading..." : "Download Excel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseOrderList;