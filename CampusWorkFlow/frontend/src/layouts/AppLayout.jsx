import React, { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import { PageLoader } from "../components/ui/States.jsx";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const close = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Aller au contenu</a>
      <Sidebar open={sidebarOpen} onNavigate={close} />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={close} aria-hidden="true" />}
      <div className="app-shell__main">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main id="main-content" className="app-content" tabIndex={-1}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
