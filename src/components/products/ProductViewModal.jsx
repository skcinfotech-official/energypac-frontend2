import { useRef, useEffect } from "react";
import { FaTimes, FaBox, FaInfoCircle, FaRuler, FaTags, FaClock, FaCheckCircle } from "react-icons/fa";

const ProductViewModal = ({ open, onClose, data, loading }) => {
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
                className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                            <FaBox className="text-xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Product Details</h3>
                            {data && <p className="text-sm text-slate-500 font-mono">{data.item_code}</p>}
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
                                    label="Item Name"
                                    value={data.item_name}
                                    icon={<FaTags className="text-slate-400" />}
                                    fullWidth
                                />
                                <DetailItem
                                    label="HSN Code"
                                    value={data.hsn_code}
                                />
                                <DetailItem
                                    label="Unit"
                                    value={data.unit}
                                    icon={<FaRuler className="text-slate-400" />}
                                />
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <FaInfoCircle /> Stock Information
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500">Current Stock</p>
                                        <p className={`font-bold ${Number(data.current_stock) > 0 ? 'text-slate-800' : 'text-red-600'}`}>
                                            {data.current_stock}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Reorder Level</p>
                                        <p className="font-bold text-slate-800">{data.reorder_level}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Rate</p>
                                        <p className="font-bold text-blue-600">
                                            ₹ {parseFloat(data.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</h5>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 text-sm leading-relaxed">
                                    {data.description || <span className="text-slate-400 italic">No description provided</span>}
                                </div>
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
                                    <span>Created: {new Date(data.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="py-12 text-center text-slate-500">
                            Failed to load product details.
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

export default ProductViewModal;
