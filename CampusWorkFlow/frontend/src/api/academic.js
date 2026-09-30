import http, { fetchAll, unwrap } from "./http.js";

const crud = (resource, idKey) => ({
  list: () => fetchAll(`/academic/${resource}/`),
  get: (id) => unwrap(http.get(`/academic/${resource}/${id}`)),
  create: (payload) => unwrap(http.post(`/academic/${resource}/`, payload)),
  update: (id, payload) => unwrap(http.put(`/academic/${resource}/${id}`, payload)),
  remove: (id) => unwrap(http.delete(`/academic/${resource}/${id}`)),
  idKey,
});

export const academicApi = {
  summary: () => unwrap(http.get("/academic/analytics/summary")),
  events: (month) => unwrap(http.get("/academic/events", { params: { month } })),
  studentOverview: (semesterId) =>
    unwrap(http.get("/academic/student/me/overview", { params: semesterId ? { semester_id: semesterId } : {} })),

  faculties: crud("faculties", "faculty_id"),
  departments: crud("departments", "department_id"),
  programs: crud("programs", "program_id"),
  modules: crud("modules", "module_id"),
  courses: crud("courses", "course_id"),
  academicYears: crud("academic-years", "academic_year_id"),
  semesters: crud("semesters", "semester_id"),
  users: crud("users", "user_id"),
  teachers: crud("teachers", "teacher_id"),
  students: crud("students", "student_id"),
  campuses: crud("campuses", "campus_id"),
  rooms: crud("rooms", "room_id"),
  offerings: crud("course-offerings", "course_offering_id"),
  schedules: crud("class-schedules", "schedule_id"),
  exams: crud("exams", "exam_id"),
  enrollments: crud("enrollments", "enrollment_id"),
  grades: crud("grades", "grade_id"),
  sessions: crud("sessions", "session_id"),
  attendances: crud("attendances", "attendance_id"),
};
