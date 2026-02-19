import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { createProduct, updateProduct } from "../../services/productService";


export default function ProductModal({
    open,
    onClose,
    onSuccess,
    mode = "add",        // "add" | "edit"
    product = null,      // product object for edit
}) {
    const [form, setForm] = useState({
        item_code: "",
        item_name: "",
        description: "",
        hsn_code: "",
        unit: "PCS",
        current_stock: "",
        reorder_level: "",
        rate: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /* =========================
       PREFILL FORM (EDIT MODE)
       ========================= */
    useEffect(() => {
    if (!open) return;

    if (mode === "edit" && product) {
        setForm({
            item_code: product.item_code || "",
            item_name: product.item_name || "",
            description: product.description || "",
            hsn_code: product.hsn_code || "",
            unit: product.unit || "PCS",
            current_stock: product.current_stock ?? "",
            reorder_level: product.reorder_level ?? "",
            rate: product.rate ?? "",
        });
    } else {
        // ADD MODE → CLEAR FORM
        setForm({
            item_code: "",
            item_name: "",
            description: "",
            hsn_code: "",
            unit: "PCS",
            current_stock: "",
            reorder_level: "",
            rate: "",
        });
    }
}, [open, mode, product]);



    if (!open) return null;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };



    /* =========================
       SUBMIT (ADD / EDIT)
       ========================= */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setLoading(true);

            const payload = {
                ...form,
                current_stock: Number(form.current_stock),
                reorder_level: Number(form.reorder_level),
                rate: Number(form.rate),
            };

            if (mode === "edit") {
                await updateProduct(product.id, payload);
            } else {
                await createProduct(payload);
            }

            onSuccess(mode);
            onClose();

        } catch (err) {
            setError(err.response?.data?.detail || "Failed to save product");
            onSuccess("error");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col">

                {/* HEADER */}
                <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-slate-800">
                        {mode === "edit" ? "Edit Product" : "Add Product"}
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-red-500">
                        <FaTimes />
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Item Code *
                            </label>
                            <input
                                name="item_code"
                                value={form.item_code}
                                placeholder="e.g. ITEM007"
                                onChange={handleChange}
                                required
                                className="input"
                            />

                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Item Name *
                            </label>
                            <input
                                name="item_name"
                                value={form.item_name}
                                placeholder="e.g. Industrial Cable"
                                onChange={handleChange}
                                required
                                className="input"
                            />

                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                HSN Code
                            </label>
                            <input
                                name="hsn_code"
                                value={form.hsn_code}
                                placeholder="e.g. 1234"
                                onChange={handleChange}
                                className="input"
                            />

                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Unit ( in PCS / KG etc)
                            </label>
                            <input
                                name="unit"
                                value={form.unit}
                                placeholder="e.g. PCS / KG"
                                onChange={handleChange}
                                className="input"
                            />

                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Current Stock
                            </label>
                            <input
                                type="number"
                                name="current_stock"
                                value={form.current_stock}
                                placeholder="e.g. 100"
                                onChange={handleChange}
                                className="input"
                            />

                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Reorder Level
                            </label>
                            <input
                                type="number"
                                name="reorder_level"
                                value={form.reorder_level}
                                placeholder="e.g. 20"
                                onChange={handleChange}
                                className="input"
                            />

                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Rate
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="rate"
                                value={form.rate}
                                placeholder="e.g. 150.00"
                                onChange={handleChange}
                                className="input"
                            />

                        </div>

                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            placeholder="e.g. High quality industrial cable"
                            onChange={handleChange}
                            rows={3}
                            className="input w-full"
                        />

                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <hr className="border-slate-200" />

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-60"
                        >
                            {loading
                                ? "Saving..."
                                : mode === "edit"
                                    ? "Update Product"
                                    : "Save Product"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
