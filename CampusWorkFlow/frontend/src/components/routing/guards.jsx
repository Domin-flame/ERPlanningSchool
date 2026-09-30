import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { canAccess } from "../../app/roles.js";
import { PageLoader } from "../ui/States.jsx";

/** Exige une session ouverte, sinon redirige vers /login (avec retour). */
export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <PageLoader label="Vérification de la session…" />;
  if (status !== "authenticated") return <Navigate to="/login" replace state={{ from: location }} />;
  return children || <Outlet />;
}

/** Vérifie que le rôle courant a accès à `path` (table ROUTE_ACCESS). */
export function RequireRole({ path, children }) {
  const { role } = useAuth();
  if (!canAccess(role, path)) return <Navigate to="/forbidden" replace />;
  return children || <Outlet />;
}

/** Pages publiques (login…) : redirige vers le tableau de bord si déjà connecté. */
export function PublicOnly({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <PageLoader />;
  if (status === "authenticated") {
    const from = location.state?.from?.pathname;
    return <Navigate to={from && from !== "/login" ? from : "/dashboard"} replace />;
  }
  return children;
}
