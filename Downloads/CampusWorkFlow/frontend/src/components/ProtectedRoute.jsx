import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Composant de protection de route par rôle.
 *
 * - Redirige vers /login si non authentifié.
 * - Redirige vers /forbidden (403) si le rôle n'est pas autorisé,
 *   plutôt que de rediriger silencieusement vers le dashboard.
 *   Cela rend l'accès non autorisé visible et auditables.
 */
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
    return <Navigate to="/forbidden" state={{ from: location, requiredRoles: allowedRoles }} replace />;
  }

  return children;
}
