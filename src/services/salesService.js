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
        const response = await axiosSecure.get(`/api/quotations/${id}`);
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
        const response = await axiosSecure.get(`/api/quotations`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching client quotations:", error);
        throw error;
    }
};

export const createClientQuotation = async (payload) => {
    try {
        const response = await axiosSecure.post(
            "/api/quotations",
            payload
        );
        return response.data;
    } catch (error) {
        console.error("Error creating client quotation:", error);
        throw error;
    }
};

export const updateClientQuotation = async (id, payload) => {
    try {
        const response = await axiosSecure.patch(
            `/api/quotations/${id}`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating client quotation ${id}:`, error);
        throw error;
    }
};

export const updateClientQuotationGst = async (id, gstData) => {
    try {
        const response = await axiosSecure.post(
            `/api/quotations/${id}/update_gst`,
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
        const response = await axiosSecure.get(`/api/quotations/${id}/summary`);
        return response.data;
    } catch (error) {
        console.error("Error fetching quotation summary:", error);
        throw error;
    }
};

export const updateClientQuotationStatus = async (id, status) => {
    try {
        const response = await axiosSecure.post(
            `/api/quotations/${id}/update_status`,
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

export const createBill = async (payload) => {
    try {
        const response = await axiosSecure.post("/api/pi-bills", payload);
        return response.data;
    } catch (error) {
        console.error("Error creating bill:", error);
        throw error;
    }
};

export const getBillById = async (id) => {
    try {
        const response = await axiosSecure.get(`/api/pi-bills/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching bill by ID:", error);
        throw error;
    }
};

export const getBills = async (page = 1, searchQuery = "", piId = "", billType = "", source = "") => {
    try {
        const params = {
            page,
            search: searchQuery
        };
        if (piId) params.proforma_invoice = piId;
        if (billType) params.bill_type = billType;
        if (source) params.proforma_invoice__source = source;
        const response = await axiosSecure.get("/api/pi-bills", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching bills:", error);
        throw error;
    }
};

export const getBillsSummary = async (searchQuery = "", billType = "", source = "") => {
    try {
        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (billType) params.bill_type = billType;
        if (source) params.proforma_invoice__source = source;
        const response = await axiosSecure.get("/api/pi-bills/summary", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching bills summary:", error);
        throw error;
    }
};

export const getBillsByPI = async (piId, page = 1) => {
    try {
        const params = {
            proforma_invoice: piId,
            page
        };
        const response = await axiosSecure.get("/api/pi-bills/by_pi", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching bills by PI:", error);
        throw error;
    }
};

// Remaining (unbilled) quantity per PI line — drives quantity-level partial billing.
export const getBillableItems = async (piId) => {
    try {
        const response = await axiosSecure.get("/api/pi-bills/billable_items", {
            params: { proforma_invoice: piId },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching billable items:", error);
        throw error;
    }
};

export const getBillReport = async (params = {}) => {
    try {
        const response = await axiosSecure.get("/api/pi-bills", { params });
        return {
            bills: response.data.results || [],
            summary: {
                total_bills: response.data.count || 0,
                total_amount: (response.data.results || []).reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0),
            },
            date_range: { start_date: params.start_date, end_date: params.end_date },
        };
    } catch (error) {
        console.error("Error fetching bill report:", error);
        throw error;
    }
};

export const getOutstandingReport = async (params = {}) => {
    try {
        const response = await axiosSecure.get("/api/pi-bills/pending_payment", { params });
        return {
            bills: response.data.bills || [],
            summary: {
                total_outstanding_bills: response.data.total_pending_bills || 0,
                total_outstanding_amount: response.data.total_balance || 0,
            },
        };
    } catch (error) {
        console.error("Error fetching outstanding report:", error);
        throw error;
    }
};

export const getBillPaymentHistory = async (id) => {
    try {
        const response = await axiosSecure.get(`/api/pi-bills/${id}/payment_history`);
        return response.data;
    } catch (error) {
        console.error("Error fetching bill payment history:", error);
        throw error;
    }
};




export const markBillAsPaid = async (id, payload) => {
    try {
        const response = await axiosSecure.post(
            `/api/pi-bills/${id}/mark_paid`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error("Error marking bill as paid:", error);
        throw error;
    }
};

export const cancelBill = async (id, payload = {}) => {
    try {
        const response = await axiosSecure.post(`/api/pi-bills/${id}/cancel`, payload);
        return response.data;
    } catch (error) {
        console.error("Error canceling bill:", error);
        throw error;
    }
};

// Proforma Invoices API
export const getProformaInvoices = async (page = 1, searchQuery = "", tradeType = "") => {
    try {
        const params = {
            page,
            search: searchQuery,
        };
        if (tradeType) params.trade_type = tradeType;
        const response = await axiosSecure.get(`/api/proforma-invoices`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching proforma invoices:", error);
        throw error;
    }
};

// Procurement visibility — which PI items still need to be purchased
export const getPendingPurchasePIs = async (source = "DIRECT") => {
    const res = await axiosSecure.get(`/api/proforma-invoices/pending_purchase`, { params: { source } });
    return res.data;
};

export const getPIProcurement = async (piId) => {
    const res = await axiosSecure.get(`/api/proforma-invoices/${piId}/procurement`);
    return res.data;
};

export const getProformaInvoiceById = async (id) => {
    try {
        const response = await axiosSecure.get(`/api/proforma-invoices/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching proforma invoice ${id}:`, error);
        throw error;
    }
};

export const createProformaInvoice = async (payload) => {
    try {
        const response = await axiosSecure.post(`/api/proforma-invoices`, payload);
        return response.data;
    } catch (error) {
        console.error("Error creating proforma invoice:", error);
        throw error;
    }
};

export const getRequisitionItemsForPi = async (requisitionId) => {
    try {
        const response = await axiosSecure.get(`/api/proforma-invoices/requisition_items`, {
            params: { requisition: requisitionId }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching requisition items for PI:", error);
        throw error;
    }
};

export const getStockItemsForPi = async () => {
    try {
        const response = await axiosSecure.get(`/api/proforma-invoices/stock_items`);
        return response.data;
    } catch (error) {
        console.error("Error fetching stock items for PI:", error);
        throw error;
    }
};

export const lockProformaInvoice = async (id) => {
    try {
        const response = await axiosSecure.post(`/api/proforma-invoices/${id}/lock`);
        return response.data;
    } catch (error) {
        console.error(`Error acquiring lock on proforma invoice ${id}:`, error);
        throw error;
    }
};

export const unlockProformaInvoice = async (id) => {
    try {
        const response = await axiosSecure.post(`/api/proforma-invoices/${id}/unlock`);
        return response.data;
    } catch (error) {
        console.error(`Error releasing lock on proforma invoice ${id}:`, error);
        throw error;
    }
};

export const updateProformaInvoice = async (id, payload) => {
    try {
        const response = await axiosSecure.patch(`/api/proforma-invoices/${id}`, payload);
        return response.data;
    } catch (error) {
        console.error(`Error updating proforma invoice ${id}:`, error);
        throw error;
    }
};

export const sendProformaInvoice = async (id) => {
    try {
        const response = await axiosSecure.post(`/api/proforma-invoices/${id}/send`);
        return response.data;
    } catch (error) {
        console.error(`Error sending proforma invoice ${id}:`, error);
        throw error;
    }
};

export const acceptProformaInvoice = async (id) => {
    try {
        const response = await axiosSecure.post(`/api/proforma-invoices/${id}/accept`);
        return response.data;
    } catch (error) {
        console.error(`Error accepting proforma invoice ${id}:`, error);
        throw error;
    }
};

export const cancelProformaInvoice = async (id, payload) => {
    try {
        const response = await axiosSecure.post(`/api/proforma-invoices/${id}/cancel`, payload);
        return response.data;
    } catch (error) {
        console.error(`Error canceling proforma invoice ${id}:`, error);
        throw error;
    }
};

// Advance Payments API
export const getAdvancePayments = async (params = {}) => {
    try {
        const response = await axiosSecure.get("/api/finance/advance-payments", { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching advance payments:", error);
        throw error;
    }
};

export const createAdvancePayment = async (payload) => {
    try {
        const response = await axiosSecure.post("/api/finance/advance-payments", payload);
        return response.data;
    } catch (error) {
        console.error("Error creating advance payment:", error);
        throw error;
    }
};

export const adjustAdvancePayment = async (id, payload) => {
    try {
        const response = await axiosSecure.post(`/api/finance/advance-payments/${id}/adjust`, payload);
        return response.data;
    } catch (error) {
        console.error("Error adjusting advance payment:", error);
        throw error;
    }
};



