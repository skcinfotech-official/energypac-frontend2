import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    CircularProgress,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
} from "@mui/material";
import {
    Close as CloseIcon,
    History as HistoryIcon,
    Person as PersonIcon,
    Schedule as ClockIcon,
    AddCircle as AddCircleIcon,
    EditOutlined as EditIcon,
    Delete as TrashAltIcon,
    SwapHoriz as ExchangeAltIcon,
    ExpandMore as ChevronDownIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { getObjectAuditLogs } from "../../services/auditLogService";
import AlertToast from "../ui/AlertToast";

const StyledDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialog-paper": {
        borderRadius: "16px",
        maxWidth: "90vw",
        width: "100%",
    },
}));

const TimelineNodeCard = styled(Card)(({ theme }) => ({
    border: "1px solid #e5e7eb",
    "&:hover": {
        borderColor: "#d1d5db",
    },
    transition: "border-color 0.15s",
    cursor: "pointer",
}));

export default function ObjectAuditHistoryModal({ open, onClose, modelName, objectId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedNodeId, setExpandedNodeId] = useState(null);
    const [toast, setToast] = useState({ open: false, type: "success", message: "" });

    useEffect(() => {
        const fetchHistory = async () => {
            if (!objectId || !modelName) return;
            setLoading(true);
            try {
                const res = await getObjectAuditLogs(modelName, objectId);
                const data = res.data || res || [];
                const sorted = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setHistory(sorted);

                if (sorted.length > 0) {
                    setExpandedNodeId(sorted[0].id);
                }
            } catch (err) {
                console.error("Failed to load object revision history:", err);
                setToast({
                    open: true,
                    type: "error",
                    message: "Failed to fetch object audit history from the server",
                });
            } finally {
                setLoading(false);
            }
        };

        if (open && objectId) {
            fetchHistory();
        }
    }, [open, objectId, modelName]);

    const formatTimestamp = (isoString) => {
        if (!isoString) return "-";
        const date = new Date(isoString);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getNodeStyle = (action) => {
        switch (action?.toUpperCase()) {
            case "CREATE":
                return {
                    icon: <AddCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />,
                    bg: "#ecfdf5",
                    border: "#d1fae5",
                    badge: "success",
                };
            case "UPDATE":
                return {
                    icon: <EditIcon sx={{ color: "#f59e0b", fontSize: 20 }} />,
                    bg: "#fffbeb",
                    border: "#fef3c7",
                    badge: "warning",
                };
            case "DELETE":
            case "CANCEL":
                return {
                    icon: <TrashAltIcon sx={{ color: "#ef4444", fontSize: 20 }} />,
                    bg: "#fef2f2",
                    border: "#fee2e2",
                    badge: "error",
                };
            default:
                return {
                    icon: <HistoryIcon sx={{ color: "#6b7280", fontSize: 20 }} />,
                    bg: "#f9fafb",
                    border: "#e5e7eb",
                    badge: "default",
                };
        }
    };

    const toggleNode = (nodeId) => {
        setExpandedNodeId(expandedNodeId === nodeId ? null : nodeId);
    };

    const formatValue = (val) => {
        if (val === null || val === undefined) return "(empty)";
        if (typeof val === "boolean") return val ? "true" : "false";
        if (typeof val === "object") return JSON.stringify(val, null, 2);
        return String(val);
    };

    const renderNodeDetails = (log) => {
        const changes = log.changes || {};
        const action = log.action?.toUpperCase();

        if (action === "UPDATE" && changes.old && changes.new) {
            const oldData = changes.old || {};
            const newData = changes.new || {};
            const keys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)])).sort();
            const changedKeys = keys.filter((k) => formatValue(oldData[k]) !== formatValue(newData[k]));

            if (changedKeys.length === 0) {
                return (
                    <Typography variant="caption" sx={{ fontStyle: "italic", color: "#9ca3af" }}>
                        No value modifications recorded.
                    </Typography>
                );
            }

            return (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                    {changedKeys.map((key) => (
                        <Card key={key} sx={{ border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                            <Box
                                sx={{
                                    backgroundColor: "#f3f4f6",
                                    px: 2,
                                    py: 1,
                                    borderBottom: "1px solid #e5e7eb",
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                                    {key.replace(/_/g, " ").toUpperCase()}
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#9ca3af" }}>
                                    {key}
                                </Typography>
                            </Box>
                            <Grid container sx={{ p: 1.5 }}>
                                <Grid item xs={12} md={5} sx={{ pr: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#ef4444", textTransform: "uppercase", display: "block", mb: 0.5 }}>
                                        Old Value
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: "monospace",
                                            fontSize: "0.75rem",
                                            color: "#6b7280",
                                            wordBreak: "break-all",
                                            textDecoration: "line-through",
                                            decorationColor: "#fca5a5",
                                        }}
                                    >
                                        {formatValue(oldData[key])}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={2} sx={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: "0.75rem" }}>
                                    <ExchangeAltIcon sx={{ fontSize: 14, transform: { xs: "rotate(90deg)", md: "rotate(0deg)" } }} />
                                </Grid>
                                <Grid item xs={12} md={5} sx={{ pl: 1, fontWeight: 700 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#059669", textTransform: "uppercase", display: "block", mb: 0.5 }}>
                                        New Value
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: "monospace",
                                            fontSize: "0.75rem",
                                            color: "#047857",
                                            wordBreak: "break-all",
                                        }}
                                    >
                                        {formatValue(newData[key])}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Card>
                    ))}
                </Box>
            );
        } else {
            const keys = Object.keys(changes)
                .filter((k) => k !== "old" && k !== "new")
                .sort();
            if (keys.length === 0) {
                return (
                    <Typography variant="caption" sx={{ fontStyle: "italic", color: "#9ca3af" }}>
                        No details recorded.
                    </Typography>
                );
            }

            return (
                <Grid container spacing={1.5} sx={{ mt: 1 }}>
                    {keys.map((key) => (
                        <Grid item xs={12} sm={6} key={key}>
                            <Card sx={{ p: 1.5, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                                    {key.replace(/_/g, " ").toUpperCase()}
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#9ca3af", display: "block", mb: 0.5 }}>
                                    {key}
                                </Typography>
                                <Paper
                                    sx={{
                                        p: 1,
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 1,
                                        fontFamily: "monospace",
                                        fontSize: "0.75rem",
                                        fontWeight: 700,
                                        color: "#1f2937",
                                        wordBreak: "break-all",
                                    }}
                                >
                                    {formatValue(changes[key])}
                                </Paper>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            );
        }
    };

    return (
        <>
            <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                {/* HEADER */}
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                backgroundColor: "#dbeafe",
                                border: "1px solid #bfdbfe",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#2563eb",
                            }}
                        >
                            <HistoryIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Object Audit Trail History
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600 }}>
                                Component: {modelName} | Object Reference: {objectId}
                            </Typography>
                        </Box>
                    </Box>
                    <Button size="small" onClick={onClose} sx={{ minWidth: "auto" }}>
                        <CloseIcon />
                    </Button>
                </DialogTitle>

                {/* CONTENT */}
                <DialogContent dividers>
                    {loading ? (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8 }}>
                            <CircularProgress size={32} sx={{ mb: 1.5 }} />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Loading history timeline...
                            </Typography>
                        </Box>
                    ) : history.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 8 }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    backgroundColor: "#f9fafb",
                                    border: "1px solid #e5e7eb",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mx: "auto",
                                    mb: 2,
                                    color: "#9ca3af",
                                }}
                            >
                                <HistoryIcon />
                            </Box>
                            <Typography sx={{ color: "#6b7280", fontWeight: 600, mb: 1 }}>
                                No audit trail recorded
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#9ca3af", fontWeight: 500 }}>
                                No revisions or data changes have been captured for this specific entry yet.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {history.map((log, index) => {
                                const isExpanded = expandedNodeId === log.id;
                                const style = getNodeStyle(log.action);

                                return (
                                    <Box key={log.id} sx={{ position: "relative", pl: 3 }}>
                                        {/* Timeline dot */}
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                left: -12,
                                                top: 0,
                                                width: 28,
                                                height: 28,
                                                borderRadius: "50%",
                                                backgroundColor: "#ffffff",
                                                border: "2px solid #ffffff",
                                                boxShadow: "0 0 0 2px #e5e7eb",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                zIndex: 10,
                                            }}
                                        >
                                            {style.icon}
                                        </Box>

                                        {/* Timeline card */}
                                        <TimelineNodeCard
                                            onClick={() => toggleNode(log.id)}
                                            sx={{
                                                backgroundColor: style.bg,
                                                borderColor: style.border,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    px: 2,
                                                    py: 1.5,
                                                    backgroundColor: "#ffffff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    gap: 1,
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                                                    <Chip
                                                        label={log.action}
                                                        color={style.badge}
                                                        size="small"
                                                        variant="outlined"
                                                    />

                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem", fontWeight: 700 }}>
                                                        <PersonIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
                                                        <span>{log.user_name || "System"}</span>
                                                    </Box>

                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "0.75rem", color: "#9ca3af", fontWeight: 500 }}>
                                                        <ClockIcon sx={{ fontSize: 14 }} />
                                                        <span>{formatTimestamp(log.timestamp)}</span>
                                                    </Box>
                                                </Box>

                                                <ChevronDownIcon
                                                    sx={{
                                                        fontSize: 20,
                                                        color: "#9ca3af",
                                                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                                        transition: "transform 0.2s",
                                                    }}
                                                />
                                            </Box>

                                            {/* Details Section */}
                                            {isExpanded && (
                                                <Box
                                                    sx={{
                                                        px: 2,
                                                        py: 2,
                                                        borderTop: "1px solid #f3f4f6",
                                                        backgroundColor: "#fafbfc",
                                                    }}
                                                >
                                                    {renderNodeDetails(log)}
                                                </Box>
                                            )}
                                        </TimelineNodeCard>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </DialogContent>

                {/* FOOTER */}
                <DialogActions sx={{ p: 1.5, backgroundColor: "#f9fafb" }}>
                    <Button onClick={onClose} variant="contained" sx={{ backgroundColor: "#1f2937" }}>
                        Close History
                    </Button>
                </DialogActions>
            </StyledDialog>

            {/* ALERT TOAST */}
            <AlertToast
                open={toast.open}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
            />
        </>
    );
}
