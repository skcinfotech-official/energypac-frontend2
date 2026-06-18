import { useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Avatar, InputAdornment, IconButton,
    CircularProgress, Typography
} from "@mui/material";
import {
    Lock as LockIcon,
    Visibility as ShowIcon,
    VisibilityOff as HideIcon,
} from "@mui/icons-material";

const PasswordConfirmModal = ({
    open,
    title = "Confirm Password",
    message = "Please enter your password to confirm this action.",
    onConfirm,
    onCancel,
    loading = false
}) => {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    if (!open) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(password);
        setPassword("");
    };

    return (
        <Dialog open={!!open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36 }}>
                        <LockIcon sx={{ fontSize: '1.1rem' }} />
                    </Avatar>
                    {title}
                </DialogTitle>
                <DialogContent sx={{ pt: '16px !important' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        {message}
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        required
                        type={showPassword ? "text" : "password"}
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                        {showPassword ? <HideIcon fontSize="small" /> : <ShowIcon fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCancel} disabled={loading} color="inherit" sx={{ fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading || !password}
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockIcon />}
                        sx={{ fontWeight: 600 }}
                    >
                        {loading ? "Verifying..." : "Confirm"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default PasswordConfirmModal;
