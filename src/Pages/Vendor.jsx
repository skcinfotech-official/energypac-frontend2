import { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaEye, FaFileExcel } from "react-icons/fa";

import VendorModal from "../components/vendors/VendorModal";
import VendorViewModal from "../components/vendors/VendorViewModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AlertToast from "../components/ui/AlertToast";
import { getVendors, deleteVendor, getVendor, getVendorPerformanceReport } from "../services/vendorService";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


export default function Vendors() {
    const [vendors, setVendors] = useState([]);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);

    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editVendor, setEditVendor] = useState(null);

    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);

    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewVendor, setViewVendor] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    // "" | "active" | "inactive"

    /* =========================
       REPORT STATE
       ========================= */
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState("date_range"); // "date_range", "vendor"
    const [reportDates, setReportDates] = useState({ start: "", end: "" });
    const [selectedVendorId, setSelectedVendorId] = useState("");
    const [allVendors, setAllVendors] = useState([]);
    const [downloading, setDownloading] = useState(false);


    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
    });

    const fetchVendors = async (url) => {
        try {
            setLoading(true);

            const res = await getVendors({
                url,
                search: searchText,
                isActive:
                    statusFilter === "active"
                        ? true
                        : statusFilter === "inactive"
                            ? false
                            : null,
            });

            // Result is already normalized in service
            setVendors(res.results);
            setCount(res.count);
            setNext(res.next);
            setPrevious(res.previous);
        } catch (err) {
            console.log(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to load vendors",
            });
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVendors();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText, statusFilter]);

    /* =========================
       ACTION HANDLERS
       ========================= */

    const handleAddVendor = () => {
        setEditVendor(null);
        setOpenModal(true);
    };

    const handleEdit = (vendor) => {
        setEditVendor(vendor);
        setOpenModal(true);
    };

    const handleDelete = (vendor) => {
        setSelectedVendor(vendor);
        setShowConfirm(true);
    };

    const handleView = async (vendor) => {
        setViewModalOpen(true);
        setViewLoading(true);
        setViewVendor(null);
        try {
            const res = await getVendor(vendor.id);
            setViewVendor(res.data);
        } catch (err) {
            console.error(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to load vendor details",
            });
            setViewModalOpen(false);
        } finally {
            setViewLoading(false);
        }
    };

    const handleSearch = () => {
        fetchVendors();
    };


    const handleVendorSuccess = (mode) => {
        setToast({
            open: true,
            type: "success",
            message:
                mode === "edit"
                    ? "Vendor updated successfully"
                    : "Vendor added successfully",
        });

        fetchVendors();
    };

    const confirmDelete = async () => {
        try {
            setDeleting(true);
            await deleteVendor(selectedVendor.id);

            setToast({
                open: true,
                type: "success",
                message: "Vendor deleted successfully",
            });

            fetchVendors();
        } catch (err) {
            console.log(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to delete vendor",
            });
        } finally {
            setDeleting(false);
            setShowConfirm(false);
            setSelectedVendor(null);
        }
    };

    const handleDownloadReport = async () => {
        if (reportType === "date_range") {
            if (!reportDates.start || !reportDates.end) {
                setToast({ open: true, type: "error", message: "Please select start and end dates" });
                return;
            }
        }

        setDownloading(true);
        try {
            const params = {
                start_date: reportDates.start,
                end_date: reportDates.end
            };

            if (reportType === "vendor") {
                if (!selectedVendorId) {
                    setToast({ open: true, type: "error", message: "Please select a vendor" });
                    setDownloading(false);
                    return;
                }
                params.vendor = selectedVendorId;
            }

            const res = await getVendorPerformanceReport(params);
            const data = res.data;
            const vendors = data.vendors || [];

            if (vendors.length === 0) {
                setToast({ open: true, type: "info", message: "No data found for the selected range" });
            }

            const wb = XLSX.utils.book_new();

            const sheetData = [
                // --- HEADER ---
                [data.report_type || "Vendor Performance Report"],
                ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()],
                ["Date Range:", `${data.date_range?.start_date} to ${data.date_range?.end_date}`],
                [],
                ["SUMMARY"],
                ["Total Vendors:", data.total_vendors || 0],
                [],
                // --- TABLE HEADERS ---
                [
                    "Vendor Code", "Vendor Name", "Contact Person", "Phone", "Email",
                    "Quotations Submitted", "Quotations Selected", "Selection Rate (%)",
                    "Purchase Orders", "Completed POs", "Completion Rate (%)",
                    "Total Business Value", "Avg Quotation Value"
                ]
            ];

            vendors.forEach(v => {
                const p = v.performance || {};
                sheetData.push([
                    v.vendor_code,
                    v.vendor_name,
                    v.contact_person,
                    v.phone,
                    v.email,
                    p.quotations_submitted || 0,
                    p.quotations_selected || 0,
                    p.selection_rate || 0,
                    p.purchase_orders || 0,
                    p.completed_orders || 0,
                    p.completion_rate || 0,
                    p.total_business_value || 0,
                    p.average_quotation_value || 0
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(sheetData);
            XLSX.utils.book_append_sheet(wb, ws, "Performance Report");

            const filename = `Vendor_Performance_${params.start_date}_to_${params.end_date}.xlsx`;
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
            saveAs(blob, filename);

            setShowReportModal(false);
            setToast({ open: true, type: "success", message: "Report downloaded successfully" });

        } catch (err) {
            console.error("Report download failed", err);
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
                        <h3 className="font-bold text-slate-800">Vendors</h3>
                        <span className="text-sm text-slate-500 font-semibold">
                            Total: {count}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
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
                            onClick={handleAddVendor}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500"
                        >
                            <FaPlus className="text-xs" />
                            Add Vendor
                        </button>
                    </div>
                </div>

                {/* SEARCH & FILTER */}
                {/* SEARCH & FILTER */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex flex-wrap gap-4 items-end">

                        {/* Search Vendor */}
                        <div className="flex-1 min-w-55">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Search Vendor
                            </label>
                            <input
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search by name, code, phone"
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
                                <th className="px-6 py-4 text-[13px]">Vendor Name</th>
                                <th className="px-6 py-4 text-[13px]">Contact Person</th>
                                <th className="px-6 py-4 text-[13px]">Phone</th>
                                <th className="px-6 py-4 text-[13px]">Email</th>
                                <th className="px-6 py-4 text-[13px]">GST</th>
                                <th className="px-6 py-4 text-[13px] text-center">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-6 text-center text-slate-500">
                                        Loading vendors...
                                    </td>
                                </tr>
                            )}

                            {!loading && vendors.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-6 text-center text-slate-500">
                                        No vendors found
                                    </td>
                                </tr>
                            )}

                            {vendors.map((v) => (
                                <tr key={v.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 font-mono text-blue-600 font-semibold">
                                        {v.vendor_code}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-800">
                                        {v.vendor_name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {v.contact_person || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {v.phone || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {v.email || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {v.gst_number || "-"}
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleView(v)}
                                                className="text-slate-500 hover:text-blue-600"
                                                title="View"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(v)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Edit"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(v)}
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
                        onClick={() => previous && fetchVendors(previous)}
                        disabled={!previous}
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40"
                    >
                        ← Previous
                    </button>

                    <button
                        onClick={() => next && fetchVendors(next)}
                        disabled={!next}
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* MODAL */}
            <VendorModal
                key={editVendor ? editVendor.id : "add"}
                open={openModal}
                onClose={() => setOpenModal(false)}
                mode={editVendor ? "edit" : "add"}
                vendor={editVendor}
                onSuccess={handleVendorSuccess}
            />

            <VendorViewModal
                open={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                data={viewVendor}
                loading={viewLoading}
            />

            {/* CONFIRM DELETE */}
            <ConfirmDialog
                open={showConfirm}
                title="Delete Vendor"
                message={`Are you sure you want to delete "${selectedVendor?.vendor_name}"?`}
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
            {/* REPORT MODAL */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FaFileExcel className="text-emerald-600" /> Performance Report
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
                                    <div className="pl-8 pt-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-2 gap-3">
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
                                    </div>
                                )}

                                {/* Specific Vendor Option */}
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="vendor"
                                        checked={reportType === "vendor"}
                                        onChange={(e) => {
                                            setReportType(e.target.value);
                                            // Ideally fetch all vendors here if list is incomplete
                                            if (allVendors.length === 0) {
                                                getVendors({ isActive: true }).then(res => {
                                                    setAllVendors(res.results || []);
                                                });
                                            }
                                        }}
                                        className="text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Specific Vendor</span>
                                </label>
                                {reportType === "vendor" && (
                                    <div className="pl-8 pt-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Vendor</label>
                                            <select
                                                value={selectedVendorId}
                                                onChange={(e) => setSelectedVendorId(e.target.value)}
                                                className="input w-full text-xs"
                                            >
                                                <option value="">-- Choose Vendor --</option>
                                                {allVendors.map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.vendor_name} ({v.vendor_code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
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
}
