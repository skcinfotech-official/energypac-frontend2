import { useState, useEffect } from "react";
import {
    Box, Card, CardContent, Typography, Grid, Avatar, CircularProgress, Skeleton, Chip
} from "@mui/material";
import {
    People as PeopleIcon, AdminPanelSettings as AdminIcon,
    VpnKey as KeyIcon, PersonOff as PersonOffIcon,
    VerifiedUser as VerifiedUserIcon,
} from "@mui/icons-material";
import { adminService } from "../services/adminService";

export default function AdminDashboard() {
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminService.getUserStats();
                setStatsData(data);
            } catch (error) {
                console.error("Failed to fetch user stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { label: "Total Users", value: statsData?.total_users || "0", icon: <PeopleIcon />, color: '#1565C0', bgColor: '#EBF5FF' },
        { label: "Active Users", value: statsData?.active_users || "0", icon: <VerifiedUserIcon />, color: '#2E7D32', bgColor: '#E8F5E9' },
        { label: "Admin Roles", value: statsData?.admin_count || "0", icon: <AdminIcon />, color: '#5E35B1', bgColor: '#EDE7F6' },
        { label: "Inactive Users", value: statsData?.inactive_users || "0", icon: <PersonOffIcon />, color: '#E65100', bgColor: '#FFF3E0' },
    ];

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>Admin Dashboard</Typography>
                <Typography variant="body2" color="text.secondary">System overview and administrative controls.</Typography>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {loading ? (
                    [1, 2, 3, 4].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Skeleton variant="rounded" width={42} height={42} sx={{ mb: 2 }} />
                                    <Skeleton width="60%" height={16} sx={{ mb: 1 }} />
                                    <Skeleton width="40%" height={32} />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : (
                    stats.map((stat, idx) => (
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={idx}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Avatar sx={{ bgcolor: stat.bgColor, color: stat.color, width: 42, height: 42, borderRadius: 2.5 }}>
                                            {stat.icon}
                                        </Avatar>
                                    </Box>
                                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                        {stat.label}
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                        {stat.value}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>

            {/* Recent Activity */}
            <Card>
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent System Activity</Typography>
                </Box>
                <Box>
                    {[1, 2, 3].map((_, i) => (
                        <Box key={i} sx={{
                            px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 2,
                            borderBottom: '1px solid', borderColor: 'divider',
                            '&:last-child': { borderBottom: 0 },
                            '&:hover': { bgcolor: '#FAFBFC' },
                        }}>
                            <Avatar sx={{ bgcolor: '#EDE7F6', color: '#5E35B1', width: 40, height: 40 }}>
                                <KeyIcon sx={{ fontSize: '1.1rem' }} />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>User Login Detected</Typography>
                                <Typography variant="caption" color="text.secondary">System integrity check performed</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary">{i * 5 + 2} minutes ago</Typography>
                                <Chip label="Success" size="small" sx={{ display: 'block', mt: 0.5, bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700, fontSize: '0.6rem' }} />
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Card>
        </Box>
    );
}
