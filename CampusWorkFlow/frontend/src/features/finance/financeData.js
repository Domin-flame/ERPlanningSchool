import { academicApi } from "../../api/academic.js";
import { financeApi } from "../../api/finance.js";

/**
 * Factures + annuaire étudiant (académique) pour afficher des noms lisibles.
 * L'annuaire est optionnel : s'il échoue, on affiche l'identifiant.
 */
export async function loadInvoicesWithStudents() {
  const [invoices, directory] = await Promise.all([financeApi.invoices(), loadStudentDirectory().catch(() => [])]);
  return { invoices, students: directory };
}

export async function loadStudentDirectory() {
  const [students, users] = await Promise.all([academicApi.students.list(), academicApi.users.list()]);
  const usersById = new Map(users.map((u) => [u.user_id, u]));
  return students.map((s) => ({
    id: s.student_id,
    matricule: s.matricule,
    name: usersById.get(s.user_id)?.name || s.matricule,
  }));
}

export const isOpenInvoice = (i) => !["PAYEE", "ANNULEE"].includes(i.statut);

export function isOverdue(invoice) {
  if (invoice.statut === "EN_RETARD") return true;
  return isOpenInvoice(invoice) && invoice.date_echeance && new Date(invoice.date_echeance) < new Date(new Date().toDateString());
}
