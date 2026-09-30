import React, { useCallback, useEffect, useMemo, useState } from "react";
import { notificationsApi } from "../api/notifications.js";
import { useAuth } from "../hooks/useAuth.js";
import { NotificationsContext } from "./contexts.js";

// La gateway ne relaie pas encore les WebSockets : on interroge
// périodiquement le compteur de notifications non lues.
const POLL_INTERVAL_MS = 60 * 1000;

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [available, setAvailable] = useState(true);

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

  const value = useMemo(
    () => ({ unreadCount: isAuthenticated ? unreadCount : 0, available, refreshUnread }),
    [isAuthenticated, unreadCount, available, refreshUnread]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
