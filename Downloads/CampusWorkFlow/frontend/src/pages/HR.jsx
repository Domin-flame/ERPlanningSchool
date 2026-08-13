import React, { useState } from "react";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import StatCard from "../components/StatCard.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Toast from "../components/Toast.jsx";
import Skeleton, { SkeletonList } from "../components/Skeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";
import api from "../api/client.js";

export default function HR() {
  const { user } = useAuth();
  const { employees, addEmployee, loading, errors } = useData();

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [modalEmp, setModalEmp] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Formulaire aligné avec EmployeeCreate du service RH
  const [authUserId, setAuthUserId] = useState("");
  const [matricule, setMatricule] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [position, setPosition] = useState("");
  const [hireDate, setHireDate] = useState(new Date().toISOString().split("T")[0]);
  const [baseSalary, setBaseSalary] = useState("");

  // Charger les demandes de congé au montage
  React.useEffect(() => {
    if (!user) return;
    setLeaveLoading(true);
    api.get("/hr/leave/requests")
      .then((res) => setLeaveRequests(Array.isArray(res.data) ? res.data : []))
      .catch(() => setLeaveRequests([]))
      .finally(() => setLeaveLoading(false));
  }, [user]);

  const resetForm = () => {
    setAuthUserId("");
    setMatricule("");
    setFirstName("");
    setLastName("");
    setEmpEmail("");
    setEmpPhone("");
    setPosition("");
    setBaseSalary("");
    setFormError("");
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!firstName || !lastName || !empEmail || !matricule || !position || !baseSalary) {
      setFormError("Tous les champs obligatoires (*) doivent être remplis.");
      return;
    }

    setSubmitting(true);
    try {
      await addEmployee({
        auth_user_id: authUserId || empEmail, // fallback sur l'email si pas d'ID auth
        matricule,
        first_name: firstName,
        last_name: lastName,
        email: empEmail,
        phone: empPhone || null,
        department,
        position,
        hire_date: hireDate,
        base_salary: parseFloat(baseSalary),
      });
      resetForm();
      setModalEmp(false);
      setToastMsg(`Employé ${firstName} ${lastName} enregistré avec succès.`);
      setToastShow(true);
    } catch (err) {
      setFormError(err.message || "Impossible d'enregistrer l'employé.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveLeave = async (id) => {
    try {
      await api.patch(`/hr/leave/requests/${id}`, { approve: true });
      setLeaveRequests((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "APPROVED" } : l))
      );
      setToastMsg("Demande de congé approuvée.");
      setToastShow(true);
    } catch {
      setToastMsg("Impossible d'approuver la demande.");
      setToastShow(true);
    }
  };

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Portail RH" }, { label: "Dashboard" }]} />
        <Skeleton height={38} width="50%" style={{ marginBottom: 16 }} />
        <div className="grid stats" style={{ marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={100} radius={12} />)}
        </div>
        <SkeletonList rows={5} height={60} />
      </div>
    );
  }

  const pendingLeaves = leaveRequests.filter((l) => l.status === "PENDING");

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Portail RH" }, { label: "Dashboard" }]} />

      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2>Ressources Humaines & Paie</h2>
            <span className="role-pill rh">Portail RH</span>
          </div>
          <p className="muted">Gestion du personnel, contrats, congés et bulletins de paie.</p>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={() => { resetForm(); setModalEmp(true); }}>
            + Ajouter un Employé
          </button>
        </div>
      </div>

      {errors.employees && (
        <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "10px 16px", borderRadius: 8, marginBottom: 16 }}>
          ⚠️ {errors.employees}
        </div>
      )}

      <div className="grid stats">
        <StatCard label="Effectif Total" value={employees.length} trend="Personnel actif" mark="👥" />
        <StatCard label="Demandes de Congé" value={pendingLeaves.length} trend="À valider" mark="📅" down={pendingLeaves.length > 0} />
        <StatCard label="Nouvelles Embauches" value="0" trend="Ce trimestre" mark="✨" />
        <StatCard label="Masse Salariale" value={
          employees.length > 0
            ? `${employees.reduce((acc, e) => acc + (e.base_salary || 0), 0).toLocaleString("fr-FR")} XAF/mois`
            : "—"
        } trend="Virement au 31" mark="💶" />
      </div>

      <div className="grid two-cols" style={{ marginTop: 24 }}>
        {/* Table employés */}
        <div className="panel table-wrap">
          <div className="panel-head">
            <h3>Liste des Employés</h3>
            <button className="btn ghost sm" onClick={() => { resetForm(); setModalEmp(true); }}>+ Ajouter</button>
          </div>
          {employees.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Aucun employé enregistré"
              description="Ajoutez le premier membre du personnel pour commencer."
              action={<button className="btn primary" onClick={() => setModalEmp(true)}>+ Ajouter un employé</button>}
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Employé</th>
                  <th>Département</th>
                  <th>Poste</th>
                  <th>Salaire de base</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id || e.matricule} className="row-hover">
                    <td><code className="code-tag">{e.matricule}</code></td>
                    <td>
                      <strong>{e.first_name} {e.last_name}</strong><br />
                      <small className="muted">{e.email}</small>
                    </td>
                    <td>{e.department}</td>
                    <td>{e.position}</td>
                    <td><strong>{e.base_salary?.toLocaleString("fr-FR")} XAF</strong></td>
                    <td><Badge status={e.is_active ? "Active" : "Inactive"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="grid" style={{ alignContent: "start", gap: 18 }}>
          {/* Demandes de congé */}
          <div className="panel card-interactive" style={{ padding: 20 }}>
            <h3>Demandes de Congé & Absences</h3>
            {leaveLoading ? (
              <SkeletonList rows={3} height={48} />
            ) : leaveRequests.length === 0 ? (
              <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>Aucune demande en cours.</p>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                {leaveRequests.map((l) => (
                  <div key={l.id} className="panel-row" style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                    <div className="soft-icon" style={{ width: 44, height: 44, fontSize: 16 }}>🗓️</div>
                    <div style={{ flex: 1 }}>
                      <strong>{l.employee_id}</strong>
                      <p className="muted" style={{ fontSize: 12, margin: "2px 0 0" }}>
                        {l.leave_type} • {l.start_date} → {l.end_date}
                      </p>
                    </div>
                    {l.status === "PENDING" ? (
                      <button className="btn primary sm" onClick={() => handleApproveLeave(l.id)}>
                        Approuver
                      </button>
                    ) : (
                      <span className={`badge ${l.status === "APPROVED" ? "success" : "danger"}`}>
                        {l.status === "APPROVED" ? "Validé" : "Refusé"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="panel card-interactive" style={{ padding: 20 }}>
            <h3>Actions RH Rapides</h3>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <button className="btn" style={{ justifyContent: "flex-start" }} onClick={() => { resetForm(); setModalEmp(true); }}>
                ➕ Ajouter un collaborateur
              </button>
              <button className="btn" style={{ justifyContent: "flex-start" }} onClick={() => {
                setToastMsg("Export du livre de paie en cours de développement.");
                setToastShow(true);
              }}>
                💶 Exporter le livre de paie mensuel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ajout Employé — aligné avec EmployeeCreate */}
      <Modal
        open={modalEmp}
        title="Nouveau Collaborateur"
        onClose={() => { setModalEmp(false); resetForm(); }}
        footer={
          <>
            <button className="btn" onClick={() => { setModalEmp(false); resetForm(); }}>Annuler</button>
            <button className="btn primary" onClick={handleCreateEmployee} disabled={submitting}>
              {submitting ? "Enregistrement…" : "Enregistrer l'employé"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateEmployee} className="form-grid">
          {formError && (
            <div style={{ gridColumn: "1/-1", color: "var(--danger)", fontSize: 13, background: "var(--danger-bg)", padding: "8px 12px", borderRadius: 6 }}>
              {formError}
            </div>
          )}

          <label>
            Prénom *
            <input className="field" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ex. Marc" required />
          </label>
          <label>
            Nom *
            <input className="field" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Ex. Dubois" required />
          </label>
          <label>
            Matricule *
            <input className="field" value={matricule} onChange={(e) => setMatricule(e.target.value)} placeholder="Ex. EMP-001" required />
          </label>
          <label>
            Email professionnel *
            <input type="email" className="field" value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} placeholder="Ex. m.dubois@campus.edu" required />
          </label>
          <label>
            Téléphone
            <input className="field" value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} placeholder="Ex. +237 6XX XXX XXX" />
          </label>
          <label>
            Département *
            <select className="field" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option>Computer Science</option>
              <option>Biology</option>
              <option>Mathematics</option>
              <option>Marketing & Communication</option>
              <option>Finance & Administration</option>
              <option>Human Resources</option>
            </select>
          </label>
          <label>
            Intitulé du poste *
            <input className="field" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Ex. Professeur Titulaire" required />
          </label>
          <label>
            Date d'embauche *
            <input type="date" className="field" value={hireDate} onChange={(e) => setHireDate(e.target.value)} required />
          </label>
          <label className="full">
            Salaire de base (XAF) *
            <input type="number" className="field" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} placeholder="Ex. 450000" required min="0" />
          </label>
          <label className="full" style={{ fontSize: 12, color: "var(--muted)" }}>
            ID Auth utilisateur (optionnel — laisser vide si non connu)
            <input className="field" value={authUserId} onChange={(e) => setAuthUserId(e.target.value)} placeholder="Rempli automatiquement si l'employé a un compte" />
          </label>
        </form>
      </Modal>

      <Toast show={toastShow} message={toastMsg} sub="Gestion RH" />
    </div>
  );
}
