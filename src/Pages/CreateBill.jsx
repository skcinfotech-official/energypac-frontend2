import React, { useState, useEffect } from "react";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { getActiveWorkOrders, getWorkOrderById, createBill, validateBillStock } from "../services/salesService";
import { getProduct } from "../services/productService";
import { FaCheckCircle } from 'react-icons/fa';

const CreateBill = () => {
    const [workOrders, setWorkOrders] = useState([]);
    const [selectedWoId, setSelectedWoId] = useState("");
    const [woDetails, setWoDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [validating, setValidating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        bill_date: new Date().toISOString().split("T")[0],
        remarks: "",
        items: []
    });

    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [confirm, setConfirm] = useState({ open: false, action: null });

    useEffect(() => {
        const fetchWOs = async () => {
            try {
                // Fetch ONLY Active Work Orders
                const data = await getActiveWorkOrders();
                const wos = Array.isArray(data) ? data : data.results || [];
                const activeWOs = wos.filter(wo => wo.status !== 'COMPLETED');
                setWorkOrders(activeWOs);
            } catch (error) {
                console.error("Failed to fetch work orders", error);
                setAlert({ open: true, type: "error", message: "Failed to load work orders" });
            }
        };
        fetchWOs();
    }, []);

    const handleWoChange = async (e) => {
        const id = e.target.value;
        setSelectedWoId(id);
        setWoDetails(null);
        setFormData(prev => ({ ...prev, items: [], remarks: "" }));

        if (!id) return;

        setLoading(true);
        try {
            const details = await getWorkOrderById(id);
            setWoDetails(details);

            if (details && details.items) {
                // Fetch stock for each item
                const itemsWithStock = await Promise.all(details.items.map(async (item) => {
                    let currentStock = null;
                    try {
                        // 1. Try to get stock from WO item details first
                        if (item.stock_quantity !== undefined && item.stock_quantity !== null) {
                            currentStock = item.stock_quantity;
                        }

                        // 2. If not available, or just to be sure, fetch from Product API
                        // This handles if item.product is ID or object
                        const productId = typeof item.product === 'object' ? item.product?.id : item.product;

                        if (productId) {
                            const prodRes = await getProduct(productId);
                            if (prodRes && prodRes.data) {
                                // Use current_stock from product response
                                currentStock = prodRes.data.current_stock;
                            }
                        }
                    } catch (err) {
                        console.warn(`Failed to fetch stock for item ${item.item_name}`, err);
                    }

                    return {
                        work_order_item: item.id,
                        item_name: item.item_name,
                        item_code: item.item_code,
                        current_stock: currentStock,
                        ordered_quantity: parseFloat(item.ordered_quantity || item.quantity || 0).toFixed(2),
                        previously_delivered_quantity: parseFloat(item.delivered_quantity || 0).toFixed(2),
                        pending_quantity: parseFloat(item.pending_quantity || item.quantity || 0).toFixed(2),
                        delivered_quantity: "",
                        rate: parseFloat(item.rate || 0).toFixed(2),
                        amount: parseFloat(item.amount || (item.ordered_quantity * item.rate) || 0).toFixed(2),
                        remarks: ""
                    };
                }));

                setFormData(prev => ({ ...prev, items: itemsWithStock }));
            }
        } catch (error) {
            console.error("Failed to load WO details", error);
            setAlert({ open: true, type: "error", message: "Failed to load Work Order details" });
        } finally {
            setLoading(false);
        }
    };



    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const handleValidateStock = async () => {
        // Filter items that have delivered_quantity > 0
        const itemsToValidate = formData.items
            .filter(item => parseFloat(item.delivered_quantity) > 0)
            .map(item => ({
                work_order_item: item.work_order_item,
                delivered_quantity: parseFloat(item.delivered_quantity),
                remarks: item.remarks
            }));

        if (itemsToValidate.length === 0) {
            setAlert({ open: true, type: "warning", message: "Please enter quantity for at least one item to validate." });
            return;
        }

        setValidating(true);
        const payload = {
            work_order: selectedWoId,
            items: itemsToValidate
        };

        try {
            const response = await validateBillStock(payload);
            if (response.stock_available) {
                setAlert({ open: true, type: "success", message: response.message });
            }

            else {
                setAlert({ open: true, type: "error", message: response.message || "Stock unavailable" });
            }
        } catch (error) {
            console.error("Stock validation failed", error);
            if (error.response && error.response.status === 400 && error.response.data?.items?.stock_validation_failed === "True") {
                const issues = error.response.data.items.issues || [];
                // Create a formatted message from issues
                const issueMessages = issues.map(issue =>
                    `${issue.item_name}: ${issue.message}`
                ).join(". ");

                setAlert({
                    open: true,
                    type: "warning",
                    message: issueMessages || "Stock validation failed. Please check inventory."
                });
            } else {
                setAlert({
                    open: true,
                    type: "error",
                    message: error.response?.data?.message || "Failed to validate stock"
                });
            }
        } finally {
            setValidating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Filter items that have delivered_quantity > 0
        const itemsToBill = formData.items
            .filter(item => parseFloat(item.delivered_quantity) > 0)
            .map(item => ({
                work_order_item: item.work_order_item,
                delivered_quantity: parseFloat(item.delivered_quantity),
                remarks: item.remarks
            }));

        if (itemsToBill.length === 0) {
            setAlert({ open: true, type: "error", message: "Please enter quantity for at least one item." });
            setSubmitting(false);
            return;
        }

        const payload = {
            work_order: selectedWoId,
            bill_date: formData.bill_date,
            remarks: formData.remarks,
            items: itemsToBill
        };

        // Confirmation Logic
        setConfirm({
            open: true,
            title: "Create Bill?",
            description: "Are you sure you want to create this bill?",
            confirmButtonClass: "bg-blue-600 hover:bg-blue-700",
            iconBgClass: "bg-blue-100 text-blue-600",
            icon: FaCheckCircle,
            action: async () => {
                try {
                    await createBill(payload);
                    setAlert({ open: true, type: "success", message: "Bill created successfully!" });

                    // Reset and refresh
                    setSelectedWoId("");
                    setWoDetails(null);
                    setFormData({ ...formData, items: [], remarks: "" });

                    // Re-fetch WOs
                    const data = await getActiveWorkOrders(); // Using correct function directly for simplicity
                    const wos = Array.isArray(data) ? data : data.results || [];
                    const activeWOs = wos.filter(wo => wo.status !== 'COMPLETED');
                    setWorkOrders(activeWOs);
                } catch (error) {
                    console.error("Bill creation failed", error);
                    setAlert({ open: true, type: "error", message: "Failed to create bill" });
                } finally {
                    setSubmitting(false);
                    setConfirm({ ...confirm, open: false });
                }
            }
        });
        setSubmitting(false); // Wait for confirmation
    };

    return (
        <div className="p-1 max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h1 className="text-xl font-bold text-slate-800 mb-6">Create Work Order Bill</h1>

                {/* WO Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Select Work Order
                    </label>
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <select
                            value={selectedWoId}
                            onChange={handleWoChange}
                            className="w-full md:w-1/2 p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                        >
                            <option value="">-- Select Work Order --</option>
                            {workOrders.map(wo => (
                                <option key={wo.id} value={wo.id}>
                                    {wo.wo_number} - {wo.client_name}
                                </option>
                            ))}
                        </select>


                    </div>
                </div>



                {/* Bill Form */}
                {woDetails && (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
                                Bill Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        Client
                                    </label>
                                    <div className="font-semibold text-slate-800">{woDetails.client_name}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        WO Date
                                    </label>
                                    <div className="font-semibold text-slate-800">{woDetails.wo_date}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Bill Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.bill_date}
                                        onChange={(e) => setFormData({ ...formData, bill_date: e.target.value })}
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Remarks
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.remarks}
                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                        placeholder="Optional remarks"
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-sm text-left align-middle">
                                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4 min-w-[200px]">Item Details</th>
                                        <th className="px-6 py-4 text-center whitespace-nowrap">Stock</th>
                                        <th className="px-6 py-4 text-center whitespace-nowrap">Ordered</th>
                                        <th className="px-6 py-4 text-center whitespace-nowrap">Delivered</th>
                                        <th className="px-6 py-4 text-center whitespace-nowrap">Pending</th>
                                        <th className="px-6 py-4 w-32 text-center whitespace-nowrap">Delivering</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap">Rate</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap">Amount</th>
                                        <th className="px-6 py-4 min-w-[200px]">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {formData.items.map((item, index) => (
                                        <tr key={item.work_order_item} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{item.item_name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{item.item_code}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-cyan-600 font-bold">
                                                {item.current_stock !== null && item.current_stock !== undefined
                                                    ? item.current_stock
                                                    : "N/A"
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-600">
                                                {item.ordered_quantity}
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-600">
                                                {item.previously_delivered_quantity}
                                            </td>
                                            <td className="px-6 py-4 text-center text-blue-600 font-bold">
                                                {item.pending_quantity}
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={item.pending_quantity}
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={item.delivered_quantity}
                                                    onChange={(e) => handleItemChange(index, "delivered_quantity", e.target.value)}
                                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-center font-mono"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600">
                                                {item.rate}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600">
                                                {item.delivered_quantity * item.rate}
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    placeholder="Item remarks"
                                                    value={item.remarks}
                                                    onChange={(e) => handleItemChange(index, "remarks", e.target.value)}
                                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end pt-2 gap-4">
                            <button
                                type="button"
                                onClick={handleValidateStock}
                                disabled={validating || submitting}
                                className="px-8 py-3 bg-white text-cyan-600 font-bold rounded-xl border-2 border-cyan-100 hover:bg-cyan-50 hover:border-cyan-200 transition-all transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {validating ? "Validating..." : "Validate Stock"}
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || validating}
                                className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-lg shadow-cyan-200 disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95"
                            >
                                {submitting ? "Creating Bill..." : "Create Bill"}
                            </button>
                        </div>
                    </form>
                )}

            </div>

            {/* ALERTS & DIALOGS */}
            <AlertToast
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ ...alert, open: false })}
            />
            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                message={confirm.description}
                confirmText="Create Bill"
                confirmButtonClass={confirm.confirmButtonClass}
                iconBgClass={confirm.iconBgClass}
                icon={confirm.icon}
                onConfirm={confirm.action}
                onCancel={() => setConfirm({ ...confirm, open: false })}
                loading={submitting}
            />
        </div>
    );
};

export default CreateBill;
