import axiosSecure from "../api/axiosSecure";

// ── Sales Returns ───────────────────────────────────────────────────────────

export const getSalesReturns = async (page = 1, searchQuery = "") => {
    const params = { page, search: searchQuery };
    const response = await axiosSecure.get("/api/sales-returns", { params });
    return response.data;
};

export const getSalesReturnById = async (id) => {
    const response = await axiosSecure.get(`/api/sales-returns/${id}`);
    return response.data;
};

export const createSalesReturn = async (payload) => {
    const response = await axiosSecure.post("/api/sales-returns", payload);
    return response.data;
};

export const approveSalesReturn = async (id) => {
    const response = await axiosSecure.post(`/api/sales-returns/${id}/approve`);
    return response.data;
};

export const cancelSalesReturn = async (id) => {
    const response = await axiosSecure.post(`/api/sales-returns/${id}/cancel`);
    return response.data;
};

export const getPiItemsForReturn = async (piId) => {
    const response = await axiosSecure.get("/api/sales-returns/pi_items", {
        params: { proforma_invoice: piId }
    });
    return response.data;
};

// ── Purchase Returns ────────────────────────────────────────────────────────

export const getPurchaseReturns = async (page = 1, searchQuery = "") => {
    const params = { page, search: searchQuery };
    const response = await axiosSecure.get("/api/purchase-returns", { params });
    return response.data;
};

export const getPurchaseReturnById = async (id) => {
    const response = await axiosSecure.get(`/api/purchase-returns/${id}`);
    return response.data;
};

export const createPurchaseReturn = async (payload) => {
    const response = await axiosSecure.post("/api/purchase-returns", payload);
    return response.data;
};

export const approvePurchaseReturn = async (id) => {
    const response = await axiosSecure.post(`/api/purchase-returns/${id}/approve`);
    return response.data;
};

export const cancelPurchaseReturn = async (id) => {
    const response = await axiosSecure.post(`/api/purchase-returns/${id}/cancel`);
    return response.data;
};

export const getPoItemsForReturn = async (poId) => {
    const response = await axiosSecure.get("/api/purchase-returns/po_items", {
        params: { purchase_order: poId }
    });
    return response.data;
};
