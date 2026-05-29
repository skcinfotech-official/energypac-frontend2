import axiosSecure from "../api/axiosSecure";

/* =========================
   CURRENCY APIs
   ========================= */

// LIST (with pagination support)
export const getCurrencies = ({
    url = "/api/currencies",
    search = "",
    isActive = null,
} = {}) => {
    const params = {};

    if (search) params.search = search;
    if (isActive !== null) params.is_active = isActive;

    const requestUrl = url || "/api/currencies";
    return axiosSecure.get(requestUrl, { params });
};

// RETRIEVE (View Details)
export const getCurrency = (id) => {
    return axiosSecure.get(`/api/currencies/${id}`);
};

// CREATE
export const createCurrency = (data) => {
    return axiosSecure.post("/api/currencies", data);
};

// UPDATE (PATCH)
export const updateCurrency = (id, data) => {
    return axiosSecure.patch(`/api/currencies/${id}`, data);
};

// DELETE
export const deleteCurrency = (id, payload = {}) => {
    return axiosSecure.delete(`/api/currencies/${id}`, { data: payload });
};
