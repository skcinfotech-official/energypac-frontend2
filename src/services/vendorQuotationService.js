import axiosSecure from "../api/axiosSecure";

export const getVendorAssignments = async (url = null) => {
  const endpoint = "/api/vendor-assignments";
  const res = await axiosSecure.get(url || endpoint);

  return {
    results: res.data.results || [],
    count: res.data.count || 0,
    next: res.data.next || null,
    previous: res.data.previous || null,
  };
};

export const getRequisitionFlow = async (id) => {
  const res = await axiosSecure.get(`/api/requisitions/${id}/flow`);
  return res.data;
};

export const getQuotationItems = async (requisitionId, vendorId) => {
  const res = await axiosSecure.get(
    "/api/vendor-quotations/by_requisition_vendor",
    {
      params: {
        requisition: requisitionId,
        vendor: vendorId,
      },
    }
  );
  return res.data;
};

export const createQuotation = async (data) => {
  const res = await axiosSecure.post("/api/vendor-quotations", data);
  return res.data;
};

export const updateQuotation = async (id, data) => {
  const res = await axiosSecure.patch(`/api/vendor-quotations/${id}`, data);
  return res.data;
};

export const getVendorQuotationsList = async (url = null, requisitionId = null, vendorId = null) => {
  const params = {};
  // Only add params if URL is not provided (filters apply to base endpoint)
  if (!url) {
    if (requisitionId) params.requisition = requisitionId;
    if (vendorId) params.vendor = vendorId;
  }

  const endpoint = "/api/vendor-quotations";
  const res = await axiosSecure.get(url || endpoint, { params });
  return {
    results: res.data.results || [],
    count: res.data.count || 0,
    next: res.data.next || null,
    previous: res.data.previous || null,
  };
};

export const getVendorQuotationById = async (id) => {
  const res = await axiosSecure.get(`/api/vendor-quotations/${id}`);
  return res.data;
};

export const getQuotationComparison = async (requisitionId) => {
  const res = await axiosSecure.get(`/api/requisitions/${requisitionId}/comparison`);
  return res.data;
};
