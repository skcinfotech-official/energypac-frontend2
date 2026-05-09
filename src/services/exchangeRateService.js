import axiosSecure from "../api/axiosSecure";

export const exchangeRateService = {
  getCurrentRate: async () => {
    const response = await axiosSecure.get("/api/exchange-rate");
    return response.data;
  },

  getAllRates: async (params) => {
    const response = await axiosSecure.get("/api/admin/exchange-rates", { params });
    return response.data;
  },

  createRate: async (data) => {
    const response = await axiosSecure.post("/api/admin/exchange-rates", data);
    return response.data;
  },

  getRate: async (id) => {
    const response = await axiosSecure.get(`/api/admin/exchange-rates/${id}`);
    return response.data;
  },

  updateRate: async (id, data) => {
    const response = await axiosSecure.put(`/api/admin/exchange-rates/${id}`, data);
    return response.data;
  },

  patchRate: async (id, data) => {
    const response = await axiosSecure.patch(`/api/admin/exchange-rates/${id}`, data);
    return response.data;
  },

  deleteRate: async (id) => {
    const response = await axiosSecure.delete(`/api/admin/exchange-rates/${id}`);
    return response.data;
  },
};
