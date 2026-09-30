import React from "react";
import { Activity, RefreshCw } from "lucide-react";
import { AsyncContent, Badge, Card, IconButton } from "../../components/ui";
import { systemApi } from "../../api/system.js";
import { useApi } from "../../hooks/useApi.js";

const SERVICE_LABELS = {
  auth: "Authentification",
  academic: "Académique",
  finance: "Finance & marketing",
  hr: "Ressources humaines",
  message: "Messagerie",
  notification: "Notifications",
};

/** État des microservices tel que vu par la gateway (diagnostic rapide). */
export default function ServiceHealthCard() {
  const { data, loading, error, reload } = useApi(systemApi.servicesHealth);
  const services = Array.isArray(data) ? data : [];

  return (
    <Card
      title="État des services"
      subtitle="Disponibilité des microservices via la gateway"
      actions={<IconButton icon={RefreshCw} label="Actualiser" size="sm" onClick={reload} />}
    >
      <AsyncContent loading={loading} error={error} onRetry={reload} isEmpty={!services.length}>
        <ul className="health-list">
          {services.map((service) => (
            <li key={service.name}>
              <Activity size={16} aria-hidden="true" />
              <span>{SERVICE_LABELS[service.name] || service.name}</span>
              <small className="muted">{service.responseTime != null ? `${service.responseTime} ms` : ""}</small>
              <Badge tone={service.healthy ? "success" : "danger"} dot>
                {service.healthy ? "Opérationnel" : "Hors ligne"}
              </Badge>
            </li>
          ))}
        </ul>
      </AsyncContent>
    </Card>
  );
}
