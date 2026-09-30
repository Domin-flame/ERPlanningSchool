import React from "react";
import { NavLink } from "react-router-dom";
import Logo from "../components/brand/Logo.jsx";
import { getNavigation, roleLabel, SETTINGS_NAV_ITEM } from "../app/roles.js";
import { useAuth } from "../hooks/useAuth.js";
import { useNotifications } from "../hooks/useNotifications.js";

function NavItem({ item, badge, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end={item.to === "/dashboard"} className={({ isActive }) => `nav-item ${isActive ? "is-active" : ""}`} onClick={onNavigate}>
      <Icon size={18} aria-hidden="true" />
      <span>{item.label}</span>
      {badge > 0 && <span className="nav-item__badge">{badge > 99 ? "99+" : badge}</span>}
    </NavLink>
  );
}

export default function Sidebar({ open, onNavigate }) {
  const { role } = useAuth();
  const { unreadCount } = useNotifications();
  const sections = getNavigation(role);

  return (
    <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Navigation principale">
      <div className="sidebar__brand">
        <Logo tone="light" subtitle={roleLabel(role)} />
      </div>
      <nav className="sidebar__nav">
        {sections.map((section) => (
          <div key={section.title} className="nav-section">
            <span className="nav-section__title">{section.title}</span>
            {section.items.map((item) => (
              <NavItem key={item.to} item={item} onNavigate={onNavigate} badge={item.to === "/notifications" ? unreadCount : 0} />
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar__footer">
        <NavItem item={SETTINGS_NAV_ITEM} onNavigate={onNavigate} />
      </div>
    </aside>
  );
}
