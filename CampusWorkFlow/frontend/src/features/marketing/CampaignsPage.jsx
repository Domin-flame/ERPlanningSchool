import React, { useMemo, useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { Badge, Button, Card, DataTable, EmptyState, Field, FormError, FormGrid, Input, Modal, PageHeader, Select } from "../../components/ui";
import { marketingApi } from "../../api/finance.js";
import { errorMessage } from "../../api/errors.js";
import { useApiAll } from "../../hooks/useApi.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDate, formatMoney, isoDate } from "../../utils/format.js";

const SOURCES = { campaigns: () => marketingApi.campaigns(), leads: () => marketingApi.leads() };
const CHANNELS = { SOCIAL: "Réseaux sociaux", EMAIL: "Email", RADIO: "Radio", EVENT: "Événement", SMS: "SMS", PRESSE: "Presse" };

function campaignState(c) {
  const today = isoDate();
  if (c.date_debut > today) return { label: "Planifiée", tone: "info" };
  if (c.date_fin && c.date_fin < today) return { label: "Terminée", tone: "neutral" };
  return { label: "En cours", tone: "success" };
}

function CampaignModal({ onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ nom: "", canal: "SOCIAL", date_debut: isoDate(), date_fin: "", budget: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.nom.trim()) return setError("Le nom est obligatoire.");
    if (form.date_fin && form.date_fin < form.date_debut) return setError("La date de fin doit suivre la date de début.");
    setPending(true);
    setError("");
    try {
      await marketingApi.createCampaign({ nom: form.nom.trim(), canal: form.canal, date_debut: form.date_debut, date_fin: form.date_fin || null, budget: Number(form.budget) || 0 });
      toast.success("Campagne créée.");
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
    <Modal open title="Nouvelle campagne" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button type="submit" form="campaign-form" loading={pending}>Créer</Button></>}>
      <form id="campaign-form" className="stack" onSubmit={submit}>
        <FormError message={error} />
        <Field label="Nom" required><Input value={form.nom} onChange={update("nom")} placeholder="Rentrée 2026 — Portes ouvertes" /></Field>
        <FormGrid>
          <Field label="Canal" required><Select value={form.canal} onChange={update("canal")} options={Object.entries(CHANNELS).map(([value, label]) => ({ value, label }))} /></Field>
          <Field label="Budget (FCFA)"><Input type="number" min="0" value={form.budget} onChange={update("budget")} /></Field>
          <Field label="Début" required><Input type="date" value={form.date_debut} onChange={update("date_debut")} /></Field>
          <Field label="Fin"><Input type="date" value={form.date_fin} onChange={update("date_fin")} /></Field>
        </FormGrid>
      </form>
    </Modal>
  );
}

export default function CampaignsPage() {
  const { data, errors, loading, reload } = useApiAll(SOURCES);
  const [creating, setCreating] = useState(false);
  const leadStats = useMemo(() => {
    const map = new Map();
    (data.leads || []).forEach((l) => {
      const s = map.get(l.id_campaign) || { total: 0, converted: 0 };
      s.total += 1;
      if (l.statut === "CONVERTI") s.converted += 1;
      map.set(l.id_campaign, s);
    });
    return map;
  }, [data.leads]);

  const columns = [
    { key: "nom", header: "Campagne", render: (c) => <strong>{c.nom}</strong> },
    { key: "canal", header: "Canal", render: (c) => CHANNELS[c.canal] || c.canal },
    { key: "date_debut", header: "Période", render: (c) => `${formatDate(c.date_debut)} → ${c.date_fin ? formatDate(c.date_fin) : "…"}` },
    { key: "state", header: "État", sortable: false, render: (c) => { const s = campaignState(c); return <Badge tone={s.tone} dot>{s.label}</Badge>; } },
    { key: "budget", header: "Budget", align: "right", sortValue: (c) => Number(c.budget), render: (c) => formatMoney(c.budget) },
    { key: "leads", header: "Prospects", align: "right", sortValue: (c) => leadStats.get(c.id_campaign)?.total || 0, render: (c) => {
      const s = leadStats.get(c.id_campaign);
      return s ? `${s.total} (${s.converted} conv.)` : "0";
    } },
    { key: "cost", header: "Coût / conversion", align: "right", sortable: false, render: (c) => {
      const s = leadStats.get(c.id_campaign);
      return s?.converted ? formatMoney(Number(c.budget) / s.converted) : <span className="muted">—</span>;
    } },
  ];

  return (
    <div className="page">
      <PageHeader eyebrow="Marketing & admissions" title="Campagnes" description="Canaux d'acquisition, budgets et performance."
        actions={<Button icon={Plus} onClick={() => setCreating(true)}>Nouvelle campagne</Button>} />
      <Card padded={false}>
        <DataTable columns={columns} rows={data.campaigns || []} rowKey={(c) => c.id_campaign} loading={loading} error={errors.campaigns} onRetry={reload}
          empty={<EmptyState icon={Megaphone} title="Aucune campagne" description="Créez une campagne pour y rattacher des prospects." />} />
      </Card>
      {creating && <CampaignModal onClose={() => setCreating(false)} onSaved={reload} />}
    </div>
  );
}
