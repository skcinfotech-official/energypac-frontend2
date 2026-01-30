import axiosSecure from "../api/axiosSecure";

export const generatePOFromComparison = async (payload) => {
    const res = await axiosSecure.post("/api/purchase-orders/generate_from_comparison", payload);
    return res.data;
};

export const fetchPurchaseOrders = async (page = 1) => {
    const res = await axiosSecure.get(`/api/purchase-orders?page=${page}`);
    return res.data;
};

export const markItemPurchased = async (poId, itemId) => {
    const res = await axiosSecure.post(`/api/purchase-orders/${poId}/mark_item_purchased`, {
        item_id: itemId
    });
    return res.data;
};

export const getPurchaseOrderReport = (params) => {
    // params can be { start_date, end_date } OR { status } OR { vendor }
    return axiosSecure.get(`/api/reports/purchase-orders`, { params });
};
