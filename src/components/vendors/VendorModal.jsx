import { useEffect, useState } from "react";
import { createVendor, updateVendor } from "../../services/vendorService";
import AlertToast from "../ui/AlertToast";

const initialState = {
    vendor_code: "",
    vendor_name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    gst_number: "",
    pan_number: "",
};

export default function VendorModal({
    open,
    onClose,
    mode,
    vendor,
    onSuccess,
}) {
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, type: "error", message: "" });

    useEffect(() => {
        if (mode === "edit" && vendor) {
            setForm({
                vendor_code: vendor.vendor_code || "",
                vendor_name: vendor.vendor_name || "",
                contact_person: vendor.contact_person || "",
                phone: vendor.phone || "",
                email: vendor.email || "",
                address: vendor.address || "",
                gst_number: vendor.gst_number || "",
                pan_number: vendor.pan_number || "",
            });
        } else {
            setForm(initialState);
        }
        setErrors({});
    }, [mode, vendor, open]);

    if (!open) return null;

    const handleChange = (e) => {
        let { name, value } = e.target;

        // Enforce validations on input
        if (name === "phone") {
            // Only digits allowed
            value = value.replace(/\D/g, "");
        } else if (["gst_number", "pan_number", "vendor_code"].includes(name)) {
            // Force Uppercase
            value = value.toUpperCase();
        }

        setForm({ ...form, [name]: value });

        // Clear error when user types
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const validateForm = () => {
        let newErrors = {};
        let isValid = true;

        if (!form.vendor_code.trim()) {
            newErrors.vendor_code = "Vendor Code is required";
            isValid = false;
        }

        if (!form.vendor_name.trim()) {
            newErrors.vendor_name = "Vendor Name is required";
            isValid = false;
        }

        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Invalid email format";
            isValid = false;
        }

        if (form.phone && form.phone.length !== 10) {
            newErrors.phone = "Phone number must be exactly 10 digits";
            isValid = false;
        }

        if (form.gst_number && form.gst_number.length !== 15) {
            newErrors.gst_number = "GST number must be 15 uppercase characters";
            isValid = false;
        }

        if (form.pan_number && form.pan_number.length !== 10) {
            newErrors.pan_number = "PAN number must be 10 uppercase characters";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            if (mode === "edit") {
                await updateVendor(vendor.id, form);
            } else {
                await createVendor(form);
            }


            onSuccess(mode);
            onClose();
        } catch (err) {
            console.log(err);
            setToast({ open: true, type: "error", message: "Failed to save vendor" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-8 animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
                    {mode === "edit" ? "Edit Vendor" : "Add Vendor"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="label">Vendor Code <span className="text-red-500">*</span></label>
                            <input
                                className={`input ${errors.vendor_code ? "border-red-500 focus:ring-red-200" : ""}`}
                                name="vendor_code"
                                value={form.vendor_code}
                                onChange={handleChange}
                            />
                            {errors.vendor_code && <p className="text-xs text-red-500 mt-1">{errors.vendor_code}</p>}
                        </div>

                        <div>
                            <label className="label">Vendor Name <span className="text-red-500">*</span></label>
                            <input
                                className={`input ${errors.vendor_name ? "border-red-500 focus:ring-red-200" : ""}`}
                                name="vendor_name"
                                value={form.vendor_name}
                                onChange={handleChange}
                            />
                            {errors.vendor_name && <p className="text-xs text-red-500 mt-1">{errors.vendor_name}</p>}
                        </div>

                        <div>
                            <label className="label">Contact Person</label>
                            <input className="input" name="contact_person" value={form.contact_person} onChange={handleChange} />
                        </div>

                        <div>
                            <label className="label">Phone</label>
                            <input
                                className={`input ${errors.phone ? "border-red-500 focus:ring-red-200" : ""}`}
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="10 digit mobile number"
                            />
                            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input
                                className={`input ${errors.email ? "border-red-500 focus:ring-red-200" : ""}`}
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="example@domain.com"
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="label">GST Number</label>
                            <input
                                className={`input ${errors.gst_number ? "border-red-500 focus:ring-red-200" : ""}`}
                                name="gst_number"
                                value={form.gst_number}
                                onChange={handleChange}
                                placeholder="15 alphanumeric characters"
                            />
                            {errors.gst_number && <p className="text-xs text-red-500 mt-1">{errors.gst_number}</p>}
                        </div>

                        <div>
                            <label className="label">PAN Number</label>
                            <input
                                className={`input ${errors.pan_number ? "border-red-500 focus:ring-red-200" : ""}`}
                                name="pan_number"
                                value={form.pan_number}
                                onChange={handleChange}
                                placeholder="10 alphanumeric characters"
                            />
                            {errors.pan_number && <p className="text-xs text-red-500 mt-1">{errors.pan_number}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="label">Address</label>
                        <textarea
                            className="input w-full"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60 transition-colors shadow-sm"
                        >
                            {loading ? "Saving..." : "Save Vendor"}
                        </button>
                    </div>
                </form>

                <AlertToast
                    open={toast.open}
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast({ ...toast, open: false })}
                />
            </div>
        </div>
    );
}
