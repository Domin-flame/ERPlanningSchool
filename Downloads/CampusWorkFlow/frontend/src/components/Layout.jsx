import React, { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import FoxMascot from "./FoxMascot.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";

// Navigation spécifique par rôle
//changer les icones pour mettre des icones lucid 
const ROLE_NAVIGATION = {
  academic: {
    portals: [
      { to: "/", label: "Dashboard Direction", icon: "📊", end: true },
      { to: "/student", label: "Portail Étudiant", icon: "🎓" },
      { to: "/professeur", label: "Espace Enseignant", icon: "👨‍🏫" },
      { to: "/marketing", label: "Portail Marketing", icon: "🎯" },
      { to: "/finance", label: "Portail Finance", icon: "💶" },
      { to: "/hr", label: "Portail RH", icon: "👥" },
    ],
    tools: [
      { to: "/students", label: "Dossiers Étudiants", icon: "📁" },
      { to: "/courses", label: "Catalogue Cours", icon: "📚" },
      { to: "/calendar", label: "Examens & Plannings", icon: "📅" },
      { to: "/messages", label: "Messagerie", icon: "💬" },
      { to: "/analytics", label: "Rapports & Analytics", icon: "📈" },
      { to: "/settings", label: "Paramètres ERP", icon: "⚙️" },
    ],
  },
  professeur: {
    portals: [
      { to: "/professeur", label: "Mon Espace Enseignant", icon: "👨‍🏫", end: true },
    ],
    tools: [
      { to: "/courses", label: "Mes Cours Enseignés", icon: "📚" },
      { to: "/students", label: "Saisie Notes & Appel", icon: "✏️" },
      { to: "/calendar", label: "Mon Emploi du temps", icon: "📅" },
      { to: "/messages", label: "Messagerie & Avis", icon: "💬" },
      { to: "/settings", label: "Mon Profil", icon: "⚙️" },
    ],
  },
  student: {
    portals: [
      { to: "/student", label: "Mon Espace Étudiant", icon: "🎓", end: true },
    ],
    tools: [
      { to: "/courses", label: "Mes Cours Inscrits", icon: "📚" },
      { to: "/calendar", label: "Mon Emploi du Temps", icon: "📅" },
      { to: "/finance", label: "Mes Frais & Solde", icon: "💳" },
      { to: "/messages", label: "Contacter Enseignant", icon: "💬" },
      { to: "/settings", label: "Mon Profil", icon: "⚙️" },
    ],
  },
  rh: {
    portals: [
      { to: "/hr", label: "Tableau de Bord RH", icon: "👥", end: true },
    ],
    tools: [
      { to: "/hr", label: "Personnel & Paie", icon: "💶" },
      { to: "/courses", label: "Formateurs & Enseignants", icon: "👨‍🏫" },
      { to: "/analytics", label: "Rapports RH", icon: "📊" },
      { to: "/messages", label: "Messagerie Interne", icon: "💬" },
      { to: "/settings", label: "Paramètres", icon: "⚙️" },
    ],
  },
  finance: {
    portals: [
      { to: "/finance", label: "Tableau de Bord Finance", icon: "💶", end: true },
    ],
    tools: [
      { to: "/finance", label: "Factures & Encaissements", icon: "📜" },
      { to: "/students", label: "Compte Étudiants", icon: "🎓" },
      { to: "/analytics", label: "Bilan & Bilan Trésorerie", icon: "📈" },
      { to: "/messages", label: "Messagerie", icon: "💬" },
      { to: "/settings", label: "Paramètres", icon: "⚙️" },
    ],
  },
  marketing: {
    portals: [
      { to: "/marketing", label: "Tableau de Bord Marketing", icon: "🎯", end: true },
    ],
    tools: [
      { to: "/marketing", label: "CRM Prospects & Leads", icon: "🎯" },
      { to: "/students", label: "Suivi des Inscriptions", icon: "🎓" },
      { to: "/analytics", label: "Analytics Conversions", icon: "📈" },
      { to: "/messages", label: "Messagerie", icon: "💬" },
      { to: "/settings", label: "Paramètres", icon: "⚙️" },
    ],
  },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { notifications, markAllNotificationsRead, searchQuery, setSearchQuery } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const currentRole = user?.role || "academic";
  const navConfig = ROLE_NAVIGATION[currentRole] || ROLE_NAVIGATION.academic;
  const unreadNotifs = notifications.filter((n) => n.unread).length;

  return (
    <div className="app">
      {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} />}
      
      {/* Sidebar navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <FoxMascot size={34} />
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
              <span className="ico">{item.icon}</span>
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
              <span className="ico">{item.icon}</span>
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
            🚪
          </button>
        </div>
      </aside>

      {/* Main content viewport */}
      <main className="main">
        {/* Topbar sticky */}
        <header className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Ouvrir le menu">
            ☰
          </button>

          {/* Global Search Bar */}
          <div className="search">
            <div className="search-inner">
              <span className="search-ico">🔍</span>
              <input
                placeholder="Rechercher cours, étudiants, factures, leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              />
            </div>
            {searchFocused && (
              <div className="search-panel open">
                <strong>Recherche Rapide ERP</strong>
                <div className="quick-tags" style={{ marginTop: 6 }}>
                  <span className="tag" onClick={() => setSearchQuery("CS101")}>CS101</span>
                  <span className="tag" onClick={() => setSearchQuery("Alexandre")}>Alexandre</span>
                  <span className="tag" onClick={() => setSearchQuery("Factures")}>Factures</span>
                </div>
              </div>
            )}
          </div>

          <div className="top-actions">
            {/* Notifications Dropdown */}
            <div className="notif-wrap">
              <button
                className="icon-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
              >
                🔔
                {unreadNotifs > 0 && <span className="counter">{unreadNotifs}</span>}
              </button>

              {notifOpen && (
                <div className="notif-panel open">
                  <div className="panel-row" style={{ paddingBottom: 10, borderBottom: "1px solid var(--line)" }}>
                    <strong>Notifications ({unreadNotifs})</strong>
                    <button className="btn ghost sm" style={{ marginLeft: "auto" }} onClick={markAllNotificationsRead}>
                      Tout lire
                    </button>
                  </div>
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {notifications.map((n) => (
                      <div className="panel-row" key={n.id} style={{ opacity: n.unread ? 1 : 0.6 }}>
                        {n.unread && <span className="dot" />}
                        <div>
                          <strong>{n.title}</strong>
                          <p className="muted" style={{ fontSize: 12, margin: "2px 0 0" }}>{n.desc}</p>
                          <span className="muted" style={{ fontSize: 10 }}>{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profil Utilisateur */}
            <div className="avatar" title={user?.email}>
              {(user?.full_name || user?.name || "??").substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Sub-container page avec transition animée */}
        <section className="content page-transition-wrap" key={location.pathname}>
          <Outlet />
        </section>
      </main>

      {/* Navigation Mobile en bas de l'écran */}
      <nav className="bottom-tabs">
        {navConfig.portals.concat(navConfig.tools.slice(0, 3)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `mobile-tab ${isActive ? "active" : ""}`}
          >
            <span className="ico">{item.icon}</span>
            <span>{item.label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
