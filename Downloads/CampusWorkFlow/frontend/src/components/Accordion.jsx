import React, { useState } from "react";

/**
 * Accordéon vertical : header cliquable avec titre + chevron, contenu dépliable.
 */
export default function Accordion({ items = [] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="accordion">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div className={`acc-item ${isOpen ? "open" : ""}`} key={i}>
            <button
              className="acc-head"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <span className={`chevron ${isOpen ? "up" : ""}`}>⌄</span>
            </button>
            {isOpen && <div className="acc-body">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
}
