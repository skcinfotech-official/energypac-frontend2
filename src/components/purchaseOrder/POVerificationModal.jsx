import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Autocomplete, TextField, Alert, CircularProgress, Chip
} from "@mui/material";
import { CheckCircle as SendIcon } from "@mui/icons-material";
import { apiGet, apiPost } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AlertToast from "../ui/AlertToast";

const POVerificationModal = ({ open, onClose, poId, poNumber, onSuccess }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkedBy, setCheckedBy] = useState(null);
  const [authorizedSignatory, setAuthorizedSignatory] = useState(null);
  const [toast, setToast] = useState({ open: false, type: "error", message: "" });

  useEffect(() => {
    if (open) {
      loadUsers();
      setCheckedBy(null);
      setAuthorizedSignatory(null);
    }
  }, [open]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/api/users/for-verification");
      const userList = data.results || data || [];
      const myId = user?.id;
      const mapped = userList.map((u) => {
        const isMe = myId && String(u.id) === String(myId);
        const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || u.email;
        return {
          id: u.id,
          isMe,
          label: `${isMe ? "★ " : ""}${name}${isMe ? " (You)" : ""} — ${u.email}${u.department ? ` · ${u.department}` : ""}`,
        };
      });
      mapped.sort((a, b) => (b.isMe ? 1 : 0) - (a.isMe ? 1 : 0));
      setUsers(mapped);
    } catch (err) {
      console.error("Failed to load users:", err);
      setToast({ open: true, type: "error", message: "Failed to load users" });
    } finally {
      setLoading(false);
    }
  };

  const sameUser = useMemo(
    () => checkedBy && authorizedSignatory && checkedBy.id === authorizedSignatory.id,
    [checkedBy, authorizedSignatory]
  );
  const selfAssigned = (checkedBy?.isMe || authorizedSignatory?.isMe);

  const handleSend = async () => {
    if (!checkedBy || !authorizedSignatory) {
      setToast({ open: true, type: "error", message: "Please assign both roles" });
      return;
    }
    setSubmitting(true);
    try {
      await apiPost(`/api/po/${poId}/verify/`, {
        verifiers: [
          { user_id: checkedBy.id, role: "CHECKED_BY" },
          { user_id: authorizedSignatory.id, role: "AUTHORIZED_SIGNATORY" },
        ],
      });
      setToast({ open: true, type: "success", message: "Verification sent successfully!" });
      setTimeout(() => {
        onClose();
        setCheckedBy(null);
        setAuthorizedSignatory(null);
        onSuccess?.();
      }, 1200);
    } catch (err) {
      console.error("Failed to send verification:", err);
      const errorMsg = err.data?.error || err.data?.detail || err.data?.message || "Failed to send verification request";
      setToast({ open: true, type: "error", message: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const roleField = (label, hint, value, setValue, color) => (
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#334155", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.3 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 1 }}>{hint}</Typography>
      <Autocomplete
        options={users}
        value={value}
        onChange={(e, v) => setValue(v)}
        getOptionLabel={(opt) => opt.label || ""}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
        loading={loading}
        renderInput={(params) => (
          <TextField {...params} size="small" placeholder={`Select ${label.toLowerCase()} (you can pick yourself)`} />
        )}
        disabled={submitting}
      />
      {value && (
        <Chip
          label={value.label}
          onDelete={() => setValue(null)}
          size="small"
          color={value.isMe ? "success" : color}
          sx={{ mt: 1, maxWidth: "100%" }}
        />
      )}
    </Box>
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "#1a1a2e", color: "white", fontWeight: 900 }}>
          ✓ Send PO #{poNumber} for Verification
        </DialogTitle>

        <DialogContent sx={{ bgcolor: "#f8fafc", p: 3 }}>
          <Alert severity="info" sx={{ mb: 2.5, mt: 1 }}>
            Assign who will <strong>check</strong> and who will <strong>authorize</strong> this PO.
            You can pick <strong>yourself</strong> for either role — your part is signed automatically
            with your saved signature, and the other person is notified to sign theirs.
          </Alert>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {roleField("Checked By", "Reviews the document", checkedBy, setCheckedBy, "primary")}
              {roleField("Authorized Signatory", "Gives final authorization", authorizedSignatory, setAuthorizedSignatory, "primary")}

              {sameUser && (
                <Alert severity="warning">
                  Both roles are the same person — the PO will be fully verified in one step.
                </Alert>
              )}
              {selfAssigned && (
                <Alert severity="success">
                  You're assigned a role — make sure you've uploaded your signature in your Profile.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={submitting || !checkedBy || !authorizedSignatory || loading}
            sx={{ bgcolor: "#10b981" }}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          >
            {submitting ? "Sending..." : "Send for Verification"}
          </Button>
        </DialogActions>
      </Dialog>

      <AlertToast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </>
  );
};

export default POVerificationModal;
