import React, { useState } from "react";
import { Link } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import StatCard from "../components/StatCard.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Toast from "../components/Toast.jsx";
import Skeleton, { SkeletonList } from "../components/Skeleton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";

const UPCOMING = [
  { day: "Lun 12", course: "CS101 - Algorithmique", time: "9:00 - 11:00", room: "Amphi A", type: "Cours" },
  { day: "Mar 13", course: "BIO201 - Génétique", time: "14:00 - 16:00", room: "Labo B-12", type: "Cours" },
  { day: "Mer 14", course: "MTH301 — Examen Partiel", time: "14:00 - 16:00", room: "Salle 204", type: "Exam" },
  { day: "Jeu 15", course: "MKT105 - Marketing Digital", time: "13:00 - 16:00", room: "Salle Tech 3", type: "Cours" },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const { courses, invoices, loading } = useData();

  const [modalTranscript, setModalTranscript] = useState(false);
  const [modalEnroll, setModalEnroll] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const studentName = user?.full_name || user?.name || "Étudiant";
  const studentEmail = user?.email || "";

  // Factures de l'étudiant connecté
  const studentInvoices = invoices.filter(
    (inv) => inv.studentName === studentName || inv.studentEmail === studentEmail
  );
  const hasUnpaid = studentInvoices.some((inv) => inv.status !== "Payée" && inv.status !== "PAYEE");

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Portail Étudiant" }, { label: "Dashboard" }]} />
        <Skeleton height={36} width="50%" style={{ marginBottom: 16 }} />
        <div className="grid stats" style={{ marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={100} radius={12} />
          ))}
        </div>
        <SkeletonList rows={4} height={64} />
      </div>
    );
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Portail Étudiant" }, { label: "Dashboard" }]} />
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2>Bienvenue, {studentName} 👋</h2>
            <span className="role-pill student">Étudiant L2</span>
          </div>
          <p className="muted">Votre espace académique personnel, notes et suivi des cours.</p>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => setModalTranscript(true)}>
            📜 Relevé de notes
          </button>
          <button className="btn primary" onClick={() => setModalEnroll(true)}>
            + S'inscrire à un cours
          </button>
        </div>
      </div>

      <div className="grid stats">
        <StatCard label="Moyenne Générale (GPA)" value="3.85 / 4.0" trend="+0.15 ce semestre" mark="GPA" />
        <StatCard label="Crédits Valider (ECTS)" value="78 / 180" trend="Progression 43%" mark="Cr" />
        <StatCard label="Cours Inscrits" value={courses.length || "4"} trend="Semestre 2" mark="📚" />
        <StatCard label="Statut Financier" value={hasUnpaid ? "Solde partiel" : "Régularisé"} trend={hasUnpaid ? "1 facture en attente" : "0 € dû"} mark="€" down={hasUnpaid} />
      </div>

      <div className="grid two-cols" style={{ marginTop: 24 }}>
        <div className="panel card-interactive">
          <div className="panel-head">
            <div>
              <h3>Emploi du Temps de la Semaine</h3>
              <p className="muted">Prochains cours et sessions d'examens</p>
            </div>
            <span className="badge info">4 Séances</span>
          </div>

          <div style={{ padding: "0 16px 16px" }}>
            {UPCOMING.map((u, i) => (
              <div className="panel-row" key={i} style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
                <div className="soft-icon" style={{ width: 54, height: 54, fontSize: 16, fontWeight: 700, background: u.type === "Exam" ? "var(--danger-bg)" : "var(--brand-soft)", color: u.type === "Exam" ? "var(--danger)" : "var(--brand-dark)" }}>
                  {u.day.split(" ")[1]}
                </div>
                <div style={{ flex: 1 }}>
                  <strong>{u.course}</strong>
                  <p className="muted" style={{ fontSize: 13, margin: "2px 0 0" }}>{u.time} · {u.room}</p>
                </div>
                <Badge status={u.type === "Exam" ? "Exam" : "Active"} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid" style={{ alignContent: "start", gap: 18 }}>
          <div className="panel card-interactive" style={{ padding: 20 }}>
            <h3>Progression & Notes par Cours</h3>
            <div style={{ marginTop: 14, display: "grid", gap: 16 }}>
              {courses.slice(0, 4).map((c, i) => (
                <div key={c.code}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <strong>{c.code} — {c.title}</strong>
                    <span className="badge success">{(16.5 - i * 0.8).toFixed(1)} / 20</span>
                  </div>
                  <div className="progress-bar-mini">
                    <div className="fill" style={{ width: `${88 - i * 8}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel card-interactive" style={{ padding: 20 }}>
            <h3>Actions & Raccourcis</h3>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <button className="btn" style={{ justifyContent: "flex-start" }} onClick={() => setModalTranscript(true)}>
                📄 Télécharger le certificat de scolarité
              </button>
              <button className="btn" style={{ justifyContent: "flex-start" }} onClick={() => setModalEnroll(true)}>
                ➕ S'inscrire à une option optionnelle
              </button>
              <Link className="btn" style={{ justifyContent: "flex-start" }} to="/messages">
                💬 Envoyer un message à un enseignant
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Relevé de Notes */}
      <Modal
        open={modalTranscript}
        title="Générer le Relevé de Notes"
        onClose={() => setModalTranscript(false)}
        footer={
          <>
            <button className="btn" onClick={() => setModalTranscript(false)}>Fermer</button>
            <button className="btn primary" onClick={() => {
              setModalTranscript(false);
              setToastMessage("Relevé de notes officiel généré et téléchargeable au format PDF.");
              setToastShow(true);
            }}>
              📥 Télécharger PDF
            </button>
          </>
        }
      >
        <div>
          <p className="muted">Document officiel de la scolarité pour l'année 2025-2026.</p>
          <div style={{ background: "var(--bg)", padding: 16, borderRadius: 8, marginTop: 12 }}>
            <p style={{ margin: "0 0 6px" }}><strong>Étudiant :</strong> {studentName}</p>
            <p style={{ margin: "0 0 6px" }}><strong>Email :</strong> {studentEmail}</p>
            <p style={{ margin: 0 }}><strong>Filière :</strong> Licence Computer Science - L2</p>
          </div>
        </div>
      </Modal>

      {/* Modal Inscription Cours */}
      <Modal
        open={modalEnroll}
        title="Inscription à un Nouveau Cours"
        onClose={() => setModalEnroll(false)}
        footer={
          <>
            <button className="btn" onClick={() => setModalEnroll(false)}>Annuler</button>
            <button className="btn primary" onClick={() => {
              setModalEnroll(false);
              setToastMessage("Demande d'inscription soumise au responsable pédagogique.");
              setToastShow(true);
            }}>
              Confirmer l'inscription
            </button>
          </>
        }
      >
        <div className="form-grid">
          <label className="full">
            Sélectionner le cours optionnel *
            <select className="field">
              {courses.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.title}</option>
              ))}
            </select>
          </label>
        </div>
      </Modal>

      <Toast show={toastShow} message={toastMessage} sub="Portail Étudiant" />
    </div>
  );
}
