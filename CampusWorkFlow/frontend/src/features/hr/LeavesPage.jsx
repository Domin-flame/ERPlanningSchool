import React, { useMemo, useState } from "react";
import { Check, Plane, Plus, X } from "lucide-react";
import {
  Button, Card, DataTable, EmptyState, Field, FormError, FormGrid, Input, Modal, PageHeader, Select, StatusBadge, Tabs, Textarea,
} from "../../components/ui";
import { hrApi } from "../../api/hr.js";
import { useApiAll } from "../../hooks/useApi.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDate, isoDate } from "../../utils/format.js";
import { LEAVE_STATUS, LEAVE_TYPES } from "../../utils/status.js";
import { errorMessage } from "../../api/errors.js";

const SOURCES = { leaves: () => hrApi.leaveRequests(), employees: () => hrApi.employees() };

function LeaveModal({ employees, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ employee_id: "", leave_type: "annual", start_date: isoDate(), end_date: isoDate(), reason: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (form.end_date < form.start_date) return setError("La date de fin doit être postérieure à la date de début.");
    setPending(true);
    setError("");
    try {
      await hrApi.createLeaveRequest({ ...form, reason: form.reason || null });
      toast.success("Demande de congé enregistrée.");
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
    return undefined;
  };
  return (
    <Modal open title="Nouvelle demande de congé" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button type="submit" form="leave-form" loading={pending}>Enregistrer</Button></>}>
      <form id="leave-form" className="stack" onSubmit={submit}>
        <FormError message={error} />
        <Field label="Employé" required>
          <Select value={form.employee_id} onChange={update("employee_id")} placeholder="Sélectionner…"
            options={employees.filter((e) => e.is_active).map((e) => ({ value: e.id, label: `${e.first_name} ${e.last_name} — ${e.department}` }))} />
        </Field>
        <FormGrid>
          <Field label="Type" required><Select value={form.leave_type} onChange={update("leave_type")} options={Object.entries(LEAVE_TYPES).map(([value, label]) => ({ value, label }))} /></Field>
          <span />
          <Field label="Du" required><Input type="date" value={form.start_date} onChange={update("start_date")} /></Field>
          <Field label="Au" required><Input type="date" value={form.end_date} onChange={update("end_date")} /></Field>
        </FormGrid>
        <Field label="Motif"><Textarea rows={3} value={form.reason} onChange={update("reason")} /></Field>
      </form>
    </Modal>
  );
}

const days = (l) => Math.round((new Date(l.end_date) - new Date(l.start_date)) / 86400000) + 1;

export default function LeavesPage() {
  const toast = useToast();
  const { data, errors, loading, reload } = useApiAll(SOURCES);
  const [tab, setTab] = useState("pending");
  const [creating, setCreating] = useState(false);
  const [deciding, setDeciding] = useState(null);
  const employees = useMemo(() => data.employees || [], [data.employees]);
  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const leaves = data.leaves || [];
  const rows = tab === "all" ? leaves : leaves.filter((l) => l.status === tab);

  const decide = async (leave, approve) => {
    setDeciding(leave.id);
    try {
      await hrApi.decideLeave(leave.id, approve);
      toast.success(approve ? "Congé approuvé." : "Congé refusé.");
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeciding(null);
    }
  };

  const columns = [
    { key: "employee", header: "Employé", sortValue: (l) => byId.get(l.employee_id)?.last_name, render: (l) => {
      const e = byId.get(l.employee_id);
      return e ? <div><strong>{e.first_name} {e.last_name}</strong><small className="muted block">{e.department}</small></div> : "—";
    } },
    { key: "leave_type", header: "Type", render: (l) => LEAVE_TYPES[l.leave_type] || l.leave_type },
    { key: "start_date", header: "Période", render: (l) => `${formatDate(l.start_date)} → ${formatDate(l.end_date)}` },
    { key: "days", header: "Jours", align: "right", sortValue: days, render: days },
    { key: "reason", header: "Motif", render: (l) => l.reason || <span className="muted">—</span> },
    { key: "status", header: "Statut", render: (l) => <StatusBadge map={LEAVE_STATUS} value={l.status} /> },
    { key: "actions", header: "", sortable: false, align: "right", render: (l) => l.status === "pending" && (
      <div className="row row--end">
        <Button size="sm" variant="success" icon={Check} loading={deciding === l.id} onClick={() => decide(l, true)}>Approuver</Button>
        <Button size="sm" variant="ghost" icon={X} disabled={deciding === l.id} onClick={() => decide(l, false)}>Refuser</Button>
      </div>
    ) },
  ];

  return (
    <div className="page">
      <PageHeader eyebrow="Ressources humaines" title="Congés" description="Suivi et validation des demandes d'absence."
        actions={<Button icon={Plus} onClick={() => setCreating(true)} disabled={!employees.length}>Nouvelle demande</Button>} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: "pending", label: "En attente", count: leaves.filter((l) => l.status === "pending").length },
        { value: "approved", label: "Approuvés" },
        { value: "rejected", label: "Refusés" },
        { value: "all", label: "Tous", count: leaves.length },
      ]} />
      <Card padded={false}>
        <DataTable columns={columns} rows={rows} rowKey={(l) => l.id} loading={loading} error={errors.leaves} onRetry={reload}
          empty={<EmptyState icon={Plane} title="Aucune demande" />} />
      </Card>
      {creating && <LeaveModal employees={employees} onClose={() => setCreating(false)} onSaved={reload} />}
    </div>
  );
}
