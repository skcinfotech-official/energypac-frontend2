import axiosSecure from "../api/axiosSecure";

export const getVendors = async ({
  url = null,
  search = "",
  isActive = null,
} = {}) => {
  let endpoint = "/api/vendors";

  // choose endpoint
  if (isActive === true) {
    endpoint = "/api/vendors/active";
  }

  // if pagination URL exists, use it directly
  const finalUrl = url || endpoint;

  const params = {};
  if (search) params.search = search;

  const res = await axiosSecure.get(finalUrl, {
    params: url ? {} : params, // ⚠️ IMPORTANT FIX
  });

  // normalize response always
  if (Array.isArray(res.data)) {
    return {
      results: res.data,
      count: res.data.length,
      next: null,
      previous: null,
    };
  }

  return {
    results: res.data.results || [],
    count: res.data.count || 0,
    next: res.data.next || null,
    previous: res.data.previous || null,
  };
};

export const getVendor = (id) =>
  axiosSecure.get(`/api/vendors/${id}`);

export const createVendor = (data) =>
  axiosSecure.post("/api/vendors", data);

export const updateVendor = (id, data) =>
  axiosSecure.put(`/api/vendors/${id}`, data);

export const deleteVendor = (id) =>
  axiosSecure.delete(`/api/vendors/${id}`);

export const getVendorPerformanceReport = (params) =>
  axiosSecure.get("/api/reports/vendors/performance", { params });

export const getQuotationComparisonReport = (requisitionId) =>
  axiosSecure.get("/api/reports/vendors/quotation-comparison", {
    params: { requisition: requisitionId }
  });