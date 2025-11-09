// src/api/axiosClient.js
import axios from "axios";
import store from "../Store";
import { login, logout } from "../Store/slices/userSlice";

// 🟢 Base URL — switch automatically
const backendURL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api/"
    : "https://msfcheekodepanchayatcommittee.fun/api/";

// Axios instance
const instance = axios.create({
  baseURL: backendURL,
  withCredentials: true, // so cookies (refresh token) are sent
});

// Separate client (no interceptors) for refresh call
const refreshClient = axios.create({
  baseURL: backendURL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Request Interceptor
instance.interceptors.request.use(
  (config) => {
    const accessToken = store.getState().user.accessToken;
    if (accessToken) config.headers["Authorization"] = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // wait for refresh to complete
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            resolve(instance(originalRequest));
          },
          reject: (err) => reject(err),
        });
      });
    }

    isRefreshing = true;

    try {
      const res = await refreshClient.post("auth/refresh");
      const newToken = res.data.accessToken;

      store.dispatch(
        login({
          user: store.getState().user.user,
          accessToken: newToken,
        })
      );

      processQueue(null, newToken);
      originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
      return instance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      store.dispatch(logout());
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default instance;
