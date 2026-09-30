import React from "react";

export default function Card({ title, subtitle, actions, children, padded = true, className = "", footer }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="card__header">
          <div>
            {title && <h2 className="card__title">{title}</h2>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}
      <div className={padded ? "card__body" : "card__body card__body--flush"}>{children}</div>
      {footer && <footer className="card__footer">{footer}</footer>}
    </section>
  );
}
