import axiosSecure from "../api/axiosSecure";

export const forgotPassword = async (email) => {
  try {
    const response = await axiosSecure.post("/api/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || error.response?.data?.message || "Failed to send OTP";
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    const response = await axiosSecure.post("/api/auth/verify-otp", { email, otp });
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || error.response?.data?.message || "Invalid OTP";
  }
};

export const resetPassword = async (data) => {
  try {
    const response = await axiosSecure.post("/api/auth/reset-password", data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || error.response?.data?.message || "Failed to reset password";
  }
};
