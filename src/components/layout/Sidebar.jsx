import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
    Collapse, Typography, Avatar, Divider, Tooltip, Badge
} from "@mui/material";
import {
    Dashboard as DashboardIcon,
    Description as DescriptionIcon,
    AttachMoney as AttachMoneyIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Inventory2 as InventoryIcon,
    Person as PersonIcon,
    TrendingUp as TrendingUpIcon,
    EmojiEvents as EmojiEventsIcon,
    Category as CategoryIcon,
    ListAlt as ListAltIcon,
    AdminPanelSettings as AdminIcon,
    Language as LanguageIcon,
    History as HistoryIcon,
    LocalShipping as ShippingIcon,
    Groups2 as Groups2Icon,
    PieChart as PieChartIcon,
    Savings as SavingsIcon,
    Receipt as ReceiptIcon,
    Undo as UndoIcon,
    ShoppingCart as ShoppingCartIcon,
    Storefront as StorefrontIcon,
    AccountBalance as AccountBalanceIcon,
    BarChart as BarChartIcon,
    MenuBook as MenuBookIcon,
    SupportAgent as SupportAgentIcon,
    Assessment as AssessmentIcon,
    Warehouse as WarehouseIcon,
    RequestQuote as RequestQuoteIcon,
    CompareArrows as CompareArrowsIcon,
    AccountCircle as AccountCircleIcon,
    CheckCircle as VerifyIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { usePendingVerifications } from "../../hooks/usePendingVerifications";

const DRAWER_WIDTH = 260;
const MINI_WIDTH = 68;

export default function Sidebar({ isOpen }) {
    const { user } = useAuth();
    const { pendingCount } = usePendingVerifications();

    const hasPermission = (moduleName) => {
        if (user?.role === "ADMIN") return true;
        if (!user || !user.permissions) return false;
        const perm = user.permissions.find(p => p.module === moduleName);
        return perm ? perm.can_read : false;
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: isOpen ? DRAWER_WIDTH : MINI_WIDTH,
                flexShrink: 0,
                transition: 'width 0.25s ease',
                '& .MuiDrawer-paper': {
                    width: isOpen ? DRAWER_WIDTH : MINI_WIDTH,
                    transition: 'width 0.25s ease',
                    overflowX: 'hidden',
                    bgcolor: '#fff',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                },
            }}
        >
            {/* BRAND */}
            <Box sx={{
                height: 64, display: 'flex', alignItems: 'center',
                px: isOpen ? 2.5 : 0, justifyContent: isOpen ? 'flex-start' : 'center',
                borderBottom: '1px solid', borderColor: 'divider',
            }}>
                {!isOpen ? (
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 700 }}>
                        E
                    </Avatar>
                ) : (
                    <img src="/main_logo.png" alt="Energypac" style={{ height: 36, objectFit: 'contain' }} />
                )}
            </Box>

            {/* NAV */}
            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1.5, '&::-webkit-scrollbar': { width: 0 } }}>
                {isOpen && (
                    <Typography variant="caption" sx={{
                        px: 2.5, mb: 1, display: 'block', fontWeight: 700,
                        fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                        color: 'text.secondary',
                    }}>
                        Management Console
                    </Typography>
                )}

                <SidebarLink to="/audit-logs" label="Audit Logs" icon={<HistoryIcon />} isOpen={isOpen} tourId="tour-audit" />
                <SidebarLink to="/sales/client-query" label="Client Query" icon={<SupportAgentIcon />} isOpen={isOpen} tourId="tour-client-query" />

                {hasPermission("MASTER") && (
                    <SidebarDropdown label="Master" icon={<InventoryIcon />} isOpen={isOpen} tourId="tour-master" items={[
                        { to: "/master/item", label: "Item", icon: <CategoryIcon /> },
                        { to: "/master/vendor", label: "Vendor", icon: <PersonIcon /> },
                        { to: "/master/currency", label: "Currency", icon: <LanguageIcon /> },
                    ]} />
                )}

                {hasPermission("PURCHASE") && (
                    <SidebarDropdown label="Purchase" icon={<ShoppingCartIcon />} isOpen={isOpen} tourId="tour-purchase" items={[
                        { to: "/", label: "Purchase Dashboard", icon: <DashboardIcon /> },
                        { to: "/requisition", label: "Requisition", icon: <DescriptionIcon /> },
                        { to: "/vendor-assignment", label: "Vendor Assignment", icon: <PersonIcon /> },
                        { to: "/vendor-quotation", label: "Vendor Quotation", icon: <RequestQuoteIcon /> },
                        { to: "/vendor-quotation-comparison", label: "Quotation Comparison", icon: <CompareArrowsIcon /> },
                        { to: "/purchase-order", label: "Purchase Order", icon: <StorefrontIcon /> },
                        { to: "/purchase/pending-purchase", label: "Pending Purchase", icon: <RequestQuoteIcon /> },
                    ]} />
                )}

                {hasPermission("SALES") && (
                    <SidebarDropdown label="Sales" icon={<AttachMoneyIcon />} isOpen={isOpen} tourId="tour-sales" items={[
                        { to: "/sales/dashboard", label: "Sales Dashboard", icon: <DashboardIcon /> },
                        { to: "/sales/sales-statistics", label: "Sales Statistics", icon: <BarChartIcon /> },
                        { to: "/sales/sales-performance", label: "Performance Report", icon: <EmojiEventsIcon /> },
                        { to: "/sales/sales-products", label: "Product Analysis", icon: <CategoryIcon /> },
                        { to: "/sales/proforma-invoice", label: "Proforma Invoice", icon: <ReceiptIcon /> },
                        { to: "/sales/commercial-invoices", label: "Commercial Invoices", icon: <DescriptionIcon /> },
                        { to: "/sales/tax-invoices", label: "Domestic Invoices", icon: <ReceiptIcon /> },
                        { to: "/sales/service-invoices", label: "Service Invoices", icon: <ReceiptIcon /> },
                        { to: "/sales/create-bill", label: "Create Bill", icon: <AttachMoneyIcon /> },
                    ]} />
                )}

                {hasPermission("FINANCE") && (
                    <SidebarDropdown label="Finance" icon={<AccountBalanceIcon />} isOpen={isOpen} tourId="tour-finance" items={[
                        { to: "/finance/dashboard", label: "Finance Dashboard", icon: <DashboardIcon /> },
                        { to: "/finance/purchase-orders", label: "PO List", icon: <StorefrontIcon /> },
                        { to: "/finance/pi-bills", label: "PI Bills List", icon: <ListAltIcon /> },
                        { to: "/finance/service-invoice-payments", label: "Service Invoice Payments", icon: <ReceiptIcon /> },
                        { to: "/finance/transport-payments", label: "Transport Payments", icon: <ShippingIcon /> },
                        { to: "/finance/pi-advanced", label: "PI Advance List", icon: <SavingsIcon /> },
                        { to: "/finance/revenue-analysis", label: "Revenue Analysis", icon: <AssessmentIcon /> },
                        { to: "/finance/item-analytics", label: "Item Analytics", icon: <TrendingUpIcon /> },
                        { to: "/finance/inventory-aging", label: "Dead Stock", icon: <WarehouseIcon /> },
                    ]} />
                )}

                {hasPermission("TRANSPORT") && (
                    <SidebarDropdown label="Transport" icon={<ShippingIcon />} isOpen={isOpen} tourId="tour-transport" items={[
                        { to: "/transport/dashboard", label: "Transport Dashboard", icon: <PieChartIcon /> },
                        { to: "/transport", label: "Transport Entry", icon: <ListAltIcon /> },
                        { to: "/transport/dispatch", label: "Pending Dispatch", icon: <InventoryIcon /> },
                        { to: "/transport/transporters", label: "Transporters", icon: <Groups2Icon /> },
                        { to: "/transport/payments", label: "Transport Payments", icon: <AttachMoneyIcon /> },
                    ]} />
                )}

                {hasPermission("RETURNS") && (
                    <SidebarLink to="/returns" label="Returns" icon={<UndoIcon />} isOpen={isOpen} tourId="tour-returns" />
                )}

                {user?.role === "ADMIN" && (
                    <SidebarLink to="/admin/users" label="Admin Panel" icon={<AdminIcon />} isOpen={isOpen} tourId="tour-admin" />
                )}

                <Divider sx={{ my: 1.5, mx: 1 }} />
                <SidebarLink to="/profile" label="Signature" icon={<AccountCircleIcon />} isOpen={isOpen} tourId="tour-profile" />
                <SidebarLink
                    to="/verifications"
                    label="Verify Documents"
                    icon={<VerifyIcon />}
                    isOpen={isOpen}
                    badgeCount={pendingCount}
                    badgeColor="error"
                    tourId="tour-verify"
                />
                <SidebarLink to="/user-guide" label="User Guide" icon={<MenuBookIcon />} isOpen={isOpen} tourId="tour-userguide" />
            </Box>

            {/* FOOTER */}
            <Box sx={{
                p: 1.5, borderTop: '1px solid', borderColor: 'divider',
                bgcolor: '#FAFBFC', display: 'flex', alignItems: 'center',
                gap: 1.5, justifyContent: isOpen ? 'flex-start' : 'center',
                px: isOpen ? 2 : 0,
            }}>
                <Avatar sx={{
                    width: 32, height: 32, bgcolor: 'primary.main',
                    fontSize: '0.75rem', fontWeight: 700,
                }}>
                    {user?.full_name?.[0]?.toUpperCase() || "U"}
                </Avatar>
                {isOpen && (
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.full_name || "User"}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                            {user?.role || "Employee"}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Drawer>
    );
}

