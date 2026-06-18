import {
    Dialog, DialogTitle, DialogContent, DialogContentText,
    DialogActions, Button, Avatar, CircularProgress
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";

export default function ConfirmDialog({
    open,
    title = "Confirm Action",
    message = "Are you sure?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    loading = false,
    onConfirm,
    onCancel,
    icon: Icon,
    confirmButtonClass,
    iconBgClass,
}) {
    const isDestructive = confirmButtonClass?.includes?.('red') || confirmButtonClass?.includes?.('error');
    const isSuccess = confirmButtonClass?.includes?.('emerald') || confirmButtonClass?.includes?.('green');
    const isInfo = confirmButtonClass?.includes?.('blue') || confirmButtonClass?.includes?.('info');

    const getColor = () => {
        if (isSuccess) return 'success';
        if (isInfo) return 'primary';
        return 'error';
    };

    const color = getColor();

    return (
        <Dialog open={!!open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.dark`, width: 36, height: 36 }}>
                    {Icon ? <Icon /> : <WarningIcon sx={{ fontSize: '1.1rem' }} />}
                </Avatar>
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={loading} color="inherit" sx={{ fontWeight: 600 }}>
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    variant="contained"
                    color={color}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{ fontWeight: 600 }}
                >
                    {loading ? "Processing..." : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
