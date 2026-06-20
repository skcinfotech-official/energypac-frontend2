import { useState, useEffect, useRef } from "react";
import {
    Box, Typography, TextField, InputAdornment, List, ListItem, ListItemButton,
    ListItemText, ListItemIcon, Divider, Chip, Avatar, Card, CardContent,
    Button, Accordion, AccordionSummary, AccordionDetails, Fab, Paper, Collapse
} from "@mui/material";
import {
    MenuBook as MenuBookIcon,
    ChevronRight as ChevronRightIcon,
    ExpandMore as ExpandMoreIcon,
    Widgets as WidgetsIcon,
    BusinessCenter as BusinessCenterIcon,
    Language as LanguageIcon,
    Description as DescriptionIcon,
    Group as GroupIcon,
    Assignment as AssignmentIcon,
    Balance as BalanceIcon,
    Explore as ExploreIcon,
    AccountBalanceWallet as AccountBalanceWalletIcon,
    TrendingUp as TrendingUpIcon,
    EmojiEvents as EmojiEventsIcon,
    Inventory2 as Inventory2Icon,
    Receipt as ReceiptIcon,
    CheckCircle as CheckCircleIcon,
    Payments as PaymentsIcon,
    MonetizationOn as MonetizationOnIcon,
    PieChart as PieChartIcon,
    LocalShipping as LocalShippingIcon,
    Undo as UndoIcon,
    AdminPanelSettings as AdminPanelSettingsIcon,
    Search as SearchIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    History as HistoryIcon,
    Rocket as RocketIcon,
    Shield as ShieldIcon,
    Lightbulb as LightbulbIcon,
    Dashboard as DashboardIcon,
    FormatListBulleted as FormatListBulletedIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Add as AddIcon,
    TableChart as TableChartIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Send as SendIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    Link as LinkIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    ArrowForward as ArrowForwardIcon,
    Inventory as InventoryIcon,
    ImportExport as ImportExportIcon,
    LocalOffer as LocalOfferIcon,
    CurrencyExchange as CurrencyExchangeIcon,
    Analytics as AnalyticsIcon
} from "@mui/icons-material";

