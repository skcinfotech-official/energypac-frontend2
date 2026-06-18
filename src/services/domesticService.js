import axiosSecure from "../api/axiosSecure";

/* =========================================================================
   DOMESTIC TAX INVOICE  (product "TAX INVOICE" / "SERVICE TAX INVOICE", GST)
   ========================================================================= */

export const getTaxInvoicePrefill = async (proformaInvoiceId, kind = "PRODUCT") => {
    const res = await axiosSecure.get(`/api/tax-invoices/prefill`, {
        params: { proforma_invoice: proformaInvoiceId, kind },
    });
    return res.data;
};

export const getTaxInvoiceBlank = async (kind = "SERVICE") => {
    const res = await axiosSecure.get(`/api/tax-invoices/blank`, { params: { kind } });
    return res.data;
};

export const getTaxInvoices = async (params = {}) => {
    const res = await axiosSecure.get(`/api/tax-invoices`, { params });
    return res.data;
};

export const getTaxInvoiceById = async (id) => {
    const res = await axiosSecure.get(`/api/tax-invoices/${id}`);
    return res.data;
};

export const createTaxInvoice = async (payload) => {
    const res = await axiosSecure.post(`/api/tax-invoices`, payload);
    return res.data;
};

export const updateTaxInvoice = async (id, payload) => {
    const res = await axiosSecure.patch(`/api/tax-invoices/${id}`, payload);
    return res.data;
};

export const downloadTaxInvoiceExcel = async (id) => {
    const res = await axiosSecure.get(`/api/tax-invoices/${id}/excel`, { responseType: "blob" });
    return res.data;
};

/* ── Service Invoice collections (Finance) ──────────────────────────────── */
export const getServiceInvoiceSummary = async (search = "") => {
    const params = { kind: "SERVICE" };
    if (search) params.search = search;
    const res = await axiosSecure.get(`/api/tax-invoices/summary`, { params });
    return res.data;
};

export const recordServiceInvoicePayment = async (id, payload) => {
    const res = await axiosSecure.post(`/api/tax-invoices/${id}/record_payment`, payload);
    return res.data;
};

export const getServiceInvoicePaymentHistory = async (id) => {
    const res = await axiosSecure.get(`/api/tax-invoices/${id}/payment_history`);
    return res.data;
};
