import React from "react";
import { EmptyState } from "./States.jsx";

/** Mini-graphique en barres horizontales (sans dépendance externe). */
export default function BarList({ items, formatValue = (v) => v, emptyLabel = "Aucune donnée", tone = "brand" }) {
  if (!items?.length) return <EmptyState compact title={emptyLabel} />;
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);
  return (
    <ul className="bar-list">
      {items.map((item) => (
        <li key={item.label}>
          <div className="bar-list__row">
            <span className="bar-list__label">{item.label}</span>
            <span className="bar-list__value">{formatValue(item.value)}</span>
          </div>
          <div className="bar-list__track">
            <span className={`bar-list__bar bar-list__bar--${item.tone || tone}`} style={{ width: `${((Number(item.value) || 0) / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
