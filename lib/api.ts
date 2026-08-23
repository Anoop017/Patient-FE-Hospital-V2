import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Automatically unpack standard backend response envelope ({ success, statusCode, message, data, meta })
    if (response.data && response.data.success !== undefined) {
      const unpacked = {
        ...response,
        data: response.data.data !== undefined ? response.data.data : response.data,
        meta: response.data.meta,
        message: response.data.message,
      };
      return unpacked;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    const errData = error.response?.data;
    const errorMessage = Array.isArray(errData?.errors)
      ? errData.errors.join(", ")
      : errData?.message || error.message || "An unexpected error occurred";
    
    // Preserve response object if attached to custom error
    const enhancedError: any = new Error(errorMessage);
    enhancedError.response = error.response;
    return Promise.reject(enhancedError);
  }
);
