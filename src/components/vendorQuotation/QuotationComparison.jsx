import { useEffect, useState } from "react";
import { getQuotationComparison } from "../../services/vendorQuotationService";
import { generatePOFromComparison } from "../../services/purchaseOrderService";
import RequisitionSelector from "../common/RequisitionSelector";
import ConfirmDialog from "../ui/ConfirmDialog";
import AlertToast from "../ui/AlertToast";
import { getQuotationComparisonReport } from "../../services/vendorService";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaSearch, FaBoxOpen, FaCalendarAlt, FaTable, FaCheck, FaFileInvoiceDollar, FaFileExcel } from "react-icons/fa";

const QuotationComparison = () => {
    const [selectedRequisition, setSelectedRequisition] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State for Toast and Confirm
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });
    const [showConfirm, setShowConfirm] = useState(false);

    // Selection state: Map of product_code -> item_uuid
    const [selectedItems, setSelectedItems] = useState({});
    const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState(false);


    useEffect(() => {
        const fetchData = async () => {
            if (!selectedRequisition) return;

            setLoading(true);
            setError(null);
            setData(null);

            try {
                const res = await getQuotationComparison(selectedRequisition);
                console.log("Comparison Data:", res);
                setData(res);
            } catch (err) {
                console.error(err);
                setError("Failed to load comparison data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedRequisition, setError]);

    const handleItemSelect = (productCode, itemId) => {
        setSelectedItems(prev => {
            // Toggle Logic: If already selected, deselect it.
            if (prev[productCode] === itemId) {
                const newState = { ...prev };
                delete newState[productCode];
                return newState;
            }
            // Otherwise select this one (replaces any other selection for this product)
            return {
                ...prev,
                [productCode]: itemId
            };
        });
    };

    const handleGenerateClick = () => {
        const itemIds = Object.values(selectedItems);

        if (itemIds.length === 0) {
            setToast({
                open: true,
                type: "error",
                message: "Please select at least one item to generate a PO."
            });
            return;
        }

        setShowConfirm(true);
    };

    const processGeneratePO = async () => {
        const itemIds = Object.values(selectedItems);
        setGenerating(true);
        setError(null);
        // setGenSuccess(null); // Managed by toast now

        const payload = {
            requisition: selectedRequisition,
            po_date: poDate,
            selections: itemIds
        };

        try {
            await generatePOFromComparison(payload);
            setToast({
                open: true,
                type: "success",
                message: "Purchase Orders generated successfully!"
            });
            // Optional: reset selections or redirect?
            // setSelectedItems({});
        } catch (err) {
            console.error(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to generate PO. " + (err.response?.data?.detail || err.message)
            });
            // setError("Failed to generate PO..."); // Optional keeping inline error
        } finally {
            setGenerating(false);
            setShowConfirm(false);
        }
    };

    const handleDownloadReport = async () => {
        if (!selectedRequisition) return;
        setDownloading(true);
        try {
            const res = await getQuotationComparisonReport(selectedRequisition);
            const report = res.data;
            const quotations = report.quotations || [];

            // Preparing Sheet Data
            const wsData = [
                // Header
                ["VENDOR QUOTATION COMPARISON REPORT"],
                ["Requisition No:", report.requisition_number || ""],
                ["Date:", report.requisition_date || ""],
                ["Generated At:", report.generated_at ? new Date(report.generated_at).toLocaleString() : ""],
                [],
            ];

            // Build dynamic headers
            // Base: Product Code, Product Name, Qty
            const headers = ["Product Code", "Product Name", "Qty"];

            // Add Vendor Columns
            quotations.forEach(q => {
                headers.push(`${q.vendor_name} Rate`, `${q.vendor_name} Amount`);
            });
            wsData.push(headers);

            // Collect all unique products from all quotations to ensure complete list
            // (Simpler: traverse first quotation if we assume all quote for same items, 
            // but safer to map by product code across all)
            const productMap = new Map();
            quotations.forEach(q => {
                q.items.forEach(item => {
                    if (!productMap.has(item.product_code)) {
                        productMap.set(item.product_code, {
                            code: item.product_code,
                            name: item.product_name,
                            qty: item.quantity
                        });
                    }
                });
            });

            // Rows
            productMap.forEach((prod) => {
                const row = [prod.code, prod.name, prod.qty];

                quotations.forEach(q => {
                    const matchedItem = q.items.find(i => i.product_code === prod.code);
                    if (matchedItem) {
                        row.push(matchedItem.quoted_rate, matchedItem.amount);
                    } else {
                        row.push("-", "-");
                    }
                });
                wsData.push(row);
            });

            // Summary / Analysis (Optional, appended at bottom)
            wsData.push([], ["ANALYSIS"]);
            if (report.analysis) {
                const { lowest_quote, highest_quote } = report.analysis;
                if (lowest_quote) {
                    wsData.push(["Lowest Quote Vendor:", lowest_quote.vendor_name, `Total: ${lowest_quote.total_amount}`]);
                }
                if (highest_quote) {
                    wsData.push(["Highest Quote Vendor:", highest_quote.vendor_name, `Total: ${highest_quote.total_amount}`]);
                }
            }

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Auto-width columns roughly
            const wscols = [{ wch: 15 }, { wch: 30 }, { wch: 10 }];
            quotations.forEach(() => wscols.push({ wch: 15 }, { wch: 15 }));
            ws['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, ws, "Comparison");
            const filename = `Comparison_${report.requisition_number}_${new Date().toISOString().split('T')[0]}.xlsx`;

            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
            saveAs(blob, filename);

            setToast({ open: true, type: "success", message: "Report downloaded successfully" });

        } catch (err) {
            console.error(err);
            setToast({ open: true, type: "error", message: "Failed to download report" });
        } finally {
            setDownloading(false);
        }
    };

    // DERIVE UNIQUE PRODUCTS ROW
    const getAllProducts = () => {
        if (!data || !data.vendors) return [];

        // Map to store unique products by code
        const productMap = new Map();

        data.vendors.forEach(vendor => {
            vendor.quotations.forEach(quotation => {
                quotation.items.forEach(item => {
                    if (!productMap.has(item.product_code)) {
                        productMap.set(item.product_code, {
                            code: item.product_code,
                            name: item.product_name,
                            unit: item.unit
                        });
                    }
                });
            });
        });

        // Convert map values to array and sort by code
        return Array.from(productMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    };

    const products = getAllProducts();

    return (
        <div className="space-y-6">
            {/* FILTER */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-full max-w-md">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">
                        Select Requisition for Comparison
                    </label>
                    <RequisitionSelector
                        value={selectedRequisition}
                        onChange={(id) => setSelectedRequisition(id)}
                        placeholder="Search Requisition..."
                    />
                </div>
            </div>

            {loading && (
                <div className="p-12 text-center text-slate-500 animate-pulse bg-white rounded-xl border border-slate-200">
                    Loading comparison data...
                </div>
            )}

            {/* {error && (
                <div className="p-4 text-center text-red-600 bg-red-50 rounded-xl border border-red-100">
                    {error}
                </div>
            )} */}

            {!selectedRequisition && !loading && !data && (
                <div className="p-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                    <FaTable className="mx-auto text-3xl mb-3 opacity-20" />
                    <p>Select a Requisition to view comparative statement.</p>
                </div>
            )}

            {data && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">

                    {/* HEADER INFO */}
                    <div className="bg-slate-50/80 border-b border-slate-300 px-6 py-4 flex flex-wrap gap-6 items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <FaBoxOpen className="text-blue-600" />
                                <span className="font-bold text-slate-800">{data.requisition_number}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <FaCalendarAlt className="text-slate-400" />
                                <span>{data.requisition_date}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleDownloadReport}
                            disabled={downloading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-500 disabled:opacity-50"
                        >
                            <FaFileExcel /> {downloading ? "Downloading..." : "Export Excel"}
                        </button>
                    </div>

                    {/* COMPARISON TABLE CONTAINER */}
                    <div className="overflow-x-auto relative">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 border-b border-slate-300 text-xs uppercase tracking-wider">
                                    {/* STICKY FIRST COLUMN HEADER */}
                                    <th className="sticky left-0 bg-slate-100 z-20 px-4 py-3 border-r border-slate-400 min-w-62.5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        Product Details
                                    </th>

                                    {/* DYNAMIC VENDOR COLUMNS */}
                                    {/* Assume each vendor might have multiple quotations, we flatten them */}
                                    {data.vendors.map((vendor, vIdx) => (
                                        vendor.quotations.map((q, qIdx) => (
                                            <th key={`${vIdx}-${qIdx}`} className="px-4 py-3 min-w-55 border-r border-slate-300 bg-slate-50/50">
                                                <div className="flex flex-col gap-2">
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm truncate max-w-50" title={vendor.vendor_name}>
                                                            {vendor.vendor_name}
                                                        </div>
                                                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                                                            <span>{vendor.vendor_code}</span>
                                                            <span className="bg-white px-1 rounded border border-slate-300">{q.quotation_number}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </th>
                                        ))
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300 text-sm text-slate-700">
                                {/* TOTAL ROW (Optional, put at top or bottom? Let's verify if structure allows easy total) */}
                                <tr className="bg-slate-50 font-bold border-b border-slate-300">
                                    <td className="sticky left-0 z-20 bg-slate-50 px-4 py-3 border-r border-slate-400 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-slate-800">
                                        Total Quotation Amount
                                    </td>
                                    {data.vendors.map((vendor) => (
                                        vendor.quotations.map((q, idx) => (
                                            <td key={`total-${idx}`} className="px-4 py-3 text-right border-r border-slate-300 text-slate-900 bg-slate-50/50">
                                                ₹ {Number(q.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        ))
                                    ))}
                                </tr>

                                {/* ITEMS ROWS */}
                                {products.map((product) => (
                                    <tr key={product.code} className="hover:bg-slate-50/50">
                                        {/* Sticky Columns for Product Name */}
                                        <td className="sticky left-0 bg-white z-20 px-4 py-3 border-r border-slate-400 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-top">
                                            <div className="font-medium text-slate-800">{product.name}</div>
                                            <div className="text-xs text-slate-500 font-mono flex gap-2 mt-0.5">
                                                <span>{product.code}</span>
                                                <span className="bg-slate-100 px-1 rounded text-slate-400">{product.unit}</span>
                                            </div>
                                        </td>

                                        {/* Vendor/Quotation Cells */}
                                        {data.vendors.map((vendor) => (
                                            vendor.quotations.map((q, qIdx) => {
                                                // Find item match
                                                const matchedItem = q.items.find(i => i.product_code === product.code);

                                                return (
                                                    <td key={`cell-${qIdx}`} className="px-4 py-3 border-r border-slate-300 align-top text-right">
                                                        {matchedItem ? (
                                                            <div className="flex flex-col items-end gap-1">
                                                                <div className="flex items-center gap-2 mb-1 w-full justify-end">
                                                                    <div className="text-xs text-slate-400 font-mono hidden group-hover:block">
                                                                        Select
                                                                    </div>
                                                                    <input
                                                                        type="checkbox"
                                                                        name={`product-${product.code}`}
                                                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                                        checked={selectedItems[product.code] === matchedItem.id}
                                                                        onChange={() => handleItemSelect(product.code, matchedItem.id)}
                                                                    />
                                                                </div>
                                                                <div className="font-bold text-slate-900">
                                                                    ₹ {Number(matchedItem.quoted_rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    x {matchedItem.quantity}
                                                                </div>
                                                                <div className="text-xs font-semibold text-slate-700 pt-1 border-t border-dashed w-full border-slate-400">
                                                                    ₹ {Number(matchedItem.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-slate-300">-</div>
                                                        )}
                                                    </td>
                                                );
                                            })
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>


                    {/* GENERATE PO FOOTER */}
                    <div className="bg-slate-50 border-t border-slate-300 p-4 flex flex-col md:flex-row justify-end items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-slate-600">PO Date:</label>
                            <input
                                type="date"
                                value={poDate}
                                onChange={(e) => setPoDate(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={handleGenerateClick}
                            disabled={generating || Object.keys(selectedItems).length === 0}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {generating ? 'Processing...' : (
                                <>
                                    <FaFileInvoiceDollar /> Proceed to PO
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={showConfirm}
                title="Generate Purchase Order"
                message={`Are you sure you want to generate Purchase Orders for ${Object.values(selectedItems).length} selected items?`}
                confirmText="Generate PO"
                loading={generating}
                onCancel={() => setShowConfirm(false)}
                onConfirm={processGeneratePO}
                icon={FaFileInvoiceDollar}
                confirmButtonClass="bg-emerald-600 hover:bg-emerald-700"
                iconBgClass="bg-emerald-100 text-emerald-600"
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

export default QuotationComparison;
