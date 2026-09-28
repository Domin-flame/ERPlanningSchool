import { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import Skeleton, { SkeletonList } from "../../components/Skeleton.jsx";
import Toast from "../../components/Toast.jsx";
import { useData } from "../../context/DataContext.jsx";
import { enrollStudent, fetchStudentCourseOptions } from "../../services/courseService.js";

function errorMessage(error) {
  return error.response?.data?.detail || error.message || "Une erreur est survenue.";
}

export default function StudentCourseCatalog() {
  const { studentOverview, errors, refreshData } = useData();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submittingOfferingId, setSubmittingOfferingId] = useState(null);
  const [enrolledOfferingIds, setEnrolledOfferingIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchStudentCourseOptions()
      .then((items) => {
        if (mounted) setOfferings(items);
      })
      .catch((error) => {
        if (mounted) setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const ids = (studentOverview?.courses || [])
      .map((course) => course.course_offering_id)
      .filter((id) => id != null);
    setEnrolledOfferingIds(new Set(ids));
  }, [studentOverview]);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = window.setTimeout(() => setToastMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const currentOfferings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const activeSemesterIds = new Set(
      offerings
        .filter(({ semester }) =>
          semester &&
          !semester.is_locked &&
          semester.start_date <= today &&
          semester.end_date >= today
        )
        .map(({ semester }) => semester.semester_id)
    );
    return offerings.filter(
      ({ course, semester }) =>
        course && semester && activeSemesterIds.has(semester.semester_id)
    );
  }, [offerings]);

  const handleEnroll = async (offering) => {
    const studentId = studentOverview?.student?.student_id;
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
      await enrollStudent({
        studentId,
        courseOfferingId: offering.course_offering_id,
      });
      setEnrolledOfferingIds((current) =>
        new Set([...current, offering.course_offering_id])
      );
      setToastMessage(`Inscription enregistrée pour ${offering.course.title}.`);
      await refreshData();
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setSubmittingOfferingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-animate">
        <Breadcrumbs items={[{ label: "Accueil" }, { label: "Étudiant" }, { label: "Catalogue" }]} />
        <Skeleton height={40} width="55%" style={{ marginBottom: 16 }} />
        <SkeletonList rows={4} height={100} />
      </div>
    );
  }

  return (
    <div className="page-animate">
      <Breadcrumbs items={[{ label: "Accueil" }, { label: "Étudiant" }, { label: "Catalogue" }]} />
      <PageHeader
        title="Catalogue et inscriptions"
        description="Offres ouvertes du semestre en cours."
      />

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
        <button className="btn" type="button" onClick={() => window.location.reload()}>
          Recharger
        </button>
      ) : currentOfferings.length === 0 ? (
        <EmptyState
          title="Aucune offre ouverte"
          description="Aucune offre de cours n’est disponible pour le semestre en cours. Contactez la scolarité si vous pensez qu’il s’agit d’une erreur."
        />
      ) : (
        <div className="course-list">
          {currentOfferings.map((offering) => {
            const enrolled = enrolledOfferingIds.has(offering.course_offering_id);
            const submitting = submittingOfferingId === offering.course_offering_id;
            return (
              <article
                className="card course-card"
                key={offering.course_offering_id}
              >
                <div className="soft-icon" aria-hidden="true">
                  {offering.course.code.slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>{offering.course.title}</h3>
                  <p className="muted">
                    {offering.course.code} · {offering.course.credits} crédits ECTS
                  </p>
                  <p className="muted">
                    {offering.name} · {offering.semester.term_name}
                  </p>
                </div>
                <button
                  className={enrolled ? "btn" : "btn primary"}
                  type="button"
                  disabled={enrolled || submitting || !studentOverview?.student?.student_id}
                  onClick={() => handleEnroll(offering)}
                >
                  {enrolled ? "Déjà inscrit" : submitting ? "Inscription…" : "S’inscrire"}
                </button>
              </article>
            );
          })}
        </div>
      )}
      <Toast show={Boolean(toastMessage)} message={toastMessage} sub="Portail étudiant" />
    </div>
  );
}