const guideData = [
    {
        id: "getting-started",
        title: "Getting Started",
        icon: <RocketIcon />,
        color: "blue",
        sections: [
            {
                id: "overview",
                title: "System Overview",
                content: {
                    path: "Login → Sidebar (left)",
                    description: "Energypac ERP is a comprehensive enterprise resource planning system designed for managing the complete procurement-to-sales lifecycle. The system covers Master Data management, Purchase workflow, Sales operations, Finance tracking, Transport logistics, and Returns processing.",
                    points: [
                        "Role-based access control ensures users only see modules they have permission for",
                        "All sensitive operations (delete, cancel, status changes) require password confirmation for security",
                        "The system supports multi-currency operations with INR as the base currency",
                        "Data can be exported to Excel from most list pages for reporting",
                        "Real-time dashboards provide instant visibility into key metrics"
                    ]
                }
            },
            {
                id: "navigation",
                title: "Navigation & Layout",
                content: {
                    path: "Top navbar + Left sidebar",
                    description: "The application uses a sidebar navigation on the left and a top navbar. The sidebar can be collapsed for more screen space.",
                    steps: [
                        { action: "Sidebar Toggle", detail: "Click the hamburger menu (☰) on the top-left of the navbar to expand or collapse the sidebar" },
                        { action: "Module Dropdown", detail: "Click on any module name (Master, Purchase, Sales, etc.) in the sidebar to expand and see its sub-pages" },
                        { action: "Active Page", detail: "The currently active page is highlighted in blue in the sidebar" },
                        { action: "User Info", detail: "Your name and role are shown at the bottom of the sidebar" },
                        { action: "Logout", detail: "Click the Logout button on the top-right navbar to sign out" }
                    ]
                }
            },
            {
                id: "common-actions",
                title: "Common Actions",
                content: {
                    path: "Any list page (top toolbar + row icons)",
                    description: "These actions are available across most list pages in the system.",
                    steps: [
                        { action: "Search", detail: "Use the search bar at the top of any list to filter records by name, number, or other fields", icon: <SearchIcon /> },
                        { action: "Add New", detail: "Click the '+ Add New' or '+ Create' button to open the creation form", icon: <AddIcon /> },
                        { action: "View Details", detail: "Click the eye icon (👁) on any row to view full details in a modal", icon: <VisibilityIcon /> },
                        { action: "Edit", detail: "Click the pencil icon (✏) to edit an existing record", icon: <EditIcon /> },
                        { action: "Delete", detail: "Click the trash icon (🗑) to delete a record. You will be asked to confirm with your password", icon: <DeleteIcon /> },
                        { action: "Export to Excel", detail: "Click the Excel export button to download the current data as an .xlsx file", icon: <TableChartIcon /> },
                        { action: "Pagination", detail: "Use the Previous/Next buttons at the bottom of the table to navigate between pages" }
                    ]
                }
            }
        ]
    },
    {
        id: "master",
        title: "Master Data",
        icon: <ImportExportIcon />,
        color: "indigo",
        sections: [
            {
                id: "master-items",
                title: "Items / Products",
                icon: <WidgetsIcon />,
                content: {
                    path: "Sidebar → Master → Items",
                    description: "Manage your product catalog. Items are used across Purchase Orders, Proforma Invoices, Bills, and Returns.",
                    steps: [
                        { action: "Add Item", detail: "Click '+ Add New' to create a new item. Fill in the item name, unit (KG, PCS, MTR, etc.), HSN code, and optionally set minimum stock level for low-stock alerts" },
                        { action: "Bulk Upload", detail: "Click the Upload button to import multiple items from an Excel file at once. Download the template first to ensure correct format" },
                        { action: "Edit Item", detail: "Click the edit icon on any item row to update its details" },
                        { action: "View Item", detail: "Click the eye icon to see full item details including stock information, purchase history, and movement log" },
                        { action: "Delete Item", detail: "Click the trash icon and confirm with your password. Items linked to POs or invoices cannot be deleted" },
                        { action: "Stock Reports", detail: "Use the Report button to generate stock reports or movement reports. Select the report type and date range" },
                        { action: "Low Stock Filter", detail: "Toggle 'Low Stock' filter to see items that are below their minimum stock threshold" }
                    ],
                    tips: [
                        "Always set a minimum stock level to get alerts when stock runs low",
                        "Use consistent naming conventions for easy searching",
                        "HSN codes are important for GST compliance in billing"
                    ]
                }
            },
            {
                id: "master-vendors",
                title: "Vendors",
                icon: <BusinessCenterIcon />,
                content: {
                    path: "Sidebar → Master → Vendors",
                    description: "Manage your vendor/supplier database. Vendors are assigned to requisitions and linked to purchase orders.",
                    steps: [
                        { action: "Add Vendor", detail: "Click '+ Add New' to register a new vendor. Fill in company name, contact person, phone, email, address, and bank details" },
                        { action: "Edit Vendor", detail: "Click the edit icon to update vendor information" },
                        { action: "View Vendor", detail: "Click the eye icon to see complete vendor profile including contact info, bank details, and order history" },
                        { action: "Active/Inactive", detail: "Use the status filter dropdown to view only active or inactive vendors" },
                        { action: "Performance Report", detail: "Generate vendor performance reports filtered by date range or specific vendor to evaluate delivery reliability" },
                        { action: "Delete Vendor", detail: "Click trash icon and confirm. Vendors with existing POs cannot be deleted" }
                    ],
                    tips: [
                        "Keep bank details updated for smooth payment processing",
                        "Mark inactive vendors to keep the active list clean without losing data"
                    ]
                }
            },
            {
                id: "master-currency",
                title: "Currency",
                icon: <LanguageIcon />,
                content: {
                    path: "Sidebar → Master → Currency",
                    description: "Manage currencies and conversion rates for multi-currency transactions. INR is the base currency.",
                    steps: [
                        { action: "Add Currency", detail: "Click '+ Add New' to add a new currency. Enter the currency code (USD, EUR, GBP, etc.), name, symbol, and current conversion rate to INR" },
                        { action: "Update Rate", detail: "Edit an existing currency to update its conversion rate. This affects new POs and invoices created with this currency" },
                        { action: "Active/Inactive", detail: "Deactivate currencies you no longer use. They won't appear in currency dropdowns but historical data is preserved" },
                        { action: "View Details", detail: "Click the eye icon to see currency details including when it was last updated" }
                    ],
                    tips: [
                        "Update conversion rates regularly for accurate financial reporting",
                        "The conversion rate is stored per PO/PI at creation time, so changing the rate won't affect existing orders",
                        "All financial dashboards and reports convert to INR for aggregation"
                    ]
                }
            }
        ]
    },
    {
        id: "purchase",
        title: "Purchase",
        icon: <LocalOfferIcon />,
        color: "amber",
        sections: [
            {
                id: "purchase-flow",
                title: "Purchase Workflow Overview",
                content: {
                    path: "Sidebar → Purchase",
                    description: "The purchase process follows a structured workflow from requirement identification to order placement.",
                    flow: [
                        { step: "1. Requisition", detail: "Create a purchase requisition listing required items and quantities" },
                        { step: "2. Vendor Assignment", detail: "Assign vendors to the requisition for quotation collection" },
                        { step: "3. Vendor Quotation", detail: "Record quotations received from assigned vendors" },
                        { step: "4. Comparison", detail: "Compare quotations side-by-side to select the best vendor" },
                        { step: "5. Purchase Order", detail: "Create PO based on selected quotation and send to vendor" }
                    ]
                }
            },
            {
                id: "purchase-requisition",
                title: "Requisition",
                icon: <DescriptionIcon />,
                content: {
                    path: "Sidebar → Purchase → Requisition",
                    description: "A requisition is the starting point of the purchase process. It lists what items need to be purchased and in what quantity.",
                    steps: [
                        { action: "Create Requisition", detail: "Click '+ New Requisition'. Add a requisition date, then add line items by selecting products from the dropdown and entering required quantities" },
                        { action: "Add Multiple Items", detail: "Click '+ Add Item' within the form to add more line items to the same requisition" },
                        { action: "View Requisition", detail: "Click the eye icon to view the complete requisition including all items, quantities, and assignment status" },
                        { action: "Edit Requisition", detail: "Click the edit icon to modify items or quantities. Only unassigned requisitions can be edited" },
                        { action: "Generate PDF", detail: "Click the PDF icon to generate a printable requisition document" },
                        { action: "Filter by Status", detail: "Use the status filter to view Assigned or Unassigned requisitions" },
                        { action: "Excel Report", detail: "Generate date-range based reports, pending item reports, or specific requisition reports in Excel format" }
                    ],
                    tips: [
                        "Each requisition gets a unique auto-generated number (e.g., REQ-001)",
                        "A requisition must be created before vendors can be assigned",
                        "Check the assignment status to know which requisitions need vendor assignment"
                    ]
                }
            },
            {
                id: "purchase-vendor-assignment",
                title: "Vendor Assignment",
                icon: <GroupIcon />,
                content: {
                    path: "Sidebar → Purchase → Vendor Assignment",
                    description: "Assign one or more vendors to a requisition so they can provide quotations.",
                    steps: [
                        { action: "Create Assignment", detail: "Click '+ Assign Vendors'. Select a requisition from the dropdown, then choose which vendors to assign for quotation" },
                        { action: "Multiple Vendors", detail: "You can assign multiple vendors to the same requisition to collect competitive quotes" },
                        { action: "View Assignment", detail: "Click the eye icon to see which vendors are assigned to which requisition" },
                        { action: "Search", detail: "Search assignments by requisition number or vendor name" }
                    ],
                    tips: [
                        "Assign at least 2-3 vendors per requisition for competitive pricing",
                        "Only vendors marked as 'Active' in Master Data will appear in the assignment dropdown"
                    ]
                }
            },
            {
                id: "purchase-quotation",
                title: "Vendor Quotation",
                icon: <AssignmentIcon />,
                content: {
                    path: "Sidebar → Purchase → Vendor Quotation",
                    description: "Record and manage quotations received from vendors against assigned requisitions.",
                    steps: [
                        { action: "Create Quotation", detail: "Click '+ New Quotation'. Select the requisition and vendor, then enter prices, delivery terms, and validity for each item" },
                        { action: "Multi-Currency", detail: "Select the currency and conversion rate when creating a quotation for foreign vendors" },
                        { action: "View Quotation", detail: "Click the eye icon to see full quotation details including per-item pricing" },
                        { action: "Edit Quotation", detail: "Click the edit icon to update prices or terms before comparison" }
                    ],
                    tips: [
                        "Ensure all quotations for the same requisition are entered before comparison",
                        "Include delivery timeline and payment terms for comprehensive comparison"
                    ]
                }
            },
            {
                id: "purchase-comparison",
                title: "Quotation Comparison",
                icon: <BalanceIcon />,
                content: {
                    path: "Sidebar → Purchase → Quotation Comparison",
                    description: "Compare quotations from different vendors side-by-side to make informed purchasing decisions.",
                    steps: [
                        { action: "Select Requisition", detail: "Choose a requisition to see all vendor quotations for it in a comparison table" },
                        { action: "Compare Prices", detail: "The system highlights the best (lowest) price for each item across vendors" },
                        { action: "Select Vendor", detail: "After comparison, select the winning vendor to proceed with Purchase Order creation" },
                        { action: "View Full Details", detail: "Click on any quotation in the comparison to see its complete details" }
                    ],
                    tips: [
                        "Don't just compare price — consider delivery time, payment terms, and vendor reliability",
                        "The comparison shows all items from the requisition against each vendor's quoted prices"
                    ]
                }
            },
            {
                id: "purchase-order",
                title: "Purchase Order",
                icon: <LocalOfferIcon />,
                content: {
                    path: "Sidebar → Purchase → Purchase Order",
                    description: "Purchase Orders (POs) are formal orders sent to vendors. They track items, quantities, prices, payments, and delivery status.",
                    steps: [
                        { action: "View PO List", detail: "The PO list shows all purchase orders with their number, vendor, total value, currency, status, and payment progress" },
                        { action: "View PO Details", detail: "Click the eye icon to see full PO details including items, prices, payment history, and transport records" },
                        { action: "Edit PO", detail: "Click the edit icon to modify PO details. Only unlocked POs can be edited" },
                        { action: "Cancel PO", detail: "Click the cancel button to cancel a PO. This requires password confirmation" },
                        { action: "Lock/Unlock", detail: "Lock a PO to prevent further edits. Unlock it if changes are needed" },
                        { action: "Search & Filter", detail: "Search by PO number, filter by vendor or status (Active, Cancelled, Fully Paid)" },
                        { action: "Excel Report", detail: "Export PO data by date range, pending orders, or vendor-specific reports" }
                    ],
                    tips: [
                        "PO numbers are auto-generated (e.g., PO-001)",
                        "Lock POs after final review to prevent accidental changes",
                        "The payment status shows how much has been paid vs total PO value",
                        "POs support multi-currency — the conversion rate is locked at creation"
                    ]
                }
            }
        ]
    },
    {
        id: "sales",
        title: "Sales",
        icon: <AccountBalanceWalletIcon />,
        color: "emerald",
        sections: [
            {
                id: "sales-flow",
                title: "Sales Workflow Overview",
                content: {
                    path: "Sidebar → Sales",
                    description: "The sales process manages client interactions from enquiry to billing and payment collection.",
                    flow: [
                        { step: "1. Client Query", detail: "Receive and log client enquiries with requirements" },
                        { step: "2. Proforma Invoice", detail: "Create PI with quoted prices for client approval" },
                        { step: "3. Send to Client", detail: "Send the PI and track its status (Draft → Sent → Accepted)" },
                        { step: "4. Create Bill", detail: "Generate tax invoice/bill from accepted PI" },
                        { step: "5. Payment Collection", detail: "Record payments against bills and track outstanding amounts" }
                    ]
                }
            },
            {
                id: "sales-dashboard",
                title: "Sales Dashboard",
                icon: <DashboardIcon />,
                content: {
                    path: "Sidebar → Sales → Dashboard",
                    description: "The first screen of the Sales module — a visual snapshot of how sales are doing right now. Open it whenever you want a quick health check before drilling into details.",
                    steps: [
                        { action: "Read the Stat Cards", detail: "The top row of cards shows Total Sales (value billed), Pending Invoices (bills not fully paid), Monthly Revenue, and Collection Rate (% of billed money actually received). These update automatically from your bills." },
                        { action: "Change the Date Range", detail: "Use the date pickers (or the FY / period dropdown) at the top-right to set a start and end date — every card and chart on the page recalculates for that window." },
                        { action: "Read the Trend Charts", detail: "The line/bar charts plot sales and collections over time so you can spot growth or a slow month. Hover over any point to see the exact figure for that day/month." },
                        { action: "Jump to Details", detail: "Use the sidebar to move from this overview into Proforma Invoice, Create Bill, or Finance → PI Bills when you need to act on a specific record." }
                    ],
                    tips: [
                        "This page is read-only — it shows numbers but you create/edit records on the other Sales pages.",
                        "Collection Rate well below 100% means money is billed but not yet collected — check Finance → PI Bills → Outstanding."
                    ]
                }
            },
            {
                id: "sales-client-query",
                title: "Client Query / Enquiry",
                icon: <BusinessCenterIcon />,
                content: {
                    path: "Sidebar → Sales → Client Query",
                    description: "Log and manage client enquiries. This is the first step in the sales pipeline.",
                    steps: [
                        { action: "Create Enquiry", detail: "Click '+ New Enquiry'. Enter client name, contact details, requirement description, and expected items" },
                        { action: "View Enquiry", detail: "Click the eye icon to see full enquiry details and any linked proforma invoices" },
                        { action: "Track Status", detail: "Monitor enquiry status — whether it has been converted to a Proforma Invoice or is still pending" },
                        { action: "Search", detail: "Search by client name, contact person, or enquiry details" }
                    ],
                    tips: [
                        "Link enquiries to proforma invoices for end-to-end tracking",
                        "Keep client contact details accurate for follow-ups"
                    ]
                }
            },
            {
                id: "sales-proforma",
                title: "Proforma Invoice (PI)",
                icon: <ReceiptIcon />,
                content: {
                    path: "Sidebar → Sales → Proforma Invoice",
                    description: "Proforma Invoices are quotations sent to clients. They go through a lifecycle: Draft → Sent → Accepted/Cancelled.",
                    steps: [
                        { action: "Create PI", detail: "Click '+ New PI'. Select/enter client details, add line items with quantities and prices, select currency, and review the terms" },
                        { action: "Terms & Conditions", detail: "A standard set of terms (Production Time, Mode of Shipment, Terms of Delivery, Terms of Payment, Tolerance, PI Validity, Insurance, Bank Details, etc.) is pre-filled automatically. You can edit any key or value, delete terms, or click 'Add Term' to add your own" },
                        { action: "Bold a Term", detail: "Tick the 'Bold' checkbox on any term row to make that whole line (key and value) bold — it shows bold in the PI PDF and detail view. Use it to highlight critical terms" },
                        { action: "Send PI", detail: "Click the Send button (paper plane icon) to change status from DRAFT to SENT. This indicates the PI has been shared with the client" },
                        { action: "Accept PI", detail: "Click the Accept button (checkmark) when the client confirms the order. Status changes to ACCEPTED" },
                        { action: "Cancel PI", detail: "Click Cancel (X) to cancel a PI. This requires password confirmation" },
                        { action: "Edit PI", detail: "Edit a PI while it's in DRAFT status. Sent/Accepted PIs cannot be edited" },
                        { action: "View Details", detail: "Click the eye icon to see full PI details including items, totals, client info, terms, and linked bills" },
                        { action: "Lock/Unlock", detail: "Lock a PI to prevent modifications. Unlock requires password confirmation" }
                    ],
                    tips: [
                        "PI numbers are auto-generated (e.g., PI-001)",
                        "Default terms are a starting point — edit them per deal before sending",
                        "Use the Bold checkbox to emphasise must-read terms like Payment or Validity",
                        "Only ACCEPTED PIs can be used to create bills",
                        "Multi-currency PIs show amounts in the selected currency with INR conversion",
                        "The PI PDF can be generated and shared with the client"
                    ]
                }
            },
            {
                id: "sales-pi-verification",
                title: "PI Verification & Signatures",
                icon: <CheckCircleIcon />,
                content: {
                    path: "Sidebar → Sales → Proforma Invoice → open a PI",
                    description: "Before sharing a PI, route it for internal sign-off. A PI needs ONE role — the Authorized Signatory — who applies their digital signature, which then appears on the PI PDF.",
                    steps: [
                        { action: "Send for Verification", detail: "Open a PI and click 'Send for Verification'. Pick the Authorized Signatory — yourself ('★ You') or another user — then send" },
                        { action: "Self-sign or Notify", detail: "Pick yourself and the PI is signed and Verified in one step; pick someone else and they get a notification to sign" },
                        { action: "Verifier Reviews", detail: "The assigned signatory opens the request from 'Verify Documents', sees the full PI (party, totals, line items) and Approves (applies signature) or Rejects with a reason" },
                        { action: "Status Lock", detail: "Once a PI is sent or verified, the 'Send for Verification' button becomes a status chip ('Sent for Verification' or 'Verified') — it cannot be re-sent" },
                        { action: "Signature on PDF", detail: "After approval the signature is rendered on the PI PDF in the Authorized Signatory block. Each user uploads their signature once from their Profile" }
                    ],
                    tips: [
                        "Upload a signature in your Profile before signing",
                        "A verifier only sees requests assigned to them — the Pending tab shows only what awaits their action",
                        "The creator, an admin, or any Sales-write user can send a PI for verification",
                        "A rejected PI can be corrected and sent again"
                    ]
                }
            },
            {
                id: "sales-create-bill",
                title: "Create Bill",
                icon: <AccountBalanceWalletIcon />,
                content: {
                    path: "Sidebar → Sales → Create Bill",
                    description: "Generate tax invoices/bills from accepted Proforma Invoices. Bills are used for payment tracking and GST compliance.",
                    steps: [
                        { action: "Select PI", detail: "Search and select an accepted Proforma Invoice from the dropdown. The system will auto-populate client details and items" },
                        { action: "Set Bill Date", detail: "Choose the bill date. This is the tax invoice date for GST purposes" },
                        { action: "Select Bill Type", detail: "Choose DOMESTIC (for CGST+SGST) or INTERSTATE (for IGST)" },
                        { action: "Set GST Rates", detail: "Enter CGST%, SGST%, or IGST% as applicable. The system calculates tax amounts automatically" },
                        { action: "Apply Discount", detail: "Optionally enter a discount amount to be deducted from the subtotal" },
                        { action: "Adjust Items", detail: "You can modify quantities or remove items from the bill if partial billing is needed" },
                        { action: "Submit", detail: "Click 'Create Bill' to generate the invoice. The bill number is auto-generated" }
                    ],
                    tips: [
                        "Use DOMESTIC for same-state billing and INTERSTATE for cross-state",
                        "Bills inherit the currency from the linked PI",
                        "You can create multiple bills against the same PI for split billing",
                        "The system prevents duplicate billing by showing if a bill already exists for the PI"
                    ]
                }
            },
            {
                id: "sales-commercial-invoices",
                title: "Commercial Invoices (Export)",
                icon: <DescriptionIcon />,
                content: {
                    path: "Sidebar → Sales → Commercial Invoices",
                    description: "For INTERNATIONAL (export) Proforma Invoices, generate the Commercial Invoice and its Packing List — used for customs and shipping. No GST applies to exports.",
                    steps: [
                        { action: "View List", detail: "Open Sales → Commercial Invoices to see all export invoices with CI Number, linked PI, invoice number, date, currency, CPT value, status, and packing list status" },
                        { action: "Generate / Edit", detail: "A Commercial Invoice is created from an international PI. Edit shipping and invoice details as needed" },
                        { action: "Download PDF", detail: "Use the Actions menu (⋮) → PDF to download the Commercial Invoice document" },
                        { action: "Download Excel", detail: "Export the invoice data to Excel from the Actions menu" },
                        { action: "Packing List", detail: "Create or open the Packing List linked to the Commercial Invoice. The 'Packing List' column shows whether one has been created" }
                    ],
                    tips: [
                        "Commercial Invoices are only for International trade-type PIs (exports)",
                        "Domestic PIs use Tax Invoices / Bills instead (with GST)",
                        "The packing list is generated against a Commercial Invoice for shipment"
                    ]
                }
            },
            {
                id: "sales-domestic-invoices",
                title: "Domestic Invoices (Tax Invoices)",
                icon: <ReceiptIcon />,
                content: {
                    path: "Sidebar → Sales → Domestic Invoices",
                    description: "GST tax invoices for domestic product sales. These are the formal tax documents issued to Indian clients.",
                    steps: [
                        { action: "View List", detail: "Open Sales → Domestic Invoices to list all product tax invoices with number, date, party, and amounts" },
                        { action: "Create / Edit", detail: "Generate a tax invoice with CGST+SGST (intra-state) or IGST (inter-state). Tax amounts are calculated automatically" },
                        { action: "Download PDF", detail: "Generate the tax invoice PDF for sharing or printing" },
                        { action: "Download Excel", detail: "Export tax invoice data to Excel" },
                        { action: "Search", detail: "Search invoices by number or party name" }
                    ],
                    tips: [
                        "Used for domestic (in-India) sales that require GST compliance",
                        "Choose CGST+SGST for same-state and IGST for cross-state billing"
                    ]
                }
            },
            {
                id: "sales-service-invoices",
                title: "Service Invoices",
                icon: <ReceiptIcon />,
                content: {
                    path: "Sidebar → Sales → Service Invoices",
                    description: "Standalone GST invoices for services (not tied to product items). Useful for service revenue such as installation, commissioning, or consultancy.",
                    steps: [
                        { action: "View List", detail: "Open Sales → Service Invoices to list all service GST invoices" },
                        { action: "Create Service Invoice", detail: "Click '+ New' to create a standalone service invoice. Enter the service description, amount, and applicable GST" },
                        { action: "Edit", detail: "Edit a service invoice's details before it is paid" },
                        { action: "Download PDF / Excel", detail: "Generate the invoice PDF or export to Excel from the row actions" }
                    ],
                    tips: [
                        "Service invoices are independent of product PIs/bills",
                        "Payments against service invoices are tracked under Finance → Service Invoice Payments"
                    ]
                }
            },
            {
                id: "sales-statistics",
                title: "Sales Statistics",
                icon: <TrendingUpIcon />,
                content: {
                    path: "Sidebar → Sales → Statistics",
                    description: "A deeper, number-heavy analysis of your sales than the Dashboard — totals, averages, growth, and breakdowns by client and product. Use it for monthly/quarterly reviews.",
                    steps: [
                        { action: "Set the Period", detail: "Pick a date range at the top. All figures below recompute for that period — compare this month vs last month by switching the range." },
                        { action: "Read the Headline Numbers", detail: "Total Revenue, number of bills, and Average Order Value (revenue ÷ number of bills) tell you both volume and deal size." },
                        { action: "Study the Trend", detail: "The growth/trend chart shows whether revenue is rising or falling versus the previous period." },
                        { action: "Top Clients & Products", detail: "Breakdown sections rank your biggest clients and best-selling products so you know who and what drives revenue." }
                    ],
                    tips: [
                        "Average Order Value rising is good even if the bill count is flat — it means bigger deals.",
                        "Export-heavy months show under International; domestic under Domestic if a trade-type split is shown."
                    ]
                }
            },
            {
                id: "sales-performance",
                title: "Performance Report",
                icon: <EmojiEventsIcon />,
                content: {
                    path: "Sidebar → Sales → Performance Report",
                    description: "Measures how effectively enquiries turn into revenue — conversion rate, deal size, and target achievement. Use it to judge the health of the sales pipeline.",
                    steps: [
                        { action: "Conversion Rate", detail: "Shows what share of enquiries / proforma invoices became actual bills. A low rate means leads are leaking before billing." },
                        { action: "Average Deal Size", detail: "The typical value of a converted deal — useful for forecasting how many deals you need to hit a target." },
                        { action: "Target Achievement", detail: "Compares actual sales against the target for the period, so you can see if you're ahead or behind." },
                        { action: "Compare Periods", detail: "Switch the date range to compare this period against an earlier one and see if performance is improving." }
                    ],
                    tips: [
                        "If conversion is low, review Sales → Proforma Invoice for PIs stuck in DRAFT/SENT that never reached ACCEPTED.",
                        "Read this alongside Statistics — one shows efficiency, the other shows volume."
                    ]
                }
            },
            {
                id: "sales-product-analysis",
                title: "Product Analysis",
                icon: <Inventory2Icon />,
                content: {
                    path: "Sidebar → Sales → Product Analysis",
                    description: "Breaks your sales down item-by-item so you can see which products earn the most and which are barely moving. Use it for stocking and pricing decisions.",
                    steps: [
                        { action: "Top Products", detail: "A ranked list/chart of items by revenue and by quantity sold — your money-makers sit at the top." },
                        { action: "Set the Date Range", detail: "Filter to a period to see what sold well this quarter versus last." },
                        { action: "Trend per Product", detail: "Track how a single item's sales move over time — rising demand vs a fading product." },
                        { action: "Revenue Contribution", detail: "See each product's share of total sales, so you know how dependent revenue is on a few items." }
                    ],
                    tips: [
                        "Slow movers here often overlap with Finance → Dead Stock / Inventory Aging — cross-check before reordering.",
                        "A few products carrying most revenue is a concentration risk — watch their stock and pricing closely."
                    ]
                }
            }
        ]
    },
    {
        id: "finance",
        title: "Finance",
        icon: <CurrencyExchangeIcon />,
        color: "violet",
        sections: [
            {
                id: "finance-dashboard",
                title: "Finance Dashboard",
                icon: <DashboardIcon />,
                content: {
                    path: "Sidebar → Finance → Dashboard",
                    description: "A comprehensive financial overview showing cash flow, payments, outstanding amounts, and profitability metrics. All aggregated values are shown in INR.",
                    steps: [
                        { action: "Key Metrics", detail: "View Total Inflow (collections from clients), Total Outflow (payments to vendors + transport), Net Cash Flow, and Total Purchased Value" },
                        { action: "Date Range Filter", detail: "Select date range to view financial data for specific periods" },
                        { action: "Incoming Section", detail: "Shows total billed amount, collected amount, and outstanding from clients (all in INR)" },
                        { action: "Outgoing Section", detail: "Shows total PO value, paid to vendors, transport costs, and outstanding to vendors (all in INR)" },
                        { action: "Recent Collections", detail: "Table of recent payments received from clients with amounts in their actual currency" },
                        { action: "Recent Vendor Payments", detail: "Table of recent payments made to vendors with amounts in their actual currency" }
                    ],
                    tips: [
                        "All stat cards show values converted to INR for consistent comparison",
                        "Individual payment entries in tables show amounts in their original currency",
                        "Monitor the Net Cash Flow metric to ensure healthy cash position"
                    ]
                }
            },
            {
                id: "finance-po-list",
                title: "Finance PO List",
                icon: <LocalOfferIcon />,
                content: {
                    path: "Sidebar → Finance → PO List",
                    description: "Finance-specific view of Purchase Orders with payment tracking and recording capabilities.",
                    steps: [
                        { action: "View PO Payments", detail: "See each PO with its total value, amount paid, balance, and payment status" },
                        { action: "Record Payment", detail: "Click 'Record Payment' on a PO to log a new payment. Enter amount, date, payment mode, and reference number" },
                        { action: "Payment History", detail: "Click the history icon to view all payment transactions for a specific PO" },
                        { action: "Filter by Status", detail: "Filter POs by payment status — Pending, Partially Paid, or Fully Paid" },
                        { action: "View PO Details", detail: "Click the eye icon to see complete PO details including items and vendor info" }
                    ],
                    tips: [
                        "Record payments promptly to keep outstanding amounts accurate",
                        "Use reference numbers (cheque no., transaction ID) for payment traceability",
                        "Payment modes include Cash, Cheque, Bank Transfer, and Online"
                    ]
                }
            },
            {
                id: "finance-pi-bills",
                title: "PI Bills List",
                icon: <FormatListBulletedIcon />,
                content: {
                    path: "Sidebar → Finance → PI Bills",
                    description: "Manage all sales bills/invoices. Track billing status, record client payments, and generate reports.",
                    steps: [
                        { action: "View All Bills", detail: "See all generated bills with their number, client, PI reference, amount, status, and payment info" },
                        { action: "View Bill Details", detail: "Click the eye icon to see full bill details including items, taxes, and PDF preview" },
                        { action: "Record Payment", detail: "Click the payment button to record a payment received from the client. Enter amount, date, mode, and reference" },
                        { action: "Payment History", detail: "Click the history icon to view all payment transactions for a bill" },
                        { action: "Cancel Bill", detail: "Cancel a bill if needed. This requires password confirmation" },
                        { action: "Search & Filter", detail: "Search by bill number or client name. Filter by PI number" },
                        { action: "Generate Reports", detail: "Export bills report or outstanding report with date range and status filters" }
                    ],
                    tips: [
                        "Bills support partial payments — you can record multiple payments",
                        "The outstanding report helps identify overdue payments",
                        "Bill PDFs can be generated for sharing with clients"
                    ]
                }
            },
            {
                id: "finance-pi-advance",
                title: "PI Advance List",
                icon: <MonetizationOnIcon />,
                content: {
                    path: "Sidebar → Finance → PI Advance",
                    description: "Track advance payments received from clients against Proforma Invoices before bills are generated.",
                    steps: [
                        { action: "View Advances", detail: "See all PI advance payments with their PI reference, client, amount, and date" },
                        { action: "Record Advance", detail: "Record a new advance payment against a Proforma Invoice" },
                        { action: "Track Adjustments", detail: "View how advances have been adjusted against final bills" }
                    ],
                    tips: [
                        "Record advances promptly for accurate financial tracking",
                        "Advances are adjusted when the final bill is created"
                    ]
                }
            },
            {
                id: "finance-service-payments",
                title: "Service Invoice Payments",
                icon: <PaymentsIcon />,
                content: {
                    path: "Sidebar → Finance → Service Invoice Payments",
                    description: "Record and track collections against standalone Service Tax Invoices (GST, INR).",
                    steps: [
                        { action: "Open Page", detail: "Finance → Service Invoice Payments. See summary cards: invoices, billed, received, outstanding." },
                        { action: "Record Payment", detail: "From a row's actions menu, click Record Payment. Enter amount/date/mode/reference — requires password confirmation." },
                        { action: "Collection History", detail: "View all collections recorded against a service invoice." },
                        { action: "Download PDF", detail: "Download the service invoice PDF from the actions menu." }
                    ],
                    tips: [
                        "Service invoices are domestic GST and always in INR.",
                        "Service revenue is shown SEPARATELY from goods margin in Revenue Analysis (no goods COGS)."
                    ]
                }
            },
            {
                id: "finance-transport-payments",
                title: "Transport Payments",
                icon: <LocalShippingIcon />,
                content: {
                    path: "Sidebar → Finance → Transport Payments",
                    description: "Record freight money for both sides: freight we pay transporters on purchases (Buy), and freight we recover from clients on sales delivery (Sell).",
                    steps: [
                        { action: "Open Page", detail: "Finance → Transport Payments. Toggle Buy / Sell / All; see payable, recoverable, paid, and outstanding totals." },
                        { action: "Record Payment / Receipt", detail: "From a row's actions, record a payment (Buy) or receipt (Sell). Password-confirmed. Recording is Finance-only." },
                        { action: "Payment History", detail: "View all payments recorded against a shipment." },
                        { action: "Transport Note PDF", detail: "Download the transport note sheet for any shipment." }
                    ],
                    tips: [
                        "All freight is in INR.",
                        "Transport users see this data read-only inside the Transport module; only Finance can record."
                    ]
                }
            },
            {
                id: "finance-overview",
                title: "Enterprise Overview (Money In / Out)",
                icon: <MonetizationOnIcon />,
                content: {
                    path: "Sidebar → Finance → Revenue Analysis (top section)",
                    description: "A consolidated, all-INR money-movement view at the top of Revenue Analysis — how much came in, how much went out, and what's still outstanding, across every module.",
                    steps: [
                        { action: "Money In", detail: "Goods sales collected (PI bills) + Service collected + Client advances + Freight recovered from clients." },
                        { action: "Money Out", detail: "Payments to vendors (purchases) + Freight paid to transporters. Shows Net Cash." },
                        { action: "Outstanding", detail: "Still to collect from clients, still to pay vendors, and freight payable." },
                        { action: "FY Filter", detail: "Filter the whole overview by financial year." }
                    ],
                    tips: [
                        "Everything is converted to INR using each PO/PI's stored conversion rate.",
                        "This is a cash-movement view; profit/margin is shown in the P&L section below."
                    ]
                }
            },
            {
                id: "finance-revenue",
                title: "Revenue Analysis",
                icon: <ReceiptIcon />,
                content: {
                    path: "Sidebar → Finance → Revenue Analysis",
                    description: "Enterprise profitability — P&L per deal plus charts, freight, and service breakdowns. All values in INR.",
                    steps: [
                        { action: "Profit & Loss Report", detail: "Per-requisition/PI revenue, purchase cost, transport cost, freight recovered, and margin. Freight recovered shows under the Transport column." },
                        { action: "Freight Strip", detail: "Freight Paid (Buy/Sell), Freight Recovered, and Net Freight Cost KPIs." },
                        { action: "Service Revenue Strip", detail: "Service invoices billed/received/outstanding — shown separately so it doesn't distort goods margin." },
                        { action: "Charts & Breakdowns", detail: "Monthly revenue/cost/profit trend, by trade type (Domestic/International), by source, and top performers." },
                        { action: "Export", detail: "Export the P&L table to Excel (includes freight recovered column)." }
                    ],
                    tips: [
                        "P&L includes transport cost; PO/PI amounts are converted to INR via their conversion rate.",
                        "Stock-based sales show cost from the last purchase price.",
                        "Service is reported separately (it has no goods COGS)."
                    ]
                }
            },
            {
                id: "finance-item-analytics",
                title: "Item Analytics",
                icon: <TrendingUpIcon />,
                content: {
                    path: "Sidebar → Finance → Item Analytics",
                    description: "Joins purchase and sales data per item so you can see the true margin on every product — what you paid, what you sold it for, and how prices have moved.",
                    steps: [
                        { action: "Item Performance", detail: "Each item row shows purchase cost, selling price, margin (sell − cost), and volume sold/bought." },
                        { action: "Price History", detail: "Track how an item's purchase price changed across POs over time — spot vendors creeping prices up." },
                        { action: "Top Items by Margin", detail: "Sort/identify items that contribute the most profit, not just the most revenue." },
                        { action: "Date Range", detail: "Filter to a period to analyse margins for a specific season or quarter." }
                    ],
                    tips: [
                        "A high-revenue item with thin margin may be less valuable than a smaller, high-margin one.",
                        "Rising purchase prices here are an early warning to renegotiate with the vendor or raise your selling price."
                    ]
                }
            },
            {
                id: "finance-dead-stock",
                title: "Dead Stock / Inventory Aging",
                icon: <WidgetsIcon />,
                content: {
                    path: "Sidebar → Finance → Inventory Aging",
                    description: "Identify slow-moving and dead stock items that haven't been sold or moved in a long time.",
                    steps: [
                        { action: "View Aging Report", detail: "See items categorized by how long they've been in stock without movement" },
                        { action: "Aging Buckets", detail: "Items are grouped into aging buckets (30 days, 60 days, 90 days, 180+ days)" },
                        { action: "Take Action", detail: "Identify items that need to be promoted, discounted, or written off" }
                    ],
                    tips: [
                        "Regularly review dead stock to optimize inventory holding costs",
                        "Consider offering discounts on aging items before they become obsolete"
                    ]
                }
            }
        ]
    },
    {
        id: "transport",
        title: "Transport",
        icon: <LocalShippingIcon />,
        color: "orange",
        sections: [
            {
                id: "transport-dashboard",
                title: "Transport Dashboard",
                icon: <PieChartIcon />,
                content: {
                    path: "Sidebar → Transport → Dashboard",
                    description: "The landing screen of the Transport module — a logistics health check showing how many shipments are moving, delivered, or pending, and how much freight is costing.",
                    steps: [
                        { action: "Delivery Stat Cards", detail: "See total shipments, In-Transit (dispatched but not delivered), Delivered, and Pending counts at a glance." },
                        { action: "Cost Overview", detail: "Total freight broken down by cost type (Freight, Loading, Unloading, Insurance, etc.) — all in INR." },
                        { action: "Date Range Filter", detail: "Set a period at the top to recompute every card for that window." },
                        { action: "Drill In", detail: "From here go to Transport → Pending Dispatch to see what still needs shipping, or Transport Entry to log a new shipment." }
                    ],
                    tips: [
                        "A growing In-Transit count with few Delivered may mean shipments aren't being marked delivered — update them in Transport Entry.",
                        "Freight here is always INR even when the linked PO/PI is in another currency."
                    ]
                }
            },
            {
                id: "transport-entry",
                title: "Transport Entry (with Consignment Items)",
                icon: <FormatListBulletedIcon />,
                content: {
                    path: "Sidebar → Transport → Transport Entry",
                    description: "Log a shipment against a Purchase Order (inbound) or Proforma Invoice (outbound). You can now ship items partially and track exactly which items went in each trip.",
                    steps: [
                        { action: "Create Entry", detail: "Click 'Log New Shipment'. Choose PO or PI and select the order — the order's items load automatically below as a Consignment Items table." },
                        { action: "Transporter (Master)", detail: "Pick a transporter from the master dropdown (auto-fills name & contact), or type the name manually. Picking a master lets the shipment appear in that transporter's Ledger." },
                        { action: "Consignment Items — Ship Now", detail: "For each item enter the quantity going in THIS trip. The 'Pending' column shows how much is still un-shipped; you cannot ship more than pending." },
                        { action: "Carrier Details", detail: "Enter vehicle number, driver details, LR/Consignment note number, transporter invoice ref, dispatch & expected dates, and from/to route." },
                        { action: "Cost Breakdown (INR)", detail: "Add freight cost items — Freight, Loading, Unloading, Insurance, Customs, Toll, etc. Transport is always recorded in INR even if the PO/PI is in another currency." },
                        { action: "View Details", detail: "Click the eye icon to see the full report — route, transporter, driver, LR/invoice refs, payment status (paid/balance), consignment items, and cost breakdown." },
                        { action: "Mark Delivered", detail: "Click 'Mark Delivered' when the shipment arrives." },
                        { action: "Transport Note PDF", detail: "Click the red PDF icon on a row to download that shipment's Transport Note Sheet." }
                    ],
                    tips: [
                        "Partial shipments: a PO/PI of 10 items can go 4 now and 6 later — just create another entry; the system tracks the remaining quantity.",
                        "Different transporters: each trip can use a different transporter and carry a different subset of items — the dispatch tracker adds them all up.",
                        "Freight is always INR; the linked PO/PI can be in USD or any currency.",
                        "Transport cost feeds the P&L and landed-cost calculations."
                    ]
                }
            },
            {
                id: "transport-dispatch",
                title: "Pending Dispatch Board & Tracker",
                icon: <InventoryIcon />,
                content: {
                    path: "Sidebar → Transport → Pending Dispatch",
                    description: "See which orders still have items to ship, and track shipment progress line-by-line across all transporters.",
                    steps: [
                        { action: "Open Board", detail: "Transport → Pending Dispatch. Toggle Inbound (PO) / Outbound (PI)." },
                        { action: "Read Progress", detail: "Each order shows ordered qty, shipped qty, pending lines, and a % progress bar." },
                        { action: "Item Tracker", detail: "Click the eye icon to open the dispatch tracker — per item: ordered, shipped, pending, and status (Done/Pending). State is NOT_DISPATCHED / PARTIAL / FULLY_DISPATCHED." },
                        { action: "Ship Remaining", detail: "Create a new Transport Entry for the same order to ship the remaining quantity." }
                    ],
                    tips: [
                        "Shipped totals are summed across every (non-cancelled) transport entry for that order — even if shipped by different transporters."
                    ]
                }
            },
            {
                id: "transporters-ledger",
                title: "Transporters & Ledger",
                icon: <FormatListBulletedIcon />,
                content: {
                    path: "Sidebar → Transport → Transporters",
                    description: "A master list of transporters/carriers, each with its own running ledger of money billed, paid, and outstanding.",
                    steps: [
                        { action: "Add Transporter", detail: "Transport → Transporters → Add. Enter name, contact, phone, GST/PAN, address." },
                        { action: "Open Ledger", detail: "Click the ledger (receipt) icon on a transporter row." },
                        { action: "Read Ledger", detail: "Buy Payable Balance = freight you owe on purchases. Sell Recoverable Balance = freight on sales delivery vs what the client reimbursed. Below: every shipment with billed/paid/balance." },
                        { action: "Export PDF", detail: "Inside the ledger window, click the red 'PDF' button (top-right) to download the transporter's full ledger as a printable PDF — company header, summary cards, and the shipment table." },
                        { action: "Export Excel", detail: "Click the green 'Excel' button to download the same ledger as a styled .xlsx — same colours, title band, summary cards, and bordered table as the PDF, but editable in Excel." }
                    ],
                    tips: [
                        "A shipment only appears in a transporter's ledger if you selected that transporter from the master dropdown on the entry.",
                        "The Excel and PDF exports are laid out identically — use PDF to share/print, Excel when you need to filter or add your own columns."
                    ]
                }
            },
            {
                id: "transport-payments-view",
                title: "Transport Payments (View)",
                icon: <PaymentsIcon />,
                content: {
                    path: "Sidebar → Transport → Transport Payments",
                    description: "A read-only view inside the Transport module showing what freight money is tied to each shipment — the same data Finance records against.",
                    steps: [
                        { action: "Open", detail: "Transport → Transport Payments. Toggle Buy / Sell / All." },
                        { action: "Summary Cards", detail: "See total freight payable (buy), recoverable (sell), paid, and outstanding." },
                        { action: "Per-shipment", detail: "Each row shows freight, paid, balance, and payment status. Download the Transport Note PDF or view payment history from the actions menu." }
                    ],
                    tips: [
                        "Transport users get a 'View only' page — recording a payment is a Finance-department action.",
                        "The actual money is recorded by Finance (see Finance → Transport Payments)."
                    ]
                }
            }
        ]
    },
    {
        id: "returns",
        title: "Returns",
        icon: <UndoIcon />,
        color: "rose",
        sections: [
            {
                id: "returns-overview",
                title: "Returns Module Overview",
                content: {
                    path: "Sidebar → Returns",
                    description: "Manage both Sales Returns (from clients) and Purchase Returns (to vendors). Returns follow a lifecycle: Draft → Approved → Completed, or can be Cancelled.",
                    flow: [
                        { step: "1. Create Return", detail: "Log the return with items, quantities, and reason" },
                        { step: "2. Review", detail: "Check return details and item conditions (usable/unusable)" },
                        { step: "3. Approve", detail: "Approve the return — stock is automatically adjusted" },
                        { step: "4. Notes Generated", detail: "Credit Note (sales return) or Debit Note (purchase return) is auto-generated" }
                    ]
                }
            },
            {
                id: "returns-sales",
                title: "Sales Returns",
                icon: <InventoryIcon />,
                content: {
                    path: "Sidebar → Returns → Sales tab",
                    description: "Process items returned by clients. Usable items are added back to stock, unusable items are written off.",
                    steps: [
                        { action: "Create Sales Return", detail: "Click '+ New Return' in the Sales Returns tab. Select the PI/Bill reference, add return items with quantities, condition (usable/unusable), and reason" },
                        { action: "Approve Return", detail: "Click the Approve button to process the return. Usable items are restored to stock inventory. A Credit Note is generated" },
                        { action: "Cancel Return", detail: "Cancel a return if needed. If already approved, stock changes will be reversed" },
                        { action: "View Details", detail: "Click the eye icon to see all return details including items, conditions, and notes" },
                        { action: "Tab Switching", detail: "Use the Sales/Purchase tab toggle at the top to switch between return types" }
                    ],
                    tips: [
                        "Only usable items are added back to stock — unusable items are written off",
                        "Credit Notes can be used for adjusting future invoices",
                        "Document the reason for return clearly for audit purposes"
                    ]
                }
            },
            {
                id: "returns-purchase",
                title: "Purchase Returns",
                icon: <LocalShippingIcon />,
                content: {
                    path: "Sidebar → Returns → Purchase tab",
                    description: "Process items being returned to vendors. Stock is deducted and a Debit Note is generated.",
                    steps: [
                        { action: "Create Purchase Return", detail: "Click '+ New Return' in the Purchase Returns tab. Select the PO reference, add items being returned with quantities and reason" },
                        { action: "Approve Return", detail: "Click Approve to process. Stock is deducted (items going back to vendor) and a Debit Note is generated" },
                        { action: "Cancel Return", detail: "Cancel if needed — stock deductions are reversed for approved returns" },
                        { action: "View Details", detail: "Click the eye icon for complete return information" }
                    ],
                    tips: [
                        "Debit Notes are used for vendor payment adjustments",
                        "Keep vendor communication records alongside return documentation",
                        "Ensure items are physically returned before approving"
                    ]
                }
            }
        ]
    },
    {
        id: "admin",
        title: "Admin Panel",
        icon: <AdminPanelSettingsIcon />,
        color: "slate",
        sections: [
            {
                id: "admin-users",
                title: "User Management",
                icon: <AdminPanelSettingsIcon />,
                content: {
                    path: "Sidebar → Admin → Users",
                    description: "Admin-only section for managing system users, their roles, and module permissions.",
                    steps: [
                        { action: "Add User", detail: "Click '+ Add User'. Enter full name, email, username, password, and role (ADMIN or USER)" },
                        { action: "Set Permissions", detail: "For non-admin users, set module-level access permissions. Toggle read access for each module: Master, Purchase, Sales, Finance, Transport, Returns" },
                        { action: "Edit User", detail: "Update user details, reset password, or modify permissions" },
                        { action: "Deactivate User", detail: "Deactivate a user account to revoke access without deleting their data" },
                        { action: "View User", detail: "See user details including their login history and assigned permissions" }
                    ],
                    tips: [
                        "ADMIN users automatically have access to all modules",
                        "Regular users only see sidebar options for their permitted modules",
                        "Password changes require admin confirmation",
                        "Deactivated users cannot log in but their activity history is preserved"
                    ]
                }
            },
            {
                id: "admin-audit",
                title: "Audit Logs",
                icon: <HistoryIcon />,
                content: {
                    path: "Sidebar → Admin → Audit Logs",
                    description: "Track all system activities for compliance and troubleshooting. Every create, update, and delete action is logged.",
                    steps: [
                        { action: "View Logs", detail: "Browse the chronological log of all system activities" },
                        { action: "Filter by Action", detail: "Filter logs by action type — Create, Update, Delete" },
                        { action: "Filter by User", detail: "See all actions performed by a specific user" },
                        { action: "View Details", detail: "Click on any log entry to see exactly what was changed (before and after values)" },
                        { action: "Search", detail: "Search logs by description, user name, or object reference" }
                    ],
                    tips: [
                        "Audit logs cannot be deleted or modified — they are permanent records",
                        "Review audit logs periodically for security compliance",
                        "Before/after values help in troubleshooting data discrepancies"
                    ]
                }
            }
        ]
    },
    {
        id: "security",
        title: "Security & Best Practices",
        icon: <ShieldIcon />,
        color: "red",
        sections: [
            {
                id: "security-passwords",
                title: "Password Confirmation",
                content: {
                    description: "The system requires password confirmation for sensitive operations to prevent accidental or unauthorized changes.",
                    points: [
                        "Delete operations always require password confirmation",
                        "Cancelling POs, PIs, Bills, and Returns requires password confirmation",
                        "Locking/Unlocking records requires password confirmation",
                        "Status changes (Approve, Send) require confirmation dialogs",
                        "Never share your password with others",
                        "Use a strong password with a mix of letters, numbers, and symbols"
                    ]
                }
            },
            {
                id: "security-tips",
                title: "Best Practices",
                content: {
                    description: "Follow these best practices for efficient and secure use of the ERP system.",
                    points: [
                        "Log out when leaving your workstation unattended",
                        "Regularly update currency conversion rates for accurate reporting",
                        "Lock Purchase Orders and Proforma Invoices after final review",
                        "Use the audit log to verify any suspicious activity",
                        "Export important reports to Excel for backup and offline access",
                        "Set minimum stock levels for all items to receive low-stock alerts",
                        "Record payments immediately after they are made or received",
                        "Use meaningful remarks/notes when recording payments for traceability",
                        "Review the Finance Dashboard daily for cash flow monitoring",
                        "Keep vendor and client information up-to-date"
                    ]
                }
            }
        ]
    },
    {
        id: "signatures",
        title: "Signatures & Verification",
        icon: <CheckIcon />,
        color: "emerald",
        sections: [
            {
                id: "signature-setup",
                title: "Upload Your Signature",
                content: {
                    path: "Sidebar → (your name) → My Profile",
                    description: "Set up your digital signature which will be embedded in PDF documents when you approve Purchase Orders and Proforma Invoices.",
                    steps: [
                        { action: "Go to Profile", detail: "Click on your name in the sidebar → 'My Profile (Signature)'" },
                        { action: "Upload Signature", detail: "Click the 'Upload Signature' button and select your signature image file (PNG, JPG, etc.)" },
                        { action: "Activate Signature", detail: "Once uploaded, your signature becomes active and will be used for all future verifications" },
                        { action: "Replace Signature", detail: "Upload a new signature anytime to replace your existing one" },
                        { action: "View Signature", detail: "Your current signature preview is shown in your profile"  }
                    ],
                    tips: [
                        "Use a clear, readable signature image for PDF documents",
                        "Signature should be on a transparent or white background for best results",
                        "Keep your signature private and secure — treat it like your digital stamp"
                    ]
                }
            },
            {
                id: "pi-verification",
                title: "Proforma Invoice (PI) Verification",
                content: {
                    path: "Sidebar → Sales → Proforma Invoice → open a PI",
                    description: "Route a Proforma Invoice for sign-off. A PI needs ONE role — the Authorized Signatory. You can assign yourself or another user; if you assign yourself, your saved signature is applied automatically.",
                    steps: [
                        { action: "Open the PI", detail: "Go to Sales → Proforma Invoice, open a PI, and click the green 'Send for Verification' button" },
                        { action: "Choose Authorized Signatory", detail: "In the dialog, pick the Authorized Signatory from the dropdown. You appear at the top as '★ (You)' — pick yourself to sign instantly, or pick a colleague" },
                        { action: "Self-sign (one step)", detail: "If you pick yourself, your signature is applied immediately and the PI becomes Verified — no extra approval step" },
                        { action: "Assign someone else", detail: "If you pick another user, they get a notification and the PI shows as 'Sent for Verification' until they approve" },
                        { action: "Signatory Approves/Rejects", detail: "The assigned person opens it from 'Verify Documents', reviews the full PI, then Approves (applies signature) or Rejects with a reason" },
                        { action: "Status Lock", detail: "Once sent or verified, the 'Send for Verification' button becomes a status chip and cannot be re-sent" },
                        { action: "Signature on PDF", detail: "After verification the signature appears on the PI PDF in the Authorized Signatory block, with the signer's name" }
                    ],
                    tips: [
                        "Upload your signature in Profile first — you can't sign without one",
                        "The PI creator, an admin, or any Sales-write user can send a PI for verification",
                        "A rejected PI can be corrected and sent again"
                    ]
                }
            },
            {
                id: "po-verification",
                title: "Purchase Order (PO) Verification",
                content: {
                    path: "Sidebar → Purchase → Purchase Order → open a PO",
                    description: "Route a Purchase Order for sign-off. A PO uses TWO roles — 'Checked By' and 'Authorized Signatory'. Each can be yourself or another user; your own slots are signed automatically.",
                    steps: [
                        { action: "Open the PO", detail: "Go to Purchase → Purchase Order, open a PO, and click 'Send for Verification'" },
                        { action: "Assign Both Roles", detail: "Pick a 'Checked By' and an 'Authorized Signatory'. You appear as '★ (You)' in both dropdowns — assign yourself to either or both" },
                        { action: "Auto-sign your part", detail: "Any role you assign to yourself is signed instantly with your saved signature; the other person is notified to sign theirs" },
                        { action: "Verifiers Approve/Reject", detail: "Assigned users open the request in 'Verify Documents', review the full PO, and Approve or Reject" },
                        { action: "Status Lock", detail: "Once sent or verified, the button becomes a status chip — the PO can't be re-sent for verification" },
                        { action: "Download Signed PO", detail: "After both roles sign, the PO PDF shows both signatures (Checked By + Authorized Signatory) with names" }
                    ],
                    tips: [
                        "Both assigned people must have a signature uploaded in their Profile",
                        "The PO creator, an admin, or any Purchase-write user can send a PO for verification",
                        "Assign yourself to both roles to fully verify a PO in one step"
                    ]
                }
            },
            {
                id: "verify-dashboard",
                title: "Verify Documents Dashboard",
                content: {
                    path: "Sidebar → Verify Documents",
                    description: "Central hub where all verification requests are sent to you. Access via sidebar → 'Verify Documents'.",
                    steps: [
                        { action: "View Pending", detail: "See all pending verification requests waiting for your approval" },
                        { action: "Select Document Type", detail: "Switch between PI (Proforma Invoice) and PO (Purchase Order) tabs" },
                        { action: "Filter by Status", detail: "View Pending, Verified, or Rejected documents" },
                        { action: "Select Document", detail: "Click on a document row to see its full details" },
                        { action: "Approve", detail: "Click the green 'Approve' button to sign and verify the document" },
                        { action: "Add Notes (Optional)", detail: "Add approval notes if needed, then click 'Approve'" },
                        { action: "Reject", detail: "Click 'Reject' and provide a reason why you cannot approve" },
                        { action: "View Signature", detail: "Your signature will automatically embed in the PDF once you approve" }
                    ],
                    tips: [
                        "A red badge with count shows pending verifications on the sidebar icon",
                        "The badge auto-updates every 30 seconds",
                        "You cannot approve a document twice — once verified, it's locked"
                    ]
                }
            },
            {
                id: "notifications",
                title: "Verification Notifications",
                content: {
                    path: "Top navbar → 🔔 bell icon",
                    description: "Get real-time notifications when verification requests are sent to you.",
                    steps: [
                        { action: "Notification Bell", detail: "Top-right corner shows a notification bell with a red count badge" },
                        { action: "Badge Count", detail: "The red badge shows total pending verifications (PI + PO combined)" },
                        { action: "Notification Polling", detail: "The system checks for new notifications every 30 seconds" },
                        { action: "Auto-Refresh", detail: "Dashboard refreshes automatically when you receive new requests" },
                        { action: "View Details", detail: "Click 'Verify Documents' to see full details of all pending requests" }
                    ]
                }
            }
        ]
    }
];

