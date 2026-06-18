import { useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import Navbar from "./layout/Navbar";
import Sidebar from "./layout/Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout({ status }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    if (status === "loading" || status === "idle") {
        return (
            <Box sx={{
                height: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                bgcolor: 'background.default',
            }}>
                <CircularProgress size={48} thickness={4} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Initializing System...
                </Typography>
            </Box>
        );
    }

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, transition: 'all 0.25s ease' }}>
                <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

                <Box component="main" sx={{
                    flex: 1, overflowY: 'auto',
                    p: { xs: 2, md: 3 },
                }}>
                    <Box sx={{ maxWidth: 1800, mx: 'auto' }}>
                        <Outlet />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
