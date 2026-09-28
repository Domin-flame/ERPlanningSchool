import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  Folder,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  PenSquare,
  Presentation,
  Receipt,
  Settings,
  Target,
  Users,
  Wallet,
} from "lucide-react";

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

export const ROUTE_ACCESS = {
  "/": Object.keys(ROLE_HOME),
  "/professeur": ["professeur", "academic"],
  "/student": ["student", "academic"],
  "/student/transcript": ["student"],
  "/marketing": ["marketing", "academic"],
  "/finance": ["finance", "academic"],
  "/hr": ["rh", "academic"],
  "/students": ["academic", "professeur", "rh", "finance"],
  "/courses": ["academic", "professeur", "student", "rh"],
  "/analytics": ["academic", "rh", "finance", "marketing"],
};

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
      { to: "/analytics", label: "Rapports & Analytics", icon: BarChart3 },
      { to: "/settings", label: "Paramètres ERP", icon: Settings },
    ],
  },
  professeur: {
    portals: [{ to: "/professeur", label: "Mon Espace Enseignant", icon: Presentation, end: true }],
    tools: [
      { to: "/courses", label: "Mes Cours Enseignés", icon: BookOpen },
      { to: "/students", label: "Saisie Notes & Appel", icon: PenSquare },
      { to: "/calendar", label: "Mon Emploi du temps", icon: CalendarDays },
      { to: "/messages", label: "Messagerie & Avis", icon: MessageSquare },
      { to: "/settings", label: "Mon Profil", icon: Settings },
    ],
  },
  student: {
    portals: [{ to: "/student", label: "Mon Espace Étudiant", icon: GraduationCap, end: true }],
    tools: [
      { to: "/courses", label: "Mes Cours Inscrits", icon: BookOpen },
      { to: "/student/transcript", label: "Mon relevé de notes", icon: FileText },
      { to: "/calendar", label: "Mon Emploi du Temps", icon: CalendarDays },
      { to: "/messages", label: "Contacter Enseignant", icon: MessageSquare },
      { to: "/settings", label: "Mon Profil", icon: Settings },
    ],
  },
  rh: {
    portals: [{ to: "/hr", label: "Tableau de Bord RH", icon: Users, end: true }],
    tools: [
      { to: "/hr", label: "Personnel & Paie", icon: Wallet },
      { to: "/courses", label: "Formateurs & Enseignants", icon: Presentation },
      { to: "/analytics", label: "Rapports RH", icon: BarChart3 },
      { to: "/messages", label: "Messagerie Interne", icon: MessageSquare },
      { to: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
  finance: {
    portals: [{ to: "/finance", label: "Tableau de Bord Finance", icon: Wallet, end: true }],
    tools: [
      { to: "/finance", label: "Factures & Encaissements", icon: Receipt },
      { to: "/students", label: "Compte Étudiants", icon: GraduationCap },
      { to: "/analytics", label: "Bilan de trésorerie", icon: BarChart3 },
      { to: "/messages", label: "Messagerie", icon: MessageSquare },
      { to: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
  marketing: {
    portals: [{ to: "/marketing", label: "Tableau de Bord Marketing", icon: Target, end: true }],
    tools: [
      { to: "/marketing", label: "CRM Prospects & Leads", icon: Target },
      { to: "/analytics", label: "Analytics Conversions", icon: BarChart3 },
      { to: "/messages", label: "Messagerie", icon: MessageSquare },
      { to: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
};

export function getRoleNavigation(role) {
  const navigation = ROLE_NAVIGATION[role] || { portals: [], tools: [] };
  const isAllowed = (path) => !ROUTE_ACCESS[path] || ROUTE_ACCESS[path].includes(role);

  return {
    portals: navigation.portals.filter((item) => isAllowed(item.to)),
    tools: navigation.tools.filter((item) => isAllowed(item.to)),
  };
}

export function getRoleHome(role) {
  return ROLE_HOME[role] || "/";
}
