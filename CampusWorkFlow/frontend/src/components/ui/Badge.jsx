import React from "react";
import { statusMeta } from "../../utils/status.js";

export default function Badge({ tone = "neutral", children, dot = false }) {
  return (
    <span className={`badge badge--${tone}`}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function StatusBadge({ map, value }) {
  const meta = statusMeta(map, value);
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
