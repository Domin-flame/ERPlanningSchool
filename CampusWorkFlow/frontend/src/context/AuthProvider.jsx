import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authApi } from "../api/auth.js";
import { refreshSession, UNAUTHORIZED_EVENT } from "../api/http.js";
import { msUntilExpiry, tokenStorage } from "../api/tokenStorage.js";
import { AuthContext } from "./contexts.js";

// Rafraîchit le jeton d'accès 2 minutes avant son expiration.
const REFRESH_MARGIN_MS = 2 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | anonymous
  const refreshTimer = useRef(null);

  const clearSession = useCallback(() => {
    clearTimeout(refreshTimer.current);
    tokenStorage.clear();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const scheduleRefresh = useCallback(() => {
    clearTimeout(refreshTimer.current);
    const delay = msUntilExpiry(tokenStorage.getAccessToken()) - REFRESH_MARGIN_MS;
    if (delay <= 0 || !tokenStorage.getRefreshToken()) return;
    refreshTimer.current = setTimeout(() => {
      refreshSession().then(scheduleRefresh).catch(() => {
        // L'intercepteur HTTP retentera au prochain 401.
      });
    }, Math.min(delay, 2 ** 31 - 1));
  }, []);

  const openSession = useCallback(
    (sessionUser, accessToken, refreshToken) => {
      tokenStorage.setTokens(accessToken, refreshToken);
      tokenStorage.setUser(sessionUser);
      setUser(sessionUser);
      setStatus("authenticated");
      scheduleRefresh();
    },
    [scheduleRefresh]
  );

  // Restauration de la session au démarrage.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const storedUser = tokenStorage.getUser();
      const token = tokenStorage.getAccessToken();
      if (!storedUser || !token) {
        clearSession();
        return;
      }
      try {
        if (msUntilExpiry(token) <= REFRESH_MARGIN_MS) await refreshSession();
        if (cancelled) return;
        setUser(storedUser);
        setStatus("authenticated");
        scheduleRefresh();
        // Resynchronise le profil (rôle modifié, compte désactivé…).
        const fresh = await authApi.me().catch(() => null);
        if (!cancelled && fresh) {
          tokenStorage.setUser(fresh);
          setUser(fresh);
        }
      } catch {
        if (!cancelled) clearSession();
      }
    };
    restore();
    return () => {
      cancelled = true;
    };
  }, [clearSession, scheduleRefresh]);

  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
      clearTimeout(refreshTimer.current);
    };
  }, [clearSession]);

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.login(email.trim(), password);
      if (!data?.access_token || !data?.user) throw new Error("Réponse invalide du serveur d'authentification.");
      openSession(data.user, data.access_token, data.refresh_token);
      return data.user;
    },
    [openSession]
  );

  const register = useCallback(
    async ({ full_name, email, password, role }) => {
      await authApi.register({ full_name: full_name.trim(), email: email.trim(), password, role });
      return login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Déconnexion locale dans tous les cas.
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      role: user?.role,
      status,
      isAuthenticated: status === "authenticated",
      login,
      register,
      logout,
    }),
    [user, status, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
