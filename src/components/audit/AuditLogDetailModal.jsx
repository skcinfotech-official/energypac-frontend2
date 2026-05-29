import React, { useState } from "react";
import { FaTimes, FaUser, FaDatabase, FaClock, FaExchangeAlt, FaPlusCircle, FaEdit, FaTrashAlt, FaChevronDown, FaChevronUp, FaInfoCircle } from "react-icons/fa";

export default function AuditLogDetailModal({ open, onClose, log }) {
    const [showUnchanged, setShowUnchanged] = useState(false);

    if (!open || !log) return null;

    // Helper to format timestamps
    const formatTimestamp = (isoString) => {
        if (!isoString) return "-";
        const date = new Date(isoString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    // Color code actions
    const getActionBadgeClass = (action) => {
        switch (action?.toUpperCase()) {
            case "CREATE":
                return "bg-emerald-50 text-emerald-700 border-emerald-250";
            case "UPDATE":
                return "bg-amber-50 text-amber-700 border-amber-250";
            case "DELETE":
                return "bg-rose-50 text-rose-700 border-rose-250";
            default:
                return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

    const getActionIcon = (action) => {
        switch (action?.toUpperCase()) {
            case "CREATE":
                return <FaPlusCircle className="text-emerald-550" />;
            case "UPDATE":
                return <FaEdit className="text-amber-550" />;
            case "DELETE":
                return <FaTrashAlt className="text-rose-550" />;
            default:
                return <FaDatabase className="text-slate-550" />;
        }
    };

    // Helper to convert object values to string safely
    const formatValue = (val) => {
        if (val === null || val === undefined) return "(empty)";
        if (typeof val === "boolean") return val ? "true" : "false";
        if (typeof val === "object") return JSON.stringify(val, null, 2);
        const str = String(val).trim();
        return str === "" ? "(empty)" : str;
    };

    // Parse changes and segment them
    const renderChanges = () => {
        const action = log.action?.toUpperCase();
        const changes = log.changes || {};

        if (action === "UPDATE") {
            const oldData = changes.old || {};
            const newData = changes.new || {};

            // Get all unique keys
            const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)])).sort();

            // Segment into changed and unchanged
            const changedKeys = [];
            const unchangedKeys = [];

            allKeys.forEach((key) => {
                const oldVal = formatValue(oldData[key]);
                const newVal = formatValue(newData[key]);
                if (oldVal !== newVal) {
                    changedKeys.push(key);
                } else {
                    unchangedKeys.push(key);
                }
            });

            if (allKeys.length === 0) {
                return (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No detailed changes were registered for this update.
                    </div>
                );
            }

            return (
                <div className="space-y-6">
                    {/* CHANGED FIELDS */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <FaExchangeAlt className="text-blue-550" /> Modified Attributes ({changedKeys.length})
                            </h4>
                            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                <FaInfoCircle /> Showing only changes
                            </span>
                        </div>

                        {changedKeys.length === 0 ? (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500 text-center">
                                All attribute values remained identical during this revision.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {changedKeys.map((key) => {
                                    const oldVal = oldData[key];
                                    const newVal = newData[key];

                                    return (
                                        <div 
                                            key={key} 
                                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition duration-200"
                                        >
                                            {/* Header of attribute card */}
                                            <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-700 tracking-wide font-sans">
                                                    {key.replace(/_/g, " ").toUpperCase()}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400">{key}</span>
                                            </div>

                                            {/* Comparison content */}
                                            <div className="grid grid-cols-1 md:grid-cols-11 items-stretch divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                                {/* Old Value */}
                                                <div className="p-4 md:col-span-5 bg-rose-50/10">
                                                    <span className="block text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1.5">Before Changes</span>
                                                    <div className="font-mono text-xs bg-rose-50/40 text-rose-800 p-3 rounded-xl border border-rose-100/50 break-all min-h-[50px] line-through decoration-rose-350/50">
                                                        {formatValue(oldVal)}
                                                    </div>
                                                </div>

                                                {/* Arrow Indicator */}
                                                <div className="py-2 md:py-0 md:col-span-1 flex items-center justify-center bg-slate-50/20">
                                                    <div className="h-8 w-8 rounded-full bg-white border border-slate-150 shadow-sm flex items-center justify-center text-slate-400 rotate-90 md:rotate-0">
                                                        <FaExchangeAlt className="text-xs text-blue-500" />
                                                    </div>
                                                </div>

                                                {/* New Value */}
                                                <div className="p-4 md:col-span-5 bg-emerald-50/10">
                                                    <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">After Changes</span>
                                                    <div className="font-mono text-xs bg-emerald-55 text-emerald-800 p-3 rounded-xl border border-emerald-200/50 break-all font-bold min-h-[50px]">
                                                        {formatValue(newVal)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* UNCHANGED FIELDS ACCORDION */}
                    {unchangedKeys.length > 0 && (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setShowUnchanged(!showUnchanged)}
                                className="w-full px-5 py-3.5 bg-slate-50 flex items-center justify-between text-left hover:bg-slate-100 transition duration-200"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-extrabold text-slate-650 uppercase tracking-wider">
                                        Unmodified Attributes ({unchangedKeys.length})
                                    </span>
                                </div>
                                <div className="text-slate-400">
                                    {showUnchanged ? <FaChevronUp /> : <FaChevronDown />}
                                </div>
                            </button>

                            {showUnchanged && (
                                <div className="p-4 bg-white border-t border-slate-150 overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-bold tracking-widest">
                                                <th className="py-2 font-semibold">Attribute Name</th>
                                                <th className="py-2 font-semibold font-mono">Key</th>
                                                <th className="py-2 font-semibold">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 font-mono text-slate-600">
                                            {unchangedKeys.map((key) => (
                                                <tr key={key} className="hover:bg-slate-50/50">
                                                    <td className="py-2.5 font-sans font-medium text-slate-700">
                                                        {key.replace(/_/g, " ").toUpperCase()}
                                                    </td>
                                                    <td className="py-2.5 text-slate-400 text-[11px]">{key}</td>
                                                    <td className="py-2.5 break-all max-w-md font-semibold text-slate-500">
                                                        {formatValue(oldData[key])}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        } else {
            // Flat object changes (CREATE, DELETE, etc.)
            const keys = Object.keys(changes).sort();

            if (keys.length === 0) {
                return (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No property details were recorded.
                    </div>
                );
            }

            return (
                <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-505 flex items-center gap-2">
                        <FaDatabase className="text-blue-500" /> Object Properties ({keys.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {keys.map((key) => (
                            <div 
                                key={key} 
                                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-350 transition duration-200 shadow-sm flex flex-col justify-between"
                            >
                                <div className="px-4 py-2 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-700 font-sans tracking-wide">
                                        {key.replace(/_/g, " ").toUpperCase()}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">{key}</span>
                                </div>
                                <div className="p-3.5">
                                    <div className={`font-mono text-xs p-3 rounded-xl border border-slate-100 break-all font-bold ${action === "CREATE" ? "bg-emerald-55 text-emerald-800 border-emerald-100" : "bg-rose-50/30 text-rose-800 border-rose-100/50"}`}>
                                        {formatValue(changes[key])}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-4xl bg-white rounded-[26px] border border-slate-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300">
                
                {/* MODAL HEADER */}
                <div className="px-6 py-5 border-b border-slate-150 flex items-center justify-between bg-white shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-150 shadow-sm flex items-center justify-center text-lg">
                            {getActionIcon(log.action)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h3 className="font-extrabold text-slate-800 text-[18px]">
                                    Audit Log Detail
                                </h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${getActionBadgeClass(log.action)}`}>
                                    {log.action}
                                </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">ID: {log.id}</span>
                        </div>
                    </div>
                    
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition duration-200"
                    >
                        <FaTimes className="text-base" />
                    </button>
                </div>

                {/* MODAL BODY */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                    
                    {/* METADATA CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                        {/* User Card */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-200 transition duration-200 flex items-start gap-3">
                            <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <FaUser className="text-xs" />
                            </div>
                            <div className="truncate">
                                <span className="block text-[9px] font-extrabold text-blue-500 uppercase tracking-widest mb-0.5">Performer</span>
                                <span className="font-bold text-slate-850 text-[13px] block truncate" title={log.user_name}>
                                    {log.user_name || "Unknown User"}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 block truncate">{log.user || "No UUID"}</span>
                            </div>
                        </div>

                        {/* Model / Module Card */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-indigo-200 transition duration-200 flex items-start gap-3">
                            <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <FaDatabase className="text-xs" />
                            </div>
                            <div className="truncate">
                                <span className="block text-[9px] font-extrabold text-indigo-500 uppercase tracking-widest mb-0.5">Data Component</span>
                                <span className="font-bold text-slate-850 text-[13px] block truncate" title={log.model_name}>
                                    {log.model_name}
                                </span>
                                <span className="text-[10px] font-mono text-indigo-400 block truncate">Model Entity</span>
                            </div>
                        </div>

                        {/* Target Object Representation */}
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-purple-200 transition duration-200 flex items-start gap-3 md:col-span-2">
                            <div className="h-8 w-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                <FaDatabase className="text-xs" />
                            </div>
                            <div className="truncate w-full">
                                <span className="block text-[9px] font-extrabold text-purple-500 uppercase tracking-widest mb-0.5">Affected Target</span>
                                <span className="font-bold text-slate-850 text-[13px] block truncate" title={log.object_repr}>
                                    {log.object_repr || "-"}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 block truncate">Obj ID: {log.object_id}</span>
                            </div>
                        </div>
                    </div>

                    {/* TIMESTAMP AND SUBTITLE */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 px-1 border-b border-slate-150 pb-3 shrink-0 gap-2">
                        <span className="font-semibold flex items-center gap-1.5">
                            <FaClock className="text-slate-400" />
                            Registered at {formatTimestamp(log.timestamp)}
                        </span>
                        <span className="font-mono text-slate-400">UTC Timestamp: {log.timestamp}</span>
                    </div>

                    {/* DYNAMIC CHANGES VIEW */}
                    <div>
                        {renderChanges()}
                    </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="px-6 py-4 border-t border-slate-150 bg-slate-50 flex items-center justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-850 text-white font-bold rounded-2xl hover:bg-slate-700 transition duration-200 text-xs shadow-md"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
