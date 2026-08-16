import React from "react";

export default function StatCard({ label, value, trend, mark, down = false, onClick, clickable }) {
  const isClickable = clickable ?? Boolean(onClick);
  return (
    <article
      className={`card stat${isClickable ? " stat-clickable card-interactive" : ""}`}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => (e.key === "Enter" || e.key === " ") && onClick(e) : undefined}
    >
      <div className="soft-icon">{mark}</div>
      <div>
        <strong>{label}</strong>
        <div className="big">{value}</div>
        <span className={`trend ${down ? "down" : ""}`}>{trend}</span>
      </div>
    </article>
  );
}