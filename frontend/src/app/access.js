import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarDays,
  ClipboardList,
  FileText,
  Folder,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  PenSquare,
  Presentation,
  Receipt,
  Settings,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";

/**
 * Référentiel central des rôles côté frontend : libellés, dashboards
 * d'accueil, rôles autorisés par route et navigation par rôle.
 *
 * La protection effective des routes reste déclarée explicitement dans
 * App.jsx (<ProtectedRoute allowedRoles={[...]}>). ROUTE_ACCESS doit rester
 * aligné avec ces déclarations : il sert à ne proposer dans la navigation
 * que les liens réellement accessibles au rôle connecté.
 */

export const ROLES = ["academic", "professeur", "student", "rh", "finance", "marketing"];

export const ROLE_HOME = {
  academic: "/",
  professeur: "/professeur",
  student: "/student",
  rh: "/hr",
  finance: "/finance",
  marketing: "/marketing",
};

export const ROLE_LABELS = {
  academic: { short: "Directeur", full: "Direction Académique" },
  professeur: { short: "Enseignant", full: "Professeur" },
  student: { short: "Étudiant", full: "Étudiant" },
  rh: { short: "Responsable RH", full: "Responsable RH" },
  finance: { short: "Responsable Financier", full: "Responsable Financier" },
  marketing: { short: "Responsable Marketing", full: "Responsable Marketing" },
};

export const ONBOARDING_STORAGE_KEY = "campusworkflow_onboarding_seen";

/** Rôles autorisés à créer / supprimer des cours (aligné sur le RBAC du gateway). */
export const COURSE_MANAGER_ROLES = ["academic", "professeur"];

/** Rôles autorisés par route. Une route absente est accessible à tout utilisateur connecté. */
export const ROUTE_ACCESS = {
  "/": ROLES,
  "/professeur": ["professeur", "academic"],
  "/student": ["student", "academic"],
  "/student/transcript": ["student"],
  "/student/courses": ["student"],
  "/marketing": ["marketing", "academic"],
  "/finance": ["finance", "academic"],
  "/hr": ["rh", "academic"],
  "/students": ["academic", "professeur", "rh", "finance"],
  "/courses": ["academic", "professeur", "student", "rh"],
  "/analytics": ["academic", "rh", "finance", "marketing"],
  "/calendar": ROLES,
  "/messages": ROLES,
  "/notifications": ROLES,
  "/assistant": ROLES,
  "/chatbot": ROLES,
  "/settings": ROLES,
};

const ASSISTANT_LINKS = [
  { to: "/chatbot", label: "Assistant Campus", icon: Bot },
  { to: "/assistant", label: "Assistant IA", icon: Sparkles },
];

