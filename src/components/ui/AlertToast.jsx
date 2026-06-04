import { FaCheckCircle, FaTimesCircle, FaTimes } from "react-icons/fa";
import { useEffect, useState } from "react";

export default function AlertToast({
  open,
  type = "success",
  message,
  onClose,
  duration = 4000,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [open, duration, onClose]);

  if (!open) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed top-5 right-5 z-[9999] pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center gap-3 pl-5 pr-3 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold max-w-sm transition-all duration-300
          ${visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}
          ${isSuccess
            ? "bg-emerald-600 text-white shadow-emerald-500/25"
            : "bg-red-600 text-white shadow-red-500/25"}
        `}
      >
        {isSuccess ? <FaCheckCircle className="text-lg shrink-0" /> : <FaTimesCircle className="text-lg shrink-0" />}
        <span className="flex-1">{message}</span>
        <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors shrink-0">
          <FaTimes className="text-xs" />
        </button>
      </div>
    </div>
  );
}
