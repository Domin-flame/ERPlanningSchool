import api from "../api/client.js";

const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_LABELS_FR = { Monday: "Lundi", Tuesday: "Mardi", Wednesday: "Mercredi", Thursday: "Jeudi", Friday: "Vendredi", Saturday: "Samedi", Sunday: "Dimanche" };

export function todayEnglishDayName() { return DAY_NAMES_EN[new Date().getDay()]; }
export function frenchDayLabel(dayOfWeek) { return DAY_LABELS_FR[dayOfWeek] || dayOfWeek; }
export function todayISODate() { return new Date().toISOString().slice(0, 10); }
export function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.length === 0 ? "?" : parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : `${parts[0][0]}${parts.at(-1)[0]}`.toUpperCase();
}
export function formatTime(value) { return value ? String(value).slice(0, 5) : ""; }

async function fetchAllPages(path, pageSize = 200) {
  const results = [];
  for (let page = 0; page < 200; page += 1) {
    const res = await api.get(path, { params: { skip: page * pageSize, limit: pageSize } });
    const batch = Array.isArray(res.data) ? res.data : res.data?.items || [];
    results.push(...batch);
    if (batch.length < pageSize) return results;
  }
  return results;
}
function indexBy(list, key) { return new Map(list.map((item) => [item[key], item])); }

async function resolveCurrentTeacher(authUser) {
  const email = (authUser?.email || "").trim().toLowerCase();
  if (!email) throw new Error("Impossible d'identifier votre compte (email manquant).");
  const [users, teachers] = await Promise.all([fetchAllPages("/academic/users/"), fetchAllPages("/academic/teachers/")]);
  const academicUser = users.find((item) => (item.email || "").trim().toLowerCase() === email);
  if (!academicUser) throw new Error("Aucun profil académique n'est associé à votre compte enseignant.");
  const teacher = teachers.find((item) => item.user_id === academicUser.user_id);
  if (!teacher) throw new Error("Votre compte n'est pas enregistré comme enseignant dans le module académique.");
  return { academicUser, teacher };
}

