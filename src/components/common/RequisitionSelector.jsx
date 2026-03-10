import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fetchRequisitions } from "../../services/requisition";
import { HiSearch, HiX } from "react-icons/hi";

const RequisitionSelector = ({
  value,
  onChange,
  placeholder = "Select requisition...",
  defaultItem = null,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const inputRef = useRef(null);

  /* OUTSIDE CLICK */
  useEffect(() => {
    const handleClick = (e) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target) &&
        !e.target.closest(".requisition-selector-portal")
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* POSITION */
  useEffect(() => {
    if (open && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open]);

  /* FETCH */
  useEffect(() => {
    if (!open) return;

    const fetchItems = async () => {
      if (requisitions.length === 0) setLoading(true);
      try {
        const res = await fetchRequisitions(1, search);
        setRequisitions(res.data.results || []);
      } catch (err) {
        console.error("Failed to fetch requisitions", err);
      } finally {
        setLoading(false);
      }
    };

    if (search === "" && requisitions.length === 0) {
      fetchItems();
    } else {
      const t = setTimeout(fetchItems, 300);
      return () => clearTimeout(t);
    }
  }, [search, open]);

  const selected =
    requisitions.find((r) => r.id === value) ||
    (defaultItem && defaultItem.id === value ? defaultItem : null);

  const dropdown = (
    <div
      className="requisition-selector-portal fixed z-9999 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
      style={{
        top: coords.top + 4,
        left: coords.left,
        width: coords.width,
      }}
    >
      <div className="sticky top-0 bg-white p-2 border-b">
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-md focus:ring-1 focus:ring-blue-500"
            placeholder="Search requisition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-sm text-center text-slate-500">Loading...</div>
      ) : requisitions.length ? (
        requisitions.map((r) => (
          <div
            key={r.id}
            className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer"
            onClick={() => {
              onChange(r.id, r);
              setOpen(false);
              setSearch("");
            }}
          >
            <div className="font-medium text-slate-900">
              {r.requisition_number}
            </div>
            <div className="text-xs text-slate-500">
              {r.requisition_date} • {r.total_items} items
            </div>
          </div>
        ))
      ) : (
        <div className="p-4 text-sm text-center text-slate-500">
          No requisitions found
        </div>
      )}
    </div>
  );

  return (
    <div ref={inputRef} className="relative w-full">
      <div
        className={`input flex items-center justify-between ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
          }`}
        onClick={() => !disabled && setOpen(true)}
      >
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {selected ? selected.requisition_number : placeholder}
        </span>

        {value && !disabled && (
          <HiX
            className="text-slate-400 hover:text-slate-600"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setSearch("");
            }}
          />
        )}
      </div>

      {open && !disabled && coords.width > 0 && createPortal(dropdown, document.body)}
    </div>
  );
};

export default RequisitionSelector;
