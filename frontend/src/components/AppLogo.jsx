import React from "react";
import logo from "../assets/campusworkflow.png";

export default function AppLogo({
  size = 42,
  className = "",
  alt = "CampusWorkflow logo",
  style = {},
}) {
  return (
    <img
      src={logo}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{
        display: "block",
        objectFit: "contain",
        userSelect: "none",
        ...style,
      }}
    />
  );
}
