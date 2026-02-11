import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getProducts } from "../../services/productService";
import { HiSearch, HiX } from "react-icons/hi";

const ProductSelector = ({ value, onChange, placeholder = "Search product...", defaultItem = null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: 'bottom' });
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !event.target.closest(".product-selector-portal")
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Initial fetch to get the selected product details
    useEffect(() => {
        const calculatePosition = () => {
            if (isOpen && dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;
                const dropdownMaxHeight = 250;

                // Determine placement based on available space
                // Default to bottom, switch to top if space below is tight and space above is better
                let placement = 'bottom';
                if (spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow) {
                    placement = 'top';
                }

                setCoords({
                    top: rect.bottom, // Viewport coords (for fixed)
                    bottom: rect.top, // Viewport coords (for fixed)
                    left: rect.left,
                    width: rect.width,
                    placement
                });
            }
        };

        if (isOpen) {
            calculatePosition();
            // Update position on scroll/resize to keep it attached (since we use fixed)
            window.addEventListener('scroll', calculatePosition, true);
            window.addEventListener('resize', calculatePosition);
        }

        return () => {
            window.removeEventListener('scroll', calculatePosition, true);
            window.removeEventListener('resize', calculatePosition);
        };
    }, [isOpen]);

    // ... (rest of fetch logic remains similar, ensuring useEffects are closed properly)

    // Initial fetch to get selected product details if not present
    useEffect(() => {
        const fetchInitial = async () => {
            if (!value) return;

            // If we already have the item details via defaultItem, we might not strictly need to fetch,
            // but fetching ensures we have the latest data and if the user opens the dropdown, the list is prepped.
            // However, to reduce flickering/calls, we can skip if defaultItem matches value.
            if (defaultItem && (String(defaultItem.id) === String(value) || defaultItem.uuid === value)) {
                // But wait, we still want the 'products' array to be populated if they open the menu? 
                // Actually, lazy load on open is handled by the other useEffect (if isOpen).
                // So we can skip this if we rely on defaultItem for display!
                return;
            }

            // Check if product exists in current list
            const exists = products.find(p => String(p.id) === String(value) || p.uuid === value);

            if (!exists) {
                try {
                    // Fetch generic list first (optimize later with specific ID endpoint if available)
                    const res = await getProducts();
                    const allProducts = res.data.results || res.data || [];

                    // Note: if pagination is heavy, this might miss the item if it's on page 2.
                    // For now, we assume the initial list (often page 1) or a full list is returned if no page param.
                    // If your backend supports /api/products/ID, we should use that instead.

                    setProducts(allProducts);

                } catch (err) {
                    console.error("Failed to load initial products", err);
                }
            }
        };
        fetchInitial();
    }, [value, defaultItem, products]);

    useEffect(() => {
        if (!isOpen) return;
        const fetchItems = async () => {
            setLoading(true);
            try {
                const res = await getProducts({ search });
                const data = res.data.results || res.data;
                setProducts(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch products:", err);
            } finally {
                setLoading(false);
            }
        };
        const timeoutId = setTimeout(fetchItems, 300);
        return () => clearTimeout(timeoutId);
    }, [search, isOpen]);

    const foundProduct = products.find((p) => String(p.id) === String(value) || p.uuid === value);
    const selectedProduct = foundProduct || defaultItem;

    // Dropdown Content
    const dropdownContent = isOpen && (
        <div
            className="product-selector-portal fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col"
            style={{
                top: coords.placement === 'bottom' ? coords.top : 'auto',
                bottom: coords.placement === 'top' ? (window.innerHeight - coords.bottom) : 'auto',
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

            {/* Scrollable List */}
            <div className="overflow-y-auto max-h-[200px] py-1">
                {loading ? (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">Loading...</div>
                ) : products.length > 0 ? (
                    products.map((p) => (
                        <div
                            key={p.id || p.uuid}
                            className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer transition-colors"
                            onClick={() => {
                                onChange(p.uuid || p.id, p);
                                setIsOpen(false);
                                setSearch("");
                            }}
                        >
                            <div className="font-medium text-slate-900">{p.item_name}</div>
                            <div className="text-xs text-slate-500 flex items-center justify-between">
                                <span>{p.item_code || "No code"}</span>
                                <span className={p.current_stock > 0 ? "text-emerald-600 font-medium" : "text-red-500"}>
                                    Stock: {p.current_stock ?? '-'}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">No products found</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div
                className="input flex items-center justify-between cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={!selectedProduct ? "text-slate-400" : "text-slate-800"}>
                    {selectedProduct ? `${selectedProduct.item_name} (${selectedProduct.item_code || "N/A"})` : placeholder}
                </span>
                {value && (
                    <HiX
                        className="text-slate-400 hover:text-slate-600 ml-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange("");
                            setSearch("");
                        }}
                    />
                )}
            </div>

            {isOpen && createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default ProductSelector;
