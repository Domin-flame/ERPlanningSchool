import React, { useEffect, useState } from "react";
import Modal from "../../components/Modal.jsx";
import {
  fetchOfferingFormOptions,
  getCourseErrorMessage,
  isCurrentSemester,
  pickDefaultSemester,
} from "../../services/courseService.js";

/**
 * Formulaire modal d'ouverture d'une offre (session) pour un cours.
 * Un étudiant ne peut s'inscrire qu'à une offre : cours + semestre + campus + enseignant.
 * Props :
 *   course   — cours concerné (course_id, code, title)
 *   onClose  — fermeture du modal
 *   onSubmit — async ({ name, courseId, semesterId, campusId, teacherId }) => void ; lève une erreur pour l'afficher
 */
export default function CourseOfferingForm({ course, onClose, onSubmit }) {
  const [options, setOptions] = useState({ semesters: [], campuses: [], teachers: [] });
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(`${course.code} — Groupe A`);
  const [semesterId, setSemesterId] = useState("");
  const [campusId, setCampusId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchOfferingFormOptions()
      .then((loaded) => {
        if (!mounted) return;
        setOptions(loaded);
        const defaultSemester = pickDefaultSemester(loaded.semesters);
        if (defaultSemester) setSemesterId(String(defaultSemester.semester_id));
        if (loaded.campuses.length === 1) setCampusId(String(loaded.campuses[0].campus_id));
        if (loaded.teachers.length === 1) setTeacherId(String(loaded.teachers[0].teacher_id));
      })
      .catch((loadError) => {
        if (mounted) setError(getCourseErrorMessage(loadError, "Impossible de charger les semestres, campus et enseignants."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const missing = [
    options.semesters.length === 0 && "semestre",
    options.campuses.length === 0 && "campus",
    options.teachers.length === 0 && "enseignant",
  ].filter(Boolean);
  const selectedSemester = options.semesters.find((semester) => String(semester.semester_id) === semesterId);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!name.trim() || !semesterId || !campusId || !teacherId) {
      setError("Le nom du groupe, le semestre, le campus et l’enseignant sont obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        courseId: course.course_id,
        semesterId: Number(semesterId),
        campusId: Number(campusId),
        teacherId: Number(teacherId),
      });
    } catch (submitError) {
      setError(submitError.message || "Impossible d’ouvrir cette session.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      title={`Ouvrir une session — ${course.code}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" type="button" onClick={onClose}>
            Plus tard
          </button>
          <button
            className="btn primary"
            type="submit"
            form="course-offering-form"
            disabled={submitting || loading || missing.length > 0}
          >
            {submitting ? "Ouverture…" : "Ouvrir aux inscriptions"}
          </button>
        </>
      }
    >
      <form id="course-offering-form" onSubmit={handleSubmit} className="form-grid">
        <p className="full muted">
          Les étudiants s’inscrivent à une session du cours « {course.title} » pour un semestre donné.
        </p>
        {error && (
          <p
            className="full"
            role="alert"
            style={{ padding: "8px 12px", background: "var(--danger-bg)", color: "var(--danger)", borderRadius: 6, fontSize: 13 }}
          >
            {error}
          </p>
        )}
        {loading && <p className="full muted" role="status">Chargement des semestres, campus et enseignants…</p>}
        {!loading && missing.length > 0 && (
          <p className="full muted" role="status">
            Impossible d’ouvrir une session : aucun {missing.join(", ")} n’est enregistré dans le service académique.
          </p>
        )}
        <label className="full">
          Nom du groupe *
          <input className="field" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="full">
          Semestre *
          <select
            className="field"
            value={semesterId}
            onChange={(event) => setSemesterId(event.target.value)}
            required
            disabled={loading}
          >
            <option value="">Sélectionner un semestre</option>
            {options.semesters.map((semester) => (
              <option key={semester.semester_id} value={semester.semester_id} disabled={semester.is_locked}>
                {semester.term_name} ({semester.start_date} → {semester.end_date}){semester.is_locked ? " — verrouillé" : ""}
              </option>
            ))}
          </select>
        </label>
        {selectedSemester && !isCurrentSemester(selectedSemester) && (
          <p className="full muted" role="note">
            Ce semestre n’est pas en cours : la session sera visible des étudiants à partir du {selectedSemester.start_date}.
          </p>
        )}
        <label>
          Campus *
          <select
            className="field"
            value={campusId}
            onChange={(event) => setCampusId(event.target.value)}
            required
            disabled={loading}
          >
            <option value="">Sélectionner un campus</option>
            {options.campuses.map((campus) => (
              <option key={campus.campus_id} value={campus.campus_id}>
                {campus.name}{campus.city ? ` — ${campus.city}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Enseignant *
          <select
            className="field"
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            required
            disabled={loading}
          >
            <option value="">Sélectionner un enseignant</option>
            {options.teachers.map((teacher) => (
              <option key={teacher.teacher_id} value={teacher.teacher_id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </label>
      </form>
    </Modal>
  );
}
