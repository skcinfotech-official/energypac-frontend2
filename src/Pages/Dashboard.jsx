import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaFileAlt, FaChartLine, FaArrowUp, FaBox, FaShoppingBag, FaFileInvoiceDollar, FaRegListAlt, FaArrowRight } from "react-icons/fa";
import { getDashboardStats } from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";

// Helper to fix API links to Client Routes
const normalizeLink = (link) => {
  if (!link) return "#";

  // Handle base route mapping
  let newLink = link;

  if (link.includes("/purchase-orders")) {
    newLink = link.replace("/purchase-orders", "/purchase-order");
  } else if (link.includes("/requisitions")) {
    newLink = link.replace("/requisitions", "/requisition");
  } else if (link.includes("/quotations")) {
    newLink = link.replace("/quotations", "/vendor-quotation");
  }

  // Check for ID (UUID)
  const idMatch = newLink.match(/\/([a-f0-9-]{36})/);
  if (idMatch) {
    const id = idMatch[1];
    // Strip ID from path and add as query param
    // basic assumption: path is /resource/uuid -> /resource?view_id=uuid
    // We split by the ID to get the base path.
    const parts = newLink.split('/' + id);
    newLink = `${parts[0]}?view_id=${id}`;
  }

  return newLink;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);



  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }


  const alertsToDisplay = stats && stats.alerts ? (() => {
    const stockAlerts = stats.alerts.filter(a => {
      const text = (a.title + " " + a.message).toLowerCase();
      return text.includes("low stock") || text.includes("out of stock");
    });

    const otherAlerts = stats.alerts.filter(a => {
      const text = (a.title + " " + a.message).toLowerCase();
      return !text.includes("low stock") && !text.includes("out of stock");
    });

    if (stockAlerts.length > 0) {
      return [{
        title: "Stock Health Alert",
        message: `${stockAlerts.length} items are Low or Out of Stock.`,
        link: "/master/item?filter=low_stock",
        action: "View All"
      }, ...otherAlerts];
    }
    return stats.alerts;
  })() : [];


  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Purchase Overview</h2>
          <p className="text-slate-500 text-sm">Welcome back, {user?.full_name || "User"}. Here's what's happening today.</p>
        </div>
        {stats?.generated_at && (
          <div className="text-xs text-slate-500 font-medium">
            Updated Date : {new Date(stats.generated_at).toLocaleString()}
          </div>
        )}
      </div>

      {stats && (
        <>
          {/* STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Inventory Value"
              value={stats.inventory?.total_inventory_value?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || "₹0"}
              change={`${stats.inventory?.total_products || 0} Products`}
              icon={<FaBox />}
              color="blue"
            />
            <StatCard
              title="Active Vendors"
              value={stats.vendors?.active_vendors_last_30_days || 0}
              change={`Total: ${stats.vendors?.total_vendors || 0}`}
              icon={<FaUsers />}
              color="indigo"
            />
            <StatCard
              title="Pending Requisitions"
              value={stats.requisitions?.pending_requisitions || 0}
              change={`Total: ${stats.requisitions?.total_requisitions || 0}`}
              icon={<FaRegListAlt />}
              color="orange"
            />
            <StatCard
              title="Pending PO Value"
              value={stats.purchase_orders?.pending_po_value?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || "₹0"}
              change={`${stats.purchase_orders?.pending_pos || 0} Pending POs`}
              icon={<FaShoppingBag />}
              color="emerald"
            />
          </div>

          {/* ALERTS SECTION */}
          {alertsToDisplay.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alertsToDisplay.map((alert, idx) => (
                <div key={idx} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <FaFileAlt />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 text-sm">{alert.title}</h4>
                    <p className="text-amber-700 text-xs mt-1 mb-2">{alert.message}</p>
                    {alert.link && (
                      <Link to={normalizeLink(alert.link)} className="inline-flex items-center text-xs font-bold text-amber-600 hover:text-amber-800 hover:underline gap-1">
                        {alert.action || "View Details"} <FaArrowRight className="text-[10px]" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* RECENT ACTIVITY SECTION */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Recent Activity</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recent_activities?.slice(0, 10).map((activity, index) => (
                      <TableRow
                        key={index}
                        activity={activity}
                      />
                    ))}
                    {(!stats.recent_activities || stats.recent_activities.length === 0) && (
                      <tr><td colSpan="4" className="p-6 text-center text-slate-400">No recent activity</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              {/* TOP PRODUCTS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Top Inventory Value</h3>
                </div>
                <div className="p-0">
                  {stats.top_products?.slice(0, 5).map((prod, idx) => (
                    <div key={idx} className="px-6 py-3 border-b border-slate-50 hover:bg-slate-50 flex items-center justify-between last:border-0">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{prod.item_name}</p>
                        <p className="text-xs text-slate-500 font-mono">{prod.item_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600 text-sm">
                          {prod.stock_value?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </p>
                        <p className="text-[10px] text-slate-400">Stock: {prod.current_stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP VENDORS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Top Vendors (by PO)</h3>
                </div>
                <div className="p-0">
                  {stats.top_vendors?.slice(0, 5).map((vendor, idx) => (
                    <div key={idx} className="px-6 py-3 border-b border-slate-50 hover:bg-slate-50 flex items-center justify-between last:border-0">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{vendor.vendor_name}</p>
                        <p className="text-xs text-slate-500 font-mono">{vendor.vendor_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 text-sm">
                          {(vendor.total_po_value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </p>
                        <p className="text-[10px] text-slate-400">Total PO Value</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODALS */}


    </div>
  );
}

function StatCard({ title, value, change, icon, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colors[color]} group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${change.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {change}
        </span>
      </div>
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
      </div>
    </div>
  );
}

function TableRow({ activity }) {
  const typeColors = {
    purchase_order: "bg-emerald-100 text-emerald-700",
    quotation: "bg-blue-100 text-blue-700",
    requisition: "bg-amber-100 text-amber-700",
    other: "bg-slate-100 text-slate-700"
  };

  const typeLabel = {
    purchase_order: "PO",
    quotation: "Quotation",
    requisition: "Requisition",
  };

  const typeKey = activity.type || 'other';

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4">
        <span className="font-semibold text-slate-700 text-sm tracking-wide block">
          {activity.link ? (
            <Link to={normalizeLink(activity.link)} className="hover:text-blue-600 hover:underline">
              {activity.title}
            </Link>
          ) : (
            activity.title
          )}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-slate-500 text-xs">{activity.description}</span>
      </td>
      <td className="px-6 py-4">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${typeColors[typeKey] || typeColors.other}`}>
          {typeLabel[typeKey] || typeKey}
        </span>
      </td>
      <td className="px-6 py-4 text-right text-slate-500 text-xs">
        {new Date(activity.date).toLocaleDateString()}
      </td>
    </tr>
  );
}
