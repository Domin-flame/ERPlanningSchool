import React, { useState } from "react";
import { Link } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import StatCard from "../../components/StatCard.jsx";
import Badge from "../../components/Badge.jsx";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import Skeleton, { SkeletonList } from "../../components/Skeleton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";

// la fonction relevé de note n'affiche pas réellement le relevé de note il faut prendre cela en compte et résoudre le problème et le bouton de téléchargement de celui-ci en pdf ne fonctionne pas 
// les données sont encore fictive et ne sont pas connecté à la base de donnée il faut régler le problème au plus vite 
// normalement la page frais et soldes nous permet de voir nos factures personnels ainsi que le solde de tout ce que nous avons déja payé ainsi que tout ce qui nous reste à payer, elle nous permet d'upload nos recus et de les faire valider par le service financier, 
// progression doit comprendre l'ensemble des cours que vous etes entrain de suivre ce semestre et la progression dans le programme de ceux-ci par rapport aux cours dans chaque matière 
/*pour les statcards les données sont encore fictives résoudre le problème en ajoutant une vrai fonction qui calcule ta moyenne générale et te dis combien de point tu as gagné en plus par rapport au semestre précédent 

la deuxième card te donne le nombre de crédit que tu dois avoir pour valider ton cycle et ce met à jour automatiquement à chaque fois que tu gagnes des crédits
la troisième card te donne en temps réelle le nombre de cours que tu suis et le semestre que tu es en train de faire, 
la dernière card te donne l'état de statut financier et te donne la somme que tu dois par rapport au semestre en cours 
*/
// la partie emploi du temps de la semaine te donne la liste des cours que tu dois suivre cette semaine avec les données réelles et ce met à jour au fur et à mesure des jours qui passe avec le statut du cours par exemple si c'est un cours qui est passé, qui est à venir, un td, un cours normal ou alors un examen il collecte les données dans le backend de academic pour tout ca 
// il faut aussi qu'on affiche le niveau de l'étudiant sur son dashboard, le semestre qu'il est en train de suivre présentement, sa faculté, et aussi le cycle qu'il est en train de suivre si c'est licence/master/doctorat, ainsi que sa filière par exemple cybersécurité 
// au lieu d'un simple bouton relevé de note je veux une page complète qui te montre la liste des notes que tu as obtenu que ce soit au cc ou à la sn, elle te permet de directement faire des revendications sur une note depuis cette page en cliquant sur une note tu peux choisir de faire une revendication et elle te conduit directement dans un formulaire qu'elle rempli directement adresser au module academic et tu peux ajouter un objet et des notes aux messages à envoyer 
export default function StudentDashboard() {
  const { user } = useAuth();
  const { courses, invoices, loading } = useData();

  const [modalTranscript, setModalTranscript] = useState(false);
  const [modalEnroll, setModalEnroll] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const studentName = user?.full_name || user?.name || "Étudiant";
  const studentEmail = user?.email || "";

  // Données réelles depuis la base / API
  const studentInvoices = invoices.filter(
    (inv) => inv.studentName === studentName || inv.studentEmail === studentEmail
  );
  const hasUnpaid = studentInvoices.some((inv) => inv.status !== "Payée" && inv.status !== "PAYEE");
  const totalCredits = courses.reduce((sum, course) => sum + (Number(course.credits) || 0), 0);
  const realSchedule = courses.slice(0, 4).map((course, index) => ({
    day: ["Aujourd'hui", "Demain", "Mercredi", "Jeudi"][index] || `Jour ${index + 1}`,
    course: `${course.code || "COURSE"} — ${course.title || "Cours"}`,
    time: course.schedule || "Horaire à confirmer",
    room: course.room || "Salle à confirmer",
    type: course.type || "Cours",
  }));

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
            <h2>Bienvenue, {studentName} </h2>
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
        <StatCard
          label="Crédits Validés"
          value={courses.length ? `${Math.min(totalCredits, 180)} / 180` : "—"}
          trend={courses.length ? `${Math.round((Math.min(totalCredits, 180) / 180) * 100)}% du parcours` : "Données backend"}
          mark="ECTS"
        />
        <StatCard
          label="Cours Inscrits"
          value={String(courses.length || 0)}
          trend={courses.length ? "Données réelles" : "Aucun cours"}
          mark="📚"
        />
        <StatCard
          label="Solde Financier"
          value={hasUnpaid ? "Solde partiel" : "Complété"}
          trend={hasUnpaid ? `${studentInvoices.filter((i) => i.status !== "Payée" && i.status !== "PAYEE").length} facture(s) ouverte(s)` : "Aucune facture en attente"}
          mark="FCFA"
          down={hasUnpaid}
        />
        <StatCard
          label="Suivi Académique"
          value={courses.length ? "Actif" : "—"}
          trend={courses.length ? `${courses.length} cours disponibles` : "Aucune donnée"}
          mark="✓"
        />
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
            {realSchedule.length === 0 ? (
              <div className="muted" style={{ paddingTop: 8 }}>Aucun cours n'a encore été chargé depuis la base de données.</div>
            ) : (
              realSchedule.map((u, i) => (
                <div className="panel-row" key={`${u.course}-${i}`} style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
                  <div className="soft-icon" style={{ width: 54, height: 54, fontSize: 16, fontWeight: 700, background: u.type === "Exam" ? "var(--danger-bg)" : "var(--brand-soft)", color: u.type === "Exam" ? "var(--danger)" : "var(--brand-dark)" }}>
                    {u.day.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong>{u.course}</strong>
                    <p className="muted" style={{ fontSize: 13, margin: "2px 0 0" }}>{u.time} · {u.room}</p>
                  </div>
                  <Badge status={u.type === "Exam" ? "Exam" : "Active"} />
                </div>
              ))
            )}
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
            <h3>Actions rapides</h3>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <Link className="btn" style={{ justifyContent: "flex-start" }} to="/courses">
                📚 Voir le catalogue des cours
              </Link>
              <Link className="btn" style={{ justifyContent: "flex-start" }} to="/messages">
                💬 Contacter l'administration
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
              setToastMessage("Demande d'inscription en cours de validation.");
              setToastShow(true);
            }}>
              Confirmer l'inscription
            </button>
          </>
        }
      >
        <div className="form-grid">
          <label className="full">
            Sélectionner le club que vous voulez rejoindre *
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
