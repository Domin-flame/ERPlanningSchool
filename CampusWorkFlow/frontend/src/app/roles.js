import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Receipt,
  Settings,
  Target,
  UserCog,
  Users,
  Plane,
} from "lucide-react";

/** Rôles exposés par le service d'authentification (VALID_ROLES). */
export const ROLES = ["student", "professeur", "academic", "rh", "finance", "marketing"];

export const ROLE_META = {
  student: { label: "Étudiant", description: "Cours, notes, emploi du temps et factures." },
  professeur: { label: "Enseignant", description: "Classes, appel, évaluations et notes." },
  academic: { label: "Direction académique", description: "Pilotage global de l'établissement." },
  rh: { label: "Ressources humaines", description: "Personnel, congés, paie et comptes." },
  finance: { label: "Finance", description: "Facturation, encaissements et trésorerie." },
  marketing: { label: "Marketing & admissions", description: "Prospects, campagnes et conversions." },
};

export const roleLabel = (role) => ROLE_META[role]?.label || role || "Utilisateur";

const ALL = ROLES;

/**
 * Table d'accès unique : chaque route protégée déclare ici les rôles autorisés.
 * Elle est utilisée à la fois par le routeur (garde) et par la navigation.
 */
export const ROUTE_ACCESS = {
  "/dashboard": ALL,
  "/calendar": ALL,
  "/messages": ALL,
  "/notifications": ALL,
  "/assistant": ALL,
  "/settings": ALL,

  "/academic/students": ["academic", "professeur"],
  "/academic/courses": ["academic", "professeur"],

  "/student/courses": ["student"],
  "/student/grades": ["student"],
  "/student/invoices": ["student"],

  "/teaching": ["professeur"],

  "/hr/employees": ["rh", "academic"],
  "/hr/leaves": ["rh", "academic"],
  "/hr/accounts": ["rh", "academic"],

  "/finance/invoices": ["finance", "academic"],

  "/marketing/leads": ["marketing", "academic"],
  "/marketing/campaigns": ["marketing", "academic"],
};

export function canAccess(role, path) {
  const allowed = ROUTE_ACCESS[path];
  return !allowed || allowed.includes(role);
}

const COMMON = [
  { to: "/calendar", label: "Calendrier", icon: CalendarDays },
  { to: "/messages", label: "Messagerie", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/assistant", label: "Assistant", icon: Bot },
];

/** Navigation par rôle, organisée en sections. */
const NAVIGATION = {
  student: [
    { title: "Mon espace", items: [
      { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { to: "/student/courses", label: "Inscriptions aux cours", icon: BookOpen },
      { to: "/student/grades", label: "Relevé de notes", icon: FileText },
      { to: "/student/invoices", label: "Mes factures", icon: Receipt },
    ] },
    { title: "Outils", items: COMMON },
  ],
  professeur: [
    { title: "Enseignement", items: [
      { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { to: "/teaching", label: "Appel & notes", icon: ClipboardCheck },
      { to: "/academic/courses", label: "Catalogue des cours", icon: BookOpen },
      { to: "/academic/students", label: "Étudiants", icon: GraduationCap },
    ] },
    { title: "Outils", items: COMMON },
  ],
  academic: [
    { title: "Pilotage", items: [
      { to: "/dashboard", label: "Vue d'ensemble", icon: BarChart3 },
      { to: "/academic/students", label: "Étudiants", icon: GraduationCap },
      { to: "/academic/courses", label: "Cours & modules", icon: BookOpen },
    ] },
    { title: "Administration", items: [
      { to: "/hr/employees", label: "Personnel", icon: Users },
      { to: "/hr/leaves", label: "Congés", icon: Plane },
      { to: "/hr/accounts", label: "Comptes utilisateurs", icon: UserCog },
      { to: "/finance/invoices", label: "Facturation", icon: Receipt },
      { to: "/marketing/leads", label: "Prospects", icon: Target },
      { to: "/marketing/campaigns", label: "Campagnes", icon: Megaphone },
    ] },
    { title: "Outils", items: COMMON },
  ],
  rh: [
    { title: "Ressources humaines", items: [
      { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { to: "/hr/employees", label: "Personnel & paie", icon: Users },
      { to: "/hr/leaves", label: "Congés", icon: Plane },
      { to: "/hr/accounts", label: "Comptes utilisateurs", icon: UserCog },
    ] },
    { title: "Outils", items: COMMON },
  ],
  finance: [
    { title: "Finance", items: [
      { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { to: "/finance/invoices", label: "Factures & encaissements", icon: Receipt },
    ] },
    { title: "Outils", items: COMMON },
  ],
  marketing: [
    { title: "Marketing", items: [
      { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { to: "/marketing/leads", label: "Prospects (CRM)", icon: Target },
      { to: "/marketing/campaigns", label: "Campagnes", icon: Megaphone },
    ] },
    { title: "Outils", items: COMMON },
  ],
};

export const SETTINGS_NAV_ITEM = { to: "/settings", label: "Paramètres", icon: Settings };

export function getNavigation(role) {
  return (NAVIGATION[role] || [])
    .map((section) => ({ ...section, items: section.items.filter((item) => canAccess(role, item.to)) }))
    .filter((section) => section.items.length > 0);
}

/** Anciennes URLs du frontend précédent → nouvelles routes (liens/favoris existants). */
export const LEGACY_REDIRECTS = {
  "/professeur": "/dashboard",
  "/student": "/dashboard",
  "/student/transcript": "/student/grades",
  "/hr": "/hr/employees",
  "/finance": "/finance/invoices",
  "/marketing": "/marketing/leads",
  "/students": "/academic/students",
  "/courses": "/academic/courses",
  "/analytics": "/dashboard",
  "/chatbot": "/assistant",
  "/splash": "/",
  "/onboarding": "/",
};
