import { useState } from "react";
import { FaSignOutAlt, FaBars } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import ConfirmDialog from "../ui/ConfirmDialog";

export default function Navbar({ toggleSidebar, isSidebarOpen }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Purchase Dashboard";
    if (path === "/sales/dashboard") return "Sales Dashboard";
    return path
      .split("/")
      .pop()
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === "/") return null;
    const segments = path.split("/").filter(Boolean);
    if (segments.length <= 1) return null;
    return segments.slice(0, -1).map(s =>
      s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    ).join(" / ");
  };

  const breadcrumb = getBreadcrumb();

  return (
    <>
    <header
      className="
        sticky top-0 z-10
        h-16 px-6 flex items-center justify-between
        border-b backdrop-blur-md transition-all duration-300
        bg-white/80 border-slate-200 text-slate-900
      "
    >
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg transition-all duration-200 hover:bg-slate-100 text-slate-500 hover:text-blue-600 active:bg-slate-200"
        >
          <FaBars className={`text-lg transition-transform duration-300 ${isSidebarOpen ? "rotate-90" : ""}`} />
        </button>

        <div className="hidden md:block">
          {breadcrumb && (
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest -mb-0.5">{breadcrumb}</p>
          )}
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-widest">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>{user?.full_name || "User"}</span>
        </div>
        <button
          onClick={() => setIsLogoutDialogOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-lg transition-all duration-200 bg-slate-50 text-slate-600 font-medium text-sm hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-100"
        >
          <FaSignOutAlt className="text-xs" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </header>
    <ConfirmDialog 
      open={isLogoutDialogOpen}
      title="Confirm Logout"
      message="Are you sure you want to log out from your account?"
      confirmText="Logout"
      onConfirm={logout}
      onCancel={() => setIsLogoutDialogOpen(false)}
      icon={FaSignOutAlt}
    />
    </>
  );
}
