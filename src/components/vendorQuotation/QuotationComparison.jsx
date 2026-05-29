import { useEffect, useState } from "react";
import { getQuotationComparison } from "../../services/vendorQuotationService";
import { generatePOFromComparison, fetchPurchaseOrdersByRequisition } from "../../services/purchaseOrderService";
import RequisitionSelector from "../common/RequisitionSelector";
import ConfirmDialog from "../ui/ConfirmDialog";
import AlertToast from "../ui/AlertToast";
import { getQuotationComparisonReport } from "../../services/vendorService";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaSearch, FaBoxOpen, FaCalendarAlt, FaTable, FaCheck, FaFileInvoiceDollar, FaFileExcel, FaTimes, FaPlus, FaTrashAlt, FaInfoCircle } from "react-icons/fa";

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

    // Drawer state
    const [showDrawer, setShowDrawer] = useState(false);
    const [activeVendor, setActiveVendor] = useState(null);
    const [targetVendorForPO, setTargetVendorForPO] = useState(null);
    const [vendorPoDetails, setVendorPoDetails] = useState({});
    const [generatedPoVendors, setGeneratedPoVendors] = useState([]);

    // When comparison data loads, pre-populate vendor wise PO details
    useEffect(() => {
        if (data && data.vendors) {
            const initialDetails = {};
            data.vendors.forEach(q => {
                const vendorKey = q.vendor_id || q.id;
                initialDetails[vendorKey] = {
                    subject: "",
                    projectName: "",
                    billTo: "",
                    shipTo: "",
                    discountAmount: 0.00,
                    cgstPercentage: 0.00,
                    sgstPercentage: 0.00,
                    igstPercentage: 0.00,
                    conversionRate: 1.00,
                    terms: []
                };
            });
            setVendorPoDetails(initialDetails);
        }
    }, [data]);

    const activeVendorKey = activeVendor?.vendor_id || activeVendor?.id;
    const currentDetails = vendorPoDetails[activeVendorKey] || {
        subject: "",
        projectName: "",
        billTo: "",
        shipTo: "",
        discountAmount: 0.00,
        cgstPercentage: 0.00,
        sgstPercentage: 0.00,
        igstPercentage: 0.00,
        conversionRate: 1.00,
        terms: []
    };

    const updateVendorField = (field, val) => {
        if (!activeVendorKey) return;
        setVendorPoDetails(prev => ({
            ...prev,
            [activeVendorKey]: {
                ...prev[activeVendorKey],
                [field]: val
            }
        }));
    };

    const handleAddCustomTerm = () => {
        if (!activeVendorKey) return;
        const updatedTerms = [
            ...(currentDetails.terms || []),
            {
                id: `term-${Date.now()}`,
                key: "",
                value: ""
            }
        ];
        updateVendorField("terms", updatedTerms);
    };


    useEffect(() => {
        const fetchData = async () => {
            if (!selectedRequisition) return;

            setLoading(true);
            setError(null);
            setData(null);
            setGeneratedPoVendors([]);

            try {
                const res = await getQuotationComparison(selectedRequisition);
                console.log("Comparison Data:", res);
                setData(res);

                try {
                    const poRes = await fetchPurchaseOrdersByRequisition(selectedRequisition);
                    const pos = poRes.results || poRes || [];
                    const vendorIds = pos.map(po => po.vendor_id || po.vendor || po.vendor_name);
                    setGeneratedPoVendors(vendorIds);
                } catch (poErr) {
                    console.error("Failed to fetch existing POs for requisition comparison", poErr);
                }
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
        if (!targetVendorForPO) return;
        
        const vendorKey = targetVendorForPO.vendor_id || targetVendorForPO.id;
        const details = vendorPoDetails[vendorKey] || {};

        // Validation for mandatory fields
        const discount = details.discountAmount;
        const cgst = details.cgstPercentage;
        const sgst = details.sgstPercentage;
        const igst = details.igstPercentage;
        const convRate = details.conversionRate;

        if (discount === "" || discount === undefined || isNaN(Number(discount))) {
            setToast({ open: true, type: "error", message: "Discount Amount is mandatory." });
            return;
        }
        if (cgst === "" || cgst === undefined || isNaN(Number(cgst)) ||
            sgst === "" || sgst === undefined || isNaN(Number(sgst)) ||
            igst === "" || igst === undefined || isNaN(Number(igst))) {
            setToast({ open: true, type: "error", message: "CGST, SGST, and IGST percentages are mandatory." });
            return;
        }
        if (convRate === "" || convRate === undefined || isNaN(Number(convRate)) || Number(convRate) <= 0) {
            setToast({ open: true, type: "error", message: "A valid Conversion Rate (> 0) is mandatory." });
            return;
        }
        
        const vendorItemIds = (targetVendorForPO.items || []).map(i => i.id);
        const selectedForThisVendor = Object.values(selectedItems).filter(id => vendorItemIds.includes(id));

        if (selectedForThisVendor.length === 0) {
            setToast({
                open: true,
                type: "error",
                message: "No items selected for this vendor."
            });
            setShowConfirm(false);
            return;
        }

        setGenerating(true);
        setError(null);

        const termsAndConditions = (details.terms || [])
            .filter(t => t.value.trim() !== "")
            .map(t => {
                if (t.key.trim() !== "") {
                    return `${t.key}: ${t.value}`;
                }
                return t.value;
            });

        const payload = {
            requisition: selectedRequisition,
            po_date: poDate,
            subject: details.subject || "",
            project_name: details.projectName || "",
            bill_to: details.billTo || "",
            ship_to: details.shipTo || "",
            terms_and_conditions: termsAndConditions,
            selections: selectedForThisVendor,
            discount_amount: Number(details.discountAmount) || 0,
            cgst_percentage: Number(details.cgstPercentage) || 0,
            sgst_percentage: Number(details.sgstPercentage) || 0,
            igst_percentage: Number(details.igstPercentage) || 0,
            conversion_rate: Number(details.conversionRate) || 1
        };

        console.log("Generating PO for vendor with payload:", payload);

        try {
            await generatePOFromComparison(payload);
            setToast({
                open: true,
                type: "success",
                message: `Purchase Order for ${targetVendorForPO.vendor_name} generated successfully!`
            });
            const vendorKey = targetVendorForPO.vendor_id || targetVendorForPO.id || targetVendorForPO.vendor_name;
            setGeneratedPoVendors(prev => [...prev, vendorKey]);
        } catch (err) {
            console.error(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to generate PO. " + (err.response?.data?.detail || err.message)
            });
        } finally {
            setGenerating(false);
            setShowConfirm(false);
            setTargetVendorForPO(null);
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
                        row.push(parseFloat(matchedItem.quoted_rate) === 0 ? "N/A" : matchedItem.quoted_rate, matchedItem.amount);
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
            (vendor.items || []).forEach(item => {
                if (!productMap.has(item.product_code)) {
                    productMap.set(item.product_code, {
                        code: item.product_code,
                        name: item.product_name,
                        unit: item.unit
                    });
                }
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
                                    {data.vendors.map((q, qIdx) => (
                                        <th key={q.id || qIdx} className="px-4 py-3 min-w-55 border-r border-slate-300 bg-slate-50/50 align-top">
                                            <div className="flex flex-col gap-2">
                                                <div className="w-full">
                                                    <div className="font-bold text-slate-800 text-sm truncate max-w-50" title={q.vendor_name}>
                                                        {q.vendor_name}
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                                                        <span>{q.vendor_code}</span>
                                                        <span className="bg-white px-1 rounded border border-slate-300">{q.quotation_number}</span>
                                                    </div>
                                                    <div className="flex gap-2 text-[9px] mt-1 mb-1">
                                                        {q.gst_number && (
                                                            <span className="text-blue-600 font-bold bg-blue-50 px-1 rounded border border-blue-100">GST: {q.gst_number}</span>
                                                        )}
                                                        {q.pan_number && (
                                                            <span className="text-slate-600 font-bold bg-slate-50 px-1 rounded border border-slate-200">PAN: {q.pan_number}</span>
                                                        )}
                                                    </div>

                                                    {/* Bank Details Snippet */}
                                                    {(q.bank_name || q.bank_account_number || q.account_name) && (
                                                        <div className="bg-white p-1.5 rounded border border-slate-200 mt-2 shadow-sm text-left">
                                                            <p className="text-[9px] font-bold text-slate-600 mb-0.5 border-b border-slate-100 pb-0.5">Bank Info</p>
                                                            <div className="text-[9px] text-slate-500 leading-tight space-y-0.5">
                                                                <div className="flex justify-between gap-1">
                                                                    <span className="text-slate-400 shrink-0">Bank:</span>
                                                                    <span className="font-medium text-slate-700 truncate" title={q.bank_name}>{q.bank_name || '-'}</span>
                                                                </div>
                                                                <div className="flex justify-between gap-1">
                                                                    <span className="text-slate-400 shrink-0">Name:</span>
                                                                    <span className="font-medium text-slate-700 truncate" title={q.account_name}>{q.account_name || '-'}</span>
                                                                </div>
                                                                <div className="flex justify-between gap-1">
                                                                    <span className="text-slate-400 shrink-0">A/C:</span>
                                                                    <span className="font-medium text-slate-700 truncate">{q.bank_account_number || q.account_number || '-'}</span>
                                                                </div>
                                                                <div className="flex justify-between gap-1">
                                                                    <span className="text-slate-400 shrink-0">IFSC:</span>
                                                                    <span className="font-medium text-slate-700 truncate">{q.ifsc_code || '-'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300 text-sm text-slate-700">
                                {/* TOTAL ROW (Optional, put at top or bottom? Let's verify if structure allows easy total) */}
                                <tr className="bg-slate-50 font-bold border-b border-slate-300">
                                    <td className="sticky left-0 z-20 bg-slate-50 px-4 py-3 border-r border-slate-400 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-slate-800">
                                        Total Quotation Amount
                                    </td>
                                    {data.vendors.map((q) => (
                                        <td key={`total-${q.id}`} className="px-4 py-3 text-right border-r border-slate-300 text-slate-900 bg-slate-50/50">
                                            {getCurrencySymbol(q.currency)} {formatAmount(q.total_amount, q.currency)}
                                        </td>
                                    ))}
                                </tr>

                                {/* ITEMS ROWS */}
                                {products.map((product) => (
                                    <tr key={product.code} className="odd:bg-slate-100 even:bg-white hover:bg-slate-200   ">
                                        {/* Sticky Columns for Product Name */}
                                        <td className="sticky left-0 bg-white z-20 px-4 py-3 border-r border-slate-400 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-top">
                                            <div className="font-medium text-slate-800">{product.name}</div>
                                            <div className="text-xs text-slate-500 font-mono flex gap-2 mt-0.5">
                                                <span>{product.code}</span>
                                                <span className="bg-slate-100 px-1 rounded text-slate-400">{product.unit}</span>
                                            </div>
                                        </td>

                                        {/* Vendor/Quotation Cells */}
                                        {data.vendors.map((q, qIdx) => {
                                            // Find item match
                                            const matchedItem = (q.items || []).find(i => i.product_code === product.code);

                                            return (
                                                <td key={`cell-${qIdx}`} className="px-4 py-3 border-r border-slate-300 align-top text-right">
                                                    {matchedItem ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            {parseFloat(matchedItem.quoted_rate) !== 0 && (
                                                                <div className="flex items-center gap-2 mb-1 w-full justify-end">
                                                                    <div className="text-xs text-slate-400 font-mono hidden group-hover:block">
                                                                        Select
                                                                    </div>
                                                                    <input
                                                                        type="checkbox"
                                                                        name={`product-${product.code}`}
                                                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                                        checked={selectedItems[product.code] === matchedItem.id}
                                                                        onChange={() => handleItemSelect(product.code, matchedItem.id)}
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="font-bold text-slate-900">
                                                                {parseFloat(matchedItem.quoted_rate) === 0 ? "N/A" : `${getCurrencySymbol(q.currency)} ${formatAmount(matchedItem.quoted_rate, q.currency)}`}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                x {Number(matchedItem.quantity).toFixed(2)}
                                                            </div>
                                                            <div className="text-xs font-semibold text-slate-700 pt-1 border-t border-dashed w-full border-slate-400">
                                                                {getCurrencySymbol(q.currency)} {formatAmount(matchedItem.amount, q.currency)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-slate-300">-</div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}


                                {/* TOTAL COMPUTED ROW */}
                                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                                    <td className="sticky left-0 z-20 bg-slate-100 px-4 py-4 border-r border-slate-400 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-slate-900">
                                        Estimated PO Total
                                    </td>
                                    {data.vendors.map((q, idx) => {
                                        // Calculate total selected amount for this quotation
                                        const selectedTotal = (q.items || [])
                                            .filter(i => selectedItems[i.product_code] === i.id)
                                            .reduce((sum, i) => sum + Number(i.amount), 0);

                                        return (
                                            <td key={`est-total-${idx}`} className="px-4 py-4 text-right border-r border-slate-300 text-blue-700 bg-slate-100/80">
                                                {selectedTotal > 0 ? (
                                                    `${getCurrencySymbol(q.currency)} ${formatAmount(selectedTotal, q.currency)}`
                                                ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                            );
                                    })}
                                </tr>
                                {/* ACTIONS ROW */}
                                <tr className="bg-slate-50 border-t border-slate-300">
                                    <td className="sticky left-0 z-20 bg-slate-50 px-4 py-3 border-r border-slate-400 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-slate-800 font-bold">
                                        Actions
                                    </td>
                                    {data.vendors.map((q, idx) => {
                                        const vendorKey = q.vendor_id || q.id;
                                        const vendorItemIds = (q.items || []).map(i => i.id);
                                        const selectedForThisVendor = Object.values(selectedItems).filter(id => vendorItemIds.includes(id));
                                        const hasSelection = selectedForThisVendor.length > 0;
                                        const isPoAlreadyGenerated = generatedPoVendors.some(v => 
                                            v === q.vendor_id || 
                                            v === q.id || 
                                            v === q.vendor_name || 
                                            (typeof v === 'object' && v !== null && (v.id === q.vendor_id || v.id === q.id || v.vendor_name === q.vendor_name))
                                        );

                                        return (
                                            <td key={`actions-${idx}`} className="px-4 py-3 border-r border-slate-300 bg-slate-50/50 text-center">
                                                <div className="flex flex-col gap-2 items-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveVendor(q);
                                                            setShowDrawer(true);
                                                        }}
                                                        className="w-full px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all"
                                                    >
                                                        Add Terms & Conditions
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setTargetVendorForPO(q);
                                                            setShowConfirm(true);
                                                        }}
                                                        disabled={!hasSelection || isPoAlreadyGenerated}
                                                        className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        {isPoAlreadyGenerated ? "PO Generated" : "Proceed to PO"}
                                                    </button>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>


                    {/* GENERATE PO FOOTER */}
                    <div className="bg-slate-50 border-t border-slate-300 p-4 flex justify-end items-center">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-slate-600">PO Date:</label>
                            <input
                                type="date"
                                value={poDate}
                                onChange={(e) => setPoDate(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            )
            }

            {/* TERMS AND CONDITIONS DRAWER */}
            {showDrawer && (
                <>
                    {/* Backdrop overlay */}
                    <div 
                        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => {
                            setShowDrawer(false);
                            setActiveVendor(null);
                        }}
                    />
                    {/* Drawer container */}
                    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300 ease-in-out border-l border-slate-200 animate-in slide-in-from-right">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg">
                                    <FaFileInvoiceDollar className="text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">PO Terms & Conditions</h3>
                                    <p className="text-xs text-slate-500">Configure details for generated Purchase Orders</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDrawer(false);
                                    setActiveVendor(null);
                                }}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                            >
                                <FaTimes size={18} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* ACTIVE VENDOR CARD */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-3 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                                    Active Vendor PO Target
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                    <div>
                                        <p className="text-slate-400 font-semibold mb-0.5">Vendor</p>
                                        <p className="font-bold text-slate-700 truncate" title={activeVendor?.vendor_name}>{activeVendor?.vendor_name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono">{activeVendor?.vendor_code}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-semibold mb-0.5">Quotation No</p>
                                        <p className="font-bold text-slate-700 font-mono">{activeVendor?.quotation_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-semibold mb-0.5">Requisition No</p>
                                        <p className="font-bold text-slate-700 font-mono">{data?.requisition_number || activeVendor?.requisition_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 font-semibold mb-0.5">Currency</p>
                                        <p className="font-bold text-slate-700 uppercase font-mono">{activeVendor?.currency}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section: PO Details */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                                    General Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
                                        <input
                                            type="text"
                                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                                            value={currentDetails.subject}
                                            onChange={(e) => updateVendorField("subject", e.target.value)}
                                            placeholder="Steel materials for Phase 2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Project Name</label>
                                        <input
                                            type="text"
                                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                                            value={currentDetails.projectName}
                                            onChange={(e) => updateVendorField("projectName", e.target.value)}
                                            placeholder="Kolkata Metro Phase 2"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Bill To Address</label>
                                        <textarea
                                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
                                            value={currentDetails.billTo}
                                            onChange={(e) => updateVendorField("billTo", e.target.value)}
                                            placeholder="Billing Address..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Ship To Address</label>
                                        <textarea
                                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
                                            value={currentDetails.shipTo}
                                            onChange={(e) => updateVendorField("shipTo", e.target.value)}
                                            placeholder="Shipping Address..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Finance & Tax details */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                                    Financial & Tax Configuration
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label className="block text-[10px] font-bold text-slate-600">
                                                Discount Amt ({activeVendor?.currency})
                                            </label>
                                            <span className="text-red-500 font-bold">*</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            className="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={currentDetails.discountAmount}
                                            onChange={(e) => updateVendorField("discountAmount", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label className="block text-[10px] font-bold text-slate-600">CGST %</label>
                                            <span className="text-red-500 font-bold">*</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            className="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={currentDetails.cgstPercentage}
                                            onChange={(e) => updateVendorField("cgstPercentage", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label className="block text-[10px] font-bold text-slate-600">SGST %</label>
                                            <span className="text-red-500 font-bold">*</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            className="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={currentDetails.sgstPercentage}
                                            onChange={(e) => updateVendorField("sgstPercentage", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label className="block text-[10px] font-bold text-slate-600">IGST %</label>
                                            <span className="text-red-500 font-bold">*</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            className="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={currentDetails.igstPercentage}
                                            onChange={(e) => updateVendorField("igstPercentage", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <div className="flex items-center gap-1 mb-1">
                                            <label className="block text-[10px] font-bold text-slate-600">Conv. Rate</label>
                                            <span className="text-red-500 font-bold">*</span>
                                            <div className="relative group cursor-pointer text-slate-400 hover:text-blue-500 transition-colors">
                                                <FaInfoCircle size={10} />
                                                <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block w-48 bg-slate-800 text-white text-[9px] font-semibold leading-tight p-2 rounded-lg shadow-xl z-50 text-center">
                                                    Mandatory rate used to convert foreign currency quotes and calculate profits and losses.
                                                    <div className="absolute top-full right-1 border-4 border-transparent border-t-slate-800" />
                                                </div>
                                            </div>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            required
                                            className="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={currentDetails.conversionRate}
                                            onChange={(e) => updateVendorField("conversionRate", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Terms and Conditions List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Terms & Conditions
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={handleAddCustomTerm}
                                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-100 transition-colors"
                                    >
                                        <FaPlus size={10} /> Add Term
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                    {(currentDetails.terms || []).map((term, index) => (
                                        <div 
                                            key={term.id} 
                                            className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                    Term #{index + 1}
                                                </span>
                                                {(currentDetails.terms || []).length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = currentDetails.terms.filter(t => t.id !== term.id);
                                                            updateVendorField("terms", updated);
                                                        }}
                                                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                                        title="Delete Term"
                                                    >
                                                        <FaTrashAlt size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                                        Key / Label
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full text-xs font-medium text-slate-700 border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                                        value={term.key}
                                                        onChange={(e) => {
                                                            const updated = currentDetails.terms.map(t => t.id === term.id ? { ...t, key: e.target.value } : t);
                                                            updateVendorField("terms", updated);
                                                        }}
                                                        placeholder="e.g. Delivery"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                                        Value
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full text-xs font-medium text-slate-700 border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                                        value={term.value}
                                                        onChange={(e) => {
                                                            const updated = currentDetails.terms.map(t => t.id === term.id ? { ...t, value: e.target.value } : t);
                                                            updateVendorField("terms", updated);
                                                        }}
                                                        placeholder="e.g. within 20 days"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!activeVendorKey) return;
                                    setVendorPoDetails(prev => ({
                                        ...prev,
                                        [activeVendorKey]: {
                                            subject: "",
                                            projectName: "",
                                            billTo: "",
                                            shipTo: "",
                                            discountAmount: 0.00,
                                            cgstPercentage: 0.00,
                                            sgstPercentage: 0.00,
                                            igstPercentage: 0.00,
                                            conversionRate: 1.00,
                                            terms: []
                                        }
                                    }));
                                }}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                Clear All
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDrawer(false);
                                    setActiveVendor(null);
                                }}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-sm transition-colors"
                            >
                                Save & Close
                            </button>
                        </div>
                    </div>
                </>
            )}

            <ConfirmDialog
                open={showConfirm}
                title="Generate Purchase Order"
                message={`Are you sure you want to generate Purchase Order for ${targetVendorForPO?.vendor_name || ''}?`}
                confirmText="Generate PO"
                loading={generating}
                onCancel={() => {
                    setShowConfirm(false);
                    setTargetVendorForPO(null);
                }}
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
        </div >
    );
};

export default QuotationComparison;
