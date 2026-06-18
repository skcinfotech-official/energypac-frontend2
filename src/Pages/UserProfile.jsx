import { useEffect, useState } from "react";
import {
  Container, Box, Paper, Typography, Button, Card, CardContent,
  Avatar, Grid, TextField, Chip, CircularProgress, Alert
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Logout as LogoutIcon } from "@mui/icons-material";
import { SignatureUploadModal } from "../components/signature";
import AlertToast from "../components/ui/AlertToast";
import { apiGet, apiDelete } from "../services/api";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "error", message: "" });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setToast({ open: true, type: "error", message: "Not authenticated. Please login again." });
        setLoading(false);
        return;
      }

      // Get current user
      const userData = await apiGet('/api/auth/profile');
      setUser(userData);

      // Get user signatures
      const sigData = await apiGet('/api/signatures/');
      setSignatures(sigData.results || sigData || []);
    } catch (err) {
      console.error('Profile load error:', err);
      setToast({ open: true, type: "error", message: `Failed to load profile: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSignature = async (signatureId) => {
    if (!window.confirm("Are you sure you want to delete this signature?")) return;

    try {
      await apiDelete(`/api/signatures/${signatureId}/`);
      setToast({ open: true, type: "success", message: "Signature deleted" });
      loadUserData();
    } catch (err) {
      setToast({ open: true, type: "error", message: "Failed to delete signature" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: "#1a1a2e" }}>
          👤 My Profile
        </Typography>
        <Button
          endIcon={<LogoutIcon />}
          onClick={handleLogout}
          color="error"
          variant="outlined"
        >
          Logout
        </Button>
      </Box>

      {/* USER INFO */}
      <Paper sx={{ p: 3, mb: 3, border: "1px solid #dbeafe" }}>
        <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: "#0ea5e9",
              fontSize: "32px",
              fontWeight: 900
            }}
          >
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: "18px", fontWeight: 900, color: "#1e293b" }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#64748b", mt: 0.5 }}>
              @{user?.username}
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#64748b" }}>
              {user?.email}
            </Typography>
          </Box>

          <Button startIcon={<EditIcon />} variant="outlined">
            Edit Profile
          </Button>
        </Box>
      </Paper>

      {/* DIGITAL SIGNATURE SECTION */}
      <Card sx={{ border: "2px solid #dbeafe", bgcolor: "#f0f9ff", mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: "15px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase" }}>
                🖊️ Digital Signatures
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#64748b", mt: 0.5 }}>
                Upload signatures for document verification and signing
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => setOpenSignatureModal(true)}
              sx={{ bgcolor: "#0ea5e9" }}
            >
              + Add Signature
            </Button>
          </Box>

          {signatures.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No signatures uploaded yet. Upload one to get started with document verification.
            </Alert>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {signatures.map((sig) => (
                <Grid item xs={12} sm={6} key={sig.id}>
                  <Paper sx={{ p: 2, border: "1px solid #dbeafe", bgcolor: "white" }}>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <Box
                        component="img"
                        src={sig.signature_url}
                        sx={{
                          width: 80,
                          height: 60,
                          objectFit: "contain",
                          border: "1px solid #e2e8f0",
                          borderRadius: 1,
                          bgcolor: "#f8fafc"
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: "#1e293b" }}>
                          {sig.name}
                        </Typography>
                        <Typography sx={{ fontSize: "11px", color: "#64748b", mt: 0.5 }}>
                          Uploaded {new Date(sig.created_at).toLocaleDateString()}
                        </Typography>
                        {sig.is_active && (
                          <Chip label="Active" size="small" color="primary" sx={{ mt: 1 }} />
                        )}
                      </Box>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteSignature(sig.id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* SIGNATURE UPLOAD MODAL */}
      <SignatureUploadModal
        open={openSignatureModal}
        onClose={() => setOpenSignatureModal(false)}
        onSuccess={() => {
          setToast({ open: true, type: "success", message: "Signature uploaded successfully!" });
          loadUserData();
          setOpenSignatureModal(false);
        }}
      />

      <AlertToast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Container>
  );
};

export default UserProfile;
