import React from "react";
import { Link } from "react-router-dom";

//a quoi sert le breadcrumb dans le code 
/**
 * Fil d'ariane (breadcrumb). Chaque entrée est un objet { label, to? }.
 */
export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="breadcrumbs" aria-label="Fil d'ariane">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">›</span>}
            {last ? (
              <span className="current">{item.label}</span>
            ) : item.to ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span>{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
