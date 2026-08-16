import React, { useState } from "react";

// ajouter d'autres animations pour rendre l'application vivante 

/**
 * Tooltip simple au survol (position top / bottom).
 */
export default function Tooltip({ text, children, position = "top" }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="tooltip-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && <span className={`tooltip ${position}`}>{text}</span>}
    </span>
  );
}
