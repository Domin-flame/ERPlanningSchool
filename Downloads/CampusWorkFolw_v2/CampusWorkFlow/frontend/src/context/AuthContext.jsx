import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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

  const persistSession = useCallback((userData, accessToken, refreshToken) => {
    localStorage.setItem("cw_user", JSON.stringify(userData));
    localStorage.setItem("cw_token", accessToken);
    if (refreshToken) localStorage.setItem("cw_refresh_token", refreshToken);
    else localStorage.removeItem("cw_refresh_token");
    setUser(userData);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem("cw_user");
    localStorage.removeItem("cw_token");
    localStorage.removeItem("cw_refresh_token");
    setUser(null);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("cw_token");
      const storedUser = localStorage.getItem("cw_user");

      if (!storedToken || !storedUser) {
        clearSession();
        setLoading(false);
        return;
      }

      try {
        const storedUserData = JSON.parse(storedUser);
        if (!storedUserData || typeof storedUserData !== "object") {
          throw new Error("Invalid stored user");
        }

        if (msUntilExpiry(storedToken) > REFRESH_MARGIN_MS) {
          setUser(storedUserData);
          return;
        }

        const refreshToken = localStorage.getItem("cw_refresh_token");
        if (!refreshToken) {
          clearSession();
          return;
        }

        const res = await api.post("/auth/refresh", { refresh_token: refreshToken });
        const accessToken = res.data?.access_token;
        if (!accessToken) throw new Error("Invalid refresh response");

        localStorage.setItem("cw_token", accessToken);
        if (res.data.refresh_token) {
          localStorage.setItem("cw_refresh_token", res.data.refresh_token);
        }
        setUser(storedUserData);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    const handleUnauthorized = () => clearSession();
    window.addEventListener("cw:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("cw:unauthorized", handleUnauthorized);
    };
  }, [clearSession]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token, refresh_token, user: userData } = res.data || {};

      if (!access_token || !userData) {
        return { success: false, message: "Réponse invalide du serveur" };
      }

      persistSession(userData, access_token, refresh_token);

      return { success: true, user: userData };
    } catch (err) {
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

  const register = async (formData) => {
    setLoading(true);
    try {
      const { full_name, email, password, role } = formData;

      if (!full_name?.trim() || !email?.trim() || !password || !role) {
        return { success: false, message: "Tous les champs sont requis" };
      }
      if (password.length < 8) {
        return { success: false, message: "Le mot de passe doit contenir au moins 8 caractères" };
      }

      await api.post("/auth/register", { full_name: full_name.trim(), email: email.trim(), password, role });

      const loginResult = await login(email, password);
      if (loginResult.success) {
        return { success: true, user: loginResult.user };
      }
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
