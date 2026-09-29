export default function CourseList({ courses, modules, onDelete }) {
  const moduleById = new Map(modules.map((module) => [module.module_id, module]));

  if (courses.length === 0) {
    return (
      <div className="panel empty" style={{ padding: "48px 24px", textAlign: "center" }}>
        <p className="muted">Aucun cours ne correspond à ces critères.</p>
      </div>
    );
  }

  return (
    <div className="course-list">
      {courses.map((course) => {
        const parentModule = moduleById.get(course.module_id);
        return (
          <article className="card course-card card-interactive" key={course.course_id}>
            <div className="soft-icon" aria-hidden="true" style={{ fontWeight: 800, fontSize: 18 }}>
              {(course.code || "??").slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3>{course.title}</h3>
                <code className="code-tag">{course.code}</code>
              </div>
              <div className="course-meta" style={{ marginTop: 8 }}>
                <span>Module : {parentModule?.title || `#${course.module_id}`}</span>
                <span>{course.credits} crédits ECTS</span>
              </div>
            </div>
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
          </article>
        );
      })}
    </div>
  );
}
