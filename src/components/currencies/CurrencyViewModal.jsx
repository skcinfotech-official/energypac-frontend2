import { useRef, useEffect } from "react";
import { FaTimes, FaGlobe, FaTag, FaClock, FaCheckCircle } from "react-icons/fa";

const CurrencyViewModal = ({ open, onClose, data, loading }) => {
    const modalRef = useRef(null);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };

        if (open) {
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    // Close on click outside
    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                            <FaGlobe className="text-xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Currency Details</h3>
                            {data && <p className="text-sm text-slate-500 font-mono">{data.code}</p>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-medium">Loading details...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-6">

                            {/* BASIC INFO */}
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem
                                    label="Currency Code"
                                    value={data.code}
                                    icon={<FaTag className="text-slate-400" />}
                                />
                                <DetailItem
                                    label="Symbol"
                                    value={data.symbol}
                                    icon={<span className="text-slate-400 font-bold font-mono">{data.symbol}</span>}
                                />
                                <DetailItem
                                    label="Currency Name"
                                    value={data.name}
                                    fullWidth
                                />
                            </div>

                            {/* META DATA */}
                            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                                    <span className={`w-2 h-2 rounded-full ${data.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span className="text-xs font-semibold text-slate-600">
                                        {data.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <FaClock />
                                    <span>Created: {new Date(data.created_at || data.created_time).toLocaleDateString()}</span>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="py-12 text-center text-slate-500">
                            Failed to load currency details.
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ label, value, icon, fullWidth }) => (
    <div className={`flex flex-col ${fullWidth ? 'col-span-2' : ''}`}>
        <span className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
            {icon} {label}
        </span>
        <span className="text-sm font-medium text-slate-800 break-words">
            {value || "-"}
        </span>
    </div>
);

export default CurrencyViewModal;
