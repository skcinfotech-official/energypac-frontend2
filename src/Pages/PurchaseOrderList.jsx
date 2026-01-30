import { useEffect, useState } from "react";
import { fetchPurchaseOrders, getPurchaseOrderReport } from "../services/purchaseOrderService";
import { FaEye, FaFileExcel } from "react-icons/fa";
import AlertToast from "../components/ui/AlertToast";
import PurchaseOrderModal from "../components/purchaseOrder/PurchaseOrderModal";
import VendorSelector from "../components/common/VendorSelector";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const PurchaseOrderList = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);

    // Pagination State
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [page, setPage] = useState(1);



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

    // Vendor list state removed as VendorSelector handles it internally
    const [downloading, setDownloading] = useState(false);

    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
    });

    const loadData = async (pageNum = 1) => {
        setLoading(true);
        try {
            const res = await fetchPurchaseOrders(pageNum);
            // Check if response has data property (standard axios) or is direct data
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

    useEffect(() => {
        loadData();
    }, []);

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
                // Find vendor name for filename
                const vName = reportParams.vendor_name || "Vendor";
                filenamePrefix = `PO_Report_${vName.replace(/\s+/g, '_')}`;
            }

            const res = await getPurchaseOrderReport(params);
            const data = res.data;
            const reportData = data.purchase_orders || [];

            if (reportData.length === 0) {
                // Even if empty, let's download the empty structure or just warn? 
                // Per previous request style, let's download with summary.
                console.log("No records found, downloading empty report.");
            }

            const wb = XLSX.utils.book_new();

            const finalSheetData = [
                // --- HEADER ---
                [data.report_type || "Purchase Order Report"],
                ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()],
                [],

                // --- SUMMARY ---
                ["SUMMARY"],
                ["Total POs:", data.summary?.total_purchase_orders || 0],
                ["Total Value:", data.summary?.total_value || 0],
                ["Pending POs:", data.summary?.pending_pos || 0],
                ["Partially Received:", data.summary?.partially_received_pos || 0],
                ["Completed POs:", data.summary?.completed_pos || 0],
                [],

                // --- DATA TABLE HEADERS ---
                ["PO Number", "Date", "Vendor Name", "Vendor Code", "Req No", "Total Amount", "Status", "Item Code", "Item Name", "Quantity", "Rate", "Amount", "Received?"]
            ];

            reportData.forEach(po => {
                if (po.items && po.items.length > 0) {
                    po.items.forEach(item => {
                        finalSheetData.push([
                            po.po_number,
                            po.po_date,
                            po.vendor_name,
                            po.vendor_code,
                            po.requisition_number,
                            po.total_amount,
                            po.status,
                            item.product_code,
                            item.product_name,
                            item.quantity,
                            item.rate,
                            item.amount,
                            item.is_received ? "Yes" : "No"
                        ]);
                    });
                } else {
                    // PO with no items (rare but possible)
                    finalSheetData.push([
                        po.po_number,
                        po.po_date,
                        po.vendor_name,
                        po.vendor_code,
                        po.requisition_number,
                        po.total_amount,
                        po.status,
                        "-", "-", "-", "-", "-", "-"
                    ]);
                }
            });

            const worksheet = XLSX.utils.aoa_to_sheet(finalSheetData);
            XLSX.utils.book_append_sheet(wb, worksheet, "PO Report");

            // Generate Buffer
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
    }

    const handleView = (row) => {
        setSelectedPO(row);
        setModalOpen(true);
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

                    {/* EXPORT BUTTON */}
                    <button
                        onClick={() => {
                            // Defaults
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
                                    <tr key={row.id} className="hover:bg-slate-50 transition">
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
                                            {/* <div className="text-xs text-slate-400">Code: {row.vendor}</div> */}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-semibold">
                                            {new Date(row.po_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800">
                                            {parseFloat(row.total_amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                ${row.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    row.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                        'bg-slate-100 text-slate-800'}`}>
                                                {row.status}
                                            </span>
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

            <PurchaseOrderModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                data={selectedPO}
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
