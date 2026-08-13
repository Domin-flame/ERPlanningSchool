import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FoxMascot from "../components/FoxMascot.jsx";

export default function Splash() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initialisation du système...");
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + 4;
        if (next === 28) setStatusText("Chargement des modules & sécurité JWT...");
        if (next === 60) setStatusText("Connexion aux bases PostgreSQL & microservices...");
        if (next === 88) setStatusText("Préparation de votre espace de travail...");
        return next;
      });
    }, 50);

    const fadeTimer = setTimeout(() => setFade(true), 2100);
    const navTimer = setTimeout(() => navigate("/onboarding"), 2600);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div className={`splash-page ${fade ? "fade-out" : ""}`}>
      {/* Particle Canvas Effect Background */}
      <div className="splash-ambient-light glow-1" />
      <div className="splash-ambient-light glow-2" />

      <div className="splash-content">
        <div className="splash-logo-container">
          <FoxMascot size={80} />
          <h1 className="splash-title">CampusWorkflow</h1>
          <span className="splash-badge">VERSION 2.0 PRODUCTION</span>
        </div>

        <div className="splash-mascot-glow">
          <FoxMascot size={160} variant="wave" />
        </div>

        <p className="splash-tagline">
          ERP Scolaire Intelligent & Modulaire Tout-en-Un
        </p>

        {/* Progress bar with step text */}
        <div className="splash-progress-container">
          <div className="splash-progress-track">
            <div className="splash-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <div className="splash-status">
            <span>{statusText}</span>
            <strong>{progress}%</strong>
          </div>
        </div>

        <div className="splash-skip">
          <button className="btn ghost sm" onClick={() => navigate("/login")}>
            Accès rapide Connexion →
          </button>
        </div>
      </div>
    </div>
  );
}
