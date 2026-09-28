import api from "../api/client.js";

async function fetchAllPages(path, pageSize = 100) {
  const items = [];

  for (let page = 0; page < 200; page += 1) {
    const response = await api.get(path, {
      params: { skip: page * pageSize, limit: pageSize },
    });
    const batch = Array.isArray(response.data) ? response.data : [];
    items.push(...batch);
    if (batch.length < pageSize) return items;
  }

  throw new Error("Le catalogue dépasse la limite de pagination autorisée.");
}

export async function fetchCourseCatalog() {
  const [courses, modules] = await Promise.all([
    fetchAllPages("/academic/courses/"),
    fetchAllPages("/academic/modules/"),
  ]);

  return { courses, modules };
}

export async function createCourse(course) {
  const response = await api.post("/academic/courses/", course);
  return response.data;
}

export async function deleteCourse(courseId) {
  await api.delete(`/academic/courses/${courseId}`);
}

export async function fetchStudentCourseOptions() {
  const [offerings, courses, semesters] = await Promise.all([
    fetchAllPages("/academic/course-offerings/"),
    fetchAllPages("/academic/courses/"),
    fetchAllPages("/academic/semesters/"),
  ]);

  const coursesById = new Map(courses.map((course) => [course.course_id, course]));
  const semestersById = new Map(
    semesters.map((semester) => [semester.semester_id, semester])
  );

  return offerings.map((offering) => ({
    ...offering,
    course: coursesById.get(offering.course_id) || null,
    semester: semestersById.get(offering.semester_id) || null,
  }));
}

export async function enrollStudent({ studentId, courseOfferingId }) {
  const today = new Date();
  const enrollmentDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const response = await api.post("/academic/enrollments/", {
    status: "Active",
    enrollment_date: enrollmentDate,
    student_id: studentId,
    course_offering_id: courseOfferingId,
  });
  return response.data;
}
