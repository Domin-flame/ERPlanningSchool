import React, { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AsyncContent, Badge, Button, Card, EmptyState, IconButton, PageHeader } from "../../components/ui";
import { academicApi } from "../../api/academic.js";
import { asList } from "../../api/http.js";
import { useApi } from "../../hooks/useApi.js";
import { formatDate, isoDate, monthKey } from "../../utils/format.js";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const STATUS_TONE = { scheduled: "info", planned: "info", completed: "success", cancelled: "neutral", open: "success", closed: "neutral" };

function buildGrid(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // semaine commençant le lundi
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function CalendarPage() {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const key = monthKey(month);
  const fetcher = useCallback(() => academicApi.events(key).then(asList), [key]);
  const { data, loading, error, reload } = useApi(fetcher, { initialData: [] });

  const byDay = useMemo(() => {
    const map = new Map();
    (data || []).forEach((e) => {
      const day = String(e.event_date).slice(0, 10);
      map.set(day, [...(map.get(day) || []), e]);
    });
    return map;
  }, [data]);

  const grid = buildGrid(month);
  const today = isoDate();
  const shift = (delta) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  const upcoming = [...(data || [])].sort((a, b) => String(a.event_date).localeCompare(String(b.event_date)));

  return (
    <div className="page">
      <PageHeader eyebrow="Vie académique" title="Calendrier" description="Événements académiques : examens, sessions, échéances."
        actions={
          <div className="row">
            <IconButton icon={ChevronLeft} label="Mois précédent" onClick={() => shift(-1)} />
            <strong className="calendar__title">{month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</strong>
            <IconButton icon={ChevronRight} label="Mois suivant" onClick={() => shift(1)} />
            <Button variant="secondary" size="sm" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Aujourd'hui</Button>
          </div>
        } />
      <div className="grid grid--calendar">
        <Card padded={false}>
          <AsyncContent loading={loading} error={error} onRetry={reload}>
            <div className="calendar" role="grid" aria-label="Calendrier mensuel">
              {WEEKDAYS.map((d) => <div key={d} className="calendar__weekday" role="columnheader">{d}</div>)}
              {grid.map((d) => {
                const iso = isoDate(d);
                const events = byDay.get(iso) || [];
                const outside = d.getMonth() !== month.getMonth();
                return (
                  <div key={iso} role="gridcell" className={`calendar__cell ${outside ? "is-outside" : ""} ${iso === today ? "is-today" : ""}`}>
                    <span className="calendar__day">{d.getDate()}</span>
                    {events.slice(0, 3).map((e, i) => <span key={i} className="calendar__event" title={e.title}>{e.title}</span>)}
                    {events.length > 3 && <small className="muted">+{events.length - 3}</small>}
                  </div>
                );
              })}
            </div>
          </AsyncContent>
        </Card>
        <Card title="Événements du mois">
          <AsyncContent loading={loading} error={error} onRetry={reload} isEmpty={!upcoming.length}
            empty={<EmptyState compact title="Aucun événement" description="Rien de programmé ce mois-ci." />}>
            <ul className="timeline">
              {upcoming.map((e, i) => (
                <li key={i}>
                  <strong>{e.title}</strong>
                  <span className="row"><small className="muted">{formatDate(e.event_date, { weekday: "long", day: "numeric", month: "long" })}</small>{e.status && <Badge tone={STATUS_TONE[String(e.status).toLowerCase()] || "neutral"}>{e.status}</Badge>}</span>
                </li>
              ))}
            </ul>
          </AsyncContent>
        </Card>
      </div>
    </div>
  );
}
