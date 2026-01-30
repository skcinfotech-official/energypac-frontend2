import { useRef, useEffect, useState } from "react";
import { FaTimes, FaFileInvoice, FaBuilding, FaBoxOpen } from "react-icons/fa";
import { markItemPurchased } from "../../services/purchaseOrderService";
import AlertToast from "../ui/AlertToast";
import ConfirmDialog from "../ui/ConfirmDialog";

const PurchaseOrderModal = ({ open, onClose, data }) => {
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

    const [items, setItems] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [processing, setProcessing] = useState(false);

    // UI State
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (data && data.items) {
            setItems(data.items);
        }
    }, [data]);

    // Close on click outside
    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };

    const handleCheckboxChange = (itemId) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedIds(newSelected);
    };

    const handleProceed = () => {
        if (selectedIds.size === 0) {
            setToast({ open: true, type: "error", message: "Select items to mark as received" });
            return;
        }
        setShowConfirm(true);
    };

    const processBatchPurchase = async () => {
        setProcessing(true);
        let successCount = 0;
        let errors = 0;

        // Clone items to update locally
        const newItems = [...items];

        for (const itemId of selectedIds) {
            try {
                // Call API for each selected item as per previous instruction context
                await markItemPurchased(data.id, itemId);

                // Update local status
                const idx = newItems.findIndex(i => i.id === itemId);
                if (idx !== -1) {
                    newItems[idx] = { ...newItems[idx], is_received: true };
                }
                successCount++;
            } catch (err) {
                console.error(err);
                errors++;
            }
        }

        setItems(newItems);
        setSelectedIds(new Set()); // Clear selections
        setProcessing(false);
        setShowConfirm(false);

        if (errors === 0) {
            setToast({ open: true, type: "success", message: `${successCount} items marked as purchased successfully.` });
        } else {
            setToast({ open: true, type: "warning", message: `Marked ${successCount} items. Failed: ${errors}` });
        }
    };

    if (!open || !data) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                            <FaFileInvoice className="text-xl" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Purchase Order Details</h3>
                            <p className="text-sm text-slate-500 font-mono">{data.po_number}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* INFO GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                                <FaBuilding className="text-slate-400" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</span>
                            </div>
                            <div className="font-semibold text-slate-800">{data.vendor_name}</div>
                            {/* <div className="text-sm text-slate-500 font-mono mt-1">{data.vendor}</div> */}
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                                <FaBoxOpen className="text-slate-400" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Requisition</span>
                            </div>
                            <div className="font-semibold text-slate-800">{data.requisition_number}</div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                ${data.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    data.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                        'bg-slate-100 text-slate-800'}`}>
                                {data.status}
                            </span>
                            <div className="text-sm text-slate-500 mt-2">
                                Created: {new Date(data.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* ITEMS TABLE */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Order Items ({data.items?.length || 0})</h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Product</th>
                                        <th className="px-4 py-3 text-right">HSN</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-right">Rate</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3 text-right">Purchase</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-800">{item.product_name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{item.product_code}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {item.hsn_code}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {item.quantity} <span className="text-xs text-slate-400">{item.unit}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">
                                                ₹ {parseFloat(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800 font-mono">
                                                ₹ {parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <input
                                                    type="checkbox"
                                                    disabled={item.is_received || processing}
                                                    checked={item.is_received || selectedIds.has(item.id)}
                                                    onChange={() => !item.is_received && handleCheckboxChange(item.id)}
                                                    className={`w-4 h-4 rounded focus:ring-blue-500 cursor-pointer 
                                                        ${item.is_received
                                                            ? "text-green-600 bg-green-100 border-green-300 cursor-not-allowed"
                                                            : "text-blue-600 bg-gray-100 border-gray-300"}`}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data.items || data.items.length === 0) && (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                                                No items in this order.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
                                    <tr>
                                        <td colSpan="3" className="px-4 py-3 text-right">Total Amount:</td>
                                        <td className="px-4 py-3 text-right text-lg text-blue-600">
                                            {parseFloat(data.total_amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 justify-end flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleProceed}
                        disabled={processing || selectedIds.size === 0}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {processing ? "Processing..." : "Proceed"}
                    </button>
                </div>
            </div>

            <ConfirmDialog
                open={showConfirm}
                title="Mark Items as Purchased"
                message={`Are you sure you want to mark ${selectedIds.size} selected items as purchased/received?`}
                confirmText="Confirm Purchase"
                loading={processing}
                onCancel={() => setShowConfirm(false)}
                onConfirm={processBatchPurchase}
            />

            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />
        </div>
    );
};

export default PurchaseOrderModal;
