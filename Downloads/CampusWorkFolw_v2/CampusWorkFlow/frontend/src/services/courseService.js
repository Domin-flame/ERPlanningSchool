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
