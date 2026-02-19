
import React from "react";
import { FaTimes, FaFileInvoiceDollar, FaBuilding, FaInfoCircle, FaCalendarAlt, FaHashtag, FaFileExcel, FaPrint } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getBillDetailedReport } from "../../services/salesService";
import { pdf } from "@react-pdf/renderer";
import BillPDF from "./BillPDF";
import { toast } from "react-hot-toast";
import { useState } from "react";

const BillDetailsModal = ({ isOpen, onClose, loading, details }) => {
    if (!isOpen) return null;

    const [exporting, setExporting] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Currency formatter
    const formatCurrency = (amount) => {
        return Number(amount).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        });
    };

    const handlePrint = async () => {
        if (!details) return;
        setGeneratingPdf(true);
        try {
            const blob = await pdf(<BillPDF details={details} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const handleExport = async () => {
        if (!details || !details.id) return;
        setExporting(true);
        try {
            const data = await getBillDetailedReport(details.id);

            const wb = XLSX.utils.book_new();

            const wsData = [
                ["BILL DETAILED REPORT"],
                ["Generated At:", new Date().toLocaleString()],
                [],
                // BILL INFO
                ["BILL INFORMATION"],
                ["Bill Number", data.bill_number],
                ["Bill Date", data.bill_date],
                ["Status", data.status],
                ["Created By", data.created_by],
                [],
                // WORK ORDER INFO
                ["WORK ORDER DETAILS"],
                ["WO Number", data.work_order?.wo_number],
                ["WO Date", data.work_order?.wo_date],
                ["WO Status", data.work_order?.status],
                [],
                // CLIENT INFO
                ["CLIENT INFORMATION"],
                ["Client Name", data.client_details?.name],
                ["Contact Person", data.client_details?.contact_person],
                ["Phone", data.client_details?.phone],
                ["Email", data.client_details?.email],
                ["Address", data.client_details?.address],
                [],
                // ITEMS
                ["BILL ITEMS"],
                ["Item Code", "Item Name", "Description", "HSN Code", "Unit", "Ordered Qty", "Previously Delivered", "Current Delivered", "Pending Qty", "Rate", "Amount", "Remarks"],
            ];

            // Add Items
            (data.items || []).forEach(item => {
                wsData.push([
                    item.item_code,
                    item.item_name,
                    item.description,
                    item.hsn_code,
                    item.unit,
                    item.ordered_quantity,
                    item.previously_delivered,
                    item.delivered_quantity,
                    item.pending_quantity,
                    item.rate,
                    item.amount,
                    item.remarks
                ]);
            });

            wsData.push([]);

            // FINANCIALS
            wsData.push(["FINANCIAL SUMMARY"]);
            const financials = data.financial || {};
            wsData.push(["Subtotal", financials.subtotal]);

            if (financials.cgst?.amount > 0) {
                wsData.push([`CGST (${financials.cgst.percentage}%)`, financials.cgst.amount]);
            }
            if (financials.sgst?.amount > 0) {
                wsData.push([`SGST (${financials.sgst.percentage}%)`, financials.sgst.amount]);
            }
            if (financials.igst?.amount > 0) {
                wsData.push([`IGST (${financials.igst.percentage}%)`, financials.igst.amount]);
            }

            wsData.push(["Total Tax", financials.total_tax]);
            wsData.push(["Total Amount", financials.total_amount]);
            wsData.push(["Advance Deducted", financials.advance_deducted]);
            wsData.push(["Net Payable", financials.net_payable]);
            wsData.push(["Amount Paid", financials.amount_paid]);
            wsData.push(["Balance Due", financials.balance]);

            // REMARKS
            wsData.push([]);
            wsData.push(["Remarks", data.remarks]);


            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Col Widths
            ws['!cols'] = [
                { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 10 }, { wch: 8 },
                { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
                { wch: 15 }, { wch: 20 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, "Bill Details");

            const filename = `Bill_Details_${data.bill_number.replace(/\//g, '-')}.xlsx`;
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
            saveAs(blob, filename);

            toast.success("Bill detailed report downloaded successfully");

        } catch (error) {
            console.error("Failed to export bill details", error);
            toast.error("Failed to export bill details");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <FaFileInvoiceDollar className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Bill Details</h2>
                            {details && (
                                <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                                    <span className="opacity-75">ID:</span> {details.bill_number}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {details && (
                            <button
                                onClick={handlePrint}
                                disabled={generatingPdf}
                                className="flex items-center gap-2 px-2 py-1 text-slate-700 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                title="Print / Preview PDF"
                            >
                                {generatingPdf ? <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div> : <FaPrint size={20} />}
                                
                            </button>
                        )}
                        {details && (
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="flex items-center gap-2 px-2 py-1  hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                title="Export to Excel"
                            >
                                <FaFileExcel size={20} />
                               
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <FaTimes className="text-xl" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-white">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                            <span className="font-medium animate-pulse">Loading Bill Details...</span>
                        </div>
                    ) : details ? (
                        <div className="p-6 space-y-8">

                            {/* Status & Dates Banner */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase shadow-sm
                                        ${details.status === 'GENERATED' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                            details.status === 'PAID' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                        {details.status}
                                    </div>
                                    <div className="w-px h-8 bg-slate-300 hidden md:block"></div>
                                    <div className="text-sm">
                                        <span className="text-slate-500 block text-xs uppercase font-semibold">Bill Date</span>
                                        <span className="font-medium text-slate-900 flex items-center gap-1">
                                            <FaCalendarAlt className="text-slate-400 text-xs" />
                                            {details.bill_date}
                                        </span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-300 hidden md:block"></div>
                                    <div className="text-sm">
                                        <span className="text-slate-500 block text-xs uppercase font-semibold">Work Order</span>
                                        <span className="font-medium text-slate-900 flex items-center gap-1">
                                            <FaHashtag className="text-slate-400 text-xs" />
                                            {details.wo_number}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-500 uppercase font-semibold">Created By</span>
                                    <p className="text-sm font-medium text-slate-800">{details.created_by_name}</p>
                                </div>
                            </div>

                            {/* Client Info Grid */}
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                                    <FaBuilding className="text-slate-400" /> Client Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Client Name</p>
                                        <p className="font-semibold text-slate-900 text-base">{details.client_name}</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase">Contact Person</p>
                                            <p className="font-medium text-slate-800">{details.contact_person || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase">Phone</p>
                                            <p className="font-medium text-slate-800">{details.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase">Email</p>
                                            <p className="font-medium text-slate-800">{details.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase">Address</p>
                                            <p className="text-slate-700 italic">{details.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Bill Items</h3>
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-xs">
                                            <tr>
                                                <th className="px-5 py-3">Product Details</th>
                                                <th className="px-5 py-3 text-center">HSN</th>
                                                <th className="px-5 py-3 text-right">Qty</th>
                                                <th className="px-5 py-3 text-right">Rate</th>
                                                <th className="px-5 py-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {details.items?.map((item, idx) => (
                                                <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <div className="font-semibold text-slate-800">{item.item_name}</div>
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                                {item.item_code}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-1">{item.description}</div>
                                                    </td>
                                                    <td className="px-5 py-3 text-center text-slate-500 font-mono text-xs">
                                                        {item.hsn_code}
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        <div className="font-bold text-slate-800">
                                                            {item.delivered_quantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5" title="Ordered / Previously Delivered / Pending">
                                                            Order: {item.ordered_quantity} | Pend: {item.pending_quantity}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-mono text-slate-700">
                                                        {formatCurrency(item.rate)}
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-semibold font-mono text-slate-900">
                                                        {formatCurrency(item.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        {/* Table Footer for quick total check */}
                                        <tfoot className="bg-slate-50 border-t border-slate-200">
                                            <tr>
                                                <td colSpan="4" className="px-5 py-2 text-right text-xs text-slate-500 uppercase font-semibold">Total Items Amout</td>
                                                <td className="px-5 py-2 text-right font-mono font-medium text-slate-700">{formatCurrency(details.subtotal)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            {/* Bottom Section: Remarks & Financials */}
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Left Side: Remarks & Balance */}
                                <div className="flex-1 flex flex-col gap-4">
                                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex-1">
                                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                                            <FaInfoCircle className="text-slate-400" /> Remarks
                                        </h3>
                                        <p className="text-sm text-slate-600 italic leading-relaxed">
                                            {details.remarks || "No remarks provided."}
                                        </p>
                                    </div>

                                    {/* Quick Summary Box moved here */}
                                    <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-blue-500 uppercase font-bold">Total Items</p>
                                            <p className="text-2xl font-bold text-blue-700">{details.total_items}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-blue-500 uppercase font-bold">Balance Due</p>
                                            <p className="text-xl font-bold text-red-600">{formatCurrency(details.balance)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Financial Summary */}
                                <div className="w-full md:w-96 bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3 shadow-sm">
                                    <div className="flex justify-between text-slate-600 text-sm">
                                        <span>Subtotal</span>
                                        <span className="font-mono font-medium">{formatCurrency(details.subtotal)}</span>
                                    </div>

                                    {/* Taxes */}
                                    <div className="py-3 border-y border-slate-200 space-y-2">
                                        {parseFloat(details.cgst_amount) > 0 && (
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>CGST ({details.cgst_percentage}%)</span>
                                                <span className="font-mono">{formatCurrency(details.cgst_amount)}</span>
                                            </div>
                                        )}
                                        {parseFloat(details.sgst_amount) > 0 && (
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>SGST ({details.sgst_percentage}%)</span>
                                                <span className="font-mono">{formatCurrency(details.sgst_amount)}</span>
                                            </div>
                                        )}
                                        {parseFloat(details.igst_amount) > 0 && (
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>IGST ({details.igst_percentage}%)</span>
                                                <span className="font-mono">{formatCurrency(details.igst_amount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-slate-700 font-semibold text-sm pt-1">
                                            <span>Total GST</span>
                                            <span className="font-mono">{formatCurrency(details.total_gst)}</span>
                                        </div>
                                    </div>

                                    {/* Grand Total */}
                                    <div className="flex justify-between items-center text-slate-800 font-bold text-lg">
                                        <span>Total Amount</span>
                                        <span className="font-mono">{formatCurrency(details.total_amount)}</span>
                                    </div>

                                    {/* Adjustments */}
                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between text-red-600 text-sm font-medium">
                                            <span>Less: Advance Deducted</span>
                                            <span className="font-mono">- {formatCurrency(details.advance_deducted)}</span>
                                        </div>
                                        <div className="flex justify-between text-green-600 text-sm font-medium">
                                            <span>Amount Paid</span>
                                            <span className="font-mono">{formatCurrency(details.amount_paid)}</span>
                                        </div>
                                    </div>

                                    {/* Final Payable */}
                                    <div className="pt-3 mt-1 border-t-2 border-slate-300">
                                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                            <span className="text-slate-800 font-bold">Net Payable</span>
                                            <span className="font-mono font-bold text-xl text-blue-600">
                                                {formatCurrency(details.net_payable)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-400 font-medium">
                            Failed to load bill details.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillDetailsModal;
