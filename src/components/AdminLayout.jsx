import { useState } from "react";
import AdminNavbar from "./layout/AdminNavbar";
import AdminSidebar from "./layout/AdminSidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="h-screen flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <AdminSidebar isOpen={isSidebarOpen} />

        {/* RIGHT SIDE AREA */}
        <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">

          {/* TOP NAVBAR */}
          <AdminNavbar
            toggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
