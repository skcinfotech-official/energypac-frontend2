import axiosSecure from "../api/axiosSecure";

/* =========================
   STOCK REGISTER APIs
   ========================= */

// Paginated stock register.
// params: { search, status, ordering, page, page_size, active_only }
export const getStock = async (params = {}) => {
    const res = await axiosSecure.get("/api/stock", { params });
    return res.data;
};

// KPI totals for the page header. params: { search, active_only }
export const getStockSummary = async (params = {}) => {
    const res = await axiosSecure.get("/api/stock/summary", { params });
    return res.data;
};

// Full purchase + sale ledger of one item.
export const getStockDetail = async (productId) => {
    const res = await axiosSecure.get(`/api/stock/${productId}`);
    return res.data;
};
