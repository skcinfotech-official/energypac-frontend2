import axiosSecure from "../api/axiosSecure";

export const fetchRequisitions = (page = 1, search = "", is_assigned = "", requisition_date = "") => {
  let url = `/api/requisitions?page=${page}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (is_assigned !== "" && is_assigned !== null) url += `&is_assigned=${is_assigned}`;
  if (requisition_date) url += `&requisition_date=${requisition_date}`;
  return axiosSecure.get(url);
};

export const createRequisition = (data) =>
  axiosSecure.post("/api/requisitions", data);

export const updateRequisition = (id, data) =>
  axiosSecure.put(`/api/requisitions/${id}`, data);

export const deleteRequisition = (id) =>
  axiosSecure.delete(`/api/requisitions/${id}`);

export const getRequisition = (id) =>
  axiosSecure.get(`/api/requisitions/${id}`);

export const getRequisitionAssignments = (id) =>
  axiosSecure.get(`/api/requisitions/${id}/assignments`);

export const getRequisitionItems = (id) =>
  axiosSecure.get(`/api/requisitions/${id}/items`);

// Fetch detailed report for a specific requisition
export const getRequisitionDetailReport = (id) =>
  axiosSecure.get(`/api/reports/requisitions/${id}/detailed`);

export const getRequisitionReport = (params) => {
  // params can be { start_date, end_date } OR { status: 'pending' }
  return axiosSecure.get(`/api/reports/requisitions`, { params });
};
