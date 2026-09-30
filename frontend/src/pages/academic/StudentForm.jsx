import React, { useEffect, useState } from "react";
import { validatePassword } from "../../context/AuthContext.jsx";
import {
  STUDENT_STATUSES,
  createStudentAccount,
  fetchPrograms,
  getStudentErrorMessage,
} from "../../services/studentService.js";

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = () => ({
  name: "",
  email: "",
  phone: "",
  matricule: "",
  programId: "",
  enrollmentDate: today(),
  status: "ACTIVE",
  createAccount: true,
  password: "",
});

/**
 * Formulaire d'inscription d'un étudiant par le profil académique :
 * crée l'utilisateur + le dossier étudiant (academic-service) puis, en option,
 * le compte de connexion (auth-service) pour que l'étudiant accède à son portail.
 */
export default function StudentForm({ onSubmit, onCreated, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [programs, setPrograms] = useState([]);
  const [programsError, setProgramsError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPrograms()
      .then((items) => {
        if (!active) return;
        setPrograms(items);
        if (items.length === 1) setForm((prev) => ({ ...prev, programId: String(items[0].program_id) }));
      })
      .catch((err) => active && setProgramsError(getStudentErrorMessage(err, "Impossible de charger les programmes.")));
    return () => {
      active = false;
    };
  }, []);

  const update = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.matricule.trim() || !form.programId) {
      setError("Nom, email, matricule et programme sont obligatoires.");
      return;
    }
    if (form.createAccount) {
      const check = validatePassword(form.password);
      if (!check.valid) {
        setError(check.message);
        return;
      }
    }

    setSubmitting(true);
    try {
      const student = await onSubmit({
        name: form.name,
        email: form.email,
        phone: form.phone,
        matricule: form.matricule,
        programId: form.programId,
        enrollmentDate: form.enrollmentDate,
        status: form.status,
      });

      let accountNote = "";
      if (form.createAccount) {
        try {
          const account = await createStudentAccount({
            fullName: form.name,
            email: form.email,
            password: form.password,
          });
          accountNote = account.created
            ? " Compte de connexion créé."
            : ` ${account.reason}`;
        } catch (err) {
          accountNote = ` Dossier créé, mais le compte de connexion a échoué : ${getStudentErrorMessage(err)}`;
        }
      }

      setForm(emptyForm());
      onCreated?.(student, `Étudiant ${student.name || form.name} (${student.matricule}) inscrit.${accountNote}`);
    } catch (err) {
      setError(getStudentErrorMessage(err, "Impossible d'inscrire l'étudiant."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-grid" aria-label="Inscrire un étudiant">
      {(error || programsError) && (
        <div className="login-error full" role="alert">
          {error || programsError}
        </div>
      )}

      <label className="full">
        Nom complet *
        <input className="field" value={form.name} onChange={update("name")} placeholder="Ex. Awa Ndiaye" />
      </label>

      <label>
        Email *
        <input type="email" className="field" value={form.email} onChange={update("email")} placeholder="prenom.nom@campus.edu" />
      </label>

      <label>
        Téléphone
        <input className="field" value={form.phone} onChange={update("phone")} />
      </label>

      <label>
        Matricule *
        <input className="field" value={form.matricule} onChange={update("matricule")} placeholder="Ex. MAT-2026-001" />
      </label>

      <label>
        Programme *
        <select className="field" value={form.programId} onChange={update("programId")}>
          <option value="">— Choisir un programme —</option>
          {programs.map((program) => (
            <option key={program.program_id} value={program.program_id}>
              {program.name}{program.level ? ` (${program.level})` : ""}
            </option>
          ))}
        </select>
      </label>
      {!programsError && programs.length === 0 && (
        <p className="muted full" style={{ fontSize: 12, margin: 0 }}>
          Aucun programme n'existe encore dans le module académique.
        </p>
      )}

      <label>
        Date d'inscription
        <input type="date" className="field" value={form.enrollmentDate} onChange={update("enrollmentDate")} />
      </label>

      <label>
        Statut
        <select className="field" value={form.status} onChange={update("status")}>
          {STUDENT_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </label>

      <label className="full" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={form.createAccount} onChange={update("createAccount")} />
        Créer aussi le compte de connexion de l'étudiant
      </label>
      {form.createAccount && (
        <label className="full">
          Mot de passe initial *
          <input
            type="password"
            className="field"
            value={form.password}
            onChange={update("password")}
            autoComplete="new-password"
            placeholder="8 caractères min., majuscule, chiffre, symbole"
          />
        </label>
      )}

      <div className="full" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn ghost" onClick={() => onCancel?.()} disabled={submitting}>
          Annuler
        </button>
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? "Inscription…" : "Inscrire l'étudiant"}
        </button>
      </div>
    </form>
  );
}
