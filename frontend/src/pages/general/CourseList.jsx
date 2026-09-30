import React from "react";

/**
 * Liste des cours du catalogue.
 * Props :
 *   courses  — cours à afficher
 *   modules  — modules (pour afficher le module parent)
 *   onDelete — (course) => void ; si absent, aucune action de suppression
 */
export default function CourseList({ courses = [], modules = [], onDelete }) {
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
              </div>
            </div>
            {onDelete && (
              <div className="actions">
                <button
                  className="btn ghost sm"
                  type="button"
                  style={{ color: "var(--danger)" }}
                  onClick={() => onDelete(course)}
                  aria-label={`Supprimer le cours ${course.code}`}
                >
                  Supprimer
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
