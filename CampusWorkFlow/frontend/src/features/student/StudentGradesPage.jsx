import React, { useCallback, useState } from "react";
import { FileText, Printer } from "lucide-react";
import { AsyncContent, Badge, Button, Card, EmptyState, PageHeader, Select, StatCard } from "../../components/ui";
import { academicApi } from "../../api/academic.js";
import { useApi } from "../../hooks/useApi.js";
import { formatNumber } from "../../utils/format.js";
import StudentProfileGate from "./StudentProfileMissing.jsx";

export default function StudentGradesPage() {
  const [semesterId, setSemesterId] = useState("");
  const loadOverview = useCallback(() => academicApi.studentOverview(semesterId || undefined), [semesterId]);
  const { data: overview, loading, error, reload } = useApi(loadOverview);
  const { data: semesters } = useApi(academicApi.semesters.list);
  const summary = overview?.summary || {};

  return (
    <div className="page">
      <PageHeader
        eyebrow="Espace étudiant"
        title="Relevé de notes"
        description={overview?.semester?.name ? `${overview.semester.name} — ${overview.semester.academic_year}` : "Notes par cours et par évaluation."}
        actions={
          <>
            <Select value={semesterId} onChange={(e) => setSemesterId(e.target.value)} placeholder="Semestre en cours"
              options={(semesters || []).map((s) => ({ value: String(s.semester_id), label: s.term_name }))} aria-label="Semestre" />
            <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Imprimer</Button>
          </>
        }
      />
      {error ? (
        <Card><StudentProfileGate error={error} onRetry={reload} /></Card>
      ) : (
        <>
          <div className="grid grid--stats">
            <StatCard label="Moyenne générale" value={summary.average != null ? `${formatNumber(summary.average, 2)} / 20` : "—"} loading={loading} />
            <StatCard label="Crédits validés" tone="teal" value={formatNumber(summary.validated_credits)} loading={loading} />
            <StatCard label="Cours" tone="violet" value={formatNumber(summary.course_count)} loading={loading} />
          </div>
          <AsyncContent loading={loading} isEmpty={!overview?.courses?.length}
            empty={<Card><EmptyState icon={FileText} title="Aucune note" description="Aucun cours ni évaluation pour ce semestre." /></Card>}>
            <div className="stack">
              {(overview?.courses || []).map((course) => (
                <Card
                  key={course.enrollment_id}
                  title={`${course.code} — ${course.title}`}
                  subtitle={`${course.credits} crédits${course.module_title ? ` · ${course.module_title}` : ""}`}
                  actions={
                    <Badge tone={course.average == null ? "neutral" : course.average >= 10 ? "success" : "danger"}>
                      {course.average == null ? "Non évalué" : `${formatNumber(course.average, 2)} / 20`}
                    </Badge>
                  }
                  padded={false}
                >
                  {course.grades?.length ? (
                    <table className="table table--dense">
                      <thead><tr><th>Évaluation</th><th style={{ textAlign: "right" }}>Coefficient</th><th style={{ textAlign: "right" }}>Note</th></tr></thead>
                      <tbody>
                        {course.grades.map((g) => (
                          <tr key={g.grade_id}>
                            <td>{g.exam_type}</td>
                            <td style={{ textAlign: "right" }}>{formatNumber(g.weight_percentage)} %</td>
                            <td style={{ textAlign: "right" }}><strong>{formatNumber(g.score, 2)}</strong> / {formatNumber(g.max_score)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <EmptyState compact title="Aucune note saisie" />
                  )}
                </Card>
              ))}
            </div>
          </AsyncContent>
        </>
      )}
    </div>
  );
}
