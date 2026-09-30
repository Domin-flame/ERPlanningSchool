import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Users,
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
import { getRoleLabel, getRoleNavigation } from "../app/access.js";

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

  // Referme les panneaux flottants à chaque changement de page
  useEffect(() => {
    setNotifOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  const currentRole = user?.role || "";
  const roleLabel = user?.role_label || user?.roleLabel || getRoleLabel(currentRole);
  // Navigation du rôle, filtrée selon les routes réellement autorisées (app/access.js)
  const navConfig = useMemo(() => getRoleNavigation(currentRole), [currentRole]);
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
          <span className="nav-label">Portail {roleLabel || "Principal"}</span>
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
              {roleLabel}
            </span>
          </div>
          <button className="icon-btn" onClick={logout} title="Se déconnecter" style={{ flexShrink: 0 }}>
            <LogOut size={16} strokeWidth={2} />
          </button>
        </div>
      </aside>

      {/* Main content viewport */}
      <main className="main">
        {/* Barre supérieure : menu mobile, recherche globale, notifications */}
        <header className="topbar">
          <button
            className="hamburger"
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="search">
            <div className="search-inner">
              <Search size={16} className="search-ico" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchQuery("");
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Rechercher un étudiant, un cours, une facture…"
                aria-label="Recherche globale"
              />
            </div>
            <div className={`search-panel ${showResultsPanel ? "open" : ""}`} role="listbox" aria-label="Résultats de recherche">
              {totalResults === 0 ? (
                <p className="muted" style={{ fontSize: 13 }}>Aucun résultat pour « {searchQuery.trim()} ».</p>
              ) : (
                searchResults.map(([category, items]) => (
                  <div key={category} style={{ marginBottom: 10 }}>
                    <small className="muted" style={{ fontWeight: 700, textTransform: "uppercase" }}>{category}</small>
                    {items.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        role="option"
                        aria-selected="false"
                        className="search-result-row"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => goToResult(entry)}
                        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", border: 0, background: "transparent", textAlign: "left", cursor: "pointer" }}
                      >
                        <entry.icon size={16} aria-hidden="true" />
                        <span style={{ minWidth: 0 }}>
                          <strong style={{ display: "block", fontSize: 14 }}>{entry.title}</strong>
                          {entry.subtitle && <small className="muted">{entry.subtitle}</small>}
                        </span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="top-actions">
            <div className="notif-wrap">
              <button
                className="icon-btn"
                type="button"
                onClick={() => setNotifOpen((open) => !open)}
                aria-label={`Notifications${unreadNotifs ? ` (${unreadNotifs} non lues)` : ""}`}
                aria-expanded={notifOpen}
              >
                <Bell size={18} strokeWidth={2} />
                {unreadNotifs > 0 && <span className="counter">{unreadNotifs > 99 ? "99+" : unreadNotifs}</span>}
              </button>
              <div className={`notif-panel ${notifOpen ? "open" : ""}`}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--line)" }}>
                  <strong>Notifications</strong>
                  <button className="btn ghost sm" type="button" onClick={markAllNotificationsRead} disabled={unreadNotifs === 0}>
                    Tout lire
                  </button>
                </div>
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <p className="muted" style={{ padding: 14, fontSize: 13 }}>Aucune notification.</p>
                  ) : (
                    notifications.slice(0, 8).map((n) => {
                      const meta = NOTIF_ICONS[n.type] || NOTIF_ICONS.info;
                      const Icon = meta.icon;
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleNotifClick(n)}
                          style={{ display: "flex", gap: 10, width: "100%", padding: "10px 14px", border: 0, borderBottom: "1px solid var(--line)", background: n.unread ? "var(--brand-soft, #fdeee0)" : "transparent", textAlign: "left", cursor: "pointer" }}
                        >
                          <span className={meta.className}><Icon size={16} /></span>
                          <span style={{ minWidth: 0, flex: 1 }}>
                            <strong style={{ display: "block", fontSize: 13 }}>{n.title}</strong>
                            {n.desc && <small className="muted" style={{ display: "block" }}>{n.desc}</small>}
                            {n.time && <small className="muted">{n.time}</small>}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                <div style={{ padding: 10, textAlign: "center" }}>
                  <NavLink to="/notifications" onClick={() => setNotifOpen(false)}>
                    Voir toutes les notifications
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Sub-container page avec transition animée */}
        <section className="content page-transition-wrap" key={location.pathname}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}