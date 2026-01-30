import axiosSecure from "../api/axiosSecure";

export const getVendorAssignments = (page = 1, search = "", vendor = "") =>
  axiosSecure.get(
    `/api/vendor-assignments?page=${page}&search=${search}&vendor=${vendor}`
  );

export const createVendorAssignment = (data) =>
  axiosSecure.post("/api/vendor-assignments", data);

export const getVendorAssignmentsByRequisition = (requisitionId) =>
  axiosSecure.get(`/api/vendor-assignments?requisition=${requisitionId}`);

export const updateVendorAssignment = (id, data) =>
  axiosSecure.put(`/api/vendor-assignments/${id}`, data);
