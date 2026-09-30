import React from "react";
import { Skeleton } from "./States.jsx";

export default function StatCard({ label, value, hint, icon: Icon, tone = "brand", loading = false, unavailable = false }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      {Icon && (
        <span className="stat-card__icon" aria-hidden="true">
          <Icon size={20} />
        </span>
      )}
      <div className="stat-card__content">
        <span className="stat-card__label">{label}</span>
        {loading ? (
          <Skeleton width="60%" height={26} />
        ) : (
          <strong className="stat-card__value">{unavailable ? "—" : value}</strong>
        )}
        {(hint || unavailable) && (
          <span className="stat-card__hint">{unavailable ? "Données indisponibles" : hint}</span>
        )}
      </div>
    </div>
  );
}
