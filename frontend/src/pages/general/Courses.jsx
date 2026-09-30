import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import Toast from "../../components/Toast.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { canManageCourses } from "../../app/access.js";
import {
  createCourse,
  deleteCourse,
  fetchCourseCatalog,
  getCourseErrorMessage,
} from "../../services/courseService.js";
import CourseForm from "./CourseForm.jsx";
import CourseList from "./CourseList.jsx";

export default function Courses() {
  const location = useLocation();
  const { user } = useAuth();
  const { refreshData } = useData();
  const canManage = canManageCourses(user?.role);

  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const notify = (message) => {
    setToastMsg(message);
    setToastShow(false);
    // Laisse React démonter/remonter le toast pour relancer son minuteur
    setTimeout(() => setToastShow(true), 0);
  };

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const catalog = await fetchCourseCatalog();
      setCourses(catalog.courses);
      setModules(catalog.modules);
    } catch (error) {
      setFetchError(getCourseErrorMessage(error, "Impossible de charger le catalogue académique."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (location.state?.openCreateCourse && canManage) setShowForm(true);
  }, [location.state, canManage]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return courses.filter((course) => {
      const searchText = `${course.title || ""} ${course.code || ""} ${course.teacher || ""} ${course.instructor || ""}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
      const matchesModule = !moduleFilter || String(course.module_id) === moduleFilter;
      return matchesQuery && matchesModule;
    });
  }, [courses, query, moduleFilter]);

  const handleCreateCourse = async (payload) => {
    try {
      const createdCourse = await createCourse(payload);
      setCourses((current) => [...current, createdCourse]);
      setShowForm(false);
      notify(`Le cours « ${createdCourse.title || payload.title} » a été ajouté au catalogue.`);
      refreshData();
    } catch (error) {
      throw new Error(getCourseErrorMessage(error, "Impossible de créer le cours."));
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Supprimer le cours ${course.code} ?`)) return;
    setFetchError("");
    try {
      await deleteCourse(course.course_id);
      setCourses((current) => current.filter((item) => item.course_id !== course.course_id));
      notify(`Cours ${course.code} supprimé.`);
      refreshData();
    } catch (error) {
      setFetchError(getCourseErrorMessage(error, "Impossible de supprimer ce cours."));
    }
  };

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Académique" }, { label: "Cours" }]} />
        <Skeleton height={38} width="50%" style={{ marginBottom: 16 }} />
        <div className="grid two-cols" style={{ gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={140} radius={12} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Académique" }, { label: "Cours" }]} />

      <div className="page-head">
        <div>
          <h2>Catalogue & Gestion des Cours</h2>
          <p className="muted">
            {courses.length} cours · {modules.length} module(s) chargés depuis le service académique.
          </p>
        </div>
        {canManage && (
          <div className="actions">
            <button className="btn primary" type="button" onClick={() => setShowForm(true)}>
              + Créer un cours
            </button>
          </div>
        )}
      </div>

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
            className="field"
            aria-label="Rechercher dans les cours"
            placeholder="Rechercher par intitulé, code ou enseignant..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select
            className="field"
            aria-label="Filtrer par module"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <option value="">Tous les modules</option>
            {modules.map((module) => (
              <option key={module.module_id} value={String(module.module_id)}>
                {module.code ? `${module.code} — ` : ""}{module.title || `Module #${module.module_id}`}
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
        courses={filtered}
        modules={modules}
        onDelete={canManage ? handleDeleteCourse : undefined}
      />

      {showForm && canManage && (
        <CourseForm
          modules={modules}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateCourse}
        />
      )}

      <Toast show={toastShow} message={toastMsg} sub="Catalogue des Cours" />
    </div>
  );
}
