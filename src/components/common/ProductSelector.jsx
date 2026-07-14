import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getProducts, createProduct } from "../../services/productService";
import {
    Box, Paper, TextField, InputAdornment, CircularProgress, List, ListItem,
    ListItemButton, Typography, Button, Alert, Select, MenuItem
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon, Add as AddIcon } from "@mui/icons-material";

const ProductSelector = ({ value, onChange, placeholder = "Search product...", defaultItem = null, excludeIds = [], disabled = false, size = "medium" }) => {
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
        <Paper
            className="product-selector-portal"
            sx={{
                position: 'fixed',
                zIndex: 9999,
                width: coords.width,
                top: coords.placement === 'bottom' ? coords.top + 4 : 'auto',
                bottom: coords.placement === 'top' ? (window.innerHeight - coords.bottom + 4) : 'auto',
                left: coords.left,
                maxHeight: '320px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
            elevation={4}
        >
            <Box sx={{ p: 1, borderBottom: '2px solid', borderColor: '#dbeafe', flexShrink: 0, bgcolor: '#f0f9ff' }}>
                <TextField
                    autoFocus
                    fullWidth
                    size="small"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: '1.1rem', color: '#0ea5e9' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 1, fontSize: '13px', "& fieldset": { borderColor: '#dbeafe' } } }}
                />
            </Box>

            {/* Quick Add Form */}
            {showQuickAdd ? (
                <Box sx={{ p: 1.2, borderBottom: '2px solid', borderColor: '#dbeafe', bgcolor: '#f0f9ff', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#0ea5e9', letterSpacing: 0.5, fontSize: '9px' }}>
                            Add New
                        </Typography>
                        <CloseIcon
                            onClick={() => { setShowQuickAdd(false); setQuickAddError(""); }}
                            sx={{ fontSize: '1rem', cursor: 'pointer', color: '#0ea5e9', '&:hover': { color: '#0284c7' } }}
                        />
                    </Box>
                    <TextField
                        autoFocus
                        fullWidth
                        size="small"
                        placeholder="Item Name"
                        value={quickAddForm.item_name}
                        onChange={(e) => setQuickAddForm(prev => ({ ...prev, item_name: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickAdd(); } }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1, fontSize: '12px', "& fieldset": { borderColor: '#dbeafe' } } }}
                    />
                    <Select
                        fullWidth
                        size="small"
                        value={quickAddForm.unit}
                        onChange={(e) => setQuickAddForm(prev => ({ ...prev, unit: e.target.value }))}
                        sx={{ borderRadius: 1, fontSize: '12px', "& .MuiOutlinedInput-notchedOutline": { borderColor: '#dbeafe' } }}
                    >
                        <MenuItem value="PCS">PCS</MenuItem>
                        <MenuItem value="KG">KG</MenuItem>
                        <MenuItem value="MTR">MTR</MenuItem>
                        <MenuItem value="LTR">LTR</MenuItem>
                        <MenuItem value="SET">SET</MenuItem>
                        <MenuItem value="BOX">BOX</MenuItem>
                        <MenuItem value="NOS">NOS</MenuItem>
                        <MenuItem value="LOT">LOT</MenuItem>
                    </Select>
                    {quickAddError && <Alert severity="error" sx={{ py: 0.5, fontSize: '11px' }}>{quickAddError}</Alert>}
                    <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        onClick={handleQuickAdd}
                        disabled={quickAddLoading}
                        sx={{ bgcolor: '#0ea5e9', py: 0.8, textTransform: 'uppercase', fontWeight: 700, fontSize: '11px' }}
                    >
                        {quickAddLoading ? "Creating..." : "Add"}
                    </Button>
                </Box>
            ) : (
                <Box sx={{ px: 1.5, py: 0.8, borderBottom: '2px solid', borderColor: '#dbeafe', bgcolor: '#f8fbff' }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: '16px' }} />}
                        onClick={() => { setShowQuickAdd(true); setQuickAddForm(prev => ({ ...prev, item_name: search })); }}
                        sx={{ textTransform: 'uppercase', fontWeight: 700, color: '#0ea5e9', borderColor: '#0ea5e9', py: 0.8, fontSize: '11px' }}
                    >
                        Add Item
                    </Button>
                </Box>
            )}

            {/* Scrollable List */}
            <Box sx={{ overflowY: 'auto', maxHeight: '240px', py: 0.8 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                        <CircularProgress size={28} sx={{ color: '#0ea5e9' }} />
                    </Box>
                ) : filteredProducts.length > 0 ? (
                    <List disablePadding>
                        {filteredProducts.map((p) => (
                            <ListItemButton
                                key={p.id || p.uuid}
                                onClick={() => {
                                    onChange(p.uuid || p.id, p);
                                    setIsOpen(false);
                                    setSearch("");
                                }}
                                sx={{ py: 1.4, px: 2, borderBottom: '1px solid', borderColor: '#f0f0f0', '&:last-child': { borderBottom: 'none' }, '&:hover': { bgcolor: '#f0f9ff', borderLeft: '3px solid #0ea5e9', pl: '1.7rem' } }}
                            >
                                <Box sx={{ width: '100%' }}>
                                    <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '14px', mb: 0.6 }}>
                                        {p.item_name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                        <Typography sx={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace', fontWeight: 600 }}>
                                            {p.item_code || "N/A"}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: p.current_stock > 0 ? '#d1fae5' : '#fee2e2', px: 1.2, py: 0.4, borderRadius: 1 }}>
                                            <Typography sx={{ fontWeight: 700, color: p.current_stock > 0 ? '#10b981' : '#ef4444', fontSize: '12px' }}>
                                                {p.current_stock ?? '-'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </ListItemButton>
                        ))}
                    </List>
                ) : (
                    <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 3, fontSize: '12px' }}>
                        No products found
                    </Typography>
                )}
            </Box>
        </Paper>
    );

    const small = size === "small";

    return (
        <Box sx={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
            <Box
                onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    px: small ? 1.25 : 2,
                    py: small ? 0.75 : 1.2,
                    border: '2px solid',
                    borderColor: disabled ? '#e2e8f0' : isOpen ? '#0ea5e9' : '#dbeafe',
                    borderRadius: 1.2,
                    bgcolor: disabled ? '#f8fafc' : 'background.paper',
                    fontSize: small ? '13px' : '14px',
                    fontWeight: 500,
                    minHeight: small ? '36px' : '44px',
                    boxShadow: disabled ? 'none' : isOpen ? '0 2px 8px rgba(14, 165, 233, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    '&:hover': disabled ? {} : { borderColor: '#0ea5e9', boxShadow: '0 2px 8px rgba(14, 165, 233, 0.1)' },
                }}
            >
                <Typography sx={{ color: disabled ? 'text.disabled' : !selectedProduct ? 'text.secondary' : 'text.primary', fontSize: small ? '13px' : '14px', fontWeight: selectedProduct ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {selectedProduct ? `${selectedProduct.item_name} (${selectedProduct.item_code || "N/A"})` : placeholder}
                </Typography>
                {value && !disabled && (
                    <CloseIcon
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange("");
                            setSearch("");
                        }}
                        sx={{ cursor: 'pointer', color: 'text.secondary', ml: 1.5, flexShrink: 0, fontSize: '18px', '&:hover': { color: 'text.primary' } }}
                    />
                )}
            </Box>

            {isOpen && !disabled && createPortal(dropdownContent, document.body)}
        </Box>
    );
};

export default ProductSelector;
