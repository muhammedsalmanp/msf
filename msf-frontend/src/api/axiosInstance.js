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

    // 1. Not 401 or already retried? Reject immediately.
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // 2. Refresh already in progress? Queue the request.
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            // 🟢 FIX 1: Clone config and apply new token for retry
            const newConfig = { 
              ...originalRequest, 
              headers: { 
                ...originalRequest.headers, 
                "Authorization": `Bearer ${token}` 
              } 
            };
            resolve(instance(newConfig));
          },
          reject: (err) => reject(err),
        });
      });
    }

    // 3. Start the token refresh process.
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
      
      // 🟢 FIX 2: Clone config and apply new token for immediate retry
      const retryConfig = { 
        ...originalRequest, 
        headers: { 
          ...originalRequest.headers, 
          "Authorization": `Bearer ${newToken}` 
        } 
      };
      return instance(retryConfig);

    } catch (refreshError) {
      // 4. Refresh failed? Clear queue and force logout.
      processQueue(refreshError, null);
      store.dispatch(logout());
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default instance;


