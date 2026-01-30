import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getVendors } from "../../services/vendorService";
import { HiSearch, HiX } from "react-icons/hi";

const VendorSelector = ({
  value,
  onChange,
  placeholder = "Search vendor...",
  defaultItem = null,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const inputRef = useRef(null);

  /* =========================
     OUTSIDE CLICK
     ========================= */
  useEffect(() => {
    const handleClick = (e) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target) &&
        !e.target.closest(".vendor-selector-portal")
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* =========================
     POSITION
     ========================= */
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

  /* =========================
     FETCH
     ========================= */
  useEffect(() => {
    if (!open) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getVendors({ search });
        // getVendors returns the data object directly (normalized), not the axios response
        setVendors(res.results || res || []);
      } catch (e) {
        console.error("Failed to load vendors", e);
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(fetch, 300);
    return () => clearTimeout(t);
  }, [search, open]);

  const selected =
    vendors.find((v) => v.id === value) ||
    (defaultItem && defaultItem.id === value ? defaultItem : null);

  /* =========================
     DROPDOWN
     ========================= */
  const dropdown = (
    <div
      className="vendor-selector-portal fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
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
            placeholder="Search vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-sm text-center text-slate-500">
          Loading...
        </div>
      ) : vendors.length ? (
        vendors.map((v) => (
          <div
            key={v.id}
            className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer"
            onClick={() => {
              onChange(v.id, v);
              setOpen(false);
              setSearch("");
            }}
          >
            <div className="font-medium">{v.vendor_name}</div>
            <div className="text-xs text-slate-500">
              {v.vendor_code || "No code"}
            </div>
          </div>
        ))
      ) : (
        <div className="p-4 text-sm text-center text-slate-500">
          No vendors found
        </div>
      )}
    </div>
  );

  return (
    <div ref={inputRef} className="relative w-full">
      <div
        className="input flex items-center justify-between cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {selected
            ? `${selected.vendor_name} (${selected.vendor_code || "N/A"})`
            : placeholder}
        </span>

        {value && (
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

      {open && createPortal(dropdown, document.body)}
    </div>
  );
};

export default VendorSelector;
