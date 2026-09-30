import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import api, {
  REFRESH_TOKEN_KEY,
  TOKEN_KEY,
  USER_KEY,
  clearStoredSession,
  refreshAccessToken,
} from "../api/client.js";

const AuthContext = createContext();

// Durée avant expiration à partir de laquelle on tente le refresh (en ms).
// On rafraîchit 2 minutes avant l'expiration réelle du token.
const REFRESH_MARGIN_MS = 2 * 60 * 1000;
const MAX_TIMER_DELAY_MS = 2 ** 31 - 1;

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

export function validatePassword(password) {
  const rules = [
    { valid: password.length >= 8, message: "au moins 8 caractères" },
    { valid: /[A-Z]/.test(password), message: "une majuscule" },
    { valid: /[a-z]/.test(password), message: "une minuscule" },
    { valid: /\d/.test(password), message: "un chiffre" },
    { valid: /[^A-Za-z0-9]/.test(password), message: "un caractère spécial" },
  ];
  const missing = rules.filter((rule) => !rule.valid).map((rule) => rule.message);
  return {
    valid: missing.length === 0,
    message: missing.length ? `Le mot de passe doit contenir ${missing.join(", ")}.` : "",
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true au démarrage = vérification du token stocké
  const refreshTimerRef = useRef(null);
  const performRefreshRef = useRef(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // ----- Helpers de persistance -----
  const persistSession = useCallback((userData, accessToken, refreshToken) => {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(userData);
  }, []);

  const clearSession = useCallback(() => {
    clearStoredSession();
    clearRefreshTimer();
    setUser(null);
  }, [clearRefreshTimer]);

  // ----- Refresh silencieux du token -----
  // Programme un refresh REFRESH_MARGIN_MS avant l'expiration du token.
  const scheduleRefresh = useCallback((accessToken) => {
    clearRefreshTimer();
    const delay = Math.max(msUntilExpiry(accessToken) - REFRESH_MARGIN_MS, 0);
    // setTimeout est limité à ~24,8 jours (entier signé 32 bits).
    refreshTimerRef.current = setTimeout(
      () => performRefreshRef.current?.(),
      Math.min(delay, MAX_TIMER_DELAY_MS)
    );
  }, [clearRefreshTimer]);

  const performRefresh = useCallback(async () => {
    try {
      // refreshAccessToken() mutualise la requête avec l'intercepteur 401
      // de client.js et émet "cw:token-refreshed" qui reprogramme le timer.
      await refreshAccessToken();
      return true;
    } catch {
      // Refresh échoué → déconnexion propre
      clearSession();
      window.dispatchEvent(new CustomEvent("cw:session-expired"));
      return false;
    }
  }, [clearSession]);

  useEffect(() => {
    performRefreshRef.current = performRefresh;
  }, [performRefresh]);

  // ----- Initialisation : restaurer la session depuis localStorage -----
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (!storedToken || !storedUser) {
        clearSession();
        setLoading(false);
        return;
      }

      let storedUserData;
      try {
        storedUserData = JSON.parse(storedUser);
        if (!storedUserData || typeof storedUserData !== "object") {
          throw new Error("Utilisateur stocké invalide");
        }
      } catch {
        clearSession();
        setLoading(false);
        return;
      }

      if (msUntilExpiry(storedToken) > REFRESH_MARGIN_MS) {
        // Token encore valide — restaurer directement
        setUser(storedUserData);
        scheduleRefresh(storedToken);
        setLoading(false);
        return;
      }

      // Token expiré ou sur le point d'expirer → tenter le refresh
      const refreshed = await performRefresh();
      if (!cancelled && refreshed) setUser(storedUserData);
      if (!cancelled) setLoading(false);
    };

    restoreSession();

    // Nouveau token obtenu (timer, intercepteur 401 ou autre onglet)
    const handleTokenRefreshed = (event) => {
      const token = event.detail?.accessToken || localStorage.getItem(TOKEN_KEY);
      if (token) scheduleRefresh(token);
    };
    // Refresh impossible depuis client.js → session terminée
    const handleUnauthorized = () => clearSession();
    // Synchronisation multi-onglets (connexion, déconnexion, rotation du token)
    const handleStorage = (event) => {
      if (event.key === TOKEN_KEY) {
        if (event.newValue) scheduleRefresh(event.newValue);
        else clearSession();
      } else if (event.key === USER_KEY) {
        if (!event.newValue) {
          clearSession();
          return;
        }
        try {
          setUser(JSON.parse(event.newValue));
        } catch {
          clearSession();
        }
      } else if (event.key === null) {
        // localStorage.clear() dans un autre onglet
        clearSession();
      }
    };

    window.addEventListener("cw:token-refreshed", handleTokenRefreshed);
    window.addEventListener("cw:unauthorized", handleUnauthorized);
    window.addEventListener("storage", handleStorage);

    return () => {
      cancelled = true;
      window.removeEventListener("cw:token-refreshed", handleTokenRefreshed);
      window.removeEventListener("cw:unauthorized", handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
      clearRefreshTimer();
    };
  }, [clearSession, clearRefreshTimer, performRefresh, scheduleRefresh]);

  // ----- Login -----
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token, refresh_token, user: userData } = res.data || {};

      if (!access_token || !userData) {
        return { success: false, message: "Réponse invalide du serveur" };
      }

      persistSession(userData, access_token, refresh_token);
      scheduleRefresh(access_token);

      return { success: true, user: userData };
    } catch (err) {
      console.error("Login error:", err);
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
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
      if (!full_name?.trim() || !email?.trim() || !password || !role) {
        return { success: false, message: "Tous les champs sont requis" };
      }
      // Complexité : 8 caractères min., majuscule, minuscule, chiffre et caractère spécial
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        return { success: false, message: passwordCheck.message };
      }

      // Inscription sur le backend (payload aligné avec UserCreate du service auth)
      await api.post("/auth/register", {
        full_name: full_name.trim(),
        email: email.trim(),
        password,
        role,
      });

      // Connexion automatique après inscription réussie
      const loginResult = await login(email.trim(), password);
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
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      // Révoque aussi le refresh token côté serveur s'il est présent
      await api.post("/auth/logout", refreshToken ? { refresh_token: refreshToken } : undefined);
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

