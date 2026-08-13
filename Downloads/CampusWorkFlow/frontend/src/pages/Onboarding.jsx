import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FoxMascot from "../components/FoxMascot.jsx";

const STEPS = [
  {
    title: "Bienvenue sur CampusWorkflow",
    text: "La plateforme ERP scolaire tout-en-un conçue pour unifier les étudiants, les enseignants, la direction, la RH, la finance et le marketing.",
    variant: "wave",
    badge: "Plateforme ERP 360°",
    color: "#ea580c",
  },
  {
    title: "Espaces Étudiant & Enseignant",
    text: "Suivi des cours, devoirs, relevés de notes automatisés, appel en direct et messagerie instantanée réactive.",
    variant: "default",
    badge: "Portail Académique & Pédagogique",
    color: "#2563eb",
  },
  {
    title: "Gestion Financière & Recouvrement",
    text: "Paiement en ligne, émission des factures de scolarité, relances d'impayés et bilans de trésorerie en temps réel.",
    variant: "default",
    badge: "Portail Financier & Comptabilité",
    color: "#059669",
  },
  {
    title: "RH, Paie & Acquisition Marketing",
    text: "Supervisez le personnel, validez les congés et maximisez les inscriptions grâce à notre CRM d'admission intégré.",
    variant: "wave",
    badge: "Portails RH & Marketing CRM",
    color: "#9333ea",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="onboarding-page">
      <div className="obo-card-wrap page-fade-enter" key={step}>
        {/* Step Indicator Dots */}
        <div className="obo-header">
          <span className="obo-badge-pill" style={{ background: `${current.color}15`, color: current.color }}>
            {current.badge}
          </span>
          <div className="obo-steps">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`obo-dot ${i === step ? "active" : ""}`}
                onClick={() => setStep(i)}
                style={{ background: i === step ? current.color : undefined }}
              />
            ))}
          </div>
        </div>

        {/* Mascot Visual */}
      
       <div className="obo-visual-box">
          <FoxMascot size={140} variant={current.variant} />
        </div>
       
        {/* Content */}
        <h2>{current.title}</h2>
        <p className="muted obo-text">{current.text}</p>

        {/* Action Controls */}
        <div className="obo-actions">
          <button
            className="btn ghost"
            onClick={() => (step > 0 ? setStep(step - 1) : navigate("/login"))}
          >
            {step === 0 ? "Passer" : "Précédent"}
          </button>
          <button
            className="btn primary obo-next-btn"
            style={{ background: current.color }}
            onClick={() => (isLast ? navigate("/login") : setStep(step + 1))}
          >
            {isLast ? "Commencer l'expérience" : "Suivant →"}
          </button>
        </div>
      </div>
    </div>
  );
}
