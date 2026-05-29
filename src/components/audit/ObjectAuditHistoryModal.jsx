import React, { useEffect, useState } from "react";
import { FaTimes, FaHistory, FaPlusCircle, FaEdit, FaTimesCircle, FaExchangeAlt, FaChevronDown, FaChevronUp, FaUser, FaClock } from "react-icons/fa";
import { getObjectAuditLogs } from "../../services/auditLogService";
import AlertToast from "../ui/AlertToast";

export default function ObjectAuditHistoryModal({ open, onClose, modelName, objectId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedNodeId, setExpandedNodeId] = useState(null);
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });

    useEffect(() => {
        const fetchHistory = async () => {
            if (!objectId || !modelName) return;
            setLoading(true);
            try {
                const res = await getObjectAuditLogs(modelName, objectId);
                const data = res.data || res || [];
                // Sort by timestamp descending to show latest changes first
                const sorted = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setHistory(sorted);
                
                // Expand the latest log by default if any
                if (sorted.length > 0) {
                    setExpandedNodeId(sorted[0].id);
                }
            } catch (err) {
                console.error("Failed to load object revision history:", err);
                setToast({
                    open: true,
                    type: "error",
                    message: "Failed to fetch object audit history from the server"
                });
            } finally {
                setLoading(false);
            }
        };

        if (open && objectId) {
            fetchHistory();
        }
    }, [open, objectId, modelName]);

    if (!open) return null;

    const formatTimestamp = (isoString) => {
        if (!isoString) return "-";
        const date = new Date(isoString);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    };

    const getNodeStyle = (action) => {
        switch (action?.toUpperCase()) {
            case "CREATE":
                return {
                    icon: <FaPlusCircle className="text-emerald-500 text-lg" />,
                    bg: "bg-emerald-50 border-emerald-100",
                    badge: "bg-emerald-50 text-emerald-700 border-emerald-200"
                };
            case "UPDATE":
                return {
                    icon: <FaEdit className="text-amber-500 text-lg" />,
                    bg: "bg-amber-50 border-amber-100",
                    badge: "bg-amber-50 text-amber-700 border-amber-200"
                };
            case "DELETE":
            case "CANCEL":
                return {
                    icon: <FaTimesCircle className="text-rose-500 text-lg" />,
                    bg: "bg-rose-50 border-rose-100",
                    badge: "bg-rose-50 text-rose-700 border-rose-200"
                };
            default:
                return {
                    icon: <FaHistory className="text-slate-500 text-lg" />,
                    bg: "bg-slate-50 border-slate-100",
                    badge: "bg-slate-50 text-slate-700 border-slate-200"
                };
        }
    };

    const toggleNode = (nodeId) => {
        setExpandedNodeId(expandedNodeId === nodeId ? null : nodeId);
    };

    const formatValue = (val) => {
        if (val === null || val === undefined) return "(empty)";
        if (typeof val === "boolean") return val ? "true" : "false";
        if (typeof val === "object") return JSON.stringify(val, null, 2);
        return String(val);
    };

    // Render node details (diff or initial state)
    const renderNodeDetails = (log) => {
        const changes = log.changes || {};
        const action = log.action?.toUpperCase();

        if (action === "UPDATE" && changes.old && changes.new) {
            const oldData = changes.old || {};
            const newData = changes.new || {};
            const keys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)])).sort();
            const changedKeys = keys.filter(k => formatValue(oldData[k]) !== formatValue(newData[k]));

            if (changedKeys.length === 0) {
                return <p className="text-xs text-slate-400 italic">No value modifications recorded.</p>;
            }

            return (
                <div className="space-y-2.5 mt-2">
                    {changedKeys.map((key) => (
                        <div key={key} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden text-xs">
                            <div className="bg-slate-100/50 px-3 py-1.5 border-b border-slate-200 flex justify-between font-bold text-slate-650">
                                <span>{key.replace(/_/g, " ").toUpperCase()}</span>
                                <span className="text-[10px] font-mono text-slate-400">{key}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-9 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-3 items-stretch gap-2.5 md:gap-0">
                                <div className="md:col-span-4 pr-0 md:pr-3">
                                    <span className="block text-[9px] font-bold text-rose-500 uppercase mb-1">Old Value</span>
                                    <span className="font-mono text-slate-500 break-all line-through decoration-rose-350/50 block">
                                        {formatValue(oldData[key])}
                                    </span>
                                </div>
                                <div className="md:col-span-1 flex items-center justify-center text-slate-350">
                                    <FaExchangeAlt className="rotate-90 md:rotate-0 text-[10px]" />
                                </div>
                                <div className="md:col-span-4 pl-0 md:pl-3 font-semibold">
                                    <span className="block text-[9px] font-bold text-emerald-600 uppercase mb-1">New Value</span>
                                    <span className="font-mono text-emerald-700 break-all block">
                                        {formatValue(newData[key])}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        } else {
            // Flat object changes (CREATE, DELETE, CANCEL, custom action)
            const keys = Object.keys(changes).filter(k => k !== "old" && k !== "new").sort();
            if (keys.length === 0) {
                return <p className="text-xs text-slate-400 italic">No details recorded.</p>;
            }

            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {keys.map((key) => (
                        <div key={key} className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-xs flex flex-col justify-between">
                            <div>
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                                    {key.replace(/_/g, " ").toUpperCase()}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 block mb-1">{key}</span>
                            </div>
                            <span className="font-mono font-bold text-slate-800 break-all p-1.5 rounded-lg bg-white border border-slate-100 block">
                                {formatValue(changes[key])}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                
                {/* HEADER */}
                <div className="px-6 py-4.5 border-b border-slate-150 flex items-center justify-between bg-white shrink-0 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg shadow-sm">
                            <FaHistory className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-[17px]">
                                Object Audit Trail History
                            </h3>
                            <span className="text-xs text-slate-500 font-semibold mt-0.5">
                                Component: {modelName} | Object Reference: {objectId}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-750 hover:bg-slate-100 transition duration-150"
                    >
                        <FaTimes className="text-base" />
                    </button>
                </div>

                {/* TIMELINE CONTENT BODY */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
                            <span className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-wider">Loading history timeline...</span>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 font-semibold max-w-md mx-auto space-y-2">
                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mx-auto text-slate-400">
                                <FaHistory />
                            </div>
                            <p>No audit trail recorded</p>
                            <p className="text-xs text-slate-450 font-medium leading-relaxed">No revisions or data changes have been captured for this specific entry yet.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 pl-6 ml-4 space-y-6">
                            {history.map((log, index) => {
                                const isExpanded = expandedNodeId === log.id;
                                const style = getNodeStyle(log.action);

                                return (
                                    <div key={log.id} className="relative animate-in fade-in duration-200">
                                        
                                        {/* Timeline Node dot */}
                                        <div className={`absolute -left-[35px] top-0.5 h-7 w-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-white z-10`}>
                                            {style.icon}
                                        </div>

                                        {/* Timeline Node Card */}
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition duration-150">
                                            
                                            {/* Summary Header */}
                                            <div 
                                                onClick={() => toggleNode(log.id)}
                                                className="px-4 py-3 bg-white flex items-center justify-between cursor-pointer hover:bg-slate-50/50 select-none transition"
                                            >
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${style.badge}`}>
                                                        {log.action}
                                                    </span>
                                                    
                                                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                        <FaUser className="text-slate-450 text-[10px]" />
                                                        {log.user_name || "System"}
                                                    </span>

                                                    <span className="text-[11px] text-slate-450 font-medium flex items-center gap-1.5">
                                                        <FaClock className="text-slate-400 text-[10px]" />
                                                        {formatTimestamp(log.timestamp)}
                                                    </span>
                                                </div>

                                                <div className="text-slate-400">
                                                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                                </div>
                                            </div>

                                            {/* Details Section */}
                                            {isExpanded && (
                                                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/30">
                                                    {renderNodeDetails(log)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="px-6 py-3 border-t border-slate-150 bg-slate-50 flex items-center justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition duration-150 text-xs shadow-sm"
                    >
                        Close History
                    </button>
                </div>
            </div>

            {/* ALERT TOAST */}
            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />
        </div>
    );
}
