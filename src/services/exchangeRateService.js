import axiosSecure from "../api/axiosSecure";

export const exchangeRateService = {
  getCurrentRate: async () => {
    const response = await axiosSecure.get("/api/exchange-rate");
    return response.data;
  },
};
