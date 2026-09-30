import React, { useCallback, useMemo, useState } from "react";
import { ClipboardCheck, Plus, Save } from "lucide-react";
import {
  Avatar, Button, Card, EmptyState, Field, FormError, FormGrid, Input, Modal, PageHeader, PageLoader, Select, Tabs,
} from "../../components/ui";
import { academicApi } from "../../api/academic.js";
import { useApi } from "../../hooks/useApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { dayLabel, formatDate, formatTime, isoDate } from "../../utils/format.js";
import { errorMessage } from "../../api/errors.js";
import { loadTeacherWorkspace, saveGrades, submitAttendance } from "./teacherWorkspace.js";
import { TeacherProfileFallback } from "./TeacherDashboard.jsx";

const ATTENDANCE_OPTIONS = [
  { value: "Present", label: "Présent" },
  { value: "Late", label: "En retard" },
  { value: "Absent", label: "Absent" },
  { value: "Excused", label: "Excusé" },
];

function AttendancePanel({ offering, workspace, onSaved }) {
  const toast = useToast();
  const [scheduleId, setScheduleId] = useState(offering.schedules[0]?.schedule_id ?? "");
  const [marks, setMarks] = useState({});
  const [pending, setPending] = useState(false);
  const students = offering.students.filter((s) => s.status !== "Dropped");

  const todaySession = workspace.sessions.find((s) => s.schedule_id === Number(scheduleId) && s.session_date === isoDate());
  const existing = useMemo(() => {
    const map = {};
    if (todaySession) workspace.attendances.filter((a) => a.session_id === todaySession.session_id).forEach((a) => { map[a.enrollment_id] = a.status; });
    return map;
  }, [todaySession, workspace.attendances]);

  if (!offering.schedules.length) return <EmptyState compact title="Aucun créneau planifié pour cette classe" />;
  if (!students.length) return <EmptyState compact title="Aucun étudiant inscrit" />;

  const statusFor = (id) => marks[id] || existing[id] || "Present";

  const submit = async () => {
    setPending(true);
    try {
      await submitAttendance({
        scheduleId: Number(scheduleId),
        sessions: workspace.sessions,
        attendances: workspace.attendances,
        entries: students.map((s) => ({ enrollment_id: s.enrollment_id, status: statusFor(s.enrollment_id) })),
      });
      toast.success("Appel enregistré.");
      setMarks({});
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="stack">
      <div className="row row--between">
        <Select value={String(scheduleId)} onChange={(e) => setScheduleId(e.target.value)} aria-label="Créneau"
          options={offering.schedules.map((s) => ({ value: String(s.schedule_id), label: `${dayLabel(s.day_of_week)} ${formatTime(s.start_time)}–${formatTime(s.end_time)} · ${s.room?.room_name || s.room?.room_number || ""}` }))} />
        <span className="muted">Séance du {formatDate(new Date())}{todaySession ? " · déjà ouverte" : ""}</span>
      </div>
      <ul className="list">
        {students.map((s) => (
          <li key={s.enrollment_id} className="list__item">
            <Avatar name={s.name} size={32} />
            <div className="grow"><strong>{s.name}</strong><small className="muted">{s.student?.matricule}</small></div>
            <div className="segmented" role="radiogroup" aria-label={`Présence de ${s.name}`}>
              {ATTENDANCE_OPTIONS.map((o) => (
                <button key={o.value} type="button" role="radio" aria-checked={statusFor(s.enrollment_id) === o.value}
                  className={`segmented__option segmented__option--${o.value.toLowerCase()} ${statusFor(s.enrollment_id) === o.value ? "is-active" : ""}`}
                  onClick={() => setMarks((prev) => ({ ...prev, [s.enrollment_id]: o.value }))}>
                  {o.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="row row--end">
        <Button icon={Save} loading={pending} onClick={submit}>Enregistrer l'appel</Button>
      </div>
    </div>
  );
}

function ExamModal({ offering, onClose, onCreated }) {
  const [form, setForm] = useState({ exam_type: "Contrôle continu", exam_date: isoDate(), weight_percentage: 40, max_score: 20 });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    try {
      const exam = await academicApi.exams.create({ ...form, weight_percentage: Number(form.weight_percentage), max_score: Number(form.max_score), course_offering_id: offering.course_offering_id });
      onCreated(exam);
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  };
  return (
    <Modal open title="Nouvelle évaluation" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button type="submit" form="exam-form" loading={pending}>Créer</Button></>}>
      <form id="exam-form" className="stack" onSubmit={submit}>
        <FormError message={error} />
        <FormGrid>
          <Field label="Type" required><Input value={form.exam_type} onChange={update("exam_type")} /></Field>
          <Field label="Date" required><Input type="date" value={form.exam_date} onChange={update("exam_date")} /></Field>
          <Field label="Coefficient (%)" required><Input type="number" min="0" max="100" value={form.weight_percentage} onChange={update("weight_percentage")} /></Field>
          <Field label="Barème" required><Input type="number" min="1" value={form.max_score} onChange={update("max_score")} /></Field>
        </FormGrid>
      </form>
    </Modal>
  );
}

function GradesPanel({ offering, workspace, onSaved }) {
  const toast = useToast();
  const exams = workspace.exams.filter((e) => e.course_offering_id === offering.course_offering_id)
    .sort((a, b) => String(b.exam_date).localeCompare(String(a.exam_date)));
  const [examId, setExamId] = useState(exams[0]?.exam_id ?? "");
  const [scores, setScores] = useState({});
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const exam = exams.find((e) => e.exam_id === Number(examId));
  const existing = useMemo(() => {
    const map = {};
    workspace.grades.filter((g) => g.exam_id === Number(examId)).forEach((g) => { map[g.enrollment_id] = g.score; });
    return map;
  }, [workspace.grades, examId]);
  const students = offering.students;
  const valueFor = (id) => scores[id] ?? (existing[id] != null ? String(existing[id]) : "");
  const max = Number(exam?.max_score || 20);

  const submit = async () => {
    const entries = students
      .map((s) => ({ enrollment_id: s.enrollment_id, raw: valueFor(s.enrollment_id) }))
      .filter((e) => e.raw !== "" && scores[e.enrollment_id] !== undefined)
      .map((e) => ({ enrollment_id: e.enrollment_id, score: Number(e.raw) }));
    if (entries.some((e) => !Number.isFinite(e.score) || e.score < 0 || e.score > max)) {
      toast.error(`Les notes doivent être comprises entre 0 et ${max}.`);
      return;
    }
    if (!entries.length) {
      toast.info("Aucune modification à enregistrer.");
      return;
    }
    setPending(true);
    try {
      await saveGrades({ examId: Number(examId), entries, grades: workspace.grades, submittedBy: workspace.teacher.teacher_id });
      toast.success(`${entries.length} note(s) enregistrée(s).`);
      setScores({});
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="stack">
      <div className="row row--between">
        {exams.length ? (
          <Select value={String(examId)} onChange={(e) => { setExamId(e.target.value); setScores({}); }} aria-label="Évaluation"
            options={exams.map((e) => ({ value: String(e.exam_id), label: `${e.exam_type} · ${formatDate(e.exam_date)} · ${Number(e.weight_percentage)} %` }))} />
        ) : <span className="muted">Aucune évaluation pour cette classe.</span>}
        <Button variant="secondary" icon={Plus} onClick={() => setCreating(true)}>Nouvelle évaluation</Button>
      </div>
      {exam && (students.length ? (
        <>
          <ul className="list">
            {students.map((s) => (
              <li key={s.enrollment_id} className="list__item">
                <Avatar name={s.name} size={32} />
                <div className="grow"><strong>{s.name}</strong><small className="muted">{s.student?.matricule}</small></div>
                <div className="score-input">
                  <Input type="number" step="0.25" min="0" max={max} value={valueFor(s.enrollment_id)} aria-label={`Note de ${s.name}`}
                    onChange={(e) => setScores((p) => ({ ...p, [s.enrollment_id]: e.target.value }))} />
                  <span className="muted">/ {max}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="row row--end"><Button icon={Save} loading={pending} onClick={submit}>Enregistrer les notes</Button></div>
        </>
      ) : <EmptyState compact title="Aucun étudiant inscrit" />)}
      {creating && (
        <ExamModal offering={offering} onClose={() => setCreating(false)} onCreated={(created) => { setCreating(false); setExamId(created.exam_id); onSaved(); toast.success("Évaluation créée."); }} />
      )}
    </div>
  );
}

export default function TeachingPage() {
  const { user } = useAuth();
  const load = useCallback(() => loadTeacherWorkspace(user?.email), [user?.email]);
  const { data, loading, error, reload } = useApi(load);
  const [selected, setSelected] = useState("");
  const [tab, setTab] = useState("attendance");

  if (loading && !data) return <PageLoader label="Chargement de vos classes…" />;
  const classes = data?.classes || [];
  const offering = classes.find((c) => String(c.course_offering_id) === selected) || classes[0];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Enseignement"
        title="Appel & notes"
        description="Enregistrez les présences du jour et saisissez les résultats des évaluations."
        actions={classes.length > 0 && (
          <Select value={String(offering?.course_offering_id || "")} onChange={(e) => setSelected(e.target.value)} aria-label="Classe"
            options={classes.map((c) => ({ value: String(c.course_offering_id), label: `${c.course?.code || ""} ${c.course?.title || c.name}` }))} />
        )}
      />
      {error ? (
        <Card><TeacherProfileFallback error={error} onRetry={reload} /></Card>
      ) : !offering ? (
        <Card><EmptyState icon={ClipboardCheck} title="Aucune classe affectée" description="La direction ne vous a pas encore affecté d'offre de cours." /></Card>
      ) : (
        <Card title={offering.course?.title || offering.name} subtitle={`${offering.course?.code || ""} · ${offering.semester?.term_name || ""} · ${offering.students.length} étudiants`}>
          <Tabs value={tab} onChange={setTab} tabs={[{ value: "attendance", label: "Appel du jour" }, { value: "grades", label: "Notes" }]} />
          <div className="tab-panel">
            {tab === "attendance" ? (
              <AttendancePanel key={`a-${offering.course_offering_id}`} offering={offering} workspace={data} onSaved={reload} />
            ) : (
              <GradesPanel key={`g-${offering.course_offering_id}`} offering={offering} workspace={data} onSaved={reload} />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
