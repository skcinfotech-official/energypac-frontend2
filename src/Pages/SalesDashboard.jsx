
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ReceiptLong as ReceiptLongIcon,
    AttachMoney as AttachMoneyIcon,
    ChatBubble as ChatBubbleIcon,
    Percent as PercentIcon,
    Description as DescriptionIcon,
    ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Chip,
    Avatar,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from "@mui/material";
import { getSalesDashboardStats } from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";

// Helper to fix API links to Client Routes if needed
const normalizeLink = (link) => {
    if (!link) return "#";

    let newLink = link;

    // Map API resource paths to Frontend Routes
    if (newLink.includes("/sales/quotations")) {
        newLink = newLink.replace("/sales/quotations", "/sales/proforma-invoice");
    } else if (newLink.includes("/sales/queries")) {
        newLink = newLink.replace("/sales/queries", "/sales/client-query");
    }

    // Convert UUID path params to query params if needed
    const idMatch = newLink.match(/\/([a-f0-9-]{36})/);
    if (idMatch) {
        const id = idMatch[1];
        const parts = newLink.split('/' + id);
        newLink = `${parts[0]}?view_id=${id}`;
    }

    return newLink;
};

export default function SalesDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getSalesDashboardStats();
                setStats(data);
            } catch (err) {
                console.error("Failed to load sales dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    height: "100vh",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress sx={{ color: "#1565C0" }} />
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* HEADER */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { md: "center" },
                    justifyContent: "space-between",
                    gap: 2,
                }}
            >
                <Box>
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "#1e293b" }}
                    >
                        Sales Overview
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                        Welcome back, {user?.full_name || "User"}. Here's your
                        sales performance.
                    </Typography>
                </Box>
                {stats?.generated_at && (
                    <Typography
                        variant="caption"
                        sx={{ color: "#64748b", fontWeight: 500 }}
                    >
                        Updated :{" "}
                        {new Date(stats.generated_at).toLocaleString()}
                    </Typography>
                )}
            </Box>

            {stats && (
                <>
                    {/* STATS GRID */}
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                            <StatCard
                                title="Total Quoted Value"
                                value={
                                    stats.values?.total_quoted?.toLocaleString(
                                        "en-IN",
                                        {
                                            style: "currency",
                                            currency: "INR",
                                        }
                                    ) || "₹0"
                                }
                                change={`${stats.quotations?.this_month || 0} Quotes this month`}
                                icon={<ReceiptLongIcon />}
                                color="blue"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                            <StatCard
                                title="Accepted Value"
                                value={
                                    stats.values?.accepted_value?.toLocaleString(
                                        "en-IN",
                                        {
                                            style: "currency",
                                            currency: "INR",
                                        }
                                    ) || "₹0"
                                }
                                change={`${stats.metrics?.acceptance_rate || 0}% Acceptance Rate`}
                                icon={<AttachMoneyIcon />}
                                color="emerald"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                            <StatCard
                                title="Pending Queries"
                                value={stats.client_queries?.pending || 0}
                                change={`Total: ${stats.client_queries?.total || 0}`}
                                icon={<ChatBubbleIcon />}
                                color="orange"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                            <StatCard
                                title="Conversion Rate"
                                value={`${stats.metrics?.conversion_rate || 0}%`}
                                change="Quotations to Orders"
                                icon={<PercentIcon />}
                                color="indigo"
                            />
                        </Grid>
                    </Grid>

                    {/* ALERTS SECTION */}
                    {stats.alerts && stats.alerts.length > 0 && (
                        <Grid container spacing={2}>
                            {stats.alerts.map((alert, idx) => (
                                <Grid size={{ xs: 12, md: 4 }} key={idx}>
                                    <Box
                                        sx={{
                                            bgcolor: "#fffbeb",
                                            border: "1px solid #fde68a",
                                            borderRadius: 3,
                                            p: 2,
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 1.5,
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                bgcolor: "#fef3c7",
                                                color: "#d97706",
                                                width: 36,
                                                height: 36,
                                            }}
                                            variant="rounded"
                                        >
                                            <DescriptionIcon
                                                fontSize="small"
                                            />
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 700,
                                                    color: "#78350f",
                                                }}
                                            >
                                                {alert.title}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: "#b45309",
                                                    display: "block",
                                                    mt: 0.5,
                                                    mb: 1,
                                                }}
                                            >
                                                {alert.message}
                                            </Typography>
                                            {alert.link && (
                                                <Typography
                                                    component={Link}
                                                    to={normalizeLink(
                                                        alert.link
                                                    )}
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: "#d97706",
                                                        textDecoration: "none",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 0.5,
                                                        "&:hover": {
                                                            color: "#92400e",
                                                            textDecoration:
                                                                "underline",
                                                        },
                                                    }}
                                                >
                                                    {alert.action ||
                                                        "View Details"}
                                                    <ArrowForwardIcon
                                                        sx={{ fontSize: 12 }}
                                                    />
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    <Grid container spacing={4}>
                        {/* RECENT ACTIVITY SECTION */}
                        <Grid size={{ xs: 12, lg: 8 }}>
                            <Card
                                sx={{
                                    borderRadius: 4,
                                    border: "1px solid #e2e8f0",
                                    boxShadow:
                                        "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                                    overflow: "hidden",
                                }}
                            >
                                <Box
                                    sx={{
                                        px: 3,
                                        py: 2,
                                        borderBottom: "1px solid #f1f5f9",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 700,
                                            color: "#1e293b",
                                        }}
                                    >
                                        Recent Activity
                                    </Typography>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow
                                                sx={{
                                                    bgcolor: "#f1f5f9",
                                                }}
                                            >
                                                <TableCell
                                                    sx={{
                                                        color: "#64748b",
                                                        textTransform:
                                                            "uppercase",
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        letterSpacing:
                                                            "0.1em",
                                                        py: 1.5,
                                                    }}
                                                >
                                                    Title
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        color: "#64748b",
                                                        textTransform:
                                                            "uppercase",
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        letterSpacing:
                                                            "0.1em",
                                                        py: 1.5,
                                                    }}
                                                >
                                                    Description
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        color: "#64748b",
                                                        textTransform:
                                                            "uppercase",
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        letterSpacing:
                                                            "0.1em",
                                                        py: 1.5,
                                                    }}
                                                >
                                                    Type
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        color: "#64748b",
                                                        textTransform:
                                                            "uppercase",
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        letterSpacing:
                                                            "0.1em",
                                                        py: 1.5,
                                                    }}
                                                >
                                                    Date
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {stats.recent_activities
                                                ?.slice(0, 10)
                                                .map((activity, index) => (
                                                    <ActivityRow
                                                        key={index}
                                                        activity={activity}
                                                        index={index}
                                                    />
                                                ))}
                                            {(!stats.recent_activities ||
                                                stats.recent_activities
                                                    .length === 0) && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={4}
                                                        sx={{
                                                            textAlign:
                                                                "center",
                                                            py: 3,
                                                            color: "#94a3b8",
                                                        }}
                                                    >
                                                        No recent activity
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        </Grid>

                        {/* TOP CLIENTS */}
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <Card
                                sx={{
                                    borderRadius: 4,
                                    border: "1px solid #e2e8f0",
                                    boxShadow:
                                        "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                                    overflow: "hidden",
                                }}
                            >
                                <Box
                                    sx={{
                                        px: 3,
                                        py: 2,
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 700,
                                            color: "#1e293b",
                                        }}
                                    >
                                        Top Clients (This Month)
                                    </Typography>
                                </Box>
                                <Box>
                                    {stats.top_clients_this_month
                                        ?.slice(0, 5)
                                        .map((client, idx) => (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    px: 3,
                                                    py: 1.5,
                                                    borderBottom:
                                                        idx <
                                                        Math.min(
                                                            (stats
                                                                .top_clients_this_month
                                                                ?.length ||
                                                                0) - 1,
                                                            4
                                                        )
                                                            ? "1px solid #f8fafc"
                                                            : "none",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent:
                                                        "space-between",
                                                    gap: 2,
                                                    "&:hover": {
                                                        bgcolor: "#f8fafc",
                                                    },
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: "#1e293b",
                                                            overflow:
                                                                "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {client.client_name}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: "#64748b",
                                                            fontFamily:
                                                                "monospace",
                                                        }}
                                                    >
                                                        {
                                                            client.quotations_count
                                                        }{" "}
                                                        Quotes
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        textAlign: "right",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: "#1565C0",
                                                        }}
                                                    >
                                                        {(
                                                            client.total_value ||
                                                            0
                                                        ).toLocaleString(
                                                            "en-IN",
                                                            {
                                                                style: "currency",
                                                                currency:
                                                                    "INR",
                                                            }
                                                        )}
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            fontSize: 10,
                                                            color: "#94a3b8",
                                                        }}
                                                    >
                                                        Total Value
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    {(!stats.top_clients_this_month ||
                                        stats.top_clients_this_month
                                            .length === 0) && (
                                        <Box
                                            sx={{
                                                p: 2,
                                                textAlign: "center",
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                sx={{ color: "#94a3b8" }}
                                            >
                                                No top clients data
                                                available.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
}

function StatCard({ title, value, change, icon, color }) {
    const colorMap = {
        blue: { bg: "#dbeafe", text: "#1565C0" },
        indigo: { bg: "#e0e7ff", text: "#4338ca" },
        emerald: { bg: "#d1fae5", text: "#059669" },
        orange: { bg: "#ffedd5", text: "#ea580c" },
    };

    const c = colorMap[color] || colorMap.blue;

    return (
        <Card
            sx={{
                p: 3,
                borderRadius: 4,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                transition: "box-shadow 0.2s",
                "&:hover": {
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                },
                "&:hover .stat-avatar": {
                    transform: "scale(1.1)",
                },
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                }}
            >
                <Avatar
                    className="stat-avatar"
                    variant="rounded"
                    sx={{
                        bgcolor: c.bg,
                        color: c.text,
                        width: 44,
                        height: 44,
                        borderRadius: 3,
                        transition: "transform 0.2s",
                    }}
                >
                    {icon}
                </Avatar>
                <Chip
                    label={change}
                    size="small"
                    sx={{
                        bgcolor: "#f1f5f9",
                        color: "#475569",
                        fontWeight: 700,
                        fontSize: 11,
                        height: 24,
                    }}
                />
            </Box>
            <Box>
                <Typography
                    variant="caption"
                    sx={{
                        color: "#64748b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                    }}
                >
                    {title}
                </Typography>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        wordBreak: "break-all",
                        lineHeight: 1.2,
                        mt: 0.5,
                    }}
                >
                    {value}
                </Typography>
            </Box>
        </Card>
    );
}

function ActivityRow({ activity, index }) {
    const typeColors = {
        quotation: { bg: "#dbeafe", text: "#1d4ed8" },
        client_query: { bg: "#fef3c7", text: "#b45309" },
        order: { bg: "#d1fae5", text: "#059669" },
        other: { bg: "#f1f5f9", text: "#475569" },
    };

    const typeLabel = {
        quotation: "Quotation",
        client_query: "Query",
        order: "Order",
    };

    const typeKey = activity.type || "other";
    const colors = typeColors[typeKey] || typeColors.other;

    return (
        <TableRow
            sx={{
                bgcolor: index % 2 === 0 ? "#f8fafc" : "#ffffff",
                "&:hover": { bgcolor: "#e2e8f0" },
                transition: "background-color 0.15s",
            }}
        >
            <TableCell sx={{ py: 2 }}>
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 600,
                        color: "#334155",
                        letterSpacing: "0.025em",
                    }}
                >
                    {activity.link ? (
                        <Typography
                            component={Link}
                            to={normalizeLink(activity.link)}
                            sx={{
                                color: "inherit",
                                textDecoration: "none",
                                "&:hover": {
                                    color: "#1565C0",
                                    textDecoration: "underline",
                                },
                            }}
                        >
                            {activity.title}
                        </Typography>
                    ) : (
                        activity.title
                    )}
                </Typography>
            </TableCell>
            <TableCell sx={{ py: 2 }}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                    {activity.description}
                </Typography>
            </TableCell>
            <TableCell sx={{ py: 2 }}>
                <Chip
                    label={typeLabel[typeKey] || typeKey}
                    size="small"
                    sx={{
                        bgcolor: colors.bg,
                        color: colors.text,
                        fontWeight: 700,
                        fontSize: 10,
                        textTransform: "uppercase",
                        height: 22,
                    }}
                />
            </TableCell>
            <TableCell align="right" sx={{ py: 2 }}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                    {new Date(activity.date).toLocaleDateString()}
                </Typography>
            </TableCell>
        </TableRow>
    );
}
