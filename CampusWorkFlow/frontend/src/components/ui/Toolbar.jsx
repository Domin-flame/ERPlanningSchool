import React from "react";

export default function Toolbar({ children, end }) {
  return (
    <div className="toolbar">
      <div className="toolbar__start">{children}</div>
      {end && <div className="toolbar__end">{end}</div>}
    </div>
  );
}