export async function fetchTeacherWorkspace(authUser) {
  const { academicUser, teacher } = await resolveCurrentTeacher(authUser);
  const [offeringsRaw, courses, semesters, campuses, schedules, rooms, programs, enrollments, students, exams, grades, sessions, attendances, users] = await Promise.all([
    fetchAllPages("/academic/course-offerings/"), fetchAllPages("/academic/courses/"), fetchAllPages("/academic/semesters/"), fetchAllPages("/academic/campuses/"), fetchAllPages("/academic/class-schedules/"), fetchAllPages("/academic/rooms/"), fetchAllPages("/academic/programs/"), fetchAllPages("/academic/enrollments/"), fetchAllPages("/academic/students/"), fetchAllPages("/academic/exams/"), fetchAllPages("/academic/grades/"), fetchAllPages("/academic/sessions/"), fetchAllPages("/academic/attendances/"), fetchAllPages("/academic/users/"),
  ]);
  const offeringsRawMine = offeringsRaw.filter((item) => item.teacher_id === teacher.teacher_id);
  const offeringIds = new Set(offeringsRawMine.map((item) => item.course_offering_id));
  const coursesById = indexBy(courses, "course_id");
  const semestersById = indexBy(semesters, "semester_id");
  const campusesById = indexBy(campuses, "campus_id");
  const roomsById = indexBy(rooms, "room_id");
  const programsById = indexBy(programs, "program_id");
  const mySchedules = schedules.filter((item) => offeringIds.has(item.course_offering_id));
  const scheduleIds = new Set(mySchedules.map((item) => item.schedule_id));
  const myEnrollments = enrollments.filter((item) => offeringIds.has(item.course_offering_id));
  const studentsById = indexBy(students, "student_id");
  const usersById = indexBy(users, "user_id");
  const myExams = exams.filter((item) => offeringIds.has(item.course_offering_id));
  const examIds = new Set(myExams.map((item) => item.exam_id));
  const mySessions = sessions.filter((item) => scheduleIds.has(item.schedule_id));
  const sessionIds = new Set(mySessions.map((item) => item.session_id));
  const offerings = offeringsRawMine.map((offering) => {
    const course = coursesById.get(offering.course_id);
    const offeringSchedules = mySchedules.filter((item) => item.course_offering_id === offering.course_offering_id).map((item) => ({ ...item, room: roomsById.get(item.room_id) || null }));
    const offeringEnrollments = myEnrollments.filter((item) => item.course_offering_id === offering.course_offering_id);
    const offeringSessions = mySessions.filter((item) => offeringSchedules.some((schedule) => schedule.schedule_id === item.schedule_id));
    const completed = offeringSessions.filter((item) => item.status === "Completed").length;
    return { course_offering_id: offering.course_offering_id, name: offering.name, course, semester: semestersById.get(offering.semester_id), campus: campusesById.get(offering.campus_id), schedules: offeringSchedules.sort((a, b) => a.start_time.localeCompare(b.start_time)), studentsCount: offeringEnrollments.filter((item) => item.status === "Active").length, totalEnrollments: offeringEnrollments.length, sessionsTotal: offeringSessions.length, sessionsCompleted: completed, progress: offeringSessions.length ? Math.round((completed / offeringSessions.length) * 100) : 0 };
  });
  const roster = myEnrollments.map((enrollment) => {
    const student = studentsById.get(enrollment.student_id);
    const offering = offerings.find((item) => item.course_offering_id === enrollment.course_offering_id);
    const studentUser = student ? usersById.get(student.user_id) : null;
    return { enrollment_id: enrollment.enrollment_id, status: enrollment.status, course_offering_id: enrollment.course_offering_id, offeringName: offering?.name || offering?.course?.title || "—", courseCode: offering?.course?.code || "—", student, program: student ? programsById.get(student.program_id) : null, name: studentUser?.name || "Étudiant inconnu", email: studentUser?.email || "" };
  });
  return { teacher, academicUser, offerings, roster, exams: myExams, grades: grades.filter((item) => examIds.has(item.exam_id)), sessions: mySessions, attendances: attendances.filter((item) => sessionIds.has(item.session_id)) };
}

export function latestExamFor(exams, courseOfferingId) { return exams.filter((item) => item.course_offering_id === courseOfferingId).sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date))[0]; }
export async function createExam({ courseOfferingId, examType, examDate, weight, maxScore }) { const res = await api.post("/academic/exams/", { exam_type: examType, exam_date: examDate, weight_percentage: weight, max_score: maxScore, course_offering_id: courseOfferingId }); return res.data; }
export async function saveGrade({ existingGradeId, examId, enrollmentId, score, submittedBy }) {
  const payload = { score, submitted_by: submittedBy, submitted_at: new Date().toISOString(), exam_id: examId, enrollment_id: enrollmentId };
  const res = existingGradeId ? await api.put(`/academic/grades/${existingGradeId}`, payload) : await api.post("/academic/grades/", payload);
  return res.data;
}
export async function submitAttendanceForToday({ scheduleId, existingSessions, existingAttendances, entries }) {
  const today = todayISODate();
  let session = existingSessions.find((item) => item.schedule_id === scheduleId && item.session_date === today);
  if (!session) {
    const res = await api.post("/academic/sessions/", { session_date: today, status: "Completed", topic_covered: null, schedule_id: scheduleId });
    session = res.data;
  } else if (session.status !== "Completed") {
    const res = await api.put(`/academic/sessions/${session.session_id}`, { status: "Completed" });
    session = res.data;
  }
  const attendanceByEnrollment = indexBy(existingAttendances.filter((item) => item.session_id === session.session_id), "enrollment_id");
  const results = await Promise.all(entries.map(async ({ enrollment_id, status }) => {
    const existing = attendanceByEnrollment.get(enrollment_id);
    const res = existing ? await api.put(`/academic/attendances/${existing.attendance_id}`, { status }) : await api.post("/academic/attendances/", { status, session_id: session.session_id, enrollment_id });
    return res.data;
  }));
  return { session, attendances: results };
}
