import { createContext, useContext, useState, useEffect } from "react";
import axiosSecure from "../api/axiosSecure";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ✅ SSR-safe initialization - don't access localStorage during SSR
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ✅ Load from localStorage only on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      const storedUser = localStorage.getItem("user");
      
      setIsAuthenticated(Boolean(token));
      
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      }
      
      setAuthChecked(true);
    }
  }, []);

  /* =========================
     LOGIN
     ========================= */
  const login = async (employee_code, password) => {
    try {
      const res = await axiosSecure.post("/api/auth/login", {
        employee_code,
        password,
      });

      const userData = res.data.user;

      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("user", JSON.stringify(userData));

      document.cookie = `refresh_token=${res.data.refresh}; path=/; max-age=86400; SameSite=Lax`;

      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      throw new Error(
        error.response?.data?.detail || "Invalid credentials"
      );
    }
  };

  /* =========================
     LOGOUT
     ========================= */
  const logout = () => {
    localStorage.clear();
    document.cookie = "refresh_token=; path=/; max-age=0";
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authChecked,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
