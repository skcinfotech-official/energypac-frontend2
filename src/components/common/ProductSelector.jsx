import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getProducts, createProduct } from "../../services/productService";
import { HiSearch, HiX, HiPlus } from "react-icons/hi";

const ProductSelector = ({ value, onChange, placeholder = "Search product...", defaultItem = null, excludeIds = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: 'bottom' });
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddForm, setQuickAddForm] = useState({ item_name: "", unit: "PCS" });
    const [quickAddLoading, setQuickAddLoading] = useState(false);
    const [quickAddError, setQuickAddError] = useState("");
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
            if (products.length === 0) setLoading(true);
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

        if (search === "" && products.length === 0) {
            fetchItems();
        } else {
            const timeoutId = setTimeout(fetchItems, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [search, isOpen]);
    
    // Filter out excluded IDs and sort alphabetically
    const filteredProducts = products
        .filter(p => !excludeIds.includes(p.uuid || p.id))
        .sort((a, b) => (a.item_name || "").localeCompare(b.item_name || ""));

    const foundProduct = products.find((p) => String(p.id) === String(value) || p.uuid === value);
    const selectedProduct = foundProduct || defaultItem;

    const handleQuickAdd = async () => {
        if (!quickAddForm.item_name.trim()) {
            setQuickAddError("Item name is required");
            return;
        }
        setQuickAddLoading(true);
        setQuickAddError("");
        try {
            const res = await createProduct({
                item_name: quickAddForm.item_name.trim(),
                unit: quickAddForm.unit,
            });
            const newProduct = res.data;
            setProducts(prev => [newProduct, ...prev]);
            onChange(newProduct.id, newProduct);
            setShowQuickAdd(false);
            setQuickAddForm({ item_name: "", unit: "PCS" });
            setIsOpen(false);
            setSearch("");
        } catch (err) {
            const msg = err.response?.data?.item_name?.[0] || err.response?.data?.detail || err.response?.data?.error || "Failed to create product";
            setQuickAddError(msg);
        } finally {
            setQuickAddLoading(false);
        }
    };

    // Dropdown Content
    const dropdownContent = isOpen && coords.width > 0 && (
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

            {/* Quick Add Form */}
            {showQuickAdd ? (
                <div className="p-3 border-b border-slate-100 bg-blue-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Quick Add New Item</span>
                        <button type="button" onClick={() => { setShowQuickAdd(false); setQuickAddError(""); }} className="text-slate-400 hover:text-slate-600">
                            <HiX size={14} />
                        </button>
                    </div>
                    <input
                        autoFocus
                        type="text"
                        placeholder="Item Name *"
                        value={quickAddForm.item_name}
                        onChange={(e) => setQuickAddForm(prev => ({ ...prev, item_name: e.target.value }))}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickAdd(); } }}
                    />
                    <select
                        value={quickAddForm.unit}
                        onChange={(e) => setQuickAddForm(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="PCS">PCS</option>
                        <option value="KG">KG</option>
                        <option value="MTR">MTR</option>
                        <option value="LTR">LTR</option>
                        <option value="SET">SET</option>
                        <option value="BOX">BOX</option>
                        <option value="NOS">NOS</option>
                        <option value="LOT">LOT</option>
                    </select>
                    {quickAddError && <p className="text-[11px] text-red-500 font-medium">{quickAddError}</p>}
                    <button
                        type="button"
                        onClick={handleQuickAdd}
                        disabled={quickAddLoading}
                        className="w-full py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50"
                    >
                        {quickAddLoading ? "Creating..." : "Add & Select"}
                    </button>
                </div>
            ) : (
                <div className="px-3 py-2 border-b border-slate-100">
                    <button
                        type="button"
                        onClick={() => { setShowQuickAdd(true); setQuickAddForm(prev => ({ ...prev, item_name: search })); }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-100"
                    >
                        <HiPlus size={14} /> Add New Item
                    </button>
                </div>
            )}

            {/* Scrollable List */}
            <div className="overflow-y-auto max-h-[200px] py-1">
                {loading ? (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">Loading...</div>
                ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
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
