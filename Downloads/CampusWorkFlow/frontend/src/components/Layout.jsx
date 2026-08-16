import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Presentation,
  Target,
  Wallet,
  Users,
  Folder,
  BookOpen,
  CalendarDays,
  MessageSquare,
  BarChart3,
  Settings,
  PenSquare,
  CreditCard,
  Receipt,
  Menu,
  X,
  Search,
  Bell,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  FileText,
  Banknote,
} from "lucide-react";
import AppLogo from "./AppLogo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";

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
      { to: "/settings", label: "Mon Profil", icon: Settings },
    ],
  },
  student: {
    portals: [
      { to: "/student", label: "Mon Espace Étudiant", icon: GraduationCap, end: true },
    ],
    tools: [
      { to: "/courses", label: "Mes Cours Inscrits", icon: BookOpen },
      { to: "/calendar", label: "Mon Emploi du Temps", icon: CalendarDays },
      { to: "/finance", label: "Mes Frais & Solde", icon: CreditCard },
      { to: "/messages", label: "Contacter Enseignant", icon: MessageSquare },
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
      { to: "/analytics", label: "Bilan & Bilan Trésorerie", icon: BarChart3 },
      { to: "/messages", label: "Messagerie", icon: MessageSquare },
      { to: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
  marketing: {
    portals: [
      { to: "/marketing", label: "Tableau de Bord Marketing", icon: Target, end: true },
    ],
    tools: [
      { to: "/marketing", label: "CRM Prospects & Leads", icon: Target },
      { to: "/students", label: "Suivi des Inscriptions", icon: GraduationCap },
      { to: "/analytics", label: "Analytics Conversions", icon: BarChart3 },
      { to: "/messages", label: "Messagerie", icon: MessageSquare },
      { to: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
};

// Icônes et libellés par type de notification
const NOTIF_ICONS = {
  success: { icon: CheckCircle2, className: "notif-ico success" },
  warning: { icon: AlertTriangle, className: "notif-ico warning" },
  error: { icon: XCircle, className: "notif-ico error" },
  info: { icon: Info, className: "notif-ico info" },
};

/** Normalise une chaîne pour une comparaison insensible aux accents/casse. */
function normalize(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Construit l'index de recherche global à partir des données déjà chargées
 * dans DataContext (pas d'appel réseau supplémentaire : tout est déjà en mémoire).
 * Chaque entrée expose { id, category, title, subtitle, to, icon, haystack }.
 */
function buildSearchIndex({ students, courses, employees, invoices, leads }) {
  const index = [];

  for (const s of students || []) {
    const name = s.name || `${s.first_name || ""} ${s.last_name || ""}`.trim();
    index.push({
      id: `student-${s.student_id || s.id}`,
      category: "Étudiants",
      title: name || "Étudiant",
      subtitle: s.email || s.matricule || s.status || "",
      to: "/students",
      icon: GraduationCap,
      haystack: normalize(`${name} ${s.email || ""} ${s.matricule || ""} ${s.status || ""}`),
    });
  }

  for (const c of courses || []) {
    index.push({
      id: `course-${c.course_id || c.code}`,
      category: "Cours",
      title: c.title || c.code || "Cours",
      subtitle: c.code || "",
      to: "/courses",
      icon: BookOpen,
      haystack: normalize(`${c.title || ""} ${c.code || ""} ${c.dept || ""} ${c.module_id || ""}`),
    });
  }

  for (const e of employees || []) {
    const name = `${e.first_name || ""} ${e.last_name || ""}`.trim();
    index.push({
      id: `employee-${e.employee_id || e.id}`,
      category: "Employés",
      title: name || "Employé",
      subtitle: [e.position, e.department].filter(Boolean).join(" · "),
      to: "/hr",
      icon: Users,
      haystack: normalize(`${name} ${e.position || ""} ${e.department || ""}`),
    });
  }

  for (const inv of invoices || []) {
    const ref = inv.numero_facture || `FAC-${inv.id_invoice || inv.id}`;
    const student = inv.id_student || inv.studentName || "";
    index.push({
      id: `invoice-${inv.id_invoice || inv.id}`,
      category: "Factures",
      title: ref,
      subtitle: student,
      to: "/finance",
      icon: FileText,
      haystack: normalize(`${ref} ${student} ${inv.statut || inv.status || ""}`),
    });
  }

  for (const l of leads || []) {
    const name = l.nom || l.name || "Prospect";
    index.push({
      id: `lead-${l.id_lead || l.id}`,
      category: "Leads",
      title: name,
      subtitle: l.contact || l.email || l.source || "",
      to: "/marketing",
      icon: Banknote,
      haystack: normalize(`${name} ${l.contact || ""} ${l.email || ""} ${l.source || ""}`),
    });
  }

  return index;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const {
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
    searchQuery,
    setSearchQuery,
    students,
    courses,
    employees,
    invoices,
    leads,
  } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const currentRole = user?.role || "academic";
  const navConfig = ROLE_NAVIGATION[currentRole] || ROLE_NAVIGATION.academic;
  const unreadNotifs = notifications.filter((n) => n.unread).length;

  // Index de recherche recalculé uniquement quand les données changent
  const searchIndex = useMemo(
    () => buildSearchIndex({ students, courses, employees, invoices, leads }),
    [students, courses, employees, invoices, leads]
  );

  // Résultats groupés par catégorie, 4 par catégorie maximum
  const searchResults = useMemo(() => {
    const q = normalize(searchQuery);
    if (!q) return [];
    const matches = searchIndex.filter((entry) => entry.haystack.includes(q));
    const grouped = {};
    for (const m of matches) {
      if (!grouped[m.category]) grouped[m.category] = [];
      if (grouped[m.category].length < 4) grouped[m.category].push(m);
    }
    return Object.entries(grouped);
  }, [searchIndex, searchQuery]);

  const totalResults = searchResults.reduce((sum, [, items]) => sum + items.length, 0);
  const showResultsPanel = searchFocused && searchQuery.trim().length > 0;

  const goToResult = (entry) => {
    setSearchFocused(false);
    setSearchQuery("");
    navigate(entry.to);
  };

  const handleNotifClick = (n) => {
    if (n.unread) markNotificationRead(n.id);
  };

  return (
    <div className="app">
      {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <AppLogo size={34} />
          </div>
          <div>
            <h1>CampusWorkflow</h1>
            <p>ERP Scolaire Unifié</p>
          </div>
        </div>

        {/* Portails d'accès par rôle */}
        <nav className="nav">
          <span className="nav-label">Portail {user?.roleLabel || "Principal"}</span>
          {navConfig.portals.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="ico"><item.icon size={18} strokeWidth={2} /></span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Outils spécifiques au rôle */}
        <nav className="nav">
          <span className="nav-label">Outils & Espaces</span>
          {navConfig.tools.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="ico"><item.icon size={18} strokeWidth={2} /></span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Pied de sidebar utilisateur */}
        <div className="sidebar-footer">
          <div className="avatar">{user?.avatar || "CW"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              {user?.full_name || user?.name || "Utilisateur"}
            </strong>
            <span className={`role-pill ${currentRole}`} style={{ fontSize: 11, padding: "2px 8px" }}>
              {user?.role_label || user?.roleLabel || currentRole}
            </span>
          </div>
          <button className="icon-btn" onClick={logout} title="Se déconnecter" style={{ flexShrink: 0 }}>
            <LogOut size={16} strokeWidth={2} />
          </button>
        </div>
      </aside>

      {/* Main content viewport */}
      <main className="main">
        {/* Sub-container page avec transition animée */}
        <section className="content page-transition-wrap" key={location.pathname}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}