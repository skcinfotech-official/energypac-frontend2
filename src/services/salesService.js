import axiosSecure from "../api/axiosSecure";

// API Base URL for Sales Service (can be overridden if needed, or use full URL)


export const getClientQueries = async (page = 1, searchQuery = "", status = "") => {
    try {
        const params = {
            page,
            search: searchQuery,
            ...(status && { status }),
        };
        const response = await axiosSecure.get(`/api/client-queries`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching client queries:", error);
        throw error;
    }
};

export const createClientQuery = async (formData) => {
    try {
        const response = await axiosSecure.post(`/api/client-queries`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error creating client query:", error);
        throw error;
    }
};

export const getClientQueryById = async (id) => {
    try {
        const response = await axiosSecure.get(`/api/client-queries/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching client query ${id}:`, error);
        throw error;
    }
};

export const getClientQuotationById = async (id) => {
    try {
        const response = await axiosSecure.get(`/api/sales/quotations/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching client quotation ${id}:`, error);
        throw error;
    }
};

export const getClientQuotations = async (page = 1, searchQuery = "", status = "") => {
    try {
        const params = {
            page,
            search: searchQuery,
            ...(status && { status }),
        };
        const response = await axiosSecure.get(`/api/sales/quotations`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching client quotations:", error);
        throw error;
    }
};

export const createClientQuotation = async (payload) => {
    try {
        const response = await axiosSecure.post(
            "/api/sales/quotations",
            payload
        );
        return response.data;
    } catch (error) {
        console.error("Error creating client quotation:", error);
        throw error;
    }
};

export const updateClientQuotationGst = async (id, gstData) => {
    try {
        const response = await axiosSecure.post(
            `/api/sales/quotations/${id}/update_gst`,
            gstData
        );
        return response.data;
    } catch (error) {
        console.error("Error updating quotation GST:", error);
        throw error;
    }
};

export const getClientQuotationSummary = async (id) => {
    try {
        const response = await axiosSecure.get(`/api/sales/quotations/${id}/summary`);
        return response.data;
    } catch (error) {
        console.error("Error fetching quotation summary:", error);
        throw error;
    }
};

export const updateClientQuotationStatus = async (id, status) => {
    try {
        const response = await axiosSecure.post(
            `/api/sales/quotations/${id}/update_status`,
            { status }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating quotation status:", error);
        throw error;
    }
};

export const getSalesAnalytics = async (params = {}) => {
    try {
        // params: { start_date, end_date, group_by }
        const response = await axiosSecure.get(`/api/reports/sales/analytics`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching sales analytics:", error);
        throw error;
    }
};

export const getSalesPerformanceReport = async (params = {}) => {
    try {
        // params: { start_date, end_date }
        const response = await axiosSecure.get(`/api/reports/sales/performance`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching sales performance report:", error);
        throw error;
    }
};

export const getProductSalesAnalysis = async (params = {}) => {
    try {
        // params: { start_date, end_date }
        const response = await axiosSecure.get(`/api/reports/sales/products`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching product sales analysis:", error);
        throw error;
    }
};

export const getClientQueryReport = async (params = {}) => {
    try {
        const response = await axiosSecure.get(`/api/reports/sales/client-queries`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching client query report:", error);
        throw error;
    }
};

export const getClientQueryDetailReport = async (id) => {
    try {
        const response = await axiosSecure.get(`/api/reports/sales/client-queries/${id}/detailed`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching client query detail report ${id}:`, error);
        throw error;
    }
};

export const getClientQuotationReport = async (params = {}) => {
    try {
        const response = await axiosSecure.get('/api/reports/sales/quotations', { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching client quotation report:", error);
        throw error;
    }
};

export const getClientQueryPdf = async (id) => {
    try {
        const response = await axiosSecure.get(`/api/sales/client-queries/${id}/download_pdf`, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching client query PDF ${id}:`, error);
        throw error;
    }
};

export const getClientQuotationItemsReport = async (params = {}) => {
    try {
        const response = await axiosSecure.get('/api/reports/sales/quotation-items', { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching client quotation items report:", error);
        throw error;
    }
};
