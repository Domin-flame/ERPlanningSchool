import React, { useCallback, useMemo, useState } from "react";
import { GraduationCap, Plus, Trash2, UserCheck } from "lucide-react";
import {
  Avatar, Button, Card, ConfirmModal, DataTable, EmptyState, Field, FormError, FormGrid,
  IconButton, Input, Modal, PageHeader, SearchInput, Select, StatCard, StatusBadge, Toolbar,
} from "../../components/ui";
import { academicApi } from "../../api/academic.js";
import { useApi } from "../../hooks/useApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDate, isoDate, matchesQuery } from "../../utils/format.js";
import { errorMessage } from "../../api/errors.js";

const STUDENT_STATUSES = ["Active", "Suspended", "Graduated", "Inactive"];
const STATUS_LABELS = {
  Active: { label: "Actif", tone: "success" },
  Suspended: { label: "Suspendu", tone: "danger" },
  Graduated: { label: "Diplômé", tone: "accent" },
  Inactive: { label: "Inactif", tone: "neutral" },
};

async function loadDirectory() {
  const [students, users, programs] = await Promise.all([
    academicApi.students.list(),
    academicApi.users.list(),
    academicApi.programs.list(),
  ]);
  const usersById = new Map(users.map((u) => [u.user_id, u]));
  const programsById = new Map(programs.map((p) => [p.program_id, p]));
  return {
    programs,
    users,
    students: students.map((s) => ({
      ...s,
      user: usersById.get(s.user_id) || null,
      program: programsById.get(s.program_id) || null,
    })),
  };
}

const EMPTY_FORM = { name: "", email: "", phone: "", matricule: "", program_id: "", status: "Active", enrollment_date: isoDate() };

function CreateStudentModal({ open, onClose, programs, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      // Le module académique distingue la personne (users) de son dossier étudiant.
      const user = await academicApi.users.create({ name: form.name.trim(), email: form.email.trim(), phone: form.phone || null, role: "Student" });
      await academicApi.students.create({
        matricule: form.matricule.trim(),
        enrollment_date: form.enrollment_date,
        status: form.status,
        program_id: Number(form.program_id),
        user_id: user.user_id,
      });
      toast.success(`${form.name} a été inscrit(e).`, "Étudiant créé");
      setForm(EMPTY_FORM);
      onCreated();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvel étudiant"
      description="Crée la fiche personne puis le dossier étudiant dans le module académique."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="submit" form="create-student" loading={pending}>Enregistrer</Button>
        </>
      }
    >
      <form id="create-student" className="stack" onSubmit={submit}>
        <FormError message={error} />
        <FormGrid>
          <Field label="Nom complet" required><Input value={form.name} onChange={update("name")} /></Field>
          <Field label="Email" required><Input type="email" value={form.email} onChange={update("email")} /></Field>
          <Field label="Téléphone"><Input value={form.phone} onChange={update("phone")} /></Field>
          <Field label="Matricule" required><Input value={form.matricule} onChange={update("matricule")} /></Field>
          <Field label="Programme" required>
            <Select value={form.program_id} onChange={update("program_id")} placeholder="Sélectionner…" options={programs.map((p) => ({ value: p.program_id, label: `${p.name} (${p.level})` }))} />
          </Field>
          <Field label="Date d'inscription" required><Input type="date" value={form.enrollment_date} onChange={update("enrollment_date")} /></Field>
          <Field label="Statut">
            <Select value={form.status} onChange={update("status")} options={STUDENT_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s].label }))} />
          </Field>
        </FormGrid>
      </form>
    </Modal>
  );
}

export default function StudentsPage() {
  const { role } = useAuth();
  const toast = useToast();
  const canManage = role === "academic";
  const { data, loading, error, reload } = useApi(loadDirectory);
  const [query, setQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const students = useMemo(() => data?.students || [], [data]);
  const programs = data?.programs || [];
  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          (!programFilter || String(s.program_id) === programFilter) &&
          matchesQuery(query, s.matricule, s.user?.name, s.user?.email, s.program?.name, s.status)
      ),
    [students, query, programFilter]
  );

  const changeStatus = useCallback(
    async (student, status) => {
      try {
        await academicApi.students.update(student.student_id, { status });
        toast.success("Statut mis à jour.");
        reload();
      } catch (err) {
        toast.error(errorMessage(err));
      }
    },
    [reload, toast]
  );

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await academicApi.students.remove(toDelete.student_id);
      toast.success("Dossier supprimé.");
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Étudiant",
      sortValue: (s) => s.user?.name,
      render: (s) => (
        <div className="cell-identity">
          <Avatar name={s.user?.name || s.matricule} size={32} />
          <div>
            <strong>{s.user?.name || "—"}</strong>
            <small>{s.user?.email}</small>
          </div>
        </div>
      ),
    },
    { key: "matricule", header: "Matricule" },
    { key: "program", header: "Programme", sortValue: (s) => s.program?.name, render: (s) => s.program ? `${s.program.name} · ${s.program.level}` : "—" },
    { key: "enrollment_date", header: "Inscription", render: (s) => formatDate(s.enrollment_date) },
    {
      key: "status",
      header: "Statut",
      render: (s) =>
        canManage ? (
          <select className="input input--inline" value={s.status} onChange={(e) => changeStatus(s, e.target.value)} aria-label="Changer le statut">
            {[...new Set([...STUDENT_STATUSES, s.status])].map((st) => (
              <option key={st} value={st}>{STATUS_LABELS[st]?.label || st}</option>
            ))}
          </select>
        ) : (
          <StatusBadge map={STATUS_LABELS} value={s.status} />
        ),
    },
    ...(canManage
      ? [{ key: "actions", header: "", sortable: false, align: "right", render: (s) => <IconButton icon={Trash2} label="Supprimer" size="sm" onClick={() => setToDelete(s)} /> }]
      : []),
  ];

  const active = students.filter((s) => s.status === "Active").length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Scolarité"
        title="Étudiants"
        description="Dossiers étudiants du module académique."
        actions={canManage && <Button icon={Plus} onClick={() => setCreating(true)}>Nouvel étudiant</Button>}
      />
      <div className="grid grid--stats">
        <StatCard label="Inscrits" icon={GraduationCap} value={students.length} loading={loading} unavailable={!!error} />
        <StatCard label="Actifs" icon={UserCheck} tone="teal" value={active} loading={loading} unavailable={!!error} />
        <StatCard label="Programmes" tone="violet" value={programs.length} loading={loading} unavailable={!!error} />
      </div>
      <Card padded={false}>
        <Toolbar end={<span className="muted">{filtered.length} résultat(s)</span>}>
          <SearchInput value={query} onChange={setQuery} placeholder="Nom, email, matricule…" />
          <Select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} placeholder="Tous les programmes" options={programs.map((p) => ({ value: String(p.program_id), label: p.name }))} aria-label="Filtrer par programme" />
        </Toolbar>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(s) => s.student_id}
          loading={loading}
          error={error}
          onRetry={reload}
          empty={<EmptyState icon={GraduationCap} title="Aucun étudiant" description={query ? "Aucun résultat pour cette recherche." : "Aucun dossier étudiant n'est encore enregistré."} />}
        />
      </Card>
      {canManage && <CreateStudentModal open={creating} onClose={() => setCreating(false)} programs={programs} onCreated={reload} />}
      <ConfirmModal
        open={!!toDelete}
        title="Supprimer ce dossier ?"
        message={`Le dossier de ${toDelete?.user?.name || toDelete?.matricule} sera définitivement supprimé.`}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
