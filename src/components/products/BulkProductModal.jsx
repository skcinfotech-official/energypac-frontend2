import { useState, useEffect } from "react";
import { FaCloudDownloadAlt, FaCloudUploadAlt, FaTimes, FaFileExcel, FaSpinner, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { getBulkUploadTemplate, bulkUploadProducts } from "../../services/productService";
import { saveAs } from "file-saver";

const BulkProductModal = ({ open, onClose, onSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        if (!open) {
            setSelectedFile(null);
            setError(null);
            setSuccess(null);
        }
    }, [open]);

    const handleDownloadTemplate = async () => {
        setDownloading(true);
        setError(null);
        try {
            const res = await getBulkUploadTemplate();
            saveAs(res.data, "product_bulk_template.xlsx");
            setSuccess("Template downloaded successfully!");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to download template. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const res = await bulkUploadProducts(formData);
            setSuccess(res.data?.message || res.message || "Products uploaded successfully!");
            if (onSuccess) onSuccess();
            setSelectedFile(null); // Clear after success
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || err.response?.data?.detail || "Failed to upload file. Check your format.";
            setError(errorMsg);
        } finally {
            setUploading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                            <FaFileExcel className="text-xl" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Bulk Product Entry</h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors">
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    {/* Status Messages */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 animate-in slide-in-from-top-2">
                            <FaExclamationCircle className="shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 animate-in slide-in-from-top-2">
                            <FaCheckCircle className="shrink-0" />
                            <p className="text-sm font-medium">{success}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Download Template Step */}
                        <div className="flex flex-col items-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/10 transition-all group">
                            <div className="bg-slate-100 text-slate-500 p-4 rounded-full mb-4 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                <FaCloudDownloadAlt size={32} />
                            </div>
                            <h4 className="font-bold text-slate-800 mb-2">Step 1: Template</h4>
                            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                                Download the Excel template to ensure your data format is correct.
                            </p>
                            <button
                                onClick={handleDownloadTemplate}
                                disabled={downloading}
                                className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl hover:border-indigo-500 hover:text-indigo-600 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {downloading ? (
                                    <><FaSpinner className="animate-spin" /> Downloading...</>
                                ) : (
                                    <><FaCloudDownloadAlt /> Download Excel</>
                                )}
                            </button>
                        </div>

                        {/* Upload Step */}
                        <div className="flex flex-col items-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/10 transition-all group">
                            <div className="bg-slate-100 text-slate-500 p-4 rounded-full mb-4 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                <FaCloudUploadAlt size={32} />
                            </div>
                            <h4 className="font-bold text-slate-800 mb-2">Step 2: Select File</h4>
                            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                                Select your completed Excel file to proceed.
                            </p>
                            <label className={`w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all`}>
                                <FaCloudUploadAlt /> {selectedFile ? "Change File" : "Select Excel"}
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </label>
                            {selectedFile && (
                                <p className="mt-3 text-[11px] font-semibold text-emerald-600 truncate max-w-full">
                                    Selected: {selectedFile.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Important Instructions</h5>
                        <ul className="text-[11px] text-blue-800 space-y-1 ml-4 list-disc opacity-80">
                            <li>Keep headers unchanged in the Excel file.</li>
                            <li>Ensure all mandatory fields are filled correctly.</li>
                            {/* <li>Product codes must be unique and valid.</li> */}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={uploading || !selectedFile}
                        className={`px-6 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-md
                            ${uploading || !selectedFile
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}
                    >
                        {uploading ? (
                            <><FaSpinner className="animate-spin" /> Submitting...</>
                        ) : (
                            "Submit"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkProductModal;
