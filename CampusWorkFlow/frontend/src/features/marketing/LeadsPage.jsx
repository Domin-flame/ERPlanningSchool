import React, { useMemo, useState } from "react";
import { Plus, Target } from "lucide-react";
import { Button, Card, DataTable, EmptyState, Field, FormError, Input, Modal, PageHeader, SearchInput, Select, Tabs, Toolbar } from "../../components/ui";
import { marketingApi } from "../../api/finance.js";
import { errorMessage } from "../../api/errors.js";
import { useApiAll } from "../../hooks/useApi.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDate, matchesQuery } from "../../utils/format.js";
import { LEAD_STATUS } from "../../utils/status.js";

const SOURCES = { leads: () => marketingApi.leads(), campaigns: () => marketingApi.campaigns() };
const LEAD_SOURCES = ["Site web", "Réseaux sociaux", "Salon / Événement", "Recommandation", "Radio", "Autre"];

function LeadModal({ campaigns, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ nom: "", contact: "", source: "", id_campaign: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.nom.trim() || !form.contact.trim()) return setError("Nom et contact sont obligatoires.");
    setPending(true);
    setError("");
    try {
      await marketingApi.createLead({ nom: form.nom.trim(), contact: form.contact.trim(), source: form.source || null, id_campaign: form.id_campaign ? Number(form.id_campaign) : null });
      toast.success("Prospect ajouté.");
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
    <Modal open title="Nouveau prospect" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button type="submit" form="lead-form" loading={pending}>Enregistrer</Button></>}>
      <form id="lead-form" className="stack" onSubmit={submit}>
        <FormError message={error} />
        <Field label="Nom complet" required><Input value={form.nom} onChange={update("nom")} /></Field>
        <Field label="Contact" hint="Téléphone ou email" required><Input value={form.contact} onChange={update("contact")} /></Field>
        <Field label="Source"><Select value={form.source} onChange={update("source")} placeholder="Non renseignée" options={LEAD_SOURCES.map((s) => ({ value: s, label: s }))} /></Field>
        <Field label="Campagne"><Select value={form.id_campaign} onChange={update("id_campaign")} placeholder="Aucune" options={campaigns.map((c) => ({ value: c.id_campaign, label: c.nom }))} /></Field>
      </form>
    </Modal>
  );
}

export default function LeadsPage() {
  const toast = useToast();
  const { data, errors, loading, reload } = useApiAll(SOURCES);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(null);
  const leads = useMemo(() => data.leads || [], [data.leads]);
  const campaigns = useMemo(() => data.campaigns || [], [data.campaigns]);
  const campaignNames = useMemo(() => new Map(campaigns.map((c) => [c.id_campaign, c.nom])), [campaigns]);
  const rows = leads.filter((l) => (tab === "all" || l.statut === tab) && matchesQuery(query, l.nom, l.contact, l.source));

  const changeStatus = async (lead, status) => {
    setBusy(lead.id_lead);
    try {
      await marketingApi.setLeadStatus(lead.id_lead, status);
      toast.success(`Statut mis à jour : ${LEAD_STATUS[status]?.label || status}.`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const columns = [
    { key: "nom", header: "Prospect", render: (l) => <div><strong>{l.nom}</strong><small className="muted block">{l.contact}</small></div> },
    { key: "source", header: "Source", render: (l) => l.source || <span className="muted">—</span> },
    { key: "id_campaign", header: "Campagne", sortValue: (l) => campaignNames.get(l.id_campaign), render: (l) => campaignNames.get(l.id_campaign) || <span className="muted">—</span> },
    { key: "date_conversion", header: "Converti le", render: (l) => (l.date_conversion ? formatDate(l.date_conversion) : <span className="muted">—</span>) },
    { key: "statut", header: "Statut", render: (l) => (
      <select className={`input input--inline status-select status-select--${LEAD_STATUS[l.statut]?.tone || "neutral"}`} value={l.statut} disabled={busy === l.id_lead}
        onChange={(e) => changeStatus(l, e.target.value)} aria-label={`Statut de ${l.nom}`}>
        {Object.entries(LEAD_STATUS).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
      </select>
    ) },
  ];

  return (
    <div className="page">
      <PageHeader eyebrow="Marketing & admissions" title="Prospects (CRM)" description="Suivi des candidats potentiels, de la prise de contact à l'inscription."
        actions={<Button icon={Plus} onClick={() => setCreating(true)}>Nouveau prospect</Button>} />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: "all", label: "Tous", count: leads.length },
        ...Object.entries(LEAD_STATUS).map(([value, meta]) => ({ value, label: meta.label, count: leads.filter((l) => l.statut === value).length })),
      ]} />
      <Card padded={false}>
        <Toolbar><SearchInput value={query} onChange={setQuery} placeholder="Nom, contact, source…" /></Toolbar>
        <DataTable columns={columns} rows={rows} rowKey={(l) => l.id_lead} loading={loading} error={errors.leads} onRetry={reload}
          empty={<EmptyState icon={Target} title="Aucun prospect" description="Ajoutez vos premiers contacts issus des campagnes." />} />
      </Card>
      {creating && <LeadModal campaigns={campaigns} onClose={() => setCreating(false)} onSaved={reload} />}
    </div>
  );
}
