import React from "react";
import { BarChart3, GraduationCap, ShieldCheck, Users } from "lucide-react";
import Logo from "../components/brand/Logo.jsx";

const HIGHLIGHTS = [
  { icon: GraduationCap, title: "Scolarité", text: "Inscriptions, notes, présences et emplois du temps." },
  { icon: Users, title: "Ressources humaines", text: "Personnel, congés et bulletins de paie." },
  { icon: BarChart3, title: "Finance & admissions", text: "Facturation, encaissements et suivi des prospects." },
  { icon: ShieldCheck, title: "Accès sécurisés", text: "Espaces dédiés par rôle, authentification JWT." },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth__aside">
        <Logo tone="light" size={44} subtitle="ERP universitaire unifié" />
        <div className="auth__pitch">
          <h2>Pilotez votre établissement depuis un espace unique.</h2>
          <p>Étudiants, enseignants, direction et services administratifs partagent les mêmes données, en temps réel.</p>
        </div>
        <ul className="auth__highlights">
          {HIGHLIGHTS.map(({ icon: Icon, title: t, text }) => (
            <li key={t}>
              <span><Icon size={18} aria-hidden="true" /></span>
              <div>
                <strong>{t}</strong>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ul>
        <small className="auth__copyright">© {new Date().getFullYear()} CampusWorkflow</small>
      </aside>
      <main className="auth__main">
        <div className="auth__card">
          <div className="auth__mobile-brand"><Logo size={36} /></div>
          <h1>{title}</h1>
          {subtitle && <p className="auth__subtitle">{subtitle}</p>}
          {children}
          {footer && <div className="auth__footer">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
