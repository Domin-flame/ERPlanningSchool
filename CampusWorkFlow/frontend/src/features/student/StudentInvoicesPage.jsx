import React from "react";
import { CheckCircle2, Clock, Receipt } from "lucide-react";
import { Card, DataTable, EmptyState, PageHeader, StatCard, StatusBadge } from "../../components/ui";
import { financeApi } from "../../api/finance.js";
import { useApi } from "../../hooks/useApi.js";
import { formatDate, formatMoney, sumBy } from "../../utils/format.js";
import { INVOICE_STATUS } from "../../utils/status.js";

export default function StudentInvoicesPage() {
  const { data, loading, error, reload } = useApi(financeApi.myInvoices, { initialData: [] });
  const invoices = data || [];
  const paid = sumBy(invoices.filter((i) => i.statut === "PAYEE"), (i) => i.montant_total);
  const due = sumBy(invoices.filter((i) => !["PAYEE", "ANNULEE"].includes(i.statut)), (i) => i.montant_total);

  return (
    <div className="page">
      <PageHeader eyebrow="Espace étudiant" title="Mes factures" description="Frais de scolarité générés à partir de vos inscriptions." />
      <div className="grid grid--stats">
        <StatCard label="Factures" icon={Receipt} value={invoices.length} loading={loading} unavailable={!!error} />
        <StatCard label="Réglé" icon={CheckCircle2} tone="teal" value={formatMoney(paid)} loading={loading} unavailable={!!error} />
        <StatCard label="Reste à payer" icon={Clock} tone="amber" value={formatMoney(due)} loading={loading} unavailable={!!error} />
      </div>
      <Card padded={false}>
        <DataTable
          columns={[
            { key: "numero_facture", header: "N° facture", render: (i) => <strong>{i.numero_facture}</strong> },
            { key: "date_emission", header: "Émise le", render: (i) => formatDate(i.date_emission) },
            { key: "date_echeance", header: "Échéance", render: (i) => formatDate(i.date_echeance) },
            { key: "montant_total", header: "Montant", align: "right", sortValue: (i) => Number(i.montant_total), render: (i) => formatMoney(i.montant_total) },
            { key: "statut", header: "Statut", render: (i) => <StatusBadge map={INVOICE_STATUS} value={i.statut} /> },
          ]}
          rows={invoices}
          rowKey={(i) => i.id_invoice}
          loading={loading}
          error={error}
          onRetry={reload}
          empty={<EmptyState icon={Receipt} title="Aucune facture" description="Vos factures apparaîtront ici après vos inscriptions aux cours." />}
        />
      </Card>
    </div>
  );
}
