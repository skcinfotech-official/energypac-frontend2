import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getVendors } from "../../services/vendorService";
import { getVendorAssignmentsByRequisition } from "../../services/vendorAssignment";
import {
    Box, Paper, TextField, InputAdornment, CircularProgress, List,
    ListItemButton, Typography
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";

const VendorSelector = ({
  value,
  onChange,
  placeholder = "Search vendor...",
  defaultItem = null,
  requisitionId = null,
  disabled = false,
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

    const fetchItems = async () => {
      if (vendors.length === 0) setLoading(true);
      try {
        let res;
        if (requisitionId) {
          const assignmentRes = await getVendorAssignmentsByRequisition(requisitionId, search);
          const assignments = assignmentRes.data.results || assignmentRes.data || [];
          // Map assignments to vendor objects
          const assignedVendors = assignments.map(a => ({
            ...a.vendor_details,
            id: a.vendor // Use the vendor ID from the assignment
          }));
          res = { results: assignedVendors };
        } else {
          res = await getVendors({ search });
        }
        setVendors(res.results || res || []);
      } catch (e) {
        console.error("Failed to load vendors", e);
      } finally {
        setLoading(false);
      }
    };

    if (search === "" && vendors.length === 0) {
      fetchItems();
    } else {
      const t = setTimeout(fetchItems, 300);
      return () => clearTimeout(t);
    }
  }, [search, open, requisitionId]);

  const selected =
    vendors.find((v) => v.id === value) ||
    (defaultItem && defaultItem.id === value ? defaultItem : null);

  /* =========================
     DROPDOWN
     ========================= */
  const dropdown = (
    <Paper
      className="vendor-selector-portal"
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
          placeholder="Search vendor..."
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
        ) : vendors.length > 0 ? (
          <List disablePadding>
            {vendors.map((v) => (
              <ListItemButton
                key={v.id}
                onClick={() => {
                  onChange(v.id, v);
                  setOpen(false);
                  setSearch("");
                }}
                sx={{ py: 1, px: 2, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {v.vendor_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {v.vendor_code || "No code"}
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', py: 2 }}>
            No vendors found
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
          {selected
            ? `${selected.vendor_name} (${selected.vendor_code || "N/A"})`
            : placeholder}
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

      {open && coords.width > 0 && createPortal(dropdown, document.body)}
    </Box>
  );
};

export default VendorSelector;
