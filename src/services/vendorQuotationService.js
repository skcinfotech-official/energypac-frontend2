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
  if (url) {
    const res = await axiosSecure.get(url);
    return {
      results: res.data.results || [],
      count: res.data.count || 0,
      next: res.data.next || null,
      previous: res.data.previous || null,
    };
  }

  let endpoint = "/api/vendor-quotations";
  const params = {};

  if (requisitionId && vendorId) {
    endpoint = "/api/vendor-quotations/by_requisition_vendor";
    params.requisition = requisitionId;
    params.vendor = vendorId;
  } else if (requisitionId) {
    endpoint = "/api/vendor-quotations/by_requisition";
    params.requisition = requisitionId;
  } else if (vendorId) {
    endpoint = "/api/vendor-quotations/by_vendor";
    params.vendor = vendorId;
  }

  const res = await axiosSecure.get(endpoint, { params });
  
  // Supporting paginated results as well as raw lists returned by custom detail actions
  const results = res.data.results || (Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []));
  const count = res.data.count !== undefined ? res.data.count : results.length;
  const next = res.data.next || null;
  const previous = res.data.previous || null;

  return {
    results,
    count,
    next,
    previous,
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
