import { useEffect, useRef } from "react";
import { API_BASE_URL } from "../api/http.js";
import { tokenStorage } from "../api/tokenStorage.js";

const PING_MS = 25 * 1000;
const MAX_RETRY_MS = 30 * 1000;

/** Construit l'URL WebSocket à partir de `VITE_API_URL` (absolue ou relative). */
export function realtimeUrl(path) {
  const base = new URL(`${API_BASE_URL}/`, window.location.href);
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  const url = new URL(path.replace(/^\/+/, ""), base);
  url.searchParams.set("token", tokenStorage.getAccessToken() || "");
  return url.toString();
}

/**
 * Ouvre un WebSocket vers la gateway (`/api/ws/...`) avec reconnexion
 * automatique. `onEvent` reçoit chaque message JSON ; `onOpen` est appelé
 * à chaque (re)connexion pour resynchroniser l'état.
 * Passer `path = null` désactive la connexion.
 */
export function useRealtime(path, { onEvent, onOpen } = {}) {
  const handlers = useRef({ onEvent, onOpen });

  useEffect(() => {
    handlers.current = { onEvent, onOpen };
  });

  useEffect(() => {
    if (!path || typeof WebSocket === "undefined") return undefined;

    let socket = null;
    let pingTimer = null;
    let retryTimer = null;
    let retryMs = 2000;
    let stopped = false;

    const connect = () => {
      if (stopped || !tokenStorage.getAccessToken()) return;
      socket = new WebSocket(realtimeUrl(path));

      socket.onopen = () => {
        retryMs = 2000;
        handlers.current.onOpen?.();
        pingTimer = setInterval(() => socket?.readyState === WebSocket.OPEN && socket.send("ping"), PING_MS);
      };

      socket.onmessage = (event) => {
        if (event.data === "pong") return;
        try {
          handlers.current.onEvent?.(JSON.parse(event.data));
        } catch {
          // message non JSON ignoré
        }
      };

      socket.onclose = () => {
        clearInterval(pingTimer);
        if (stopped) return;
        // Le jeton a pu être rafraîchi entre-temps : il est relu à la reconnexion.
        retryTimer = setTimeout(connect, retryMs);
        retryMs = Math.min(retryMs * 2, MAX_RETRY_MS);
      };
    };

    connect();

    return () => {
      stopped = true;
      clearInterval(pingTimer);
      clearTimeout(retryTimer);
      if (socket && socket.readyState <= WebSocket.OPEN) socket.close();
    };
  }, [path]);
}
