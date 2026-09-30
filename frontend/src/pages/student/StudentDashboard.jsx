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
  const { courses, invoices, studentOverview, loading } = useData();

  const [modalEnroll, setModalEnroll] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const studentName = user?.full_name || user?.name || "Étudiant";
  const studentEmail = user?.email || "";

  // Données réelles depuis la base / API
  const studentData = studentOverview?.student;
  const semester = studentOverview?.semester;
  const studentCourses = studentOverview?.courses || courses;
  const realSchedule = studentOverview?.schedule || [];
  const summary = studentOverview?.summary || {};
  const hasUnpaid = invoices.some((invoice) => !["PAYEE", "Payée"].includes(invoice.statut || invoice.status));
  const balance = invoices.reduce((total, invoice) => {
    const status = invoice.statut || invoice.status;
    return total + (status === "PAYEE" ? 0 : Number(invoice.montant_total || invoice.amount || 0));
  }, 0);

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
            <span className="role-pill student">{studentData?.level || "Étudiant"}</span>
          </div>
          <p className="muted">
            {studentData?.faculty || "Faculté"} · {studentData?.program || "Filière à confirmer"} · {semester?.name || "Semestre en cours"}
          </p>
        </div>
        
        <div className="actions">
          <Link className="btn" to="/student/transcript">📜 Relevé de notes</Link>
          <button className="btn primary" onClick={() => setModalEnroll(true)}>
            + S'inscrire à un cours
          </button>
        </div>
      </div>

      <div className="grid stats">
        <StatCard
          label="Moyenne générale"
          value={summary.average == null ? "—" : `${summary.average} / 20`}
          trend={summary.average_delta == null ? "Semestre précédent indisponible" : `${summary.average_delta >= 0 ? "+" : ""}${summary.average_delta} point(s)`}
          mark="/20"
        />
        <StatCard
          label="Crédits validés"
          value={`${summary.validated_credits || 0}`}
          trend={`${studentData?.cycle || "Cycle"} · calculé sur les notes publiées`}
          mark="ECTS"
        />
        <StatCard
          label="Cours suivis"
          value={String(summary.course_count || 0)}
          trend={semester?.name || "Semestre en cours"}
          mark="📚"
        />
        <StatCard
          label="Solde du semestre"
          value={hasUnpaid ? `${balance.toLocaleString("fr-FR")} FCFA` : "À jour"}
          trend={hasUnpaid ? "Reste à payer" : "Aucun impayé"}
          mark="FCFA"
          down={hasUnpaid}
        />
        <StatCard
          label="Suivi Académique"
          value={studentData?.status || "—"}
          trend={studentData?.matricule || "Profil académique"}
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
            <span className="badge info">{realSchedule.length} séance(s)</span>
          </div>

          <div style={{ padding: "0 16px 16px" }}>
            {realSchedule.length === 0 ? (
              <div className="muted" style={{ paddingTop: 8 }}>Aucun cours n'a encore été chargé depuis la base de données.</div>
            ) : (
                realSchedule.map((u, i) => (
                <div className="panel-row" key={`${u.session_id}-${i}`} style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
                  <div className="soft-icon" style={{ width: 54, height: 54, fontSize: 16, fontWeight: 700, background: u.status === "EXAM" ? "var(--danger-bg)" : "var(--brand-soft)", color: u.status === "EXAM" ? "var(--danger)" : "var(--brand-dark)" }}>
                    {new Date(u.date).toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong>{u.code} — {u.title}</strong>
                    <p className="muted" style={{ fontSize: 13, margin: "2px 0 0" }}>{u.start_time} - {u.end_time} · {u.room}</p>
                  </div>
                  <Badge status={u.status || "À venir"} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid" style={{ alignContent: "start", gap: 18 }}>
          <div className="panel card-interactive" style={{ padding: 20 }}>
            <h3>Progression & Notes par Cours</h3>
            <div style={{ marginTop: 14, display: "grid", gap: 16 }}>
              {studentCourses.slice(0, 4).map((c) => (
                <div key={c.code}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <strong>{c.code} — {c.title}</strong>
                      <span className="badge success">{c.average == null ? "Non noté" : `${c.average} / 20`}</span>
                  </div>
                  <div className="progress-bar-mini">
                    <div className="fill" style={{ width: `${c.progress || 0}%` }} />
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
