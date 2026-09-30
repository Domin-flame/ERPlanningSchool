import React from "react";
import { BookOpen, Building2, GraduationCap, Layers, Presentation, Receipt, Target, Users, Plane } from "lucide-react";
import { AsyncContent, BarList, Card, PageHeader, StatCard, Button } from "../../components/ui";
import { academicApi } from "../../api/academic.js";
import { financeApi, marketingApi } from "../../api/finance.js";
import { hrApi } from "../../api/hr.js";
import { useApiAll } from "../../hooks/useApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatMoney, formatNumber, sumBy } from "../../utils/format.js";
import ServiceHealthCard from "../dashboard/ServiceHealthCard.jsx";
import QuickLinks from "../dashboard/QuickLinks.jsx";

const SOURCES = {
  summary: academicApi.summary,
  invoices: financeApi.invoices,
  leads: marketingApi.leads,
  employees: () => hrApi.employees(),
  leaves: () => hrApi.leaveRequests("pending"),
};

export default function AcademicDashboard() {
  const { user } = useAuth();
  const { data, errors, loading, reload } = useApiAll(SOURCES);
  const kpi = data.summary?.kpi || {};
  const invoices = data.invoices || [];
  const leads = data.leads || [];
  const billed = sumBy(invoices, (i) => i.montant_total);
  const collected = sumBy(invoices.filter((i) => i.statut === "PAYEE"), (i) => i.montant_total);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Direction académique"
        title={`Bonjour ${user?.full_name?.split(" ")[0] || ""}`.trim()}
        description="Vue consolidée de l'établissement : scolarité, personnel, finances et admissions."
        actions={<Button variant="secondary" onClick={reload} loading={loading}>Actualiser</Button>}
      />

      <div className="grid grid--stats">
        <StatCard label="Étudiants" icon={GraduationCap} value={formatNumber(kpi.total_students)} loading={loading} unavailable={!!errors.summary} />
        <StatCard label="Enseignants" icon={Presentation} tone="teal" value={formatNumber(kpi.total_teachers)} loading={loading} unavailable={!!errors.summary} />
        <StatCard label="Cours" icon={BookOpen} tone="violet" value={formatNumber(kpi.total_courses)} hint={`${formatNumber(kpi.total_programs)} programmes`} loading={loading} unavailable={!!errors.summary} />
        <StatCard label="Facultés" icon={Building2} tone="amber" value={formatNumber(kpi.total_faculties)} loading={loading} unavailable={!!errors.summary} />
      </div>

      <div className="grid grid--stats">
        <StatCard label="Montant facturé" icon={Receipt} value={formatMoney(billed)} hint={`${invoices.length} factures`} loading={loading} unavailable={!!errors.invoices} />
        <StatCard label="Encaissé" icon={Receipt} tone="teal" value={formatMoney(collected)} hint={billed ? `${Math.round((collected / billed) * 100)} % du facturé` : ""} loading={loading} unavailable={!!errors.invoices} />
        <StatCard label="Personnel" icon={Users} tone="violet" value={formatNumber((data.employees || []).filter((e) => e.is_active).length)} hint={`${(data.leaves || []).length} congés en attente`} loading={loading} unavailable={!!errors.employees} />
        <StatCard label="Prospects" icon={Target} tone="amber" value={formatNumber(leads.length)} hint={`${leads.filter((l) => l.statut === "CONVERTI").length} convertis`} loading={loading} unavailable={!!errors.leads} />
      </div>

      <div className="grid grid--2">
        <Card title="Répartition des étudiants" subtitle="Par statut d'inscription">
          <AsyncContent loading={loading} error={errors.summary} onRetry={reload}>
            <BarList items={(data.summary?.student_status_distribution || []).map((s) => ({ label: s.status || "—", value: s.count }))} emptyLabel="Aucun étudiant enregistré" />
          </AsyncContent>
        </Card>
        <Card title="Cours par module" subtitle="Top 10 des modules (UE)">
          <AsyncContent loading={loading} error={errors.summary} onRetry={reload}>
            <BarList tone="violet" items={(data.summary?.courses_per_module || []).map((m) => ({ label: m.module, value: m.count }))} emptyLabel="Aucun module" />
          </AsyncContent>
        </Card>
        <Card title="Programmes par département">
          <AsyncContent loading={loading} error={errors.summary} onRetry={reload}>
            <BarList tone="teal" items={(data.summary?.programs_per_department || []).map((d) => ({ label: d.department, value: d.count }))} emptyLabel="Aucun département" />
          </AsyncContent>
        </Card>
        <ServiceHealthCard />
      </div>

      <QuickLinks
        links={[
          { to: "/academic/students", label: "Dossiers étudiants", description: "Inscrire et suivre les étudiants", icon: GraduationCap },
          { to: "/academic/courses", label: "Catalogue des cours", description: "Cours et modules (UE)", icon: Layers },
          { to: "/hr/leaves", label: "Congés à valider", description: "Demandes du personnel", icon: Plane },
          { to: "/finance/invoices", label: "Facturation", description: "Factures et encaissements", icon: Receipt },
        ]}
      />
    </div>
  );
}
