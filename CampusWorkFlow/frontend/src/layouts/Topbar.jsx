import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";
import Avatar from "../components/ui/Avatar.jsx";
import { roleLabel } from "../app/roles.js";
import { useAuth } from "../hooks/useAuth.js";
import { useNotifications } from "../hooks/useNotifications.js";

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

export default function Topbar({ onToggleSidebar }) {
  const { user, role, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useClickOutside(menuRef, () => setMenuOpen(false));

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <button type="button" className="icon-btn topbar__menu" onClick={onToggleSidebar} aria-label="Ouvrir la navigation">
        <Menu size={20} />
      </button>
      <div className="topbar__context">
        <span className="topbar__date">{today}</span>
      </div>
      <div className="topbar__actions">
        <Link to="/notifications" className="icon-btn topbar__bell" aria-label={`Notifications (${unreadCount} non lues)`}>
          <Bell size={18} />
          {unreadCount > 0 && <span className="topbar__dot">{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </Link>
        <div className="user-menu" ref={menuRef}>
          <button type="button" className="user-menu__trigger" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-haspopup="menu">
            <Avatar name={user?.full_name || user?.email} size={34} />
            <span className="user-menu__identity">
              <strong>{user?.full_name || user?.email}</strong>
              <small>{roleLabel(role)}</small>
            </span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div className="user-menu__panel" role="menu">
              <div className="user-menu__header">
                <strong>{user?.full_name}</strong>
                <span>{user?.email}</span>
              </div>
              <Link to="/settings" role="menuitem" onClick={() => setMenuOpen(false)}>
                <User size={16} /> Mon profil
              </Link>
              <Link to="/settings" role="menuitem" onClick={() => setMenuOpen(false)}>
                <Settings size={16} /> Paramètres
              </Link>
              <button type="button" role="menuitem" onClick={handleLogout} className="is-danger">
                <LogOut size={16} /> Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
