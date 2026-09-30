import React from "react";
import { Briefcase, Plane, UserCheck, UserCog, Users, Wallet } from "lucide-react";
import { AsyncContent, BarList, Button, Card, EmptyState, PageHeader, StatCard, StatusBadge } from "../../components/ui";
import { hrApi } from "../../api/hr.js";
import { authApi } from "../../api/auth.js";
import { useApiAll } from "../../hooks/useApi.js";
import { formatDate, formatMoney, groupCount, sumBy } from "../../utils/format.js";
import { LEAVE_STATUS, LEAVE_TYPES } from "../../utils/status.js";
import QuickLinks from "../dashboard/QuickLinks.jsx";

const SOURCES = {
  employees: () => hrApi.employees(),
  leaves: () => hrApi.leaveRequests(),
  accounts: () => authApi.listUsers(),
};

export default function HrDashboard() {
  const { data, errors, loading, reload } = useApiAll(SOURCES);
  const employees = data.employees || [];
  const active = employees.filter((e) => e.is_active);
  const leaves = data.leaves || [];
  const pending = leaves.filter((l) => l.status === "pending");
  const byId = new Map(employees.map((e) => [e.id, e]));

  return (
    <div className="page">
      <PageHeader eyebrow="Ressources humaines" title="Tableau de bord RH" description="Effectifs, masse salariale, congés et comptes d'accès."
        actions={<Button variant="secondary" onClick={reload} loading={loading}>Actualiser</Button>} />
      <div className="grid grid--stats">
        <StatCard label="Employés actifs" icon={UserCheck} value={active.length} hint={`${employees.length} au total`} loading={loading} unavailable={!!errors.employees} />
        <StatCard label="Masse salariale (base)" icon={Wallet} tone="teal" value={formatMoney(sumBy(active, (e) => e.base_salary))} hint="Mensuelle, brute" loading={loading} unavailable={!!errors.employees} />
        <StatCard label="Congés en attente" icon={Plane} tone="amber" value={pending.length} loading={loading} unavailable={!!errors.leaves} />
        <StatCard label="Comptes utilisateurs" icon={UserCog} tone="violet" value={(data.accounts || []).length} loading={loading} unavailable={!!errors.accounts} />
      </div>
      <div className="grid grid--2">
        <Card title="Effectifs par département">
          <AsyncContent loading={loading} error={errors.employees} onRetry={reload}>
            <BarList items={groupCount(active, (e) => e.department).map((g) => ({ label: g.label, value: g.count }))} emptyLabel="Aucun employé actif" />
          </AsyncContent>
        </Card>
        <Card title="Demandes de congé à traiter">
          <AsyncContent loading={loading} error={errors.leaves} onRetry={reload} isEmpty={!pending.length}
            empty={<EmptyState compact icon={Plane} title="Aucune demande en attente" />}>
            <ul className="list">
              {pending.slice(0, 6).map((l) => {
                const emp = byId.get(l.employee_id);
                return (
                  <li key={l.id} className="list__item">
                    <div className="grow">
                      <strong>{emp ? `${emp.first_name} ${emp.last_name}` : "Employé"}</strong>
                      <small className="muted">{LEAVE_TYPES[l.leave_type] || l.leave_type} · {formatDate(l.start_date)} → {formatDate(l.end_date)}</small>
                    </div>
                    <StatusBadge map={LEAVE_STATUS} value={l.status} />
                  </li>
                );
              })}
            </ul>
          </AsyncContent>
        </Card>
      </div>
      <QuickLinks links={[
        { to: "/hr/employees", label: "Personnel & paie", description: "Fiches, bulletins de salaire", icon: Users },
        { to: "/hr/leaves", label: "Congés", description: "Valider ou refuser", icon: Plane },
        { to: "/hr/accounts", label: "Comptes", description: "Activer, désactiver, changer de rôle", icon: Briefcase },
      ]} />
    </div>
  );
}
