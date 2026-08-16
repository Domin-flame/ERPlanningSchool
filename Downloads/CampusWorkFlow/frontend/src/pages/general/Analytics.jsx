import React, { useMemo } from "react";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import StatCard from "../../components/StatCard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";

const COLORS = ["#1d4ed8", "#16a34a", "#f59e0b", "#8b5cf6", "#ef4444"];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("fr-FR");
}

export default function Analytics() {
  const { user } = useAuth();
  const { courses, students, employees, invoices, leads } = useData();

  const analytics = useMemo(() => {
    const role = user?.role || "academic";
    const rows = [
      { label: "Étudiants", value: students.length || 0, color: COLORS[0] },
      { label: "Cours", value: courses.length || 0, color: COLORS[1] },
      { label: "Employés", value: employees.length || 0, color: COLORS[2] },
      { label: "Factures", value: invoices.length || 0, color: COLORS[3] },
      { label: "Leads", value: leads.length || 0, color: COLORS[4] },
    ];

    const total = rows.reduce((sum, item) => sum + item.value, 0);
    const active = rows.filter((item) => item.value > 0).length;
    const paidInvoices = (Array.isArray(invoices) ? invoices : []).filter((invoice) => {
      const status = String(invoice.status || "").toLowerCase();
      return status.includes("paid") || status.includes("payée") || status.includes("validated") || status.includes("valide");
    }).length;

    const averageCompletion = total > 0 ? Math.round((paidInvoices / total) * 100) : 0;

    const cardSet = {
      student: [
        { label: "Parcours actif", value: formatNumber(courses.length || 0), trend: "Catalogues visibles", mark: "📚" },
        { label: "Mes cotisations", value: formatNumber(invoices.length || 0), trend: "Factures associées", mark: "💳" },
        { label: "Suivi académique", value: formatNumber(students.length || 0), trend: "Étudiants du campus", mark: "🎓" },
        { label: "Taux de suivi", value: `${averageCompletion}%`, trend: "Données actuelles", mark: "📈" },
      ],
      professeur: [
        { label: "Cours gérés", value: formatNumber(courses.length || 0), trend: "Programme actif", mark: "📚" },
        { label: "Étudiants suivis", value: formatNumber(students.length || 0), trend: "Effectif global", mark: "🎓" },
        { label: "Matières couvertes", value: formatNumber(courses.length || 0), trend: "Catalogue de cours", mark: "🧠" },
        { label: "Taux de suivi", value: `${averageCompletion}%`, trend: "Basé sur les données internes", mark: "📊" },
      ],
      rh: [
        { label: "Employés", value: formatNumber(employees.length || 0), trend: "Effectif RH", mark: "👥" },
        { label: "Leads", value: formatNumber(leads.length || 0), trend: "Pipeline active", mark: "📣" },
        { label: "Étudiants", value: formatNumber(students.length || 0), trend: "Population campus", mark: "🎓" },
        { label: "Taux global", value: `${Math.min(100, Math.round((active / rows.length) * 100))}%`, trend: "Modules visibles", mark: "⚡" },
      ],
      finance: [
        { label: "Factures", value: formatNumber(invoices.length || 0), trend: "Données comptables", mark: "💸" },
        { label: "Étudiants", value: formatNumber(students.length || 0), trend: "Population concernée", mark: "🎓" },
        { label: "Cours", value: formatNumber(courses.length || 0), trend: "Programme académique", mark: "📚" },
        { label: "Payé / total", value: `${paidInvoices}/${total || 0}`, trend: "Éléments validés", mark: "✅" },
      ],
      marketing: [
        { label: "Leads", value: formatNumber(leads.length || 0), trend: "Prospects actifs", mark: "📈" },
        { label: "Étudiants", value: formatNumber(students.length || 0), trend: "Audience campus", mark: "🎓" },
        { label: "Cours", value: formatNumber(courses.length || 0), trend: "Offres disponibles", mark: "📚" },
        { label: "Score d’activité", value: `${Math.min(100, Math.round((rows.filter((r) => r.value > 0).length / rows.length) * 100))}%`, trend: "Modules alimentés", mark: "🚀" },
      ],
      academic: [
        { label: "Total global", value: formatNumber(total), trend: "Données campus", mark: "🧭" },
        { label: "Modules visibles", value: formatNumber(active), trend: "Sources actives", mark: "📊" },
        { label: "Étudiants", value: formatNumber(students.length || 0), trend: "Inscriptions", mark: "🎓" },
        { label: "Cours", value: formatNumber(courses.length || 0), trend: "Catalogue total", mark: "📚" },
      ],
    };

    return {
      role,
      rows,
      total,
      active,
      cards: cardSet[role] || cardSet.academic,
    };
  }, [user, courses, students, employees, invoices, leads]);

  return (
    <>
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Administration" }, { label: "Analytics" }]} />

      <div className="page-head">
        <div>
          <h2>Analytics</h2>
          <p className="muted">Métriques réelles calculées depuis les données déjà exposées par l’API.</p>
        </div>
        <div className="actions">
          <button className="btn">Période : actuel</button>
          <button className="btn primary">Vue {analytics.role}</button>
        </div>
      </div>

      <div className="grid stats">
        {analytics.cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            trend={card.trend}
            mark={card.mark}
          />
        ))}
      </div>

      <div className="grid module-grid" style={{ gridTemplateColumns: "1.2fr 1fr 1fr", marginTop: 18 }}>
        <div className="card">
          <h3>Volume par module</h3>
          <div className="chart bars">{barChart(analytics.rows.map((row) => row.value))}</div>
        </div>

        <div className="card">
          <h3>Couverture des données</h3>
          <div className="donut" style={{ background: "conic-gradient(#1d4ed8 0 35%, #16a34a 35% 65%, #f59e0b 65% 85%, #8b5cf6 85% 100%)" }}>
            <div className="donut-inner">{analytics.active}</div>
          </div>
          <p className="muted">{analytics.active} modules actifs sur {analytics.rows.length}</p>
        </div>

        <div className="card">
          <h3>Répartition réelle</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {analytics.rows.map((row, index) => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: row.color, display: "inline-block" }} />
                  <span style={{ fontSize: 13 }}>{row.label}</span>
                </div>
                <strong style={{ fontSize: 13 }}>{row.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-title"><h3>Sources de données utilisées</h3></div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Valeur</th>
              <th>Rôle</th>
            </tr>
          </thead>
          <tbody>
            {analytics.rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{row.value}</td>
                <td>{analytics.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function barChart(values) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ height: 220, display: "flex", alignItems: "end", gap: 16, borderLeft: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: 12 }}>
      {values.map((v, i) => (
        <span key={i} title={v} style={{ width: 42, height: `${Math.max((v / max) * 100, 8)}%`, background: COLORS[i % COLORS.length], border: "1px solid transparent", borderRadius: "6px 6px 0 0" }} />
      ))}
    </div>
  );
}
