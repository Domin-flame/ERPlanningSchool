import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http } from "../api/client.js";
import { createStudentAccount, fetchPrograms, registerStudent } from "../services/studentService.js";
import { fetchMonthEvents } from "../pages/general/Calendar.jsx";

let mock;

beforeEach(() => {
  mock = new MockAdapter(http);
  localStorage.clear();
});

afterEach(() => {
  mock.restore();
});

describe("studentService", () => {
  it("charge les programmes", async () => {
    mock.onGet("/academic/programs/").reply(200, [{ program_id: 1, name: "Licence" }]);
    await expect(fetchPrograms()).resolves.toEqual([{ program_id: 1, name: "Licence" }]);
  });

  it("inscrit un étudiant sans demander d'identifiant technique", async () => {
    mock.onPost("/academic/students/register").reply((config) => [201, { student_id: 7, ...JSON.parse(config.data) }]);
    const created = await registerStudent({
      name: " Awa Ndiaye ",
      email: "awa@campus.edu ",
      phone: "",
      matricule: " MAT-1 ",
      programId: "3",
      enrollmentDate: "2026-09-01",
      status: "ACTIVE",
    });
    expect(created).toMatchObject({
      student_id: 7,
      name: "Awa Ndiaye",
      email: "awa@campus.edu",
      phone: null,
      matricule: "MAT-1",
      program_id: 3,
      enrollment_date: "2026-09-01",
      status: "ACTIVE",
    });
  });

  it("crée le compte de connexion étudiant et tolère un compte existant", async () => {
    mock.onPost("/auth/register").replyOnce((config) => {
      expect(JSON.parse(config.data)).toMatchObject({ email: "awa@campus.edu", role: "student" });
      return [201, { id: 1 }];
    });
    await expect(createStudentAccount({ fullName: "Awa", email: "awa@campus.edu", password: "Passw0rd!" })).resolves.toEqual({ created: true });

    mock.onPost("/auth/register").replyOnce(409, { detail: "Email déjà enregistré" });
    const result = await createStudentAccount({ fullName: "Awa", email: "awa@campus.edu", password: "Passw0rd!" });
    expect(result.created).toBe(false);
  });
});

describe("Calendrier — fetchMonthEvents", () => {
  it("agrège examens/séances, échéances de factures et notes personnelles du mois", async () => {
    mock.onGet("/academic/events").reply((config) => {
      expect(config.params).toEqual({ month: "2026-09" });
      return [200, [{ event_date: "2026-09-15", title: "Examen — CS201", status: "Partiel" }]];
    });
    const user = { email: "a@campus.edu" };
    localStorage.setItem(
      "cw_calendar_notes_a@campus.edu",
      JSON.stringify([
        { id: "n1", event_date: "2026-09-20", title: "Réunion" },
        { id: "n2", event_date: "2026-10-01", title: "Hors mois" },
      ])
    );
    const invoices = [
      { id_invoice: 1, numero_facture: "FAC-1", date_echeance: "2026-09-30", statut: "EMISE" },
      { id_invoice: 2, numero_facture: "FAC-2", date_echeance: "2026-11-30", statut: "EMISE" },
    ];

    const events = await fetchMonthEvents(2026, 8, { user, invoices });

    expect(Object.keys(events).sort()).toEqual(["2026-09-15", "2026-09-20", "2026-09-30"]);
    expect(events["2026-09-15"][0]).toMatchObject({ module: "academic", title: "Examen — CS201" });
    expect(events["2026-09-20"][0]).toMatchObject({ module: "personal", title: "Réunion" });
    expect(events["2026-09-30"][0]).toMatchObject({ module: "finance" });
  });

  it("reste utilisable si le module académique refuse l'accès", async () => {
    mock.onGet("/academic/events").reply(403, { detail: "interdit" });
    await expect(fetchMonthEvents(2026, 8, { user: { email: "x@y.z" } })).resolves.toEqual({});
  });
});
