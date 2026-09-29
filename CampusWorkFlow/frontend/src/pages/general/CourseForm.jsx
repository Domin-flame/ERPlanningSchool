import { useState } from "react";
import Modal from "../../components/Modal.jsx";

export default function CourseForm({ modules, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [credits, setCredits] = useState("3");
  const [moduleId, setModuleId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const parsedCredits = Number(credits);
    const parsedModuleId = Number(moduleId);
    if (!title.trim() || !code.trim() || !Number.isInteger(parsedModuleId) || parsedModuleId < 1) {
      setError("Le titre, le code et un module existant sont obligatoires.");
      return;
    }
    if (!Number.isInteger(parsedCredits) || parsedCredits < 1 || parsedCredits > 30) {
      setError("Les crédits doivent être un nombre entier entre 1 et 30.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        code: code.trim(),
        title: title.trim(),
        credits: parsedCredits,
        module_id: parsedModuleId,
      });
    } catch (submitError) {
      setError(submitError.message || "Impossible de créer le cours.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      title="Créer un cours"
      onClose={onClose}
      footer={
        <>
          <button className="btn" type="button" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn primary"
            type="submit"
            form="course-create-form"
            disabled={submitting || modules.length === 0}
          >
            {submitting ? "Enregistrement…" : "Enregistrer"}
          </button>
        </>
      }
    >
      <form id="course-create-form" onSubmit={handleSubmit} className="form-grid">
        {error && (
          <p className="full" role="alert" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
        {modules.length === 0 && (
          <p className="full muted" role="status">
            Aucun module n’est enregistré. Créez d’abord un module dans le catalogue académique.
          </p>
        )}
        <label className="full">
          Intitulé du cours *
          <input
            autoFocus
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>
        <label>
          Code du cours *
          <input
            className="field"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
        </label>
        <label>
          Crédits ECTS *
          <input
            type="number"
            className="field"
            value={credits}
            onChange={(event) => setCredits(event.target.value)}
            min="1"
            max="30"
            step="1"
            required
          />
        </label>
        <label className="full">
          Module parent *
          <select
            className="field"
            value={moduleId}
            onChange={(event) => setModuleId(event.target.value)}
            required
            disabled={modules.length === 0}
          >
            <option value="">Sélectionner un module enregistré</option>
            {modules.map((module) => (
              <option key={module.module_id} value={module.module_id}>
                {module.code} — {module.title}
              </option>
            ))}
          </select>
        </label>
      </form>
    </Modal>
  );
}
