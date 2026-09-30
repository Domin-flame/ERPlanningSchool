import React, { useCallback, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { ToastContext } from "./contexts.js";

const ICONS = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (tone, message, title) => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((prev) => [...prev.slice(-3), { id, tone, message, title }]);
      setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4000);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (message, title) => push("success", message, title),
      error: (message, title) => push("error", message, title),
      warning: (message, title) => push("warning", message, title),
      info: (message, title) => push("info", message, title),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone] || Info;
          return (
            <div key={toast.id} className={`toast toast--${toast.tone}`} role="status">
              <Icon size={18} aria-hidden="true" />
              <div className="toast__body">
                {toast.title && <strong>{toast.title}</strong>}
                <span>{toast.message}</span>
              </div>
              <button type="button" className="icon-btn icon-btn--sm" onClick={() => dismiss(toast.id)} aria-label="Fermer">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
