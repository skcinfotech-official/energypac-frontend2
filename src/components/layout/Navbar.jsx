import { useState } from "react";
import {
    AppBar, Toolbar, IconButton, Typography, Box, Button, Avatar,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Chip
} from "@mui/material";
import {
    Menu as MenuIcon,
    Logout as LogoutIcon,
    FiberManualRecord as DotIcon,
    ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { NotificationBell } from "../notifications";

export default function Navbar({ toggleSidebar, isSidebarOpen }) {
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [logoutOpen, setLogoutOpen] = useState(false);

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === "/") return "Purchase Dashboard";
        if (path === "/sales/dashboard") return "Sales Dashboard";
        return path.split("/").pop().replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    };

    const getBreadcrumb = () => {
        const path = location.pathname;
        if (path === "/") return null;
        const segments = path.split("/").filter(Boolean);
        if (segments.length <= 1) return null;
        return segments.slice(0, -1).map(s => s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())).join(" / ");
    };

    const breadcrumb = getBreadcrumb();

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    color: 'text.primary',
                    zIndex: 10,
                }}
            >
                <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, md: 3 } }}>
                    <IconButton
                        onClick={toggleSidebar}
                        size="small"
                        data-tour="tour-menu-toggle"
                        sx={{
                            mr: 2, color: 'text.secondary',
                            '&:hover': { color: 'primary.main', bgcolor: 'primary.main', '& .MuiSvgIcon-root': { color: '#fff' } },
                            transition: 'all 0.2s',
                        }}
                    >
                        <MenuIcon sx={{ transform: isSidebarOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
                    </IconButton>

                    <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}>
                        {breadcrumb && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: -0.3 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary' }}>
                                    {breadcrumb}
                                </Typography>
                            </Box>
                        )}
                        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '1rem' }}>
                            {getPageTitle()}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box data-tour="tour-notifications" sx={{ display: 'flex' }}>
                            <NotificationBell />
                        </Box>

                        <Chip
                            icon={<DotIcon sx={{ fontSize: '0.5rem !important', color: '#4CAF50 !important' }} />}
                            label={user?.full_name || "User"}
                            size="small"
                            variant="outlined"
                            onClick={() => navigate('/profile')}
                            data-tour="tour-userchip"
                            sx={{
                                display: { xs: 'none', sm: 'flex' },
                                fontWeight: 600, fontSize: '0.75rem',
                                borderColor: 'divider', color: 'text.secondary',
                                cursor: 'pointer',
                                '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                            }}
                        />
                        <Button
                            onClick={() => setLogoutOpen(true)}
                            startIcon={<LogoutIcon sx={{ fontSize: '1rem' }} />}
                            size="small"
                            data-tour="tour-logout"
                            sx={{
                                color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem',
                                border: '1px solid', borderColor: 'divider',
                                '&:hover': { borderColor: 'error.light', color: '#fff', bgcolor: 'error.main', '& .MuiSvgIcon-root': { color: '#fff' } },
                                transition: 'all 0.2s',
                            }}
                        >
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Log Out</Box>
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Logout Dialog */}
            <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'error.light', width: 36, height: 36 }}>
                        <LogoutIcon sx={{ fontSize: '1.1rem' }} />
                    </Avatar>
                    Confirm Logout
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: '0.85rem' }}>
                        Are you sure you want to log out from your account?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLogoutOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={logout} variant="contained" color="error" startIcon={<LogoutIcon />}>
                        Logout
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
