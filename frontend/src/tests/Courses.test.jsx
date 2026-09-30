import MockAdapter from "axios-mock-adapter";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "../api/client.js";

const mockUseAuth = vi.fn();
vi.mock("../context/AuthContext.jsx", () => ({ useAuth: () => mockUseAuth() }));
vi.mock("../context/DataContext.jsx", () => ({ useData: () => ({ refreshData: vi.fn() }) }));

const { default: Courses } = await import("../pages/general/Courses.jsx");

const today = new Date().toISOString().slice(0, 10);
const nextYear = `${Number(today.slice(0, 4)) + 1}-12-31`;
let mock;

beforeEach(() => {
  mock = new MockAdapter(http);
  mock.onGet("/academic/courses/").reply(200, [{ course_id: 1, code: "CS201", title: "Algorithmique", credits: 6, module_id: 1 }]);
  mock.onGet("/academic/modules/").reply(200, [{ module_id: 1, code: "UE-1", title: "Algo" }]);
  mock.onGet("/academic/course-offerings/").reply(200, [{ course_offering_id: 1, course_id: 1, semester_id: 1 }]);
  mock.onGet("/academic/semesters/").reply(200, [
    { semester_id: 1, term_name: "Semestre 1", start_date: "2000-01-01", end_date: nextYear, is_locked: false },
  ]);
  mock.onGet("/academic/campuses/").reply(200, [{ campus_id: 1, name: "Campus Principal" }]);
  mock.onGet("/academic/teachers/").reply(200, [{ teacher_id: 1, user_id: 1, employee_code: "ENS-1" }]);
  mock.onGet("/academic/users/").reply(200, [{ user_id: 1, name: "Dr. Awa", email: "prof@campus.edu" }]);
});

afterEach(() => {
  mock.restore();
});

function renderCourses() {
  return render(
    <MemoryRouter>
      <Courses />
    </MemoryRouter>
  );
}

describe("Courses — création d'un cours puis ouverture aux inscriptions", () => {
  it("crée le cours, enchaîne sur l'ouverture d'une session et l'enregistre", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "academic" } });
    mock.onPost("/academic/courses/").reply(201, { course_id: 2, code: "NET210", title: "Réseaux", credits: 4, module_id: 1 });
    mock.onPost("/academic/course-offerings/").reply(201, { course_offering_id: 2, course_id: 2, semester_id: 1, name: "NET210 — Groupe A" });
    renderCourses();

    expect(await screen.findByText(/1 session\(s\) ouverte\(s\) aux inscriptions/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ouvrir une session du cours CS201" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+ Créer un cours" }));
    fireEvent.change(screen.getByPlaceholderText("ex. Algorithmique avancée"), { target: { value: "Réseaux" } });
    fireEvent.change(screen.getByPlaceholderText("ex. CS201"), { target: { value: "NET210" } });
    fireEvent.change(screen.getByRole("combobox", { name: /Module parent/ }), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    const dialog = await screen.findByRole("dialog", { name: "Ouvrir une session — NET210" });
    expect(within(dialog).getByText(/cours « Réseaux »/)).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "Ouvrir aux inscriptions" });
    await vi.waitFor(() => expect(screen.getByRole("combobox", { name: /Enseignant/ })).toHaveValue("1"));
    expect(screen.getByRole("combobox", { name: /Semestre/ })).toHaveValue("1");
    expect(screen.getByRole("combobox", { name: /Campus/ })).toHaveValue("1");
    fireEvent.click(submit);

    expect(await screen.findByText(/Session « NET210 — Groupe A » ouverte/)).toBeInTheDocument();
    expect(JSON.parse(mock.history.post[1].data)).toEqual({
      name: "NET210 — Groupe A",
      course_id: 2,
      semester_id: 1,
      campus_id: 1,
      teacher_id: 1,
    });
    expect(screen.queryByRole("dialog", { name: /Ouvrir une session/ })).not.toBeInTheDocument();
  });

  it("n'affiche aucune action de gestion pour un étudiant", async () => {
    mockUseAuth.mockReturnValue({ user: { role: "student" } });
    renderCourses();

    expect(await screen.findByText("Algorithmique")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Créer un cours" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ouvrir une session/ })).not.toBeInTheDocument();
  });
});
