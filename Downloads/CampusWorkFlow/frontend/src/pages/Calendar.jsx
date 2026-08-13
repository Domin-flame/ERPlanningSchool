import React, { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import Badge from "../components/Badge.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Base de la passerelle API. Le frontend ne parle jamais directement à un
// microservice (ex: localhost:8002) — toujours via la passerelle (:3000),
// conformément à la section 6.3 du SRS.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

function toISODate(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// Lundi = 0 ... Dimanche = 6 (JS donne Dimanche = 0 par défaut)
function mondayFirstIndex(jsDay) {
  return (jsDay + 6) % 7;
}

/**
 * Construit la grille du mois : cases vides avant le 1er (alignement sur
 * le bon jour de semaine) + un objet par jour réel du mois.
 */
function buildMonthGrid(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekdayIndex = mondayFirstIndex(new Date(year, month, 1).getDay());

  const cells = Array.from({ length: firstWeekdayIndex }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, iso: toISODate(year, month, day) });
  }
  return cells;
}

/**
 * Récupère les événements du mois depuis le service Académique
 * (GET /api/academic/events?month=YYYY-MM), authentifié par JWT.
 *
 * Adaptez le nom du champ token si votre AuthContext l'expose autrement
 * (ex: `accessToken`, `session.token`...).
 */
async function fetchMonthEvents(year, month, token) {
  const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`;
  const response = await fetch(`${API_BASE_URL}/academic/events?month=${monthParam}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Échec du chargement des événements (${response.status})`);
  }

  const data = await response.json();
  // Normalise en { "YYYY-MM-DD": [title, status] } pour rester compatible
  // avec le rendu existant du calendrier. Adaptez selon la forme réelle
  // renvoyée par votre API (ex: { events: [...] } au lieu d'un tableau nu).
  const events = {};
  for (const item of data) {
    events[item.event_date] = [item.title, item.status];
  }
  return events;
}

export default function CalendarPage() {
  const { user, token } = useAuth();

  // Le mois affiché : initialisé sur aujourd'hui, modifiable via ‹ / ›
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = useMemo(() => new Date(), []);
  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthLabel = useMemo(() => {
    const label = viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [viewDate]);

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  // Recharge les événements à chaque changement de mois affiché.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMonthEvents(year, month, token)
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year, month, token]);

  const eventsThisMonth = useMemo(
    () => Object.entries(events).sort(([a], [b]) => a.localeCompare(b)),
    [events]
  );

  function goToPreviousMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function goToToday() {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Planning" }, { label: monthLabel }]} />

      <div className="page-head">
        <div>
          <h2>Calendrier & Planning</h2>
          <p className="muted">Vue mensuelle des cours, examens et événements institutionnels.</p>
        </div>
        <div className="actions">
          <button className="btn">Jour</button>
          <button className="btn">Semaine</button>
          <button className="btn primary">Mois</button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "#dc2626", marginBottom: 16 }}>
          <p style={{ color: "#dc2626", fontSize: 13 }}>
            Impossible de charger les événements : {error}. Vérifiez que la passerelle API et le
            service Académique sont démarrés.
          </p>
        </div>
      )}

      <div className="grid calendar-layout">
        <div className="panel">
          <div className="section-title" style={{ padding: "0 16px" }}>
            <button className="btn" onClick={goToPreviousMonth} aria-label="Mois précédent">
              ‹
            </button>
            <h3 onClick={goToToday} style={{ cursor: "pointer" }} title="Revenir à aujourd'hui">
              {monthLabel}
            </h3>
            <button className="btn" onClick={goToNextMonth} aria-label="Mois suivant">
              ›
            </button>
          </div>
          <div className="calendar-grid" style={{ opacity: loading ? 0.5 : 1 }}>
            {WEEKDAYS.map((d) => (
              <div className="weekday" key={d}>
                {d}
              </div>
            ))}
            {cells.map((cell, i) =>
              cell === null ? (
                <div className="day empty" key={`blank-${i}`} />
              ) : (
                <div className={`day${cell.iso === todayISO ? " today" : ""}`} key={cell.iso}>
                  <strong>{cell.day}</strong>
                  {events[cell.iso] && (
                    <div className={`event ${events[cell.iso][1]}`}>{events[cell.iso][0]}</div>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        <aside className="grid">
          <div className="card">
            <h3>Mini Calendrier</h3>
            <div className="mini-cal">
              {cells
                .filter(Boolean)
                .map(({ day, iso }) => (
                  <span className={iso === todayISO ? "picked" : ""} key={iso}>
                    {day}
                  </span>
                ))}
            </div>
          </div>
          <div className="card">
            <h3>Légende des types</h3>
            <p>
              <Badge status="Active" /> Cours
            </p>
            <p>
              <Badge status="Overdue" /> Examen
            </p>
            <p>
              <Badge status="Pending" /> Réunion / Événement
            </p>
          </div>
          <div className="card">
            <h3>Événements du mois</h3>
            {loading ? (
              <p className="muted" style={{ fontSize: 13 }}>
                Chargement…
              </p>
            ) : eventsThisMonth.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>
                Aucun événement enregistré pour {monthLabel}.
              </p>
            ) : (
              eventsThisMonth.map(([iso, [label, status]]) => (
                <p key={iso} style={{ fontSize: 13 }}>
                  <Badge status={status} /> {label} — {iso.split("-")[2]} {monthLabel.split(" ")[0]}
                </p>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}