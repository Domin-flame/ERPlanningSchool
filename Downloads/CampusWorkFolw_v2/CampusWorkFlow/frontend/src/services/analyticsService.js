import api from "../api/client.js";

/** Charge les indicateurs académiques agrégés par le backend. */
export async function fetchAcademicSummary() {
  const response = await api.get("/academic/analytics/summary");
  return response.data;
}
