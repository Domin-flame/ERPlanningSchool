import React, { useCallback, useEffect, useMemo, useState } from "react";
import { notificationsApi } from "../api/notifications.js";
import { useAuth } from "../hooks/useAuth.js";
import { useRealtime } from "../hooks/useRealtime.js";
import { useToast } from "../hooks/useToast.js";
import { NotificationsContext } from "./contexts.js";

// Les nouvelles notifications arrivent en temps réel via le WebSocket
// `/api/ws/notifications` de la gateway. Un polling lent est conservé en
// secours si le WebSocket est indisponible (proxy, réseau…).
const POLL_INTERVAL_MS = 60 * 1000;

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [available, setAvailable] = useState(true);
  const [live, setLive] = useState(false);
  // Incrémenté à chaque notification reçue : les pages abonnées se rechargent.
  const [version, setVersion] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const count = await notificationsApi.unreadCount();
      setUnreadCount(Number(count) || 0);
      setAvailable(true);
    } catch {
      setAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    refreshUnread();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refreshUnread();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isAuthenticated, refreshUnread]);

  const onEvent = useCallback(
    (event) => {
      if (event?.type !== "notification") return;
      setUnreadCount((count) => count + 1);
      setVersion((v) => v + 1);
      toast.info(event.message, event.title);
    },
    [toast]
  );

  const onOpen = useCallback(() => {
    setLive(true);
    refreshUnread();
  }, [refreshUnread]);

  useRealtime(isAuthenticated ? "ws/notifications" : null, { onEvent, onOpen });

  useEffect(() => {
    if (!isAuthenticated) setLive(false);
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({ unreadCount: isAuthenticated ? unreadCount : 0, available, live, version, refreshUnread }),
    [isAuthenticated, unreadCount, available, live, version, refreshUnread]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
