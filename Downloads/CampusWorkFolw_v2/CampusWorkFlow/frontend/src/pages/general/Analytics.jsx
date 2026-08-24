import React, { useCallback, useEffect, useMemo, useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import StatCard from "../../components/StatCard.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { fetchAcademicSummary } from "../../services/analyticsService.js";

const COLORS = ["#1d4ed8", "#16a34a", "#f59e0b", "#8b5cf6", "#ef4444", "#0891b2"];

// Reflète les mêmes règles d'accès que DataContext.loadData — permet de
// n'afficher une carte "métier" que si le rôle a réellement le droit de
// voir cette ressource, plutôt que d'afficher un 0 comme s'il s'agissait
// d'une vraie mesure.
const CAN_SEE = {
  employees: (role) => ["academic", "rh"].includes(role),
  invoices: (role) => ["academic", "finance"].includes(role),
  leads: (role) => ["academic", "marketing"].includes(role),
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("fr-FR");
}

export default function Analytics() {
  const { user } = useAuth();
  const { courses, students, employees, invoices, leads } = useData();
  const role = user?.role || "academic";

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAcademicSummary();
      setSummary(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Impossible de charger les statistiques depuis le module académique."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // ---- Cartes KPI : base réelle (identique pour tous les rôles) ----
  const baseCards = useMemo(() => {
    if (!summary) return [];
    const { kpi } = summary;
    return [
      { label: "Étudiants", value: formatNumber(kpi.total_students), trend: "Total inscrit", mark: "🎓" },
      { label: "Enseignants", value: formatNumber(kpi.total_teachers), trend: "Corps professoral", mark: "👨‍🏫" },
      { label: "Cours", value: formatNumber(kpi.total_courses), trend: "Catalogue académique", mark: "📚" },
      { label: "Programmes", value: formatNumber(kpi.total_programs), trend: "Filières actives", mark: "🧭" },
      { label: "Facultés", value: formatNumber(kpi.total_faculties), trend: "Structure académique", mark: "🏛️" },
    ];
  }, [summary]);

  // ---- Cartes complémentaires : uniquement si le rôle y a réellement accès ----
  const businessCards = useMemo(() => {
    const cards = [];
    if (CAN_SEE.employees(role)) {
      cards.push({ label: "Employés", value: formatNumber(employees.length), trend: "Effectif RH", mark: "👥" });
    }
    if (CAN_SEE.invoices(role)) {
      const paid = invoices.filter((inv) => {
        const s = String(inv.status || "").toLowerCase();
        return s.includes("pay") || s.includes("valid");
      }).length;
      cards.push({
        label: "Factures",
        value: formatNumber(invoices.length),
        trend: invoices.length ? `${paid} payées` : "Aucune facture",
        mark: "💸",
      });
    }
    if (CAN_SEE.leads(role)) {
      cards.push({ label: "Leads", value: formatNumber(leads.length), trend: "Pipeline marketing", mark: "📣" });
    }
    return cards;
  }, [role, employees, invoices, leads]);

  // ---- Répartition des étudiants par statut (donut réel) ----
  const statusDistribution = summary?.student_status_distribution || [];
  const statusTotal = statusDistribution.reduce((sum, s) => sum + s.count, 0);
  const donutGradient = useMemo(() => {
    if (statusTotal === 0) return null;
    let acc = 0;
    const stops = statusDistribution.map((s, i) => {
      const from = (acc / statusTotal) * 100;
      acc += s.count;
      const to = (acc / statusTotal) * 100;
      return `${COLORS[i % COLORS.length]} ${from}% ${to}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [statusDistribution, statusTotal]);

  const coursesPerModule = summary?.courses_per_module || [];
  const programsPerDepartment = summary?.programs_per_department || [];

  // ------------------------------------------------------------------
  if (loading) {
    return (
      <>
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Administration" }, { label: "Analytics" }]} />
        <Skeleton height={40} width="50%" style={{ marginBottom: 20 }} />
        <div className="grid stats">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={110} radius={12} />
          ))}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Administration" }, { label: "Analytics" }]} />
        <EmptyState
          icon="⚠️"
          title="Statistiques indisponibles"
          description={error}
          action={loadSummary}
          actionText="Réessayer"
        />
      </>
    );
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Administration" }, { label: "Analytics" }]} />

      <div className="page-head">
        <div>
          <h2>Analytics</h2>
          <p className="muted">
            Statistiques académiques calculées en base par le module académique (analytics/summary).
          </p>
        </div>
        <div className="actions">
          <span className="badge info" style={{ alignSelf: "center" }}>
            Vue {role}
          </span>
          <button className="btn" onClick={loadSummary}>
            🔄 Actualiser
          </button>
        </div>
      </div>

      <div className="grid stats">
        {[...baseCards, ...businessCards].map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} trend={card.trend} mark={card.mark} />
        ))}
      </div>

      <div className="grid module-grid" style={{ gridTemplateColumns: "1.2fr 1fr", marginTop: 18 }}>
        <div className="card">
          <h3>Cours par module (UE)</h3>
          {coursesPerModule.length === 0 ? (
            <p className="muted">Aucun module créé pour le moment.</p>
          ) : (
            <div className="chart bars">{barChart(coursesPerModule.map((m) => m.count))}</div>
          )}
          {coursesPerModule.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
              {coursesPerModule.map((m, i) => (
                <span key={m.module || i} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{ width: 8, height: 8, borderRadius: 999, background: COLORS[i % COLORS.length], display: "inline-block" }}
                  />
                  {m.module || "Sans module"} ({m.count})
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Étudiants par statut</h3>
          {statusTotal === 0 ? (
            <p className="muted">Aucun étudiant enregistré pour le moment.</p>
          ) : (
            <>
              <div className="donut" style={{ background: donutGradient }}>
                <div className="donut-inner">{statusTotal}</div>
              </div>
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {statusDistribution.map((s, i) => (
                  <div key={s.status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                      <span
                        style={{ width: 10, height: 10, borderRadius: 999, background: COLORS[i % COLORS.length], display: "inline-block" }}
                      />
                      {s.status}
                    </span>
                    <strong style={{ fontSize: 13 }}>
                      {s.count} ({((s.count / statusTotal) * 100).toFixed(0)}%)
                    </strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="section-title">
        <h3>Programmes par département</h3>
      </div>
      {programsPerDepartment.length === 0 ? (
        <EmptyState
          icon="🧭"
          title="Aucune donnée de programme"
          description="Créez des départements et des programmes dans le module académique pour voir apparaître cette répartition."
        />
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Département</th>
                <th>Nombre de programmes</th>
              </tr>
            </thead>
            <tbody>
              {programsPerDepartment.map((d) => (
                <tr key={d.department || "sans-departement"}>
                  <td>{d.department || "Sans département"}</td>
                  <td>{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function barChart(values) {
  const max = Math.max(...values, 1);
  return (
    <div
      style={{
        height: 220,
        display: "flex",
        alignItems: "end",
        gap: 16,
        borderLeft: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        padding: 12,
      }}
    >
      {values.map((v, i) => (
        <span
          key={i}
          title={v}
          style={{
            width: 42,
            height: `${Math.max((v / max) * 100, 8)}%`,
            background: COLORS[i % COLORS.length],
            borderRadius: "6px 6px 0 0",
          }}
        />
      ))}
    </div>
  );
}