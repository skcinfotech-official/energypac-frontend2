import axiosSecure from "../api/axiosSecure";

export const fetchFinancePurchaseOrders = async (params = {}) => {
    // params can be { vendor, status, search, ordering, page }
    const res = await axiosSecure.get("/api/finance/purchase-orders", { params });
    return res.data;
};

export const fetchFinancePOItems = async (id) => {
    const res = await axiosSecure.get(`/api/finance/purchase-orders/${id}/purchased_items`);
    return res.data;
};

export const recordFinancePayment = async (id, payload) => {
    const res = await axiosSecure.post(`/api/finance/purchase-orders/${id}/record_payment`, payload);
    return res.data;
};

export const fetchFinancePOPaymentHistory = async (id) => {
    const res = await axiosSecure.get(`/api/finance/purchase-orders/${id}/payment_history`);
    return res.data;
};

export const getFinanceDashboard = async () => {
    const res = await axiosSecure.get("/api/finance/dashboard");
    return res.data;
};

export const getProfitLossList = async (params = {}) => {
    const res = await axiosSecure.get("/api/finance/profit-loss", { params });
    return res.data;
};

export const getProfitLossItems = async (requisitionId) => {
    const res = await axiosSecure.get("/api/finance/profit-loss/items", {
        params: { requisition: requisitionId }
    });
    return res.data;
};

export const previewProfit = async (payload) => {
    const res = await axiosSecure.post("/api/finance/profit-preview", payload);
    return res.data;
};
