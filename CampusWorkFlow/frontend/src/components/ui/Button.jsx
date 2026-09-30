import React from "react";
import { Spinner } from "./States.jsx";

export default function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  block = false,
  className = "",
  children,
  type = "button",
  disabled,
  ...props
}) {
  const classes = ["btn", `btn--${variant}`, `btn--${size}`, block && "btn--block", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Spinner size={16} /> : Icon && <Icon size={size === "sm" ? 14 : 16} aria-hidden="true" />}
      {children && <span>{children}</span>}
      {IconRight && !loading && <IconRight size={16} aria-hidden="true" />}
    </button>
  );
}

export function IconButton({ icon: Icon, label, size = "md", className = "", ...props }) {
  return (
    <button type="button" className={`icon-btn icon-btn--${size} ${className}`} aria-label={label} title={label} {...props}>
      <Icon size={size === "sm" ? 14 : 18} aria-hidden="true" />
    </button>
  );
}
