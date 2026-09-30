import React from "react";
import { AlertTriangle, Inbox, RefreshCw, WifiOff, Lock } from "lucide-react";

export function Spinner({ size = 20, label }) {
  return (
    <span className="spinner" style={{ width: size, height: size }} role="status" aria-label={label || "Chargement"} />
  );
}

export function PageLoader({ label = "Chargement…" }) {
  return (
    <div className="page-loader">
      <Spinner size={32} />
      <span>{label}</span>
    </div>
  );
}

export function Skeleton({ width = "100%", height = 14, radius = 6 }) {
  return <span className="skeleton" style={{ width, height, borderRadius: radius }} aria-hidden="true" />;
}

export function SkeletonRows({ rows = 5 }) {
  return (
    <div className="skeleton-rows" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={18} width={`${90 - (i % 3) * 12}%`} />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = "Aucune donnée", description, action, compact = false }) {
  return (
    <div className={`state ${compact ? "state--compact" : ""}`}>
      <span className="state__icon" aria-hidden="true">
        <Icon size={compact ? 20 : 28} />
      </span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, title, onRetry, compact = false }) {
  const status = error?.status;
  const Icon = status === 0 || status >= 502 ? WifiOff : status === 403 ? Lock : AlertTriangle;
  const defaultTitle =
    status === 0 || status >= 502
      ? "Service indisponible"
      : status === 403
        ? "Accès restreint"
        : "Impossible de charger les données";
  return (
    <div className={`state state--error ${compact ? "state--compact" : ""}`} role="alert">
      <span className="state__icon" aria-hidden="true">
        <Icon size={compact ? 20 : 28} />
      </span>
      <strong>{title || defaultTitle}</strong>
      {error?.message && <p>{error.message}</p>}
      {onRetry && (
        <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
          <RefreshCw size={14} aria-hidden="true" />
          <span>Réessayer</span>
        </button>
      )}
    </div>
  );
}

/**
 * Affiche le bon état (chargement, erreur, vide) avant de rendre le contenu.
 */
export function AsyncContent({ loading, error, onRetry, isEmpty, empty, skeleton, children }) {
  if (loading) return skeleton || <SkeletonRows />;
  if (error) return <ErrorState error={error} onRetry={onRetry} compact />;
  if (isEmpty) return empty || <EmptyState compact />;
  return children;
}
