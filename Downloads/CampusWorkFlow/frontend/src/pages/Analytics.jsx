import React from "react";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import StatCard from "../components/StatCard.jsx";

export default function Analytics() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Home" }, { label: "Administration" }, { label: "Analytics" }]} />
      <div className="page-head">
        <div>
          <h2>Workflow Analytics</h2>
          <p className="muted">KPI, graphiques et exports.</p>
        </div>
        <div className="actions">
          <button className="btn">May 1 - May 31, 2024</button>
          <button className="btn">Filter</button>
          <button className="btn primary">Export PDF</button>
        </div>
      </div>

      <div className="grid stats">
        <StatCard label="Total Requests" value="1,248" trend="+12.4%" mark="R" />
        <StatCard label="Completed Requests" value="982" trend="+8.7%" mark="✓" />
        <StatCard label="Pending Requests" value="266" trend="-5.3%" mark="P" down />
        <StatCard label="Overdue Requests" value="48" trend="-20.0%" mark="!" down />
      </div>

      <div className="grid module-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginTop: 18 }}>
        <div className="card">
          <h3>Requests by Department</h3>
          <div className="chart bars">{barChart([70, 92, 46, 66, 58])}</div>
        </div>
        <div className="card">
          <h3>Requests by Priority</h3>
          <div className="donut">
            <div className="donut-inner">262</div>
          </div>
          <p className="muted">High 40% · Medium 30% · Low 20% · Urgent 10%</p>
        </div>
        <div className="card">
          <h3>Requests Over Time</h3>
          <div className="linechart">
            <svg viewBox="0 0 300 120" preserveAspectRatio="none">
              <polyline points="0,90 50,70 100,80 150,40 200,55 250,25 300,35" fill="none" stroke="#F97316" strokeWidth="3" />
              <polygon points="0,90 50,70 100,80 150,40 200,55 250,25 300,35 300,120 0,120" fill="rgba(249,115,22,0.15)" />
            </svg>
          </div>
        </div>
      </div>

      <div className="section-title"><h3>Heatmap Status × Department</h3></div>
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>Status</th><th>Admissions</th><th>Finance</th><th>Registrar</th><th>IT Services</th><th>Total</th></tr></thead>
          <tbody>
            <tr><td>Completed</td><td style={{ background: "#cbd5e1" }}>320</td><td style={{ background: "#cbd5e1" }}>320</td><td style={{ background: "#e2e8f0" }}>210</td><td>180</td><td>1,180</td></tr>
            <tr><td>Pending</td><td>80</td><td>80</td><td>60</td><td>70</td><td>340</td></tr>
            <tr><td>Overdue</td><td>12</td><td>18</td><td>10</td><td>5</td><td>48</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function barChart(values) {
  return (
    <div style={{ height: 220, display: "flex", alignItems: "end", gap: 18, borderLeft: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: 12 }}>
      {values.map((v, i) => (
        <span key={i} title={v} style={{ width: 42, height: `${v}%`, background: "#fdba74", border: "1px solid #F97316" }}></span>
      ))}
    </div>
  );
}
