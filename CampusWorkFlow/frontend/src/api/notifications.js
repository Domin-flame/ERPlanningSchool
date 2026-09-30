import http, { unwrap } from "./http.js";

export const notificationsApi = {
  /** Réponse paginée { total, skip, limit, items } */
  list: (params = {}) => unwrap(http.get("/notifications/", { params: { limit: 50, ...params } })),
  unreadCount: () => unwrap(http.get("/notifications/unread-count")),
  /** ids vide = tout marquer comme lu */
  markRead: (ids = []) => unwrap(http.post("/notifications/read", { ids })),
  archive: (id) => unwrap(http.patch(`/notifications/${id}/archive`)),
  remove: (id) => unwrap(http.delete(`/notifications/${id}`)),
};
