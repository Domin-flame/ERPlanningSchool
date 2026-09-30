// c'est cette page qui va permettre au module d'admission de créer un étudiant ou de valider les inscriptions initiés 

import React, { useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import StatCard from "../../components/StatCard.jsx";
import Badge from "../../components/Badge.jsx";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import Skeleton, { SkeletonList } from "../../components/Skeleton.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { useData } from "../../context/DataContext.jsx";

export default function Admissions() {
  const {
    students,
    addStudent,
    deleteStudent,
    loading,
    errors,
  } = useData();

  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // =========================
  // FORMULAIRE D'ADMISSION
  // =========================

  const [matricule, setMatricule] = useState("");
  const [enrollmentDate, setEnrollmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [statusField, setStatusField] = useState("PENDING");
  const [programId, setProgramId] = useState("");
  const [userId, setUserId] = useState("");

  // =========================
  // RESET FORMULAIRE
  // =========================

  const resetForm = () => {
    setMatricule("");
    setEnrollmentDate(new Date().toISOString().split("T")[0]);
    setStatusField("PENDING");
    setProgramId("");
    setUserId("");
    setFormError("");
  };

  // =========================
  // RECHERCHE
  // =========================

  const filtered = students.filter((student) => {
    const term = searchTerm.toLowerCase();

    const name =
      student.name ||
      `${student.first_name || ""} ${student.last_name || ""}`;

    return (
      name.toLowerCase().includes(term) ||
      (student.matricule || student.id || "")
        .toString()
        .toLowerCase()
        .includes(term)
    );
  });

  // =========================
  // CRÉATION D'UNE ADMISSION
  // =========================

  const handleAddStudent = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!matricule || !programId || !userId) {
      setFormError(
        "Matricule, ID programme et ID utilisateur sont obligatoires."
      );
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

      const createdMatricule = matricule;

      resetForm();
      setModalOpen(false);

      setToastMsg(
        `L'étudiant ${createdMatricule} a été admis avec succès.`
      );
      setToastShow(true);
    } catch (err) {
      setFormError(
        err.message || "Impossible d'enregistrer l'admission."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs
          items={[
            { label: "Accueil" },
            { label: "Admission" },
            { label: "Admissions" },
          ]}
        />

        <Skeleton
          height={38}
          width="50%"
          style={{ marginBottom: 16 }}
        />

        <SkeletonList rows={6} height={56} />
      </div>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <div className="page-animate">

      <Breadcrumbs
        items={[
          { label: "Accueil" },
          { label: "Admission" },
          { label: "Admissions" },
        ]}
      />

      {/* HEADER */}
      <div className="page-head">
        <div>
          <h2>Gestion des Admissions</h2>

          <p className="muted">
            Gestion des admissions et inscriptions des nouveaux étudiants.
          </p>
        </div>

        <div className="actions">
          <button
            className="btn primary"
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
          >
            + Nouvelle Admission
          </button>
        </div>
      </div>

      {/* ERREUR API */}
      {errors.students && (
        <div
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger)",
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          ⚠️ {errors.students}
        </div>
      )}

      {/* STATISTIQUES */}
      <div className="grid stats">

        <StatCard
          label="Dossiers"
          value={students.length}
          trend="Total des dossiers"
          mark="📁"
        />

        <StatCard
          label="En attente"
          value={
            students.filter(
              (s) => s.status === "PENDING"
            ).length
          }
          trend="Admissions en attente"
          mark="⏳"
        />

        <StatCard
          label="Admis"
          value={
            students.filter(
              (s) =>
                s.status === "ACTIVE" ||
                s.status === "ADMITTED"
            ).length
          }
          trend="Admissions validées"
          mark="✅"
        />

        <StatCard
          label="Inactifs"
          value={
            students.filter(
              (s) =>
                s.status === "INACTIVE" ||
                s.status === "SUSPENDED"
            ).length
          }
          trend="Dossiers non actifs"
          mark="⚠️"
          down
        />

      </div>

      {/* RECHERCHE */}
      <div
        className="panel filterbar"
        style={{
          marginTop: 24,
          marginBottom: 16,
        }}
      >
        <input
          className="field"
          placeholder="Rechercher par nom ou matricule…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {searchTerm && (
          <button
            className="btn ghost"
            onClick={() => setSearchTerm("")}
          >
            Effacer
          </button>
        )}
      </div>

      {/* TABLEAU */}
      <div className="panel table-wrap">

        {students.length === 0 ? (
          <EmptyState
            icon="📁"
            title="Aucune admission"
            description="Aucun dossier d'admission n'a encore été enregistré."
            action={
              <button
                className="btn primary"
                onClick={() => {
                  resetForm();
                  setModalOpen(true);
                }}
              >
                + Nouvelle Admission
              </button>
            }
          />
        ) : (
          <table>

            <thead>
              <tr>
                <th>Matricule</th>
                <th>ID Utilisateur</th>
                <th>Programme</th>
                <th>Date d'admission</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filtered.map((student) => (
                <tr
                  key={
                    student.student_id ||
                    student.matricule ||
                    student.id
                  }
                  className="row-hover"
                >

                  <td>
                    <code className="code-tag">
                      {student.matricule}
                    </code>
                  </td>

                  <td>
                    {student.user_id}
                  </td>

                  <td>
                    {student.program_id}
                  </td>

                  <td>
                    {student.enrollment_date}
                  </td>

                  <td>
                    <Badge
                      status={
                        student.status === "ACTIVE" ||
                        student.status === "ADMITTED"
                          ? "Validé"
                          : student.status === "INACTIVE"
                          ? "Inactive"
                          : student.status === "SUSPENDED"
                          ? "Suspendu"
                          : "Pending"
                      }
                    />
                  </td>

                  <td>
                    <button
                      className="btn ghost sm"
                      style={{
                        color: "var(--danger)",
                      }}
                      onClick={async () => {
                        try {
                          await deleteStudent(
                            student.student_id ||
                              student.id
                          );

                          setToastMsg(
                            `Dossier ${student.matricule} supprimé.`
                          );

                          setToastShow(true);
                        } catch (err) {
                          setToastMsg(
                            err.message ||
                              "Impossible de supprimer le dossier."
                          );

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

      {/* MODAL ADMISSION */}
      <Modal
        open={modalOpen}
        title="Nouvelle Admission"
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        footer={
          <>
            <button
              className="btn"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              Annuler
            </button>

            <button
              className="btn primary"
              onClick={handleAddStudent}
              disabled={submitting}
            >
              {submitting
                ? "Enregistrement…"
                : "Valider l'admission"}
            </button>
          </>
        }
      >

        <form
          onSubmit={handleAddStudent}
          className="form-grid"
        >

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

          {/* MATRICULE */}
          <label>
            Matricule *

            <input
              className="field"
              value={matricule}
              onChange={(e) =>
                setMatricule(e.target.value)
              }
              placeholder="Ex. STU-2026-001"
              required
            />
          </label>

          {/* STATUT */}
          <label>
            Statut *

            <select
              className="field"
              value={statusField}
              onChange={(e) =>
                setStatusField(e.target.value)
              }
            >
              <option value="PENDING">
                En attente
              </option>

              <option value="ACTIVE">
                Admis
              </option>

              <option value="INACTIVE">
                Inactif
              </option>

              <option value="SUSPENDED">
                Suspendu
              </option>
            </select>
          </label>

          {/* DATE */}
          <label>
            Date d'admission *

            <input
              type="date"
              className="field"
              value={enrollmentDate}
              onChange={(e) =>
                setEnrollmentDate(e.target.value)
              }
              required
            />
          </label>

          {/* PROGRAMME */}
          <label>
            ID Programme *
            <span
              className="muted"
              style={{ fontSize: 11 }}
            >
              {" "}
              (numérique)
            </span>

            <input
              type="number"
              className="field"
              value={programId}
              onChange={(e) =>
                setProgramId(e.target.value)
              }
              placeholder="Ex. 1"
              required
              min="1"
            />
          </label>

          {/* UTILISATEUR */}
          <label className="full">
            ID Utilisateur *
            <span
              className="muted"
              style={{ fontSize: 11 }}
            >
              {" "}
              (depuis le service auth)
            </span>

            <input
              type="number"
              className="field"
              value={userId}
              onChange={(e) =>
                setUserId(e.target.value)
              }
              placeholder="Ex. 3"
              required
              min="1"
            />
          </label>

        </form>

      </Modal>

      <Toast
        show={toastShow}
        message={toastMsg}
        sub="Module Admission"
      />

    </div>
  );
}