function SidebarLink({ to, label, icon, isOpen, badgeCount = 0, badgeColor = 'primary', tourId }) {
    const location = useLocation();
    const isActive = location.pathname === to;

    const button = (
        <ListItemButton
            component={NavLink}
            to={to}
            end
            selected={isActive}
            data-tour={tourId}
            sx={{
                minHeight: 40,
                px: isOpen ? 1.5 : 1,
                justifyContent: isOpen ? 'flex-start' : 'center',
                mx: 1, borderRadius: 2, mb: 0.3,
            }}
        >
            <ListItemIcon sx={{
                minWidth: isOpen ? 36 : 'auto',
                color: isActive ? 'primary.main' : 'text.secondary',
                justifyContent: 'center',
                '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
            }}>
                {badgeCount > 0 ? (
                    <Badge badgeContent={badgeCount} color={badgeColor}>
                        {icon}
                    </Badge>
                ) : (
                    icon
                )}
            </ListItemIcon>
            {isOpen && (
                <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 700 : 500,
                    }}
                />
            )}
        </ListItemButton>
    );

    return isOpen ? button : <Tooltip title={`${label}${badgeCount > 0 ? ` (${badgeCount})` : ''}`} placement="right" arrow>{button}</Tooltip>;
}

function SidebarDropdown({ label, icon, isOpen, items, tourId }) {
    const location = useLocation();
    const isAnyChildActive = items.some(item => location.pathname === item.to);
    const [expanded, setExpanded] = useState(isAnyChildActive);

    const headerBtn = (
        <ListItemButton
            onClick={() => isOpen && setExpanded(prev => !prev)}
            data-tour={tourId}
            sx={{
                minHeight: 40, px: isOpen ? 1.5 : 1,
                justifyContent: isOpen ? 'flex-start' : 'center',
                mx: 1, borderRadius: 2, mb: 0.3,
                bgcolor: isAnyChildActive ? 'action.hover' : 'transparent',
            }}
        >
            <ListItemIcon sx={{
                minWidth: isOpen ? 36 : 'auto',
                color: isAnyChildActive ? 'primary.main' : 'text.secondary',
                justifyContent: 'center',
                '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
            }}>
                {icon}
            </ListItemIcon>
            {isOpen && (
                <>
                    <ListItemText
                        primary={label}
                        primaryTypographyProps={{
                            fontSize: '0.8rem',
                            fontWeight: isAnyChildActive ? 700 : 500,
                        }}
                    />
                    {expanded ? <ExpandLessIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} /> : <ExpandMoreIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />}
                </>
            )}
        </ListItemButton>
    );

    return (
        <>
            {isOpen ? headerBtn : <Tooltip title={label} placement="right" arrow>{headerBtn}</Tooltip>}
            {isOpen && (
                <Collapse in={expanded} timeout="auto">
                    <List disablePadding sx={{ pl: 2 }}>
                        {items.map(item => {
                            const isActive = location.pathname === item.to;
                            return (
                                <ListItemButton
                                    key={item.to}
                                    component={NavLink}
                                    to={item.to}
                                    end
                                    selected={isActive}
                                    sx={{
                                        minHeight: 34, pl: 2, borderRadius: 2,
                                        mx: 1, mb: 0.2,
                                        borderLeft: '2px solid',
                                        borderColor: isActive ? 'primary.main' : 'divider',
                                    }}
                                >
                                    <ListItemIcon sx={{
                                        minWidth: 30,
                                        color: isActive ? 'primary.main' : 'text.secondary',
                                        '& .MuiSvgIcon-root': { fontSize: '1rem' },
                                    }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontSize: '0.75rem',
                                            fontWeight: isActive ? 700 : 400,
                                        }}
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>
                </Collapse>
            )}
        </>
    );
}
