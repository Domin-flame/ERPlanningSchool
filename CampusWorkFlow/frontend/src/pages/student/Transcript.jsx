import React from "react";
import { Link } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Transcript() {
  const { user } = useAuth();
  const { studentOverview, loading } = useData();
  const courses = studentOverview?.courses || [];
  const summary = studentOverview?.summary || {};

  if (loading && !studentOverview) return <Skeleton height={240} radius={12} />;

  return (
    <div className="page-animate transcript-page">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Étudiant" }, { label: "Relevé de notes" }]} />
      <div className="page-head">
        <div><h2>Relevé de notes</h2><p className="muted">{user?.full_name} · {studentOverview?.semester?.name || "Semestre en cours"}</p></div>
        <div className="actions no-print"><Link className="btn" to="/student">Retour au dashboard</Link><button className="btn primary" onClick={() => window.print()}>Télécharger en PDF</button></div>
      </div>
      <div className="panel" style={{ padding: 20 }}>
        <div className="grid stats" style={{ marginBottom: 24 }}>
          <div><span className="muted">Moyenne générale</span><h3>{summary.average == null ? "—" : `${summary.average} / 20`}</h3></div>
          <div><span className="muted">Crédits validés</span><h3>{summary.validated_credits || 0}</h3></div>
          <div><span className="muted">Progression</span><h3>{courses.length ? `${Math.round(courses.reduce((total, course) => total + (course.progress || 0), 0) / courses.length)}%` : "—"}</h3></div>
        </div>
        {courses.length === 0 ? <p className="muted">Aucune note publiée pour ce semestre.</p> : courses.map((course) => (
          <section key={course.enrollment_id} style={{ marginBottom: 24 }}>
            <div className="panel-head"><div><h3>{course.code} — {course.title}</h3><p className="muted">{course.module_title || "Matière"} · {course.credits} crédits</p></div><strong>{course.average == null ? "Non noté" : `${course.average} / 20`}</strong></div>
            <div className="table-wrap"><table><thead><tr><th>Évaluation</th><th>Note</th><th>Coefficient</th><th className="no-print">Action</th></tr></thead><tbody>
              {course.grades.length === 0 ? <tr><td colSpan="4" className="muted">Aucune note publiée</td></tr> : course.grades.map((grade) => <tr key={grade.grade_id}><td>{grade.exam_type}</td><td>{grade.score} / {grade.max_score}</td><td>{grade.weight_percentage}%</td><td className="no-print"><Link className="btn" to={`/messages?subject=Réclamation note ${course.code}&grade=${grade.grade_id}`}>Revendiquer</Link></td></tr>)}
            </tbody></table></div>
          </section>
        ))}
      </div>
    </div>
  );
}