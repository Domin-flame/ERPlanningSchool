import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Skeleton, { SkeletonList } from "../../components/Skeleton.jsx";
import Toast from "../../components/Toast.jsx";
import { useData } from "../../context/DataContext.jsx";
import {
  enrollStudent,
  fetchStudentCourseOptions,
  filterCurrentOfferings,
  getCourseErrorMessage,
} from "../../services/courseService.js";

export default function StudentCourseCatalog() {
  const { studentOverview, errors, refreshData } = useData();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submittingOfferingId, setSubmittingOfferingId] = useState(null);
  const [enrolledOfferingIds, setEnrolledOfferingIds] = useState(() => new Set());
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError("");
    fetchStudentCourseOptions()
      .then((items) => {
        if (mounted) setOfferings(items);
      })
      .catch((error) => {
        if (mounted) setLoadError(getCourseErrorMessage(error, "Impossible de charger les offres de cours."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    const ids = (studentOverview?.courses || [])
      .map((course) => course.course_offering_id)
      .filter((id) => id != null);
    setEnrolledOfferingIds(new Set(ids));
  }, [studentOverview]);

  const currentOfferings = useMemo(() => filterCurrentOfferings(offerings), [offerings]);
  const studentId = studentOverview?.student?.student_id;

  const handleEnroll = async (offering) => {
    if (!studentId) {
      setActionError(
        errors.studentOverview ||
          "Votre profil étudiant n’est pas associé au service académique. Contactez l’administration."
      );
      return;
    }

    setSubmittingOfferingId(offering.course_offering_id);
    setActionError("");
    try {
      await enrollStudent({ studentId, courseOfferingId: offering.course_offering_id });
      setEnrolledOfferingIds((current) => new Set([...current, offering.course_offering_id]));
      setToastMsg(`Inscription enregistrée pour ${offering.course.title}.`);
      setToastShow(false);
      setTimeout(() => setToastShow(true), 0);
      await refreshData();
    } catch (error) {
      setActionError(getCourseErrorMessage(error, "Impossible d’enregistrer l’inscription."));
    } finally {
      setSubmittingOfferingId(null);
    }
  };

  const breadcrumbs = [{ label: "Accueil" }, { label: "Étudiant" }, { label: "Inscriptions" }];

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={breadcrumbs} />
        <Skeleton height={40} width="55%" style={{ marginBottom: 16 }} />
        <SkeletonList rows={4} height={100} />
      </div>
    );
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={breadcrumbs} />

      <div className="page-head">
        <div>
          <h2>Catalogue & Inscriptions</h2>
          <p className="muted">Offres de cours ouvertes pour le semestre en cours.</p>
        </div>
        <div className="actions">
          <Link className="btn" to="/student/transcript">Mon relevé de notes</Link>
        </div>
      </div>

      {(loadError || actionError) && (
        <div className="card" role="alert" style={{ borderColor: "var(--danger)", marginBottom: 16 }}>
          <p style={{ color: "var(--danger)" }}>{actionError || loadError}</p>
        </div>
      )}

      {errors.studentOverview && !studentOverview && (
        <div className="card" role="alert" style={{ borderColor: "var(--danger)", marginBottom: 16 }}>
          <p style={{ color: "var(--danger)" }}>
            {errors.studentOverview}. Les offres sont visibles, mais l’inscription est indisponible.
          </p>
        </div>
      )}

      {loadError ? (
        <button className="btn" type="button" onClick={() => setReloadKey((key) => key + 1)}>
          Réessayer
        </button>
      ) : currentOfferings.length === 0 ? (
        <EmptyState
          icon="📚"
          title="Aucune offre ouverte"
          description="Aucune offre de cours n’est disponible pour le semestre en cours. Contactez la scolarité si vous pensez qu’il s’agit d’une erreur."
        />
      ) : (
        <div className="course-list">
          {currentOfferings.map((offering) => {
            const enrolled = enrolledOfferingIds.has(offering.course_offering_id);
            const submitting = submittingOfferingId === offering.course_offering_id;
            return (
              <article className="card course-card" key={offering.course_offering_id}>
                <div className="soft-icon" aria-hidden="true" style={{ fontWeight: 800, fontSize: 18 }}>
                  {(offering.course.code || "??").slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3>{offering.course.title}</h3>
                    <code className="code-tag">{offering.course.code}</code>
                  </div>
                  <div className="course-meta" style={{ marginTop: 8 }}>
                    <span>🎓 {offering.course.credits} crédits ECTS</span>
                    <span>🗓️ {offering.name} · {offering.semester.term_name}</span>
                  </div>
                </div>
                <button
                  className={enrolled ? "btn" : "btn primary"}
                  type="button"
                  disabled={enrolled || submitting || !studentId}
                  onClick={() => handleEnroll(offering)}
                >
                  {enrolled ? "Déjà inscrit" : submitting ? "Inscription…" : "S’inscrire"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <Toast show={toastShow} message={toastMsg} sub="Portail étudiant" />
    </div>
  );
}
