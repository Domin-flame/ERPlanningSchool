import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import Skeleton, { SkeletonList } from "../../components/Skeleton.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const { courses, students, loading, errors } = useData();
  const navigate = useNavigate();

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

      <PageHeader
        title="Tableau de bord académique"
        description="Vue globale sur les formations, effectifs et performances scolaires."
        badge="Direction"
        badgeClass="academic"
        actions={
          <>
            <Link className="btn" to="/analytics">📊 Rapport Global</Link>
            <button
              className="btn primary"
              onClick={() => navigate("/courses", { state: { openCreateCourse: true } })}
            >
              + Créer un cours
            </button>
          </>
        }
      />

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
            action={
              <button
                className="btn primary"
                onClick={() => navigate("/courses", { state: { openCreateCourse: true } })}
              >
                + Créer un cours
              </button>
            }
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
