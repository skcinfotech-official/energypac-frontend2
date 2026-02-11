import { FaSignOutAlt, FaBars } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";

export default function Navbar({ toggleSidebar, isSidebarOpen }) {
  const { logout } = useAuth();
  const location = useLocation();

  // Convert path to readable title
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

  return (
    <header
      className="
        sticky top-0 z-10
        h-16 px-6 flex items-center justify-between
        border-b backdrop-blur-md transition-all duration-300
        bg-white/80 border-slate-200 text-slate-900
      "
    >
      <div className="flex items-center gap-4">
        {/* SIDEBAR TOGGLE */}
        <button
          onClick={toggleSidebar}
          className="
            p-2 rounded-lg transition-all duration-200
            hover:bg-slate-100 text-slate-500 hover:text-blue-600
            active:bg-slate-200
          "
        >
          <FaBars
            className={`text-lg transition-transform duration-300 ${isSidebarOpen ? "rotate-90" : ""
              }`}
          />
        </button>

        {/* PAGE TITLE */}
        <div className="hidden md:block">
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-widest">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-6">
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

        <button
          onClick={logout}
          className="
            flex items-center gap-2.5 px-4 py-2 rounded-lg transition-all duration-200
            bg-slate-50 text-slate-600 font-medium text-sm
            hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-100
          "
        >
          <FaSignOutAlt className="text-xs" />
          <span>Log Out</span>
        </button>
      </div>
    </header>
  );
}
