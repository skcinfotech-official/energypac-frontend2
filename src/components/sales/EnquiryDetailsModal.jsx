import { useRef, useState } from "react";
import { FaTimes, FaFilePdf, FaFileExcel } from "react-icons/fa";
import { getClientQueryDetailReport, getClientQueryPdf } from "../../services/salesService";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const EnquiryDetailsModal = ({ isOpen, onClose, enquiry }) => {
    const modalRef = useRef(null);
    const [downloading, setDownloading] = useState(false);

    if (!isOpen || !enquiry) return null;

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Helper to extract filename from path if needed, or just show "View PDF"
    // Helper to extract filename from path if needed, or just show "View PDF"
    const getPdfName = (path) => {
        if (!path) return null;
        return path.split('\\').pop().split('/').pop();
    };

    const handleDownloadExcel = async () => {
        if (!enquiry?.id) return;
        setDownloading(true);
        try {
            const data = await getClientQueryDetailReport(enquiry.id);

            const wb = XLSX.utils.book_new();

            // 1. Overview Sheet
            const overviewData = [
                ["CLIENT QUERY DETAILED REPORT"],
                [],
                ["QUERY INFORMATION"],
                ["Query Number:", data.query_number],
                ["Date:", data.query_date],
                ["Status:", data.status],
                ["Created By:", data.created_by],
                ["Created At:", new Date(data.created_at).toLocaleString()],
                [],
                ["CLIENT DETAILS"],
                ["Name:", data.client_details?.name],
                ["Contact Person:", data.client_details?.contact_person],
                ["Phone:", data.client_details?.phone],
                ["Email:", data.client_details?.email],
                ["Address:", data.client_details?.address],
                [],
                ["REQUIREMENT"],
                ["Remarks:", data.remarks],
                [],
                ["SUMMARY"],
                ["Total Quotations:", data.total_quotations],
                ["Total Quoted Amount:", data.total_quoted_amount]
            ];
            const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
            XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

            // 2. Quotations Sheet
            if (data.quotations && data.quotations.length > 0) {
                const quotationRows = [
                    ["QUOTATION DETAILS"],
                    [],
                    ["Quotation No", "Date", "Validity", "Status", "Subtotal", "CGST", "SGST", "IGST", "Total Amount", "Payment Terms", "Delivery Terms"]
                ];

                data.quotations.forEach(quotation => {
                    quotationRows.push([
                        quotation.quotation_number,
                        quotation.quotation_date,
                        quotation.validity_date,
                        quotation.status,
                        quotation.subtotal,
                        quotation.cgst?.amount || 0,
                        quotation.sgst?.amount || 0,
                        quotation.igst?.amount || 0,
                        quotation.total_amount,
                        quotation.payment_terms,
                        quotation.delivery_terms
                    ]);
                });

                const wsQuotations = XLSX.utils.aoa_to_sheet(quotationRows);
                XLSX.utils.book_append_sheet(wb, wsQuotations, "Quotations");

                // 3. Items Sheet (Detailed breakdown of items per quotation)
                const itemRows = [
                    ["ITEM BREAKDOWN"],
                    [],
                    ["Quotation No", "Item Code", "Item Name", "Description", "HSN Code", "Quantity", "Unit", "Rate", "Amount", "Stock Status"]
                ];

                data.quotations.forEach(quotation => {
                    if (quotation.items && quotation.items.length > 0) {
                        quotation.items.forEach(item => {
                            itemRows.push([
                                quotation.quotation_number,
                                item.item_code,
                                item.item_name,
                                item.description,
                                item.hsn_code,
                                item.quantity,
                                item.unit,
                                item.rate,
                                item.amount,
                                item.from_stock ? "From Stock" : "Not Stock"
                            ]);
                        });
                    }
                });

                const wsItems = XLSX.utils.aoa_to_sheet(itemRows);
                XLSX.utils.book_append_sheet(wb, wsItems, "Items Breakdown");
            }

            // Save File
            const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
            saveAs(blob, `Query_Report_${data.query_number.replace(/\//g, '-')}.xlsx`);

        } catch (error) {
            console.error("Failed to download detailed report:", error);
            alert("Failed to download report. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const handleViewPdf = async () => {
        if (!enquiry?.id) return;
        try {
            const blob = await getClientQueryPdf(enquiry.id);
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Failed to view PDF:", error);
            alert("Failed to load PDF.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">
                            Query Details
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                            #{enquiry.query_number}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadExcel}
                            disabled={downloading}
                            className={`p-2 rounded-full transition-all ${downloading ? 'text-slate-300' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            title="Download Detailed Report"
                        >
                            <FaFileExcel size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    {/* Status Badge */}
                    <div className="flex justify-end">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold tracking-wide ${enquiry.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            enquiry.status === 'QUOTATION_SENT' ? 'bg-blue-100 text-blue-700' :
                                enquiry.status === 'CONVERTED' ? 'bg-green-100 text-green-700' :
                                    enquiry.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                        'bg-slate-100 text-slate-700'
                            }`}>
                            {enquiry.status?.replace('_', ' ')}
                        </span>
                    </div>

                    {/* Client Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                                Client Information
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Client Name</label>
                                    <p className="text-slate-800 font-medium text-lg">{enquiry.client_name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Address</label>
                                    <p className="text-slate-700">{enquiry.address}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                                Contact Person
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Name</label>
                                    <p className="text-slate-800 font-medium">{enquiry.contact_person}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">Phone</label>
                                        <p className="text-slate-700">{enquiry.phone}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">Email</label>
                                        <p className="text-slate-700 break-all">{enquiry.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enquiry Details */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                            Enquiry Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Date</label>
                                <p className="text-slate-700 font-medium">{formatDate(enquiry.query_date)}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Created By</label>
                                <p className="text-slate-700">{enquiry.created_by_name}</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-slate-500">Remarks</label>
                                <div className="mt-1 p-4 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 text-sm leading-relaxed">
                                    {enquiry.remarks || "No remarks provided."}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attachments */}
                    {enquiry.pdf_file && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                                Attachments
                            </h4>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg max-w-md w-full hover:bg-blue-100 transition-colors cursor-default">
                                    <div className="p-2 bg-white rounded-md shadow-sm text-red-500">
                                        <FaFilePdf size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 truncate">
                                            {getPdfName(enquiry.pdf_file)}
                                        </p>
                                    </div>
                                    {/* Download/View Link - Assumes accessible URL or handle via API if needed */}
                                    {/* Download/View Link - Assumes accessible URL or handle via API if needed */}
                                    <button
                                        onClick={handleViewPdf}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase"
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnquiryDetailsModal;