const colorMap = {
    blue: { bg: "#E3F2FD", text: "#1565C0", border: "#BBDEFB", accent: "#1565C0", light: "#E3F2FD", gradientFrom: "#1E88E5", gradientTo: "#1565C0" },
    indigo: { bg: "#E8EAF6", text: "#283593", border: "#C5CAE9", accent: "#283593", light: "#E8EAF6", gradientFrom: "#3F51B5", gradientTo: "#283593" },
    amber: { bg: "#FFF8E1", text: "#F57F17", border: "#FFECB3", accent: "#F57F17", light: "#FFF8E1", gradientFrom: "#FFB300", gradientTo: "#F57F17" },
    emerald: { bg: "#E8F5E9", text: "#2E7D32", border: "#C8E6C9", accent: "#2E7D32", light: "#E8F5E9", gradientFrom: "#43A047", gradientTo: "#2E7D32" },
    violet: { bg: "#EDE7F6", text: "#4527A0", border: "#D1C4E9", accent: "#4527A0", light: "#EDE7F6", gradientFrom: "#7E57C2", gradientTo: "#4527A0" },
    orange: { bg: "#FFF3E0", text: "#E65100", border: "#FFE0B2", accent: "#E65100", light: "#FFF3E0", gradientFrom: "#FB8C00", gradientTo: "#E65100" },
    rose: { bg: "#FCE4EC", text: "#C62828", border: "#F8BBD0", accent: "#C62828", light: "#FCE4EC", gradientFrom: "#E53935", gradientTo: "#C62828" },
    slate: { bg: "#ECEFF1", text: "#37474F", border: "#CFD8DC", accent: "#37474F", light: "#CFD8DC", gradientFrom: "#546E7A", gradientTo: "#37474F" },
    red: { bg: "#FFEBEE", text: "#C62828", border: "#FFCDD2", accent: "#C62828", light: "#FFEBEE", gradientFrom: "#E53935", gradientTo: "#C62828" },
};

