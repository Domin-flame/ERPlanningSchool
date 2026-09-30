import React, { useMemo } from "react";
import { Megaphone, Percent, Target, TrendingUp } from "lucide-react";
import { AsyncContent, BarList, Button, Card, PageHeader, StatCard } from "../../components/ui";
import { marketingApi } from "../../api/finance.js";
import { useApiAll } from "../../hooks/useApi.js";
import { formatMoney, formatNumber, sumBy } from "../../utils/format.js";
import { LEAD_STATUS } from "../../utils/status.js";
import QuickLinks from "../dashboard/QuickLinks.jsx";

const SOURCES = { leads: () => marketingApi.leads(), campaigns: () => marketingApi.campaigns() };
const TONES = { NOUVEAU: "brand", CONTACTE: "violet", QUALIFIE: "amber", CONVERTI: "teal", PERDU: "neutral" };

export default function MarketingDashboard() {
  const { data, errors, loading, reload } = useApiAll(SOURCES);
  const leads = useMemo(() => data.leads || [], [data.leads]);
  const campaigns = useMemo(() => data.campaigns || [], [data.campaigns]);
  const converted = leads.filter((l) => l.statut === "CONVERTI").length;
  const rate = leads.length ? (converted / leads.length) * 100 : 0;

  const pipeline = Object.entries(LEAD_STATUS).map(([status, meta]) => ({
    label: meta.label, value: leads.filter((l) => l.statut === status).length, tone: TONES[status],
  }));

  const perCampaign = campaigns
    .map((c) => {
      const cLeads = leads.filter((l) => l.id_campaign === c.id_campaign);
      return { label: c.nom, value: cLeads.length, converted: cLeads.filter((l) => l.statut === "CONVERTI").length };
    })
    .sort((a, b) => b.value - a.value);

  const sources = Object.entries(
    leads.reduce((acc, l) => ({ ...acc, [l.source || "Non renseignée"]: (acc[l.source || "Non renseignée"] || 0) + 1 }), {})
  ).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  return (
    <div className="page">
      <PageHeader eyebrow="Marketing & admissions" title="Tableau de bord marketing" description="Pipeline de prospects, conversions et campagnes d'acquisition."
        actions={<Button variant="secondary" onClick={reload} loading={loading}>Actualiser</Button>} />
      <div className="grid grid--stats">
        <StatCard label="Prospects" icon={Target} value={leads.length} loading={loading} unavailable={!!errors.leads} />
        <StatCard label="Convertis" icon={TrendingUp} tone="teal" value={converted} loading={loading} unavailable={!!errors.leads} />
        <StatCard label="Taux de conversion" icon={Percent} tone="violet" value={`${formatNumber(rate, 1)} %`} loading={loading} unavailable={!!errors.leads} />
        <StatCard label="Budget campagnes" icon={Megaphone} tone="amber" value={formatMoney(sumBy(campaigns, (c) => c.budget))} hint={`${campaigns.length} campagne(s)`} loading={loading} unavailable={!!errors.campaigns} />
      </div>
      <div className="grid grid--2">
        <Card title="Pipeline des prospects">
          <AsyncContent loading={loading} error={errors.leads} onRetry={reload}>
            <BarList items={leads.length ? pipeline : []} emptyLabel="Aucun prospect" />
          </AsyncContent>
        </Card>
        <Card title="Prospects par campagne">
          <AsyncContent loading={loading} error={errors.campaigns || errors.leads} onRetry={reload}>
            <BarList items={perCampaign} formatValue={(v) => `${v} prospect(s)`} emptyLabel="Aucune campagne" tone="violet" />
          </AsyncContent>
        </Card>
        <Card title="Sources d'acquisition">
          <AsyncContent loading={loading} error={errors.leads} onRetry={reload}>
            <BarList items={sources} emptyLabel="Aucun prospect" tone="teal" />
          </AsyncContent>
        </Card>
      </div>
      <QuickLinks links={[
        { to: "/marketing/leads", label: "Prospects (CRM)", description: "Qualifier et convertir", icon: Target },
        { to: "/marketing/campaigns", label: "Campagnes", description: "Canaux, budgets, périodes", icon: Megaphone },
      ]} />
    </div>
  );
}
