import React, { useState } from "react";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Toast from "../components/Toast.jsx";
import Skeleton from "../components/Skeleton.jsx";
import { useData } from "../context/DataContext.jsx";

// dans cette page il existe encore des données pré remplis mais il faut que les cours soient pris dans la base de données 
export default function Courses() {
  const { courses, addCourse, deleteCourse, loading } = useData();
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

  const filtered = courses.filter((c) => {
    const matchesQuery = `${c.title} ${c.code}`.toLowerCase().includes(query.toLowerCase());
    const matchesDept = deptFilter === "Tous" || c.dept === deptFilter || c.module_id === deptFilter;
    return matchesQuery && matchesDept;
  });

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!title || !code || !moduleId) {
      setFormError("Titre, code et ID module sont obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      await addCourse({
        code,
        title,
        credits: parseInt(credits, 10),
        module_id: parseInt(moduleId, 10),
      });
      setTitle("");
      setCode("");
      setModuleId("");
      setModal(false);
      setToastMsg(`Le cours "${title}" a été ajouté.`);
      setToastShow(true);
    } catch (err) {
      setFormError(err.message || "Impossible de créer le cours.");
    } finally {
      setSubmitting(false);
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

      <div className="panel" style={{ padding: 16, marginBottom: 20 }}>
        <div className="filterbar">
          <input
            className="field"
            placeholder="Rechercher par intitule, code ou enseignant..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="field"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="Tous">Tous les départements</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Biology">Biology</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Marketing">Marketing</option>
          </select>
          {(query || deptFilter !== "Tous") && (
            <button className="btn ghost" onClick={() => { setQuery(""); setDeptFilter("Tous"); }}>
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <div className="course-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--muted)" }}>
            <p style={{ fontSize: 40 }}>📚</p>
            <p>Aucun cours trouvé.</p>
          </div>
        ) : (
          filtered.map((c) => (
            <article className="card course-card card-interactive" key={c.course_id || c.code}>
              <div className="soft-icon" style={{ fontWeight: 800, fontSize: 18 }}>
                {(c.code || "??").slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3>{c.title}</h3>
                  <code className="code-tag">{c.code}</code>
                </div>
                <div className="course-meta" style={{ marginTop: 8 }}>
                  <span>📦 Module #{c.module_id}</span>
                  <span>🎓 {c.credits} crédits ECTS</span>
                </div>
              </div>
              <div className="actions" style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                <button
                  className="btn ghost sm"
                  style={{ color: "var(--danger)" }}
                  onClick={() => {
                    deleteCourse(c.course_id || c.code);
                    setToastMsg(`Cours ${c.code || c.title} supprimé.`);
                    setToastShow(true);
                  }}
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Modal Ajout Cours */}
      <Modal
        open={modal}
        title="Créer un Nouveau Cours"
        onClose={() => setModal(false)}
        footer={
          <>
            <button className="btn" onClick={() => setModal(false)}>Annuler</button>
            <button className="btn primary" onClick={handleCreateCourse} disabled={submitting}>
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateCourse} className="form-grid">
          {formError && (
            <div style={{ gridColumn: "1/-1", padding: "8px 12px", background: "var(--danger-bg)", color: "var(--danger)", borderRadius: 6, fontSize: 13 }}>
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
            ID Module parent * <span className="muted" style={{ fontSize: 11 }}>(numérique, depuis le catalogue des modules)</span>
            <input
              type="number"
              className="field"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              placeholder="e.g. 1"
              required
              min="1"
            />
          </label>
        </form>
      </Modal>

      <Toast show={toastShow} message={toastMsg} sub="Catalogue des Cours" />
    </div>
  );
}
