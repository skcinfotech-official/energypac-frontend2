import axios from "axios";

// Strip trailing slash(es) so combined URLs never produce a double slash
// (e.g. "https://host//api/..."), which 404s on the server.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

const axiosSecure = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================
   REQUEST INTERCEPTOR
   ========================= */
axiosSecure.interceptors.request.use(
  (config) => {
    // ✅ Only access localStorage in browser environment
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   REFRESH TOKEN LOGIC
   ========================= */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper to get cookie - SSR safe
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

/* =========================
   RESPONSE INTERCEPTOR
   ========================= */
axiosSecure.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // if unauthorized & not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Get refresh token from cookie
      const refreshToken = getCookie("refresh_token");

      if (!refreshToken) {
        if (typeof window !== "undefined") {
          localStorage.clear();
          document.cookie = "refresh_token=; path=/; max-age=0";
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // if refresh already in progress → queue requests
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosSecure(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          { refresh: refreshToken }
        );

        const { access, refresh } = res.data;

        // store new tokens
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", access);
          document.cookie = `refresh_token=${refresh}; path=/; max-age=86400; SameSite=Lax`;
        }

        // update default header
        axiosSecure.defaults.headers.Authorization = `Bearer ${access}`;

        processQueue(null, access);

        // retry original request
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosSecure(originalRequest);
      } catch (err) {
        processQueue(err, null);
        if (typeof window !== "undefined") {
          localStorage.clear();
          document.cookie = "refresh_token=; path=/; max-age=0";
          window.location.href = "/login";
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosSecure;
