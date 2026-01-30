import axiosSecure from "../api/axiosSecure";

export const getDashboardStats = async () => {
    const res = await axiosSecure.get("/api/dashboard/stats");
    return res.data;
};
