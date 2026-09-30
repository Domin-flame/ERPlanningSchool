import http, { unwrap } from "./http.js";

export const authApi = {
  login: (email, password) => unwrap(http.post("/auth/login", { email, password })),
  register: ({ full_name, email, password, role }) =>
    unwrap(http.post("/auth/register", { full_name, email, password, role })),
  me: () => unwrap(http.get("/auth/me")),
  logout: () => unwrap(http.post("/auth/logout")),
  changePassword: (oldPassword, newPassword) =>
    unwrap(http.post("/auth/password/change", { old_password: oldPassword, new_password: newPassword })),
  requestPasswordReset: (email) => unwrap(http.post("/auth/password/reset/request", { email })),
  confirmPasswordReset: (token, newPassword) =>
    unwrap(http.post("/auth/password/reset/confirm", { token, new_password: newPassword })),
  /** Annuaire minimal (id, full_name, email, role) — destinataires de messages. */
  directory: () => unwrap(http.get("/auth/directory")),
  /** Comptes utilisateurs — réservé RH / Direction. */
  listUsers: (statusFilter) =>
    unwrap(http.get("/auth/users", { params: statusFilter ? { status_filter: statusFilter } : {} })),
  manageUser: (id, action, role) => unwrap(http.patch(`/auth/users/${id}`, { action, role })),
};
