import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import AppLogo from "./AppLogo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getRoleNavigation, ROLE_LABELS } from "../app/access.js";

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const role = user?.role;
  const navigation = getRoleNavigation(role);
  const name = user?.full_name || user?.name || "Utilisateur";
  const roleLabel = user?.role_label || user?.roleLabel || ROLE_LABELS[role]?.full || role;

  const renderLinks = (items) =>
    items.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={`${to}-${label}`}
        to={to}
        end={end}
        className={({ isActive }) => (isActive ? "active" : "")}
        onClick={() => setSidebarOpen(false)}
      >
        <span className="ico"><Icon size={18} strokeWidth={2} /></span>
        <span>{label}</span>
      </NavLink>
    ));

  return (
    <div className="app">
      {sidebarOpen && (
        <button
          className="scrim"
          aria-label="Fermer la navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Navigation principale">
        <div className="brand">
          <div className="brand-mark"><AppLogo size={34} /></div>
          <div>
            <h1>CampusWorkflow</h1>
            <p>ERP Scolaire Unifié</p>
          </div>
        </div>

        <nav className="nav" aria-label="Portails">
          <span className="nav-label">Portail {roleLabel || "Principal"}</span>
          {renderLinks(navigation.portals)}
        </nav>

        <nav className="nav" aria-label="Outils et espaces">
          <span className="nav-label">Outils & Espaces</span>
          {renderLinks(navigation.tools)}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar" aria-hidden="true">
            {name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="sidebar-user">
            <strong title={name}>{name}</strong>
            <span className={`role-pill ${role || ""}`}>{roleLabel}</span>
          </div>
          <button
            className="icon-btn"
            type="button"
            onClick={logout}
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <LogOut size={16} strokeWidth={2} />
          </button>
        </div>
      </aside>

      <main className="main" id="main-content">
        <header className="app-mobile-header">
          <button
            className="hamburger"
            type="button"
            aria-expanded={sidebarOpen}
            aria-label="Ouvrir la navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <strong>CampusWorkflow</strong>
        </header>
        <section className="content page-transition-wrap" key={location.pathname}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}
