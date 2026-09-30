import React from "react";

/**
 * Skeleton loading state (squelette de chargement avec animation Shimmer).
 * Utilisé pour les listes, cartes de statistiques et tableaux pendant le chargement.
 */
export default function Skeleton({ width = "100%", height = 16, radius = 8, style }) {
  return (
    <div
      className="skeleton shimmer"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonList({ rows = 4, height = 56 }) {
  return (
    <div className="skeleton-list" style={{ display: "grid", gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          className="skeleton-card shimmer-card"
          key={i}
          style={{ height, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, background: "var(--panel)", borderRadius: 10, border: "1px solid var(--line)" }}
        >
          <Skeleton width="42px" height="42px" radius="50%" />
          <div style={{ flex: 1, display: "grid", gap: 8 }}>
            <Skeleton width="45%" height={14} />
            <Skeleton width="70%" height={12} />
          </div>
          <Skeleton width="80px" height={28} radius={6} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div
      className="skeleton-stat shimmer-card"
      style={{ padding: 20, background: "var(--panel)", borderRadius: 12, border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton width="40%" height={14} />
        <Skeleton width="36px" height="36px" radius={8} />
      </div>
      <Skeleton width="60%" height={28} />
      <Skeleton width="50%" height={12} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="panel table-wrap shimmer-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Skeleton width="30%" height={38} radius={8} />
        <Skeleton width="20%" height={38} radius={8} />
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} width={`${100 / cols}%`} height={18} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
