import React, { useState } from "react";
import { FaTimes, FaPlus, FaSave } from "react-icons/fa";

const AddNewItemModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        item_name: "",
        item_code: "",
        description: "",
        hsn_code: "",
        unit: "",
        remarks: "",
        rate: 0
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        // Reset form
        setFormData({
            item_name: "",
            item_code: "",
            description: "",
            hsn_code: "",
            unit: "",
            remarks: "",
            rate: 0
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h3 className="text-lg font-bold text-slate-800">Add New Item Details</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-all">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Item Name *</label>
                            <input
                                type="text"
                                name="item_name"
                                required
                                placeholder="Item Name"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={formData.item_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Item Code</label>
                            <input
                                type="text"
                                name="item_code"
                                placeholder="Item Code"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={formData.item_code}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">HSN Code</label>
                            <input
                                type="text"
                                name="hsn_code"
                                placeholder="HSN Code"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={formData.hsn_code}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Unit</label>
                            <input
                                type="text"
                                name="unit"
                                placeholder="e.g. PCS, NOS"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={formData.unit}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Rate</label>
                            <input
                                type="number"
                                name="rate"
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-right"
                                value={formData.rate}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                            <textarea
                                name="description"
                                placeholder="Item Description"
                                rows="2"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
                            <input
                                type="text"
                                name="remarks"
                                placeholder="Optional remarks"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={formData.remarks}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all text-sm flex items-center gap-2"
                        >
                            <FaSave /> Add Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddNewItemModal;
