import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

export default function UserLayout() {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
            <Box component="main" sx={{ maxWidth: '1200px', mx: 'auto', px: 2, py: 4 }}>
                <Outlet />
            </Box>
        </Box>
    );
}
