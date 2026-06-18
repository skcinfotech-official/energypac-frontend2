import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Button,
  Box,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  TableFooter,
} from "@mui/material";
import { Close as CloseIcon, Check as CheckIcon, Warning as WarningIcon } from "@mui/icons-material";
import { getProformaInvoices } from "../../services/salesService";
import { getPiItemsForReturn, createSalesReturn } from "../../services/returnsService";

const REASON_OPTIONS = [
  { value: "DEFECTIVE", label: "Defective" },
  { value: "WRONG_ITEM", label: "Wrong Item" },
  { value: "EXCESS", label: "Excess Quantity" },
  { value: "DAMAGED", label: "Damaged in Transit" },
  { value: "QUALITY", label: "Quality Issue" },
  { value: "OTHER", label: "Other" },
];

const CONDITION_OPTIONS = [
  { value: "GOOD", label: "Good — Resalable" },
  { value: "DAMAGED", label: "Damaged — Needs Repair" },
  { value: "UNUSABLE", label: "Unusable — Write Off" },
];

const SalesReturnModal = ({ isOpen, onClose, onSuccess }) => {
  const [piList, setPiList] = useState([]);
  const [selectedPi, setSelectedPi] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      const fetchPIs = async () => {
        try {
          const res = await getProformaInvoices(1, "");
          const accepted = (res.results || []).filter((p) => p.status === "ACCEPTED");
          setPiList(accepted);
        } catch (err) {
          console.error(err);
        }
      };
      fetchPIs();
      setSelectedPi("");
      setReturnDate(new Date().toISOString().split("T")[0]);
      setReason("");
      setNotes("");
      setItems([]);
      setError("");
    }
  }, [isOpen]);

  const handlePiChange = async (e) => {
    const piId = e.target.value;
    setSelectedPi(piId);
    if (!piId) {
      setItems([]);
      return;
    }

    setLoadingItems(true);
    try {
      const res = await getPiItemsForReturn(piId);
      const mapped = (res.items || []).map((item) => ({
        ...item,
        return_qty: 0,
        reason: "OTHER",
        condition: "GOOD",
        notes: "",
        selected: false,
      }));
      setItems(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load PI items");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === "return_qty" ? parseFloat(value) || 0 : value,
      };
      if (field === "return_qty" && parseFloat(value) > 0) {
        updated[index].selected = true;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const selectedItems = items.filter((i) => i.return_qty > 0);
    if (!selectedPi) {
      setError("Please select a Proforma Invoice");
      return;
    }
    if (selectedItems.length === 0) {
      setError("Enter return quantity for at least one item");
      return;
    }

    const overItems = selectedItems.filter((i) => i.return_qty > i.returnable_qty);
    if (overItems.length > 0) {
      setError(`Quantity exceeds returnable: ${overItems.map((i) => i.product_name).join(", ")}`);
      return;
    }

    setSubmitting(true);
    try {
      await createSalesReturn({
        proforma_invoice: selectedPi,
        return_date: returnDate,
        reason,
        notes,
        items: selectedItems.map((i) => ({
          product: i.product_id,
          quantity: i.return_qty,
          unit_price: i.unit_price,
          reason: i.reason,
          condition: i.condition,
          notes: i.notes,
        })),
      });
      toast.success("Sales return created");
      onSuccess("Sales return created successfully");
      onClose();
    } catch (err) {
      const msg = err.response?.data?.items || err.response?.data?.error || err.message || "Failed to create return";
      setError(typeof msg === "object" ? JSON.stringify(msg) : msg);
      toast.error("Failed to create return");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalReturnAmount = items
    .filter((i) => i.return_qty > 0)
    .reduce((s, i) => s + i.return_qty * i.unit_price, 0);

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Create Sales Return
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Return items from an accepted Proforma Invoice
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {error && (
            <Alert severity="error" icon={<WarningIcon />}>
              {error}
            </Alert>
          )}

          {/* Top fields */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Select
                fullWidth
                value={selectedPi}
                onChange={handlePiChange}
                displayEmpty
                label="Proforma Invoice *"
                required
              >
                <MenuItem value="">Select PI</MenuItem>
                {piList.map((pi) => (
                  <MenuItem key={pi.id} value={pi.id}>
                    {pi.pi_number} — {pi.applicant_importer}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Return Date *"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Overall Reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Client rejected batch"
                size="small"
              />
            </Grid>
          </Grid>

          {/* Items Table */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 2, textTransform: "uppercase" }}>
              Return Items
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              {loadingItems ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress size={40} />
                </Box>
              ) : items.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                  Select a PI to see items
                </Box>
              ) : (
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "#f3f4f6" }}>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>
                        #
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Product</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Sold
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Returned
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Returnable
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Return Qty
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Reason</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Condition</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow
                        key={idx}
                        sx={{
                          backgroundColor: item.returnable_qty <= 0 ? "#f9fafb" : "transparent",
                          opacity: item.returnable_qty <= 0 ? 0.6 : 1,
                          "&:hover": {
                            backgroundColor: item.returnable_qty <= 0 ? "#f9fafb" : "#f3f4f6",
                          },
                        }}
                      >
                        <TableCell align="center">{idx + 1}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.product_name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ fontFamily: "monospace" }}>
                              {item.product_code}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{item.sold_qty}</TableCell>
                        <TableCell align="right" sx={{ color: item.already_returned > 0 ? "#b45309" : "textSecondary" }}>
                          {item.already_returned > 0 ? item.already_returned : "—"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", color: "#059669" }}>
                          {item.returnable_qty}
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={item.return_qty || ""}
                            onChange={(e) => handleItemChange(idx, "return_qty", e.target.value)}
                            inputProps={{
                              min: 0,
                              max: item.returnable_qty,
                              step: "1",
                            }}
                            disabled={item.returnable_qty <= 0}
                            sx={{ width: 70 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={item.reason}
                            onChange={(e) => handleItemChange(idx, "reason", e.target.value)}
                            disabled={item.returnable_qty <= 0}
                            fullWidth
                          >
                            {REASON_OPTIONS.map((r) => (
                              <MenuItem key={r.value} value={r.value}>
                                {r.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={item.condition}
                            onChange={(e) => handleItemChange(idx, "condition", e.target.value)}
                            disabled={item.returnable_qty <= 0}
                            fullWidth
                          >
                            {CONDITION_OPTIONS.map((c) => (
                              <MenuItem key={c.value} value={c.value}>
                                {c.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {totalReturnAmount > 0 && (
                    <TableFooter sx={{ backgroundColor: "#f3f4f6" }}>
                      <TableRow>
                        <TableCell colSpan={5} align="right" sx={{ fontWeight: "bold" }}>
                          Total Return Amount:
                        </TableCell>
                        <TableCell colSpan={3} sx={{ fontWeight: "bold", color: "#1e40af", fontSize: "1.1rem" }}>
                          {totalReturnAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              )}
            </TableContainer>
          </Box>

          {/* Notes field */}
          <TextField
            fullWidth
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes..."
            multiline
            rows={2}
            size="small"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : <CheckIcon />}
        >
          {submitting ? "Creating..." : "Create Return"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalesReturnModal;
