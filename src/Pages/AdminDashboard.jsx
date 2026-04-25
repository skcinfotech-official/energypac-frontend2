import { useState, useEffect } from "react";
import { FaUsers, FaShieldAlt, FaKey, FaDatabase, FaUserCheck, FaUserSlash } from "react-icons/fa";
import { adminService } from "../services/adminService";

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getUserStats();
        setStatsData(data);
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { 
      label: "Total Users", 
      value: statsData?.total_users || "0", 
      icon: <FaUsers />, 
      color: "bg-blue-500" 
    },
    { 
      label: "Active Users", 
      value: statsData?.active_users || "0", 
      icon: <FaUserCheck />, 
      color: "bg-emerald-500" 
    },
    { 
      label: "Admin Roles", 
      value: statsData?.admin_count || "0", 
      icon: <FaShieldAlt />, 
      color: "bg-indigo-500" 
    },
    { 
      label: "Inactive Users", 
      value: statsData?.inactive_users || "0", 
      icon: <FaUserSlash />, 
      color: "bg-amber-500" 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Admin Dashboard</h2>
        <p className="text-slate-500">System overview and administrative controls.</p>
      </div>


      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 p-6 rounded-3xl animate-pulse h-32"></div>
          ))

        ) : (
          stats.map((stat, idx) => (
            <div key={idx} className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.color} bg-opacity-10 transition-transform group-hover:scale-110`}>
                  <span className={`text-xl ${stat.color.replace('bg-', 'text-')}`}>{stat.icon}</span>
                </div>
              </div>
              <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.label}</h3>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
            </div>
          ))

        )}
      </div>

      {/* RECENT ACTIVITY MOCKUP */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Recent System Activity</h3>
        <div className="space-y-6">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600">
                <FaKey />
              </div>
              <div className="flex-1">
                <p className="text-slate-700 font-bold">User Login Detected</p>
                <p className="text-slate-500 text-sm">System integrity check performed</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs">{i * 5 + 2} minutes ago</p>
                <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mt-1">Success</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
