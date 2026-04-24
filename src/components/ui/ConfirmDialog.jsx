import { FaExclamationTriangle } from "react-icons/fa";

export default function ConfirmDialog({
  open,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
  icon: Icon = FaExclamationTriangle, // Renamed to PascalCase for component usage
  confirmButtonClass = "bg-red-600 hover:bg-red-500", // Default dangerous style
  iconBgClass = "bg-red-100 text-red-600" // Default dangerous style
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <div className={`p-2 rounded-full ${iconBgClass}`}>
            <Icon />
          </div>
          <h3 className="font-bold text-slate-800">{title}</h3>
        </div>

        {/* BODY */}
        <div className="px-6 py-4 text-sm text-slate-600">
          {message}
        </div>

        {/* ACTIONS */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-60 ${confirmButtonClass}`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
