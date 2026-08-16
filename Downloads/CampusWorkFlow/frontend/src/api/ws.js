// Lightweight WebSocket helper that sends JWT in Sec-WebSocket-Protocol
function _toWsUrl(baseUrl, path) {
  try {
    const url = new URL(baseUrl, window.location.origin);
    const isSecure = url.protocol === "https:";
    const wsProtocol = isSecure ? "wss:" : "ws:";
    return `${wsProtocol}//${url.host}${path.startsWith("/") ? path : `/${path}`}`;
  } catch (e) {
    // fallback to same host
    const loc = window.location;
    const proto = loc.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${loc.host}${path.startsWith("/") ? path : `/${path}`}`;
  }
}

export function connectWithJwt({ baseApiUrl = "/api", path = "/ws/notifications", onMessage, onOpen, onClose, onError }) {
  const token = localStorage.getItem("cw_token");
  const wsUrl = _toWsUrl(baseApiUrl, path);

  const protocols = token ? [token] : [];
  const ws = new WebSocket(wsUrl, protocols);

  ws.onopen = (ev) => {
    if (onOpen) onOpen(ev, ws);
  };
  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      if (onMessage) onMessage(data, ev, ws);
    } catch (e) {
      if (onMessage) onMessage(ev.data, ev, ws);
    }
  };
  ws.onclose = (ev) => {
    if (onClose) onClose(ev);
  };
  ws.onerror = (ev) => {
    if (onError) onError(ev);
  };

  return ws;
}

export default { connectWithJwt };
