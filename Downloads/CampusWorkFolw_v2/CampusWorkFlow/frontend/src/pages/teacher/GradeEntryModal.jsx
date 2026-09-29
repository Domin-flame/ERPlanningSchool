import Modal from "../../components/Modal.jsx";

export default function GradeEntryModal({
  open,
  onClose,
  onSave,
  saving,
  error,
  offerings,
  courseOfferingId,
  onCourseChange,
  mode,
  onModeChange,
  examId,
  onExamChange,
  exams,
  newExamType,
  onNewExamTypeChange,
  newExamDate,
  onNewExamDateChange,
  newExamWeight,
  onNewExamWeightChange,
  newExamMaxScore,
  onNewExamMaxScoreChange,
  roster,
  enrollmentId,
  onEnrollmentChange,
  score,
  onScoreChange,
}) {
  return (
    <Modal
      open={open}
      title="Évaluer & Saisir une Note"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button className="btn primary" onClick={onSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Valider la Note"}
          </button>
        </>
      }
    >
      <form onSubmit={onSave} className="form-grid">
        {error && (
          <div className="full form-error" role="alert">
            {error}
          </div>
        )}

        <label className="full">
          Cours / Module *
          <select className="field" value={courseOfferingId} onChange={onCourseChange}>
            {offerings.map((offering) => (
              <option key={offering.course_offering_id} value={offering.course_offering_id}>
                {offering.course?.code} - {offering.name || offering.course?.title}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="full form-choice">
          <legend>Épreuve</legend>
          <label>
            <input
              type="radio"
              name="grade-mode"
              checked={mode === "existing"}
              onChange={() => onModeChange("existing")}
            />
            Épreuve existante
          </label>
          <label>
            <input
              type="radio"
              name="grade-mode"
              checked={mode === "new"}
              onChange={() => onModeChange("new")}
            />
            Nouvelle épreuve
          </label>
        </fieldset>

        {mode === "existing" ? (
          <label className="full">
            Épreuve / Évaluation *
            <select className="field" value={examId} onChange={onExamChange}>
              <option value="">— Sélectionner —</option>
              {exams.map((exam) => (
                <option key={exam.exam_id} value={exam.exam_id}>
                  {exam.exam_type} ({exam.exam_date}) — sur {Number(exam.max_score)}
                </option>
              ))}
            </select>
            {exams.length === 0 && (
              <span className="muted form-hint">
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
                onChange={(event) => onNewExamTypeChange(event.target.value)}
                placeholder="Examen final"
                required
              />
            </label>
            <label>
              Date de l'épreuve *
              <input
                type="date"
                className="field"
                value={newExamDate}
                onChange={(event) => onNewExamDateChange(event.target.value)}
                required
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
                onChange={(event) => onNewExamWeightChange(event.target.value)}
                required
              />
            </label>
            <label>
              Barème (note max) *
              <input
                type="number"
                min="1"
                className="field"
                value={newExamMaxScore}
                onChange={(event) => onNewExamMaxScoreChange(event.target.value)}
                required
              />
            </label>
          </>
        )}

        <label className="full">
          Étudiant concerné *
          <select className="field" value={enrollmentId} onChange={onEnrollmentChange}>
            <option value="">— Sélectionner —</option>
            {roster.map((student) => (
              <option key={student.enrollment_id} value={student.enrollment_id}>
                {student.name} {student.student?.matricule ? `(${student.student.matricule})` : ""}
              </option>
            ))}
          </select>
          {roster.length === 0 && (
            <span className="muted form-hint">Aucun étudiant actif inscrit sur ce cours.</span>
          )}
        </label>

        <label className="full">
          Note attribuée *
          <input
            type="number"
            step="0.25"
            min="0"
            max={mode === "new" ? newExamMaxScore || undefined : undefined}
            className="field"
            value={score}
            onChange={(event) => onScoreChange(event.target.value)}
            required
          />
        </label>
      </form>
    </Modal>
  );
}
