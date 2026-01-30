import { useEffect, useState } from "react";
import {
  fetchRequisitions,
  deleteRequisition,
  getRequisitionReport,
  getRequisitionDetailReport
} from "../services/requisition";
import RequisitionModal from "../components/requisition/RequisitionModal";
import { FaPlus, FaEdit, FaTrash, FaFileAlt, FaEye, FaFileExcel } from "react-icons/fa";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AlertToast from "../components/ui/AlertToast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Requisition = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [page, setPage] = useState(1);

  // Filter State
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "true" | "false"
  const [dateFilter, setDateFilter] = useState("");

  /* =========================
     MODAL STATE
     ========================= */
  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);

  /* =========================
     CONFIRMATION & TOAST
     ========================= */
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  /* =========================
     REPORT STATE
     ========================= */
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("date_range"); // "date_range", "pending", "requisition_id"
  const [reportDates, setReportDates] = useState({ start: "", end: "" });
  const [selectedReqId, setSelectedReqId] = useState("");
  const [allRequisitions, setAllRequisitions] = useState([]);
  const [downloading, setDownloading] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const loadData = async (pageNum = 1) => {
    setLoading(true);
    try {
      // Note: Backend might need updates to support search/status filters if not already there.
      // fetchRequisitions currently takes 'page' arg.
      // fetchRequisitions(page, search, is_assigned, requisition_date)
      const res = await fetchRequisitions(pageNum, searchText, statusFilter, dateFilter);
      // Ensure we handle both structure types if they differ, assuming standardized DRF response logic from Products.jsx
      // Products.jsx: res.data.results, res.data.count, etc.
      // Requisition.jsx original: res.data.results

      const data = res.data;
      if (data.results) {
        setList(data.results);
        setCount(data.count || data.results.length);
        setNext(data.next);
        setPrevious(data.previous);
      } else {
        // Fallback if structure is different
        setList(Array.isArray(data) ? data : []);
        setCount(Array.isArray(data) ? data.length : 0);
      }
      setPage(pageNum);

    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        type: "error",
        message: "Failed to load requisitions",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (row) => {
    setEditData(row);
    setViewOnly(false);
    setOpenModal(true);
  };

  const handleView = (row) => {
    setEditData(row);
    setViewOnly(true); // View mode
    setOpenModal(true);
  };

  const handleAdd = () => {
    setEditData(null);
    setViewOnly(false);
    setOpenModal(true);
  }

  // const handleDelete = (row) => {
  //   setSelectedItem(row);
  //   setShowConfirm(true);
  // };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteRequisition(selectedItem.id);
      setToast({
        open: true,
        type: "success",
        message: "Requisition deleted successfully",
      });
      loadData(page);
    } catch (err) {
      setToast({
        open: true,
        type: "error",
        message: "Failed to delete requisition",
      });
    } finally {
      setDeleting(false);
      setShowConfirm(false);
      setSelectedItem(null);
    }
  };

  const handleSuccess = () => {
    loadData(page);
    setToast({
      open: true,
      type: "success",
      message: editData ? "Requisition updated successfully" : "Requisition created successfully",
    });
  }

  /* =========================
     REPORT HANDLER
     ========================= */
  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const params = {};
      let filenamePrefix = "Requisition_Report";

      let detailedData = null;

      if (reportType === "date_range") {
        if (!reportDates.start || !reportDates.end) {
          setToast({ open: true, type: "error", message: "Please select start and end dates" });
          setDownloading(false);
          return;
        }
        params.start_date = reportDates.start;
        params.end_date = reportDates.end;
        filenamePrefix = `Requisition_Report_${params.start_date}_to_${params.end_date}`;

      } else if (reportType === "pending") {
        params.status = "pending";
        filenamePrefix = "Pending_Requisition_Report";

      } else if (reportType === "requisition_id") {
        if (!selectedReqId) {
          setToast({ open: true, type: "error", message: "Please select a requisition" });
          setDownloading(false);
          return;
        }
        const selectedReq = allRequisitions.find(r => r.id === selectedReqId);
        const reqNo = selectedReq ? selectedReq.requisition_number : "Detail";
        filenamePrefix = `Requisition_Report_${reqNo.replace(/[\/\\s]+/g, '_')}`;

        const res = await getRequisitionDetailReport(selectedReqId);
        // Standardize data: API might return object or array depending on backend serialization
        detailedData = res.data;
      }

      // If detailed report (Single Requisition)
      if (detailedData) {
        const wb = XLSX.utils.book_new();

        const reqData = Array.isArray(detailedData) ? detailedData[0] : detailedData;

        // --- SUMMARY SHEET ---
        const summarySheetData = [
          ["REQUISITION DETAILS"],
          ["Requisition No:", reqData.requisition_number],
          ["Date:", reqData.requisition_date],
          ["Status:", reqData.is_assigned ? "Assigned" : "Open"],
          ["Created By:", reqData.created_by],
          ["Remarks:", reqData.remarks || "-"],
          ["Generated At:", reqData.generated_at ? new Date(reqData.generated_at).toLocaleString() : new Date().toLocaleString()],
          [],
          ["ITEMS"],
          ["Code", "Product Name", "Qty", "Unit", "Rate", "Est Value", "Remarks"]
        ];

        if (reqData.items && reqData.items.length > 0) {
          reqData.items.forEach(item => {
            summarySheetData.push([
              item.product_code,
              item.product_name,
              item.quantity,
              item.unit,
              item.rate,
              item.estimated_value,
              item.remarks
            ]);
          });
          summarySheetData.push([]);
          summarySheetData.push(["", "", "", "Total Items:", reqData.total_items, "Total Value:", reqData.estimated_total_value]);
        } else {
          summarySheetData.push(["No items found"]);
        }

        const ws = XLSX.utils.aoa_to_sheet(summarySheetData);
        XLSX.utils.book_append_sheet(wb, ws, "Requisition Details");

        // Generate Buffer
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
        saveAs(blob, `${filenamePrefix}.xlsx`);

        setShowReportModal(false);
        setToast({ open: true, type: "success", message: "Detailed report downloaded" });
        setDownloading(false);
        return;
      }

      console.log("Fetching requisition report with params:", params);
      const res = await getRequisitionReport(params);
      const data = res.data;

      // Process data for Excel
      // We want a flat structure: Requisition Info + Item Info
      const rows = [];

      if (data.requisitions && Array.isArray(data.requisitions)) {
        data.requisitions.forEach(req => {
          if (req.items && req.items.length > 0) {
            req.items.forEach(item => {
              rows.push({
                "Req No": req.requisition_number,
                "Date": req.requisition_date,
                "Created By": req.created_by,
                "Status": req.status,
                "Remarks": req.remarks || "",
                "Item Code": item.product_code,
                "Item Name": item.product_name,
                "Quantity": item.quantity,
                "Unit": item.unit,
                "Item Remarks": item.remarks || ""
              });
            });
          } else {
            // Requisition with no items
            rows.push({
              "Req No": req.requisition_number,
              "Date": req.requisition_date,
              "Created By": req.created_by,
              "Status": req.status,
              "Remarks": req.remarks || "",
              "Item Code": "-",
              "Item Name": "-",
              "Quantity": "-",
              "Unit": "-",
              "Item Remarks": "-"
            });
          }
        });
      }

      if (rows.length === 0) {
        setToast({ open: true, type: "info", message: "No data found for the selected range" });
        setDownloading(false);
        return;
      }

      // Build the single sheet content using Array of Arrays (AoA)
      const wb = XLSX.utils.book_new();

      const finalSheetData = [
        // --- REPORT HEADER ---
        [data.report_type || "REQUISITION REPORT"],
        [], // Empty row
        ["Generated By:", data.generated_by || "System"],
        ["Generated At:", new Date(data.generated_at).toLocaleString()],
        ["Date Range:", `${data.date_range?.start_date} to ${data.date_range?.end_date}`],
        [],

        // --- SUMMARY SECTION ---
        ["SUMMARY STATISTICS"],
        ["Total Requisitions:", data.summary?.total_requisitions || 0],
        ["Total Items:", data.summary?.total_items || 0],
        ["Pending Requisitions:", data.summary?.pending_requisitions || 0],
        ["Assigned Requisitions:", data.summary?.assigned_requisitions || 0],
        [],

        // --- DATA TABLE HEADERS ---
        ["Req No", "Date", "Created By", "Status", "Remarks", "Item Code", "Item Name", "Quantity", "Unit", "Item Remarks"],
      ];

      // --- DATA TABLE ROWS ---
      // We already prepared 'rows' which is an array of objects. 
      // We need to convert values to array for aoa_to_sheet to append correctly, 
      // OR we can just push the values.
      rows.forEach(r => {
        finalSheetData.push([
          r["Req No"],
          r["Date"],
          r["Created By"],
          r["Status"],
          r["Remarks"],
          r["Item Code"],
          r["Item Name"],
          r["Quantity"],
          r["Unit"],
          r["Item Remarks"]
        ]);
      });

      // Create Sheet
      const worksheet = XLSX.utils.aoa_to_sheet(finalSheetData);

      // Optional: styling implies column widths, but standard xlsx doesn't do styling easily without pro.
      // We can at least set column widths slightly if needed, but not critical for MVP.

      XLSX.utils.book_append_sheet(wb, worksheet, "Requisition Report");

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
  };

  return (
    <div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">Requisitions</h3>
            <span className="text-sm text-slate-500 font-semibold">
              Total: {count}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // Set default dates (first day of current month to today)
                const today = new Date().toISOString().split('T')[0];
                const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                setReportDates({ start: firstDay, end: today });
                setShowReportModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500"
            >
              <FaFileExcel className="text-sm" />
              Download Report
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500"
            >
              <FaPlus className="text-xs" />
              New Requisition
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Search Requisition
              </label>
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by req no, items..."
                className="input"
              />
            </div>

            {/* Date Filter */}
            <div className="w-40">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
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
                <option value="false">Open</option>
                <option value="true">Assigned</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="w-32">
              <label className="block text-xs font-semibold text-transparent mb-1">
                Action
              </label>
              <button
                onClick={() => loadData(1)}
                className="w-full px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-50/50 text-slate-800 uppercase text-[10px] font-bold tracking-widest">
                <th className="px-6 py-4 text-[13px]">Req No</th>
                <th className="px-6 py-4 text-[13px]">Date</th>
                <th className="px-6 py-4 text-[13px]">Created By</th>
                <th className="px-6 py-4 text-[13px] text-center">Items</th>
                <th className="px-6 py-4 text-[13px]">Status</th>
                <th className="px-6 py-4 text-[13px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-6 text-center text-slate-500">
                    Loading requisitions...
                  </td>
                </tr>
              ) : list.length > 0 ? (
                list.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* 
                          Using FaFileAlt or similar generic icon instead of HiDocumentText 
                          to match standard react-icons/fa usage if desired, 
                          but keeping style consistent with Products.jsx which uses text-blue-600 for codes 
                        */}
                        <span className="font-mono text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => handleView(row)}>
                          {row.requisition_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-semibold">
                      {new Date(row.requisition_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.created_by_name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-slate-100 rounded-md text-slate-700 font-medium text-xs">
                        {row.total_items} items
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {row.is_assigned ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Assigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Open
                        </span>
                      )}
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
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                          onClick={() => handleEdit(row)}
                        >
                          <FaEdit />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-6 text-center text-slate-500">
                    No requisitions found
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

      <RequisitionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        editData={editData}
        viewOnly={viewOnly}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete Requisition"
        message={`Are you sure you want to delete "${selectedItem?.requisition_number}"?`}
        confirmText="Delete"
        loading={deleting}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
      />

      <AlertToast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
      {/* REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FaFileExcel className="text-emerald-600" /> Export Report
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
                  <div className="pl-8 space-y-2 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={reportDates.start}
                        onChange={(e) => setReportDates({ ...reportDates, start: e.target.value })}
                        className="input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
                      <input
                        type="date"
                        value={reportDates.end}
                        onChange={(e) => setReportDates({ ...reportDates, end: e.target.value })}
                        className="input w-full text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Pending Option */}
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="radio"
                    name="reportType"
                    value="pending"
                    checked={reportType === "pending"}
                    onChange={(e) => setReportType(e.target.value)}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Pending Requisitions</span>
                </label>

                {/* Requisition ID Option */}
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="radio"
                    name="reportType"
                    value="requisition_id"
                    checked={reportType === "requisition_id"}
                    onChange={(e) => {
                      setReportType(e.target.value);
                      // Initial load of short list
                      if (allRequisitions.length === 0) {
                        // Simplified: Fetch page 1. In real app might need search or larger page size.
                        fetchRequisitions(1).then(res => {
                          const results = res.data.results || (Array.isArray(res.data) ? res.data : []);
                          setAllRequisitions(results);
                        });
                      }
                    }}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Specific Requisition</span>
                </label>
                {reportType === "requisition_id" && (
                  <div className="pl-8 animate-in fade-in slide-in-from-top-2">
                    <select
                      value={selectedReqId}
                      onChange={(e) => setSelectedReqId(e.target.value)}
                      className="input w-full text-xs"
                    >
                      <option value="">-- Select Requisition --</option>
                      {allRequisitions.map(req => (
                        <option key={req.id} value={req.id}>
                          {req.requisition_number} ({req.created_by_name || req.created_by})
                        </option>
                      ))}
                    </select>
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

export default Requisition;
