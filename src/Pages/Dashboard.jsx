import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Box, Card, CardContent, Typography, Grid, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, CircularProgress, Avatar, Skeleton
} from "@mui/material";
import {
    Inventory2 as InventoryIcon,
    People as PeopleIcon,
    ListAlt as ListAltIcon,
    ShoppingCart as ShoppingCartIcon,
    ArrowForward as ArrowForwardIcon,
    Warning as WarningIcon,
} from "@mui/icons-material";
import { getDashboardStats } from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";

const normalizeLink = (link) => {
    if (!link) return "#";
    let newLink = link;
    if (link.includes("/purchase-orders")) {
        newLink = link.replace("/purchase-orders", "/purchase-order");
    } else if (link.includes("/requisitions")) {
        newLink = link.replace("/requisitions", "/requisition");
    } else if (link.includes("/quotations")) {
        newLink = link.replace("/quotations", "/vendor-quotation");
    }
    const idMatch = newLink.match(/\/([a-f0-9-]{36})/);
    if (idMatch) {
        const id = idMatch[1];
        const parts = newLink.split('/' + id);
        newLink = `${parts[0]}?view_id=${id}`;
    }
    return newLink;
};

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                setStats(data);
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress size={44} />
            </Box>
        );
    }

    const alertsToDisplay = stats?.alerts ? (() => {
        const stockAlerts = stats.alerts.filter(a => {
            const text = (a.title + " " + a.message).toLowerCase();
            return text.includes("low stock") || text.includes("out of stock");
        });
        const otherAlerts = stats.alerts.filter(a => {
            const text = (a.title + " " + a.message).toLowerCase();
            return !text.includes("low stock") && !text.includes("out of stock");
        });
        if (stockAlerts.length > 0) {
            return [{
                title: "Stock Health Alert",
                message: `${stockAlerts.length} items are Low or Out of Stock.`,
                link: "/master/item?filter=low_stock",
                action: "View All"
            }, ...otherAlerts];
        }
        return stats.alerts;
    })() : [];

    const statCards = [
        {
            title: "Total Inventory Value",
            value: stats?.inventory?.total_inventory_value?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || "₹0",
            subtitle: `${stats?.inventory?.total_products || 0} Products`,
            icon: <InventoryIcon />,
            color: '#1565C0',
            bgColor: '#EBF5FF',
        },
        {
            title: "Active Vendors",
            value: stats?.vendors?.active_vendors_last_30_days || 0,
            subtitle: `Total: ${stats?.vendors?.total_vendors || 0}`,
            icon: <PeopleIcon />,
            color: '#5E35B1',
            bgColor: '#EDE7F6',
        },
        {
            title: "Pending Requisitions",
            value: stats?.requisitions?.pending_requisitions || 0,
            subtitle: `Total: ${stats?.requisitions?.total_requisitions || 0}`,
            icon: <ListAltIcon />,
            color: '#E65100',
            bgColor: '#FFF3E0',
        },
        {
            title: "Pending PO Value",
            value: stats?.purchase_orders?.pending_po_value?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || "₹0",
            subtitle: `${stats?.purchase_orders?.pending_pos || 0} Pending POs`,
            icon: <ShoppingCartIcon />,
            color: '#2E7D32',
            bgColor: '#E8F5E9',
        },
    ];

    const typeColors = {
        purchase_order: { bg: '#E8F5E9', text: '#2E7D32', label: 'PO' },
        quotation: { bg: '#EBF5FF', text: '#1565C0', label: 'Quotation' },
        requisition: { bg: '#FFF3E0', text: '#E65100', label: 'Requisition' },
        other: { bg: '#F1F5F9', text: '#475569', label: 'Other' },
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 1 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>Purchase Overview</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Welcome back, {user?.full_name || "User"}. Here's what's happening today.
                    </Typography>
                </Box>
                {stats?.generated_at && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Updated: {new Date(stats.generated_at).toLocaleString()}
                    </Typography>
                )}
            </Box>

            {stats && (
                <>
                    {/* Stat Cards */}
                    <Grid container spacing={2.5} sx={{ mb: 3 }}>
                        {statCards.map((card, i) => (
                            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Avatar sx={{ bgcolor: card.bgColor, color: card.color, width: 42, height: 42, borderRadius: 2.5 }}>
                                                {card.icon}
                                            </Avatar>
                                            <Chip label={card.subtitle} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: card.bgColor, color: card.color }} />
                                        </Box>
                                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                            {card.title}
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', wordBreak: 'break-all' }}>
                                            {card.value}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Alerts */}
                    {alertsToDisplay.length > 0 && (
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            {alertsToDisplay.map((alert, idx) => (
                                <Grid size={{ xs: 12, md: 4 }} key={idx}>
                                    <Card sx={{ bgcolor: '#FFF8E1', borderColor: '#FFE082', borderLeft: '4px solid #F9A825' }}>
                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                            <Avatar sx={{ bgcolor: '#FFF3E0', color: '#E65100', width: 36, height: 36, borderRadius: 2 }}>
                                                <WarningIcon sx={{ fontSize: '1.1rem' }} />
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#E65100', textTransform: 'none', letterSpacing: 0 }}>
                                                    {alert.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#BF360C', display: 'block', mb: 0.5 }}>
                                                    {alert.message}
                                                </Typography>
                                                {alert.link && (
                                                    <Typography component={Link} to={normalizeLink(alert.link)}
                                                        variant="caption" sx={{
                                                            fontWeight: 700, color: '#E65100', display: 'inline-flex',
                                                            alignItems: 'center', gap: 0.3, textDecoration: 'none',
                                                            '&:hover': { textDecoration: 'underline' },
                                                        }}>
                                                        {alert.action || "View Details"} <ArrowForwardIcon sx={{ fontSize: '0.7rem' }} />
                                                    </Typography>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* Main Content */}
                    <Grid container spacing={2.5}>
                        {/* Recent Activity Table */}
                        <Grid size={{ xs: 12, lg: 8 }}>
                            <Card>
                                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Activity</Typography>
                                </Box>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Title</TableCell>
                                                <TableCell>Description</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell align="right">Date</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {stats.recent_activities?.slice(0, 10).map((activity, index) => {
                                                const tc = typeColors[activity.type || 'other'] || typeColors.other;
                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            {activity.link ? (
                                                                <Typography component={Link} to={normalizeLink(activity.link)} variant="body2"
                                                                    sx={{ fontWeight: 600, color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
                                                                    {activity.title}
                                                                </Typography>
                                                            ) : (
                                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{activity.title}</Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="caption" color="text.secondary">{activity.description}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip label={tc.label} size="small" sx={{ bgcolor: tc.bg, color: tc.text, fontWeight: 700, fontSize: '0.6rem' }} />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(activity.date).toLocaleDateString()}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {(!stats.recent_activities || stats.recent_activities.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                        <Typography variant="body2" color="text.secondary">No recent activity</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        </Grid>

                        {/* Right Column */}
                        <Grid size={{ xs: 12, lg: 4 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                {/* Top Products */}
                                <Card>
                                    <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Top Inventory Value</Typography>
                                    </Box>
                                    {stats.top_products?.slice(0, 5).map((prod, idx) => (
                                        <Box key={idx} sx={{
                                            px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between',
                                            alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider',
                                            '&:last-child': { borderBottom: 0 }, '&:hover': { bgcolor: '#FAFBFC' },
                                        }}>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {prod.item_name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                    {prod.item_code}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', wordBreak: 'break-all' }}>
                                                    {prod.stock_value?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">Stock: {prod.current_stock}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Card>

                                {/* Top Vendors */}
                                <Card>
                                    <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Top Vendors (by PO)</Typography>
                                    </Box>
                                    {stats.top_vendors?.slice(0, 5).map((vendor, idx) => (
                                        <Box key={idx} sx={{
                                            px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between',
                                            alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider',
                                            '&:last-child': { borderBottom: 0 }, '&:hover': { bgcolor: '#FAFBFC' },
                                        }}>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {vendor.vendor_name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                    {vendor.vendor_code}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main', wordBreak: 'break-all' }}>
                                                    {(vendor.total_po_value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">Total PO Value</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Card>
                            </Box>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
}
