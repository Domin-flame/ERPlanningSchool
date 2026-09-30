const LOCALE = "fr-FR";

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function formatDate(value, options = { day: "2-digit", month: "short", year: "numeric" }) {
  const date = toDate(value);
  return date ? date.toLocaleDateString(LOCALE, options) : "—";
}

export function formatDateTime(value) {
  const date = toDate(value);
  return date
    ? date.toLocaleString(LOCALE, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";
}

export function formatRelative(value) {
  const date = toDate(value);
  if (!date) return "";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} j`;
  return formatDate(date, { day: "2-digit", month: "short" });
}

export function formatMoney(value, currency = "XAF") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(value, digits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
}

/** Heure "HH:MM" à partir d'une heure SQL ("08:30:00") ou d'une date ISO complète. */
export function formatTime(value) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{1,2}:\d{2}/.test(text)) return text.slice(0, 5);
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
}

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Date locale au format YYYY-MM-DD (sans décalage UTC). */
export function isoDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function monthKey(date = new Date()) {
  return isoDate(date).slice(0, 7);
}

const DAY_LABELS = {
  Monday: "Lundi",
  Tuesday: "Mardi",
  Wednesday: "Mercredi",
  Thursday: "Jeudi",
  Friday: "Vendredi",
  Saturday: "Samedi",
  Sunday: "Dimanche",
};
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const dayLabel = (day) => DAY_LABELS[day] || day || "—";
export const todayDayName = () => DAY_NAMES[new Date().getDay()];

/** Filtre texte insensible à la casse et aux accents sur plusieurs champs. */
export function matchesQuery(query, ...fields) {
  const normalize = (v) =>
    String(v ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const q = normalize(query).trim();
  if (!q) return true;
  return fields.some((field) => normalize(field).includes(q));
}

export function sumBy(items, selector) {
  return items.reduce((total, item) => total + (Number(selector(item)) || 0), 0);
}

export function groupCount(items, selector) {
  const map = new Map();
  items.forEach((item) => {
    const key = selector(item) ?? "—";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}
