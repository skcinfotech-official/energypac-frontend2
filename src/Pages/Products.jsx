import { useEffect, useState } from "react";

import ProductModal from "../components/products/ProductModal";
import ProductViewModal from "../components/products/ProductViewModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AlertToast from "../components/ui/AlertToast";
import { getProducts, deleteProduct, getProduct, getInventoryReport } from "../services/productService";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaPlus, FaEdit, FaTrash, FaEye, FaFileExcel } from "react-icons/fa";




export default function Products() {
    const [products, setProducts] = useState([]);
    const [count, setCount] = useState(0);
    const [next, setNext] = useState(null);
    const [previous, setPrevious] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [unitFilter, setUnitFilter] = useState("");


    const [error, setError] = useState("");

    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewProduct, setViewProduct] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    /* =========================
       REPORT STATE
       ========================= */
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState("current"); // current, low, out
    const [downloading, setDownloading] = useState(false);

    const [toast, setToast] = useState({
        open: false,
        type: "success",
        message: "",
    });


    const fetchProducts = async (url) => {
        try {
            setLoading(true);

            const res = await getProducts({
                url,
                search: searchText,
                unit: unitFilter,
            });

            setProducts(res.data.results);
            setCount(res.data.count);
            setNext(res.data.next);
            setPrevious(res.data.previous);
        } catch (err) {
            console.log(err);
            setError("Failed to load products");
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchProducts();
    }, []);

    /* =========================
       ACTION HANDLERS (UI ONLY)
       ========================= */
    const handleAddProduct = () => {
        setEditProduct(null);
        setOpenModal(true);
    };


    const handleEdit = (item) => {
        setEditProduct(item);
        setOpenModal(true);
    };

    const handleDelete = (item) => {
        setSelectedProduct(item);
        setShowConfirm(true);
    };

    const handleView = async (item) => {
        setViewModalOpen(true);
        setViewLoading(true);
        setViewProduct(null);
        try {
            const res = await getProduct(item.id);
            setViewProduct(res.data);
        } catch (err) {
            console.error(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to load product details",
            });
            setViewModalOpen(false); // Close if failed? Or keep open with error? Keeping generic error toast. 
        } finally {
            setViewLoading(false);
        }
    };

    const handleProductSuccess = (mode) => {
        setToast({
            open: true,
            type: "success",
            message:
                mode === "edit"
                    ? "Product updated successfully"
                    : "Product added successfully",
        });

        fetchProducts();
    };


    const confirmDelete = async () => {
        try {
            setDeleting(true);

            await deleteProduct(selectedProduct.id);

            setToast({
                open: true,
                type: "success",
                message: "Product deleted successfully",
            });

            fetchProducts();
        } catch (err) {
            console.log(err);
            setToast({
                open: true,
                type: "error",
                message: "Failed to delete product",
            });
        } finally {
            setDeleting(false);
            setShowConfirm(false);
            setSelectedProduct(null);
        }
    };

    /* =========================
       REPORT HANDLER
       ========================= */
    const handleDownloadReport = async () => {
        setDownloading(true);
        console.log("Starting report download...");
        try {
            // Map reportType to API status param
            let statusParam = "";
            let reportTitle = "Inventory Stock Report";

            if (reportType === "low") {
                statusParam = "low_stock";
                reportTitle = "Low Stock Report";
            } else if (reportType === "out") {
                statusParam = "out_of_stock";
                reportTitle = "Out of Stock Report";
            } else {
                reportTitle = "Current Stock Report";
            }

            console.log(`Fetching report for type: ${reportType}, status: ${statusParam}`);
            const res = await getInventoryReport(statusParam);
            console.log("API Response:", res);

            const data = res.data;
            if (!data) {
                throw new Error("No data received from API");
            }

            // Use the products directly from API - they are already filtered by the backend
            let filteredProducts = data.products || [];
            console.log(`Filtered products count: ${filteredProducts.length}`);

            if (filteredProducts.length === 0) {
                // setToast({ open: true, type: "info", message: "No records found for the selected criteria" });
                // Still download the report even if empty, just with summary and empty table
                console.log("No records found, downloading empty report with summary.");
            }

            const wb = XLSX.utils.book_new();

            const finalSheetData = [
                // --- HEADER ---
                [data.report_type || "INVENTORY REPORT"],
                ["Purpose:", reportTitle],
                ["Generated At:", data.generated_at ? new Date(data.generated_at).toLocaleString() : new Date().toLocaleString()],
                [],

                // --- SUMMARY (Main report summary, might not reflect filtered subset accurately if we don't recalc, but let's show main summary) ---
                ["OVERALL SUMMARY"],
                ["Total Products:", data.summary?.total_products || 0],
                ["Total Value:", data.summary?.total_inventory_value || 0],
                ["Healthy Stock:", data.summary?.healthy_stock || 0],
                ["Low Stock:", data.summary?.low_stock || 0],
                ["Out of Stock:", data.summary?.out_of_stock || 0],
                [],

                // --- TABLE HEADERS ---
                ["Item Code", "Item Name", "Current Stock", "Reorder Level", "Unit", "Rate", "Stock Value", "Status", "HSN Code"]
            ];

            filteredProducts.forEach(p => {
                // Determine status label if we calculated it manually or use API's
                let status = p.stock_status || "Healthy";
                if (p.current_stock <= 0) status = "Out of Stock";
                else if (p.current_stock <= p.reorder_level) status = "Low Stock";

                finalSheetData.push([
                    p.item_code,
                    p.item_name,
                    p.current_stock,
                    p.reorder_level,
                    p.unit,
                    p.rate,
                    p.stock_value,
                    status,
                    p.hsn_code
                ]);
            });

            const worksheet = XLSX.utils.aoa_to_sheet(finalSheetData);
            XLSX.utils.book_append_sheet(wb, worksheet, "Stock Report");

            // Generate Buffer
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });

            saveAs(blob, `Inventory_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);

            setShowReportModal(false);
            setToast({ open: true, type: "success", message: "Report downloaded successfully" });

        } catch (err) {
            console.error("Export failed:", err);
            setToast({ open: true, type: "error", message: `Failed to download report: ${err.message || 'Unknown error'}` });
        } finally {
            setDownloading(false);
        }
    };



    return (
        <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800">Products</h3>
                        <span className="text-sm text-slate-500 font-semibold">
                            Total: {count}
                        </span>
                    </div>


                    {/* ADD PRODUCT BUTTON */}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500"
                        >
                            <FaFileExcel className="text-sm" />
                            Export Excel
                        </button>
                        <button
                            onClick={handleAddProduct}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500"
                        >
                            <FaPlus className="text-xs" />
                            Add Product
                        </button>
                    </div>


                </div>

                {/* SEARCH & FILTER */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex flex-wrap gap-4">

                        {/* Search by Product Name */}
                        <div className="flex-1 min-w-[220px]">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Search Product
                            </label>
                            <input
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search by product name"
                                className="input"
                            />
                        </div>

                        {/* Filter by Unit */}
                        <div className="w-40">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Unit
                            </label>
                            <input
                                value={unitFilter}
                                onChange={(e) => setUnitFilter(e.target.value)}
                                className="input"
                                placeholder="e.g. pcs, kg"
                            />

                        </div>

                        {/* Search Button */}
                        <div className=" w-32 flex items-end">
                            <button
                                onClick={() => fetchProducts()}
                                className="w-full px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500"
                            >
                                Search
                            </button>
                        </div>

                    </div>
                </div>


                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-50/50 text-slate-800 uppercase text-[10px] font-bold tracking-widest">
                                <th className="px-6 py-4 text-[12px] whitespace-nowrap">Item Code</th>
                                <th className="px-6 py-4 text-[12px] min-w-[200px]">Item Name</th>
                                <th className="px-6 py-4 text-[12px] min-w-[200px]">Description</th>
                                <th className="px-6 py-4 text-[12px] whitespace-nowrap">HSN</th>
                                <th className="px-6 py-4 text-[12px] whitespace-nowrap">Unit</th>
                                <th className="px-6 py-4 text-[12px] text-right whitespace-nowrap">Stock</th>
                                <th className="px-6 py-4 text-[12px] text-right whitespace-nowrap">Reorder</th>
                                <th className="px-6 py-4 text-[12px] text-right whitespace-nowrap">Rate</th>
                                <th className="px-6 py-4 text-[12px] text-center whitespace-nowrap">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr>
                                    <td colSpan="9" className="px-6 py-6 text-center text-slate-500">
                                        Loading products...
                                    </td>
                                </tr>
                            )}

                            {!loading && products.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="px-6 py-6 text-center text-slate-500">
                                        No products found
                                    </td>
                                </tr>
                            )}

                            {products.map((item) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-slate-50 transition"
                                >
                                    <td className="px-6 py-4 font-mono text-blue-600 font-semibold whitespace-nowrap">
                                        {item.item_code}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-800">
                                        {item.item_name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={item.description}>
                                        {item.description || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                                        {item.hsn_code}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                                        {item.unit}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-800 whitespace-nowrap">
                                        {item.current_stock}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-800 whitespace-nowrap">
                                        {item.reorder_level}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                                        ₹{item.rate}
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleView(item)}
                                                className="text-slate-500 hover:text-blue-600"
                                                title="View"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Edit"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Delete"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => previous && fetchProducts(previous)}
                        disabled={!previous}
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40"
                    >
                        ← Previous
                    </button>

                    <button
                        onClick={() => next && fetchProducts(next)}
                        disabled={!next}
                        className="text-sm font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-40"
                    >
                        Next →
                    </button>
                </div>
            </div>
            <ProductModal
                key={editProduct ? editProduct.id : "add"}
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSuccess={handleProductSuccess}
                mode={editProduct ? "edit" : "add"}
                product={editProduct}
            />

            <ProductViewModal
                open={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                data={viewProduct}
                loading={viewLoading}
            />


            <ConfirmDialog
                open={showConfirm}
                title="Delete Product"
                message={`Are you sure you want to delete "${selectedProduct?.item_name}"?`}
                confirmText="Delete"
                loading={deleting}
                onCancel={() => setShowConfirm(false)}
                onConfirm={confirmDelete}
            />

            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />



            {/* REPORT MODAL */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FaFileExcel className="text-emerald-600" /> Export Inventory
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600 font-medium">Choose Purpose:</p>

                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="current"
                                        checked={reportType === "current"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Current Stock Product</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="low"
                                        checked={reportType === "low"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Low Stock Product</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input
                                        type="radio"
                                        name="reportType"
                                        value="out"
                                        checked={reportType === "out"}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="text-red-500 focus:ring-red-500"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">Out of Stock Product</span>
                                </label>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDownloadReport}
                                disabled={downloading}
                                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
                            >
                                {downloading ? "Exporting..." : "Download Excel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>

    );
}

