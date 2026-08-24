import React from "react";
import { Inbox } from "lucide-react";

/**
 * État vide pour listes sans données.
 *
 * Props :
 *   icon        — emoji ou texte à afficher à la place de la mascotte (optionnel)
 *   title       — titre principal
 *   description — texte explicatif (alias text)
 *   action      — élément JSX (bouton) OU fonction onClick si actionText est fourni
 *   actionText  — texte du bouton quand action est une fonction
 */
export default function EmptyState({
  icon,
  title = "Aucun résultat",
  description,
  text,
  action,
  actionText = "Réinitialiser",
}) {
  const body = description || text || "Aucune donnée disponible pour le moment.";

  return (
    <div className="panel empty" style={{ padding: "48px 24px", textAlign: "center" }}>
      <div>
        {icon ? (
          <div style={{ fontSize: 56, marginBottom: 12 }}>{icon}</div>
        ) : (
          <div className="mascot" style={{ marginBottom: 12, color: "var(--brand-dark)" }}>
            <Inbox size={56} strokeWidth={1.8} />
          </div>
        )}
        <h2 style={{ margin: "0 0 8px" }}>{title}</h2>
        <p className="muted" style={{ margin: "0 0 16px", maxWidth: 360, marginInline: "auto" }}>{body}</p>
        {action && (
          typeof action === "function"
            ? <button className="btn primary" onClick={action} style={{ marginTop: 4 }}>{actionText}</button>
            : action
        )}
      </div>
    </div>
  );
}
