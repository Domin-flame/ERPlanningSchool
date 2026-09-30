import React from "react";
import { UserX } from "lucide-react";
import { EmptyState, ErrorState } from "../../components/ui";

/** Fallback quand le compte n'est pas (encore) rattaché à un dossier étudiant. */
export default function StudentProfileGate({ error, onRetry }) {
  if (error?.status === 404) {
    return (
      <EmptyState
        icon={UserX}
        title="Dossier étudiant introuvable"
        description="Votre compte n'est pas encore rattaché à un dossier dans le module académique. Contactez la scolarité pour finaliser votre inscription."
      />
    );
  }
  return <ErrorState error={error} onRetry={onRetry} />;
}
