/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { FaTimes, FaFileAlt, FaFileExcel, FaPrint } from 'react-icons/fa';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";
import { getWorkOrderDetailReport } from "../../services/salesService";

import { pdf } from "@react-pdf/renderer";
import WorkOrderPDF from "./WorkOrderPDF";

const WorkOrderDetailsModal = ({ isOpen, onClose, loading, details }) => {
    const [exporting, setExporting] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    if (!isOpen) return null;

    const handlePrint = async () => {
        if (!details) return;
        setGeneratingPdf(true);
        try {
            const blob = await pdf(<WorkOrderPDF details={details} />).toBlob();
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
        if (!details?.id) return;
        setExporting(true);
        try {
            const data = await getWorkOrderDetailReport(details.id);
            const wb = XLSX.utils.book_new();

            const items = data.items || [];
            const client = data.client_details || {};
            const financial = data.financial || {};
            const salesQuot = data.sales_quotation || {};

            // --- SHEET 1: OVERVIEW ---
            const overviewData = [
                ["WORK ORDER DETAILS REPORT"],
                ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()],
                [],
                ["WORK ORDER INFO"],
                ["WO Number", data.wo_number],
                ["Date", data.wo_date],
                ["Status", data.status],
                ["Created By", data.created_by],
                ["Created At", data.created_at ? new Date(data.created_at).toLocaleString() : ""],
                [],
                ["CLIENT INFO"],
                ["Name", client.name],
                ["Contact Person", client.contact_person],
                ["Phone", client.phone],
                ["Email", client.email],
                ["Address", client.address],
                [],
                ["REFERENCE"],
                ["Quotation No", salesQuot.quotation_number],
                ["Quotation Date", salesQuot.quotation_date],
                ["Client Query No", salesQuot.client_query_number],
                [],
                ["FINANCIALS"],
                ["Subtotal", financial.subtotal],
                ["CGST", financial.cgst_amount],
                ["SGST", financial.sgst_amount],
                ["IGST", financial.igst_amount],
                ["Total Amount", financial.total_amount],
                ["Advance Received", financial.advance_amount],
                ["Advance Remaining", financial.advance_remaining],
                ["Delivered Value", financial.total_delivered_value],
                [],
                ["DELIVERY PROGRESS"],
                ["Completion %", (data.delivery_progress?.completion_percentage || 0) + "%"],
                ["Total Ordered", data.delivery_progress?.total_ordered || 0],
                ["Total Delivered", data.delivery_progress?.total_delivered || 0],
                ["Total Pending", data.delivery_progress?.total_pending || 0]
            ];

            const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
            // Column widths
            wsOverview['!cols'] = [{ wch: 20 }, { wch: 30 }];
            XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");


            // --- SHEET 2: ITEMS ---
            const itemsHeader = [
                "Item Code", "Item Name", "Description", "HSN Code", "Unit",
                "Ordered Qty", "Delivered Qty", "Pending Qty", "Rate", "Amount",
                "Stock Status", "Stock Msg", "Current Stock", "Pending Stock", "Remarks"
            ];

            const itemsRows = items.map(item => [
                item.item_code,
                item.item_name,
                item.description,
                item.hsn_code,
                item.unit,
                item.ordered_quantity,
                item.delivered_quantity,
                item.pending_quantity,
                item.rate,
                item.amount,
                item.stock_status?.status,
                item.stock_status?.message,
                item.stock_status?.current_stock,
                item.stock_status?.pending,
                item.remarks
            ]);

            const wsItems = XLSX.utils.aoa_to_sheet([itemsHeader, ...itemsRows]);
            wsItems['!cols'] = [
                { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 8 },
                { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
                { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 20 }
            ];
            XLSX.utils.book_append_sheet(wb, wsItems, "Items");

            // Generate File
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
            const filename = `WO_Detail_${data.wo_number.replace(/\//g, '_')}.xlsx`;
            saveAs(blob, filename);

            toast.success("Exported successfully");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export details");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <FaFileAlt className="text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                {loading ? "Loading..." : details?.wo_number || "Work Order Details"}
                            </h2>
                            {!loading && details && (
                                <span className="text-xs text-slate-500 font-mono">
                                    Quot: {details.quotation_number}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!loading && details && (
                            <button
                                onClick={handlePrint}
                                disabled={generatingPdf}
                                className="flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:text-blue-500 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                                title="Print / Preview PDF"
                            >
                                {generatingPdf ? <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div> : <FaPrint size={20} />}
                                
                            </button>
                        )}
                        {!loading && details && (
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="flex items-center gap-2 px-3 py-1.5  text-emerald-700 text-sm font-semibold rounded-lg hover:bg-emerald-100   transition-colors disabled:opacity-50"
                                title="Export to Excel"
                            >
                                <FaFileExcel size={20} />
                                
                            </button>
                        )}
                        <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                            <FaTimes className="text-xl" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : details ? (
                        <>
                            {/* Client Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Client Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Name:</span>
                                            <span className="font-medium text-slate-900">{details.client_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Contact Person:</span>
                                            <span className="font-medium text-slate-900">{details.contact_person}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Email:</span>
                                            <span className="font-medium text-slate-900">{details.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Phone:</span>
                                            <span className="font-medium text-slate-900">{details.phone}</span>
                                        </div>
                                        <div className="mt-2 text-slate-600 italic text-xs">
                                            {details.address}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Date:</span>
                                            <span className="font-medium text-slate-900">{details.wo_date}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Created By:</span>
                                            <span className="font-medium text-slate-900">{details.created_by_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Total Items:</span>
                                            <span className="font-medium text-slate-900">{details.total_items}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Completion:</span>
                                            <div className="w-1/2 flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${details.completion_percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-blue-600">{details.completion_percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-slate-600">Status:</span>
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold
                                                ${details.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                                                {details.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Ordered Items</h3>
                                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-700 uppercase font-semibold">
                                            <tr>
                                                <th className="px-4 py-3">Product</th>
                                                <th className="px-4 py-3 text-right">Qty</th>
                                                <th className="px-4 py-3 text-right">Rate</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                                <th className="px-4 py-3 text-center">Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {details.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-slate-900">{item.item_name}</div>
                                                        <div className="text-xs text-slate-500">{item.item_code}</div>
                                                        {item.remarks && <div className="text-xs text-slate-400 italic mt-0.5">"{item.remarks}"</div>}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono">
                                                        {parseFloat(item.ordered_quantity).toFixed(2)} {item.unit}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono">{item.rate}</td>
                                                    <td className="px-4 py-3 text-right font-medium font-mono">{item.amount}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold
                                            ${item.stock_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {item.stock_available ? "In Stock" : "Out of Stock"}
                                                        </span>
                                                        <div className="text-[10px] text-slate-500 mt-1">
                                                            Avail: {item.stock_quantity}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Financials */}
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="w-full md:w-1/2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Remarks</h3>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 min-h-[100px]">
                                        {details.remarks || "No remarks provided."}
                                    </div>
                                </div>
                                <div className="w-full md:w-5/12 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                                    <div className="flex justify-between text-slate-600 text-sm">
                                        <span>Subtotal:</span>
                                        <span className="font-mono">{details.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 text-sm">
                                        <span>CGST ({details.cgst_percentage}%):</span>
                                        <span className="font-mono">{details.cgst_amount}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 text-sm">
                                        <span>SGST ({details.sgst_percentage}%):</span>
                                        <span className="font-mono">{details.sgst_amount}</span>
                                    </div>
                                    {parseFloat(details.igst_amount) > 0 && (
                                        <div className="flex justify-between text-slate-600 text-sm">
                                            <span>IGST ({details.igst_percentage}%):</span>
                                            <span className="font-mono">{details.igst_amount}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-3 border-t border-slate-300 font-bold text-lg text-slate-900">
                                        <span>Total Amount:</span>
                                        <span className="font-mono">{details.total_amount}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 text-blue-600 font-semibold text-sm">
                                        <span>Advance Amount:</span>
                                        <span className="font-mono">{details.advance_amount}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-slate-500">Failed to load details.</div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
export default WorkOrderDetailsModal;
