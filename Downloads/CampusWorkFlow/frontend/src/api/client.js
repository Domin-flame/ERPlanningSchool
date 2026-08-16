import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:3000/api";

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Injecte le token JWT si présent
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("cw_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Flag pour éviter les boucles infinies lors du refresh
let isRefreshing = false;
let pendingRequests = [];

function processPendingRequests(error, token = null) {
  pendingRequests.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  pendingRequests = [];
}

// Gestion des erreurs : retry automatique avec refresh token sur 401
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Ne pas retenter les appels auth eux-mêmes
    const isAuthRoute =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Mettre la requête en attente le temps que le refresh se termine
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return http(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("cw_refresh_token");
      if (!refreshToken) {
        isRefreshing = false;
        processPendingRequests(error);
        localStorage.removeItem("cw_token");
        localStorage.removeItem("cw_user");
        localStorage.removeItem("cw_refresh_token");
        window.dispatchEvent(new CustomEvent("cw:unauthorized"));
        return Promise.reject(error);
      }

      try {
        const res = await http.post("/auth/refresh", { refresh_token: refreshToken });
        const { access_token, refresh_token: newRefresh } = res.data;

        localStorage.setItem("cw_token", access_token);
        if (newRefresh) localStorage.setItem("cw_refresh_token", newRefresh);

        http.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processPendingRequests(null, access_token);
        isRefreshing = false;

        return http(originalRequest);
      } catch (refreshError) {
        processPendingRequests(refreshError);
        isRefreshing = false;

        localStorage.removeItem("cw_token");
        localStorage.removeItem("cw_user");
        localStorage.removeItem("cw_refresh_token");
        window.dispatchEvent(new CustomEvent("cw:unauthorized"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  get: (url, config) => http.get(url, config),
  post: (url, data, config) => http.post(url, data, config),
  put: (url, data, config) => http.put(url, data, config),
  patch: (url, data, config) => http.patch(url, data, config),
  delete: (url, config) => http.delete(url, config),
};

export default api;
