import React, { useMemo, useState } from "react";
import { FileSpreadsheet, Pencil, Plus, UserMinus, Users } from "lucide-react";
import {
  Avatar, Badge, Button, Card, ConfirmModal, DataTable, EmptyState, Field, FormError, FormGrid, IconButton, Input,
  Modal, PageHeader, SearchInput, Select, Toolbar, AsyncContent,
} from "../../components/ui";
import { hrApi } from "../../api/hr.js";
import { useApi } from "../../hooks/useApi.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDate, formatDateTime, formatMoney, isoDate, matchesQuery } from "../../utils/format.js";
import { errorMessage } from "../../api/errors.js";

const loadEmployees = () => hrApi.employees();

const EMPTY = {
  auth_user_id: "", matricule: "", first_name: "", last_name: "", email: "", phone: "",
  department: "", position: "", hire_date: isoDate(), base_salary: "", cnps_number: "",
};

function EmployeeModal({ employee, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(() => (employee ? { ...EMPTY, ...employee, phone: employee.phone || "", cnps_number: employee.cnps_number || "" } : EMPTY));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError("");
    const common = {
      first_name: form.first_name.trim(), last_name: form.last_name.trim(), email: form.email.trim(),
      phone: form.phone || null, department: form.department.trim(), position: form.position.trim(),
      hire_date: form.hire_date, base_salary: Number(form.base_salary), cnps_number: form.cnps_number || null,
    };
    try {
      if (employee) await hrApi.updateEmployee(employee.id, common);
      else await hrApi.createEmployee({ ...common, auth_user_id: String(form.auth_user_id).trim(), matricule: form.matricule.trim() });
      toast.success(employee ? "Fiche mise à jour." : "Employé ajouté.");
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open size="lg" title={employee ? "Modifier la fiche" : "Nouvel employé"} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button type="submit" form="employee-form" loading={pending}>Enregistrer</Button></>}>
      <form id="employee-form" className="stack" onSubmit={submit}>
        <FormError message={error} />
        <FormGrid>
          <Field label="Prénom" required><Input value={form.first_name} onChange={update("first_name")} /></Field>
          <Field label="Nom" required><Input value={form.last_name} onChange={update("last_name")} /></Field>
          <Field label="Email" required><Input type="email" value={form.email} onChange={update("email")} /></Field>
          <Field label="Téléphone"><Input value={form.phone} onChange={update("phone")} /></Field>
          {!employee && <Field label="Matricule" required><Input value={form.matricule} onChange={update("matricule")} /></Field>}
          {!employee && <Field label="ID du compte (auth)" hint="Identifiant du compte utilisateur associé." required><Input value={form.auth_user_id} onChange={update("auth_user_id")} /></Field>}
          <Field label="Département" required><Input value={form.department} onChange={update("department")} /></Field>
          <Field label="Poste" required><Input value={form.position} onChange={update("position")} /></Field>
          <Field label="Date d'embauche" required><Input type="date" value={form.hire_date} onChange={update("hire_date")} /></Field>
          <Field label="Salaire de base (FCFA)" required><Input type="number" min="0" value={form.base_salary} onChange={update("base_salary")} /></Field>
          <Field label="N° CNPS"><Input value={form.cnps_number} onChange={update("cnps_number")} /></Field>
        </FormGrid>
      </form>
    </Modal>
  );
}

