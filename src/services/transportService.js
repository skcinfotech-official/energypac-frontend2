import axiosSecure from "../api/axiosSecure";

export const getTransports = async (page = 1, searchQuery = "") => {
    try {
        const params = {
            page,
            search: searchQuery
        };
        const response = await axiosSecure.get("/api/transport", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching transports:", error);
        throw error;
    }
};

export const getTransportById = async (id) => {
    try {
        const response = await axiosSecure.get(`/api/transport/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching transport by ID ${id}:`, error);
        throw error;
    }
};

export const createTransport = async (payload) => {
    try {
        const response = await axiosSecure.post("/api/transport", payload);
        return response.data;
    } catch (error) {
        console.error("Error creating transport:", error);
        throw error;
    }
};

export const updateTransport = async (id, payload) => {
    try {
        const response = await axiosSecure.patch(`/api/transport/${id}`, payload);
        return response.data;
    } catch (error) {
        console.error(`Error updating transport ${id}:`, error);
        throw error;
    }
};

export const markTransportDelivered = async (id) => {
    try {
        const response = await axiosSecure.post(`/api/transport/${id}/mark_delivered`);
        return response.data;
    } catch (error) {
        console.error(`Error marking transport ${id} as delivered:`, error);
        throw error;
    }
};

export const getTransportsByPO = async (poUuid) => {
    try {
        const response = await axiosSecure.get("/api/transport/by_po", {
            params: { purchase_order: poUuid }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching transports by PO:", error);
        throw error;
    }
};

export const getTransportsByPI = async (piUuid) => {
    try {
        const response = await axiosSecure.get("/api/transport/by_pi", {
            params: { proforma_invoice: piUuid }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching transports by PI:", error);
        throw error;
    }
};

export const getLandedCostPO = async (poUuid) => {
    try {
        const response = await axiosSecure.get("/api/transport/landed_cost", {
            params: { purchase_order: poUuid }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching landed cost PO:", error);
        throw error;
    }
};

export const getLandedCostPI = async (piUuid) => {
    try {
        const response = await axiosSecure.get("/api/transport/landed_cost_pi", {
            params: { proforma_invoice: piUuid }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching landed cost PI:", error);
        throw error;
    }
};

export const getTransportDashboard = async (params = {}) => {
    try {
        const response = await axiosSecure.get("/api/dashboard/transport", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching transport dashboard:", error);
        throw error;
    }
};

export const getTransportCostByPO = async (params = {}) => {
    try {
        const response = await axiosSecure.get("/api/reports/transport/by-po", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching transport cost by PO:", error);
        throw error;
    }
};

export const getTransportCostByVendor = async (params = {}) => {
    try {
        const response = await axiosSecure.get("/api/reports/transport/by-vendor", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching transport cost by vendor:", error);
        throw error;
    }
};

export const getTransportCostBreakdown = async (params = {}) => {
    try {
        const response = await axiosSecure.get("/api/reports/transport/cost-breakdown", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching transport cost breakdown:", error);
        throw error;
    }
};

export const getTransportLandedCostReport = async (params = {}) => {
    try {
        const response = await axiosSecure.get("/api/reports/transport/landed-cost", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching transport landed cost report:", error);
        throw error;
    }
};

export const getTransportsReport = async (params = {}) => {
    try {
        const response = await axiosSecure.get("/api/transport", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching raw transports report:", error);
        throw error;
    }
};



