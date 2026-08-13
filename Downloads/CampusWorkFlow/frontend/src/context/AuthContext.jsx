import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import api from "../api/client.js";

const AuthContext = createContext();

// Durée avant expiration à partir de laquelle on tente le refresh (en ms).
// On rafraîchit 2 minutes avant l'expiration réelle du token.
const REFRESH_MARGIN_MS = 2 * 60 * 1000;

/**
 * Décode le payload d'un JWT sans vérification de signature (côté client).
 * Utilisé uniquement pour lire l'expiration.
 */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/**
 * Calcule dans combien de ms le token expire (négatif = déjà expiré).
 */
function msUntilExpiry(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return -1;
  return payload.exp * 1000 - Date.now();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true au démarrage = vérification du token stocké
  const refreshTimerRef = useRef(null);

  // ----- Helpers de persistance -----
  const persistSession = useCallback((userData, accessToken, refreshToken) => {
    localStorage.setItem("cw_user", JSON.stringify(userData));
    localStorage.setItem("cw_token", accessToken);
    if (refreshToken) localStorage.setItem("cw_refresh_token", refreshToken);
    setUser(userData);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem("cw_user");
    localStorage.removeItem("cw_token");
    localStorage.removeItem("cw_refresh_token");
    setUser(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  // ----- Refresh silencieux du token -----
  const scheduleRefresh = useCallback((accessToken) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const delay = msUntilExpiry(accessToken) - REFRESH_MARGIN_MS;
    if (delay <= 0) {
      // Token déjà expiré ou expire dans moins de REFRESH_MARGIN_MS → refresh immédiat
      performRefresh();
      return;
    }

    refreshTimerRef.current = setTimeout(performRefresh, delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const performRefresh = useCallback(async () => {
    const refreshToken = localStorage.getItem("cw_refresh_token");
    if (!refreshToken) {
      clearSession();
      return;
    }

    try {
      const res = await api.post("/auth/refresh", { refresh_token: refreshToken });
      const { access_token, refresh_token: newRefresh } = res.data;

      localStorage.setItem("cw_token", access_token);
      if (newRefresh) localStorage.setItem("cw_refresh_token", newRefresh);

      scheduleRefresh(access_token);
    } catch {
      // Refresh échoué → déconnexion propre
      clearSession();
      window.dispatchEvent(new CustomEvent("cw:session-expired"));
    }
  }, [clearSession, scheduleRefresh]);

  // ----- Initialisation : restaurer la session depuis localStorage -----
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("cw_token");
      const storedUser = localStorage.getItem("cw_user");

      if (!storedToken || !storedUser) {
        setLoading(false);
        return;
      }

      const remaining = msUntilExpiry(storedToken);

      if (remaining > REFRESH_MARGIN_MS) {
        // Token encore valide — restaurer directement
        try {
          setUser(JSON.parse(storedUser));
          scheduleRefresh(storedToken);
        } catch {
          clearSession();
        }
        setLoading(false);
        return;
      }

      // Token expiré ou sur le point d'expirer → tenter le refresh
      const refreshToken = localStorage.getItem("cw_refresh_token");
      if (!refreshToken) {
        clearSession();
        setLoading(false);
        return;
      }

      try {
        const res = await api.post("/auth/refresh", { refresh_token: refreshToken });
        const { access_token, refresh_token: newRefresh } = res.data;
        localStorage.setItem("cw_token", access_token);
        if (newRefresh) localStorage.setItem("cw_refresh_token", newRefresh);
        setUser(JSON.parse(storedUser));
        scheduleRefresh(access_token);
      } catch {
        clearSession();
      }
      setLoading(false);
    };

    restoreSession();

    // Écouter l'événement 401 émis par client.js
    const handleUnauthorized = () => clearSession();
    window.addEventListener("cw:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("cw:unauthorized", handleUnauthorized);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [clearSession, scheduleRefresh]);

  // ----- Login -----
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token, refresh_token, user: userData } = res.data;

      if (!access_token || !userData) {
        return { success: false, message: "Réponse invalide du serveur" };
      }

      persistSession(userData, access_token, refresh_token);
      scheduleRefresh(access_token);

      return { success: true, user: userData };
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Email ou mot de passe incorrect";
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // ----- Register -----
  const register = async (formData) => {
    setLoading(true);
    try {
      const { full_name, email, password, role } = formData;

      // Validation côté client
      if (!full_name || !email || !password || !role) {
        return { success: false, message: "Tous les champs sont requis" };
      }
      // ajouter des contraintes tels que :
      /* le mot de passe doit contenir au moins une majuscule
      le mot de passe doit contenir au moins une minuscule 
      le mot de passe doit contenir au moins un signe : /*-@#
      le mot de passe doit contenir un chiffre 
      */ 
      if (password.length < 8) {
        return { success: false, message: "Le mot de passe doit contenir au moins 8 caractères" };
      }

      // Inscription sur le backend (payload aligné avec UserCreate du service auth)
      await api.post("/auth/register", { full_name, email, password, role });

      // Connexion automatique après inscription réussie
      const loginResult = await login(email, password);
      if (loginResult.success) {
        return { success: true, user: loginResult.user };
      }
      // Inscription réussie mais connexion auto échouée → rediriger vers login
      return { success: true, message: "Compte créé. Veuillez vous connecter." };
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Échec de l'inscription";
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // ----- Logout -----
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore — on déconnecte côté client dans tous les cas
    }
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé au sein d'un AuthProvider");
  }
  return context;
}
