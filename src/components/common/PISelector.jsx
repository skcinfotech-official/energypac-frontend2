import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getProformaInvoices, getProformaInvoiceById } from "../../services/salesService";
import {
    Box, Paper, TextField, InputAdornment, CircularProgress, List, ListItem,
    ListItemButton, Typography, Popper
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";

const WorkOrderSelector = ({ value, onChange, placeholder = "Search proforma invoice...", defaultItem = null, status = "ACTIVE" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: 'bottom' });
    const dropdownRef = useRef(null);
    const [anchorEl, setAnchorEl] = useState(null);

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
        if (!value) return;
        const found = workOrders.find((w) => String(w.id) === String(value) || w.uuid === value);
        if (found) return;

        const fetchSingle = async () => {
            try {
                const res = await getProformaInvoiceById(value);
                if (res) {
                    const mapped = {
                        ...res,
                        pi_number: res.pi_number,
                        client_name: res.applicant_importer,
                        applicant_importer: res.applicant_importer,
                        total_amount: res.grand_total,
                        grand_total: res.grand_total
                    };
                    setWorkOrders(prev => {
                        const exists = prev.some(w => String(w.id) === String(mapped.id) || w.uuid === mapped.uuid);
                        return exists ? prev : [...prev, mapped];
                    });
                }
            } catch (err) {
                console.error("Failed to fetch selected proforma invoice:", err);
            }
        };
        fetchSingle();
    }, [value]);

    useEffect(() => {
        if (!isOpen) return;
        const fetchItems = async () => {
            if (workOrders.length === 0) setLoading(true);
            try {
                const res = await getProformaInvoices(1, search);
                const rawData = res.results || res.data || [];
                const data = (Array.isArray(rawData) ? rawData : []).map(w => ({
                    ...w,
                    pi_number: w.pi_number,
                    client_name: w.applicant_importer,
                    applicant_importer: w.applicant_importer,
                    total_amount: w.grand_total,
                    grand_total: w.grand_total
                }));
                setWorkOrders(data);
            } catch (err) {
                console.error("Failed to fetch proforma invoices:", err);
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
    }, [search, isOpen]);

    const findWO = (id) => {
        return workOrders.find((w) => String(w.id) === String(id) || w.uuid === id);
    };

    const selectedWO = findWO(value) || defaultItem;

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
                ) : workOrders.length > 0 ? (
                    <List disablePadding>
                        {workOrders.map((w) => (
                            <ListItemButton
                                key={w.id || w.uuid}
                                onClick={() => {
                                    onChange(w.id || w.uuid, w);
                                    setIsOpen(false);
                                    setSearch("");
                                }}
                                sx={{ py: 1, px: 2, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}
                            >
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                        {w.pi_number}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {w.client_name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                                            {w.currency === 'USD' ? '$' : w.currency === 'EUR' ? '€' : w.currency === 'GBP' ? '£' : w.currency === 'JPY' ? '¥' : '₹'}
                                            {Number(w.total_amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                        </Typography>
                                    </Box>
                                </Box>
                            </ListItemButton>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', py: 2 }}>
                        No proforma invoices found
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
                <Typography sx={{ color: !selectedWO ? 'text.secondary' : 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedWO ? `${selectedWO.pi_number} - ${selectedWO.client_name}` : placeholder}
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

export default WorkOrderSelector;
