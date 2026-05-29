import { useRef, useEffect, useState } from "react";
import { FaTimes, FaFileInvoice, FaBuilding, FaBoxOpen, FaCheckCircle, FaFileAlt, FaPrint, FaEdit, FaHistory } from "react-icons/fa";
import { pdf } from "@react-pdf/renderer";
import PurchaseOrderPDF from "./PurchaseOrderPDF";
import { markItemPurchased, getPurchaseOrder, lockPurchaseOrder } from "../../services/purchaseOrderService";
import AlertToast from "../ui/AlertToast";
import ConfirmDialog from "../ui/ConfirmDialog";
import EditPurchaseOrderModal from "./EditPurchaseOrderModal";
import ObjectAuditHistoryModal from "../audit/ObjectAuditHistoryModal";

const getCurrencySymbol = (currencyCode) => {
    switch (currencyCode?.toString().toUpperCase()) {
        case "USD": return "$";
        case "INR": return "₹";
        case "EUR": return "€";
        case "GBP": return "£";
        case "JPY": return "¥";
        case "CAD": return "C$";
        case "AUD": return "A$";
        default: return currencyCode || "₹";
    }
};

const formatAmount = (amount, currencyCode) => {
    const num = Number(amount) || 0;
    const locale = currencyCode?.toString().toUpperCase() === "INR" ? "en-IN" : "en-US";
    return num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const PurchaseOrderModal = ({ open, onClose, data, onShowAlert, onUpdate }) => {
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
    const [generatingPdf, setGeneratingPdf] = useState(false);      
    const [editOpen, setEditOpen] = useState(false);
    const [auditHistoryOpen, setAuditHistoryOpen] = useState(false);

    // UI State
    const [showConfirm, setShowConfirm] = useState(false);

    // ... imports

    const [poData, setPoData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (data && data.id) {
                try {
                    const fullData = await getPurchaseOrder(data.id);
                    setPoData(fullData);
                    setItems(fullData.items || []);
                } catch (error) {
                    console.error("Failed to fetch PO details", error);
                    // Fallback
                    setPoData(data);
                    setItems(data.items || []);
                }
            } else if (data) {
                setPoData(data);
                setItems(data.items || []);
            }
        };

        if (open) {
            fetchData();
        }
    }, [data, open]);

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
            onShowAlert("error", "Select items to mark as received");
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
            onShowAlert("success", `${successCount} items marked as purchased successfully.`);
            if (onUpdate) onUpdate();
        } else {
            onShowAlert("warning", `Marked ${successCount} items. Failed: ${errors}`);
            if (successCount > 0 && onUpdate) onUpdate();
        }
    };

    const handlePrint = async () => {
        if (!poData) return;
        setGeneratingPdf(true);
        try {
            const blob = await pdf(<PurchaseOrderPDF details={poData} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error generating PDF:", error);
            if (onShowAlert) onShowAlert("error", "Failed to generate PDF");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const handleEditPO = async () => {
        setProcessing(true);
        try {
            // Attempt to acquire edit lock
            await lockPurchaseOrder(poData.id);
            // Lock succeeded! Open edit modal
            setEditOpen(true);
        } catch (err) {
            console.error("Failed to lock PO in detail modal:", err);
            const msg = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.message || "This Purchase Order is currently locked by another user.";
            if (onShowAlert) onShowAlert("error", msg);
        } finally {
            setProcessing(false);
        }
    };

    const refreshPOData = async () => {
        try {
            const fullData = await getPurchaseOrder(poData.id);
            setPoData(fullData);
            setItems(fullData.items || []);
            if (onUpdate) onUpdate(); // Update list in parent too
        } catch (err) {
            console.error("Failed to refresh PO data:", err);
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
                            <p className="text-sm text-slate-500 font-mono">{poData?.po_number || data?.po_number}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {poData && poData.status !== 'CANCELLED' && (
                            <button
                                onClick={handleEditPO}
                                disabled={processing}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                                title="Edit Purchase Order"
                            >
                                <FaEdit size={14} />
                                <span>Edit PO</span>
                            </button>
                        )}
                        <button
                            onClick={handlePrint}
                            disabled={generatingPdf}
                            className="flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:text-blue-500 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                            title="Print / Preview PDF"
                        >
                            {generatingPdf ? <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div> : <FaPrint size={20} />}

                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {(!poData) ? (
                        <div className="text-center py-12 text-slate-500 animate-pulse">Loading details...</div>
                    ) : (
                        <>
                            {/* GENERAL DETAILS */}
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">
                                    General PO & Project Info
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project Name</span>
                                        <span className="text-sm font-bold text-slate-800">{poData.project_name || "N/A"}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject</span>
                                        <span className="text-sm font-semibold text-slate-800">{poData.subject || "N/A"}</span>
                                    </div>
                                    <div className="space-y-1 flex flex-col justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requisition Number</span>
                                            <span className="text-sm font-bold text-slate-800">{poData.requisition_number}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PO Date</span>
                                        <span className="text-sm font-semibold text-slate-800">{poData.po_date ? new Date(poData.po_date).toLocaleDateString() : "N/A"}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Created By</span>
                                        <span className="text-sm font-semibold text-slate-800">{poData.created_by_name || "N/A"}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Revision</span>
                                        <span className="text-sm font-semibold text-slate-800">
                                            {poData.revision_number} {poData.is_revised && <span className="text-xs text-red-500 font-bold ml-1">(Revised)</span>}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Currency</span>
                                        <span className="text-sm font-mono font-bold text-blue-600">{poData.currency || "INR"}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                                        {(() => {
                                            const allReceived = items && items.length > 0 && items.every(i => i.is_received);
                                            const someReceived = items && items.length > 0 && items.some(i => i.is_received);

                                            let displayStatus = poData.status;
                                            if (allReceived) {
                                                displayStatus = 'COMPLETED';
                                            } else if (someReceived) {
                                                displayStatus = 'PARTIALLY_RECEIVED';
                                            }

                                            let statusText = displayStatus;
                                            if (displayStatus === 'PENDING') statusText = 'Pending';
                                            else if (displayStatus === 'PARTIALLY_RECEIVED') statusText = 'Partially Received';
                                            else if (displayStatus === 'COMPLETED') statusText = 'Completed';
                                            else if (displayStatus === 'CANCELLED') statusText = 'Cancelled';

                                            return (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                    ${displayStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                                        displayStatus === 'PARTIALLY_RECEIVED' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                            displayStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                                displayStatus === 'CANCELLED' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                                    'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                                                    {statusText}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* VENDOR & BANK DETAILS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Vendor Details Card */}
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                                        <FaBuilding className="text-blue-500" /> Vendor Information
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1 col-span-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vendor Name</span>
                                            <span className="text-sm font-bold text-slate-800">{poData.vendor_name}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone</span>
                                            <span className="text-sm font-semibold text-slate-700">{poData.vendor_details?.phone || "N/A"}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</span>
                                            <span className="text-sm font-semibold text-slate-700">{poData.vendor_details?.email || "N/A"}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GST Number</span>
                                            <span className="text-sm font-mono font-bold text-slate-800">{poData.vendor_details?.gst_number || poData.vendor_details?.gst_no || "N/A"}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PAN Number</span>
                                            <span className="text-sm font-mono font-bold text-slate-800">{poData.vendor_details?.pan_number || poData.vendor_details?.pan_no || "N/A"}</span>
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Address</span>
                                            <span className="text-sm text-slate-600 font-medium leading-relaxed">{poData.vendor_details?.address || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Details Card */}
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                                        🏦 Bank Account Details
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1 col-span-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Name</span>
                                            <span className="text-sm font-bold text-slate-800">{poData.vendor_details?.account_name || "N/A"}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bank Name</span>
                                            <span className="text-sm font-semibold text-slate-700">{poData.vendor_details?.bank_name || "N/A"}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Number</span>
                                            <span className="text-sm font-mono font-bold text-slate-800">{poData.vendor_details?.bank_account_number || "N/A"}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IFSC Code</span>
                                            <span className="text-sm font-mono font-bold text-slate-800">{poData.vendor_details?.ifsc_code || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BILLING & SHIPPING DETAILS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bill To</span>
                                    <p className="text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">{poData.bill_to || "N/A"}</p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ship To</span>
                                    <p className="text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">{poData.ship_to || "N/A"}</p>
                                </div>
                            </div>

                            {/* ITEMS TABLE */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Order Items ({poData.items?.length || 0})</h4>
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
                                                <tr key={item.id} className="odd:bg-slate-100 even:bg-white hover:bg-slate-200   ">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-slate-800">{item.product_name}</div>
                                                        <div className="text-xs text-slate-500 font-mono">{item.product_code}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {item.hsn_code}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {Number(item.quantity).toFixed(2)} <span className="text-xs text-slate-400">{item.unit}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono">
                                                        {getCurrencySymbol(poData.currency)} {formatAmount(item.rate, poData.currency)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-800 font-mono">
                                                        {getCurrencySymbol(poData.currency)} {formatAmount(item.amount, poData.currency)}
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
                                            {(!poData.items || poData.items.length === 0) && (
                                                <tr>
                                                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                                                        No items in this order.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
                                            <tr>
                                                <td colSpan="4" className="px-4 py-2 text-right text-slate-500 font-medium">Items Total (Sub Total):</td>
                                                <td className="px-4 py-2 text-right font-mono">
                                                    {getCurrencySymbol(poData.currency)} {formatAmount(poData.items_total || (parseFloat(poData.total_amount) - parseFloat(poData.freight_cost || 0)), poData.currency)}
                                                </td>
                                                <td></td>
                                            </tr>
                                            {parseFloat(poData.discount_amount) > 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-2 text-right text-red-500 font-medium">Discount:</td>
                                                    <td className="px-4 py-2 text-right text-red-600 font-mono">
                                                        -{getCurrencySymbol(poData.currency)} {formatAmount(poData.discount_amount, poData.currency)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            )}
                                            {parseFloat(poData.cgst_amount) > 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-2 text-right text-slate-500 font-medium">CGST ({poData.cgst_percentage}%):</td>
                                                    <td className="px-4 py-2 text-right font-mono">
                                                        {getCurrencySymbol(poData.currency)} {formatAmount(poData.cgst_amount, poData.currency)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            )}
                                            {parseFloat(poData.sgst_amount) > 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-2 text-right text-slate-500 font-medium">SGST ({poData.sgst_percentage}%):</td>
                                                    <td className="px-4 py-2 text-right font-mono">
                                                        {getCurrencySymbol(poData.currency)} {formatAmount(poData.sgst_amount, poData.currency)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            )}
                                            {parseFloat(poData.igst_amount) > 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-2 text-right text-slate-500 font-medium">IGST ({poData.igst_percentage}%):</td>
                                                    <td className="px-4 py-2 text-right font-mono">
                                                        {getCurrencySymbol(poData.currency)} {formatAmount(poData.igst_amount, poData.currency)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            )}
                                            {parseFloat(poData.freight_cost) > 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-2 text-right text-slate-500 font-medium">Freight Cost:</td>
                                                    <td className="px-4 py-2 text-right font-mono">
                                                        {getCurrencySymbol(poData.currency)} {formatAmount(poData.freight_cost, poData.currency)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            )}
                                            <tr className="bg-slate-100/50">
                                                <td colSpan="4" className="px-4 py-3 text-right text-base">Total Amount:</td>
                                                <td className="px-4 py-3 text-right text-lg text-blue-600 font-mono">
                                                    {getCurrencySymbol(poData.currency)} {formatAmount(poData.total_amount, poData.currency)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* REMARKS & CANCELLATION DETAILS */}
                            {(poData.remarks || poData.status === 'CANCELLED') && (
                                <div className="grid grid-cols-1 gap-6">
                                    {poData.remarks && (
                                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remarks</span>
                                            <p className="text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">{poData.remarks}</p>
                                        </div>
                                    )}
                                    {poData.status === 'CANCELLED' && (
                                        <div className="bg-red-50 p-5 rounded-xl border border-red-200 space-y-2">
                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Cancellation Info</span>
                                            <p className="text-sm text-red-800 font-bold leading-relaxed">Reason: {poData.cancellation_reason || "No reason specified"}</p>
                                            <p className="text-[10px] text-red-500 font-medium">Cancelled By: {poData.cancelled_by_name || "System"} on {poData.cancelled_at ? new Date(poData.cancelled_at).toLocaleDateString() : "N/A"}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TERMS & CONDITIONS */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 animate-in fade-in duration-300">
                                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                                     Terms & Conditions
                                 </h4>
                                 {(() => {
                                     const termsList = poData?.terms_and_conditions || [];
                                     if (termsList.length === 0) {
                                         return (
                                             <p className="text-xs text-slate-400 italic">No terms and conditions specified for this Purchase Order.</p>
                                         );
                                     }
                                     return (
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             {termsList.map((term, index) => {
                                                 let label = `Term #${index + 1}`;
                                                 let value = term;
                                                 if (typeof term === 'string') {
                                                     const colonIdx = term.indexOf(':');
                                                     if (colonIdx !== -1) {
                                                         label = term.substring(0, colonIdx).trim();
                                                         value = term.substring(colonIdx + 1).trim();
                                                     }
                                                 } else if (term && typeof term === 'object') {
                                                     if (term.type || term.key || term.label) {
                                                         label = term.type || term.key || term.label;
                                                         value = term.value || '';
                                                     } else {
                                                         const keys = Object.keys(term);
                                                         if (keys.length > 0) {
                                                             label = keys[0];
                                                             value = term[keys[0]];
                                                         }
                                                     }
                                                 }
                                                 return (
                                                     <div key={index} className="flex flex-col p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all">
                                                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
                                                         <span className="text-xs font-semibold text-slate-700 leading-relaxed">{value}</span>
                                                     </div>
                                                 );
                                             })}
                                         </div>
                                     );
                                 })()}
                             </div>
                        </>
                    )}
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
                icon={FaCheckCircle}
                confirmButtonClass="bg-blue-600 hover:bg-blue-750"
                iconBgClass="bg-blue-100 text-blue-600"
            />

            <EditPurchaseOrderModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                poData={poData}
                onUpdate={refreshPOData}
            />

            {poData && (
                <ObjectAuditHistoryModal
                    open={auditHistoryOpen}
                    onClose={() => setAuditHistoryOpen(false)}
                    modelName="PurchaseOrder"
                    objectId={poData.id}
                />
            )}


        </div>
    );
};

export default PurchaseOrderModal;
