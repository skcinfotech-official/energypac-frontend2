import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  Key as KeyIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import { forgotPassword, verifyOtp, resetPassword } from "../../services/authService";
import { toast } from "react-hot-toast";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("OTP sent to your email address.");
      setError("");
      setStep(2);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      toast.success("OTP verified successfully.");
      setError("");
      setStep(3);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      await resetPassword({
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success("Password reset successfully. You can now login.");
      setError("");
      onClose();
      // Reset state for next time
      setStep(1);
      setEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Box component="form" onSubmit={handleEmailSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              placeholder="user@example.com"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: "action.active" }} />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
            <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic", mt: -2 }}>
              We'll send a 6-digit verification code to this email.
            </Typography>
            {error && step === 1 && (
              <Alert severity="error" sx={{ py: 1 }}>
                {error}
              </Alert>
            )}
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Sending...
                </>
              ) : (
                "Send OTP"
              )}
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box component="form" onSubmit={handleOtpSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              fullWidth
              type="text"
              label="Verification Code"
              placeholder="Enter 6-digit OTP"
              required
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setError("");
              }}
              disabled={loading}
              inputProps={{ maxLength: 6, style: { textAlign: "center", letterSpacing: "0.5em", fontFamily: "monospace", fontWeight: "bold" } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SecurityIcon sx={{ color: "action.active" }} />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: -1 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                OTP sent to {email}
              </Typography>
              <Button
                size="small"
                onClick={() => setStep(1)}
                disabled={loading}
                sx={{ textTransform: "none", color: "primary.main" }}
              >
                Change Email
              </Button>
            </Box>
            {error && step === 2 && (
              <Alert severity="error" sx={{ py: 1, mt: -1 }}>
                {error}
              </Alert>
            )}
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>
          </Box>
        );

      case 3:
        return (
          <Box component="form" onSubmit={handleResetSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              label="New Password"
              placeholder="••••••••"
              required
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError("");
              }}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "action.active" }} />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              label="Confirm Password"
              placeholder="••••••••"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CheckCircleIcon sx={{ color: "action.active" }} />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  size="small"
                />
              }
              label={<Typography variant="caption">Show Passwords</Typography>}
              sx={{ mt: -1 }}
            />
            {error && step === 3 && (
              <Alert severity="error" sx={{ py: 1 }}>
                {error}
              </Alert>
            )}
            <Button
              fullWidth
              variant="contained"
              color="success"
              type="submit"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Updating...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 700,
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              bgcolor: "primary.lighter",
              borderRadius: 2,
              color: "primary.main",
            }}
          >
            <KeyIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Reset Access
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase" }}>
              Secure Password Recovery
            </Typography>
          </Box>
        </Box>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="text"
          size="small"
          sx={{ minWidth: "auto", color: "text.secondary" }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <LinearProgress
        variant="determinate"
        value={(step / 3) * 100}
        sx={{ height: 2, bgcolor: "action.disabledBackground" }}
      />

      <DialogContent sx={{ pt: 3 }}>
        {renderStep()}
      </DialogContent>

      <Box sx={{ px: 3, py: 2, bgcolor: "action.hover", textAlign: "center" }}>
        <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 600 }}>
          Identity Protection System • Energypac Security
        </Typography>
      </Box>
    </Dialog>
  );
}
