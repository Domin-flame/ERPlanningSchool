import React, { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Plus } from "lucide-react";
import { Badge, Button, Card, DataTable, EmptyState, PageHeader, SearchInput, Select, Toolbar } from "../../components/ui";
import { academicApi } from "../../api/academic.js";
import { useApi } from "../../hooks/useApi.js";
import { useToast } from "../../hooks/useToast.js";
import { formatDate, isoDate, matchesQuery } from "../../utils/format.js";
import { errorMessage } from "../../api/errors.js";
import StudentProfileGate from "./StudentProfileMissing.jsx";

async function loadOptions() {
  const overview = await academicApi.studentOverview();
  const [offerings, courses, semesters] = await Promise.all([
    academicApi.offerings.list(),
    academicApi.courses.list(),
    academicApi.semesters.list(),
  ]);
  const coursesById = new Map(courses.map((c) => [c.course_id, c]));
  const semestersById = new Map(semesters.map((s) => [s.semester_id, s]));
  return {
    overview,
    semesters,
    offerings: offerings.map((o) => ({ ...o, course: coursesById.get(o.course_id), semester: semestersById.get(o.semester_id) })),
  };
}

export default function StudentCoursesPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(loadOptions);
  const [query, setQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [enrolling, setEnrolling] = useState(null);
  const [enrolled, setEnrolled] = useState(() => new Set());

  const alreadyEnrolled = useMemo(() => {
    const ids = new Set((data?.overview?.courses || []).map((c) => c.course_offering_id));
    enrolled.forEach((id) => ids.add(id));
    return ids;
  }, [data, enrolled]);

  const rows = useMemo(
    () =>
      (data?.offerings || []).filter(
        (o) =>
          (!semesterFilter || String(o.semester_id) === semesterFilter) &&
          matchesQuery(query, o.name, o.course?.code, o.course?.title)
      ),
    [data, query, semesterFilter]
  );

  const enroll = async (offering) => {
    setEnrolling(offering.course_offering_id);
    try {
      await academicApi.enrollments.create({
        status: "Active",
        enrollment_date: isoDate(),
        student_id: data.overview.student.student_id,
        course_offering_id: offering.course_offering_id,
      });
      setEnrolled((prev) => new Set(prev).add(offering.course_offering_id));
      toast.success(`Inscription à ${offering.course?.title || offering.name} enregistrée. La facture correspondante sera générée automatiquement.`, "Inscription confirmée");
    } catch (err) {
      toast.error(errorMessage(err), "Inscription impossible");
    } finally {
      setEnrolling(null);
    }
  };

  if (error) {
    return (
      <div className="page">
        <PageHeader title="Inscriptions aux cours" />
        <Card><StudentProfileGate error={error} onRetry={reload} /></Card>
      </div>
    );
  }

  const columns = [
    { key: "course", header: "Cours", sortValue: (o) => o.course?.title, render: (o) => (
      <div><strong>{o.course?.title || o.name}</strong><small className="muted block">{o.course?.code} · {o.name}</small></div>
    ) },
    { key: "credits", header: "Crédits", align: "right", sortValue: (o) => o.course?.credits, render: (o) => o.course?.credits ?? "—" },
    { key: "semester", header: "Semestre", sortValue: (o) => o.semester?.start_date, render: (o) => o.semester ? `${o.semester.term_name} (${formatDate(o.semester.start_date, { month: "short", year: "numeric" })})` : "—" },
    { key: "action", header: "", sortable: false, align: "right", render: (o) =>
      alreadyEnrolled.has(o.course_offering_id) ? (
        <Badge tone="success" dot><CheckCircle2 size={12} /> Inscrit</Badge>
      ) : (
        <Button size="sm" icon={Plus} loading={enrolling === o.course_offering_id} disabled={o.semester?.is_locked} onClick={() => enroll(o)}>
          {o.semester?.is_locked ? "Clôturé" : "S'inscrire"}
        </Button>
      ) },
  ];

  return (
    <div className="page">
      <PageHeader eyebrow="Espace étudiant" title="Inscriptions aux cours" description="Choisissez les offres de cours auxquelles vous souhaitez vous inscrire." />
      <Card padded={false}>
        <Toolbar end={<span className="muted">{rows.length} offre(s)</span>}>
          <SearchInput value={query} onChange={setQuery} placeholder="Code ou intitulé…" />
          <Select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} placeholder="Tous les semestres"
            options={(data?.semesters || []).map((s) => ({ value: String(s.semester_id), label: s.term_name }))} aria-label="Filtrer par semestre" />
        </Toolbar>
        <DataTable columns={columns} rows={rows} rowKey={(o) => o.course_offering_id} loading={loading}
          empty={<EmptyState icon={BookOpen} title="Aucune offre de cours" description="Aucune offre n'est ouverte pour le moment." />} />
      </Card>
    </div>
  );
}
