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
        bg-white border-slate-200 text-slate-900 shadow-sm

      "
    >
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="
            p-2 rounded-xl transition-all duration-200
            hover:bg-slate-100 text-slate-500 hover:text-indigo-600
            active:bg-slate-200

          "
        >
          <FaBars
            className={`text-lg transition-transform duration-300 ${isSidebarOpen ? "rotate-90" : ""
              }`}
          />
        </button>

        <div className="hidden md:flex items-center gap-3">
          <FaShieldAlt className="text-indigo-500 text-xl" />
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-[0.2em]">

            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">System Secure</span>
        </div>

        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>


        <button
          onClick={() => setIsLogoutDialogOpen(true)}
          className="
            flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-200
            bg-slate-50 text-slate-600 font-medium text-sm
            hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200

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
