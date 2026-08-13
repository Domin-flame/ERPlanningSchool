import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import FoxMascot from "../components/FoxMascot.jsx";

const ROLE_LABELS = {
  academic: "Direction Académique",
  professeur: "Professeur / Enseignant",
  student: "Étudiant",
  rh: "Responsable RH",
  finance: "Responsable Financier",
  marketing: "Responsable Marketing",
};

const ROLE_HOME = {
  academic: "/",
  professeur: "/professeur",
  student: "/student",
  rh: "/hr",
  finance: "/finance",
  marketing: "/marketing",
};

export default function Forbidden() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const homeRoute = ROLE_HOME[user?.role] || "/";
  const roleLabel = ROLE_LABELS[user?.role] || user?.role || "Utilisateur";

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        background: "var(--bg, #f8fafc)",
        padding: "32px 16px",
        textAlign: "center",
      }}
    >
      <div>
        <FoxMascot size={100} variant="default" />
        <h1 style={{ fontSize: 64, fontWeight: 800, margin: "16px 0 0", color: "var(--brand, #ea580c)" }}>
          403
        </h1>
        <h2 style={{ margin: "8px 0 12px" }}>Accès non autorisé</h2>
        <p className="muted" style={{ maxWidth: 400, margin: "0 auto 24px" }}>
          Votre rôle <strong>{roleLabel}</strong> ne vous permet pas d'accéder à cette section de l'application.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn" onClick={() => navigate(-1)}>
            ← Retour
          </button>
          <button className="btn primary" onClick={() => navigate(homeRoute)}>
            🏠 Aller à mon dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
