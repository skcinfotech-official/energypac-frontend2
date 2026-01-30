import { useState, useEffect } from "react"; // Added useEffect
import { NavLink, useLocation } from "react-router-dom";
import {
  FaThLarge,
  FaFileAlt,
  FaMoneyCheckAlt,
  FaChevronDown,
  FaChevronRight,
  FaBarcode, // Imported
  FaCube, // Imported
  FaUserTie, // Imported
  FaFileExport, // Imported
  FaHistory, // Imported
} from "react-icons/fa";
import { BiImport, BiExport } from "react-icons/bi";

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
      {/* BRAND SECTION */}
      <div className="flex items-center gap-3 px-4 py-6 border-b h-16 border-slate-800/50">
        <div className="flex items-center justify-center h-8 w-8 min-w-[2rem] bg-blue-600 rounded-lg text-white font-bold shadow-lg shadow-blue-900/20">
          E
        </div>
        {isOpen && (
          <span className="text-lg font-bold tracking-tight truncate text-white">
            Energypac <span className="text-blue-500">ERP</span>
          </span>
        )}
      </div>

      <nav className="flex-1 px-2 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className={`px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.1em] ${!isOpen && "text-center"} text-slate-400`}>
          {isOpen ? "Management Console" : "•••"}
        </div>

        <SidebarLink to="/" label="Dashboard" icon={<FaThLarge />} isOpen={isOpen} />

        <SidebarDropdown
          label="Master"
          icon={<BiImport />}
          isOpen={isOpen}
          items={[
            { to: "/", label: "HSN Code", icon: <FaBarcode /> },
            { to: "/master/item", label: "Item", icon: <FaCube /> },
            { to: "/master/vendor", label: "Vendor", icon: <FaUserTie /> },
          ]}
        />

        <SidebarDropdown
          label="Export"
          icon={<BiExport />}
          isOpen={isOpen}
          items={[
            { to: "/", label: "Export Data", icon: <FaFileExport /> },
            { to: "/", label: "Export Log", icon: <FaHistory /> },
          ]}
        />

        <SidebarLink to="/sales" label="Sales" icon={<FaMoneyCheckAlt />} isOpen={isOpen} />
        <SidebarLink to="/requisition" label="Requisition" icon={<FaFileAlt />} isOpen={isOpen} />
        <SidebarLink to="/vendor-assignment" label="Vendor Assignment" icon={<FaFileAlt />} isOpen={isOpen} />
        <SidebarLink to="/vendor-quotation" label="Vendor Quotation" icon={<FaFileAlt />} isOpen={isOpen} />
        <SidebarLink to="/purchase-order" label="Purchase Order" icon={<FaFileAlt />} isOpen={isOpen} />

      </nav>

      {/* FOOTER SECTION */}
      <div className="p-4 border-t border-slate-800/50">
        <div className={`flex items-center ${isOpen ? "gap-3" : "justify-center"}`}>
          <div className="h-8 w-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-semibold text-white">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
          </div>
          {isOpen && (
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || "User"}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-bold">{user?.role || "Employee"}</p>
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
      className={({ isActive }) =>
        `
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
        ${isActive
          ? "bg-blue-600/10 text-blue-400 font-semibold ring-1 ring-blue-500/20"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }
        ${!isOpen ? "justify-center px-0 mx-2" : ""}
        `
      }
      title={!isOpen ? label : ""}
    >
      {({ isActive }) => (
        <>
          <span className={`text-xl transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-blue-500" : ""}`}>
            {icon}
          </span>
          {isOpen && <span className="truncate text-sm">{label}</span>}

          {isActive && isOpen && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          )}
        </>
      )}
    </NavLink>
  );
}

function SidebarDropdown({ label, icon, isOpen, items }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  // Close dropdown if sidebar collapses
  useEffect(() => {
    if (!isOpen) {
      setIsExpanded(false);
    }
  }, [isOpen]);

  const isAnyChildActive = items.some(item => location.pathname === item.to);

  return (
    <div className="space-y-1">
      <button
        onClick={() => isOpen && setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
          ${isAnyChildActive
            ? "bg-slate-800/50 text-white"
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }
           ${!isOpen ? "justify-center px-0 mx-2" : ""}
        `}
        title={!isOpen ? label : ""}
      >
        <span className={`text-xl transition-transform duration-200 group-hover:scale-110 ${isAnyChildActive ? "text-blue-500" : ""}`}>
          {icon}
        </span>
        {isOpen && (
          <>
            <span className="truncate text-sm">{label}</span>
            <span className={`ml-auto transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
              <FaChevronDown className="text-[10px]" />
            </span>
          </>
        )}
      </button>

      {isOpen && isExpanded && (
        <div className="ml-4 pl-3 border-l-2 border-slate-800 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => ` block px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2
                ${isActive
                  ? "bg-blue-600/10 text-blue-400 font-semibold ring-1 ring-blue-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}>
              <span className="text-base opacity-70">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
