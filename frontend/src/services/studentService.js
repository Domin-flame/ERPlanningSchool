import api from "../api/client.js";
import { getCourseErrorMessage } from "./courseService.js";

/**
 * Service frontend de gestion des dossiers étudiants (profil académique).
 * Les requêtes passent par le gateway : /api/academic → academic-service,
 * /api/auth → auth-service (compte de connexion).
 */

export const STUDENT_STATUSES = [
  { value: "ACTIVE", label: "Actif" },
  { value: "PENDING", label: "En attente" },
  { value: "INACTIVE", label: "Inactif" },
  { value: "SUSPENDED", label: "Suspendu" },
];

export const getStudentErrorMessage = getCourseErrorMessage;

export async function fetchPrograms() {
  const { data } = await api.get("/academic/programs/", { params: { limit: 200 } });
  return Array.isArray(data) ? data : [];
}

/** Crée l'utilisateur académique et le dossier étudiant en une seule requête. */
export async function registerStudent({ name, email, phone, matricule, programId, enrollmentDate, status }) {
  const { data } = await api.post("/academic/students/register", {
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim() || null,
    matricule: matricule.trim(),
    program_id: Number(programId),
    enrollment_date: enrollmentDate,
    status,
  });
  return data;
}

/**
 * Crée le compte de connexion (auth-service) de l'étudiant.
 * Retourne { created: true } ou { created: false, reason } si le compte existe déjà.
 */
export async function createStudentAccount({ fullName, email, password }) {
  try {
    await api.post("/auth/register", {
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      role: "student",
    });
    return { created: true };
  } catch (error) {
    if (error?.response?.status === 409) {
      return { created: false, reason: "Un compte de connexion existe déjà pour cet email." };
    }
    throw error;
  }
}
