export default function PageHeader({ title, description, badge, badgeClass, actions }) {
  return (
    <header className="page-head">
      <div className="page-heading">
        <div className="page-heading-title">
          <h2>{title}</h2>
          {badge && <span className={`role-pill ${badgeClass}`}>{badge}</span>}
        </div>
        {description && <p className="muted">{description}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}
