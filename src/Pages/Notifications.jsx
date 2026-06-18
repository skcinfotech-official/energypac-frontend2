import { useState, useEffect, useCallback } from "react";
import {
    Box, Card, Typography, Button, Chip, CircularProgress, IconButton, Tooltip, Divider,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CheckIcon from "@mui/icons-material/Check";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { apiGet, apiPatch, apiPost, apiDelete } from "../services/api";
import AlertToast from "../components/ui/AlertToast";

const timeAgo = (d) => {
    if (!d) return "";
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const Notifications = () => {
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, type: "success", message: "" });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiGet("/api/notifications/?limit=100");
            setItems(data.results || data || []);
            setUnread(data.unread_count || 0);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, type: "error", message: "Failed to load notifications" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const markRead = async (id) => {
        try {
            await apiPatch(`/api/notifications/${id}/mark_as_read/`, {});
            load();
        } catch { setAlert({ open: true, type: "error", message: "Could not mark as read" }); }
    };

    const markAllRead = async () => {
        try {
            await apiPost("/api/notifications/mark_all_as_read/", {});
            setAlert({ open: true, type: "success", message: "All marked as read" });
            load();
        } catch { setAlert({ open: true, type: "error", message: "Could not mark all as read" }); }
    };

    const remove = async (id) => {
        try {
            await apiDelete(`/api/notifications/${id}/`);
            load();
        } catch { setAlert({ open: true, type: "error", message: "Could not delete" }); }
    };

    return (
        <Box sx={{ maxWidth: 820, mx: "auto", py: 1, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Card variant="outlined" sx={{ p: 3, borderRadius: 3, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <NotificationsIcon sx={{ color: "#0ea5e9" }} /> Notifications
                        {unread > 0 && (
                            <Chip label={`${unread} unread`} size="small" sx={{ bgcolor: "#fee2e2", color: "#b91c1c", fontWeight: 800, fontSize: 11 }} />
                        )}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Your alerts and updates
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Refresh"><IconButton onClick={load} sx={{ bgcolor: "#f1f5f9" }}><RefreshIcon fontSize="small" /></IconButton></Tooltip>
                    <Button onClick={markAllRead} disabled={unread === 0} startIcon={<DoneAllIcon />}
                        variant="outlined" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 12, borderRadius: 2 }}>
                        Mark all read
                    </Button>
                </Box>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                {loading ? (
                    <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress size={28} /></Box>
                ) : items.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 8, color: "text.disabled" }}>
                        <NotificationsIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 1 }} />
                        <Typography sx={{ fontStyle: "italic" }}>No notifications</Typography>
                    </Box>
                ) : (
                    items.map((n, i) => (
                        <Box key={n.id}>
                            {i > 0 && <Divider />}
                            <Box sx={{ p: 2.5, display: "flex", gap: 2, alignItems: "flex-start", bgcolor: n.is_read ? "#fff" : "#f0f9ff", "&:hover": { bgcolor: "#f8fafc" } }}>
                                <Box sx={{ mt: 0.5, width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: n.is_read ? "transparent" : "#0ea5e9" }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "baseline" }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>{n.title}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{timeAgo(n.created_at)}</Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: 13, color: "#475569", mt: 0.5 }}>{n.message}</Typography>
                                    {n.notification_type && (
                                        <Chip label={String(n.notification_type).replace(/_/g, " ")} size="small"
                                            sx={{ mt: 1, height: 18, fontSize: 9, fontWeight: 700, bgcolor: "#f1f5f9", color: "#64748b", textTransform: "uppercase" }} />
                                    )}
                                </Box>
                                <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                                    {!n.is_read && (
                                        <Tooltip title="Mark as read"><IconButton size="small" onClick={() => markRead(n.id)} sx={{ color: "#0ea5e9" }}><CheckIcon fontSize="small" /></IconButton></Tooltip>
                                    )}
                                    <Tooltip title="Delete"><IconButton size="small" onClick={() => remove(n.id)} sx={{ color: "#94a3b8", "&:hover": { color: "#dc2626" } }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                                </Box>
                            </Box>
                        </Box>
                    ))
                )}
            </Card>

            <AlertToast open={alert.open} type={alert.type} message={alert.message} onClose={() => setAlert({ ...alert, open: false })} />
        </Box>
    );
};

export default Notifications;
