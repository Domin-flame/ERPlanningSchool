import React, { useEffect, useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import Skeleton, { SkeletonList } from "../../components/Skeleton.jsx";
import { useData } from "../../context/DataContext.jsx";
import api from "../../api/client.js";

export default function Notification() {
  const { notifications, loading, markNotificationRead, refreshData } = useData();
  const [items, setItems] = useState([]);
  const [actionError, setActionError] = useState("");

  useEffect(() => setItems(notifications || []), [notifications]);

  const archive = async (id) => {
    try {
      await api.patch(`/notifications/${id}/archive`);
      setItems((current) => current.filter((item) => item.id !== id));
      await refreshData();
    } catch (error) {
      setActionError(error.response?.data?.detail || "Impossible d'archiver la notification.");
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setItems((current) => current.filter((item) => item.id !== id));
      await refreshData();
    } catch (error) {
      setActionError(error.response?.data?.detail || "Impossible de supprimer la notification.");
    }
  };

  const markRead = async (item) => {
    if (!item.unread) return;
    try {
      await markNotificationRead(item.id);
      setItems((current) => current.map((notification) => notification.id === item.id ? { ...notification, unread: false } : notification));
    } catch (error) {
      setActionError(error.response?.data?.detail || "Impossible de marquer la notification comme lue.");
    }
  };

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Notifications" }]} />
      <div className="page-head"><div><h2>Notifications</h2><p className="muted">Alertes personnelles générées par les modules de CampusWorkflow.</p></div></div>
      {actionError && <p role="alert" style={{ color: "var(--danger)" }}>{actionError}</p>}
      {loading && !items.length ? <SkeletonList rows={5} height={70} /> : items.length === 0 ? <div className="panel" style={{ padding: 24 }}><p className="muted">Aucune notification disponible.</p></div> : (
        <div className="panel">
          {items.map((item) => <article key={item.id} className="panel-row" style={{ padding: 16, borderBottom: "1px solid var(--line)", opacity: item.unread ? 1 : 0.7 }}>
            <div className="soft-icon" style={{ width: 44, height: 44 }}>●</div>
            <div style={{ flex: 1, minWidth: 0 }}><strong>{item.title}</strong><p style={{ margin: "4px 0" }}>{item.desc}</p><small className="muted">{item.time}</small></div>
            <div className="actions no-print"><button className="btn ghost sm" onClick={() => markRead(item)} disabled={!item.unread}>Marquer lu</button><button className="btn ghost sm" onClick={() => archive(item.id)}>Archiver</button><button className="btn ghost sm" onClick={() => remove(item.id)}>Supprimer</button></div>
          </article>)}
        </div>
      )}
    </div>
  );
}
