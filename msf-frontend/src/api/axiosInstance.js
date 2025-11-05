// import axios from "axios";
// import store from "../Store";
// import { login, logout } from "../Store/slices/userSlice";


// const backendURL =
//   window.location.hostname === "localhost"
//     ? "http://localhost:5000/api/"
//     : "http://192.168.1.8:5000/api/"; 

// const instance = axios.create({
//   baseURL: backendURL,
//   withCredentials: true,
// });

// // Request interceptor
// instance.interceptors.request.use(
//   (config) => {
//     const accessToken = store.getState().user.accessToken;
//     if (accessToken) {
//       config.headers["Authorization"] = `Bearer ${accessToken}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response interceptor (handle refresh token)
// instance.interceptors.response.use(
//   (res) => res,
//   async (err) => {
//     const originalRequest = err.config;

//     if (err.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       try {
//         const res = await instance.post(`auth/refresh`, {},{ withCredentials: true });

//         const newAccessToken = res.data.accessToken;

//         store.dispatch(
//           login({
//             user: store.getState().user.user,
//             accessToken: newAccessToken,
//           })
//         );

//         originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
//         return instance(originalRequest);
//       } catch (refreshError) {
//         store.dispatch(logout());
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(err);
//   }
// );

// export default instance;


import axios from "axios";
import store from "../Store";
import { login, logout } from "../Store/slices/userSlice";

const backendURL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api/"
    : "http://192.168.1.7:5000/api/";

const instance = axios.create({
  baseURL: backendURL,
  withCredentials: true,
});

// ✅ Request interceptor
instance.interceptors.request.use(
  (config) => {
    const accessToken = store.getState().user.accessToken;
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor
instance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Token expired or unauthorized
    if (
      err.response?.status === 401 &&
      (err.response.data?.message === "TokenExpired" || !originalRequest._retry)
    ) {
      originalRequest._retry = true;

      try {
        const res = await instance.post("auth/refresh");

        const newAccessToken = res.data.accessToken;

        store.dispatch(
          login({
            user: store.getState().user.user,
            accessToken: newAccessToken,
          })
        );

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  }
);

export default instance;
