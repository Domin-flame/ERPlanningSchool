import Modal from "../../../components/Modal.jsx";
import { getInitials } from "../../../services/teacherService.js";

export default function AttendanceModal({
  open,
  onClose,
  onSave,
  saving,
  error,
  offerings,
  courseOfferingId,
  onCourseChange,
  roster,
  attendance,
  onAttendanceChange,
}) {
  return (
    <Modal
      open={open}
      title="Fiche d'Appel & Présence"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={saving}>
            Fermer
          </button>
          <button className="btn primary" onClick={onSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Soumettre la feuille d'appel"}
          </button>
        </>
      }
    >
      {error && (
        <div className="form-error form-error-spaced" role="alert">
          {error}
        </div>
      )}

      <label className="full form-label-spaced">
        Cours *
        <select className="field" value={courseOfferingId} onChange={onCourseChange}>
          {offerings.map((offering) => (
            <option key={offering.course_offering_id} value={offering.course_offering_id}>
              {offering.course?.code} - {offering.name || offering.course?.title}
            </option>
          ))}
        </select>
      </label>

      {roster.length === 0 ? (
        <p className="muted">Aucun étudiant actif inscrit sur ce cours.</p>
      ) : (
        <div className="attendance-list">
          {roster.map((student) => {
            const isPresent = attendance[student.enrollment_id] === "Present";
            return (
              <div key={student.enrollment_id} className="attendance-item">
                <div className="attendance-student">
                  <div className="avatar-sm">{getInitials(student.name)}</div>
                  <div>
                    <strong>{student.name}</strong>
                    <p className="muted attendance-student-detail">
                      {student.program?.name || student.student?.matricule || ""}
                    </p>
                  </div>
                </div>
                <label className="check-switch">
                  <input
                    type="checkbox"
                    checked={isPresent}
                    onChange={(event) =>
                      onAttendanceChange(student.enrollment_id, event.target.checked)
                    }
                  />
                  <span>{isPresent ? "Présent" : "Absent"}</span>
                </label>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
