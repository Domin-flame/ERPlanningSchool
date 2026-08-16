import React, { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import Badge from "../../components/Badge.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

function toISODate(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function mondayFirstIndex(jsDay) {
  return (jsDay + 6) % 7;
}

function buildMonthGrid(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekdayIndex = mondayFirstIndex(new Date(year, month, 1).getDay());
  const cells = Array.from({ length: firstWeekdayIndex }, () => null);

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, iso: toISODate(year, month, day) });
  }

  return cells;
}

function getDefaultStatus(module) {
  switch (module) {
    case "finance":
      return "Overdue";
    case "personal":
      return "Pending";
    case "hr":
      return "Active";
    default:
      return "Active";
  }
}

function normalizeEvent(item, fallbackModule = "academic") {
  const module = item.module || fallbackModule;
  const dateKey = item.event_date || item.date || item.eventDate || null;

  return {
    id: String(item.id ?? `${module}-${dateKey ?? Date.now()}-${Math.random()}`),
    title: item.title || item.label || "Événement",
    status: item.status || getDefaultStatus(module),
    module,
    reminder: Boolean(item.reminder),
    reminderTime: item.reminder_time || item.reminderTime || "",
    notes: item.notes || item.description || "",
    dateIso: dateKey,
  };
}

async function fetchMonthEvents(year, month, token, userRole = "") {
  const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const role = (userRole || "").toLowerCase();

  const requests = [
    fetch(`${API_BASE_URL}/personal/events?month=${monthParam}`, { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((items) => (Array.isArray(items) ? items : []))
      .catch(() => []),
    fetch(`${API_BASE_URL}/academic/events?month=${monthParam}`, { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((items) => (Array.isArray(items) ? items : []))
      .catch(() => []),
  ];

  const wantsFinance =
    role.includes("student") ||
    role.includes("etudiant") ||
    role.includes("finance") ||
    role.includes("financier") ||
    role.includes("admin") ||
    role.includes("direction") ||
    role.includes("academic");

  const wantsHr =
    role.includes("employee") ||
    role.includes("employe") ||
    role.includes("teacher") ||
    role.includes("enseignant") ||
    role.includes("staff") ||
    role.includes("rh") ||
    role.includes("finance") ||
    role.includes("admin") ||
    role.includes("direction") ||
    role.includes("academic");

  if (wantsFinance) {
    requests.push(
      fetch(`${API_BASE_URL}/finance/events?month=${monthParam}`, { headers })
        .then((res) => (res.ok ? res.json() : []))
        .then((items) => (Array.isArray(items) ? items : []))
        .catch(() => [])
    );
  }

  if (wantsHr) {
    requests.push(
      fetch(`${API_BASE_URL}/hr/events?month=${monthParam}`, { headers })
        .then((res) => (res.ok ? res.json() : []))
        .then((items) => (Array.isArray(items) ? items : []))
        .catch(() => [])
    );
  }

  const results = await Promise.all(requests);
  const eventsByDate = {};

  results.flat().forEach((item) => {
    const module =
      item.module ||
      (item.type === "finance" ? "finance" : item.type === "hr" ? "hr" : item.type === "personal" ? "personal" : "academic");
    const event = normalizeEvent({ ...item, module }, module);
    const dateKey = event.dateIso;

    if (!dateKey) return;

    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(event);
  });

  return eventsByDate;
}

export default function CalendarPage() {
  const { user, token } = useAuth();
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDateISO, setSelectedDateISO] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [savingNote, setSavingNote] = useState(false);

  const today = useMemo(() => new Date(), []);
  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthLabel = useMemo(() => {
    const label = viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [viewDate]);

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMonthEvents(year, month, token, user?.role || user?.user_type || "")
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
  }, [year, month, token, user]);

  const eventsThisMonthList = useMemo(() => {
    const list = [];
    Object.entries(events).forEach(([dateIso, items]) => {
      items.forEach((item) => list.push({ dateIso, ...item }));
    });
    return list.sort((a, b) => a.dateIso.localeCompare(b.dateIso));
  }, [events]);

  function goToPreviousMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function goToToday() {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  function handleOpenAddNoteModal(isoDate) {
    setSelectedDateISO(isoDate || todayISO);
    setNoteTitle("");
    setNoteText("");
    setHasReminder(false);
    setReminderTime("09:00");
    setModalOpen(true);
  }

  async function handleSaveNote(event) {
    event.preventDefault();
    if (!noteTitle.trim() || !selectedDateISO) return;

    setSavingNote(true);

    const payload = {
      title: noteTitle,
      notes: noteText,
      event_date: selectedDateISO,
      reminder: hasReminder,
      reminder_time: hasReminder ? reminderTime : null,
      module: "personal",
      status: "Pending",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/personal/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const saved = response.ok ? await response.json() : payload;
      const normalized = normalizeEvent({ ...saved, module: "personal" }, "personal");

      setEvents((prev) => {
        const existing = prev[selectedDateISO] || [];
        return {
          ...prev,
          [selectedDateISO]: [...existing, normalized],
        };
      });
    } catch (err) {
      setEvents((prev) => {
        const item = normalizeEvent({ ...payload, id: `local-${Date.now()}` }, "personal");
        return {
          ...prev,
          [selectedDateISO]: [...(prev[selectedDateISO] || []), item],
        };
      });
    } finally {
      setSavingNote(false);
      setModalOpen(false);
    }
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Planning" }, { label: monthLabel }]} />

      <div className="page-head">
        <div>
          <h2>Calendrier & Planning</h2>
          <p className="muted">
            Vue mensuelle agrégée : cours, examens, échéances, congés et notes personnelles.
          </p>
        </div>
        <div className="actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" onClick={() => handleOpenAddNoteModal(todayISO)}>
            + Note / Rappel
          </button>
          <button className="btn">Jour</button>
          <button className="btn">Semaine</button>
          <button className="btn primary">Mois</button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "#dc2626", marginBottom: 16 }}>
          <p style={{ color: "#dc2626", fontSize: 13 }}>
            Impossible de charger certains événements : {error}. Vérifiez que la passerelle API et les services sont démarrés.
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
                <div
                  className={`day${cell.iso === todayISO ? " today" : ""}`}
                  key={cell.iso}
                  onClick={() => handleOpenAddNoteModal(cell.iso)}
                  title="Cliquer pour ajouter une note ou un rappel"
                  style={{ cursor: "pointer" }}
                >
                  <strong>{cell.day}</strong>
                  {(events[cell.iso] || []).map((event, idx) => (
                    <div key={event.id || `${cell.iso}-${idx}`} className={`event ${event.module}`}>
                      {event.reminder && <span title={`Rappel à ${event.reminderTime}`}>🔔 </span>}
                      {event.title}
                    </div>
                  ))}
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
                  <span
                    className={iso === todayISO ? "picked" : ""}
                    key={iso}
                    onClick={() => handleOpenAddNoteModal(iso)}
                    style={{ cursor: "pointer" }}
                  >
                    {day}
                  </span>
                ))}
            </div>
          </div>

          <div className="card">
            <h3>Légende & Modules</h3>
            <p><Badge status="Active" /> Académique</p>
            <p><Badge status="Overdue" /> Finance</p>
            <p><Badge status="Pending" /> Notes / Rappels</p>
            <p><Badge status="Active" /> RH / Paie</p>
          </div>

          <div className="card">
            <h3>Événements du mois</h3>
            {loading ? (
              <p className="muted" style={{ fontSize: 13 }}>Chargement…</p>
            ) : eventsThisMonthList.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>
                Aucun événement enregistré pour {monthLabel}.
              </p>
            ) : (
              eventsThisMonthList.map((event) => (
                <div key={event.id} style={{ marginBottom: 10, fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Badge status={event.status} />
                    <strong>{event.title}</strong>
                    {event.reminder && <span>🔔 {event.reminderTime}</span>}
                  </div>
                  <div className="muted" style={{ fontSize: 11, marginLeft: 22, marginTop: 3 }}>
                    {event.dateIso?.split("-")[2]} {monthLabel.split(" ")[0]} — {event.module}
                    {event.notes && <div>Note: {event.notes}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {modalOpen && selectedDateISO && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div className="card" style={{ width: 420, maxWidth: "100%", background: "#fff" }} onClick={(e) => e.stopPropagation()}>
            <h3>Ajouter une note ou un rappel</h3>
            <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
              Date sélectionnée : <strong>{selectedDateISO}</strong>
            </p>

            <form onSubmit={handleSaveNote}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
                  Titre
                </label>
                <input
                  type="text"
                  className="field"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Ex. Révision examen, Paiement tranche 2"
                  required
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
                  Détail
                </label>
                <textarea
                  className="field"
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Ajoutez une description ou un commentaire..."
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <input
                  type="checkbox"
                  id="reminder-check"
                  checked={hasReminder}
                  onChange={(e) => setHasReminder(e.target.checked)}
                />
                <label htmlFor="reminder-check" style={{ fontSize: 13 }}>
                  Configurer un rappel
                </label>
              </div>

              {hasReminder && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
                    Heure du rappel
                  </label>
                  <input
                    type="time"
                    className="field"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn" onClick={() => setModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn primary" disabled={savingNote}>
                  {savingNote ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}