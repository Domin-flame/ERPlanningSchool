import appSource from "../App.jsx?raw";
import { describe, expect, it } from "vitest";
import {
  ROLES,
  ROUTE_ACCESS,
  canAccess,
  canManageCourses,
  getRoleHome,
  getRoleLabel,
  getRoleNavigation,
  getRoleShortName,
} from "../app/access.js";

// Routes protégées explicitement dans App.jsx : <Route path="..."> suivi de
// <ProtectedRoute allowedRoles={[...]}>.
function explicitRouteRoles() {
  const pattern = /path="([^"]+)"\s*element=\{\s*<ProtectedRoute allowedRoles=\{\[([^\]]*)\]\}/g;
  const routes = {};
  for (const [, path, roles] of appSource.matchAll(pattern)) {
    routes[path] = roles.split(",").map((role) => role.trim().replace(/"/g, "")).filter(Boolean);
  }
  return routes;
}

describe("access.js", () => {
  it("reste aligné avec la protection explicite des routes de App.jsx", () => {
    const routes = explicitRouteRoles();
    expect(Object.keys(routes)).toContain("/student/courses");
    for (const [path, roles] of Object.entries(routes)) {
      expect([...ROUTE_ACCESS[path]].sort(), path).toEqual([...roles].sort());
    }
  });

  it("donne à chaque rôle un dashboard d'accueil accessible", () => {
    for (const role of ROLES) {
      expect(canAccess(role, getRoleHome(role))).toBe(true);
    }
    expect(getRoleHome("student")).toBe("/student");
    expect(getRoleHome("academic")).toBe("/");
    expect(getRoleHome("inconnu")).toBe("/");
  });

  it("ne propose dans la navigation que des liens autorisés", () => {
    for (const role of ROLES) {
      const { portals, tools } = getRoleNavigation(role);
      for (const item of [...portals, ...tools]) {
        expect(canAccess(role, item.to), `${role} -> ${item.to}`).toBe(true);
      }
    }
  });

  it("expose le catalogue d'inscription et les deux assistants à l'étudiant", () => {
    const links = getRoleNavigation("student").tools.map((item) => item.to);
    expect(links).toEqual(expect.arrayContaining(["/student/courses", "/chatbot", "/assistant"]));
    expect(canAccess("academic", "/student/courses")).toBe(false);
  });

  it("fournit les libellés de rôle et les droits de gestion des cours", () => {
    expect(getRoleLabel("academic")).toBeTruthy();
    expect(getRoleShortName("student")).toBeTruthy();
    expect(getRoleLabel("inconnu")).toBe("inconnu");
    expect(canManageCourses("academic")).toBe(true);
    expect(canManageCourses("professeur")).toBe(true);
    expect(canManageCourses("student")).toBe(false);
    expect(canAccess(null, "/")).toBe(false);
  });
});
