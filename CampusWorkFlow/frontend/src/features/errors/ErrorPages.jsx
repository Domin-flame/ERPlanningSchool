import React from "react";
import { Link } from "react-router-dom";
import { Compass, ShieldAlert } from "lucide-react";
import { EmptyState } from "../../components/ui";

export function NotFoundPage() {
  return (
    <div className="page page--center">
      <EmptyState icon={Compass} title="Page introuvable" description="L'adresse demandée n'existe pas ou a été déplacée."
        action={<Link className="btn btn--primary btn--md" to="/dashboard">Retour au tableau de bord</Link>} />
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="page page--center">
      <EmptyState icon={ShieldAlert} title="Accès refusé" description="Votre rôle ne permet pas d'accéder à cette page."
        action={<Link className="btn btn--primary btn--md" to="/dashboard">Retour au tableau de bord</Link>} />
    </div>
  );
}
