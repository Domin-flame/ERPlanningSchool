import React from "react";

export default function StatCard({ label, value, trend, mark, down = false }) {
  return (
    <article className="card stat">
      <div className="soft-icon">{mark}</div>
      <div>
        <strong>{label}</strong>
        <div className="big">{value}</div>
        <span className={`trend ${down ? "down" : ""}`}>{trend}</span>
      </div>
    </article>
  );
}
