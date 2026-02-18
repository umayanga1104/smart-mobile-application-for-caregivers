import { auth } from "@/src/config/firebase";
import axios from "axios";

const api = axios.create({
  baseURL: "http://10.14.229.205:5000/api",
});

api.interceptors.request.use(async (config) => {

  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "Something went wrong. Please try again.";

    if (error.response) {
      // Backend error (Express)
      message = error.response.data?.message || "Server Error";
      console.error("API Error Response:", error.response.data);
    } else if (error.request) {
      // Network error (phone offline / backend down)
      message = "Network error. Check your internet or server.";
      console.error("Network Error:", error.request);
    } else {
      // Unknown error
      message = error.message;
      console.error("Unexpected Error:", error.message);
    }

    return Promise.reject(new Error(message));
  }
);

export default api;