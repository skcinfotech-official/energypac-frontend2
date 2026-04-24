import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaThLarge,
  FaUserShield,
  FaUsers,
  FaCog,
  FaDatabase,
  FaHistory,
  FaChevronDown,
  FaShieldAlt,
  FaKey,
  FaLock,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

export default function AdminSidebar({ isOpen }) {
  const { user } = useAuth();

  return (
    <aside
      className={`
        relative h-screen flex flex-col transition-all duration-300 ease-in-out
        border-r border-slate-800 shadow-2xl overflow-hidden z-20
        ${isOpen ? "w-64" : "w-16"}
        bg-slate-950 text-slate-300
      `}
    >
      {/* BRAND */}
      <div className="flex items-center gap-3 px-4 py-6 border-b h-16 border-slate-800/50 bg-slate-900/50">
        <div className="flex items-center justify-center h-8 w-8 bg-indigo-600 rounded-lg text-white font-bold shadow-lg shadow-indigo-500/20">
          A
        </div>
        {isOpen && (
          <span className="text-lg font-bold text-white truncate tracking-tight">
            Admin <span className="text-indigo-500">Console</span>
          </span>
        )}
      </div>

      <nav className="flex-1 px-2 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
        <div
          className={`px-3 mb-3 text-[10px] font-bold uppercase tracking-widest ${!isOpen && "text-center"
            } text-indigo-400/60`}
        >
          {isOpen ? "System Administration" : "•••"}
        </div>

        <AdminSidebarLink to="/admin/dashboard" label="Admin Overview" icon={<FaThLarge />} isOpen={isOpen} />
        
        <AdminSidebarDropdown
          label="User Control"
          icon={<FaUsers />}
          isOpen={isOpen}
          items={[
            { to: "/admin/users", label: "Manage Users", icon: <FaUsers /> },
            // { to: "/admin/roles", label: "Roles & Permissions", icon: <FaShieldAlt /> },
            // { to: "/admin/access-logs", label: "Access Logs", icon: <FaKey /> },
          ]}
        />

        {/* <AdminSidebarDropdown
          label="Master Data"
          icon={<FaDatabase />}
          isOpen={isOpen}
          items={[
            { to: "/admin/modules", label: "System Modules", icon: <FaCog /> },
            { to: "/admin/audit-trail", label: "Audit Trail", icon: <FaHistory /> },
          ]}
        />

        <AdminSidebarLink to="/admin/security" label="Security Center" icon={<FaUserShield />} isOpen={isOpen} />
        <AdminSidebarLink to="/admin/settings" label="Global Settings" icon={<FaCog />} isOpen={isOpen} /> */}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/30">
        <div className={`flex items-center ${isOpen ? "gap-3" : "justify-center"}`}>
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white shadow-lg shadow-indigo-500/10">
            {user?.full_name?.[0]?.toUpperCase() || "A"}
          </div>
          {isOpen && (
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {user?.full_name || "Admin User"}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-tighter">
                  {user?.role || "SYSTEM ADMIN"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function AdminSidebarLink({ to, label, icon, isOpen }) {
  return (
    <NavLink
      to={to}
      title={!isOpen ? label : ""}
      className={({ isActive }) =>
        `
        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
        ${isActive
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-medium"
          : "text-slate-400 hover:bg-slate-900 hover:text-white"}
        ${!isOpen ? "justify-center px-0 mx-2" : ""}
        `
      }
    >
      <span className="text-lg">{icon}</span>
      {isOpen && <span className="text-sm truncate">{label}</span>}
    </NavLink>
  );
}

function AdminSidebarDropdown({ label, icon, isOpen, items }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  const checkActive = (navItems) => {
    return navItems.some(item => {
      if (item.items) return checkActive(item.items);
      return location.pathname === item.to;
    });
  };

  const isAnyChildActive = checkActive(items);
  const expanded = isOpen && isExpanded;

  return (
    <div className="space-y-1">
      <button
        onClick={() => isOpen && setIsExpanded((prev) => !prev)}
        title={!isOpen ? label : ""}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
          ${isAnyChildActive
            ? "bg-slate-900 text-white border border-slate-800"
            : "text-slate-400 hover:bg-slate-900 hover:text-white"}
          ${!isOpen ? "justify-center px-0 mx-2" : ""}
        `}
      >
        <span className="text-lg">{icon}</span>

        {isOpen && (
          <>
            <span className="text-sm truncate">{label}</span>
            <span
              className={`ml-auto transition-transform duration-300 ${expanded ? "rotate-180" : ""
                }`}
            >
              <FaChevronDown className="text-[10px]" />
            </span>
          </>
        )}
      </button>

      {expanded && (
        <div className="ml-4 pl-3 border-l border-indigo-500/30 space-y-1 mt-1">
          {items.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200
                  ${isActive
                  ? "text-indigo-400 font-semibold bg-indigo-500/5"
                  : "text-slate-500 hover:text-slate-200 hover:bg-slate-900"}`
              }
            >
              <span className="text-sm opacity-70">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
