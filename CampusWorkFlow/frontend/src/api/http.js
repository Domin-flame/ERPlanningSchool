import axios from "axios";
import { tokenStorage } from "./tokenStorage.js";
import { toApiError } from "./errors.js";

/**
 * URL de base de la gateway. En Docker, `VITE_API_URL=/api` et nginx
 * proxifie `/api` vers la gateway ; en dev, Vite fait de même.
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "/api"
).replace(/\/+$/, "");

export const UNAUTHORIZED_EVENT = "cw:unauthorized";

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

// Instance « nue » pour le refresh (évite toute boucle d'intercepteurs).
const refreshClient = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

const PUBLIC_AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/password/reset"];
const bearer = (token) => ["Bearer", token].join(" ");
const isPublicAuthRoute = (url = "") => PUBLIC_AUTH_ROUTES.some((route) => url.includes(route));

http.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token && !isPublicAuthRoute(config.url)) {
    config.headers.Authorization = bearer(token);
  }
  return config;
});

let refreshPromise = null;

/** Rafraîchit le couple de jetons. Les appels concurrents partagent la même promesse. */
export function refreshSession() {
  if (!refreshPromise) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return Promise.reject(new Error("Aucun refresh token"));
    refreshPromise = refreshClient
      .post("/auth/refresh", { refresh_token: refreshToken })
      .then((res) => {
        const { access_token: accessToken, refresh_token: newRefresh } = res.data || {};
        if (!accessToken) throw new Error("Réponse de refresh invalide");
        tokenStorage.setTokens(accessToken, newRefresh);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function expireSession() {
  tokenStorage.clear();
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !isPublicAuthRoute(original.url)) {
      original._retry = true;
      try {
        const token = await refreshSession();
        original.headers.Authorization = bearer(token);
        return http(original);
      } catch {
        expireSession();
      }
    }
    return Promise.reject(toApiError(error));
  }
);

/** Extrait une liste d'une réponse (tableau brut ou `{ items }` paginé). */
export function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

/**
 * Récupère toutes les pages d'une ressource paginée par `skip`/`limit`
 * (convention des services FastAPI du projet).
 */
export async function fetchAll(path, { pageSize = 100, maxPages = 50, params = {} } = {}) {
  const items = [];
  for (let page = 0; page < maxPages; page += 1) {
    const res = await http.get(path, { params: { ...params, skip: page * pageSize, limit: pageSize } });
    const batch = asList(res.data);
    items.push(...batch);
    if (batch.length < pageSize) break;
  }
  return items;
}

export const unwrap = (promise) => promise.then((res) => res.data);

export default http;
