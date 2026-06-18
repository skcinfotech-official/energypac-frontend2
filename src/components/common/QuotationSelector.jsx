import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getClientQuotations } from "../../services/salesService";
import {
    Box, Paper, TextField, InputAdornment, CircularProgress, List,
    ListItemButton, Typography
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";

const QuotationSelector = ({ value, onChange, placeholder = "Search quotation...", defaultItem = null, status = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: 'bottom' });
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !event.target.closest(".quotation-selector-portal")
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
            if (quotations.length === 0) setLoading(true);
            try {
                const res = await getClientQuotations(1, search, status);
                const data = res.results || res.data || [];
                setQuotations(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch quotations:", err);
            } finally {
                setLoading(false);
            }
        };

        if (search === "" && quotations.length === 0) {
            fetchItems();
        } else {
            const timeoutId = setTimeout(fetchItems, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [search, isOpen, status]);

    const findQuotation = (id) => {
        return quotations.find((q) => String(q.id) === String(id) || q.uuid === id);
    };

    const selectedQuotation = findQuotation(value) || defaultItem;

    const dropdownContent = isOpen && coords.width > 0 && (
        <Paper
            sx={{
                position: 'fixed',
                zIndex: 9999,
                width: coords.width,
                top: coords.placement === 'bottom' ? coords.top + 4 : 'auto',
                bottom: coords.placement === 'top' ? (window.innerHeight - coords.bottom) + 4 : 'auto',
                left: coords.left,
                maxHeight: '250px',
                display: 'flex',
                flexDirection: 'column',
            }}
            elevation={3}
        >
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                <TextField
                    autoFocus
                    fullWidth
                    size="small"
                    placeholder="Type to search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: '1.2rem', color: 'text.secondary' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.default' } }}
                />
            </Box>

            <Box sx={{ overflowY: 'auto', maxHeight: '200px', py: 0.5 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : quotations.length > 0 ? (
                    <List disablePadding>
                        {quotations.map((q) => (
                            <ListItemButton
                                key={q.id || q.uuid}
                                onClick={() => {
                                    onChange(q.id || q.uuid, q);
                                    setIsOpen(false);
                                    setSearch("");
                                }}
                                sx={{ py: 1, px: 2, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}
                            >
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                        {q.quotation_number}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {q.client_name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                                            ₹{q.total_amount}
                                        </Typography>
                                    </Box>
                                </Box>
                            </ListItemButton>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', py: 2 }}>
                        No quotations found
                    </Typography>
                )}
            </Box>
        </Paper>
    );

    return (
        <Box sx={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
            <Box
                onClick={() => setIsOpen(!isOpen)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    minHeight: '42px',
                    px: 1.5,
                    py: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    '&:hover': { borderColor: 'primary.main' },
                }}
            >
                <Typography sx={{ color: !selectedQuotation ? 'text.secondary' : 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedQuotation ? `${selectedQuotation.quotation_number} - ${selectedQuotation.client_name}` : placeholder}
                </Typography>
                {value && (
                    <CloseIcon
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange("", null);
                            setSearch("");
                        }}
                        sx={{ cursor: 'pointer', color: 'text.secondary', ml: 1, '&:hover': { color: 'text.primary' } }}
                    />
                )}
            </Box>

            {isOpen && createPortal(dropdownContent, document.body)}
        </Box>
    );
};

export default QuotationSelector;