export default function UserGuide() {
    const [activeModule, setActiveModule] = useState("getting-started");
    const [activeSection, setActiveSection] = useState("overview");
    const [expandedModules, setExpandedModules] = useState(["getting-started"]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const contentRef = useRef(null);

    const currentModule = guideData.find(m => m.id === activeModule);
    const currentSection = currentModule?.sections?.find(s => s.id === activeSection);
    const colors = colorMap[currentModule?.color || "blue"];

    useEffect(() => {
        const handleScroll = () => {
            if (contentRef.current) {
                setShowScrollTop(contentRef.current.scrollTop > 300);
            }
        };
        const el = contentRef.current;
        el?.addEventListener("scroll", handleScroll);
        return () => el?.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const q = searchQuery.toLowerCase();
        const results = [];
        guideData.forEach(mod => {
            mod.sections.forEach(sec => {
                const c = sec.content;
                const searchable = [
                    sec.title,
                    c.description,
                    c.path,
                    ...(c.steps || []).map(s => `${s.action} ${s.detail}`),
                    ...(c.points || []),
                    ...(c.tips || []),
                    ...(c.flow || []).map(f => `${f.step} ${f.detail}`)
                ].join(" ").toLowerCase();

                if (searchable.includes(q)) {
                    results.push({ moduleId: mod.id, sectionId: sec.id, moduleTitle: mod.title, sectionTitle: sec.title, color: mod.color });
                }
            });
        });
        setSearchResults(results);
    }, [searchQuery]);

    const toggleModule = (id) => {
        setExpandedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    const navigateTo = (moduleId, sectionId) => {
        setActiveModule(moduleId);
        setActiveSection(sectionId);
        if (!expandedModules.includes(moduleId)) {
            setExpandedModules(prev => [...prev, moduleId]);
        }
        setSearchQuery("");
        setSearchResults([]);
        contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    const scrollToTop = () => {
        contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    const getPrevNext = () => {
        const allSections = [];
        guideData.forEach(mod => {
            mod.sections.forEach(sec => {
                allSections.push({ moduleId: mod.id, sectionId: sec.id, title: sec.title, moduleTitle: mod.title });
            });
        });
        const idx = allSections.findIndex(s => s.moduleId === activeModule && s.sectionId === activeSection);
        return {
            prev: idx > 0 ? allSections[idx - 1] : null,
            next: idx < allSections.length - 1 ? allSections[idx + 1] : null
        };
    };

    const { prev, next } = getPrevNext();

    return (
        <Box sx={{ display: "flex", height: "calc(100vh - 4rem)", bgcolor: "#FAFBFC" }}>
            {/* LEFT SIDEBAR NAV */}
            <Box sx={{ width: 288, bgcolor: "#fff", borderRight: "1px solid", borderColor: "grey.200", display: "flex", flexDirection: "column", flexShrink: 0 }}>
                {/* Guide Header */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "grey.200", background: "linear-gradient(to right, #1565C0, #0D47A1)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", borderRadius: 3, width: 36, height: 36 }}>
                            <MenuBookIcon sx={{ color: "#fff", fontSize: 20 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#fff", fontSize: "0.875rem" }}>User Guide</Typography>
                            <Typography variant="caption" sx={{ color: "#BBDEFB", fontWeight: 500, fontSize: "0.625rem" }}>Energypac ERP</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Search */}
                <Box sx={{ px: 1.5, py: 1.5, borderBottom: "1px solid", borderColor: "grey.100" }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Search guide..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 16, color: "grey.400" }} />
                                </InputAdornment>
                            ),
                            sx: { fontSize: "0.75rem", bgcolor: "#FAFBFC", borderRadius: 2, "& .MuiOutlinedInput-notchedOutline": { borderColor: "grey.200" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "grey.300" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#1565C0" } }
                        }}
                    />
                    {searchResults.length > 0 && (
                        <Paper elevation={3} sx={{ mt: 1, maxHeight: 240, overflowY: "auto", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                            <List disablePadding>
                                {searchResults.map((r, i) => (
                                    <ListItem key={i} disablePadding divider={i < searchResults.length - 1}>
                                        <ListItemButton onClick={() => navigateTo(r.moduleId, r.sectionId)} sx={{ py: 1, px: 1.5 }}>
                                            <ListItemText
                                                primary={r.sectionTitle}
                                                secondary={r.moduleTitle}
                                                primaryTypographyProps={{ fontSize: "0.75rem", fontWeight: 600, color: "grey.800" }}
                                                secondaryTypographyProps={{ fontSize: "0.625rem", color: "grey.500" }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    )}
                </Box>

                {/* Module List */}
                <Box component="nav" sx={{ flex: 1, overflowY: "auto", py: 1, "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}>
                    {guideData.map(mod => {
                        const mc = colorMap[mod.color];
                        const isExpanded = expandedModules.includes(mod.id);
                        const isActive = activeModule === mod.id;

                        return (
                            <Box key={mod.id} sx={{ px: 1, mb: 0.25 }}>
                                <ListItemButton
                                    onClick={() => {
                                        toggleModule(mod.id);
                                        if (mod.sections.length > 0) {
                                            navigateTo(mod.id, mod.sections[0].id);
                                        }
                                    }}
                                    sx={{
                                        borderRadius: 2,
                                        py: 1,
                                        px: 1.5,
                                        gap: 1.25,
                                        bgcolor: isActive ? mc.bg : "transparent",
                                        "&:hover": { bgcolor: isActive ? mc.bg : "grey.50" }
                                    }}
                                >
                                    <Box sx={{ fontSize: 18, color: isActive ? mc.text : "grey.400", display: "flex", alignItems: "center" }}>
                                        {mod.icon}
                                    </Box>
                                    <Typography sx={{ fontSize: "0.75rem", flex: 1, fontWeight: isActive ? 700 : 400, color: isActive ? mc.text : "grey.600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {mod.title}
                                    </Typography>
                                    <ExpandMoreIcon sx={{ fontSize: 12, color: isActive ? mc.text : "grey.400", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                                </ListItemButton>
                                <Collapse in={isExpanded}>
                                    <Box sx={{ ml: 2, pl: 1.5, borderLeft: "2px solid", borderColor: "grey.100", mt: 0.5 }}>
                                        {mod.sections.map(sec => (
                                            <ListItemButton
                                                key={sec.id}
                                                onClick={() => navigateTo(mod.id, sec.id)}
                                                sx={{
                                                    borderRadius: 1.5,
                                                    py: 0.75,
                                                    px: 1.5,
                                                    mb: 0.25,
                                                    bgcolor: activeSection === sec.id ? mc.bg : "transparent",
                                                    "&:hover": { bgcolor: activeSection === sec.id ? mc.bg : "grey.50" }
                                                }}
                                            >
                                                {sec.icon && (
                                                    <Box sx={{ fontSize: 12, opacity: 0.7, mr: 1, display: "flex", alignItems: "center", color: activeSection === sec.id ? mc.text : "grey.500" }}>
                                                        {sec.icon}
                                                    </Box>
                                                )}
                                                <Typography sx={{ fontSize: "0.6875rem", fontWeight: activeSection === sec.id ? 700 : 400, color: activeSection === sec.id ? mc.text : "grey.500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", "&:hover": { color: activeSection === sec.id ? mc.text : "grey.700" } }}>
                                                    {sec.title}
                                                </Typography>
                                            </ListItemButton>
                                        ))}
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {/* MAIN CONTENT */}
            <Box ref={contentRef} sx={{ flex: 1, overflowY: "auto" }}>
                <Box sx={{ maxWidth: 900, mx: "auto", px: 4, py: 4 }}>
                    {/* Breadcrumb */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, color: "grey.500" }}>User Guide</Typography>
                        <ChevronRightIcon sx={{ fontSize: 10, color: "grey.400" }} />
                        <Typography variant="caption" sx={{ fontWeight: 500, color: colors.text }}>{currentModule?.title}</Typography>
                        <ChevronRightIcon sx={{ fontSize: 10, color: "grey.400" }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "grey.700" }}>{currentSection?.title}</Typography>
                    </Box>

                    {/* Section Header */}
                    <Card variant="outlined" sx={{ bgcolor: colors.bg, borderRadius: 4, mb: 4, borderColor: colors.border }}>
                        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                                <Avatar sx={{ background: `linear-gradient(135deg, ${colors.gradientFrom}, ${colors.gradientTo})`, borderRadius: 3, width: 44, height: 44, boxShadow: 3 }}>
                                    {currentSection?.icon || currentModule?.icon}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: "grey.900", mb: 0.5, fontSize: "1.25rem" }}>{currentSection?.title}</Typography>
                                    <Typography variant="body2" sx={{ color: "grey.600", lineHeight: 1.6, fontSize: "0.875rem" }}>{currentSection?.content?.description}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Where to find it (navigation path) */}
                    {currentSection?.content?.path && (
                        <Card variant="outlined" sx={{ borderRadius: 3, borderColor: colors.border, bgcolor: "#fff", mb: 4 }}>
                            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                    <ExploreIcon sx={{ fontSize: 16, color: colors.text }} />
                                    <Typography sx={{ fontSize: "0.6875rem", fontWeight: 700, color: "grey.500", textTransform: "uppercase", letterSpacing: "0.04em", mr: 0.5 }}>
                                        Where to find it
                                    </Typography>
                                    {currentSection.content.path.split("→").map((part, i, arr) => (
                                        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Chip
                                                label={part.trim()}
                                                size="small"
                                                sx={{ bgcolor: colors.bg, color: colors.text, fontWeight: 600, fontSize: "0.6875rem", height: 24 }}
                                            />
                                            {i < arr.length - 1 && <ChevronRightIcon sx={{ fontSize: 12, color: "grey.400" }} />}
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    )}

                    {/* Workflow / Flow Diagram */}
                    {currentSection?.content?.flow && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "grey.800", mb: 2, display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem" }}>
                                <ArrowForwardIcon sx={{ fontSize: 14, color: colors.text }} />
                                Workflow Steps
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                {currentSection.content.flow.map((f, i) => (
                                    <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                                        <Avatar sx={{ width: 32, height: 32, background: `linear-gradient(135deg, ${colors.gradientFrom}, ${colors.gradientTo})`, fontSize: "0.75rem", fontWeight: 700, boxShadow: 2, flexShrink: 0 }}>
                                            {i + 1}
                                        </Avatar>
                                        <Card variant="outlined" sx={{ flex: 1, borderRadius: 3, borderColor: "grey.200", "&:hover": { boxShadow: 2 }, transition: "box-shadow 0.2s" }}>
                                            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: "grey.800", mb: 0.5, fontSize: "0.875rem" }}>{f.step.replace(/^\d+\.\s*/, "")}</Typography>
                                                <Typography variant="caption" sx={{ color: "grey.500", lineHeight: 1.6, fontSize: "0.75rem" }}>{f.detail}</Typography>
                                            </CardContent>
                                        </Card>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Steps / Actions */}
                    {currentSection?.content?.steps && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "grey.800", mb: 2, display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem" }}>
                                <FormatListBulletedIcon sx={{ fontSize: 14, color: colors.text }} />
                                How to Use
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                {currentSection.content.steps.map((s, i) => (
                                    <Card key={i} variant="outlined" sx={{ borderRadius: 3, borderColor: "grey.200", "&:hover": { boxShadow: 2 }, transition: "box-shadow 0.2s" }}>
                                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                                <Avatar variant="rounded" sx={{ width: 32, height: 32, bgcolor: colors.light, color: colors.text, flexShrink: 0, mt: 0.25 }}>
                                                    {s.icon || <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>{i + 1}</Typography>}
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "grey.800", mb: 0.5, fontSize: "0.875rem" }}>{s.action}</Typography>
                                                    <Typography variant="caption" sx={{ color: "grey.500", lineHeight: 1.6, fontSize: "0.75rem" }}>{s.detail}</Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Points / Bullets */}
                    {currentSection?.content?.points && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "grey.800", mb: 2, display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem" }}>
                                <InfoIcon sx={{ fontSize: 14, color: colors.text }} />
                                Key Points
                            </Typography>
                            <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "grey.200" }}>
                                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                                    <List disablePadding>
                                        {currentSection.content.points.map((pt, i) => (
                                            <ListItem key={i} disablePadding sx={{ mb: i < currentSection.content.points.length - 1 ? 1.5 : 0, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: colors.accent, flexShrink: 0, mt: 0.75 }} />
                                                <Typography variant="caption" sx={{ color: "grey.600", lineHeight: 1.6, fontSize: "0.75rem" }}>{pt}</Typography>
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        </Box>
                    )}

                    {/* Tips */}
                    {currentSection?.content?.tips && currentSection.content.tips.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                            <Card variant="outlined" sx={{ bgcolor: colors.bg, borderRadius: 3, borderColor: colors.border }}>
                                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "grey.800", mb: 1.5, display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem" }}>
                                        <LightbulbIcon sx={{ fontSize: 14, color: "#F57F17" }} />
                                        Pro Tips
                                    </Typography>
                                    <List disablePadding>
                                        {currentSection.content.tips.map((tip, i) => (
                                            <ListItem key={i} disablePadding sx={{ mb: i < currentSection.content.tips.length - 1 ? 1 : 0, display: "flex", alignItems: "flex-start", gap: 1.25 }}>
                                                <ChevronRightIcon sx={{ fontSize: 10, color: colors.text, flexShrink: 0, mt: 0.75 }} />
                                                <Typography variant="caption" sx={{ color: "grey.600", lineHeight: 1.6, fontSize: "0.75rem" }}>{tip}</Typography>
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        </Box>
                    )}

                    {/* Prev / Next Navigation */}
                    <Divider sx={{ mt: 4, mb: 3 }} />
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {prev ? (
                            <Button
                                onClick={() => navigateTo(prev.moduleId, prev.sectionId)}
                                variant="outlined"
                                startIcon={<ChevronRightIcon sx={{ fontSize: 12, transform: "rotate(180deg)" }} />}
                                sx={{
                                    borderRadius: 3,
                                    borderColor: "grey.200",
                                    color: "grey.700",
                                    textTransform: "none",
                                    px: 2,
                                    py: 1.25,
                                    "&:hover": { bgcolor: "grey.50", borderColor: "grey.300" },
                                    boxShadow: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start"
                                }}
                            >
                                <Typography variant="caption" sx={{ color: "grey.400", fontWeight: 500, fontSize: "0.625rem", lineHeight: 1 }}>Previous</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.700", fontSize: "0.75rem" }}>{prev.title}</Typography>
                            </Button>
                        ) : <Box />}

                        {next ? (
                            <Button
                                onClick={() => navigateTo(next.moduleId, next.sectionId)}
                                variant="outlined"
                                endIcon={<ChevronRightIcon sx={{ fontSize: 12 }} />}
                                sx={{
                                    borderRadius: 3,
                                    borderColor: "grey.200",
                                    color: "grey.700",
                                    textTransform: "none",
                                    px: 2,
                                    py: 1.25,
                                    "&:hover": { bgcolor: "grey.50", borderColor: "grey.300" },
                                    boxShadow: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-end"
                                }}
                            >
                                <Typography variant="caption" sx={{ color: "grey.400", fontWeight: 500, fontSize: "0.625rem", lineHeight: 1 }}>Next</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "grey.700", fontSize: "0.75rem" }}>{next.title}</Typography>
                            </Button>
                        ) : <Box />}
                    </Box>
                </Box>

                {/* Scroll to top */}
                {showScrollTop && (
                    <Fab
                        size="small"
                        onClick={scrollToTop}
                        sx={{
                            position: "fixed",
                            bottom: 24,
                            right: 24,
                            bgcolor: "#1565C0",
                            color: "#fff",
                            "&:hover": { bgcolor: "#0D47A1", transform: "scale(1.1)" },
                            transition: "all 0.2s",
                            zIndex: 50,
                            boxShadow: 3
                        }}
                    >
                        <KeyboardArrowUpIcon />
                    </Fab>
                )}
            </Box>
        </Box>
    );
}
