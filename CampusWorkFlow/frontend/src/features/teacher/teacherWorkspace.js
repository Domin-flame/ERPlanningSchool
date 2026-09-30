import { academicApi } from "../../api/academic.js";
import { isoDate } from "../../utils/format.js";

export class TeacherProfileError extends Error {}

const indexBy = (list, key) => new Map(list.map((item) => [item[key], item]));

/**
 * Construit l'espace de travail de l'enseignant connecté à partir des
 * ressources génériques du module académique (le service n'expose pas
 * d'endpoint « /teacher/me » dédié).
 */
export async function loadTeacherWorkspace(email) {
  const normalized = String(email || "").trim().toLowerCase();
  const [users, teachers] = await Promise.all([academicApi.users.list(), academicApi.teachers.list()]);
  const academicUser = users.find((u) => String(u.email || "").trim().toLowerCase() === normalized);
  const teacher = academicUser && teachers.find((t) => t.user_id === academicUser.user_id);
  if (!teacher) {
    throw new TeacherProfileError("Votre compte n'est pas encore enregistré comme enseignant dans le module académique.");
  }

  const [offerings, courses, semesters, schedules, rooms, enrollments, students, exams, grades, sessions, attendances] =
    await Promise.all([
      academicApi.offerings.list(),
      academicApi.courses.list(),
      academicApi.semesters.list(),
      academicApi.schedules.list(),
      academicApi.rooms.list(),
      academicApi.enrollments.list(),
      academicApi.students.list(),
      academicApi.exams.list(),
      academicApi.grades.list(),
      academicApi.sessions.list(),
      academicApi.attendances.list(),
    ]);

  const coursesById = indexBy(courses, "course_id");
  const semestersById = indexBy(semesters, "semester_id");
  const roomsById = indexBy(rooms, "room_id");
  const studentsById = indexBy(students, "student_id");
  const usersById = indexBy(users, "user_id");

  const mine = offerings.filter((o) => o.teacher_id === teacher.teacher_id);
  const offeringIds = new Set(mine.map((o) => o.course_offering_id));
  const mySchedules = schedules
    .filter((s) => offeringIds.has(s.course_offering_id))
    .map((s) => ({ ...s, room: roomsById.get(s.room_id) || null }));
  const scheduleIds = new Set(mySchedules.map((s) => s.schedule_id));
  const mySessions = sessions.filter((s) => scheduleIds.has(s.schedule_id));
  const sessionIds = new Set(mySessions.map((s) => s.session_id));
  const myExams = exams.filter((e) => offeringIds.has(e.course_offering_id));
  const examIds = new Set(myExams.map((e) => e.exam_id));

  const roster = enrollments
    .filter((e) => offeringIds.has(e.course_offering_id))
    .map((enrollment) => {
      const student = studentsById.get(enrollment.student_id);
      const user = student ? usersById.get(student.user_id) : null;
      return { ...enrollment, student, name: user?.name || student?.matricule || "Étudiant", email: user?.email || "" };
    });

  const classes = mine.map((offering) => {
    const offeringSchedules = mySchedules
      .filter((s) => s.course_offering_id === offering.course_offering_id)
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
    const ids = new Set(offeringSchedules.map((s) => s.schedule_id));
    const offeringSessions = mySessions.filter((s) => ids.has(s.schedule_id));
    const completed = offeringSessions.filter((s) => s.status === "Completed").length;
    return {
      ...offering,
      course: coursesById.get(offering.course_id) || null,
      semester: semestersById.get(offering.semester_id) || null,
      schedules: offeringSchedules,
      students: roster.filter((r) => r.course_offering_id === offering.course_offering_id),
      sessionsTotal: offeringSessions.length,
      sessionsCompleted: completed,
      progress: offeringSessions.length ? Math.round((completed / offeringSessions.length) * 100) : 0,
    };
  });

  return {
    teacher,
    academicUser,
    classes,
    roster,
    schedules: mySchedules,
    sessions: mySessions,
    exams: myExams,
    grades: grades.filter((g) => examIds.has(g.exam_id)),
    attendances: attendances.filter((a) => sessionIds.has(a.session_id)),
  };
}

/** Enregistre l'appel du jour pour un créneau : crée la séance si besoin puis les présences. */
export async function submitAttendance({ scheduleId, sessions, attendances, entries }) {
  const today = isoDate();
  let session = sessions.find((s) => s.schedule_id === scheduleId && s.session_date === today);
  if (!session) {
    session = await academicApi.sessions.create({ session_date: today, status: "Completed", topic_covered: null, schedule_id: scheduleId });
  } else if (session.status !== "Completed") {
    session = await academicApi.sessions.update(session.session_id, { status: "Completed" });
  }
  const existing = indexBy(attendances.filter((a) => a.session_id === session.session_id), "enrollment_id");
  await Promise.all(
    entries.map(({ enrollment_id, status }) => {
      const current = existing.get(enrollment_id);
      return current
        ? academicApi.attendances.update(current.attendance_id, { status })
        : academicApi.attendances.create({ status, session_id: session.session_id, enrollment_id });
    })
  );
  return session;
}

export async function saveGrades({ examId, entries, grades, submittedBy }) {
  const byEnrollment = indexBy(grades.filter((g) => g.exam_id === examId), "enrollment_id");
  const submittedAt = new Date().toISOString();
  await Promise.all(
    entries.map(({ enrollment_id, score }) => {
      const payload = { score, submitted_by: submittedBy, submitted_at: submittedAt, exam_id: examId, enrollment_id };
      const existing = byEnrollment.get(enrollment_id);
      return existing ? academicApi.grades.update(existing.grade_id, payload) : academicApi.grades.create(payload);
    })
  );
}
