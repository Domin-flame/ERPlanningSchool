import React, { useState } from "react";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import StatCard from "../components/StatCard.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Toast from "../components/Toast.jsx";
import Skeleton, { SkeletonList } from "../components/Skeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useData } from "../context/DataContext.jsx";

export default function Students() {
  const { students, addStudent, deleteStudent, loading, errors } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Champs alignés avec StudentCreate : matricule, enrollment_date, status, program_id, user_id
  const [matricule, setMatricule] = useState("");
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [statusField, setStatusField] = useState("ACTIVE");
  const [programId, setProgramId] = useState("");
  const [userId, setUserId] = useState("");

  const filtered = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    const name = s.name || `${s.first_name || ""} ${s.last_name || ""}`;
    return (
      name.toLowerCase().includes(term) ||
      (s.matricule || s.id || "").toString().toLowerCase().includes(term)
    );
  });

  const resetForm = () => {
    setMatricule("");
    setEnrollmentDate(new Date().toISOString().split("T")[0]);
    setStatusField("ACTIVE");
    setProgramId("");
    setUserId("");
    setFormError("");
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!matricule || !programId || !userId) {
      setFormError("Matricule, ID programme et ID utilisateur sont obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      await addStudent({
        matricule,
        enrollment_date: enrollmentDate,
        status: statusField,
        program_id: parseInt(programId, 10),
        user_id: parseInt(userId, 10),
      });
      resetForm();
      setModalOpen(false);
      setToastMsg(`L'étudiant a été inscrit avec succès (matricule : ${matricule}).`);
      setToastShow(true);
    } catch (err) {
      setFormError(err.message || "Impossible d'inscrire l'étudiant.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Scolarité" }, { label: "Dossiers Étudiants" }]} />
        <Skeleton height={38} width="50%" style={{ marginBottom: 16 }} />
        <SkeletonList rows={6} height={56} />
      </div>
    );
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Scolarité" }, { label: "Dossiers Étudiants" }]} />

      <div className="page-head">
        <div>
          <h2>Gestion des Dossiers Étudiants</h2>
          <p className="muted">Inscriptions, statut académique, résultats et assiduité.</p>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={() => { resetForm(); setModalOpen(true); }}>
            + Nouvelle Inscription
          </button>
        </div>
      </div>

      {errors.students && (
        <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          ⚠️ {errors.students}
        </div>
      )}

      <div className="grid stats">
        <StatCard label="Étudiants Inscrits" value={students.length} trend="Total en base" mark="🎓" />
        <StatCard label="Actifs" value={students.filter(s => (s.status || "").toLowerCase().includes("activ") || s.status === "ACTIVE").length} trend="Statut ACTIVE" mark="✅" />
        <StatCard label="En attente" value={students.filter(s => (s.status || "").toLowerCase().includes("pend") || s.status === "PENDING").length} trend="Statut PENDING" mark="⏳" down />
        <StatCard label="Programmes" value="—" trend="Via le service académique" mark="📋" />
      </div>

      <div className="panel filterbar" style={{ marginTop: 24, marginBottom: 16 }}>
        <input
          className="field"
          placeholder="Rechercher par nom ou matricule…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="btn ghost" onClick={() => setSearchTerm("")}>Effacer</button>
        )}
      </div>

      <div className="panel table-wrap">
        {students.length === 0 ? (
          <EmptyState
            icon="🎓"
            title="Aucun étudiant inscrit"
            description="Inscrivez le premier étudiant pour commencer."
            action={<button className="btn primary" onClick={() => setModalOpen(true)}>+ Nouvelle Inscription</button>}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Matricule</th>
                <th>ID Utilisateur</th>
                <th>Programme</th>
                <th>Date d'inscription</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.student_id || s.matricule} className="row-hover">
                  <td><code className="code-tag">{s.matricule}</code></td>
                  <td>{s.user_id}</td>
                  <td>{s.program_id}</td>
                  <td>{s.enrollment_date}</td>
                  <td>
                    <Badge status={
                      s.status === "ACTIVE"   ? "Validé"  :
                      s.status === "INACTIVE" ? "Inactive":
                      "Pending"
                    } />
                  </td>
                  <td>
                    <button
                      className="btn ghost sm"
                      style={{ color: "var(--danger)" }}
                      onClick={async () => {
                        try {
                          await deleteStudent(s.student_id || s.id);
                          setToastMsg(`Étudiant ${s.matricule} retiré.`);
                          setToastShow(true);
                        } catch (err) {
                          setToastMsg(err.message || "Impossible de supprimer.");
                          setToastShow(true);
                        }
                      }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Inscription — aligné avec StudentCreate */}
      <Modal
        open={modalOpen}
        title="Inscription d'un Nouvel Étudiant"
        onClose={() => { setModalOpen(false); resetForm(); }}
        footer={
          <>
            <button className="btn" onClick={() => { setModalOpen(false); resetForm(); }}>Annuler</button>
            <button className="btn primary" onClick={handleAddStudent} disabled={submitting}>
              {submitting ? "Inscription…" : "Valider l'inscription"}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddStudent} className="form-grid">
          {formError && (
            <div style={{ gridColumn: "1/-1", padding: "8px 12px", background: "var(--danger-bg)", color: "var(--danger)", borderRadius: 6, fontSize: 13 }}>
              {formError}
            </div>
          )}
          <label>
            Matricule *
            <input
              className="field"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              placeholder="Ex. STU-2026-001"
              required
            />
          </label>
          <label>
            Statut *
            <select className="field" value={statusField} onChange={(e) => setStatusField(e.target.value)}>
              <option value="ACTIVE">Actif</option>
              <option value="PENDING">En attente</option>
              <option value="INACTIVE">Inactif</option>
              <option value="SUSPENDED">Suspendu</option>
            </select>
          </label>
          <label>
            Date d'inscription *
            <input
              type="date"
              className="field"
              value={enrollmentDate}
              onChange={(e) => setEnrollmentDate(e.target.value)}
              required
            />
          </label>
          <label>
            ID Programme * <span className="muted" style={{ fontSize: 11 }}>(numérique)</span>
            <input
              type="number"
              className="field"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              placeholder="Ex. 1"
              required
              min="1"
            />
          </label>
          <label className="full">
            ID Utilisateur * <span className="muted" style={{ fontSize: 11 }}>(depuis le service auth)</span>
            <input
              type="number"
              className="field"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Ex. 3"
              required
              min="1"
            />
          </label>
        </form>
      </Modal>

      <Toast show={toastShow} message={toastMsg} sub="Gestion des Étudiants" />
    </div>
  );
}
