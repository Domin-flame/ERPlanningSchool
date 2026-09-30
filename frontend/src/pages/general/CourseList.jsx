import React from "react";

/**
 * Liste des cours du catalogue.
 * Props :
 *   courses  — cours à afficher
 *   modules  — modules (pour afficher le module parent)
 *   onDelete — (course) => void ; si absent, aucune action de suppression
 *   offeringCounts — Map course_id → nombre de sessions ouvertes (optionnel)
 *   onOpenOffering — (course) => void ; si présent, bouton « Ouvrir une session »
 */
export default function CourseList({ courses = [], modules = [], onDelete, offeringCounts, onOpenOffering }) {
  const moduleById = new Map(modules.map((module) => [module.module_id, module]));

  if (courses.length === 0) {
    return (
      <div className="panel empty" style={{ padding: "48px 16px", textAlign: "center", color: "var(--muted)" }}>
        <p style={{ fontSize: 40 }} aria-hidden="true">📚</p>
        <p>Aucun cours ne correspond à ces critères.</p>
      </div>
    );
  }

  return (
    <div className="course-list">
      {courses.map((course) => {
        const parentModule = moduleById.get(course.module_id);
        const moduleLabel = parentModule?.title || course.module_name || (course.module_id != null ? `#${course.module_id}` : "N/A");
        return (
          <article className="card course-card card-interactive" key={course.course_id ?? course.code}>
            <div className="soft-icon" aria-hidden="true" style={{ fontWeight: 800, fontSize: 18 }}>
              {(course.code || "??").slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3>{course.title}</h3>
                <code className="code-tag">{course.code}</code>
              </div>
              <div className="course-meta" style={{ marginTop: 8 }}>
                <span>📦 Module : {moduleLabel}</span>
                <span>🎓 {course.credits ?? 0} crédits ECTS</span>
                {course.teacher && <span>👨‍🏫 {course.teacher}</span>}
                {offeringCounts && (
                  <span>
                    🗓️ {offeringCounts.get(course.course_id)
                      ? `${offeringCounts.get(course.course_id)} session(s) ouverte(s)`
                      : "Aucune session ouverte — inscriptions impossibles"}
                  </span>
                )}
              </div>
            </div>
            {(onDelete || onOpenOffering) && (
              <div className="actions">
                {onOpenOffering && (
                  <button
                    className="btn sm"
                    type="button"
                    onClick={() => onOpenOffering(course)}
                    aria-label={`Ouvrir une session du cours ${course.code}`}
                  >
                    Ouvrir une session
                  </button>
                )}
                {onDelete && (
                  <button
                    className="btn ghost sm"
                    type="button"
                    style={{ color: "var(--danger)" }}
                    onClick={() => onDelete(course)}
                    aria-label={`Supprimer le cours ${course.code}`}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
