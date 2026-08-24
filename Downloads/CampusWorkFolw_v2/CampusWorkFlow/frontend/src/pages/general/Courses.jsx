import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export default function Courses() {
  const location = useLocation();
  const { addCourse: contextAddCourse, deleteCourse: contextDeleteCourse } = useData();
  const { token } = useAuth();

  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("Tous");
  const [modal, setModal] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [credits, setCredits] = useState(3);
  const [moduleId, setModuleId] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.openCreateCourse) {
      setModal(true);
    }
  }, [location.state]);

  const loadDataFromDatabase = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [coursesRes, modulesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/academic/courses`, { headers }),
        fetch(`${API_BASE_URL}/academic/modules`, { headers }).catch(() => ({ ok: false })),
      ]);

      let coursesData = [];
      let modulesData = [];

      if (coursesRes.ok) {
        coursesData = await coursesRes.json();
      }

      if (modulesRes.ok) {
        modulesData = await modulesRes.json();
      }

      if (!modulesData.length && coursesData.length) {
        const derived = coursesData
          .map((course) => {
            const moduleValue = course.module_name || course.department || course.dept || course.module_id;
            if (!moduleValue) return null;
            return {
              id: course.module_id ?? moduleValue,
              code: course.module_code || course.code,
              title: course.module_name || moduleValue,
              name: course.module_name || moduleValue,
            };
          })
          .filter(Boolean);

        const seen = new Map();
        derived.forEach((item) => {
          if (!seen.has(String(item.id))) seen.set(String(item.id), item);
        });
        modulesData = Array.from(seen.values());
      }

      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setModules(Array.isArray(modulesData) ? modulesData : []);
    } catch (err) {
      console.error("Erreur de chargement des cours depuis la BDD :", err);
      setFetchError("Impossible de charger les données depuis la base de données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataFromDatabase();
  }, [token]);

  const departmentOptions = useMemo(() => {
    const set = new Set();

    courses.forEach((c) => {
      if (c.dept) set.add(c.dept);
      if (c.department) set.add(c.department);
      if (c.module_name) set.add(c.module_name);
    });

    modules.forEach((m) => {
      const label = m.name || m.title || m.module_name;
      if (label) set.add(label);
      if (m.department) set.add(m.department);
    });

    return Array.from(set);
  }, [courses, modules]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const searchText = `${c.title || ""} ${c.code || ""} ${c.teacher || ""} ${c.instructor || ""}`.toLowerCase();
      const matchesQuery = searchText.includes(query.toLowerCase());

      const courseDept =
        c.dept || c.department || c.module_name || (c.module_id ? String(c.module_id) : "");
      const matchesDept = deptFilter === "Tous" || courseDept === deptFilter;

      return matchesQuery && matchesDept;
    });
  }, [courses, query, deptFilter]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title || !code || !moduleId) {
      setFormError("Le titre, le code et le module parent sont obligatoires.");
      return;
    }

    setSubmitting(true);
    const payload = {
      code,
      title,
      credits: parseInt(credits, 10),
      module_id: parseInt(moduleId, 10),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/academic/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || "Erreur serveur lors de la création du cours.");
      }

      const createdCourse = await response.json();
      setCourses((prev) => [...prev, createdCourse]);

      if (contextAddCourse) {
        try {
          await contextAddCourse(payload);
        } catch {
          // ignore ; le serveur a déjà été mis à jour
        }
      }

      setTitle("");
      setCode("");
      setModuleId("");
      setCredits(3);
      setModal(false);
      setToastMsg(`Le cours "${title}" a été ajouté en base de données.`);
      setToastShow(true);
    } catch (err) {
      setFormError(err.message || "Impossible de créer le cours.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseCode) => {
    const idToDelete = courseId ?? courseCode;

    try {
      const response = await fetch(`${API_BASE_URL}/academic/courses/${idToDelete}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok || response.status === 204) {
        setCourses((prev) => prev.filter((c) => (c.course_id || c.id || c.code) !== idToDelete));
      } else {
        setCourses((prev) => prev.filter((c) => (c.course_id || c.id || c.code) !== idToDelete));
      }

      if (contextDeleteCourse) {
        try {
          await contextDeleteCourse(idToDelete);
        } catch {
          // no-op ; repli local déjà appliqué
        }
      }

      setToastMsg(`Cours ${courseCode || courseId} supprimé.`);
      setToastShow(true);
    } catch (err) {
      console.error("Erreur lors de la suppression du cours :", err);
      setCourses((prev) => prev.filter((c) => (c.course_id || c.id || c.code) !== idToDelete));
      setToastMsg(`Cours ${courseCode || courseId} retiré.`);
      setToastShow(true);
    }
  };

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Académique" }, { label: "Cours" }]} />
        <Skeleton height={38} width="50%" style={{ marginBottom: 16 }} />
        <div className="grid two-cols" style={{ gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={140} radius={12} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Académique" }, { label: "Cours" }]} />

      <div className="page-head">
        <div>
          <h2>Catalogue & Gestion des Cours</h2>
          <p className="muted">Programmes académiques, emploi du temps et enseignants affectés.</p>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={() => setModal(true)}>
            + Créer un cours
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="card" style={{ borderColor: "#dc2626", marginBottom: 16 }}>
          <p style={{ color: "#dc2626", fontSize: 13 }}>{fetchError}</p>
        </div>
      )}

      <div className="panel" style={{ padding: 16, marginBottom: 20 }}>
        <div className="filterbar">
          <input
            className="field"
            placeholder="Rechercher par intitulé, code ou enseignant..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select className="field" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="Tous">Tous les départements / modules</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {(query || deptFilter !== "Tous") && (
            <button
              className="btn ghost"
              onClick={() => {
                setQuery("");
                setDeptFilter("Tous");
              }}
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <div className="course-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--muted)" }}>
            <p style={{ fontSize: 40 }}>📚</p>
            <p>Aucun cours trouvé dans la base de données.</p>
          </div>
        ) : (
          filtered.map((c) => (
            <article className="card course-card card-interactive" key={c.course_id || c.id || c.code}>
              <div className="soft-icon" style={{ fontWeight: 800, fontSize: 18 }}>
                {(c.code || "??").slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3>{c.title}</h3>
                  <code className="code-tag">{c.code}</code>
                </div>
                <div className="course-meta" style={{ marginTop: 8 }}>
                  <span>📦 Module #{c.module_id ?? c.module_name ?? "N/A"}</span>
                  <span>🎓 {c.credits ?? 0} crédits ECTS</span>
                  {c.teacher && <span>👨‍🏫 {c.teacher}</span>}
                </div>
              </div>
              <div className="actions" style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                <button
                  className="btn ghost sm"
                  style={{ color: "var(--danger)" }}
                  onClick={() => handleDeleteCourse(c.course_id || c.id || c.code, c.code)}
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <Modal
        open={modal}
        title="Créer un Nouveau Cours"
        onClose={() => setModal(false)}
        footer={
          <>
            <button className="btn" onClick={() => setModal(false)}>
              Annuler
            </button>
            <button className="btn primary" onClick={handleCreateCourse} disabled={submitting}>
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateCourse} className="form-grid">
          {formError && (
            <div
              style={{
                gridColumn: "1/-1",
                padding: "8px 12px",
                background: "var(--danger-bg)",
                color: "var(--danger)",
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              {formError}
            </div>
          )}

          <label className="full">
            Intitulé du cours *
            <input
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Algorithmique Avancée"
              required
            />
          </label>

          <label>
            Code du cours *
            <input
              className="field"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CS201"
              required
            />
          </label>

          <label>
            Crédits ECTS
            <input
              type="number"
              className="field"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              min="1"
              max="30"
            />
          </label>

          <label className="full">
            Module parent (base de données) *
            {modules.length > 0 ? (
              <select
                className="field"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                required
              >
                <option value="">-- Sélectionner un module enregistré --</option>
                {modules.map((m) => {
                  const moduleValue = m.id ?? m.module_id ?? m.moduleId;
                  const label = m.name || m.title || m.module_name || `Module #${moduleValue}`;
                  const codeSuffix = m.code ? `[${m.code}] ` : "";
                  return (
                    <option key={String(moduleValue)} value={String(moduleValue)}>
                      {codeSuffix}
                      {label}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                type="number"
                className="field"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                placeholder="Exemple: 1"
                required
                min="1"
              />
            )}
          </label>
        </form>
      </Modal>

      <Toast show={toastShow} message={toastMsg} sub="Catalogue des Cours" />
    </div>
  );
}
