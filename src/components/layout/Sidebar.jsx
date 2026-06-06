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
  FaUserShield,
  FaGlobe,
  FaHistory,
  FaTruck,
  FaChartPie,
  FaCoins,
  FaFileInvoiceDollar,
  FaUndoAlt
} from "react-icons/fa";
import { BiImport } from "react-icons/bi";
import { RiCustomerService2Fill } from "react-icons/ri";
import { BiSolidPurchaseTag } from "react-icons/bi";
import { HiUserAdd } from "react-icons/hi";
import { HiDocumentText } from "react-icons/hi";
import { FaMoneyBillTrendUp } from "react-icons/fa6";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ isOpen }) {
  const { user } = useAuth();
  
  const hasPermission = (moduleName) => {
    // Admins have access to everything
    if (user?.role === "ADMIN") return true;
    if (!user || !user.permissions) return false;
    const perm = user.permissions.find(p => p.module === moduleName);
    return perm ? perm.can_read : false;
  };

  return (
    <aside
      className={`
        relative h-screen flex flex-col transition-all duration-300 ease-in-out
        border-r border-slate-200 shadow-xl overflow-hidden z-20
        ${isOpen ? "w-64" : "w-16"}
        bg-white text-slate-600

      `}
    >
      {/* BRAND */}
      <div className={`flex items-center ${isOpen ? "px-6" : "justify-center px-0"} border-b h-16 border-slate-200 bg-white`}>
        {!isOpen ? (
          <div className="flex items-center justify-center h-9 w-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white font-bold shrink-0 shadow-lg shadow-blue-500/20">
            E
          </div>
        ) : (
          <img src="/main_logo.png" alt="Energypac" className="h-9 w-auto object-contain" />
        )}
      </div>

      <nav className="flex-1 px-2 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
        <div
          className={`px-3 mb-3 text-[10px] font-bold uppercase tracking-widest ${!isOpen && "text-center"
            } text-slate-500`}

        >
          {isOpen ? "Management Console" : "•••"}
        </div>

        {/* <SidebarLink to="/" label="Dashboard" icon={<FaThLarge />} isOpen={isOpen} /> */}

        <SidebarLink to="/audit-logs" label="Audit Logs" icon={<FaHistory />} isOpen={isOpen} />
        <SidebarLink to="/sales/client-query" label="Client Query" icon={<FaUserTie />} isOpen={isOpen} />

        {hasPermission("MASTER") && (
          <SidebarDropdown
            label="Master"
            icon={<BiImport />}
            isOpen={isOpen}
            items={[
              // { to: "/HSN", label: "HSN Code", icon: <FaBarcode /> },
              { to: "/master/item", label: "Item", icon: <FaCube /> },
              { to: "/master/vendor", label: "Vendor", icon: <FaUserTie /> },
              { to: "/master/currency", label: "Currency", icon: <FaGlobe /> },
            ]}
          />
        )}

        {hasPermission("PURCHASE") && (
          <SidebarDropdown
            label="Purchase"
            icon={<BiImport />}
            isOpen={isOpen}
            items={[
              { to: "/", label: "Purchase Dashboard", icon: <FaThLarge /> },
              { to: "/requisition", label: "Requisition", icon: <FaFileAlt /> },
              { to: "/vendor-assignment", label: "Vendor Assignment", icon: <FaUserTie /> },
              { to: "/vendor-quotation", label: "Vendor Quotation", icon: <FaUserTie /> },
              { to: "/vendor-quotation-comparison", label: "Quotation Comparison", icon: <FaChartLine /> },
              { to: "/purchase-order", label: "Purchase Order", icon: <BiSolidPurchaseTag /> },
            ]}
          />
        )}

        {hasPermission("SALES") && (
          <SidebarDropdown
            label="Sales"
            icon={<FaMoneyCheckAlt />}
            isOpen={isOpen}
            items={[
              { to: "/sales/dashboard", label: "Sales Dashboard", icon: <FaThLarge /> },
              { to: "/sales/sales-statistics", label: "Sales Statistics", icon: <FaChartLine /> },
              { to: "/sales/sales-performance", label: "Performance Report", icon: <FaTrophy /> },
              { to: "/sales/sales-products", label: "Product Analysis", icon: <FaBoxOpen /> },
              { to: "/sales/proforma-invoice", label: "Proforma Invoice", icon: <FaUserTie /> },
              { to: "/sales/create-bill", label: "Create Bill", icon: <FaMoneyCheckAlt /> },
            ]}
          />
        )}

        {hasPermission("FINANCE") && (
          <SidebarDropdown
            label="Finance"
            icon={<FaMoneyBillTrendUp />}
            isOpen={isOpen}
            items={[
              { to: "/finance/dashboard", label: "Finance Dashboard", icon: <FaThLarge /> },
              { to: "/finance/purchase-orders", label: "PO List", icon: <BiSolidPurchaseTag /> },
              { to: "/finance/pi-bills", label: "PI Bills List", icon: <FaList /> },
              { to: "/finance/pi-advanced", label: "PI Advance List", icon: <FaCoins /> },
              { to: "/finance/revenue-analysis", label: "Revenue Analysis", icon: <FaFileInvoiceDollar /> },
              { to: "/finance/item-analytics", label: "Item Analytics", icon: <FaChartLine /> },
              { to: "/finance/inventory-aging", label: "Dead Stock", icon: <FaCube /> },
            ]}
          />
        )}
        {hasPermission("TRANSPORT") && (
          <SidebarDropdown
            label="Transport"
            icon={<FaTruck />}
            isOpen={isOpen}
            items={[
              { to: "/transport/dashboard", label: "Transport Dashboard", icon: <FaChartPie /> },
              { to: "/transport", label: "Transport Entry", icon: <FaList /> },
            ]}
          />
        )}
        {hasPermission("RETURNS") && (
          <SidebarLink to="/returns" label="Returns" icon={<FaUndoAlt />} isOpen={isOpen} />
        )}

        {user?.role === "ADMIN" && (
          <SidebarLink to="/admin/users" label="Admin Panel" icon={<FaUserShield />} isOpen={isOpen} />
        )}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className={`flex items-center ${isOpen ? "gap-3" : "justify-center"}`} title={!isOpen ? `${user?.full_name || "User"} (${user?.role || "Employee"})` : ""}>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
            {user?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          {isOpen && (
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">
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
      end
      title={!isOpen ? label : ""}
      className={({ isActive }) =>
        `
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
        ${isActive
          ? "bg-blue-50 text-blue-600 font-bold"
          : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}

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
  const location = useLocation();

  const checkActive = (navItems) => {
    return navItems.some(item => {
      if (item.items) return checkActive(item.items);
      return location.pathname === item.to;
    });
  };

  const isAnyChildActive = checkActive(items);
  const [isExpanded, setIsExpanded] = useState(isAnyChildActive);

  const expanded = isOpen && isExpanded;

  return (
    <div className="space-y-1">
      <button
        onClick={() => isOpen && setIsExpanded((prev) => !prev)}
        title={!isOpen ? label : ""}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
          ${isAnyChildActive
            ? "bg-slate-100 text-slate-900 font-bold"
            : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}

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
        <div className="ml-4 pl-3 border-l-2 border-slate-100 space-y-1">

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
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                    ${isActive
                    ? "bg-blue-50 text-blue-600 font-bold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`

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
