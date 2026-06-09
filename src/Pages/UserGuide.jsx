import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
    FaBook, FaChevronRight, FaChevronDown, FaCube, FaUserTie, FaGlobe,
    FaFileAlt, FaUsers, FaClipboardList, FaBalanceScale, FaBinoculars,
    FaMoneyCheckAlt, FaChartLine, FaTrophy, FaBoxOpen, FaFileInvoiceDollar,
    FaMoneyBillWave, FaCoins, FaChartPie, FaTruck, FaUndoAlt, FaUserShield,
    FaSearch, FaArrowUp, FaHistory, FaRocket, FaShieldAlt, FaLightbulb,
    FaThLarge, FaList, FaEdit, FaTrash, FaEye, FaPlus, FaFileExcel,
    FaCheck, FaTimes, FaPaperPlane, FaLock, FaUnlock, FaLink,
    FaExclamationTriangle, FaInfoCircle, FaArrowRight, FaBoxes
} from "react-icons/fa";
import { BiImport, BiSolidPurchaseTag } from "react-icons/bi";
import { FaMoneyBillTrendUp } from "react-icons/fa6";

const guideData = [
    {
        id: "getting-started",
        title: "Getting Started",
        icon: <FaRocket />,
        color: "blue",
        sections: [
            {
                id: "overview",
                title: "System Overview",
                content: {
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
                    description: "These actions are available across most list pages in the system.",
                    steps: [
                        { action: "Search", detail: "Use the search bar at the top of any list to filter records by name, number, or other fields", icon: <FaSearch /> },
                        { action: "Add New", detail: "Click the '+ Add New' or '+ Create' button to open the creation form", icon: <FaPlus /> },
                        { action: "View Details", detail: "Click the eye icon (👁) on any row to view full details in a modal", icon: <FaEye /> },
                        { action: "Edit", detail: "Click the pencil icon (✏) to edit an existing record", icon: <FaEdit /> },
                        { action: "Delete", detail: "Click the trash icon (🗑) to delete a record. You will be asked to confirm with your password", icon: <FaTrash /> },
                        { action: "Export to Excel", detail: "Click the Excel export button to download the current data as an .xlsx file", icon: <FaFileExcel /> },
                        { action: "Pagination", detail: "Use the Previous/Next buttons at the bottom of the table to navigate between pages" }
                    ]
                }
            }
        ]
    },
    {
        id: "master",
        title: "Master Data",
        icon: <BiImport />,
        color: "indigo",
        sections: [
            {
                id: "master-items",
                title: "Items / Products",
                icon: <FaCube />,
                content: {
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
                icon: <FaUserTie />,
                content: {
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
                icon: <FaGlobe />,
                content: {
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
        icon: <BiSolidPurchaseTag />,
        color: "amber",
        sections: [
            {
                id: "purchase-flow",
                title: "Purchase Workflow Overview",
                content: {
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
                icon: <FaFileAlt />,
                content: {
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
                icon: <FaUsers />,
                content: {
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
                icon: <FaClipboardList />,
                content: {
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
                icon: <FaBalanceScale />,
                content: {
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
                icon: <BiSolidPurchaseTag />,
                content: {
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
        icon: <FaMoneyCheckAlt />,
        color: "emerald",
        sections: [
            {
                id: "sales-flow",
                title: "Sales Workflow Overview",
                content: {
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
                icon: <FaThLarge />,
                content: {
                    description: "A visual overview of your sales performance with key metrics and charts.",
                    steps: [
                        { action: "Key Metrics", detail: "View total sales, pending invoices, monthly revenue, and collection rate at a glance" },
                        { action: "Date Range Filter", detail: "Change the date range to analyze sales performance for specific periods" },
                        { action: "Charts", detail: "Interactive charts show trends in sales, collections, and outstanding amounts" }
                    ]
                }
            },
            {
                id: "sales-client-query",
                title: "Client Query / Enquiry",
                icon: <FaUserTie />,
                content: {
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
                icon: <FaFileInvoiceDollar />,
                content: {
                    description: "Proforma Invoices are quotations sent to clients. They go through a lifecycle: Draft → Sent → Accepted/Cancelled.",
                    steps: [
                        { action: "Create PI", detail: "Click '+ New PI'. Select/enter client details, add line items with quantities and prices, select currency, and add terms" },
                        { action: "Send PI", detail: "Click the Send button (paper plane icon) to change status from DRAFT to SENT. This indicates the PI has been shared with the client" },
                        { action: "Accept PI", detail: "Click the Accept button (checkmark) when the client confirms the order. Status changes to ACCEPTED" },
                        { action: "Cancel PI", detail: "Click Cancel (X) to cancel a PI. This requires password confirmation" },
                        { action: "Edit PI", detail: "Edit a PI while it's in DRAFT status. Sent/Accepted PIs cannot be edited" },
                        { action: "View Details", detail: "Click the eye icon to see full PI details including items, totals, client info, and linked bills" },
                        { action: "Lock/Unlock", detail: "Lock a PI to prevent modifications. Unlock requires password confirmation" }
                    ],
                    tips: [
                        "PI numbers are auto-generated (e.g., PI-001)",
                        "Only ACCEPTED PIs can be used to create bills",
                        "Multi-currency PIs show amounts in the selected currency with INR conversion",
                        "The PI PDF can be generated and shared with the client"
                    ]
                }
            },
            {
                id: "sales-create-bill",
                title: "Create Bill",
                icon: <FaMoneyCheckAlt />,
                content: {
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
                id: "sales-statistics",
                title: "Sales Statistics",
                icon: <FaChartLine />,
                content: {
                    description: "Detailed statistical analysis of your sales data with charts and breakdowns.",
                    steps: [
                        { action: "View Statistics", detail: "See overall sales metrics including total revenue, number of bills, average order value, and growth trends" },
                        { action: "Date Filters", detail: "Filter by custom date ranges to analyze specific periods" },
                        { action: "Charts & Graphs", detail: "Visual charts show revenue trends, top clients, and product-wise sales distribution" }
                    ]
                }
            },
            {
                id: "sales-performance",
                title: "Performance Report",
                icon: <FaTrophy />,
                content: {
                    description: "Analyze sales team and individual performance with detailed metrics.",
                    steps: [
                        { action: "Performance Metrics", detail: "View metrics like conversion rate, average deal size, and sales target achievement" },
                        { action: "Period Comparison", detail: "Compare performance across different time periods" }
                    ]
                }
            },
            {
                id: "sales-product-analysis",
                title: "Product Analysis",
                icon: <FaBoxOpen />,
                content: {
                    description: "Analyze sales performance by product/item to identify top-selling and slow-moving items.",
                    steps: [
                        { action: "Top Products", detail: "See which items generate the most revenue and highest volumes" },
                        { action: "Trend Analysis", detail: "Track product sales trends over time" },
                        { action: "Revenue Breakdown", detail: "View per-product revenue contribution to total sales" }
                    ]
                }
            }
        ]
    },
    {
        id: "finance",
        title: "Finance",
        icon: <FaMoneyBillTrendUp />,
        color: "violet",
        sections: [
            {
                id: "finance-dashboard",
                title: "Finance Dashboard",
                icon: <FaThLarge />,
                content: {
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
                icon: <BiSolidPurchaseTag />,
                content: {
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
                icon: <FaList />,
                content: {
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
                icon: <FaCoins />,
                content: {
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
                id: "finance-revenue",
                title: "Revenue Analysis",
                icon: <FaFileInvoiceDollar />,
                content: {
                    description: "Analyze revenue trends and profitability with detailed P&L (Profit & Loss) breakdown.",
                    steps: [
                        { action: "Profit & Loss Report", detail: "View comprehensive P&L report showing revenue, costs, transport costs, and margins for each PI" },
                        { action: "Profit Preview", detail: "See expected profit on active PIs before final billing" },
                        { action: "Date Range Analysis", detail: "Filter by date range to analyze revenue for specific periods" },
                        { action: "Per-Item Analysis", detail: "Drill down to see profit margins at the item level" }
                    ],
                    tips: [
                        "P&L includes transport costs for accurate margin calculation",
                        "All values are converted to INR for consistent comparison",
                        "Stock-based sales show cost calculated from last purchase price"
                    ]
                }
            },
            {
                id: "finance-item-analytics",
                title: "Item Analytics",
                icon: <FaChartLine />,
                content: {
                    description: "Deep analytics on item-level performance across purchases and sales.",
                    steps: [
                        { action: "Item Performance", detail: "View each item's purchase cost, selling price, margin, and volume trends" },
                        { action: "Price History", detail: "Track how purchase prices have changed over time for each item" },
                        { action: "Top Items", detail: "Identify top items by revenue, margin, and volume" }
                    ]
                }
            },
            {
                id: "finance-dead-stock",
                title: "Dead Stock / Inventory Aging",
                icon: <FaCube />,
                content: {
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
        icon: <FaTruck />,
        color: "orange",
        sections: [
            {
                id: "transport-dashboard",
                title: "Transport Dashboard",
                icon: <FaChartPie />,
                content: {
                    description: "Visual overview of transport operations including delivery status, costs, and logistics metrics.",
                    steps: [
                        { action: "Delivery Stats", detail: "View total shipments, in-transit, delivered, and pending deliveries" },
                        { action: "Cost Overview", detail: "See total transport costs broken down by type (freight, loading, insurance, etc.)" },
                        { action: "Date Range Filter", detail: "Filter dashboard data by specific date ranges" }
                    ]
                }
            },
            {
                id: "transport-entry",
                title: "Transport Entry",
                icon: <FaList />,
                content: {
                    description: "Create and manage transport entries linked to Purchase Orders or Proforma Invoices.",
                    steps: [
                        { action: "Create Entry", detail: "Click '+ New Transport'. Choose reference type (PO or PI), search and select the order, then fill in transport details" },
                        { action: "Transport Details", detail: "Enter transporter name, contact, vehicle number, driver details, dispatch date, and expected delivery date" },
                        { action: "Dispatch & Delivery", detail: "Enter dispatch location and delivery destination" },
                        { action: "Cost Breakdown", detail: "Add transport costs with type selection — Freight, Loading, Unloading, Insurance, Customs, Toll, etc. Multiple cost items can be added" },
                        { action: "Mark Delivered", detail: "Click the 'Delivered' button when shipment arrives to update status" },
                        { action: "View Details", detail: "Click the eye icon to view complete transport entry with all cost details" },
                        { action: "Edit Entry", detail: "Edit transport details before marking as delivered" },
                        { action: "Landed Cost", detail: "View landed cost (item cost + transport cost) for POs and PIs" }
                    ],
                    tips: [
                        "Transport costs are included in P&L and profit margin calculations",
                        "Available cost types: Freight, Loading, Unloading, Insurance, Customs, Octroi, Handling, Packaging, Toll, and Other",
                        "Link transport to the correct PO/PI for accurate cost allocation",
                        "The system prevents duplicate transport entries for the same order"
                    ]
                }
            }
        ]
    },
    {
        id: "returns",
        title: "Returns",
        icon: <FaUndoAlt />,
        color: "rose",
        sections: [
            {
                id: "returns-overview",
                title: "Returns Module Overview",
                content: {
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
                icon: <FaBoxes />,
                content: {
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
                icon: <FaTruck />,
                content: {
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
        icon: <FaUserShield />,
        color: "slate",
        sections: [
            {
                id: "admin-users",
                title: "User Management",
                icon: <FaUserShield />,
                content: {
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
                icon: <FaHistory />,
                content: {
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
        icon: <FaShieldAlt />,
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
    }
];

const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", accent: "bg-blue-600", light: "bg-blue-100", gradient: "from-blue-500 to-blue-600" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200", accent: "bg-indigo-600", light: "bg-indigo-100", gradient: "from-indigo-500 to-indigo-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", accent: "bg-amber-600", light: "bg-amber-100", gradient: "from-amber-500 to-amber-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", accent: "bg-emerald-600", light: "bg-emerald-100", gradient: "from-emerald-500 to-emerald-600" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200", accent: "bg-violet-600", light: "bg-violet-100", gradient: "from-violet-500 to-violet-600" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", accent: "bg-orange-600", light: "bg-orange-100", gradient: "from-orange-500 to-orange-600" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", accent: "bg-rose-600", light: "bg-rose-100", gradient: "from-rose-500 to-rose-600" },
    slate: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300", accent: "bg-slate-700", light: "bg-slate-200", gradient: "from-slate-600 to-slate-700" },
    red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", accent: "bg-red-600", light: "bg-red-100", gradient: "from-red-500 to-red-600" },
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
        <div className="flex h-[calc(100vh-4rem)] bg-slate-50">
            {/* LEFT SIDEBAR NAV */}
            <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
                {/* Guide Header */}
                <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <FaBook className="text-white text-lg" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white">User Guide</h2>
                            <p className="text-[10px] text-blue-100 font-medium">Energypac ERP</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="px-3 py-3 border-b border-slate-100">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input
                            type="text"
                            placeholder="Search guide..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                        />
                    </div>
                    {searchResults.length > 0 && (
                        <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                            {searchResults.map((r, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigateTo(r.moduleId, r.sectionId)}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                                >
                                    <p className="text-xs font-semibold text-slate-800">{r.sectionTitle}</p>
                                    <p className="text-[10px] text-slate-500">{r.moduleTitle}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Module List */}
                <nav className="flex-1 overflow-y-auto no-scrollbar py-2">
                    {guideData.map(mod => {
                        const mc = colorMap[mod.color];
                        const isExpanded = expandedModules.includes(mod.id);
                        const isActive = activeModule === mod.id;

                        return (
                            <div key={mod.id} className="px-2 mb-0.5">
                                <button
                                    onClick={() => {
                                        toggleModule(mod.id);
                                        if (mod.sections.length > 0) {
                                            navigateTo(mod.id, mod.sections[0].id);
                                        }
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                                        isActive
                                            ? `${mc.bg} ${mc.text} font-bold`
                                            : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    <span className={`text-base ${isActive ? mc.text : "text-slate-400"}`}>{mod.icon}</span>
                                    <span className="text-xs flex-1 truncate">{mod.title}</span>
                                    <FaChevronDown className={`text-[9px] transition-transform ${isExpanded ? "rotate-180" : ""} ${isActive ? mc.text : "text-slate-400"}`} />
                                </button>
                                {isExpanded && (
                                    <div className="ml-4 pl-3 border-l-2 border-slate-100 mt-1 space-y-0.5">
                                        {mod.sections.map(sec => (
                                            <button
                                                key={sec.id}
                                                onClick={() => navigateTo(mod.id, sec.id)}
                                                className={`w-full text-left px-3 py-1.5 rounded-md text-[11px] transition-all ${
                                                    activeSection === sec.id
                                                        ? `${mc.bg} ${mc.text} font-bold`
                                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                                }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {sec.icon && <span className="text-[10px] opacity-70">{sec.icon}</span>}
                                                    <span className="truncate">{sec.title}</span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* MAIN CONTENT */}
            <div ref={contentRef} className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-8 py-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
                        <span className="font-medium">User Guide</span>
                        <FaChevronRight className="text-[8px]" />
                        <span className={`font-medium ${colors.text}`}>{currentModule?.title}</span>
                        <FaChevronRight className="text-[8px]" />
                        <span className="font-semibold text-slate-700">{currentSection?.title}</span>
                    </div>

                    {/* Section Header */}
                    <div className={`${colors.bg} rounded-2xl p-6 mb-8 border ${colors.border}`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-3 bg-gradient-to-br ${colors.gradient} rounded-xl text-white shadow-lg`}>
                                {currentSection?.icon || currentModule?.icon}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-xl font-bold text-slate-900 mb-1">{currentSection?.title}</h1>
                                <p className="text-sm text-slate-600 leading-relaxed">{currentSection?.content?.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Workflow / Flow Diagram */}
                    {currentSection?.content?.flow && (
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FaArrowRight className={`text-xs ${colors.text}`} />
                                Workflow Steps
                            </h3>
                            <div className="space-y-3">
                                {currentSection.content.flow.map((f, i) => (
                                    <div key={i} className="flex items-start gap-4 group">
                                        <div className={`shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${colors.gradient} text-white flex items-center justify-center text-xs font-bold shadow-md`}>
                                            {i + 1}
                                        </div>
                                        <div className={`flex-1 bg-white rounded-xl border border-slate-200 p-4 shadow-sm group-hover:shadow-md transition-shadow`}>
                                            <p className="text-sm font-bold text-slate-800 mb-1">{f.step.replace(/^\d+\.\s*/, "")}</p>
                                            <p className="text-xs text-slate-500 leading-relaxed">{f.detail}</p>
                                        </div>
                                        {i < currentSection.content.flow.length - 1 && (
                                            <div className="absolute left-[15px] mt-8 h-3 border-l-2 border-dashed border-slate-200" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Steps / Actions */}
                    {currentSection?.content?.steps && (
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FaList className={`text-xs ${colors.text}`} />
                                How to Use
                            </h3>
                            <div className="space-y-3">
                                {currentSection.content.steps.map((s, i) => (
                                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <div className={`shrink-0 mt-0.5 p-2 rounded-lg ${colors.light} ${colors.text}`}>
                                                {s.icon || <span className="text-xs font-bold">{i + 1}</span>}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800 mb-1">{s.action}</p>
                                                <p className="text-xs text-slate-500 leading-relaxed">{s.detail}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Points / Bullets */}
                    {currentSection?.content?.points && (
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FaInfoCircle className={`text-xs ${colors.text}`} />
                                Key Points
                            </h3>
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <ul className="space-y-3">
                                    {currentSection.content.points.map((pt, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className={`shrink-0 mt-1 w-1.5 h-1.5 rounded-full ${colors.accent}`} />
                                            <p className="text-xs text-slate-600 leading-relaxed">{pt}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    {currentSection?.content?.tips && currentSection.content.tips.length > 0 && (
                        <div className="mb-8">
                            <div className={`${colors.bg} rounded-xl border ${colors.border} p-5`}>
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <FaLightbulb className="text-amber-500 text-xs" />
                                    Pro Tips
                                </h3>
                                <ul className="space-y-2">
                                    {currentSection.content.tips.map((tip, i) => (
                                        <li key={i} className="flex items-start gap-2.5">
                                            <FaChevronRight className={`text-[8px] mt-1.5 ${colors.text} shrink-0`} />
                                            <p className="text-xs text-slate-600 leading-relaxed">{tip}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Prev / Next Navigation */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-8">
                        {prev ? (
                            <button
                                onClick={() => navigateTo(prev.moduleId, prev.sectionId)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-left group shadow-sm"
                            >
                                <FaChevronRight className="text-[10px] text-slate-400 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                                <div>
                                    <p className="text-[10px] text-slate-400 font-medium">Previous</p>
                                    <p className="text-xs font-bold text-slate-700">{prev.title}</p>
                                </div>
                            </button>
                        ) : <div />}

                        {next ? (
                            <button
                                onClick={() => navigateTo(next.moduleId, next.sectionId)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-right group shadow-sm"
                            >
                                <div>
                                    <p className="text-[10px] text-slate-400 font-medium">Next</p>
                                    <p className="text-xs font-bold text-slate-700">{next.title}</p>
                                </div>
                                <FaChevronRight className="text-[10px] text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        ) : <div />}
                    </div>
                </div>

                {/* Scroll to top */}
                {showScrollTop && (
                    <button
                        onClick={scrollToTop}
                        className="fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-50"
                    >
                        <FaArrowUp className="text-sm" />
                    </button>
                )}
            </div>
        </div>
    );
}
