import axios from "axios";

const API = axios.create({
  baseURL: "http://YOUR_BACKEND_IP:5000/api",
});

export default API;
