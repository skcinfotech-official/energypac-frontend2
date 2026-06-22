import { useCallback, useEffect, useRef, useState } from "react";
import {
    Fab, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText,
    Box, Typography, Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
    School as SchoolIcon,
    Explore as ExploreIcon,
    AttachMoney as SalesIcon,
    ShoppingCart as PurchaseIcon,
    LocalShipping as TransportIcon,
    AccountBalance as FinanceIcon,
    PlayCircle as PlayIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { availableTours, getTour, canReadModule } from "../tours/tourDefinitions";

const TOUR_SEEN_KEY = "energypac_tour_seen_v1";

const TOUR_ICONS = {
    orientation: <ExploreIcon fontSize="small" />,
    "sales-flow": <SalesIcon fontSize="small" />,
    "purchase-flow": <PurchaseIcon fontSize="small" />,
    "transport-flow": <TransportIcon fontSize="small" />,
    "finance-flow": <FinanceIcon fontSize="small" />,
};

export default function TourLauncher() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const driverRef = useRef(null);

    const startTour = useCallback((tourId) => {
        setAnchorEl(null);
        const tour = getTour(tourId);
        if (!tour) return;

        if (driverRef.current) {
            try { driverRef.current.destroy(); } catch { /* noop */ }
        }

        // Drop steps the user can't follow:
        //  1. A cross-module step (s.module) the user has no read access to —
        //     its page/route would be permission-blocked.
        //  2. A non-navigating step whose target element isn't on screen
        //     (e.g. a sidebar item hidden because that module is off).
        // Steps with a `route` are otherwise kept — their element appears after
        // navigation, so we can't query for it yet.
        const steps = tour.steps.filter((s) => {
            if (s.module && !canReadModule(user, s.module)) return false;
            return s.route || document.querySelector(s.element);
        });
        if (steps.length === 0) return;

        const driverObj = driver({
            showProgress: true,
            allowClose: true,
            stagePadding: 6,
            stageRadius: 8,
            overlayColor: "rgba(15, 23, 42, 0.72)",
            nextBtnText: "Next →",
            prevBtnText: "← Back",
            doneBtnText: "Done ✓",
            progressText: "{{current}} of {{total}}",
            popoverClass: "energypac-tour",
            steps: steps.map((s) => ({ element: s.element, popover: s.popover })),
            onNextClick: () => {
                const idx = driverObj.getActiveIndex();
                const next = steps[idx + 1];
                if (next?.route && next.route !== window.location.pathname) {
                    navigate(next.route);
                    setTimeout(() => driverObj.moveNext(), 480);
                } else {
                    driverObj.moveNext();
                }
            },
            onPrevClick: () => {
                const idx = driverObj.getActiveIndex();
                const prev = steps[idx - 1];
                if (prev?.route && prev.route !== window.location.pathname) {
                    navigate(prev.route);
                    setTimeout(() => driverObj.movePrevious(), 480);
                } else {
                    driverObj.movePrevious();
                }
            },
        });
        driverRef.current = driverObj;

        const first = steps[0];
        if (first?.route && first.route !== window.location.pathname) {
            navigate(first.route);
            setTimeout(() => driverObj.drive(), 480);
        } else {
            driverObj.drive();
        }
    }, [navigate, user]);

    // Allow other pages (e.g. the User Guide) to launch a tour by name.
    useEffect(() => {
        const handler = (e) => startTour(e?.detail || "orientation");
        window.addEventListener("energypac:start-tour", handler);
        return () => window.removeEventListener("energypac:start-tour", handler);
    }, [startTour]);

    // First-ever visit: auto-play the orientation tour once.
    useEffect(() => {
        if (localStorage.getItem(TOUR_SEEN_KEY)) return;
        const t = setTimeout(() => {
            localStorage.setItem(TOUR_SEEN_KEY, "1");
            startTour("orientation");
        }, 1400);
        return () => clearTimeout(t);
    }, [startTour]);

    // Clean up driver on unmount.
    useEffect(() => () => {
        if (driverRef.current) {
            try { driverRef.current.destroy(); } catch { /* noop */ }
        }
    }, []);

    const list = availableTours(user);

    return (
        <>
            <Tooltip title="Guided tours" placement="left" arrow>
                <Fab
                    size="medium"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{
                        position: "fixed",
                        bottom: 24,
                        right: 24,
                        zIndex: 1200,
                        bgcolor: "#1565C0",
                        color: "#fff",
                        boxShadow: "0 6px 20px rgba(21,101,192,0.4)",
                        "&:hover": { bgcolor: "#0D47A1", transform: "scale(1.06)" },
                        transition: "all 0.2s",
                    }}
                >
                    <SchoolIcon />
                </Fab>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "top", horizontal: "left" }}
                transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                PaperProps={{ sx: { borderRadius: 3, minWidth: 280, mb: 1, boxShadow: "0 8px 30px rgba(0,0,0,0.18)" } }}
            >
                <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "#1565C0", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 0.75 }}>
                        <PlayIcon sx={{ fontSize: 16 }} /> Interactive Tours
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: "grey.500", mt: 0.25 }}>
                        Pick one — we'll highlight each step on the real screen.
                    </Typography>
                </Box>
                <Divider />
                {list.map((tour) => (
                    <MenuItem key={tour.id} onClick={() => startTour(tour.id)} sx={{ py: 1.25, alignItems: "flex-start" }}>
                        <ListItemIcon sx={{ color: "#1565C0", mt: 0.25 }}>
                            {TOUR_ICONS[tour.id] || <ExploreIcon fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText
                            primary={tour.label}
                            secondary={tour.description}
                            primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 700, color: "grey.800" }}
                            secondaryTypographyProps={{ fontSize: "0.7rem", color: "grey.500", sx: { whiteSpace: "normal" } }}
                        />
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}
