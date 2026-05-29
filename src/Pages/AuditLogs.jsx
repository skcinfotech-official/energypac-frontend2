import React, { useEffect, useState } from "react";
import { FaHistory, FaSearch, FaEye, FaCalendarAlt, FaTimes } from "react-icons/fa";
import { getAuditLogs } from "../services/auditLogService";
import AuditLogDetailModal from "../components/audit/AuditLogDetailModal";
import AlertToast from "../components/ui/AlertToast";

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [page, setPage] = useState(1);
    
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [actionFilter, setActionFilter] = useState(""); // "" | "CREATE" | "UPDATE" | "DELETE"
    const [modelFilter, setModelFilter] = useState(""); // text filter for Model name
    
    // Detail Modal State
    const [selectedLog, setSelectedLog] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    
    // Alert Toast
    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
    });

    const fetchLogs = async (pageNum = 1, useUrl = null) => {
        try {
            setLoading(true);
            const res = await getAuditLogs({
                url: useUrl,
                search: searchText,
                action: actionFilter,
                modelName: modelFilter,
                page: pageNum
            });

            const results = res.data?.results || res.results || res.data || [];
            const totalCount = res.data?.count ?? res.count ?? results.length;
            const nextUrl = res.data?.next ?? res.next ?? null;
            const prevUrl = res.data?.previous ?? res.previous ?? null;

            setLogs(results);
            setCount(totalCount);
            setNext(nextUrl);
            setPrevious(prevUrl);
            setPage(pageNum);
        } catch (err) {
            console.error("Failed to load audit logs:", err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to fetch audit logs from the server",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchText, actionFilter, modelFilter]);

    const handlePageChange = (newPageUrl, direction) => {
        if (!newPageUrl) return;
        const nextPageNum = direction === "next" ? page + 1 : page - 1;
        fetchLogs(nextPageNum, newPageUrl);
    };

    const handleClearFilters = () => {
        setSearchText("");
        setActionFilter("");
        setModelFilter("");
    };

    const formatTimestamp = (isoString) => {
        if (!isoString) return "-";
        const date = new Date(isoString);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-[16px]">
                            <FaHistory className="text-blue-600" />
                            System Audit Logs
                        </h3>
                        <span className="text-[12px] text-slate-400 font-semibold block mt-0.5">
                            Total Records: {count}
                        </span>
                    </div>

                    {(searchText || actionFilter || modelFilter) && (
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg text-xs font-semibold transition duration-150"
                        >
                            <FaTimes className="text-[10px]" />
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="w-full">
                            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                                <FaSearch className="text-slate-450 text-[10px]" /> Search Log Entry
                            </label>
                            <input
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search performer, object ref..."
                                className="input py-1.5 text-sm bg-white border-slate-200 rounded-lg w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                            />
                        </div>

                        <div className="w-full">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Component / Model
                            </label>
                            <select
                                value={modelFilter}
                                onChange={(e) => setModelFilter(e.target.value)}
                                className="input py-1.5 text-sm bg-white border-slate-200 rounded-lg w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
                            >
                                <option value="">All Components</option>
                                <option value="PurchaseOrder">Purchase Order</option>
                                <option value="TransportEntry">Transport Entry</option>
                                <option value="Requisition">Requisition</option>
                                <option value="Item">Item</option>
                                <option value="Vendor">Vendor</option>
                                <option value="Currency">Currency</option>
                                <option value="User">User</option>
                            </select>
                        </div>

                        <div className="w-full">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Action Type
                            </label>
                            <select
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                                className="input py-1.5 text-sm bg-white border-slate-200 rounded-lg w-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold"
                            >
                                <option value="">All Actions</option>
                                <option value="CREATE">CREATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="odd:bg-slate-100 even:bg-white hover:bg-slate-200 text-slate-600 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Performer</th>
                                <th className="px-6 py-4 text-center">Action</th>
                                <th className="px-6 py-4">Component</th>
                                <th className="px-6 py-4">Affected Object</th>
                                <th className="px-6 py-4 text-center">Changes</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 bg-white">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
                                            <span className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-wider">Loading system audit trail...</span>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && logs.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 bg-white">
                                        No audit logs found for the current filter settings.
                                    </td>
                                </tr>
                            )}

                            {!loading && logs.map((log) => (
                                <tr 
                                    key={log.id} 
                                    className="odd:bg-slate-100 even:bg-white hover:bg-slate-200 transition-colors"
                                >
                                    <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <FaCalendarAlt className="text-slate-400 text-[11px]" />
                                            <span>{formatTimestamp(log.timestamp)}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 font-medium text-slate-800 text-sm whitespace-nowrap">
                                        <div>
                                            <span className="block font-bold text-slate-800">
                                                {log.user_name || "System"}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400 block max-w-28 truncate" title={log.user}>
                                                {log.user || "Auto Job"}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                            log.action?.toUpperCase() === "CREATE" ? "bg-green-100 text-green-700" :
                                            log.action?.toUpperCase() === "UPDATE" ? "bg-yellow-100 text-yellow-700" :
                                            "bg-red-100 text-red-750"
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-slate-700 text-sm font-semibold whitespace-nowrap">
                                        {log.model_name}
                                    </td>

                                    <td className="px-6 py-4 text-slate-800 text-sm max-w-sm">
                                        <div className="truncate">
                                            <span className="font-semibold block truncate" title={log.object_repr}>
                                                {log.object_repr || "-"}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400 block truncate" title={log.object_id}>
                                                Ref ID: {log.object_id}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        <button
                                            onClick={() => {
                                                setSelectedLog(log);
                                                setModalOpen(true);
                                            }}
                                            className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                                        >
                                            <div className="flex items-center gap-1">
                                                <FaEye />
                                                View Diff
                                            </div>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && count > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
                        <button
                            onClick={() => previous && handlePageChange(previous, "previous")}
                            disabled={!previous}
                            className="text-xs font-bold text-slate-500 hover:text-blue-650 disabled:opacity-40 transition"
                        >
                            ← Previous
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 bg-slate-150 px-2.5 py-1 rounded-full">
                                Page {page}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                                Showing {logs.length} of {count} records
                            </span>
                        </div>

                        <button
                            onClick={() => next && handlePageChange(next, "next")}
                            disabled={!next}
                            className="text-xs font-bold text-slate-500 hover:text-blue-650 disabled:opacity-40 transition"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>

            <AuditLogDetailModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedLog(null);
                }}
                log={selectedLog}
            />

            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />
        </div>
    );
}
