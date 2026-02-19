import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaThLarge,
  FaFileAlt,
  FaMoneyCheckAlt,
  FaChevronDown,
  FaBarcode,
  FaCube,
  FaUserTie,
  FaChartLine,
  FaTrophy,
  FaBoxOpen,
  FaList,
} from "react-icons/fa";
import { BiImport } from "react-icons/bi";
import { RiCustomerService2Fill } from "react-icons/ri";
import { BiSolidPurchaseTag } from "react-icons/bi";
import { HiUserAdd } from "react-icons/hi";
import { HiDocumentText } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ isOpen }) {
  const { user } = useAuth();

  return (
    <aside
      className={`
        relative h-screen flex flex-col transition-all duration-300 ease-in-out
        border-r border-slate-800 shadow-xl overflow-hidden z-20
        ${isOpen ? "w-64" : "w-16"}
        bg-slate-900 text-slate-300
      `}
    >
      {/* BRAND */}
      <div className="flex items-center gap-3 px-4 py-6 border-b h-16 border-slate-800/50">
        <div className="flex items-center justify-center h-8 w-8 bg-blue-600 rounded-lg text-white font-bold">
          E
        </div>
        {isOpen && (
          <span className="text-lg font-bold text-white truncate">
            Energypac <span className="text-blue-500">ERP</span>
          </span>
        )}
      </div>

      <nav className="flex-1 px-2 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
        <div
          className={`px-3 mb-3 text-[10px] font-bold uppercase tracking-widest ${!isOpen && "text-center"
            } text-slate-400`}
        >
          {isOpen ? "Management Console" : "•••"}
        </div>

        {/* <SidebarLink to="/" label="Dashboard" icon={<FaThLarge />} isOpen={isOpen} /> */}

        <SidebarDropdown
          label="Master"
          icon={<BiImport />}
          isOpen={isOpen}
          items={[
            { to: "/HSN", label: "HSN Code", icon: <FaBarcode /> },
            { to: "/master/item", label: "Item", icon: <FaCube /> },
            { to: "/master/vendor", label: "Vendor", icon: <FaUserTie /> },
          ]}
        />
        <SidebarDropdown
          label="Purchase"
          icon={<BiImport />}
          isOpen={isOpen}
          items={[
            { to: "/", label: "Purchase Dashboard", icon: <FaThLarge /> },
            { to: "/requisition", label: "Requisition", icon: <FaFileAlt /> },
            { to: "/vendor-assignment", label: "Vendor Assignment", icon: <FaUserTie /> },
            { to: "/vendor-quotation", label: "Vendor Quotation", icon: <FaUserTie /> },
            { to: "/purchase-order", label: "Purchase Order", icon: <BiSolidPurchaseTag /> },

          ]}
        />

        {/* <SidebarLink to="/sales" label="Sales" icon={<FaMoneyCheckAlt />} isOpen={isOpen} /> */}
        {/* <SidebarLink to="/requisition" label="Requisition" icon={<FaFileAlt />} isOpen={isOpen} />
        <SidebarLink to="/vendor-assignment" label="Vendor Assignment" icon={<HiUserAdd />} isOpen={isOpen} />
        <SidebarLink to="/vendor-quotation" label="Vendor Quotation" icon={<HiDocumentText />} isOpen={isOpen} />
        <SidebarLink to="/purchase-order" label="Purchase Order" icon={<BiSolidPurchaseTag />} isOpen={isOpen} /> */}
        <SidebarDropdown
          label="Sales"
          icon={<FaMoneyCheckAlt />}
          isOpen={isOpen}
          items={[
            { to: "/sales/dashboard", label: "Sales Dashboard", icon: <FaThLarge /> },
            { to: "/sales/sales-statistics", label: "Sales Statistics", icon: <FaChartLine /> },
            { to: "/sales/sales-performance", label: "Performance Report", icon: <FaTrophy /> },
            { to: "/sales/sales-products", label: "Product Analysis", icon: <FaBoxOpen /> },
            { to: "/sales/client-query", label: "Client Query", icon: <FaUserTie /> },
            { to: "/sales/client-quotation", label: "Client Quotation", icon: <FaUserTie /> },
            // Nested Group: Work Order
            {
              label: "Work Order",
              icon: <FaFileAlt />,
              items: [
                { to: "/sales/create-work-order", label: "Create Work Order", icon: <BiSolidPurchaseTag /> },
                { to: "/sales/work-orders", label: "Work Order List", icon: <FaList /> },
                // You can add list view here later, e.g., { to: "/sales/work-orders", label: "Work Order List", icon: ... }
              ]
            },
            {
              label: "Work Order Bills",
              icon: <FaFileAlt />,
              items: [
                { to: "/sales/billing-dashboard", label: "Billing Dashboard", icon: <BiSolidPurchaseTag /> },  
                { to: "/sales/billing-analytics", label: "Billing Analytics", icon: <BiSolidPurchaseTag /> },  
                { to: "/sales/create-wo-bill", label: "Create WO Bill", icon: <BiSolidPurchaseTag /> },
                { to: "/sales/wo-bills", label: "WO Bills List", icon: <FaList /> },
                // You can add list view here later, e.g., { to: "/sales/work-orders", label: "Work Order List", icon: ... }
              ]
            },
          ]}
        />
        <SidebarLink to="/direct-purchase" label="Direct Purchase" icon={<BiSolidPurchaseTag />} isOpen={isOpen} />
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-800/50">
        <div className={`flex items-center ${isOpen ? "gap-3" : "justify-center"}`}>
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-white">
            {user?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          {isOpen && (
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {user?.full_name || "User"}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">
                {user?.role || "Employee"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ to, label, icon, isOpen }) {
  return (
    <NavLink
      to={to}
      title={!isOpen ? label : ""}
      className={({ isActive }) =>
        `
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
        ${isActive
          ? "bg-blue-600/10 text-blue-400 font-semibold"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"}
        ${!isOpen ? "justify-center px-0 mx-2" : ""}
        `
      }
    >
      <span className="text-xl">{icon}</span>
      {isOpen && <span className="text-sm truncate">{label}</span>}
    </NavLink>
  );
}

function SidebarDropdown({ label, icon, isOpen, items }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  // Helper to check active state recursively
  const checkActive = (navItems) => {
    return navItems.some(item => {
      if (item.items) return checkActive(item.items);
      return location.pathname === item.to;
    });
  };

  const isAnyChildActive = checkActive(items);

  // ✅ derived expansion — no effect, no warning
  const expanded = isOpen && isExpanded;

  return (
    <div className="space-y-1">
      <button
        onClick={() => isOpen && setIsExpanded((prev) => !prev)}
        title={!isOpen ? label : ""}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
          ${isAnyChildActive
            ? "bg-slate-800/50 text-white"
            : "text-slate-400 hover:bg-slate-800 hover:text-white"}
          ${!isOpen ? "justify-center px-0 mx-2" : ""}
        `}
      >
        <span className="text-xl">{icon}</span>

        {isOpen && (
          <>
            <span className="text-sm truncate">{label}</span>
            <span
              className={`ml-auto transition-transform ${expanded ? "rotate-180" : ""
                }`}
            >
              <FaChevronDown className="text-[10px]" />
            </span>
          </>
        )}
      </button>

      {expanded && (
        <div className="ml-4 pl-3 border-l-2 border-slate-800 space-y-1">
          {items.map((item, index) => {
            // Check if it is a sub-section (nested items) - RECURSIVE RENDER
            if (item.items) {
              return (
                <SidebarDropdown
                  key={index}
                  label={item.label}
                  icon={item.icon}
                  isOpen={isOpen}
                  items={item.items}
                />
              );
            }
            // Standard Link
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                    ${isActive
                    ? "bg-blue-600/10 text-blue-400 font-semibold"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"}`
                }
              >
                <span className="text-base opacity-70">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