// Navigation spécifique par rôle
const ROLE_NAVIGATION = {
  academic: {
    portals: [
      { to: "/", label: "Dashboard Direction", icon: LayoutDashboard, end: true },
      { to: "/student", label: "Portail Étudiant", icon: GraduationCap },
      { to: "/professeur", label: "Espace Enseignant", icon: Presentation },
      { to: "/marketing", label: "Portail Marketing", icon: Target },
      { to: "/finance", label: "Portail Finance", icon: Wallet },
      { to: "/hr", label: "Portail RH", icon: Users },
    ],
    tools: [
      { to: "/students", label: "Dossiers Étudiants", icon: Folder },
      { to: "/courses", label: "Catalogue Cours", icon: BookOpen },
      { to: "/calendar", label: "Examens & Plannings", icon: CalendarDays },
      { to: "/messages", label: "Messagerie", icon: MessageSquare },
      ...ASSISTANT_LINKS,
      { to: "/analytics", label: "Rapports & Analytics", icon: BarChart3 },
      { to: "/settings", label: "Paramètres ERP", icon: Settings },
    ],
  },
  professeur: {
    portals: [
      { to: "/professeur", label: "Mon Espace Enseignant", icon: Presentation, end: true },
    ],
    tools: [
      { to: "/courses", label: "Mes Cours Enseignés", icon: BookOpen },
      { to: "/students", label: "Saisie Notes & Appel", icon: PenSquare },
      { to: "/calendar", label: "Mon Emploi du temps", icon: CalendarDays },
      { to: "/messages", label: "Messagerie & Avis", icon: MessageSquare },
      ...ASSISTANT_LINKS,
      { to: "/settings", label: "Mon Profil", icon: Settings },
    ],
  },
  student: {
    portals: [
      { to: "/student", label: "Mon Espace Étudiant", icon: GraduationCap, end: true },
    ],
    tools: [
      { to: "/courses", label: "Catalogue des Cours", icon: BookOpen },
      { to: "/student/courses", label: "Inscriptions aux Cours", icon: ClipboardList },
      { to: "/student/transcript", label: "Mon Relevé de Notes", icon: FileText },
      { to: "/calendar", label: "Mon Emploi du Temps", icon: CalendarDays },
      { to: "/messages", label: "Contacter Enseignant", icon: MessageSquare },
      ...ASSISTANT_LINKS,
      { to: "/settings", label: "Mon Profil", icon: Settings },
    ],
  },
  rh: {
    portals: [
      { to: "/hr", label: "Tableau de Bord RH", icon: Users, end: true },
    ],
    tools: [
      { to: "/hr", label: "Personnel & Paie", icon: Wallet },
      { to: "/courses", label: "Formateurs & Enseignants", icon: Presentation },
      { to: "/analytics", label: "Rapports RH", icon: BarChart3 },
      { to: "/messages", label: "Messagerie Interne", icon: MessageSquare },
      ...ASSISTANT_LINKS,
      { to: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
  finance: {
    portals: [
      { to: "/finance", label: "Tableau de Bord Finance", icon: Wallet, end: true },
    ],
    tools: [
      { to: "/finance", label: "Factures & Encaissements", icon: Receipt },
      { to: "/students", label: "Compte Étudiants", icon: GraduationCap },
      { to: "/analytics", label: "Bilan & Trésorerie", icon: BarChart3 },
      { to: "/messages", label: "Messagerie", icon: MessageSquare },
      ...ASSISTANT_LINKS,
      { to: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
  marketing: {
    portals: [
      { to: "/marketing", label: "Tableau de Bord Marketing", icon: Target, end: true },
    ],
    tools: [
      { to: "/marketing", label: "CRM Prospects & Leads", icon: Target },
      { to: "/analytics", label: "Analytics Conversions", icon: BarChart3 },
      { to: "/messages", label: "Messagerie", icon: MessageSquare },
      ...ASSISTANT_LINKS,
      { to: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
};

/** Indique si le rôle peut accéder à la route (chemin exact déclaré dans ROUTE_ACCESS). */
export function canAccess(role, path) {
  if (!role) return false;
  const allowed = ROUTE_ACCESS[path];
  return !allowed || allowed.includes(role);
}

/** Navigation du rôle, limitée aux liens effectivement autorisés. */
export function getRoleNavigation(role) {
  const navigation = ROLE_NAVIGATION[role] || { portals: [], tools: [] };
  return {
    portals: navigation.portals.filter((item) => canAccess(role, item.to)),
    tools: navigation.tools.filter((item) => canAccess(role, item.to)),
  };
}

/** Dashboard d'accueil du rôle. */
export function getRoleHome(role) {
  return ROLE_HOME[role] || "/";
}

/** Libellé complet du rôle (ex. « Direction Académique »). */
export function getRoleLabel(role) {
  return ROLE_LABELS[role]?.full || role || "";
}

/** Libellé court du rôle (ex. « Directeur »). */
export function getRoleShortName(role) {
  return ROLE_LABELS[role]?.short || role || "";
}

/** Indique si le rôle peut créer / supprimer des cours. */
export function canManageCourses(role) {
  return COURSE_MANAGER_ROLES.includes(role);
}
