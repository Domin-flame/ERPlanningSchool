import React, { useState } from "react";
import { Link } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import StatCard from "../components/StatCard.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Toast from "../components/Toast.jsx";
import Skeleton, { SkeletonList } from "../components/Skeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";

//changer les icones de l'application
export default function Dashboard() {
  const { user } = useAuth();
  const { courses, students, addCourse, loading, errors } = useData();

  const [modal, setModal] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Champs alignés avec CourseCreate : code, title, credits, module_id
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseCredits, setCourseCredits] = useState(3);
  const [courseModuleId, setCourseModuleId] = useState("");

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!courseTitle || !courseCode || !courseModuleId) {
      setFormError("Titre, code et ID module sont obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      await addCourse({
        code: courseCode,
        title: courseTitle,
        credits: parseInt(courseCredits, 10),
        module_id: parseInt(courseModuleId, 10),
      });
      setCourseTitle("");
      setCourseCode("");
      setCourseModuleId("");
      setModal(false);
      setToastMsg(`Le cours "${courseTitle}" a été créé et publié.`);
      setToastShow(true);
    } catch (err) {
      setFormError(err.message || "Impossible de créer le cours.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Direction Académique" }, { label: "Dashboard" }]} />
        <Skeleton height={38} width="50%" style={{ marginBottom: 16 }} />
        <div className="grid stats" style={{ marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={100} radius={12} />)}
        </div>
        <SkeletonList rows={5} height={60} />
      </div>
    );
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Direction Académique" }, { label: "Dashboard" }]} />

      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2>Tableau de Bord Académique</h2>
            <span className="role-pill academic">Direction</span>
          </div>
          <p className="muted">Vue globale sur les formations, effectifs et performances scolaires.</p>
        </div>
        <div className="actions">
          <Link className="btn" to="/analytics">📊 Rapport Global</Link>
          <button className="btn primary" onClick={() => setModal(true)}>+ Créer un cours</button>
        </div>
      </div>

      {(errors.courses || errors.students) && (
        <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ⚠️ Certaines données n'ont pas pu être chargées. Vérifiez la connexion aux services.
        </div>
      )}

      <div className="grid stats">
        <StatCard label="Étudiants Inscrits" value={students.length || "—"} trend="Données en temps réel" mark="🎓" />
        <StatCard label="Cours au Catalogue" value={courses.length || "—"} trend="Programmes actifs" mark="📚" />
        <StatCard label="Session d'Examens" value="—" trend="Voir le calendrier" mark="📝" down />
        <StatCard label="Taux de Réussite" value="—" trend="Calculé depuis les notes" mark="🏆" />
      </div>

      <div className="grid module-grid" style={{ marginTop: 24 }}>
        <ModuleCard mark="🎓" title="Gestion des Étudiants" text="Dossiers, relevés, inscriptions et statut des bourses." to="/students" label="Étudiants" />
        <ModuleCard mark="📚" title="Gestion des Cours" text="Curriculum, syllabus, horaires et enseignants." to="/courses" label="Cours" />
        <ModuleCard mark="📅" title="Examens & Planning" text="Calendrier des épreuves et publication des résultats." to="/calendar" label="Examens" />
        <ModuleCard mark="💶" title="Module Financier" text="Encaissement des scolarités, factures et bilans." to="/finance" label="Finance" />
      </div>

      <div className="section-title" style={{ marginTop: 28 }}>
        <h3>Catalogue Général des Cours</h3>
        <Link className="btn" to="/courses">Voir tous les cours ({courses.length})</Link>
      </div>

      <div className="panel table-wrap">
        {courses.length === 0 ? (
          <EmptyState
            icon="📚"
            title="Aucun cours dans le catalogue"
            description="Créez le premier cours pour commencer."
            action={<button className="btn primary" onClick={() => setModal(true)}>+ Créer un cours</button>}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Intitulé du Cours</th>
                <th>Module ID</th>
                <th>Crédits ECTS</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.course_id || c.code} className="row-hover">
                  <td><code className="code-tag">{c.code}</code></td>
                  <td><strong>{c.title}</strong></td>
                  <td>{c.module_id}</td>
                  <td><strong>{c.credits}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Créer un Cours */}
      <Modal
        open={modal}
        title="Créer un Nouveau Cours"
        onClose={() => { setModal(false); setFormError(""); }}
        footer={
          <>
            <button className="btn" onClick={() => { setModal(false); setFormError(""); }}>Annuler</button>
            <button className="btn primary" onClick={handleCreateCourse} disabled={submitting}>
              {submitting ? "Enregistrement…" : "Enregistrer et Publier"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateCourse} className="form-grid">
          {formError && (
            <div style={{ gridColumn: "1/-1", padding: "8px 12px", background: "var(--danger-bg)", color: "var(--danger)", borderRadius: 6, fontSize: 13 }}>
              {formError}
            </div>
          )}
          <label className="full">
            Intitulé du cours *
            <input
              className="field"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="e.g. Algorithmique & Data Structures"
              required
            />
          </label>
          <label>
            Code du cours *
            <input
              className="field"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. CS102"
              required
            />
          </label>
          <label>
            Crédits ECTS
            <input
              type="number"
              className="field"
              value={courseCredits}
              onChange={(e) => setCourseCredits(e.target.value)}
              min="1"
              max="30"
            />
          </label>
          <label className="full">
            ID Module parent * <span className="muted" style={{ fontSize: 11 }}>(numérique)</span>
            <input
              type="number"
              className="field"
              value={courseModuleId}
              onChange={(e) => setCourseModuleId(e.target.value)}
              placeholder="e.g. 1"
              required
              min="1"
            />
          </label>
        </form>
      </Modal>

      <Toast show={toastShow} message={toastMsg} sub="Portail Académique" />
    </div>
  );
}

function ModuleCard({ mark, title, text, to, label }) {
  return (
    <article className="card module-card card-interactive">
      <div className="soft-icon">{mark}</div>
      <div>
        <h3>{title}</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{text}</p>
        <Link className="btn" to={to} style={{ marginTop: 16 }}>Accéder à {label}</Link>
      </div>
    </article>
  );
}
