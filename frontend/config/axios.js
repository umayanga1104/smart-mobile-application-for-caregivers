import axios from "axios";
import { auth } from "./firebase";


export const api = axios.create({
  baseURL: "https://api.dealappapi.cloud/api/v2",
  timeout: 35000,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken(true);

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;

});