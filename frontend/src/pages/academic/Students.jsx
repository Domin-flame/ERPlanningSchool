import React, { useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import StatCard from "../../components/StatCard.jsx";
import Badge from "../../components/Badge.jsx";
import Toast from "../../components/Toast.jsx";
import Skeleton, { SkeletonList } from "../../components/Skeleton.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";
import StudentForm from "./StudentForm.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { STUDENT_STATUSES } from "../../services/studentService.js";

export default function Students() {
  const {
    students,
    registerStudent,
    updateStudentStatus,
    deleteStudent,
    loading,
    errors,
  } = useData();

  const { user } = useAuth();
  // Seul le profil académique peut inscrire / modifier des étudiants (RBAC gateway).
  const canManage = user?.role === "academic";

  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

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
      (student.email || "").toLowerCase().includes(term) ||
      (student.matricule || student.id || "")
        .toString()
        .toLowerCase()
        .includes(term)
    );
  });

  // =========================
  // STATISTIQUES
  // =========================

  const activeStudents = students.filter(
    (student) =>
      student.status === "ACTIVE" ||
      (student.status || "")
        .toLowerCase()
        .includes("activ")
  ).length;

  const inactiveStudents = students.filter(
    (student) =>
      student.status === "INACTIVE" ||
      student.status === "SUSPENDED"
  ).length;

  const pendingStudents = students.filter(
    (student) =>
      student.status === "PENDING"
  ).length;

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="page-animate">

        <Breadcrumbs
          items={[
            { label: "Accueil" },
            { label: "Academic" },
            { label: "Étudiants" },
          ]}
        />

        <Skeleton
          height={38}
          width="50%"
          style={{ marginBottom: 16 }}
        />

        <SkeletonList
          rows={6}
          height={56}
        />

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
          { label: "Academic" },
          { label: "Étudiants" },
        ]}
      />

      {/* HEADER */}
      <div className="page-head">

        <div>
          <h2>Gestion des Étudiants</h2>

          <p className="muted">
            Suivi académique et gestion des dossiers étudiants.
          </p>
        </div>

        {canManage && (
          <div className="actions">
            <button className="btn primary" onClick={() => setModalOpen(true)}>
              + Ajouter un étudiant
            </button>
          </div>
        )}

      </div>

      {/* ERREUR */}
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
          label="Étudiants"
          value={students.length}
          trend="Total des étudiants"
          mark="🎓"
        />

        <StatCard
          label="Actifs"
          value={activeStudents}
          trend="Étudiants actifs"
          mark="✅"
        />

        <StatCard
          label="En attente"
          value={pendingStudents}
          trend="Statut PENDING"
          mark="⏳"
        />

        <StatCard
          label="Inactifs"
          value={inactiveStudents}
          trend="Inactifs ou suspendus"
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
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
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
            icon="🎓"
            title="Aucun étudiant"
            description="Aucun étudiant n'est actuellement disponible dans le module académique."
            action={
              canManage ? (
                <button className="btn primary" onClick={() => setModalOpen(true)}>
                  + Ajouter un étudiant
                </button>
              ) : null
            }
          />

        ) : (

          <table>

            <thead>

              <tr>
                <th>Matricule</th>
                <th>Étudiant</th>
                <th>Email</th>
                <th>Programme</th>
                <th>Date d'inscription</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {filtered.map((student) => {

                const studentName =
                  student.name ||
                  `${student.first_name || ""} ${
                    student.last_name || ""
                  }`.trim() ||
                  "Étudiant";

                return (
                  <tr
                    key={
                      student.student_id ||
                      student.matricule ||
                      student.id
                    }
                    className="row-hover"
                  >

                    {/* MATRICULE */}
                    <td>
                      <code className="code-tag">
                        {student.matricule || "—"}
                      </code>
                    </td>

                    {/* NOM */}
                    <td>
                      <strong>
                        {studentName}
                      </strong>
                    </td>

                    {/* USER ID */}
                    <td>
                      {student.email || "—"}
                    </td>

                    {/* PROGRAMME */}
                    <td>
                      {student.program_name || student.program_id || "—"}
                    </td>

                    {/* DATE */}
                    <td>
                      {student.enrollment_date || "—"}
                    </td>

                    {/* STATUT */}
                    <td>
                      {canManage ? (
                        <select
                          className="field"
                          style={{ minWidth: 130 }}
                          aria-label={`Statut de ${studentName}`}
                          value={(student.status || "").toUpperCase()}
                          onChange={async (e) => {
                            try {
                              await updateStudentStatus(student.student_id, e.target.value);
                              setToastMsg(`Statut de ${studentName} mis à jour.`);
                            } catch (err) {
                              setToastMsg(err.message);
                            }
                            setToastShow(true);
                          }}
                        >
                          {STUDENT_STATUSES.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge
                          status={
                            STUDENT_STATUSES.find((option) => option.value === (student.status || "").toUpperCase())?.label ||
                            student.status ||
                            "Inconnu"
                          }
                        />
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                        }}
                      >

                        <button
                          className="btn ghost sm"
                          onClick={() => {
                            setToastMsg(
                              `Dossier de ${studentName} — fonction de consultation à venir.`
                            );

                            setToastShow(true);
                          }}
                        >
                          Voir
                        </button>

                        {canManage && (
                        <button
                          className="btn ghost sm"
                          style={{
                            color: "var(--danger)",
                          }}
                          onClick={async () => {
                            if (!window.confirm(`Supprimer le dossier de ${studentName} ?`)) return;
                            try {
                              await deleteStudent(
                                student.student_id ||
                                  student.id
                              );

                              setToastMsg(
                                `Étudiant ${
                                  student.matricule ||
                                  studentName
                                } supprimé.`
                              );

                              setToastShow(true);

                            } catch (err) {

                              setToastMsg(
                                err.message ||
                                  "Impossible de supprimer l'étudiant."
                              );

                              setToastShow(true);
                            }

                          }}
                        >
                          Supprimer
                        </button>
                        )}

                      </div>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        )}

      </div>

      <Modal
        open={modalOpen}
        title="Inscrire un étudiant"
        onClose={() => setModalOpen(false)}
      >
        <StudentForm
          onSubmit={registerStudent}
          onCancel={() => setModalOpen(false)}
          onCreated={(_student, message) => {
            setModalOpen(false);
            setToastMsg(message);
            setToastShow(true);
          }}
        />
      </Modal>

      <Toast
        show={toastShow}
        message={toastMsg}
        sub="Module Academic"
      />

    </div>
  );
}