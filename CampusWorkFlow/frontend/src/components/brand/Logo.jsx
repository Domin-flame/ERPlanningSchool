import React from "react";
import logo from "../../assets/campusworkflow.png";

export default function Logo({ size = 36, withText = true, tone = "dark", subtitle = "ERP universitaire" }) {
  return (
    <span className={`brand brand--${tone}`}>
      <img src={logo} alt="" width={size} height={size} className="brand__mark" draggable={false} />
      {withText && (
        <span className="brand__text">
          <strong>
            Campus<span>Workflow</span>
          </strong>
          {subtitle && <small>{subtitle}</small>}
        </span>
      )}
    </span>
  );
}
