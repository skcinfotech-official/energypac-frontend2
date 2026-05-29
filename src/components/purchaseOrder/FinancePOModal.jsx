import React from "react";
import { FaTimes, FaMoneyBillWave, FaUserTie, FaCalendarAlt, FaShippingFast, FaIdCard, FaEnvelope, FaPhoneAlt, FaBoxOpen, FaHistory, FaPrint } from "react-icons/fa";
import { pdf } from "@react-pdf/renderer";
import PurchaseOrderPDF from "./PurchaseOrderPDF";
import { toast } from "react-hot-toast";
import { getPurchaseOrder } from "../../services/purchaseOrderService";

const FinancePOModal = ({ open, onClose, data, onViewItems, onRecordPayment, onShowHistory }) => {
    if (!open || !data) return null;

    const [generatingPdf, setGeneratingPdf] = React.useState(false);
    const [fullPOData, setFullPOData] = React.useState(null);
    const [loadingDetails, setLoadingDetails] = React.useState(false);

    React.useEffect(() => {
        const fetchFullData = async () => {
            if (open && data?.id) {
                setLoadingDetails(true);
                try {
                    const fullData = await getPurchaseOrder(data.id);
                    setFullPOData(fullData);
                } catch (error) {
                    console.error("Failed to fetch full PO details", error);
                    setFullPOData(data); // fallback to basic data
                } finally {
                    setLoadingDetails(false);
                }
            }
        };
        fetchFullData();
    }, [open, data?.id]);

    const formatCurrency = (amount, curr = 'INR') => {
        const c = curr?.toString().trim().toUpperCase() || 'INR';
        try {
            return Number(amount || 0).toLocaleString('en-IN', {
                style: 'currency',
                currency: c,
                maximumFractionDigits: 2
            }).replace('US$', '$');
        } catch (e) {
            return `${c} ${Number(amount || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
    };

    const handlePrint = async () => {
        const printData = fullPOData || data;
        if (!printData) return;
        setGeneratingPdf(true);
        try {
            const blob = await pdf(<PurchaseOrderPDF details={printData} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            case 'PARTIALLY_RECEIVED': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const po = fullPOData || data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Purchase Order Details</h3>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(po.status)}`}>
                                {po.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 font-bold mt-1 flex items-center gap-2">
                             <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-mono">{po.po_number}</span>
                             • 
                             <span className="flex items-center gap-1.5"><FaCalendarAlt className="text-slate-400" /> {new Date(po.po_date).toLocaleDateString()}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handlePrint}
                            disabled={generatingPdf}
                            className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            title="Print PO"
                        >
                            <FaPrint size={18} className={generatingPdf ? "animate-pulse" : ""} />
                        </button>
                        <button onClick={onClose} className="p-2.5 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-900 active:scale-90">
                             <FaTimes size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Payable</p>
                            <p className="text-2xl font-black text-slate-900">{formatCurrency(po.total_amount, po.currency)}</p>
                            {po.currency && po.currency !== 'INR' && (
                                <p className="text-xs font-bold text-blue-600 mt-1">{formatCurrency(po.original_total_amount || (po.total_amount / po.exchange_rate), po.currency)}</p>
                            )}
                        </div>
                        <div className="p-5 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30">
                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">Amount Paid</p>
                            <p className="text-2xl font-black text-emerald-700">{formatCurrency(po.amount_paid, po.currency)}</p>
                            {po.currency && po.currency !== 'INR' && (
                                <p className="text-xs font-bold text-emerald-500 mt-1">{formatCurrency(po.original_amount_paid || (po.amount_paid / po.exchange_rate), po.currency)}</p>
                            )}
                        </div>
                        <div className="p-5 rounded-2xl border-2 border-red-100 bg-red-50/30">
                            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest mb-1">Outstanding Balance</p>
                            <p className="text-2xl font-black text-red-700">{formatCurrency(po.balance, po.currency)}</p>
                            {po.currency && po.currency !== 'INR' && (
                                <p className="text-xs font-bold text-red-400 mt-1">{formatCurrency(po.original_balance || (po.balance / po.exchange_rate), po.currency)}</p>
                            )}
                        </div>
                    </div>

                    {/* GENERAL DETAILS */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">
                            General PO & Project Info
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project Name</span>
                                <span className="text-sm font-bold text-slate-800">{po.project_name || "N/A"}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject</span>
                                <span className="text-sm font-semibold text-slate-800">{po.subject || "N/A"}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requisition Number</span>
                                <span className="text-sm font-bold text-slate-800">{po.requisition_number}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PO Date</span>
                                <span className="text-sm font-semibold text-slate-800">{po.po_date ? new Date(po.po_date).toLocaleDateString() : "N/A"}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Created By</span>
                                <span className="text-sm font-semibold text-slate-800">{po.created_by_name || "N/A"}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Revision</span>
                                <span className="text-sm font-semibold text-slate-800">
                                    {po.revision_number} {po.is_revised && <span className="text-xs text-red-500 font-bold ml-1">(Revised)</span>}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Currency</span>
                                <span className="text-sm font-mono font-bold text-blue-600">{po.currency || "INR"}</span>
                            </div>
                        </div>
                    </div>

                    {/* VENDOR & BANK DETAILS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Vendor Details Card */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                                <FaUserTie className="text-blue-500" /> Vendor Information
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vendor Name</span>
                                    <span className="text-sm font-bold text-slate-800">{po.vendor_name}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone</span>
                                    <span className="text-sm font-semibold text-slate-700">{po.vendor_details?.phone || po.vendor_phone || "N/A"}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</span>
                                    <span className="text-sm font-semibold text-slate-700">{po.vendor_details?.email || po.vendor_email || "N/A"}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GST Number</span>
                                    <span className="text-sm font-mono font-bold text-slate-800">{po.vendor_details?.gst_number || po.vendor_details?.gst_no || po.vendor_gst || "N/A"}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PAN Number</span>
                                    <span className="text-sm font-mono font-bold text-slate-800">{po.vendor_details?.pan_number || po.vendor_details?.pan_no || "N/A"}</span>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Address</span>
                                    <span className="text-sm text-slate-600 font-medium leading-relaxed">{po.vendor_details?.address || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bank Account Details Card */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                                🏦 Bank Account Details
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Name</span>
                                    <span className="text-sm font-bold text-slate-800">{po.vendor_details?.account_name || "N/A"}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bank Name</span>
                                    <span className="text-sm font-semibold text-slate-700">{po.vendor_details?.bank_name || "N/A"}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Number</span>
                                    <span className="text-sm font-mono font-bold text-slate-800">{po.vendor_details?.bank_account_number || "N/A"}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IFSC Code</span>
                                    <span className="text-sm font-mono font-bold text-slate-800">{po.vendor_details?.ifsc_code || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BILLING & SHIPPING DETAILS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bill To</span>
                            <p className="text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">{po.bill_to || "N/A"}</p>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ship To</span>
                            <p className="text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">{po.ship_to || "N/A"}</p>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                        <div className="border-b border-slate-200 pb-3 flex items-center gap-2">
                            <FaMoneyBillWave className="text-slate-400" />
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Payment Breakdown</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Items Total:</span>
                                    <span className="text-slate-900 font-bold">{formatCurrency(po.items_total || (parseFloat(po.total_amount) - parseFloat(po.freight_cost || 0)), po.currency)}</span>
                                </div>
                                {parseFloat(po.discount_amount) > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-red-500 font-medium">Discount:</span>
                                        <span className="text-red-600 font-bold">-{formatCurrency(po.discount_amount, po.currency)}</span>
                                    </div>
                                )}
                                {parseFloat(po.cgst_amount) > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">CGST ({po.cgst_percentage}%):</span>
                                        <span className="text-slate-900 font-bold">{formatCurrency(po.cgst_amount, po.currency)}</span>
                                    </div>
                                )}
                                {parseFloat(po.sgst_amount) > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">SGST ({po.sgst_percentage}%):</span>
                                        <span className="text-slate-900 font-bold">{formatCurrency(po.sgst_amount, po.currency)}</span>
                                    </div>
                                )}
                                {parseFloat(po.igst_amount) > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">IGST ({po.igst_percentage}%):</span>
                                        <span className="text-slate-900 font-bold">{formatCurrency(po.igst_amount, po.currency)}</span>
                                    </div>
                                )}
                                {parseFloat(po.freight_cost) > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">Freight Cost:</span>
                                        <span className="text-slate-900 font-bold">{formatCurrency(po.freight_cost, po.currency)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4 p-4 bg-white rounded-xl border border-slate-100 flex flex-col justify-center">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">Net Amount:</span>
                                    <span className="text-2xl font-black text-emerald-600">{formatCurrency(po.total_amount, po.currency)}</span>
                                </div>
                                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-bold">Outstanding Balance:</span>
                                    <span className={`font-black ${po.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                                        {formatCurrency(po.balance, po.currency)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Item View (optional summary) */}
                    {po.items && po.items.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <FaBoxOpen className="text-slate-400" /> Items List
                                </h4>
                                <button 
                                    onClick={() => onViewItems(po.id)}
                                    className="text-xs font-black text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 flex items-center gap-1"
                                >
                                    SHOW DETAILED ITEM VIEW →
                                </button>
                            </div>
                            <div className="overflow-hidden border border-slate-100 rounded-xl">
                                <table className="w-full text-left bg-white text-xs">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3">Product</th>
                                            <th className="px-5 py-3 text-right">Qty</th>
                                            <th className="px-5 py-3 text-right">Rate</th>
                                            <th className="px-5 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {po.items.slice(0, 3).map((it, i) => (
                                            <tr key={i}>
                                                <td className="px-5 py-3 font-bold text-slate-700">{it.product_name}</td>
                                                <td className="px-5 py-3 text-right font-black text-slate-900">{Number(it.quantity).toFixed(2)} {it.unit}</td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-500">{formatCurrency(it.rate, po.currency)}</td>
                                                <td className="px-5 py-3 text-right font-black text-slate-900">{formatCurrency(it.amount, po.currency)}</td>
                                            </tr>
                                        ))}
                                        {po.items.length > 3 && (
                                            <tr>
                                                <td colSpan="4" className="px-5 py-3 text-center bg-slate-50/50">
                                                    <button 
                                                        onClick={() => onViewItems(po.id)}
                                                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                                                    >
                                                        + {po.items.length - 3} OTHER ITEMS • CLICK TO VIEW ALL
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* REMARKS & CANCELLATION DETAILS */}
                    {(po.remarks || po.status === 'CANCELLED') && (
                        <div className="grid grid-cols-1 gap-6">
                            {po.remarks && (
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remarks</span>
                                    <p className="text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">{po.remarks}</p>
                                </div>
                            )}
                            {po.status === 'CANCELLED' && (
                                <div className="bg-red-50 p-5 rounded-xl border border-red-200 space-y-2">
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Cancellation Info</span>
                                    <p className="text-sm text-red-800 font-bold leading-relaxed">Reason: {po.cancellation_reason || "No reason specified"}</p>
                                    <p className="text-[10px] text-red-500 font-medium">Cancelled By: {po.cancelled_by_name || "System"} on {po.cancelled_at ? new Date(po.cancelled_at).toLocaleDateString() : "N/A"}</p>
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
                            const termsList = po?.terms_and_conditions || [];
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
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-white">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Payment count: <span className="text-slate-800">{data.payment_count}</span>
                    </p>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => onShowHistory(data.id)}
                            className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                        >
                            <FaHistory /> PAYMENT HISTORY
                        </button>
                        <button 
                            onClick={() => onRecordPayment(data)}
                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                            <FaMoneyBillWave /> RECORD PAYMENT
                        </button>
                        <button 
                            onClick={() => onViewItems(data.id)}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                        >
                            ITEM DETAILS
                        </button>
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/20"
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancePOModal;
