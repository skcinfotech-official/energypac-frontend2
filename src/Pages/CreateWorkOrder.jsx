import React, { useState, useEffect } from "react";
import {
    getClientQuotations,
    getWorkOrderByQuotation,
    getClientQuotationById,
    createWorkOrder
} from "../services/salesService";
import AlertToast from "../components/ui/AlertToast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { FaCheckCircle } from 'react-icons/fa';

const CreateWorkOrder = () => {
    const [quotations, setQuotations] = useState([]);
    const [selectedQuotation, setSelectedQuotation] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);

    // State for existing work order
    const [existingWorkOrder, setExistingWorkOrder] = useState(null);

    // State for new work order form
    const [formData, setFormData] = useState({
        wo_date: new Date().toISOString().split("T")[0],
        advance_amount: "",
        remarks: "",
        items: [] // Will be populated from quotation items
    });

    // Custom UI State
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
    const [confirm, setConfirm] = useState({ open: false, action: null });

    useEffect(() => {
        // Fetch all client quotations for the dropdown
        const fetchQuotations = async () => {
            try {
                // Fetching all quotations - you might want to increase limit or implement search
                const data = await getClientQuotations(1, "", "ACCEPTED");
                if (data && data.results) {
                    setQuotations(data.results);
                }
            } catch (error) {
                console.error("Error fetching quotations", error);
                setAlert({ open: true, type: "error", message: "Failed to load quotations" });
            }
        };
        fetchQuotations();
    }, []);

    const handleQuotationChange = async (e) => {
        const quotationId = e.target.value;
        setSelectedQuotation(quotationId);
        setExistingWorkOrder(null);
        setFormData(prev => ({ ...prev, items: [], advance_amount: "", remarks: "" }));

        if (!quotationId) return;

        setChecking(true);
        try {
            // Check if WO exists
            const response = await getWorkOrderByQuotation(quotationId);

            if (response.exists) {
                setExistingWorkOrder(response.work_order);
                const wo = response.work_order;
                setFormData({
                    wo_date: wo.wo_date,
                    advance_amount: wo.advance_amount,
                    remarks: wo.remarks || "",
                    items: wo.items.map(item => ({
                        quotation_item: item.id, // Or item.product if that's what's needed, but for display it's fine
                        item_name: item.item_name,
                        item_code: item.item_code,
                        ordered_quantity: item.ordered_quantity || item.quantity, // Handle different field names if any
                        rate: item.rate,
                        remarks: item.remarks || "",
                        original_quantity: item.ordered_quantity,
                        original_rate: item.rate,
                        stock_quantity: item.stock_quantity || item.product_details?.current_stock || 0
                    }))
                });
            } else {
                // If not exists, fetch quotation details to populate items
                const quotationDetails = await getClientQuotationById(quotationId);

                if (quotationDetails && quotationDetails.items) {
                    // Map quotation items to form items
                    const formItems = quotationDetails.items.map(item => ({
                        quotation_item: item.id,
                        item_name: item.item_name, // For display
                        item_code: item.item_code, // For display
                        ordered_quantity: item.quantity,
                        rate: item.rate,
                        remarks: "",
                        original_quantity: item.quantity, // To show reference
                        original_rate: item.rate, // To show reference
                        stock_quantity: item.stock_quantity || item.product_details?.current_stock || 0
                    }));

                    setFormData(prev => ({
                        ...prev,
                        items: formItems
                    }));
                }
            }
        } catch (error) {
            console.error("Error checking work order", error);
            // If 404, it might mean the endpoint returns 404 for not found, but user said it returns { exists: false }
            // If the API throws 404 for "not found" instead of { exists: false }, handle it.
            // Assuming user spec "if not exists -> post", implies the get returns { exists: false }
            // If the API throws 404 for "not found" instead of { exists: false }, handle it.
            // Assuming user spec "if not exists -> post", implies the get returns { exists: false }
            setAlert({ open: true, type: "error", message: "Error checking work order status" });
        } finally {
            setChecking(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            sales_quotation: selectedQuotation,
            wo_date: formData.wo_date,
            advance_amount: parseFloat(formData.advance_amount) || 0,
            remarks: formData.remarks,
            items: formData.items.map(item => ({
                quotation_item: item.quotation_item,
                ordered_quantity: parseFloat(item.ordered_quantity),
                rate: parseFloat(item.rate),
                remarks: item.remarks
            }))
        };

        try {
            // Trigger Confirmation Dialog
            setConfirm({
                open: true,
                title: "Create Work Order?",
                description: "Are you sure you want to create this Work Order?",
                confirmButtonClass: "bg-blue-600 hover:bg-blue-700",
                iconBgClass: "bg-blue-100 text-blue-600",
                icon: FaCheckCircle,
                action: async () => {
                    try {
                        await createWorkOrder(payload);
                        setAlert({ open: true, type: "success", message: "Work Order created successfully!" });
                        // Refresh logic - maybe fetch the newly created WO
                        const response = await getWorkOrderByQuotation(selectedQuotation);
                        if (response.exists) {
                            setExistingWorkOrder(response.work_order);
                        }
                    } catch (error) {
                        console.error("Failed to create work order", error);
                        setAlert({ open: true, type: "error", message: "Failed to create Work Order" });
                    } finally {
                        setLoading(false);
                        setConfirm({ open: false, action: null });
                    }
                }
            });
            setLoading(false); // Stop loading locally until confirmed

        } catch (error) {
            console.error("Preparation failed", error);
            setLoading(false);
        }
    };

    return (
        <div className="p-1 max-w-7xl mx-auto space-y-6">


            {/* Quotation Selection */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h1 className="text-lg font-bold text-slate-800 pb-2">Check And Create Work Order</h1>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Select Client Quotation <span className="text-slate-500">( Showing quotations which are accepted )</span>
                </label>
                <select
                    value={selectedQuotation}
                    onChange={handleQuotationChange}
                    className="w-full md:w-1/2 p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={checking}
                >
                    <option value="">-- Select Quotation --</option>
                    {quotations.map((q) => (
                        <option key={q.id} value={q.id}>
                            {q.quotation_number} - {q.client_name} ({q.quotation_date})
                        </option>
                    ))}
                </select>
                {checking && <p className="text-sm text-blue-600 mt-2">Checking work order status...</p>}
            </div>

            {/* Create or View Work Order Form */}
            {selectedQuotation && !checking && formData.items.length > 0 && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800">
                            {existingWorkOrder ? "Work Order Details" : "New Work Order Details"}
                        </h2>
                        {existingWorkOrder && (
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-200">
                                    {existingWorkOrder.status}
                                </span>
                                <span className="text-slate-500 font-mono text-sm">
                                    {existingWorkOrder.wo_number}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Work Order Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="wo_date"
                                type="date"
                                required
                                value={formData.wo_date}
                                onChange={handleInputChange}
                                disabled={!!existingWorkOrder}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Advance Amount <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="advance_amount"
                                type="number"
                                step="0.01"
                                required
                                value={formData.advance_amount}
                                onChange={handleInputChange}
                                placeholder="0.00"
                                disabled={!!existingWorkOrder}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Remarks
                            </label>
                            <textarea
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleInputChange}
                                rows="2"
                                disabled={!!existingWorkOrder}
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                placeholder="Optional remarks"
                            />
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Order Items</h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="bg-slate-50 text-slate-700 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Item</th>
                                        <th className="px-7 py-3 w-32 whitespace-nowrap">Current Stock</th>
                                        <th className="px-4 py-3 w-32">Qty</th>
                                        <th className="px-4 py-3 w-40">Rate</th>
                                        <th className="px-4 py-3 w-40">Total</th>
                                        <th className="px-4 py-3">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, index) => (
                                        <tr key={index} className="border-b hover:bg-slate-50 last:border-b-0">
                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                {item.item_name}
                                                <div className="text-xs text-slate-500">{item.item_code}</div>
                                            </td>
                                            <td className="px-7 py-3 font-medium text-slate-900">
                                                <div className="text-sm text-blue-500">{item.stock_quantity}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.ordered_quantity}
                                                    onChange={(e) => handleItemChange(index, "ordered_quantity", e.target.value)}
                                                    disabled={!!existingWorkOrder}
                                                    className="w-full p-1.5 border border-slate-300 rounded focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                                />
                                            </td>

                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                                                    disabled={!!existingWorkOrder}
                                                    className="w-full p-1.5 border border-slate-300 rounded focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-semibold">
                                                {((parseFloat(item.ordered_quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.remarks}
                                                    onChange={(e) => handleItemChange(index, "remarks", e.target.value)}
                                                    disabled={!!existingWorkOrder}
                                                    className="w-full p-1.5 border border-slate-300 rounded focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                                    placeholder="Item remarks"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {!existingWorkOrder && (
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 transition-all"
                            >
                                {loading ? "Creating..." : "Create Work Order"}
                            </button>
                        </div>
                    )}
                </form>
            )}
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
                confirmText="Create"
                confirmButtonClass={confirm.confirmButtonClass}
                iconBgClass={confirm.iconBgClass}
                icon={confirm.icon}
                onConfirm={confirm.action}
                onCancel={() => setConfirm({ ...confirm, open: false })}
                loading={loading}
            />
        </div>
    );
};

export default CreateWorkOrder;
