import { Box, Typography } from "@mui/material";
import { Construction as ConstructionIcon } from "@mui/icons-material";

export default function Pending() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 2 }}>
            <ConstructionIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.4 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>Coming Soon</Typography>
        </Box>
    );
}
