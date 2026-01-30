import { createContext, useContext, useEffect, useState } from "react";
import axiosSecure from "../api/axiosSecure";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  /* =========================
     INITIAL AUTH CHECK
     ========================= */
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");

    setIsAuthenticated(!!token);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
    setAuthChecked(true);
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
      localStorage.setItem("refresh_token", res.data.refresh);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
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
