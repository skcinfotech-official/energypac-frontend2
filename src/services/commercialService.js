import axiosSecure from "../api/axiosSecure";

/* =========================================================================
   COMMERCIAL INVOICE  (International PI export billing — no GST)
   ========================================================================= */

// Prefill CI form from an International PI
export const getCommercialInvoicePrefill = async (proformaInvoiceId) => {
    const res = await axiosSecure.get(`/api/commercial-invoices/prefill`, {
        params: { proforma_invoice: proformaInvoiceId },
    });
    return res.data;
};

export const getCommercialInvoices = async (params = {}) => {
    const res = await axiosSecure.get(`/api/commercial-invoices`, { params });
    return res.data;
};

export const getCommercialInvoiceById = async (id) => {
    const res = await axiosSecure.get(`/api/commercial-invoices/${id}`);
    return res.data;
};

export const createCommercialInvoice = async (payload) => {
    const res = await axiosSecure.post(`/api/commercial-invoices`, payload);
    return res.data;
};

export const updateCommercialInvoice = async (id, payload) => {
    const res = await axiosSecure.patch(`/api/commercial-invoices/${id}`, payload);
    return res.data;
};

export const downloadCommercialInvoiceExcel = async (id) => {
    const res = await axiosSecure.get(`/api/commercial-invoices/${id}/excel`, {
        responseType: "blob",
    });
    return res.data;
};

/* =========================================================================
   PACKING LIST  (generated from a Commercial Invoice)
   ========================================================================= */

export const getPackingListPrefill = async (commercialInvoiceId) => {
    const res = await axiosSecure.get(`/api/packing-lists/prefill`, {
        params: { commercial_invoice: commercialInvoiceId },
    });
    return res.data;
};

export const getPackingLists = async (params = {}) => {
    const res = await axiosSecure.get(`/api/packing-lists`, { params });
    return res.data;
};

export const getPackingListById = async (id) => {
    const res = await axiosSecure.get(`/api/packing-lists/${id}`);
    return res.data;
};

export const createPackingList = async (payload) => {
    const res = await axiosSecure.post(`/api/packing-lists`, payload);
    return res.data;
};

export const updatePackingList = async (id, payload) => {
    const res = await axiosSecure.patch(`/api/packing-lists/${id}`, payload);
    return res.data;
};

export const downloadPackingListExcel = async (id) => {
    const res = await axiosSecure.get(`/api/packing-lists/${id}/excel`, {
        responseType: "blob",
    });
    return res.data;
};
