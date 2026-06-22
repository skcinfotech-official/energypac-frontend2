// Interactive guided-tour definitions for the Energypac ERP.
//
// Each tour is a list of steps. A step targets an element by selector and shows
// a popover. A step may also carry a `route` — when moving to it, the tour first
// navigates there, waits for the page to render, then highlights the element.
//
// Reliable targets:
//   - Sidebar / navbar items carry stable `data-tour="..."` attributes and are
//     always present (subject to the user's module permissions).
//   - `[data-tour="main-content"]` is the page content area in Layout — always
//     present, so it is safe to highlight right after a route change.

export const tours = [
    {
        id: "orientation",
        label: "App Orientation",
        description: "A quick walk through the whole app — the sidebar, every module, and the top bar.",
        module: null, // available to everyone
        steps: [
            {
                element: '[data-tour="tour-menu-toggle"]',
                popover: {
                    title: "👋 Welcome to Energypac ERP",
                    description: "Let's take a 1-minute tour. This menu button collapses or expands the left sidebar to give you more screen space.",
                    side: "bottom", align: "start",
                },
            },
            {
                element: '[data-tour="tour-master"]',
                popover: {
                    title: "Master Data",
                    description: "Your foundation data lives here — Items / Products, Vendors, and Currencies. Click a module to expand its sub-pages.",
                    side: "right", align: "start",
                },
            },
            {
                element: '[data-tour="tour-purchase"]',
                popover: {
                    title: "Purchase",
                    description: "The full buying workflow: Requisition → Vendor Assignment → Quotation → Comparison → Purchase Order.",
                    side: "right", align: "start",
                },
            },
            {
                element: '[data-tour="tour-sales"]',
                popover: {
                    title: "Sales",
                    description: "Manage the selling side: Proforma Invoices, Bills, Tax/Commercial/Service invoices, plus dashboards and analytics.",
                    side: "right", align: "start",
                },
            },
            {
                element: '[data-tour="tour-finance"]',
                popover: {
                    title: "Finance",
                    description: "Track the money: record payments to vendors and from clients, transport freight, revenue analysis and item analytics — all in INR.",
                    side: "right", align: "start",
                },
            },
            {
                element: '[data-tour="tour-transport"]',
                popover: {
                    title: "Transport",
                    description: "Log shipments against POs/PIs, track pending dispatch item-by-item, and keep a per-transporter ledger.",
                    side: "right", align: "start",
                },
            },
            {
                element: '[data-tour="tour-returns"]',
                popover: {
                    title: "Returns",
                    description: "Process Sales Returns (from clients) and Purchase Returns (to vendors). Stock and Credit/Debit notes update automatically.",
                    side: "right", align: "start",
                },
            },
            {
                element: '[data-tour="tour-client-query"]',
                popover: {
                    title: "Client Query",
                    description: "The starting point of a sale — log a client enquiry here before creating a Proforma Invoice.",
                    side: "right", align: "start",
                },
            },
            {
                element: '[data-tour="tour-verify"]',
                popover: {
                    title: "Verify Documents",
                    description: "When a PI or PO is sent to you for sign-off, it appears here. The red badge shows how many are waiting for you.",
                    side: "right", align: "start",
                },
            },
            {
                element: '[data-tour="tour-profile"]',
                popover: {
                    title: "Your Signature",
                    description: "Upload your digital signature once here. It is then embedded into PI/PO PDFs whenever you approve a document.",
                    side: "right", align: "start",
                },
            },
            {
                element: '[data-tour="tour-userguide"]',
                popover: {
                    title: "User Guide",
                    description: "The full written guide — every page explained, with a 'Where to find it' path for each. You can re-launch this tour from there too.",
                    side: "right", align: "start",
                },
            },
            {
                element: '[data-tour="tour-notifications"]',
                popover: {
                    title: "Notifications",
                    description: "The bell alerts you in real time when a document is sent for your verification.",
                    side: "bottom", align: "end",
                },
            },
            {
                element: '[data-tour="tour-userchip"]',
                popover: {
                    title: "Your Profile",
                    description: "Your name and a green 'online' dot. Click it any time to jump to your profile and signature.",
                    side: "bottom", align: "end",
                },
            },
            {
                element: '[data-tour="tour-logout"]',
                popover: {
                    title: "Log Out",
                    description: "Sign out safely when you're done. That's the tour — explore any module from the sidebar! 🎉",
                    side: "bottom", align: "end",
                },
            },
        ],
    },

    {
        id: "sales-flow",
        label: "Sales: Enquiry → Payment",
        description: "Walk the complete sales journey across the actual pages.",
        module: "SALES",
        steps: [
            {
                route: "/sales/client-query",
                element: '[data-tour="tour-client-query"]',
                popover: {
                    title: "Step 1 — Log the Enquiry",
                    description: "Every sale starts here. Open Client Query and record the client's requirement. This is the page you're now on.",
                    side: "right", align: "start",
                },
            },
            {
                route: "/sales/proforma-invoice",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 2 — Create a Proforma Invoice",
                    description: "From Sales → Proforma Invoice, click '+ New PI', add items and prices, then Send it to the client. Once they confirm, mark it Accepted.",
                    side: "left", align: "start",
                },
            },
            {
                route: "/sales/create-bill",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 3 — Create the Bill",
                    description: "From an Accepted PI, generate the tax invoice here. Pick Domestic (CGST+SGST) or Interstate (IGST) and the totals calculate automatically.",
                    side: "left", align: "start",
                },
            },
            {
                route: "/finance/pi-bills",
                element: '[data-tour="tour-finance"]',
                module: "FINANCE", // cross-module step — skipped if the user has no Finance access
                popover: {
                    title: "Step 4 — Collect Payment",
                    description: "Finally, in Finance → PI Bills, record the client's payments against the bill and track what's still outstanding. Sale complete! 🎉",
                    side: "right", align: "start",
                },
            },
        ],
    },

    {
        id: "purchase-flow",
        label: "Purchase: Requisition → PO",
        description: "Walk the complete buying journey across the actual pages.",
        module: "PURCHASE",
        steps: [
            {
                route: "/requisition",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 1 — Raise a Requisition",
                    description: "List the items and quantities you need to buy. Click '+ New Requisition' to start. Each gets an auto number (REQ-xxx).",
                    side: "left", align: "start",
                },
            },
            {
                route: "/vendor-assignment",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 2 — Assign Vendors",
                    description: "Attach 2–3 vendors to the requisition so they can each quote. More vendors = more competitive pricing.",
                    side: "left", align: "start",
                },
            },
            {
                route: "/vendor-quotation",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 3 — Record Quotations",
                    description: "Enter the prices and terms each vendor quoted, including currency for foreign vendors.",
                    side: "left", align: "start",
                },
            },
            {
                route: "/vendor-quotation-comparison",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 4 — Compare & Choose",
                    description: "See every vendor's quote side-by-side; the best price per item is highlighted. Pick the winning vendor.",
                    side: "left", align: "start",
                },
            },
            {
                route: "/purchase-order",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 5 — Raise the Purchase Order",
                    description: "Create the PO for the chosen vendor, then Lock it after review. Payments are tracked in Finance → PO List.",
                    side: "left", align: "start",
                },
            },
        ],
    },

    {
        id: "transport-flow",
        label: "Transport: Ship & Track",
        description: "See how shipments, dispatch tracking and the transporter ledger fit together.",
        module: "TRANSPORT",
        steps: [
            {
                route: "/transport",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 1 — Log a Shipment",
                    description: "Click 'Log New Shipment', pick a PO (inbound) or PI (outbound), choose a transporter, and enter the quantity going in THIS trip plus the freight cost (always INR).",
                    side: "left", align: "start",
                },
            },
            {
                route: "/transport/dispatch",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 2 — Track Pending Dispatch",
                    description: "See which orders still have items to ship. The eye icon opens a per-item tracker (ordered / shipped / pending) summed across all transporters.",
                    side: "left", align: "start",
                },
            },
            {
                route: "/transport/transporters",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 3 — Transporter Ledger",
                    description: "Open a transporter's ledger (receipt icon) to see freight billed, paid and outstanding. You can export the ledger as a PDF or a colour-matched Excel.",
                    side: "left", align: "start",
                },
            },
        ],
    },

    {
        id: "finance-flow",
        label: "Finance: Money In & Out",
        description: "Tour the finance pages that track cash flow and profitability.",
        module: "FINANCE",
        steps: [
            {
                route: "/finance/dashboard",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 1 — Finance Dashboard",
                    description: "Your money snapshot: total inflow (from clients), outflow (to vendors + transport), and net cash — all converted to INR.",
                    side: "left", align: "start",
                },
            },
            {
                route: "/finance/purchase-orders",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 2 — Pay Vendors (PO List)",
                    description: "Record payments against each Purchase Order and watch the balance fall. Use reference numbers for traceability.",
                    side: "left", align: "start",
                },
            },
            {
                route: "/finance/pi-bills",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 3 — Collect from Clients (PI Bills)",
                    description: "Record client payments against bills here. The outstanding report flags overdue collections.",
                    side: "left", align: "start",
                },
            },
            {
                route: "/finance/revenue-analysis",
                element: '[data-tour="main-content"]',
                popover: {
                    title: "Step 4 — Revenue Analysis",
                    description: "The full P&L per deal — revenue, purchase cost, transport, and margin — plus an enterprise Money In / Out overview. Export it to Excel.",
                    side: "left", align: "start",
                },
            },
        ],
    },
];

// True if the user is allowed to read a given module (ADMIN sees everything).
// A null/undefined module means "no restriction".
export function canReadModule(user, module) {
    if (!module) return true;
    if (user?.role === "ADMIN") return true;
    const perm = user?.permissions?.find((p) => p.module === module);
    return perm ? perm.can_read : false;
}

// Filter tours by the current user's module permissions.
export function availableTours(user) {
    return tours.filter((t) => canReadModule(user, t.module));
}

export function getTour(id) {
    return tours.find((t) => t.id === id);
}