function PayrollModal({ employee, onClose }) {
  const toast = useToast();
  const now = new Date();
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [pending, setPending] = useState(false);
  const load = useMemo(() => () => hrApi.payslips(employee.id), [employee.id]);
  const { data, loading, error, reload } = useApi(load, { initialData: [] });

  const generate = async () => {
    setPending(true);
    try {
      await hrApi.generatePayslip(employee.id, Number(period.month), Number(period.year));
      toast.success("Bulletin généré.");
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const slips = [...(data || [])].sort((a, b) => b.period_year - a.period_year || b.period_month - a.period_month);

  return (
    <Modal open size="lg" title={`Paie — ${employee.first_name} ${employee.last_name}`} description={`Salaire de base : ${formatMoney(employee.base_salary)}`} onClose={onClose}>
      <div className="stack">
        <div className="row">
          <Select value={period.month} onChange={(e) => setPeriod((p) => ({ ...p, month: e.target.value }))} aria-label="Mois"
            options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i, 1).toLocaleDateString("fr-FR", { month: "long" }) }))} />
          <Input type="number" value={period.year} onChange={(e) => setPeriod((p) => ({ ...p, year: e.target.value }))} aria-label="Année" style={{ maxWidth: 110 }} />
          <Button icon={FileSpreadsheet} loading={pending} onClick={generate}>Générer le bulletin</Button>
        </div>
        <AsyncContent loading={loading} error={error} onRetry={reload} isEmpty={!slips.length} empty={<EmptyState compact title="Aucun bulletin" />}>
          <div className="table-scroll">
            <table className="table table--dense">
              <thead><tr><th>Période</th><th style={{ textAlign: "right" }}>Brut</th><th style={{ textAlign: "right" }}>Retenues</th><th style={{ textAlign: "right" }}>Net</th><th style={{ textAlign: "right" }}>Coût employeur</th><th>Généré</th></tr></thead>
              <tbody>
                {slips.map((s) => (
                  <tr key={s.id}>
                    <td>{String(s.period_month).padStart(2, "0")}/{s.period_year}</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(s.base_salary)}</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(s.total_employee_deductions)}</td>
                    <td style={{ textAlign: "right" }}><strong>{formatMoney(s.net_salary)}</strong></td>
                    <td style={{ textAlign: "right" }}>{formatMoney(s.total_employer_cost)}</td>
                    <td>{formatDateTime(s.generated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncContent>
      </div>
    </Modal>
  );
}

export default function EmployeesPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(loadEmployees, { initialData: [] });
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [toDeactivate, setToDeactivate] = useState(null);
  const [pending, setPending] = useState(false);

  const employees = useMemo(() => data || [], [data]);
  const departments = useMemo(() => [...new Set(employees.map((e) => e.department).filter(Boolean))].sort(), [employees]);
  const rows = useMemo(
    () => employees.filter((e) => (showInactive || e.is_active) && (!department || e.department === department) &&
      matchesQuery(query, e.first_name, e.last_name, e.email, e.matricule, e.position)),
    [employees, query, department, showInactive]
  );

  const deactivate = async () => {
    setPending(true);
    try {
      await hrApi.deactivateEmployee(toDeactivate.id);
      toast.success("Employé désactivé.");
      setToDeactivate(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const columns = [
    { key: "name", header: "Employé", sortValue: (e) => `${e.last_name} ${e.first_name}`, render: (e) => (
      <div className="cell-identity"><Avatar name={`${e.first_name} ${e.last_name}`} size={32} /><div><strong>{e.first_name} {e.last_name}</strong><small>{e.email}</small></div></div>
    ) },
    { key: "matricule", header: "Matricule" },
    { key: "department", header: "Département" },
    { key: "position", header: "Poste" },
    { key: "hire_date", header: "Embauche", render: (e) => formatDate(e.hire_date) },
    { key: "base_salary", header: "Salaire base", align: "right", render: (e) => formatMoney(e.base_salary) },
    { key: "is_active", header: "Statut", render: (e) => <Badge tone={e.is_active ? "success" : "neutral"} dot>{e.is_active ? "Actif" : "Inactif"}</Badge> },
    { key: "actions", header: "", sortable: false, align: "right", render: (e) => (
      <div className="row row--end">
        <IconButton icon={FileSpreadsheet} label="Paie" size="sm" onClick={() => setPayroll(e)} />
        <IconButton icon={Pencil} label="Modifier" size="sm" onClick={() => setEditing(e)} />
        {e.is_active && <IconButton icon={UserMinus} label="Désactiver" size="sm" onClick={() => setToDeactivate(e)} />}
      </div>
    ) },
  ];

  return (
    <div className="page">
      <PageHeader eyebrow="Ressources humaines" title="Personnel & paie" description="Fiches employés et bulletins de salaire."
        actions={<Button icon={Plus} onClick={() => setEditing("new")}>Nouvel employé</Button>} />
      <Card padded={false}>
        <Toolbar end={<label className="checkbox"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Inclure les inactifs</label>}>
          <SearchInput value={query} onChange={setQuery} placeholder="Nom, email, matricule…" />
          <Select value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Tous les départements" options={departments.map((d) => ({ value: d, label: d }))} aria-label="Département" />
        </Toolbar>
        <DataTable columns={columns} rows={rows} rowKey={(e) => e.id} loading={loading} error={error} onRetry={reload}
          empty={<EmptyState icon={Users} title="Aucun employé" description="Ajoutez un premier membre du personnel." />} />
      </Card>
      {editing && <EmployeeModal employee={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={reload} />}
      {payroll && <PayrollModal employee={payroll} onClose={() => setPayroll(null)} />}
      <ConfirmModal open={!!toDeactivate} title="Désactiver cet employé ?" message={`${toDeactivate?.first_name} ${toDeactivate?.last_name} ne figurera plus dans les effectifs actifs.`}
        confirmLabel="Désactiver" loading={pending} onConfirm={deactivate} onClose={() => setToDeactivate(null)} />
    </div>
  );
}
