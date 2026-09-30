import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Composant de protection de route par rôle.
 *
 * - Redirige vers /login si non authentifié.
 * - Redirige vers le dashboard du rôle si l'URL demandée n'est pas autorisée.
 */
const ROLE_HOME = {
  academic: "/",
  professeur: "/professeur",
  student: "/student",
  rh: "/hr",
  finance: "/finance",
  marketing: "/marketing",
};

export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div className="splash-loader"><span /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={ROLE_HOME[user?.role] || "/"} replace />;
  }

  return children;
}
