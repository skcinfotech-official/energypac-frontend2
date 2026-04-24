import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ requiredRole }) {
  const { isAuthenticated, authChecked, user } = useAuth();

  // Wait until auth status is known
  if (!authChecked) {
    return null; // or loader
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
