import React, { useEffect, useRef, useState } from "react";

/**
 * Toast de notification discret (haut à droite), disparaît après 3s.
 */
export default function Toast({ show, message = "Tâche soumise", sub = "Votre opération a été enregistrée." }) {
  const [visible, setVisible] = useState(show);
  const timer = useRef(null);

  useEffect(() => {
    if (show) {
      setVisible(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), 3000);
    }
    return () => clearTimeout(timer.current);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="toast show">
      <strong>{message}</strong>
      <p className="muted">{sub}</p>
    </div>
  );
}
