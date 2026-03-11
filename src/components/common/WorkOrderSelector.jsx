import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getWorkOrders } from "../../services/salesService";
import { HiSearch, HiX } from "react-icons/hi";

const WorkOrderSelector = ({ value, onChange, placeholder = "Search work order...", defaultItem = null, status = "ACTIVE" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: 'bottom' });
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !event.target.closest(".wo-selector-portal")
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const calculatePosition = () => {
            if (isOpen && dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;
                const dropdownMaxHeight = 250;

                let placement = 'bottom';
                if (spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow) {
                    placement = 'top';
                }

                setCoords({
                    top: rect.bottom,
                    bottom: rect.top,
                    left: rect.left,
                    width: rect.width,
                    placement
                });
            }
        };

        if (isOpen) {
            calculatePosition();
            window.addEventListener('scroll', calculatePosition, true);
            window.addEventListener('resize', calculatePosition);
        }

        return () => {
            window.removeEventListener('scroll', calculatePosition, true);
            window.removeEventListener('resize', calculatePosition);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const fetchItems = async () => {
            if (workOrders.length === 0) setLoading(true);
            try {
                // We use search if present, otherwise just fetch active
                const res = await getWorkOrders(1, search, status);
                const data = res.results || res.data || [];
                setWorkOrders(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch work orders:", err);
            } finally {
                setLoading(false);
            }
        };

        if (search === "" && workOrders.length === 0) {
            fetchItems();
        } else {
            const timeoutId = setTimeout(fetchItems, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [search, isOpen, status]);

    const findWO = (id) => {
        return workOrders.find((w) => String(w.id) === String(id) || w.uuid === id);
    };

    const selectedWO = findWO(value) || defaultItem;

    const dropdownContent = isOpen && coords.width > 0 && (
        <div
            className="wo-selector-portal fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col"
            style={{
                top: coords.placement === 'bottom' ? coords.top + 4 : 'auto',
                bottom: coords.placement === 'top' ? (window.innerHeight - coords.bottom) + 4 : 'auto',
                left: coords.left,
                width: coords.width,
                maxHeight: '250px'
            }}
        >
            <div className="sticky top-0 bg-white p-2 border-b border-slate-100 shrink-0">
                <div className="relative">
                    <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        autoFocus
                        type="text"
                        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border-none rounded-md focus:ring-1 focus:ring-blue-500"
                        placeholder="Type to search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-y-auto max-h-[200px] py-1">
                {loading ? (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">Loading...</div>
                ) : workOrders.length > 0 ? (
                    workOrders.map((w) => (
                        <div
                            key={w.id || w.uuid}
                            className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-50 last:border-none"
                            onClick={() => {
                                onChange(w.id || w.uuid, w);
                                setIsOpen(false);
                                setSearch("");
                            }}
                        >
                            <div className="font-medium text-slate-900">{w.wo_number}</div>
                            <div className="text-xs text-slate-500 flex items-center justify-between mt-0.5">
                                <span>{w.client_name}</span>
                                <span className="font-mono text-blue-600 font-semibold">₹{w.total_amount}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">No work orders found</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div
                className="input flex items-center justify-between cursor-pointer min-h-[42px]"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={!selectedWO ? "text-slate-400 truncate" : "text-slate-800 truncate"}>
                    {selectedWO ? `${selectedWO.wo_number} - ${selectedWO.client_name}` : placeholder}
                </span>
                {value && (
                    <HiX
                        className="text-slate-400 hover:text-slate-600 ml-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange("", null);
                            setSearch("");
                        }}
                    />
                )}
            </div>

            {isOpen && createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default WorkOrderSelector;
