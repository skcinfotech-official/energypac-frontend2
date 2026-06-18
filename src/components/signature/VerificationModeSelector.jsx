import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Card, CardContent, RadioGroup, FormControlLabel,
  Radio, Autocomplete, TextField, CircularProgress, Alert, Chip,
  Select, MenuItem, FormControl, InputLabel, Grid
} from "@mui/material";
import { CheckCircle as CheckIcon, Delete as DeleteIcon } from "@mui/icons-material";
import AlertToast from "../ui/AlertToast";

const VERIFICATION_ROLES = [
  { value: "CHECKED_BY", label: "✓ Checked By", color: "#f59e0b" },
  { value: "AUTHORIZED_SIGNATORY", label: "🔐 Authorized Signatory", color: "#0ea5e9" }
];

const VerificationModeSelector = ({ open, onClose, onSubmit, documentType = "PI" }) => {
  const [mode, setMode] = useState("SELF_VERIFICATION");
  const [externalVerifiers, setExternalVerifiers] = useState([]); // Array of {user, role}
  const [verifierOptions, setVerifierOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "error", message: "" });
  const [currentSearchInput, setCurrentSearchInput] = useState("");
  const [currentRoleSelection, setCurrentRoleSelection] = useState("CHECKED_BY");

  const handleModeChange = (e) => {
    setMode(e.target.value);
    setExternalVerifiers([]);
  };

  const handleVerifierSearch = async (searchText) => {
    setCurrentSearchInput(searchText);
    if (!searchText || searchText.length < 2) {
      setVerifierOptions([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/users/?search=${searchText}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      const data = await response.json();
      setVerifierOptions(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const addVerifier = (user, role) => {
    if (!user) {
      setToast({ open: true, type: "error", message: "Please select a user" });
      return;
    }

    // Check if user already has this role
    const exists = externalVerifiers.find(v => v.user.id === user.id && v.role === role);
    if (exists) {
      setToast({ open: true, type: "error", message: "This user already has this role" });
      return;
    }

    setExternalVerifiers([...externalVerifiers, { user, role }]);
    setCurrentSearchInput("");
    setVerifierOptions([]);
  };

  const removeVerifier = (userId, role) => {
    setExternalVerifiers(externalVerifiers.filter(v => !(v.user.id === userId && v.role === role)));
  };

  const handleSubmit = async () => {
    if (mode === 'EXTERNAL_VERIFICATION' && externalVerifiers.length === 0) {
      setToast({ open: true, type: "error", message: "Please add at least one verifier" });
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        verification_type: mode,
        verifiers: externalVerifiers.map(v => ({ user_id: v.user.id, role: v.role })) || null,
      });
    } catch (err) {
      setToast({ open: true, type: "error", message: "Failed to create verification request" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "#1a1a2e", color: "white", fontWeight: 900, py: 2.5 }}>
          ✓ How to Finalize {documentType}?
        </DialogTitle>

        <DialogContent sx={{ bgcolor: "#f1f5f9", p: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 2 }}>
            <RadioGroup value={mode} onChange={handleModeChange}>
              {/* SELF VERIFICATION OPTION */}
              <Card
                sx={{
                  border: mode === 'SELF_VERIFICATION' ? '2px solid #10b981' : '1px solid #e2e8f0',
                  bgcolor: mode === 'SELF_VERIFICATION' ? '#f0fdf4' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setMode('SELF_VERIFICATION')}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <FormControlLabel
                      value="SELF_VERIFICATION"
                      control={<Radio />}
                      label=""
                      sx={{ mt: 0 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 900, color: "#1e293b", mb: 0.5 }}>
                        ⚡ Self-Verify & Sign
                      </Typography>
                      <Typography sx={{ fontSize: "13px", color: "#64748b", mb: 2 }}>
                        You verify and sign the document yourself. Takes 1-2 minutes.
                      </Typography>
                      <Box sx={{ display: "flex", gap: 2, fontSize: "12px" }}>
                        <Box sx={{ color: "#10b981" }}>✓ Instant approval</Box>
                        <Box sx={{ color: "#10b981" }}>✓ No wait time</Box>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* EXTERNAL VERIFICATION OPTION */}
              <Card
                sx={{
                  border: mode === 'EXTERNAL_VERIFICATION' ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                  bgcolor: mode === 'EXTERNAL_VERIFICATION' ? '#f0f9ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setMode('EXTERNAL_VERIFICATION')}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <FormControlLabel
                      value="EXTERNAL_VERIFICATION"
                      control={<Radio />}
                      label=""
                      sx={{ mt: 0 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 900, color: "#1e293b", mb: 0.5 }}>
                        👥 Send for Multiple Approvals
                      </Typography>
                      <Typography sx={{ fontSize: "13px", color: "#64748b", mb: 2 }}>
                        Send to 2-3 people with different roles: Checked By & Authorized Signatory
                      </Typography>
                      <Box sx={{ display: "flex", gap: 2, fontSize: "12px" }}>
                        <Box sx={{ color: "#0ea5e9" }}>✓ Quality control</Box>
                        <Box sx={{ color: "#0ea5e9" }}>✓ Multiple approvals</Box>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* VERIFIER SELECTION WITH ROLES */}
              {mode === 'EXTERNAL_VERIFICATION' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "white", borderRadius: 1, border: "1px solid #dbeafe" }}>
                  <Typography sx={{ fontWeight: 900, color: "#1e293b", mb: 2, fontSize: "14px" }}>
                    👥 Add Approvers
                  </Typography>

                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    <Grid item xs={7}>
                      <Autocomplete
                        options={verifierOptions}
                        getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                        inputValue={currentSearchInput}
                        onInputChange={(e, value) => handleVerifierSearch(value)}
                        onChange={(e, newValue) => {
                          if (newValue) {
                            addVerifier(newValue, currentRoleSelection);
                          }
                        }}
                        loading={searching}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Search user..."
                            size="small"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {searching && <CircularProgress color="inherit" size={18} />}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={5}>
                      <FormControl fullWidth size="small">
                        <Select
                          value={currentRoleSelection}
                          onChange={(e) => setCurrentRoleSelection(e.target.value)}
                        >
                          {VERIFICATION_ROLES.map(role => (
                            <MenuItem key={role.value} value={role.value}>
                              {role.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {/* SELECTED VERIFIERS CHIPS */}
                  {externalVerifiers.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {externalVerifiers.map((v, idx) => {
                        const role = VERIFICATION_ROLES.find(r => r.value === v.role);
                        return (
                          <Chip
                            key={idx}
                            label={`${v.user.first_name} ${v.user.last_name} - ${role?.label}`}
                            onDelete={() => removeVerifier(v.user.id, v.role)}
                            deleteIcon={<DeleteIcon />}
                            sx={{
                              bgcolor: role?.color || "#e2e8f0",
                              color: "white",
                              fontWeight: 600,
                              fontSize: "12px"
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}

                  {externalVerifiers.length === 0 && (
                    <Alert severity="info" sx={{ fontSize: "12px" }}>
                      Add at least one approver to proceed
                    </Alert>
                  )}
                </Box>
              )}
            </RadioGroup>
          </Box>
        </DialogContent>

        <DialogActions sx={{ bgcolor: "white", p: 2, gap: 1 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || (mode === 'EXTERNAL_VERIFICATION' && externalVerifiers.length === 0)}
            startIcon={loading ? <CircularProgress size={16} /> : <CheckIcon />}
            sx={{ bgcolor: "#0ea5e9" }}
          >
            {loading ? "Processing..." : "Continue"}
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

export default VerificationModeSelector;
