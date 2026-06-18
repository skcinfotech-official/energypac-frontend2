import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Alert, CircularProgress, Paper
} from "@mui/material";
import { Upload as UploadIcon, Check as CheckIcon } from "@mui/icons-material";
import AlertToast from "../ui/AlertToast";
import { apiUpload } from "../../services/api";

const SignatureUploadModal = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "error", message: "" });

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!['image/png', 'image/jpeg'].includes(selectedFile.type)) {
      setToast({ open: true, type: "error", message: "Only PNG and JPG files allowed" });
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setToast({ open: true, type: "error", message: "File size must be less than 5MB" });
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setToast({ open: true, type: "error", message: "Please select a file" });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('signature_file', file);
    formData.append('name', 'Official Signature');
    formData.append('is_active', true);

    try {
      await apiUpload('/api/signatures/upload/', formData);

      setToast({ open: true, type: "success", message: "Signature uploaded successfully!" });
      setFile(null);
      setPreview(null);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setToast({ open: true, type: "error", message: "Failed to upload signature" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "#1a1a2e", color: "white", fontWeight: 900, py: 2.5 }}>
          📝 Upload Your Signature
        </DialogTitle>

        <DialogContent sx={{ bgcolor: "#f1f5f9", p: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
            <Alert severity="info">
              Upload a clear image of your signature (PNG or JPG). This will be used to sign documents.
            </Alert>

            {/* File Input */}
            <Box
              sx={{
                border: "2px dashed #0ea5e9",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: "#f0f9ff",
                transition: "all 0.2s",
                "&:hover": { bgcolor: "#e0f2fe", borderColor: "#0284c7" }
              }}
              component="label"
            >
              <input
                type="file"
                accept="image/png,image/jpeg"
                hidden
                onChange={handleFileSelect}
              />
              <UploadIcon sx={{ fontSize: 40, color: "#0ea5e9", mb: 1 }} />
              <Typography sx={{ fontWeight: 900, color: "#1e40af", mb: 1 }}>
                Click to upload signature
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#64748b" }}>
                PNG or JPG (max 5MB)
              </Typography>
            </Box>

            {/* Preview */}
            {preview && (
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontWeight: 700, color: "#1e293b", mb: 1.5 }}>
                  ✓ Signature Preview
                </Typography>
                <Paper sx={{ p: 2, bgcolor: "white", border: "1px solid #dbeafe" }}>
                  <img src={preview} alt="Signature" style={{ maxWidth: "100%", maxHeight: "150px" }} />
                </Paper>
                <Typography sx={{ fontSize: "12px", color: "#10b981", mt: 1, fontWeight: 700 }}>
                  <CheckIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: "text-bottom" }} />
                  Ready to upload
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ bgcolor: "white", p: 2, gap: 1 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!file || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <CheckIcon />}
            sx={{ bgcolor: "#10b981" }}
          >
            {loading ? "Uploading..." : "Upload Signature"}
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

export default SignatureUploadModal;
