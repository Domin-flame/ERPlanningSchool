import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "/api";

export const TOKEN_KEY = "cw_token";
export const REFRESH_TOKEN_KEY = "cw_refresh_token";
export const USER_KEY = "cw_user";

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Injecte le token JWT si présent
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Promesse de refresh partagée : le backend fait tourner les refresh tokens
// (usage unique). Deux refresh simultanés (timer d'AuthContext + intercepteur
// 401, ou plusieurs requêtes en échec) invalideraient donc la session. Tous
// les appelants attendent ici la même requête /auth/refresh.
let refreshPromise = null;

async function doRefresh() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    throw new Error("Aucun refresh token disponible");
  }

  try {
    const res = await http.post(
      "/auth/refresh",
      { refresh_token: refreshToken },
      { _skipAuthRefresh: true }
    );
    const { access_token: accessToken, refresh_token: newRefresh } = res.data || {};
    if (!accessToken) throw new Error("Réponse de refresh invalide");

    localStorage.setItem(TOKEN_KEY, accessToken);
    if (newRefresh) localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
    window.dispatchEvent(new CustomEvent("cw:token-refreshed", { detail: { accessToken } }));
    return accessToken;
  } catch (error) {
    // Un autre onglet a pu faire tourner le refresh token pendant notre
    // requête : si le stockage contient déjà une nouvelle paire, on l'adopte.
    const currentRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    const currentAccess = localStorage.getItem(TOKEN_KEY);
    if (currentRefresh && currentRefresh !== refreshToken && currentAccess) {
      return currentAccess;
    }
    throw error;
  }
}

/**
 * Rafraîchit le token d'accès (une seule requête à la fois).
 * Résout avec le nouveau token d'accès ; rejette si la session est expirée.
 */
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function isAuthRoute(url = "") {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh")
  );
}

// Gestion des erreurs : retry automatique avec refresh token sur 401
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest._skipAuthRefresh ||
      isAuthRoute(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await refreshAccessToken();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return http(originalRequest);
    } catch (refreshError) {
      clearStoredSession();
      window.dispatchEvent(new CustomEvent("cw:unauthorized"));
      return Promise.reject(refreshError?.response ? refreshError : error);
    }
  }
);

export const api = {
  get: (url, config) => http.get(url, config),
  post: (url, data, config) => http.post(url, data, config),
  put: (url, data, config) => http.put(url, data, config),
  patch: (url, data, config) => http.patch(url, data, config),
  delete: (url, config) => http.delete(url, config),
};

export { http };
export default api;
