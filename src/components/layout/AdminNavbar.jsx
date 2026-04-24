import { useState } from "react";
import { FaSignOutAlt, FaBars, FaShieldAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import ConfirmDialog from "../ui/ConfirmDialog";

export default function AdminNavbar({ toggleSidebar, isSidebarOpen }) {
  const { logout } = useAuth();
  const location = useLocation();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/admin/dashboard") return "Admin Control Panel";
    
    return path
      .split("/")
      .pop()
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <>
    <header
      className="
        sticky top-0 z-10
        h-16 px-6 flex items-center justify-between
        border-b backdrop-blur-xl transition-all duration-300
        bg-slate-900/90 border-slate-800 text-white
      "
    >
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="
            p-2 rounded-xl transition-all duration-200
            hover:bg-slate-800 text-slate-400 hover:text-indigo-400
            active:bg-slate-700
          "
        >
          <FaBars
            className={`text-lg transition-transform duration-300 ${isSidebarOpen ? "rotate-90" : ""
              }`}
          />
        </button>

        <div className="hidden md:flex items-center gap-3">
          <FaShieldAlt className="text-indigo-500 text-xl" />
          <h1 className="text-sm font-bold text-slate-100 uppercase tracking-[0.2em]">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">System Secure</span>
        </div>

        <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>

        <button
          onClick={() => setIsLogoutDialogOpen(true)}
          className="
            flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-200
            bg-slate-800 text-slate-300 font-medium text-sm
            hover:bg-red-500/10 hover:text-red-400 border border-slate-700 hover:border-red-500/30
          "
        >
          <FaSignOutAlt className="text-xs" />
          <span>Logout</span>
        </button>
      </div>

    </header>
    <ConfirmDialog 
      open={isLogoutDialogOpen}
      title="Exit Admin Console"
      message="Are you sure you want to log out from the administrative session?"
      confirmText="Yes, Log Out"
      onConfirm={logout}
      onCancel={() => setIsLogoutDialogOpen(false)}
      icon={FaSignOutAlt}
    />
    </>
  );
}
