import React from "react";

const MAP = {
  Active: "success",
  Completed: "neutral",
  Draft: "warning",
  Inactive: "neutral",
  "In Progress": "success",
  Pending: "warning",
  "On Leave": "warning",
  Overdue: "danger",
  success: "success",
  warning: "warning",
  danger: "danger",
  neutral: "neutral",
};

export default function Badge({ status }) {
  const cls = MAP[status] || "neutral";
  return <span className={`badge ${cls}`}>{status}</span>;
}
