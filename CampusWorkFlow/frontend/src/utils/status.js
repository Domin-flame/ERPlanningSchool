// Libellés et tonalités des statuts métier renvoyés par les services.

export const INVOICE_STATUS = {
  EMISE: { label: "Émise", tone: "info" },
  PARTIELLEMENT_PAYEE: { label: "Partiellement payée", tone: "warning" },
  PAYEE: { label: "Payée", tone: "success" },
  EN_RETARD: { label: "En retard", tone: "danger" },
  ANNULEE: { label: "Annulée", tone: "neutral" },
};

export const LEAD_STATUS = {
  NOUVEAU: { label: "Nouveau", tone: "info" },
  CONTACTE: { label: "Contacté", tone: "accent" },
  QUALIFIE: { label: "Qualifié", tone: "warning" },
  CONVERTI: { label: "Converti", tone: "success" },
  PERDU: { label: "Perdu", tone: "neutral" },
};

export const LEAVE_STATUS = {
  pending: { label: "En attente", tone: "warning" },
  approved: { label: "Approuvé", tone: "success" },
  rejected: { label: "Refusé", tone: "danger" },
};

export const LEAVE_TYPES = {
  annual: "Congé annuel",
  sick: "Congé maladie",
  maternity: "Congé maternité",
  unpaid: "Sans solde",
};

export const ATTENDANCE_STATUS = {
  Present: { label: "Présent", tone: "success" },
  Absent: { label: "Absent", tone: "danger" },
  Late: { label: "En retard", tone: "warning" },
  Excused: { label: "Excusé", tone: "info" },
};

const GENERIC = {
  active: "success",
  actif: "success",
  completed: "success",
  inactive: "neutral",
  suspended: "danger",
  graduated: "accent",
  scheduled: "info",
  planned: "info",
  cancelled: "neutral",
};

export function statusMeta(map, value) {
  if (value == null || value === "") return { label: "—", tone: "neutral" };
  const meta = map?.[value] ?? map?.[String(value).toUpperCase()] ?? map?.[String(value).toLowerCase()];
  if (meta) return meta;
  return { label: String(value), tone: GENERIC[String(value).toLowerCase()] || "neutral" };
}
