import { useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import { CheckCircle as SuccessIcon, Error as ErrorIcon } from "@mui/icons-material";

export default function AlertToast({
    open,
    type = "success",
    message,
    onClose,
    duration = 4000,
}) {
    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                onClose?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [open, duration, onClose]);

    if (!open) return null;

    return (
        <Snackbar
            open={open}
            autoHideDuration={duration}
            onClose={onClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ zIndex: 9999 }}
        >
            <Alert
                onClose={onClose}
                severity={type === "success" ? "success" : "error"}
                variant="filled"
                icon={type === "success" ? <SuccessIcon /> : <ErrorIcon />}
                sx={{
                    minWidth: 300,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
}
