import api from "../api/client.js";

/**
 * Service frontend de gestion des cours.
 * Toutes les requêtes passent par le gateway (/api/academic → academic-service)
 * via le client axios partagé (JWT + refresh automatique).
 */

const PAGE_SIZE = 100;
const MAX_PAGES = 200;

async function fetchAllPages(path, pageSize = PAGE_SIZE) {
  const items = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await api.get(path, {
      params: { skip: page * pageSize, limit: pageSize },
    });
    const batch = Array.isArray(response.data) ? response.data : [];
    items.push(...batch);
    if (batch.length < pageSize) return items;
  }

  throw new Error("Le catalogue dépasse la limite de pagination autorisée.");
}

/** Message d'erreur lisible à partir d'une erreur axios. */
export function getCourseErrorMessage(error, fallback = "Une erreur est survenue.") {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((item) => item?.msg || String(item)).join(" ");
  }
  return error?.message || fallback;
}

export function fetchCourses() {
  return fetchAllPages("/academic/courses/");
}

export function fetchModules() {
  return fetchAllPages("/academic/modules/");
}

/** Cours + modules (catalogue académique complet). */
export async function fetchCourseCatalog() {
  const [courses, modules] = await Promise.all([fetchCourses(), fetchModules()]);
  return { courses, modules };
}

export async function createCourse(course) {
  const response = await api.post("/academic/courses/", course);
  return response.data;
}

export async function updateCourse(courseId, changes) {
  const response = await api.put(`/academic/courses/${courseId}`, changes);
  return response.data;
}

export async function deleteCourse(courseId) {
  await api.delete(`/academic/courses/${courseId}`);
}

export function fetchCourseOfferings() {
  return fetchAllPages("/academic/course-offerings/");
}

/**
 * Données nécessaires pour ouvrir une offre (session) d'un cours :
 * semestres, campus et enseignants (avec leur nom, issu de /academic/users/).
 */
export async function fetchOfferingFormOptions() {
  const [semesters, campuses, teachers, users] = await Promise.all([
    fetchAllPages("/academic/semesters/"),
    fetchAllPages("/academic/campuses/"),
    fetchAllPages("/academic/teachers/"),
    fetchAllPages("/academic/users/"),
  ]);
  const usersById = new Map(users.map((user) => [user.user_id, user]));
  return {
    semesters,
    campuses,
    teachers: teachers.map((teacher) => ({
      ...teacher,
      name: usersById.get(teacher.user_id)?.name || teacher.employee_code || `Enseignant #${teacher.teacher_id}`,
      email: usersById.get(teacher.user_id)?.email || "",
    })),
  };
}

/** Ouvre une offre de cours (cours + semestre + campus + enseignant) : c'est elle qui permet l'inscription. */
export async function createCourseOffering({ name, courseId, semesterId, campusId, teacherId }) {
  const response = await api.post("/academic/course-offerings/", {
    name,
    course_id: courseId,
    semester_id: semesterId,
    campus_id: campusId,
    teacher_id: teacherId,
  });
  return response.data;
}

/** Semestre courant (non verrouillé) s'il existe, sinon le prochain semestre ouvert. */
export function pickDefaultSemester(semesters, today = todayIsoDate()) {
  const open = semesters.filter((semester) => !semester.is_locked);
  return (
    open.find((semester) => semester.start_date <= today && semester.end_date >= today) ||
    open
      .filter((semester) => semester.start_date > today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] ||
    null
  );
}

/** Indique si le semestre est ouvert aux inscriptions aujourd'hui. */
export function isCurrentSemester(semester, today = todayIsoDate()) {
  return Boolean(semester && !semester.is_locked && semester.start_date <= today && semester.end_date >= today);
}

/** Offres de cours enrichies avec leur cours et leur semestre. */
export async function fetchStudentCourseOptions() {
  const [offerings, courses, semesters] = await Promise.all([
    fetchAllPages("/academic/course-offerings/"),
    fetchCourses(),
    fetchAllPages("/academic/semesters/"),
  ]);

  const coursesById = new Map(courses.map((course) => [course.course_id, course]));
  const semestersById = new Map(semesters.map((semester) => [semester.semester_id, semester]));

  return offerings.map((offering) => ({
    ...offering,
    course: coursesById.get(offering.course_id) || null,
    semester: semestersById.get(offering.semester_id) || null,
  }));
}

function todayIsoDate() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Offres ouvertes : semestre en cours et non verrouillé. */
export function filterCurrentOfferings(offerings, today = todayIsoDate()) {
  return offerings.filter(({ course, semester }) => course && isCurrentSemester(semester, today));
}

export async function enrollStudent({ studentId, courseOfferingId }) {
  const response = await api.post("/academic/enrollments/", {
    status: "Active",
    enrollment_date: todayIsoDate(),
    student_id: studentId,
    course_offering_id: courseOfferingId,
  });
  return response.data;
}
