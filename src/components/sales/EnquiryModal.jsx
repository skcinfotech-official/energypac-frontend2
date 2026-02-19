import { useState } from "react";
import { FaTimes, FaCloudUploadAlt } from "react-icons/fa";
import { createClientQuery } from "../../services/salesService";

const EnquiryModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        client_name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        query_date: "",
        remarks: "",
        pdf_upload: null,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const newErrors = {};
        if (!formData.client_name) newErrors.client_name = "Client Name is required";
        if (!formData.contact_person) newErrors.contact_person = "Contact Person is required";
        if (!formData.phone) {
            newErrors.phone = "Phone is required";
        } else if (!/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = "Invalid phone number (10 digits)";
        }
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Invalid email address";
        }
        if (!formData.address) newErrors.address = "Address is required";
        if (!formData.query_date) newErrors.query_date = "Query Date is required";

        // Require at least one: PDF or Remarks
        if (!formData.pdf_upload && !formData.remarks?.trim()) {
            newErrors.pdf_upload = "Please upload a PDF or provide remarks";
            newErrors.remarks = "Please provide remarks or upload a PDF";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        let updatedValue = value;

        if (name === "pdf_upload") {
            updatedValue = files[0];
            setFormData(prev => ({ ...prev, pdf_upload: updatedValue }));
        } else if (name === "phone") {
            updatedValue = value.replace(/\D/g, "");
            setFormData(prev => ({ ...prev, phone: updatedValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear error logic
        setErrors(prevErrors => {
            const newErrors = { ...prevErrors };

            // If changing pdf_upload or remarks, check if we can clear both errors
            if (name === "pdf_upload" || name === "remarks") {
                const hasPdf = name === "pdf_upload" ? updatedValue : formData.pdf_upload;
                const hasRemarks = name === "remarks" ? updatedValue : formData.remarks;

                if (hasPdf || hasRemarks?.trim()) {
                    delete newErrors.pdf_upload;
                    delete newErrors.remarks;
                }
            } else {
                // Standard field error clearing
                if (newErrors[name]) delete newErrors[name];
            }

            return newErrors;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach((key) => {
                data.append(key, formData[key]);
            });

            await createClientQuery(data);
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                client_name: "",
                contact_person: "",
                phone: "",
                email: "",
                address: "",
                query_date: "",
                remarks: "",
                pdf_upload: null,
            });
        } catch (error) {
            console.error("Failed to submit enquiry", error);
            // Handle specific backend errors if needed
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800">New Client Query</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Client Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Client Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="client_name"
                                value={formData.client_name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.client_name ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200"
                                    } focus:border-blue-500 focus:ring-4 transition-all outline-none`}
                                placeholder="Enter client name"
                            />
                            {errors.client_name && <p className="text-xs text-red-500 mt-1">{errors.client_name}</p>}
                        </div>

                        {/* Contact Person */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Contact Person <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="contact_person"
                                value={formData.contact_person}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.contact_person ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200"
                                    } focus:border-blue-500 focus:ring-4 transition-all outline-none`}
                                placeholder="Enter contact person"
                            />
                            {errors.contact_person && <p className="text-xs text-red-500 mt-1">{errors.contact_person}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.phone ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200"
                                    } focus:border-blue-500 focus:ring-4 transition-all outline-none`}
                                placeholder="Enter phone number"
                            />
                            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.email ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200"
                                    } focus:border-blue-500 focus:ring-4 transition-all outline-none`}
                                placeholder="Enter email address"
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>

                        {/* Query Date */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Query Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="query_date"
                                type="date"
                                value={formData.query_date}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.query_date ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200"
                                    } focus:border-blue-500 focus:ring-4 transition-all outline-none`}
                            />
                            {errors.query_date && <p className="text-xs text-red-500 mt-1">{errors.query_date}</p>}
                        </div>

                        {/* PDF Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Upload PDF <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    name="pdf_upload"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleChange}
                                    className="hidden"
                                    id="pdf-upload"
                                    required
                                />
                                <label
                                    htmlFor="pdf-upload"
                                    className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-dashed cursor-pointer ${errors.pdf_upload ? "border-red-300 bg-red-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                                        } transition-all`}
                                >
                                    <FaCloudUploadAlt className="text-slate-500 text-lg" />
                                    <span className="text-sm text-slate-600">
                                        {formData.pdf_upload ? formData.pdf_upload.name : "Choose PDF file"}
                                    </span>
                                </label>
                            </div>
                            {errors.pdf_upload && <p className="text-xs text-red-500 mt-1">{errors.pdf_upload}</p>}
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows="2"
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.address ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200"
                                    } focus:border-blue-500 focus:ring-4 transition-all outline-none`}
                                placeholder="Enter full address"
                            />
                            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                        </div>

                        {/* Remarks */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Remarks
                            </label>
                            <textarea
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleChange}
                                rows="3"
                                className={`w-full px-4 py-2.5 rounded-lg border ${errors.remarks ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200"
                                    } focus:border-blue-500 focus:ring-4 transition-all outline-none`}
                                placeholder="Enter remarks"
                            />
                            {errors.remarks && <p className="text-xs text-red-500 mt-1">{errors.remarks}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Submitting..." : "Submit Query"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EnquiryModal;
