import React, { useMemo, useState } from "react";
import { BookOpen, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Badge, Button, Card, ConfirmModal, DataTable, EmptyState, Field, FormError, FormGrid,
  IconButton, Input, Modal, PageHeader, SearchInput, Select, Tabs, Toolbar,
} from "../../components/ui";
import { academicApi } from "../../api/academic.js";
import { useApi } from "../../hooks/useApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { matchesQuery } from "../../utils/format.js";
import { errorMessage } from "../../api/errors.js";

async function loadCatalog() {
  const [courses, modules] = await Promise.all([academicApi.courses.list(), academicApi.modules.list()]);
  return { courses, modules };
}

function CourseModal({ open, course, modules, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(() => ({
    code: course?.code || "",
    title: course?.title || "",
    credits: course?.credits ?? 3,
    module_id: course?.module_id ? String(course.module_id) : "",
  }));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError("");
    const payload = { code: form.code.trim(), title: form.title.trim(), credits: Number(form.credits), module_id: Number(form.module_id) };
    try {
      if (course) await academicApi.courses.update(course.course_id, payload);
      else await academicApi.courses.create(payload);
      toast.success(course ? "Cours mis à jour." : "Cours créé.");
      onSaved();
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
      title={course ? "Modifier le cours" : "Nouveau cours"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="submit" form="course-form" loading={pending}>Enregistrer</Button>
        </>
      }
    >
      <form id="course-form" className="stack" onSubmit={submit}>
        <FormError message={error} />
        <FormGrid>
          <Field label="Code" required><Input value={form.code} onChange={update("code")} placeholder="INF101" /></Field>
          <Field label="Crédits" required><Input type="number" min="0" max="30" value={form.credits} onChange={update("credits")} /></Field>
        </FormGrid>
        <Field label="Intitulé" required><Input value={form.title} onChange={update("title")} /></Field>
        <Field label="Module (UE)" required>
          <Select value={form.module_id} onChange={update("module_id")} placeholder="Sélectionner…" options={modules.map((m) => ({ value: String(m.module_id), label: `${m.code} — ${m.title}` }))} />
        </Field>
      </form>
    </Modal>
  );
}

function ModuleModal({ open, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ code: "", title: "", credits_ects: 6 });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await academicApi.modules.create({ code: form.code.trim(), title: form.title.trim(), credits_ects: Number(form.credits_ects) });
      toast.success("Module créé.");
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Nouveau module (UE)" footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button type="submit" form="module-form" loading={pending}>Enregistrer</Button></>}>
      <form id="module-form" className="stack" onSubmit={submit}>
        <FormError message={error} />
        <FormGrid>
          <Field label="Code" required><Input value={form.code} onChange={update("code")} /></Field>
          <Field label="Crédits ECTS" required><Input type="number" min="0" value={form.credits_ects} onChange={update("credits_ects")} /></Field>
        </FormGrid>
        <Field label="Intitulé" required><Input value={form.title} onChange={update("title")} /></Field>
      </form>
    </Modal>
  );
}

export default function CoursesPage() {
  const { role } = useAuth();
  const toast = useToast();
  const canManage = role === "academic";
  const { data, loading, error, reload } = useApi(loadCatalog);
  const [tab, setTab] = useState("courses");
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | course
  const [creatingModule, setCreatingModule] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const modules = useMemo(() => data?.modules || [], [data]);
  const modulesById = useMemo(() => new Map(modules.map((m) => [m.module_id, m])), [modules]);
  const courses = useMemo(
    () =>
      (data?.courses || []).filter(
        (c) => (!moduleFilter || String(c.module_id) === moduleFilter) && matchesQuery(query, c.code, c.title, modulesById.get(c.module_id)?.title)
      ),
    [data, query, moduleFilter, modulesById]
  );

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await academicApi.courses.remove(toDelete.course_id);
      toast.success("Cours supprimé.");
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const courseColumns = [
    { key: "code", header: "Code", render: (c) => <Badge tone="brand">{c.code}</Badge> },
    { key: "title", header: "Intitulé", render: (c) => <strong>{c.title}</strong> },
    { key: "module", header: "Module", sortValue: (c) => modulesById.get(c.module_id)?.title, render: (c) => modulesById.get(c.module_id)?.title || "—" },
    { key: "credits", header: "Crédits", align: "right" },
    ...(canManage
      ? [{
          key: "actions", header: "", sortable: false, align: "right",
          render: (c) => (
            <div className="row row--end">
              <IconButton icon={Pencil} label="Modifier" size="sm" onClick={() => setEditing(c)} />
              <IconButton icon={Trash2} label="Supprimer" size="sm" onClick={() => setToDelete(c)} />
            </div>
          ),
        }]
      : []),
  ];

  const moduleColumns = [
    { key: "code", header: "Code", render: (m) => <Badge tone="violet">{m.code}</Badge> },
    { key: "title", header: "Intitulé", render: (m) => <strong>{m.title}</strong> },
    { key: "credits_ects", header: "ECTS", align: "right" },
    { key: "count", header: "Cours", align: "right", sortValue: (m) => (data?.courses || []).filter((c) => c.module_id === m.module_id).length, render: (m) => (data?.courses || []).filter((c) => c.module_id === m.module_id).length },
  ];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Offre de formation"
        title="Cours & modules"
        description="Catalogue pédagogique du module académique."
        actions={
          canManage && (
            <>
              <Button variant="secondary" icon={Layers} onClick={() => setCreatingModule(true)}>Nouveau module</Button>
              <Button icon={Plus} onClick={() => setEditing("new")} disabled={!modules.length}>Nouveau cours</Button>
            </>
          )
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "courses", label: "Cours", count: data?.courses?.length },
          { value: "modules", label: "Modules (UE)", count: modules.length },
        ]}
      />
      <Card padded={false}>
        {tab === "courses" ? (
          <>
            <Toolbar end={<span className="muted">{courses.length} cours</span>}>
              <SearchInput value={query} onChange={setQuery} placeholder="Code, intitulé…" />
              <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} placeholder="Tous les modules" options={modules.map((m) => ({ value: String(m.module_id), label: m.title }))} aria-label="Filtrer par module" />
            </Toolbar>
            <DataTable columns={courseColumns} rows={courses} rowKey={(c) => c.course_id} loading={loading} error={error} onRetry={reload}
              empty={<EmptyState icon={BookOpen} title="Aucun cours" description="Le catalogue est vide ou aucun cours ne correspond au filtre." />} />
          </>
        ) : (
          <DataTable columns={moduleColumns} rows={modules} rowKey={(m) => m.module_id} loading={loading} error={error} onRetry={reload}
            empty={<EmptyState icon={Layers} title="Aucun module" />} />
        )}
      </Card>
      {editing && (
        <CourseModal open course={editing === "new" ? null : editing} modules={modules} onClose={() => setEditing(null)} onSaved={reload} />
      )}
      {creatingModule && <ModuleModal open onClose={() => setCreatingModule(false)} onSaved={reload} />}
      <ConfirmModal open={!!toDelete} title="Supprimer ce cours ?" message={`${toDelete?.code} — ${toDelete?.title} sera retiré du catalogue.`}
        confirmLabel="Supprimer" loading={deleting} onConfirm={confirmDelete} onClose={() => setToDelete(null)} />
    </div>
  );
}
