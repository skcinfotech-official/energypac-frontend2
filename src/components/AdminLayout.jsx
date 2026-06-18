import { useState } from "react";
import { Box } from "@mui/material";
import AdminNavbar from "./layout/AdminNavbar";
import AdminSidebar from "./layout/AdminSidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F7FA' }}>
      <Box sx={{ height: '100vh', display: 'flex', overflow: 'hidden' }}>
        {/* LEFT SIDEBAR */}
        <AdminSidebar isOpen={isSidebarOpen} />

        {/* RIGHT SIDE AREA */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, transition: 'all 300ms' }}>
          {/* TOP NAVBAR */}
          <AdminNavbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

          {/* MAIN CONTENT AREA */}
          <Box component="main" sx={{ flex: 1, overflowY: 'auto', p: { xs: 1, md: 4 }, bgcolor: '#F5F7FA' }}>
            <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
              <Outlet />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
