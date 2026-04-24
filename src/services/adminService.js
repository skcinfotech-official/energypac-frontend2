import axiosSecure from "../api/axiosSecure";

export const adminService = {
  getUsers: async (params) => {
    const response = await axiosSecure.get("/api/admin/users", { params });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await axiosSecure.post("/api/admin/users", userData);
    return response.data;
  },

  getUser: async (userId) => {
    const response = await axiosSecure.get(`/api/admin/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await axiosSecure.put(`/api/admin/users/${userId}`, userData);
    return response.data;
  },

  patchUser: async (userId, userData) => {
    const response = await axiosSecure.patch(`/api/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await axiosSecure.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  resetPassword: async (userId, passwordData) => {
    const response = await axiosSecure.post(`/api/admin/users/${userId}/reset_password`, passwordData);
    return response.data;
  },

  toggleUserStatus: async (userId) => {
    const response = await axiosSecure.patch(`/api/admin/users/${userId}/toggle_active`);
    return response.data;
  },

  getUserStats: async () => {
    const response = await axiosSecure.get("/api/admin/users/stats");
    return response.data;
  },
};
