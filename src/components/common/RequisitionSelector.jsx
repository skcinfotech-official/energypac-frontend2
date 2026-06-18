import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fetchRequisitions } from "../../services/requisition";
import {
    Box, Paper, TextField, InputAdornment, CircularProgress, List,
    ListItemButton, Typography
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";

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
    <Paper
      className="requisition-selector-portal"
      sx={{
        position: 'fixed',
        zIndex: 9999,
        width: coords.width,
        top: coords.top + 4,
        left: coords.left,
        maxHeight: '240px',
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
          placeholder="Search requisition..."
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

      <Box sx={{ overflowY: 'auto', maxHeight: '200px' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : requisitions.length > 0 ? (
          <List disablePadding>
            {requisitions.map((r) => (
              <ListItemButton
                key={r.id}
                onClick={() => {
                  onChange(r.id, r);
                  setOpen(false);
                  setSearch("");
                }}
                sx={{ py: 1, px: 2, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {r.requisition_number}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {r.requisition_date} • {r.total_items} items
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', py: 2 }}>
            No requisitions found
          </Typography>
        )}
      </Box>
    </Paper>
  );

  return (
    <Box ref={inputRef} sx={{ position: 'relative', width: '100%' }}>
      <Box
        onClick={() => !disabled && setOpen(true)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          px: 1.5,
          py: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: disabled ? 'action.disabledBackground' : 'background.paper',
          opacity: disabled ? 0.6 : 1,
          '&:hover': { borderColor: disabled ? 'divider' : 'primary.main' },
        }}
      >
        <Typography sx={{ color: selected ? 'text.primary' : 'text.secondary' }}>
          {selected ? selected.requisition_number : placeholder}
        </Typography>

        {value && !disabled && (
          <CloseIcon
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setSearch("");
            }}
            sx={{ cursor: 'pointer', color: 'text.secondary', ml: 1, '&:hover': { color: 'text.primary' } }}
          />
        )}
      </Box>

      {open && !disabled && coords.width > 0 && createPortal(dropdown, document.body)}
    </Box>
  );
};

export default RequisitionSelector;
