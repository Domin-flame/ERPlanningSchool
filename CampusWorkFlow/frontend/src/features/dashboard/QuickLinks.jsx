import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Card } from "../../components/ui";

export default function QuickLinks({ title = "Accès rapides", links }) {
  return (
    <Card title={title}>
      <div className="quick-links">
        {links.map(({ to, label, description, icon: Icon }) => (
          <Link key={to + label} to={to} className="quick-link">
            {Icon && <span className="quick-link__icon"><Icon size={18} aria-hidden="true" /></span>}
            <span className="quick-link__text">
              <strong>{label}</strong>
              {description && <small>{description}</small>}
            </span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
