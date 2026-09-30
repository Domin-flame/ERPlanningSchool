import MockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http } from "../api/client.js";
import {
  createCourseOffering,
  enrollStudent,
  fetchOfferingFormOptions,
  pickDefaultSemester,
  fetchCourses,
  fetchStudentCourseOptions,
  filterCurrentOfferings,
  getCourseErrorMessage,
} from "../services/courseService.js";

let mock;

beforeEach(() => {
  mock = new MockAdapter(http);
});

afterEach(() => {
  mock.restore();
});

describe("courseService", () => {
  it("parcourt toutes les pages de /academic/courses/", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({ course_id: index + 1 }));
    mock.onGet("/academic/courses/").reply((config) =>
      config.params.skip === 0 ? [200, firstPage] : [200, [{ course_id: 101 }]]
    );

    const courses = await fetchCourses();

    expect(courses).toHaveLength(101);
    expect(mock.history.get.map((request) => request.params.skip)).toEqual([0, 100]);
  });

  it("associe cours et semestres aux offres", async () => {
    mock.onGet("/academic/course-offerings/").reply(200, [{ course_offering_id: 7, course_id: 1, semester_id: 2 }]);
    mock.onGet("/academic/courses/").reply(200, [{ course_id: 1, title: "SQL" }]);
    mock.onGet("/academic/semesters/").reply(200, [{ semester_id: 2, term_name: "S1" }]);

    const [offering] = await fetchStudentCourseOptions();

    expect(offering.course.title).toBe("SQL");
    expect(offering.semester.term_name).toBe("S1");
  });

  it("ne garde que les offres du semestre en cours non verrouillé", () => {
    const course = { course_id: 1 };
    const offerings = [
      { id: "current", course, semester: { start_date: "2026-09-01", end_date: "2027-01-31", is_locked: false } },
      { id: "locked", course, semester: { start_date: "2026-09-01", end_date: "2027-01-31", is_locked: true } },
      { id: "past", course, semester: { start_date: "2025-09-01", end_date: "2026-01-31", is_locked: false } },
      { id: "orphan", course: null, semester: { start_date: "2026-09-01", end_date: "2027-01-31", is_locked: false } },
    ];

    expect(filterCurrentOfferings(offerings, "2026-09-30").map((item) => item.id)).toEqual(["current"]);
  });

  it("inscrit l'étudiant avec le payload attendu par academic-service", async () => {
    mock.onPost("/academic/enrollments/").reply(201, { enrollment_id: 3 });

    await enrollStudent({ studentId: 4, courseOfferingId: 9 });

    const payload = JSON.parse(mock.history.post[0].data);
    expect(payload).toMatchObject({ status: "Active", student_id: 4, course_offering_id: 9 });
    expect(payload.enrollment_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formate les erreurs FastAPI", () => {
    expect(getCourseErrorMessage({ response: { data: { detail: "Déjà inscrit" } } })).toBe("Déjà inscrit");
    expect(getCourseErrorMessage({ response: { data: { detail: [{ msg: "champ requis" }] } } })).toBe("champ requis");
    expect(getCourseErrorMessage({}, "Erreur")).toBe("Erreur");
  });

  it("ouvre une offre avec le payload attendu par academic-service", async () => {
    mock.onPost("/academic/course-offerings/").reply(201, { course_offering_id: 5 });

    await createCourseOffering({ name: "WEB — Groupe A", courseId: 1, semesterId: 2, campusId: 3, teacherId: 4 });

    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      name: "WEB — Groupe A",
      course_id: 1,
      semester_id: 2,
      campus_id: 3,
      teacher_id: 4,
    });
  });

  it("charge semestres, campus et enseignants nommés", async () => {
    mock.onGet("/academic/semesters/").reply(200, [{ semester_id: 1 }]);
    mock.onGet("/academic/campuses/").reply(200, [{ campus_id: 1, name: "Principal" }]);
    mock.onGet("/academic/teachers/").reply(200, [{ teacher_id: 9, user_id: 7, employee_code: "ENS-1" }]);
    mock.onGet("/academic/users/").reply(200, [{ user_id: 7, name: "Dr. Awa", email: "prof@campus.edu" }]);

    const options = await fetchOfferingFormOptions();

    expect(options.teachers).toEqual([
      expect.objectContaining({ teacher_id: 9, name: "Dr. Awa", email: "prof@campus.edu" }),
    ]);
    expect(options.campuses).toHaveLength(1);
  });

  it("propose le semestre en cours, sinon le prochain semestre ouvert", () => {
    const semesters = [
      { semester_id: 1, start_date: "2026-02-01", end_date: "2026-08-31", is_locked: false },
      { semester_id: 2, start_date: "2026-09-01", end_date: "2027-01-31", is_locked: false },
      { semester_id: 3, start_date: "2027-02-01", end_date: "2027-08-31", is_locked: false },
    ];
    expect(pickDefaultSemester(semesters, "2026-09-30").semester_id).toBe(2);
    expect(pickDefaultSemester(semesters.slice(2), "2026-09-30").semester_id).toBe(3);
    expect(pickDefaultSemester([{ ...semesters[1], is_locked: true }], "2026-09-30")).toBeNull();
  });
});
