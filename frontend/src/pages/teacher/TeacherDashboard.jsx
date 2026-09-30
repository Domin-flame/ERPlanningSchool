import React, { useEffect, useMemo, useState, useCallback } from "react";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import StatCard from "../../components/StatCard.jsx";
import Badge from "../../components/Badge.jsx";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Skeleton, { SkeletonList } from "../../components/Skeleton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  fetchTeacherWorkspace,
  saveGrade,
  createExam,
  submitAttendanceForToday,
  latestExamFor,
  todayEnglishDayName,
  frenchDayLabel,
  formatTime,
  getInitials,
} from "../../services/teacherService.js";

const EMPTY_WORKSPACE = {
  teacher: null,
  academicUser: null,
  offerings: [],
  roster: [],
  exams: [],
  grades: [],
  sessions: [],
  attendances: [],
};

export default function TeacherDashboard() {
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState(EMPTY_WORKSPACE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [modalGrade, setModalGrade] = useState(false);
  const [modalAttendance, setModalAttendance] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastShow, setToastShow] = useState(false);

  // ---- État du formulaire "Saisir une note" ----
  const [gradeCourseOfferingId, setGradeCourseOfferingId] = useState("");
  const [gradeMode, setGradeMode] = useState("existing"); // "existing" | "new"
  const [gradeExamId, setGradeExamId] = useState("");
  const [newExamType, setNewExamType] = useState("Examen Partiel");
  const [newExamDate, setNewExamDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newExamWeight, setNewExamWeight] = useState("30");
  const [newExamMaxScore, setNewExamMaxScore] = useState("20");
  const [gradeEnrollmentId, setGradeEnrollmentId] = useState("");
  const [gradeScore, setGradeScore] = useState("");
  const [gradeSaving, setGradeSaving] = useState(false);
  const [gradeFormError, setGradeFormError] = useState("");

  // ---- État du formulaire "Faire l'appel" ----
  const [attendanceCourseOfferingId, setAttendanceCourseOfferingId] = useState("");
  const [attendanceState, setAttendanceState] = useState({}); // { enrollment_id: "Present"|"Absent"|"Late" }
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceFormError, setAttendanceFormError] = useState("");

  const loadWorkspace = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError("");
    try {
      const data = await fetchTeacherWorkspace(user);
      setWorkspace(data);
    } catch (err) {
      setLoadError(err.message || "Impossible de charger vos données depuis le module académique.");
      setWorkspace(EMPTY_WORKSPACE);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const { offerings, roster, exams, grades, sessions, attendances, teacher, academicUser } = workspace;

  // ---- Statistiques dérivées des vraies données ----
  const uniqueStudentsCount = useMemo(
    () => new Set(roster.filter((r) => r.status === "Active").map((r) => r.student?.student_id)).size,
    [roster]
  );

  const attendanceRateLabel = useMemo(() => {
    if (attendances.length === 0) return "—";
    const present = attendances.filter((a) => a.status === "Present").length;
    return `${((present / attendances.length) * 100).toFixed(1)}%`;
  }, [attendances]);

  const pendingGradesCount = useMemo(() => {
    const gradedByExam = new Map();
    for (const g of grades) {
      if (!gradedByExam.has(g.exam_id)) gradedByExam.set(g.exam_id, new Set());
      gradedByExam.get(g.exam_id).add(g.enrollment_id);
    }
    let pending = 0;
    for (const exam of exams) {
      const offeringRoster = roster.filter(
        (r) => r.course_offering_id === exam.course_offering_id && r.status === "Active"
      );
      const gradedSet = gradedByExam.get(exam.exam_id) || new Set();
      pending += offeringRoster.filter((r) => !gradedSet.has(r.enrollment_id)).length;
    }
    return pending;
  }, [exams, grades, roster]);

  const todaySchedule = useMemo(() => {
    const todayName = todayEnglishDayName();
    const items = [];
    for (const o of offerings) {
      for (const s of o.schedules) {
        if (s.day_of_week === todayName) {
          items.push({
            key: `${o.course_offering_id}-${s.schedule_id}`,
            offeringName: o.name || o.course?.title,
            start: s.start_time,
            end: s.end_time,
            room: s.room ? `${s.room.room_name || s.room.room_number}` : "Salle à confirmer",
          });
        }
      }
    }
    return items.sort((a, b) => a.start.localeCompare(b.start));
  }, [offerings]);

  // ---- Dernières notes saisies (les plus récentes en premier) ----
  const recentGrades = useMemo(() => {
    const enrollmentById = indexBy(roster, "enrollment_id");
    const examById = indexBy(exams, "exam_id");
    return [...grades]
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
      .slice(0, 5)
      .map((g) => {
        const enrollment = enrollmentById.get(g.enrollment_id);
        const exam = examById.get(g.exam_id);
        return {
          grade_id: g.grade_id,
          score: g.score,
          maxScore: exam?.max_score,
          examType: exam?.exam_type || "—",
          courseCode: enrollment?.courseCode || "—",
          studentName: enrollment?.name || "Étudiant inconnu",
          enrollmentId: g.enrollment_id,
          examId: g.exam_id,
        };
      });
  }, [grades, roster, exams]);

  function indexBy(list, key) {
    const map = new Map();
    for (const item of list) map.set(item[key], item);
    return map;
  }

  // ---- Roster filtré pour le cours sélectionné dans les modales ----
  const gradeCourseRoster = useMemo(
    () =>
      roster.filter(
        (r) => String(r.course_offering_id) === String(gradeCourseOfferingId) && r.status === "Active"
      ),
    [roster, gradeCourseOfferingId]
  );

  const gradeCourseExams = useMemo(
    () => exams.filter((ex) => String(ex.course_offering_id) === String(gradeCourseOfferingId)),
    [exams, gradeCourseOfferingId]
  );

  const attendanceRoster = useMemo(
    () =>
      roster.filter(
        (r) => String(r.course_offering_id) === String(attendanceCourseOfferingId) && r.status === "Active"
      ),
    [roster, attendanceCourseOfferingId]
  );

  // ---- Ouverture des modales avec présélection intelligente ----
  function openGradeModal(preselectOfferingId, preselectEnrollmentId) {
    const firstOffering = preselectOfferingId ?? offerings[0]?.course_offering_id ?? "";
    setGradeCourseOfferingId(firstOffering);
    setGradeMode("existing");
    setGradeExamId(latestExamFor(exams, firstOffering)?.exam_id ?? "");
    setGradeEnrollmentId(preselectEnrollmentId ?? "");
    setGradeScore("");
    setGradeFormError("");
    setModalGrade(true);
  }

  function openAttendanceModal() {
    const firstOffering = offerings[0]?.course_offering_id ?? "";
    setAttendanceCourseOfferingId(firstOffering);
    setAttendanceFormError("");
    const initialState = {};
    roster
      .filter((r) => r.course_offering_id === firstOffering && r.status === "Active")
      .forEach((r) => {
        initialState[r.enrollment_id] = "Present";
      });
    setAttendanceState(initialState);
    setModalAttendance(true);
  }

  function handleAttendanceCourseChange(offeringId) {
    setAttendanceCourseOfferingId(offeringId);
    const initialState = {};
    roster
      .filter((r) => String(r.course_offering_id) === String(offeringId) && r.status === "Active")
      .forEach((r) => {
        const existing = attendances.find(
          (a) => a.enrollment_id === r.enrollment_id
        );
        initialState[r.enrollment_id] = existing?.status || "Present";
      });
    setAttendanceState(initialState);
  }

  // ---- Soumission : Saisie de note ----
  async function handleSaveGrade(e) {
    e.preventDefault();
    setGradeFormError("");

    if (!gradeCourseOfferingId) {
      setGradeFormError("Veuillez sélectionner un cours.");
      return;
    }
    if (!gradeEnrollmentId) {
      setGradeFormError("Veuillez sélectionner un étudiant.");
      return;
    }
    const scoreNum = Number(gradeScore);
    if (Number.isNaN(scoreNum) || gradeScore === "") {
      setGradeFormError("Veuillez saisir une note valide.");
      return;
    }

    setGradeSaving(true);
    try {
      let examId = gradeExamId;

      if (gradeMode === "new") {
        const weightNum = Number(newExamWeight);
        const maxScoreNum = Number(newExamMaxScore);
        if (!newExamType.trim()) throw new Error("Le nom de l'épreuve est requis.");
        if (Number.isNaN(weightNum) || Number.isNaN(maxScoreNum)) {
          throw new Error("Le coefficient et le barème doivent être des nombres.");
        }
        const exam = await createExam({
          courseOfferingId: Number(gradeCourseOfferingId),
          examType: newExamType.trim(),
          examDate: newExamDate,
          weight: weightNum,
          maxScore: maxScoreNum,
        });
        examId = exam.exam_id;
      }

      if (!examId) {
        throw new Error("Veuillez sélectionner ou créer une épreuve.");
      }

      const existing = grades.find(
        (g) => g.exam_id === Number(examId) && g.enrollment_id === Number(gradeEnrollmentId)
      );

      await saveGrade({
        existingGradeId: existing?.grade_id,
        examId: Number(examId),
        enrollmentId: Number(gradeEnrollmentId),
        score: scoreNum,
        submittedBy: academicUser?.user_id,
      });

      setModalGrade(false);
      setToastMessage(`Note de ${scoreNum} enregistrée avec succès.`);
      setToastShow(true);
      await loadWorkspace();
    } catch (err) {
      setGradeFormError(
        err.response?.data?.detail || err.message || "Impossible d'enregistrer la note."
      );
    } finally {
      setGradeSaving(false);
    }
  }

  // ---- Soumission : Fiche d'appel ----
  async function handleSaveAttendance(e) {
    e.preventDefault();
    setAttendanceFormError("");

    if (!attendanceCourseOfferingId) {
      setAttendanceFormError("Veuillez sélectionner un cours.");
      return;
    }
    const offering = offerings.find(
      (o) => o.course_offering_id === Number(attendanceCourseOfferingId)
    );
    const scheduleToday = offering?.schedules.find(
      (s) => s.day_of_week === todayEnglishDayName()
    ) || offering?.schedules[0];

    if (!scheduleToday) {
      setAttendanceFormError("Ce cours n'a pas encore de créneau horaire configuré.");
      return;
    }

    const entries = Object.entries(attendanceState).map(([enrollment_id, status]) => ({
      enrollment_id: Number(enrollment_id),
      status,
    }));

    if (entries.length === 0) {
      setAttendanceFormError("Aucun étudiant inscrit et actif sur ce cours.");
      return;
    }

    setAttendanceSaving(true);
    try {
      await submitAttendanceForToday({
        scheduleId: scheduleToday.schedule_id,
        existingSessions: sessions,
        existingAttendances: attendances,
        entries,
      });
      setModalAttendance(false);
      setToastMessage("Fiche d'appel enregistrée et synchronisée avec le module académique.");
      setToastShow(true);
      await loadWorkspace();
    } catch (err) {
      setAttendanceFormError(
        err.response?.data?.detail || err.message || "Impossible d'enregistrer la fiche d'appel."
      );
    } finally {
      setAttendanceSaving(false);
    }
  }

  // ------------------------------------------------------------------
  // Rendu : chargement
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // Rendu : erreur de chargement (profil enseignant introuvable, API down, etc.)
  // ------------------------------------------------------------------
  if (loadError) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Espace Enseignant" }]} />
        <EmptyState
          icon="⚠️"
          title="Impossible de charger votre espace"
          description={loadError}
          action={loadWorkspace}
          actionText="Réessayer"
        />
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
          <button
            className="btn"
            onClick={openAttendanceModal}
            disabled={offerings.length === 0}
            title={offerings.length === 0 ? "Aucun cours attribué" : undefined}
          >
            📋 Faire l'appel
          </button>
          <button
            className="btn primary"
            onClick={() => openGradeModal()}
            disabled={offerings.length === 0}
            title={offerings.length === 0 ? "Aucun cours attribué" : undefined}
          >
            ✏️ Saisir des notes
          </button>
        </div>
      </div>

      {/* Cartes de statistiques (calculées à partir des données réelles) */}
      <div className="grid stats">
        <StatCard
          label="Cours Enseignés"
          value={offerings.length}
          trend={teacher?.speciality || "Semestre en cours"}
          mark="📚"
        />
        <StatCard
          label="Étudiants suivis"
          value={uniqueStudentsCount}
          trend="Inscriptions actives"
          mark="🎓"
        />
        <StatCard
          label="Taux de présence"
          value={attendanceRateLabel}
          trend={attendances.length ? `${attendances.length} pointages enregistrés` : "Aucune donnée pour l'instant"}
          mark="✅"
        />
        <StatCard
          label="Notes en attente"
          value={pendingGradesCount}
          trend={pendingGradesCount > 0 ? "À saisir" : "Tout est à jour"}
          mark="📝"
        />
      </div>

      {offerings.length === 0 ? (
        <EmptyState
          icon="📚"
          title="Aucun cours attribué"
          description="Vous n'avez actuellement aucun cours assigné dans le module académique. Contactez la Direction académique si cela ne semble pas correct."
        />
      ) : (
        <>
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
                {offerings.map((o) => (
                  <div key={o.course_offering_id} className="course-item-row">
                    <div className="course-icon">{(o.course?.code || "??").substring(0, 2)}</div>
                    <div style={{ flex: 1 }}>
                      <strong>{o.name || o.course?.title}</strong>
                      <p className="muted" style={{ fontSize: 13, margin: "2px 0 0" }}>
                        {o.schedules.length > 0
                          ? o.schedules
                              .map((s) => `${frenchDayLabel(s.day_of_week)} ${formatTime(s.start_time)}`)
                              .join(" • ")
                          : "Aucun créneau planifié"}
                        {o.schedules[0]?.room
                          ? ` • ${o.schedules[0].room.room_name || o.schedules[0].room.room_number}`
                          : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="badge success">{o.studentsCount} étudiants</span>
                      <div className="progress-bar-mini" style={{ marginTop: 6 }}>
                        <div className="fill" style={{ width: `${o.progress}%` }} />
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
              {todaySchedule.length === 0 ? (
                <p className="muted" style={{ padding: "8px 4px" }}>
                  Aucun cours planifié pour aujourd'hui.
                </p>
              ) : (
                <div className="timeline">
                  {todaySchedule.map((item, i) => (
                    <div key={item.key} className={`timeline-item ${i === 0 ? "active" : ""}`}>
                      <span className="time">
                        {formatTime(item.start)} - {formatTime(item.end)}
                      </span>
                      <div className="content">
                        <strong>{item.offeringName}</strong>
                        <p className="muted">{item.room}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tableau de suivi des étudiants & notes */}
          <div className="section-title">
            <h3>Dernières Évaluations & Notes Saisies</h3>
            <button className="btn ghost" onClick={() => openGradeModal()}>
              + Saisir une nouvelle note
            </button>
          </div>

          {recentGrades.length === 0 ? (
            <EmptyState
              icon="📝"
              title="Aucune note saisie"
              description="Les notes que vous enregistrerez pour vos étudiants apparaîtront ici."
              action={() => openGradeModal()}
              actionText="Saisir une note"
            />
          ) : (
            <div className="panel table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Cours</th>
                    <th>Évaluation</th>
                    <th>Note</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGrades.map((g) => (
                    <tr key={g.grade_id} className="row-hover">
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="avatar-sm">{getInitials(g.studentName)}</div>
                          <strong>{g.studentName}</strong>
                        </div>
                      </td>
                      <td><code className="code-tag">{g.courseCode}</code></td>
                      <td>{g.examType}</td>
                      <td>
                        <strong style={{ color: "var(--brand-dark)" }}>
                          {g.score} {g.maxScore ? `/ ${g.maxScore}` : ""}
                        </strong>
                      </td>
                      <td>
                        <Badge status="Validé" />
                      </td>
                      <td>
                        <button
                          className="btn ghost sm"
                          onClick={() => {
                            const offering = roster.find((r) => r.enrollment_id === g.enrollmentId);
                            openGradeModal(offering?.course_offering_id, g.enrollmentId);
                            setGradeExamId(g.examId);
                            setGradeMode("existing");
                            setGradeScore(String(g.score));
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
          )}
        </>
      )}

      {/* Modal Saisie des Notes */}
      <Modal
        open={modalGrade}
        title="Évaluer & Saisir une Note"
        onClose={() => setModalGrade(false)}
        footer={
          <>
            <button className="btn" onClick={() => setModalGrade(false)} disabled={gradeSaving}>
              Annuler
            </button>
            <button className="btn primary" onClick={handleSaveGrade} disabled={gradeSaving}>
              {gradeSaving ? "Enregistrement..." : "Valider la Note"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveGrade} className="form-grid">
          {gradeFormError && (
            <div className="full" style={{ color: "var(--danger, #d33)", fontSize: 13 }}>
              {gradeFormError}
            </div>
          )}

          <label className="full">
            Cours / Module *
            <select
              className="field"
              value={gradeCourseOfferingId}
              onChange={(e) => {
                const id = e.target.value;
                setGradeCourseOfferingId(id);
                setGradeEnrollmentId("");
                setGradeExamId(latestExamFor(exams, Number(id))?.exam_id ?? "");
              }}
            >
              {offerings.map((o) => (
                <option key={o.course_offering_id} value={o.course_offering_id}>
                  {o.course?.code} - {o.name || o.course?.title}
                </option>
              ))}
            </select>
          </label>

          <label className="full" style={{ display: "flex", gap: 16 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400 }}>
              <input
                type="radio"
                checked={gradeMode === "existing"}
                onChange={() => setGradeMode("existing")}
              />
              Épreuve existante
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400 }}>
              <input type="radio" checked={gradeMode === "new"} onChange={() => setGradeMode("new")} />
              Nouvelle épreuve
            </span>
          </label>

          {gradeMode === "existing" ? (
            <label className="full">
              Épreuve / Évaluation *
              <select
                className="field"
                value={gradeExamId}
                onChange={(e) => setGradeExamId(e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {gradeCourseExams.map((ex) => (
                  <option key={ex.exam_id} value={ex.exam_id}>
                    {ex.exam_type} ({ex.exam_date}) — sur {Number(ex.max_score)}
                  </option>
                ))}
              </select>
              {gradeCourseExams.length === 0 && (
                <span className="muted" style={{ fontSize: 12 }}>
                  Aucune épreuve enregistrée pour ce cours — créez-en une nouvelle.
                </span>
              )}
            </label>
          ) : (
            <>
              <label>
                Nom de l'épreuve *
                <input
                  type="text"
                  className="field"
                  value={newExamType}
                  onChange={(e) => setNewExamType(e.target.value)}
                  placeholder="e.g. Examen Final"
                />
              </label>
              <label>
                Date de l'épreuve *
                <input
                  type="date"
                  className="field"
                  value={newExamDate}
                  onChange={(e) => setNewExamDate(e.target.value)}
                />
              </label>
              <label>
                Coefficient (%) *
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="field"
                  value={newExamWeight}
                  onChange={(e) => setNewExamWeight(e.target.value)}
                />
              </label>
              <label>
                Barème (note max) *
                <input
                  type="number"
                  min="1"
                  className="field"
                  value={newExamMaxScore}
                  onChange={(e) => setNewExamMaxScore(e.target.value)}
                />
              </label>
            </>
          )}

          <label className="full">
            Étudiant concerné *
            <select
              className="field"
              value={gradeEnrollmentId}
              onChange={(e) => setGradeEnrollmentId(e.target.value)}
            >
              <option value="">— Sélectionner —</option>
              {gradeCourseRoster.map((r) => (
                <option key={r.enrollment_id} value={r.enrollment_id}>
                  {r.name} {r.student?.matricule ? `(${r.student.matricule})` : ""}
                </option>
              ))}
            </select>
            {gradeCourseRoster.length === 0 && (
              <span className="muted" style={{ fontSize: 12 }}>
                Aucun étudiant actif inscrit sur ce cours.
              </span>
            )}
          </label>

          <label className="full">
            Note attribuée *
            <input
              type="number"
              step="0.25"
              min="0"
              max={gradeMode === "new" ? newExamMaxScore || undefined : undefined}
              className="field"
              value={gradeScore}
              onChange={(e) => setGradeScore(e.target.value)}
              required
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
            <button className="btn" onClick={() => setModalAttendance(false)} disabled={attendanceSaving}>
              Fermer
            </button>
            <button className="btn primary" onClick={handleSaveAttendance} disabled={attendanceSaving}>
              {attendanceSaving ? "Enregistrement..." : "Soumettre la feuille d'appel"}
            </button>
          </>
        }
      >
        {attendanceFormError && (
          <div style={{ color: "var(--danger, #d33)", fontSize: 13, marginBottom: 12 }}>
            {attendanceFormError}
          </div>
        )}

        <label className="full" style={{ display: "block", marginBottom: 16 }}>
          Cours *
          <select
            className="field"
            value={attendanceCourseOfferingId}
            onChange={(e) => handleAttendanceCourseChange(e.target.value)}
          >
            {offerings.map((o) => (
              <option key={o.course_offering_id} value={o.course_offering_id}>
                {o.course?.code} - {o.name || o.course?.title}
              </option>
            ))}
          </select>
        </label>

        {attendanceRoster.length === 0 ? (
          <p className="muted">Aucun étudiant actif inscrit sur ce cours.</p>
        ) : (
          <div className="attendance-list">
            {attendanceRoster.map((r) => (
              <div key={r.enrollment_id} className="attendance-item">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="avatar-sm">{getInitials(r.name)}</div>
                  <div>
                    <strong>{r.name}</strong>
                    <p className="muted" style={{ fontSize: 12, margin: 0 }}>
                      {r.program?.name || r.student?.matricule || ""}
                    </p>
                  </div>
                </div>
                <label className="check-switch">
                  <input
                    type="checkbox"
                    checked={attendanceState[r.enrollment_id] === "Present"}
                    onChange={(e) =>
                      setAttendanceState((prev) => ({
                        ...prev,
                        [r.enrollment_id]: e.target.checked ? "Present" : "Absent",
                      }))
                    }
                  />
                  <span>{attendanceState[r.enrollment_id] === "Present" ? "Présent" : "Absent"}</span>
                </label>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Toast show={toastShow} message={toastMessage} sub="Mise à jour enregistrée" />
    </div>
  );
}