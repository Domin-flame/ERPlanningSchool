// Persistance de la session côté navigateur.
// Les clés `cw_*` sont conservées pour rester compatibles avec les sessions
// ouvertes par l'ancienne version du frontend.
const KEYS = {
  access: "cw_token",
  refresh: "cw_refresh_token",
  user: "cw_user",
};

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(KEYS.access),
  getRefreshToken: () => localStorage.getItem(KEYS.refresh),
  getUser() {
    try {
      const raw = localStorage.getItem(KEYS.user);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  },
  setTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem(KEYS.access, accessToken);
    if (refreshToken) localStorage.setItem(KEYS.refresh, refreshToken);
  },
  setUser(user) {
    localStorage.setItem(KEYS.user, JSON.stringify(user));
  },
  clear() {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  },
};

/** Décode le payload d'un JWT (sans vérification — lecture de `exp` uniquement). */
export function decodeJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

/** Millisecondes avant expiration du token (négatif si expiré ou illisible). */
export function msUntilExpiry(token) {
  const payload = token ? decodeJwt(token) : null;
  if (!payload?.exp) return -1;
  return payload.exp * 1000 - Date.now();
}
