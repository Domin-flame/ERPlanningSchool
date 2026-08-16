import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
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
// il faudrait que le bouton de rapport globale fonctionne : il faut encore que je définisse ce qui va apparaitre dans ce rapport globale 
// il faut améliorer le formulaire pour ajouter des cours et le connecter effectivement au backend pour que le cours soit immédiatement disponible une fois qu'il a été ajouté
// la card étudiant inscrit doit nous donner réellement le nombre d'étudiant inscrits sur la plateforme et lorsque l'on clique dessus on peut voir la liste des étudiants avec leurs informations, on peut les ajouter à un programme, modifier leurs informations autres que leurs identifiants par exemple on peut changer la filière mais pas le nom de l'étudiant
//la card cours aux catalogues nous permet de voir la liste des cours disponibles regroupés par catégories lorsqu'on clique dessus,
// la card session d'examen permet à ce que l'on puisse voir toutes les sessions d'examen en cours et passé, qu'on puisse en créer une nouvelle en créant le planning de celleci et cela peut etre partagé par message sur la plateforme
//taux de réussite nous permet de voir le taux de réussite des étudiants aux examens et lorsqu'on clique dessus on a plus de détail comme le taux de réussite par matière etc
//la card gestion des étudiants nous permet d'avoir accès au dossier complet d'un étudiant que ce soit toutes ces notes et l'ensemble des cours qu'il a suivi, etc
// la card gestion des cours nous permet de créer les emplois du temps, d'affecter tel ou telle professeur à un cours : la liste des professeurs disponibles et fournit par le module_rh, d'attribuer une salle à chaque cours 
// la card examen et planning permet de voir le calendrier des épreuves et des résultats : d'ailleurs c'est la sous-section transcript du module_academic qui publie les résultats des élèves et qui gére les complaintes liés à celle-ci

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
          <button
            className="btn primary"
            onClick={() => navigate("/courses", { state: { openCreateCourse: true } })}
          >
            + Créer un cours
          </button>
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
