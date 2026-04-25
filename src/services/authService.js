import axiosSecure from "../api/axiosSecure";

const extractError = (error, defaultMsg) => {
  const data = error.response?.data;
  if (!data) return error.message || defaultMsg;

  // 1. If it's a simple string detail/message
  if (data.detail && typeof data.detail === 'string') return data.detail;
  if (data.message && typeof data.message === 'string') return data.message;

  // 2. If it's a validation error object like {"email": ["error msg"]}
  if (typeof data === 'object') {
    const messages = [];
    for (const key in data) {
      if (Array.isArray(data[key])) {
        messages.push(`${data[key].join(", ")}`);
      } else if (typeof data[key] === 'string') {
        messages.push(data[key]);
      }
    }
    if (messages.length > 0) return messages.join(" ");
  }

  return defaultMsg;
};

export const forgotPassword = async (email) => {
  try {
    const response = await axiosSecure.post("/api/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    throw extractError(error, "Failed to send OTP");
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    const response = await axiosSecure.post("/api/auth/verify-otp", { email, otp });
    return response.data;
  } catch (error) {
    throw extractError(error, "Invalid OTP");
  }
};

export const resetPassword = async (data) => {
  try {
    const response = await axiosSecure.post("/api/auth/reset-password", data);
    return response.data;
  } catch (error) {
    throw extractError(error, "Failed to reset password");
  }
};
