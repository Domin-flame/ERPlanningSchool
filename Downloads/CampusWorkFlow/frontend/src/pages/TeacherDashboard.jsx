import React, { useState } from "react";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import StatCard from "../components/StatCard.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Toast from "../components/Toast.jsx";
import Skeleton, { SkeletonList } from "../components/Skeleton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { courses, students, loading } = useData();

  const [modalGrade, setModalGrade] = useState(false);
  const [modalAttendance, setModalAttendance] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastShow, setToastShow] = useState(false);

  // Form State
  const [selectedCourse, setSelectedCourse] = useState("CS101");
  const [selectedStudent, setSelectedStudent] = useState("STU-2024-001");
  const [gradeValue, setGradeValue] = useState("16.5");
  const [examName, setExamName] = useState("Examen Partiel Semestre 2");

  const teacherEmail = user?.email || "";

  // Cours de cet enseignant : filtrage par email ou par teacher_id si disponible.
  // Le rôle "academic" voit tous les cours.
  const teacherCourses = user?.role === "academic"
    ? courses
    : courses.filter(
        (c) =>
          c.teacher_email === teacherEmail ||
          c.teacherEmail === teacherEmail ||
          c.teacher_id === user?.id
      );

  const handleSaveGrade = (e) => {
    e.preventDefault();
    setModalGrade(false);
    setToastMessage(`Note de ${gradeValue}/20 enregistrée avec succès pour ${examName}.`);
    setToastShow(true);
  };

  const handleSaveAttendance = (e) => {
    e.preventDefault();
    setModalAttendance(false);
    setToastMessage("Fiche d'appel et d'assiduité validée et envoyée au secrétariat.");
    setToastShow(true);
  };

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Espace Enseignant" }]} />
        <Skeleton height={40} width="60%" style={{ marginBottom: 20 }} />
        <div className="grid stats" style={{ marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={110} radius={12} />
          ))}
        </div>
        <SkeletonList rows={5} height={60} />
      </div>
    );
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Espace Enseignant" }]} />
      
      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2>Bonjour, {user?.full_name || user?.name || "Professeur"} 👋</h2>
            <span className="role-pill professeur">Portail Professeur</span>
          </div>
          <p className="muted">
            Gestion de vos cours, suivi des présences et saisie des évaluations.
          </p>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => setModalAttendance(true)}>
            📋 Faire l'appel
          </button>
          <button className="btn primary" onClick={() => setModalGrade(true)}>
            ✏️ Saisir des notes
          </button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid stats">
        <StatCard
          label="Cours Enseignés"
          value={teacherCourses.length || "3"}
          trend="Semestre en cours"
          mark="📚"
        />
        <StatCard
          label="Étudiants suivis"
          value="243"
          trend="+12 ce semestre"
          mark="🎓"
        />
        <StatCard
          label="Taux de présence"
          value="94.8%"
          trend="+1.2% ce mois"
          mark="✅"
        />
        <StatCard
          label="Copies à corriger"
          value="18"
          trend="Échéance vendredi"
          mark="📝"
        />
      </div>

      {/* Mes Cours & Planning */}
      <div className="grid two-cols" style={{ marginBottom: 24 }}>
        <div className="panel card-interactive">
          <div className="panel-head">
            <div>
              <h3>Mes Cours du Semestre</h3>
              <p className="muted">Vue rapide des modules attribués</p>
            </div>
            <span className="badge info">Actifs</span>
          </div>
          <div className="course-list-mini">
            {teacherCourses.map((c) => (
              <div key={c.code} className="course-item-row">
                <div className="course-icon">{c.code.substring(0, 2)}</div>
                <div style={{ flex: 1 }}>
                  <strong>{c.title}</strong>
                  <p className="muted" style={{ fontSize: 13, margin: "2px 0 0" }}>
                    {c.schedule} • {c.room}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge success">{c.studentsCount} étudiants</span>
                  <div className="progress-bar-mini" style={{ marginTop: 6 }}>
                    <div className="fill" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emploi du Temps du Jour */}
        <div className="panel card-interactive">
          <div className="panel-head">
            <h3>Emploi du Temps d'Aujourd'hui</h3>
            <span className="badge warning">Aujourd'hui</span>
          </div>
          <div className="timeline">
            <div className="timeline-item">
              <span className="time">09:00 - 11:00</span>
              <div className="content">
                <strong>CS101 - Algorithmique et Structures</strong>
                <p className="muted">Amphi A • 145 étudiants attendus</p>
              </div>
            </div>
            <div className="timeline-item active">
              <span className="time">14:00 - 16:00</span>
              <div className="content">
                <strong>BIO201 - Travaux Pratiques Génétique</strong>
                <p className="muted">Labo B-12 • Groupe 2</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="time">16:30 - 18:00</span>
              <div className="content">
                <strong>Permanence & Suivi de Projets</strong>
                <p className="muted">Bureau 304</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau de suivi des étudiants & notes */}
      <div className="section-title">
        <h3>Dernières Évaluations & Notes Saisies</h3>
        <button className="btn ghost" onClick={() => setModalGrade(true)}>
          + Saisir une nouvelle note
        </button>
      </div>

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Étudiant</th>
              <th>Matricule</th>
              <th>Cours</th>
              <th>Évaluation</th>
              <th>Note</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.slice(0, 5).map((stu, i) => (
              <tr key={stu.id} className="row-hover">
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="avatar-sm">{stu.avatar}</div>
                    <strong>{stu.name}</strong>
                  </div>
                </td>
                <td><code className="code-tag">{stu.id}</code></td>
                <td>{i % 2 === 0 ? "CS101" : "BIO201"}</td>
                <td>{i % 2 === 0 ? "Examen Partiel S2" : "Contrôle Continu TP"}</td>
                <td>
                  <strong style={{ color: "var(--brand-dark)" }}>
                    {(14 + i * 1.2).toFixed(1)} / 20
                  </strong>
                </td>
                <td>
                  <Badge status={i % 2 === 0 ? "Validé" : "En cours"} />
                </td>
                <td>
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      setSelectedStudent(stu.id);
                      setModalGrade(true);
                    }}
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Saisie des Notes */}
      <Modal
        open={modalGrade}
        title="Évaluer & Saisir une Note"
        onClose={() => setModalGrade(false)}
        footer={
          <>
            <button className="btn" onClick={() => setModalGrade(false)}>
              Annuler
            </button>
            <button className="btn primary" onClick={handleSaveGrade}>
              Valider la Note
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveGrade} className="form-grid">
          <label className="full">
            Cours / Module *
            <select
              className="field"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {teacherCourses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Épreuve / Évaluation *
            <input
              type="text"
              className="field"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. Examen Final"
            />
          </label>

          <label>
            Étudiant concerné *
            <select
              className="field"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
          </label>

          <label className="full">
            Note attribuée (/ 20) *
            <input
              type="number"
              step="0.25"
              min="0"
              max="20"
              className="field"
              value={gradeValue}
              onChange={(e) => setGradeValue(e.target.value)}
              required
            />
          </label>

          <label className="full">
            Commentaire pédagogique
            <textarea
              className="field"
              rows="3"
              placeholder="Appréciation sur le travail et les résultats..."
            />
          </label>
        </form>
      </Modal>

      {/* Modal Feuille de Présence */}
      <Modal
        open={modalAttendance}
        title="Fiche d'Appel & Présence"
        onClose={() => setModalAttendance(false)}
        footer={
          <>
            <button className="btn" onClick={() => setModalAttendance(false)}>
              Fermer
            </button>
            <button className="btn primary" onClick={handleSaveAttendance}>
              Soumettre la feuille d'appel
            </button>
          </>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <p className="muted">
            Cochez les étudiants absents pour le cours <strong>CS101 - Algorithmique</strong> de ce jour.
          </p>
        </div>
        <div className="attendance-list">
          {students.map((stu) => (
            <div key={stu.id} className="attendance-item">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="avatar-sm">{stu.avatar}</div>
                <div>
                  <strong>{stu.name}</strong>
                  <p className="muted" style={{ fontSize: 12, margin: 0 }}>{stu.program}</p>
                </div>
              </div>
              <label className="check-switch">
                <input type="checkbox" defaultChecked />
                <span>Présent</span>
              </label>
            </div>
          ))}
        </div>
      </Modal>

      <Toast show={toastShow} message={toastMessage} sub="Mise à jour enregistrée" />
    </div>
  );
}
