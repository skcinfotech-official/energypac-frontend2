import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ requiredRole }) {
  const { isAuthenticated, authChecked, user } = useAuth();

  if (!authChecked) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm text-slate-400 font-medium">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // If user doesn't have the required role, redirect to their default home
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
