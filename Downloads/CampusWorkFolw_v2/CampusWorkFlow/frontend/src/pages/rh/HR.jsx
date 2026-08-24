import React, { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import StatCard from "../../components/StatCard.jsx";
import Badge from "../../components/Badge.jsx";
import Modal from "../../components/Modal.jsx";
import Toast from "../../components/Toast.jsx";
import Skeleton, { SkeletonList } from "../../components/Skeleton.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import api from "../../api/client.js";

const ROLES = [
  { value: "professeur", label: "Professeur" },
  { value: "rh", label: "Ressources Humaines" },
  { value: "finance", label: "Finance" },
  { value: "marketing", label: "Marketing" },
  { value: "academic", label: "Direction / Académique" },
];

const DEPARTMENTS = [
  "Computer Science",
  "Biology",
  "Mathematics",
  "Marketing & Communication",
  "Finance & Administration",
  "Human Resources",
];

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("fr-FR")} XAF`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("fr-FR");
};

const getQuarterStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
};

export default function HR() {
  const { user } = useAuth();
  const { employees, addEmployee, loading, errors, refreshData } = useData();

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  const [modalEmp, setModalEmp] = useState(false);
  const [modalEdit, setModalEdit] = useState(false);
  const [modalRole, setModalRole] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [authUserId, setAuthUserId] = useState("");
  const [matricule, setMatricule] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [position, setPosition] = useState("");
  const [hireDate, setHireDate] = useState(new Date().toISOString().split("T")[0]);
  const [baseSalary, setBaseSalary] = useState("");

  const [editForm, setEditForm] = useState({});
  const [selectedRole, setSelectedRole] = useState("");

  const employeeById = useMemo(
    () => new Map(employees.map((employee) => [String(employee.id), employee])),
    [employees]
  );

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.is_active),
    [employees]
  );

  const pendingLeaves = useMemo(
    () => leaveRequests.filter((leave) => String(leave.status).toLowerCase() === "pending"),
    [leaveRequests]
  );

  const quarterHires = useMemo(() => {
    const quarterStart = getQuarterStart();
    return employees.filter((employee) => {
      if (!employee.hire_date) return false;
      const hireDateValue = new Date(employee.hire_date);
      return hireDateValue >= quarterStart && hireDateValue <= new Date();
    }).length;
  }, [employees]);

  const monthlyPayroll = useMemo(
    () => activeEmployees.reduce((total, employee) => total + Number(employee.base_salary || 0), 0),
    [activeEmployees]
  );

  const showToast = (message) => {
    setToastMsg(message);
    setToastShow(true);
    window.setTimeout(() => setToastShow(false), 3500);
  };

  const loadHRDashboard = async () => {
    if (!user) return;

    setLeaveLoading(true);
    setUsersLoading(true);

    const [leaveResult, usersResult, accountsResult] = await Promise.allSettled([
      api.get("/hr/leave/requests"),
      api.get("/auth/users", { params: { status_filter: "pending" } }),
      api.get("/auth/users"),
    ]);

    if (leaveResult.status === "fulfilled") {
      const data = leaveResult.value.data;
      setLeaveRequests(Array.isArray(data) ? data : []);
    } else {
      setLeaveRequests([]);
    }

    if (usersResult.status === "fulfilled") {
      const data = usersResult.value.data;
      setPendingUsers(Array.isArray(data) ? data : []);
    } else {
      setPendingUsers([]);
    }

    if (accountsResult.status === "fulfilled") {
      const data = accountsResult.value.data;
      setAccounts(Array.isArray(data) ? data : []);
    } else {
      setAccounts([]);
    }

    setLeaveLoading(false);
    setUsersLoading(false);
  };

  useEffect(() => {
    if (user) loadHRDashboard();
  }, [user]);

  const resetForm = () => {
    setAuthUserId("");
    setMatricule("");
    setFirstName("");
    setLastName("");
    setEmpEmail("");
    setEmpPhone("");
    setDepartment(DEPARTMENTS[0]);
    setPosition("");
    setHireDate(new Date().toISOString().split("T")[0]);
    setBaseSalary("");
    setFormError("");
  };

  const handleCreateEmployee = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!firstName || !lastName || !empEmail || !matricule || !position || !baseSalary) {
      setFormError("Tous les champs obligatoires (*) doivent être remplis.");
      return;
    }

    const salary = Number(baseSalary);
    if (!Number.isFinite(salary) || salary < 0) {
      setFormError("Le salaire doit être un nombre positif.");
      return;
    }

    setSubmitting(true);
    try {
      await addEmployee({
        auth_user_id: authUserId || empEmail,
        matricule,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: empEmail.trim(),
        phone: empPhone.trim() || null,
        department,
        position: position.trim(),
        hire_date: hireDate,
        base_salary: salary,
      });

      resetForm();
      setModalEmp(false);
      showToast(`Employé ${firstName} ${lastName} enregistré avec succès.`);
    } catch (error) {
      setFormError(error.message || "Impossible d'enregistrer l'employé.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveLeave = async (id, approve) => {
    try {
      await api.patch(`/hr/leave/requests/${id}`, { approve });
      await loadHRDashboard();
      showToast(approve ? "Demande de congé approuvée." : "Demande de congé refusée.");
    } catch (error) {
      showToast(error.response?.data?.detail || "Impossible de traiter la demande.");
    }
  };

  const openEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department: employee.department || DEPARTMENTS[0],
      position: employee.position || "",
      hire_date: employee.hire_date || "",
      base_salary: employee.base_salary ?? "",
      cnps_number: employee.cnps_number || "",
    });
    setFormError("");
    setModalEdit(true);
  };

  const handleUpdateEmployee = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!editForm.first_name || !editForm.last_name || !editForm.email || !editForm.position) {
      setFormError("Prénom, nom, email et poste sont obligatoires.");
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/hr/employees/${selectedEmployee.id}`, {
        ...editForm,
        base_salary: Number(editForm.base_salary),
      });
      setModalEdit(false);
      setSelectedEmployee(null);
      await refreshData();
      showToast("Fiche employé mise à jour.");
    } catch (error) {
      setFormError(error.response?.data?.detail || "Impossible de modifier cet employé.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateEmployee = async (employee) => {
    if (!window.confirm(`Désactiver ${employee.first_name} ${employee.last_name} ?`)) return;

    try {
      await api.delete(`/hr/employees/${employee.id}`);
      await refreshData();
      showToast("Employé désactivé. La fiche est conservée pour l'historique.");
    } catch (error) {
      showToast(error.response?.data?.detail || "Impossible de désactiver l'employé.");
    }
  };

  const handleUserAction = async (account, action, role = null) => {
    try {
      await api.patch(`/auth/users/${account.id}`, {
        action,
        ...(role ? { role } : {}),
      });
      await loadHRDashboard();

      const messages = {
        approve: "Compte validé. L'utilisateur peut maintenant se connecter.",
        reject: "Inscription refusée.",
        deactivate: "Compte désactivé.",
        activate: "Compte réactivé.",
        change_role: "Rôle utilisateur modifié.",
      };

      showToast(messages[action] || "Compte mis à jour.");
    } catch (error) {
      showToast(error.response?.data?.detail || "Impossible de modifier ce compte.");
    }
  };

  const openRoleModal = (account) => {
    setSelectedUser(account);
    setSelectedRole(account.role);
    setModalRole(true);
  };

  const saveRole = async () => {
    if (!selectedUser || !selectedRole) return;

    setSubmitting(true);
    try {
      await handleUserAction(selectedUser, "change_role", selectedRole);
      setModalRole(false);
      setSelectedUser(null);
    } finally {
      setSubmitting(false);
    }
  };

  const exportPayroll = () => {
    if (!activeEmployees.length) {
      showToast("Aucun employé actif à exporter.");
      return;
    }

    const headers = ["Matricule", "Nom", "Département", "Poste", "Salaire de base", "Statut"];
    const rows = activeEmployees.map((employee) => [
      employee.matricule,
      `${employee.first_name} ${employee.last_name}`,
      employee.department,
      employee.position,
      Number(employee.base_salary || 0),
      employee.is_active ? "Actif" : "Inactif",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `livre-salarial-${new Date().toISOString().slice(0, 7)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Livre salarial exporté.");
  };

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Portail RH" }, { label: "Dashboard" }]} />
        <Skeleton height={38} width="50%" style={{ marginBottom: 16 }} />
        <div className="grid stats" style={{ marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} height={100} radius={12} />
          ))}
        </div>
        <SkeletonList rows={5} height={60} />
      </div>
    );
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Portail RH" }, { label: "Dashboard" }]} />

      <div className="page-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2>Ressources Humaines & Paie</h2>
            <span className="role-pill rh">Portail RH</span>
          </div>
          <p className="muted">
            Pilotage du personnel, validation des comptes, mobilité interne, congés et masse salariale.
          </p>
        </div>

        <div className="actions">
          <button className="btn primary" onClick={() => { resetForm(); setModalEmp(true); }}>
            + Ajouter un employé
          </button>
        </div>
      </div>

      {errors.employees && (
        <div style={{
          background: "var(--danger-bg)",
          color: "var(--danger)",
          padding: "10px 16px",
          borderRadius: 8,
          marginBottom: 16,
        }}>
          ⚠️ {errors.employees}
        </div>
      )}

      <div className="grid stats">
        <StatCard label="Effectif actif" value={activeEmployees.length} trend={`${employees.length} fiches RH`} mark="👥" />
        <StatCard label="Congés à valider" value={pendingLeaves.length} trend="Demandes en attente" mark="📅" down={pendingLeaves.length > 0} />
        <StatCard label="Embauches du trimestre" value={quarterHires} trend="Depuis le début du trimestre" mark="✨" />
        <StatCard label="Masse salariale mensuelle" value={formatMoney(monthlyPayroll)} trend="Salaires de base actifs" mark="💶" />
      </div>

      <div className="grid two-cols" style={{ marginTop: 24 }}>
        <div className="panel table-wrap">
          <div className="panel-head">
            <div>
              <h3>Liste des employés</h3>
              <small className="muted">{employees.length} fiche(s) RH</small>
            </div>
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
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Employé</th>
                    <th>Département</th>
                    <th>Poste</th>
                    <th>Salaire</th>
                    <th>Statut</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id || employee.matricule} className="row-hover">
                      <td><code className="code-tag">{employee.matricule}</code></td>
                      <td>
                        <strong>{employee.first_name} {employee.last_name}</strong>
                        <br />
                        <small className="muted">{employee.email}</small>
                      </td>
                      <td>{employee.department}</td>
                      <td>{employee.position}</td>
                      <td><strong>{formatMoney(employee.base_salary)}</strong></td>
                      <td><Badge status={employee.is_active ? "Active" : "Inactive"} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          <button className="btn ghost sm" onClick={() => openEditEmployee(employee)}>Modifier</button>
                          {employee.is_active && (
                            <button className="btn ghost sm" onClick={() => handleDeactivateEmployee(employee)}>
                              Désactiver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid" style={{ alignContent: "start", gap: 18 }}>
          <div className="panel card-interactive" style={{ padding: 20 }}>
            <div className="panel-head" style={{ marginBottom: 4 }}>
              <div>
                <h3>Inscriptions à valider</h3>
                <small className="muted">Comptes non-étudiants en attente</small>
              </div>
              <span className="badge warning">{pendingUsers.length}</span>
            </div>

            {usersLoading ? (
              <SkeletonList rows={3} height={48} />
            ) : pendingUsers.length === 0 ? (
              <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                Aucune inscription en attente.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                {pendingUsers.map((account) => (
                  <div key={account.id} className="panel-row" style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                    <div className="soft-icon" style={{ width: 44, height: 44, fontSize: 15 }}>👤</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{account.full_name}</strong>
                      <p className="muted" style={{ fontSize: 12, margin: "2px 0" }}>
                        {account.email}
                      </p>
                      <small className="muted">
                        Rôle demandé : {ROLES.find((role) => role.value === account.role)?.label || account.role}
                        {" • "}
                        {formatDate(account.created_at)}
                      </small>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button className="btn primary sm" onClick={() => handleUserAction(account, "approve")}>Valider</button>
                      <button className="btn ghost sm" onClick={() => handleUserAction(account, "reject")}>Refuser</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel card-interactive" style={{ padding: 20 }}>
            <div className="panel-head">
              <div>
                <h3>Congés & absences</h3>
                <small className="muted">{pendingLeaves.length} demande(s) à traiter</small>
              </div>
            </div>

            {leaveLoading ? (
              <SkeletonList rows={3} height={48} />
            ) : leaveRequests.length === 0 ? (
              <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>Aucune demande enregistrée.</p>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                {leaveRequests.slice(0, 8).map((leave) => {
                  const employee = employeeById.get(String(leave.employee_id));
                  const status = String(leave.status || "").toLowerCase();

                  return (
                    <div key={leave.id} className="panel-row" style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                      <div className="soft-icon" style={{ width: 44, height: 44, fontSize: 16 }}>🗓️</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong>
                          {employee
                            ? `${employee.first_name} ${employee.last_name}`
                            : `Employé ${leave.employee_id}`}
                        </strong>
                        <p className="muted" style={{ fontSize: 12, margin: "2px 0" }}>
                          {leave.leave_type} • {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
                        </p>
                      </div>

                      {status === "pending" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn primary sm" onClick={() => handleApproveLeave(leave.id, true)}>Valider</button>
                          <button className="btn ghost sm" onClick={() => handleApproveLeave(leave.id, false)}>Refuser</button>
                        </div>
                      ) : (
                        <span className={`badge ${status === "approved" ? "success" : "danger"}`}>
                          {status === "approved" ? "Validé" : "Refusé"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="panel card-interactive" style={{ padding: 20 }}>
            <h3>Administration des comptes</h3>
            <p className="muted" style={{ fontSize: 13 }}>
              Modifiez le rôle d'un compte ou désactivez un accès sans supprimer les données RH.
            </p>

            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {accounts.filter((account) => account.id !== user?.id).slice(0, 6).map((account) => (
                <div key={account.id} className="panel-row" style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: 13 }}>{account.full_name}</strong>
                    <div className="muted" style={{ fontSize: 11 }}>{account.email}</div>
                  </div>
                  <span className={`badge ${account.account_status === "active" ? "success" : account.account_status === "pending" ? "warning" : "danger"}`}>
                    {account.role}
                  </span>
                  <button className="btn ghost sm" onClick={() => openRoleModal(account)}>Gérer</button>
                </div>
              ))}
              {accounts.filter((account) => account.id !== user?.id).length === 0 && (
                <p className="muted" style={{ fontSize: 13 }}>Aucun autre compte à administrer.</p>
              )}
            </div>

            <button className="btn" style={{ justifyContent: "flex-start", marginTop: 12 }} onClick={exportPayroll}>
              💶 Exporter le livre salarial mensuel
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={modalEmp}
        title="Nouveau collaborateur"
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

          <label>Prénom *<input className="field" value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></label>
          <label>Nom *<input className="field" value={lastName} onChange={(e) => setLastName(e.target.value)} required /></label>
          <label>Matricule *<input className="field" value={matricule} onChange={(e) => setMatricule(e.target.value)} placeholder="EMP-001" required /></label>
          <label>Email professionnel *<input type="email" className="field" value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} required /></label>
          <label>Téléphone<input className="field" value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} /></label>
          <label>Département *
            <select className="field" value={department} onChange={(e) => setDepartment(e.target.value)}>
              {DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Intitulé du poste *<input className="field" value={position} onChange={(e) => setPosition(e.target.value)} required /></label>
          <label>Date d'embauche *<input type="date" className="field" value={hireDate} onChange={(e) => setHireDate(e.target.value)} required /></label>
          <label className="full">Salaire de base (XAF) *<input type="number" className="field" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} min="0" step="1" required /></label>
          <label className="full">ID Auth utilisateur (optionnel)
            <input className="field" value={authUserId} onChange={(e) => setAuthUserId(e.target.value)} placeholder="ID du compte Auth si déjà créé" />
          </label>
        </form>
      </Modal>

      <Modal
        open={modalEdit}
        title="Modifier la fiche employé"
        onClose={() => { setModalEdit(false); setSelectedEmployee(null); }}
        footer={
          <>
            <button className="btn" onClick={() => setModalEdit(false)}>Annuler</button>
            <button className="btn primary" onClick={handleUpdateEmployee} disabled={submitting}>
              {submitting ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdateEmployee} className="form-grid">
          {formError && (
            <div style={{ gridColumn: "1/-1", color: "var(--danger)", fontSize: 13, background: "var(--danger-bg)", padding: "8px 12px", borderRadius: 6 }}>
              {formError}
            </div>
          )}

          <label>Prénom *<input className="field" value={editForm.first_name || ""} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} /></label>
          <label>Nom *<input className="field" value={editForm.last_name || ""} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} /></label>
          <label>Email professionnel *<input type="email" className="field" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></label>
          <label>Téléphone<input className="field" value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></label>
          <label>Département *
            <select className="field" value={editForm.department || ""} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}>
              {DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Poste *<input className="field" value={editForm.position || ""} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} /></label>
          <label>Date d'embauche<input type="date" className="field" value={editForm.hire_date || ""} onChange={(e) => setEditForm({ ...editForm, hire_date: e.target.value })} /></label>
          <label>Salaire de base<input type="number" min="0" className="field" value={editForm.base_salary ?? ""} onChange={(e) => setEditForm({ ...editForm, base_salary: e.target.value })} /></label>
          <label className="full">N° CNPS<input className="field" value={editForm.cnps_number || ""} onChange={(e) => setEditForm({ ...editForm, cnps_number: e.target.value })} /></label>
        </form>
      </Modal>

      <Modal
        open={modalRole}
        title="Gestion du rôle et des accès"
        onClose={() => { setModalRole(false); setSelectedUser(null); }}
        footer={
          <>
            <button className="btn" onClick={() => setModalRole(false)}>Annuler</button>
            <button className="btn primary" onClick={saveRole} disabled={submitting}>Enregistrer le rôle</button>
          </>
        }
      >
        {selectedUser && (
          <div className="form-grid">
            <div className="full">
              <strong>{selectedUser.full_name}</strong>
              <p className="muted" style={{ marginTop: 4 }}>{selectedUser.email}</p>
            </div>
            <label className="full">
              Nouveau rôle
              <select className="field" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                {ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            </label>
            <div className="full" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn ghost sm" onClick={() => handleUserAction(selectedUser, "deactivate")}>Désactiver le compte</button>
              {selectedUser.account_status !== "active" && (
                <button className="btn ghost sm" onClick={() => handleUserAction(selectedUser, "activate")}>Réactiver</button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Toast show={toastShow} message={toastMsg} sub="Gestion RH" />
    </div>
  );
}
