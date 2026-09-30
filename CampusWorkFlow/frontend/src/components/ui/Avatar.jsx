import React from "react";
import { initials } from "../../utils/format.js";

const PALETTE = ["#1d4ed8", "#0f766e", "#b45309", "#7c3aed", "#be123c", "#0369a1", "#4d7c0f"];

export default function Avatar({ name, size = 36 }) {
  const text = String(name || "?");
  const color = PALETTE[[...text].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % PALETTE.length];
  return (
    <span className="avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(text)}
    </span>
  );
}
