import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/campusworkflow.png";

export default function Splash() {
  const navigate = useNavigate();

  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(
    "Initialisation du système..."
  );
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        const next = prev + 4;

        if (next === 28) {
          setStatusText(
            "Chargement des modules & sécurité JWT..."
          );
        }

        if (next === 60) {
          setStatusText(
            "Connexion aux bases PostgreSQL & microservices..."
          );
        }

        if (next === 88) {
          setStatusText(
            "Préparation de votre espace de travail..."
          );
        }

        if (next >= 100) {
          setStatusText(
            "CampusWorkflow est prêt !"
          );
        }

        return next;
      });
    }, 50);

    const fadeTimer = setTimeout(() => {
      setFade(true);
    }, 2100);

    const navTimer = setTimeout(() => {
      navigate("/onboarding");
    }, 2600);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div className={`splash-page ${fade ? "fade-out" : ""}`}>

      {/* Lumières d'ambiance */}
      <div className="splash-ambient-light glow-1" />
      <div className="splash-ambient-light glow-2" />
      <div className="splash-ambient-light glow-3" />

      <div className="splash-content">

        {/* LOGO */}
        <div className="splash-logo-container">

          <div className="splash-logo-wrapper">
            <img
              className="splash-logo-img"
              src={logo}
              alt="Logo CampusWorkflow"
            />
          </div>

          <h1 className="splash-title">
            CampusWorkflow
          </h1>

          <div className="splash-title-line" />

        </div>

        {/* DESCRIPTION */}
        <p className="splash-tagline">
          ERP Scolaire Intelligent
          <span>&</span>
          Modulaire Tout-en-Un
        </p>

        {/* PROGRESSION */}
        <div className="splash-progress-container">

          <div className="splash-progress-track">

            <div
              className="splash-progress-bar"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          <div className="splash-status">

            <span>
              {statusText}
            </span>

            <strong>
              {progress}%
            </strong>

          </div>

        </div>

        {/* INDICATEUR */}
        <div className="splash-loading-dots">
          <span />
          <span />
          <span />
        </div>

      </div>

      {/* VERSION */}
      <div className="splash-version">
        CampusWorkflow • ERP Scolaire
      </div>

    </div>
  );
}