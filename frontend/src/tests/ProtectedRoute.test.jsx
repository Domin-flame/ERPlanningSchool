import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

// On mocke le hook useAuth pour contrôler l'état d'authentification sans
// avoir besoin d'un vrai backend ni du AuthProvider complet.
const mockUseAuth = vi.fn();
vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => mockUseAuth(),
}));

// L'import doit se faire APRÈS le vi.mock ci-dessus.
const { default: ProtectedRoute } = await import("../components/ProtectedRoute.jsx");

function renderAt(path, allowedRoles) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={path}
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Contenu protégé</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Page de connexion</div>} />
        <Route path="/" element={<div>Dashboard académique</div>} />
        <Route path="/student" element={<div>Dashboard étudiant</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("affiche un loader pendant le chargement de la session", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null, loading: true });
    const { container } = renderAt("/student", ["student"]);
    expect(container.querySelector(".splash-loader")).not.toBeNull();
  });

  it("redirige vers /login si non authentifié", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null, loading: false });
    renderAt("/student", ["student"]);
    expect(screen.getByText("Page de connexion")).toBeInTheDocument();
  });

  it("affiche le contenu si le rôle de l'utilisateur est autorisé", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: "student" },
      loading: false,
    });
    renderAt("/student", ["student"]);
    expect(screen.getByText("Contenu protégé")).toBeInTheDocument();
  });

  it("redirige vers le dashboard du rôle si celui-ci n'est pas autorisé sur cette route", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: "student" },
      loading: false,
    });
    // La route /hr exige le rôle 'rh' ; un étudiant authentifié doit être
    // renvoyé vers SON dashboard (/student), pas vers /hr.
    renderAt("/hr", ["rh"]);
    expect(screen.getByText("Dashboard étudiant")).toBeInTheDocument();
  });

  it("laisse passer n'importe quel rôle authentifié si allowedRoles est vide", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: "marketing" },
      loading: false,
    });
    renderAt("/student", []);
    expect(screen.getByText("Contenu protégé")).toBeInTheDocument();
  });
});
