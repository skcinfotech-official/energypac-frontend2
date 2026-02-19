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

export const getWorkOrderByQuotation = async (quotationId) => {
    try {
        const response = await axiosSecure.get(`/api/work-orders/by_quotation?quotation=${quotationId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching work order by quotation:", error);
        throw error;
    }
};

export const createWorkOrder = async (payload) => {
    try {
        const response = await axiosSecure.post("/api/work-orders", payload);
        return response.data;
    } catch (error) {
        console.error("Error creating work order:", error);
        throw error;
    }
};

export const getWorkOrders = async (page = 1, searchQuery = "", status = "") => {
    try {
        let url = "/api/work-orders";
        const params = { page, search: searchQuery };

        if (status === "ACTIVE") {
            url = "/api/work-orders/active";
        } else if (status) {
            params.status = status;
        }

        const response = await axiosSecure.get(url, { params });

        // Handle case where specific endpoints return a flat array instead of paginated result
        if (Array.isArray(response.data)) {
            return {
                results: response.data,
                count: response.data.length,
                next: null,
                previous: null
            };
        }

        return response.data;
    } catch (error) {
        console.error("Error fetching work orders:", error);
        throw error;
    }
};

export const getActiveWorkOrders = async () => {
    try {
        const response = await axiosSecure.get("/api/work-orders/active");
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return response.data.results || [];
    } catch (error) {
        console.error("Error fetching active work orders:", error);
        throw error;
    }
};

export const getAllWorkOrders = async () => {
    try {
        const response = await axiosSecure.get("/api/work-orders", { params: { page_size: 1000 } });
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return response.data.results || [];
    } catch (error) {
        console.error("Error fetching all work orders:", error);
        throw error;
    }
};

export const getWorkOrderById = async (id) => {
    try {
        const response = await axiosSecure.get(`/api/work-orders/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching work order by ID:", error);
        throw error;
    }
};

export const getWorkOrderReport = async (params = {}) => {
    try {
        const response = await axiosSecure.get("/api/reports/work-orders", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching work order report:", error);
        throw error;
    }
};

export const getWorkOrderDeliveryAnalysis = async (params = {}) => {
    try {
        const response = await axiosSecure.get("/api/reports/work-orders/delivery-analysis", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching work order delivery analysis:", error);
        throw error;
    }
};

export const getWorkOrderDetailReport = async (id) => {
    try {
        const response = await axiosSecure.get(`/api/reports/work-orders/${id}/detailed`);
        return response.data;
    } catch (error) {
        console.error("Error fetching work order detail report:", error);
        throw error;
    }
};

export const validateBillStock = async (payload) => {
    try {
        const response = await axiosSecure.post("/api/bills/validate_stock", payload);
        return response.data;
    } catch (error) {
        console.error("Error validating bill stock:", error);
        throw error;
    }
};

export const createBill = async (payload) => {
    try {
        const response = await axiosSecure.post("/api/bills", payload);
        return response.data;
    } catch (error) {
        console.error("Error creating bill:", error);
        throw error;
    }
};

export const getBillById = async (id) => {
    try {
        const response = await axiosSecure.get(`/api/bills/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching bill by ID:", error);
        throw error;
    }
};

export const getBills = async (page = 1, searchQuery = "", workOrderId = "") => {
    try {
        const params = {
            page,
            search: searchQuery
        };
        if (workOrderId) {
            params.work_order = workOrderId;
        }
        const response = await axiosSecure.get("/api/bills", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching bills:", error);
        throw error;
    }
};

export const getBillsByWorkOrder = async (workOrderId, page = 1) => {
    try {
        const params = {
            work_order: workOrderId,
            page
        };
        const response = await axiosSecure.get("/api/bills/by_work_order", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching bills by work order:", error);
        throw error;
    }
};

export const getBillReport = async (params = {}) => {
    try {
        const response = await axiosSecure.get("/api/reports/billing/bills", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching bill report:", error);
        throw error;
    }
};

export const getOutstandingReport = async (params = {}) => {
    try {
        const response = await axiosSecure.get("/api/reports/billing/outstanding", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching outstanding report:", error);
        throw error;
    }
};

export const getBillDetailedReport = async (billId) => {
    try {
        const response = await axiosSecure.get(`/api/reports/billing/bills/${billId}/detailed`);
        return response.data;
    } catch (error) {
        console.error("Error fetching bill detailed report:", error);
        throw error;
    }
};

export const getBillingDashboardStats = async () => {
    try {
        const response = await axiosSecure.get("/api/dashboard/billing/stats");
        return response.data;
    } catch (error) {
        console.error("Error fetching billing dashboard stats:", error);
        throw error;
    }
};

export const getBillingAnalytics = async (params) => {
    try {
        const response = await axiosSecure.get("/api/reports/billing/analytics", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching billing analytics:", error);
        throw error;
    }
};

export const updateWorkOrderAdvance = async (id, advanceAmount) => {
    try {
        const response = await axiosSecure.post(
            `/api/work-orders/${id}/update_advance`,
            { advance_amount: advanceAmount }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating work order advance:", error);
        throw error;
    }
};

export const markBillAsPaid = async (id, amountPaid) => {
    try {
        const response = await axiosSecure.post(
            `/api/bills/${id}/mark_paid`,
            { amount_paid: amountPaid }
        );
        return response.data;
    } catch (error) {
        console.error("Error marking bill as paid:", error);
        throw error;
    }
};

export const cancelBill = async (id) => {
    try {
        const response = await axiosSecure.post(`/api/bills/${id}/cancel`);
        return response.data;
    } catch (error) {
        console.error("Error canceling bill:", error);
        throw error;
    }
};
