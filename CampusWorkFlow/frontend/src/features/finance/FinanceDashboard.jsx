import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Receipt, Wallet } from "lucide-react";
import { AsyncContent, BarList, Button, Card, DataTable, EmptyState, PageHeader, StatCard, StatusBadge } from "../../components/ui";
import { useApi } from "../../hooks/useApi.js";
import { formatDate, formatMoney, formatNumber, sumBy } from "../../utils/format.js";
import { INVOICE_STATUS, statusMeta } from "../../utils/status.js";
import QuickLinks from "../dashboard/QuickLinks.jsx";
import { isOpenInvoice, isOverdue, loadInvoicesWithStudents } from "./financeData.js";

export default function FinanceDashboard() {
  const { data, loading, error, reload } = useApi(loadInvoicesWithStudents);
  const invoices = useMemo(() => data?.invoices || [], [data]);
  const names = useMemo(() => new Map((data?.students || []).map((s) => [s.id, s.name])), [data]);

  const billed = sumBy(invoices.filter((i) => i.statut !== "ANNULEE"), (i) => i.montant_total);
  const collected = sumBy(invoices.filter((i) => i.statut === "PAYEE"), (i) => i.montant_total);
  const outstanding = sumBy(invoices.filter(isOpenInvoice), (i) => i.montant_total);
  const overdue = invoices.filter(isOverdue);
  const rate = billed ? (collected / billed) * 100 : 0;

  const byStatus = Object.keys(INVOICE_STATUS)
    .map((status) => ({
      label: statusMeta(INVOICE_STATUS, status).label,
      value: sumBy(invoices.filter((i) => i.statut === status), (i) => i.montant_total),
      tone: { PAYEE: "teal", EN_RETARD: "danger", PARTIELLEMENT_PAYEE: "amber" }[status],
    }))
    .filter((row) => row.value > 0);

  const recent = [...invoices].sort((a, b) => String(b.created_at || b.date_emission).localeCompare(String(a.created_at || a.date_emission))).slice(0, 6);

  return (
    <div className="page">
      <PageHeader eyebrow="Finance" title="Tableau de bord financier" description="Facturation des frais de scolarité et suivi des encaissements."
        actions={<Button variant="secondary" onClick={reload} loading={loading}>Actualiser</Button>} />
      <div className="grid grid--stats">
        <StatCard label="Montant facturé" icon={Receipt} value={formatMoney(billed)} hint={`${invoices.length} facture(s)`} loading={loading} unavailable={!!error} />
        <StatCard label="Encaissé" icon={CheckCircle2} tone="teal" value={formatMoney(collected)} hint={`Taux de recouvrement ${formatNumber(rate, 1)} %`} loading={loading} unavailable={!!error} />
        <StatCard label="Reste à encaisser" icon={Wallet} tone="violet" value={formatMoney(outstanding)} loading={loading} unavailable={!!error} />
        <StatCard label="Factures en retard" icon={AlertTriangle} tone="amber" value={overdue.length} hint={formatMoney(sumBy(overdue, (i) => i.montant_total))} loading={loading} unavailable={!!error} />
      </div>
      <div className="grid grid--2">
        <Card title="Répartition par statut" subtitle="Montants en FCFA">
          <AsyncContent loading={loading} error={error} onRetry={reload}>
            <BarList items={byStatus} formatValue={formatMoney} emptyLabel="Aucune facture émise" />
          </AsyncContent>
        </Card>
        <Card title="Dernières factures" padded={false}>
          <DataTable dense pageSize={6} loading={loading} error={error} onRetry={reload} rows={recent} rowKey={(i) => i.id_invoice}
            empty={<EmptyState compact icon={Receipt} title="Aucune facture" />}
            columns={[
              { key: "numero_facture", header: "Facture", render: (i) => <div><strong>{i.numero_facture}</strong><small className="muted block">{names.get(i.id_student) || `Étudiant #${i.id_student}`}</small></div> },
              { key: "date_echeance", header: "Échéance", render: (i) => formatDate(i.date_echeance) },
              { key: "montant_total", header: "Montant", align: "right", render: (i) => formatMoney(i.montant_total) },
              { key: "statut", header: "Statut", render: (i) => <StatusBadge map={INVOICE_STATUS} value={i.statut} /> },
            ]} />
        </Card>
      </div>
      <QuickLinks links={[{ to: "/finance/invoices", label: "Factures & encaissements", description: "Émettre, encaisser, relancer", icon: Receipt }]} />
    </div>
  );
}
