import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Button,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    Paper,
} from "@mui/material";
import {
    Close as CloseIcon,
    Person as PersonIcon,
    StorageOutlined as DatabaseIcon,
    AccessTimeOutlined as ClockIcon,
    SwapHoriz as ExchangeAltIcon,
    AddCircle as AddCircleIcon,
    EditOutlined as EditIcon,
    Delete as TrashAltIcon,
    ExpandMore as ChevronDownIcon,
    Info as InfoCircleIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const StyledDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialog-paper": {
        borderRadius: "16px",
        maxWidth: "90vw",
        width: "100%",
    },
}));

const MetadataCard = styled(Card)(({ theme, color }) => ({
    backgroundColor: "#ffffff",
    borderColor: `${color}20`,
    "&:hover": {
        borderColor: `${color}40`,
    },
    transition: "border-color 0.2s",
}));

export default function AuditLogDetailModal({ open, onClose, log }) {
    const [showUnchanged, setShowUnchanged] = useState(false);

    if (!log) return null;

    const formatTimestamp = (isoString) => {
        if (!isoString) return "-";
        const date = new Date(isoString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getActionColor = (action) => {
        switch (action?.toUpperCase()) {
            case "CREATE":
                return "success";
            case "UPDATE":
                return "warning";
            case "DELETE":
                return "error";
            default:
                return "default";
        }
    };

    const getActionIcon = (action) => {
        switch (action?.toUpperCase()) {
            case "CREATE":
                return <AddCircleIcon sx={{ color: "#10b981" }} />;
            case "UPDATE":
                return <EditIcon sx={{ color: "#f59e0b" }} />;
            case "DELETE":
                return <TrashAltIcon sx={{ color: "#ef4444" }} />;
            default:
                return <DatabaseIcon sx={{ color: "#6b7280" }} />;
        }
    };

    const formatValue = (val) => {
        if (val === null || val === undefined) return "(empty)";
        if (typeof val === "boolean") return val ? "true" : "false";
        if (typeof val === "object") return JSON.stringify(val, null, 2);
        const str = String(val).trim();
        return str === "" ? "(empty)" : str;
    };

    const renderChanges = () => {
        const action = log.action?.toUpperCase();
        const changes = log.changes || {};

        if (action === "UPDATE") {
            const oldData = changes.old || {};
            const newData = changes.new || {};

            const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)])).sort();

            const changedKeys = [];
            const unchangedKeys = [];

            allKeys.forEach((key) => {
                const oldVal = formatValue(oldData[key]);
                const newVal = formatValue(newData[key]);
                if (oldVal !== newVal) {
                    changedKeys.push(key);
                } else {
                    unchangedKeys.push(key);
                }
            });

            if (allKeys.length === 0) {
                return (
                    <Paper
                        sx={{
                            p: 4,
                            textAlign: "center",
                            color: "#9ca3af",
                            backgroundColor: "#f9fafb",
                            border: "2px dashed #e5e7eb",
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="body2">
                            No detailed changes were registered for this update.
                        </Typography>
                    </Paper>
                );
            }

            return (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {/* CHANGED FIELDS */}
                    <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <ExchangeAltIcon sx={{ color: "#3b82f6", fontSize: 18 }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                    Modified Attributes ({changedKeys.length})
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <InfoCircleIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
                                <Typography variant="caption" sx={{ color: "#9ca3af", fontWeight: 600 }}>
                                    Showing only changes
                                </Typography>
                            </Box>
                        </Box>

                        {changedKeys.length === 0 ? (
                            <Paper
                                sx={{
                                    p: 2,
                                    textAlign: "center",
                                    color: "#9ca3af",
                                    backgroundColor: "#f9fafb",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 1.5,
                                }}
                            >
                                <Typography variant="caption">
                                    All attribute values remained identical during this revision.
                                </Typography>
                            </Paper>
                        ) : (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {changedKeys.map((key) => {
                                    const oldVal = oldData[key];
                                    const newVal = newData[key];

                                    return (
                                        <Card
                                            key={key}
                                            sx={{
                                                border: "1px solid #e5e7eb",
                                                "&:hover": { borderColor: "#d1d5db" },
                                                transition: "border-color 0.2s",
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    px: 2,
                                                    py: 1.5,
                                                    backgroundColor: "#f9fafb",
                                                    borderBottom: "1px solid #f3f4f6",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                                    {key.replace(/_/g, " ").toUpperCase()}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#9ca3af" }}>
                                                    {key}
                                                </Typography>
                                            </Box>

                                            <Grid container sx={{ divider: "1px solid #f3f4f6" }}>
                                                {/* Old Value */}
                                                <Grid item xs={12} md={5} sx={{ p: 2, backgroundColor: "#fef2f2" }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                                        Before Changes
                                                    </Typography>
                                                    <Paper
                                                        sx={{
                                                            p: 1.5,
                                                            backgroundColor: "#fee2e2",
                                                            border: "1px solid #fecaca",
                                                            borderRadius: 1,
                                                            fontFamily: "monospace",
                                                            fontSize: "0.75rem",
                                                            color: "#991b1b",
                                                            wordBreak: "break-all",
                                                            minHeight: "50px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            textDecoration: "line-through",
                                                            decorationColor: "#fca5a5",
                                                        }}
                                                    >
                                                        {formatValue(oldVal)}
                                                    </Paper>
                                                </Grid>

                                                {/* Arrow */}
                                                <Grid item xs={12} md={2} sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 2 }}>
                                                    <Box
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: "50%",
                                                            backgroundColor: "#ffffff",
                                                            border: "1px solid #e5e7eb",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <ExchangeAltIcon sx={{ fontSize: 14, color: "#3b82f6" }} />
                                                    </Box>
                                                </Grid>

                                                {/* New Value */}
                                                <Grid item xs={12} md={5} sx={{ p: 2, backgroundColor: "#f0fdf4" }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                                                        After Changes
                                                    </Typography>
                                                    <Paper
                                                        sx={{
                                                            p: 1.5,
                                                            backgroundColor: "#dcfce7",
                                                            border: "1px solid #bbf7d0",
                                                            borderRadius: 1,
                                                            fontFamily: "monospace",
                                                            fontSize: "0.75rem",
                                                            color: "#166534",
                                                            wordBreak: "break-all",
                                                            minHeight: "50px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {formatValue(newVal)}
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                        </Card>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>

                    {/* UNCHANGED FIELDS ACCORDION */}
                    {unchangedKeys.length > 0 && (
                        <Accordion
                            sx={{
                                border: "1px solid #e5e7eb",
                                "&:before": { display: "none" },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ChevronDownIcon />}
                                sx={{ backgroundColor: "#f9fafb" }}
                            >
                                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                    Unmodified Attributes ({unchangedKeys.length})
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                                Attribute Name
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "monospace" }}>
                                                Key
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                                Value
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {unchangedKeys.map((key) => (
                                            <TableRow key={key} sx={{ "&:hover": { backgroundColor: "#f9fafb" } }}>
                                                <TableCell sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>
                                                    {key.replace(/_/g, " ").toUpperCase()}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: "0.75rem", color: "#9ca3af", fontFamily: "monospace" }}>
                                                    {key}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: "0.875rem", color: "#6b7280", wordBreak: "break-all" }}>
                                                    {formatValue(oldData[key])}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionDetails>
                        </Accordion>
                    )}
                </Box>
            );
        } else {
            // Flat object changes (CREATE, DELETE, etc.)
            const keys = Object.keys(changes).sort();

            if (keys.length === 0) {
                return (
                    <Paper
                        sx={{
                            p: 4,
                            textAlign: "center",
                            color: "#9ca3af",
                            backgroundColor: "#f9fafb",
                            border: "2px dashed #e5e7eb",
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="body2">No property details were recorded.</Typography>
                    </Paper>
                );
            }

            return (
                <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <DatabaseIcon sx={{ color: "#3b82f6", fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Object Properties ({keys.length})
                        </Typography>
                    </Box>
                    <Grid container spacing={2}>
                        {keys.map((key) => (
                            <Grid item xs={12} md={6} key={key}>
                                <Card
                                    sx={{
                                        border: "1px solid #e5e7eb",
                                        "&:hover": { borderColor: "#d1d5db" },
                                        transition: "border-color 0.2s",
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            px: 2,
                                            py: 1,
                                            backgroundColor: "#f9fafb",
                                            borderBottom: "1px solid #f3f4f6",
                                            display: "flex",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                            {key.replace(/_/g, " ").toUpperCase()}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#9ca3af" }}>
                                            {key}
                                        </Typography>
                                    </Box>
                                    <CardContent sx={{ flex: 1 }}>
                                        <Paper
                                            sx={{
                                                p: 1.5,
                                                backgroundColor: action === "CREATE" ? "#dcfce7" : "#fee2e2",
                                                border: `1px solid ${action === "CREATE" ? "#bbf7d0" : "#fecaca"}`,
                                                borderRadius: 1,
                                                fontFamily: "monospace",
                                                fontSize: "0.75rem",
                                                color: action === "CREATE" ? "#166534" : "#991b1b",
                                                wordBreak: "break-all",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {formatValue(changes[key])}
                                        </Paper>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            );
        }
    };

    return (
        <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            {/* DIALOG HEADER */}
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            backgroundColor: "#f3f4f6",
                            border: "1px solid #e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {getActionIcon(log.action)}
                    </Box>
                    <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Audit Log Detail
                            </Typography>
                            <Chip
                                label={log.action}
                                color={getActionColor(log.action)}
                                size="small"
                                variant="outlined"
                            />
                        </Box>
                        <Typography variant="caption" sx={{ color: "#9ca3af", fontFamily: "monospace" }}>
                            ID: {log.id}
                        </Typography>
                    </Box>
                </Box>
                <Button size="small" onClick={onClose} sx={{ minWidth: "auto" }}>
                    <CloseIcon />
                </Button>
            </DialogTitle>

            {/* DIALOG CONTENT */}
            <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* METADATA CARDS */}
                <Grid container spacing={2}>
                    {/* User Card */}
                    <Grid item xs={12} md={6} lg={3}>
                        <Card
                            sx={{
                                p: 2,
                                border: "1px solid #e5e7eb",
                                backgroundColor: "#eff6ff",
                                "&:hover": { borderColor: "#93c5fd" },
                            }}
                        >
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1,
                                        backgroundColor: "#dbeafe",
                                        border: "1px solid #bfdbfe",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#2563eb",
                                        flexShrink: 0,
                                    }}
                                >
                                    <PersonIcon sx={{ fontSize: 16 }} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                                        Performer
                                    </Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1f2937" }}>
                                        {log.user_name || "Unknown User"}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "#9ca3af", fontFamily: "monospace" }}>
                                        {log.user || "No UUID"}
                                    </Typography>
                                </Box>
                            </Box>
                        </Card>
                    </Grid>

                    {/* Model Card */}
                    <Grid item xs={12} md={6} lg={3}>
                        <Card
                            sx={{
                                p: 2,
                                border: "1px solid #e5e7eb",
                                backgroundColor: "#eef2ff",
                                "&:hover": { borderColor: "#c7d2fe" },
                            }}
                        >
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1,
                                        backgroundColor: "#e0e7ff",
                                        border: "1px solid #c7d2fe",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#4f46e5",
                                        flexShrink: 0,
                                    }}
                                >
                                    <DatabaseIcon sx={{ fontSize: 16 }} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                                        Data Component
                                    </Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1f2937" }}>
                                        {log.model_name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "#6366f1" }}>
                                        Model Entity
                                    </Typography>
                                </Box>
                            </Box>
                        </Card>
                    </Grid>

                    {/* Target Object */}
                    <Grid item xs={12} lg={6}>
                        <Card
                            sx={{
                                p: 2,
                                border: "1px solid #e5e7eb",
                                backgroundColor: "#faf5ff",
                                "&:hover": { borderColor: "#e9d5ff" },
                            }}
                        >
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1,
                                        backgroundColor: "#f3e8ff",
                                        border: "1px solid #e9d5ff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#a855f7",
                                        flexShrink: 0,
                                    }}
                                >
                                    <DatabaseIcon sx={{ fontSize: 16 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                                        Affected Target
                                    </Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1f2937" }}>
                                        {log.object_repr || "-"}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "#9ca3af", fontFamily: "monospace" }}>
                                        Obj ID: {log.object_id}
                                    </Typography>
                                </Box>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>

                {/* TIMESTAMP */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        pb: 2,
                        borderBottom: "1px solid #e5e7eb",
                        gap: 1,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem", color: "#6b7280" }}>
                        <ClockIcon sx={{ fontSize: 16 }} />
                        <span>Registered at {formatTimestamp(log.timestamp)}</span>
                    </Box>
                    <Typography variant="caption" sx={{ color: "#9ca3af", fontFamily: "monospace" }}>
                        UTC Timestamp: {log.timestamp}
                    </Typography>
                </Box>

                {/* CHANGES */}
                <Box>{renderChanges()}</Box>
            </DialogContent>

            {/* DIALOG ACTIONS */}
            <DialogActions sx={{ p: 2, backgroundColor: "#f9fafb" }}>
                <Button onClick={onClose} variant="contained" sx={{ backgroundColor: "#1f2937" }}>
                    Close Details
                </Button>
            </DialogActions>
        </StyledDialog>
    );
}
