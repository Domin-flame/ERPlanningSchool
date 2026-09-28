import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import Toast from "../../components/Toast.jsx";
import { useData } from "../../context/DataContext.jsx";
import CourseForm from "./CourseForm.jsx";
import CourseList from "./CourseList.jsx";
import { createCourse, deleteCourse, fetchCourseCatalog } from "../../services/courseService.js";

function getErrorMessage(error, fallback) {
  return error.response?.data?.detail || error.message || fallback;
}

export default function Courses() {
  const location = useLocation();
  const { refreshData } = useData();
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = window.setTimeout(() => setToastMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const catalog = await fetchCourseCatalog();
      setCourses(catalog.courses);
      setModules(catalog.modules);
    } catch (error) {
      setFetchError(getErrorMessage(error, "Impossible de charger le catalogue académique."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (location.state?.openCreateCourse) setShowForm(true);
  }, [location.state]);

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return courses.filter((course) => {
      const matchesQuery =
        !normalizedQuery ||
        `${course.title} ${course.code}`.toLocaleLowerCase().includes(normalizedQuery);
      const matchesModule =
        !moduleFilter || String(course.module_id) === moduleFilter;
      return matchesQuery && matchesModule;
    });
  }, [courses, query, moduleFilter]);

  const handleCreateCourse = async (course) => {
    const createdCourse = await createCourse(course);
    setCourses((current) => [...current, createdCourse]);
    setShowForm(false);
    setToastMessage(`Le cours « ${createdCourse.title} » a été créé.`);
    refreshData();
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Supprimer le cours ${course.code} ?`)) return;
    try {
      await deleteCourse(course.course_id);
      setCourses((current) =>
        current.filter((item) => item.course_id !== course.course_id)
      );
      setToastMessage(`Le cours ${course.code} a été supprimé.`);
      refreshData();
    } catch (error) {
      setFetchError(getErrorMessage(error, "Impossible de supprimer ce cours."));
    }
  };

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Académique" }, { label: "Cours" }]} />
        <Skeleton height={38} width="50%" style={{ marginBottom: 16 }} />
        <div className="grid two-cols" style={{ gap: 16 }}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} height={140} radius={12} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Académique" }, { label: "Cours" }]} />
      <PageHeader
        title="Catalogue des cours"
        description="Cours et modules chargés depuis le service académique."
        actions={
          <button className="btn primary" type="button" onClick={() => setShowForm(true)}>
            + Créer un cours
          </button>
        }
      />

      {fetchError && (
        <div className="card" role="alert" style={{ borderColor: "var(--danger)", marginBottom: 16 }}>
          <p style={{ color: "var(--danger)", fontSize: 13 }}>{fetchError}</p>
          <button className="btn ghost sm" type="button" onClick={loadCatalog}>
            Réessayer
          </button>
        </div>
      )}

      <div className="panel" style={{ padding: 16, marginBottom: 20 }}>
        <div className="filterbar">
          <input
            id="course-search"
            className="field"
            aria-label="Rechercher dans les cours"
            placeholder="Rechercher par intitulé ou code…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            id="course-module-filter"
            className="field"
            aria-label="Filtrer par module"
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value)}
          >
            <option value="">Tous les modules</option>
            {modules.map((module) => (
              <option key={module.module_id} value={module.module_id}>
                {module.code} — {module.title}
              </option>
            ))}
          </select>
          {(query || moduleFilter) && (
            <button
              className="btn ghost"
              type="button"
              onClick={() => {
                setQuery("");
                setModuleFilter("");
              }}
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <CourseList
        courses={filteredCourses}
        modules={modules}
        onDelete={handleDeleteCourse}
      />
      {showForm && (
        <CourseForm
          modules={modules}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateCourse}
        />
      )}
      <Toast show={Boolean(toastMessage)} message={toastMessage} sub="Catalogue académique" />
    </div>
  );
}
