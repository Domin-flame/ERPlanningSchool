import React, { useCallback, useMemo, useState } from "react";
import { Archive, Bell, CheckCheck, Trash2 } from "lucide-react";
import { AsyncContent, Badge, Button, Card, EmptyState, IconButton, PageHeader, Tabs } from "../../components/ui";
import { notificationsApi } from "../../api/notifications.js";
import { errorMessage } from "../../api/errors.js";
import { asList } from "../../api/http.js";
import { useApi } from "../../hooks/useApi.js";
import { useNotifications } from "../../hooks/useNotifications.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDateTime, formatRelative } from "../../utils/format.js";

const TYPE_TONE = { info: "info", success: "success", warning: "warning", error: "danger", alert: "danger" };
const FILTERS = {
  all: {},
  unread: { unread_only: true },
  archived: { include_archived: true },
};

export default function NotificationsPage() {
  const toast = useToast();
  const { refreshUnread } = useNotifications();
  const [filter, setFilter] = useState("all");
  const fetcher = useCallback(() => notificationsApi.list({ ...FILTERS[filter], limit: 100 }).then(asList), [filter]);
  const { data, loading, error, reload, setData } = useApi(fetcher, { initialData: [] });

  const items = useMemo(
    () => (data || []).filter((n) => (filter === "archived" ? n.archived : true)),
    [data, filter]
  );
  const unread = items.filter((n) => !n.read);

  const run = async (action, update, message) => {
    try {
      await action();
      setData(update);
      refreshUnread();
      if (message) toast.success(message);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const markRead = (n) => !n.read && run(() => notificationsApi.markRead([n.id]), (prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
  const markAll = () => run(() => notificationsApi.markRead([]), (prev) => prev.map((x) => ({ ...x, read: true })), "Toutes les notifications sont lues.");
  const archive = (n) => run(() => notificationsApi.archive(n.id), (prev) => (filter === "archived" ? prev.map((x) => (x.id === n.id ? { ...x, archived: true } : x)) : prev.filter((x) => x.id !== n.id)), "Notification archivée.");
  const remove = (n) => run(() => notificationsApi.remove(n.id), (prev) => prev.filter((x) => x.id !== n.id), "Notification supprimée.");

  return (
    <div className="page">
      <PageHeader eyebrow="Communication" title="Notifications" description="Alertes et informations envoyées par les différents services."
        actions={<Button variant="secondary" icon={CheckCheck} disabled={!unread.length} onClick={markAll}>Tout marquer comme lu</Button>} />
      <Tabs value={filter} onChange={setFilter} tabs={[
        { value: "all", label: "Toutes" },
        { value: "unread", label: "Non lues" },
        { value: "archived", label: "Archivées" },
      ]} />
      <Card padded={false}>
        <AsyncContent loading={loading} error={error} onRetry={reload} isEmpty={!items.length}
          empty={<EmptyState icon={Bell} title="Aucune notification" description="Vous êtes à jour." />}>
          <ul className="notification-list">
            {items.map((n) => (
              <li key={n.id} className={`notification ${n.read ? "" : "is-unread"}`}>
                <button type="button" className="notification__body" onClick={() => markRead(n)}>
                  <span className="row">
                    <strong>{n.title}</strong>
                    {n.category && <Badge tone={TYPE_TONE[n.type] || "neutral"}>{n.category}</Badge>}
                  </span>
                  <span className="notification__message">{n.message}</span>
                  <time className="muted" dateTime={n.created_at} title={formatDateTime(n.created_at)}>{formatRelative(n.created_at)}</time>
                </button>
                <div className="notification__actions">
                  {!n.archived && <IconButton icon={Archive} label="Archiver" size="sm" onClick={() => archive(n)} />}
                  <IconButton icon={Trash2} label="Supprimer" size="sm" onClick={() => remove(n)} />
                </div>
              </li>
            ))}
          </ul>
        </AsyncContent>
      </Card>
    </div>
  );
}
