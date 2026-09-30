import http, { unwrap } from "./http.js";

export const systemApi = {
  /** État de santé des microservices vus par la gateway. */
  servicesHealth: () => unwrap(http.get("/services/health")),
  /** Assistant IA proxifié par la gateway. history: [{ role, content }] */
  askAssistant: (message, history = []) => unwrap(http.post("/chatbot/message", { message, history })),
};
