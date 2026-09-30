import React, { useCallback } from "react";
import { BookOpen, CalendarClock, ClipboardCheck, GraduationCap, UserX, Users } from "lucide-react";
import { AsyncContent, Badge, Card, EmptyState, ErrorState, PageHeader, StatCard } from "../../components/ui";
import { useApi } from "../../hooks/useApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { dayLabel, formatTime, todayDayName } from "../../utils/format.js";
import QuickLinks from "../dashboard/QuickLinks.jsx";
import { loadTeacherWorkspace, TeacherProfileError } from "./teacherWorkspace.js";

export function TeacherProfileFallback({ error, onRetry }) {
  if (error?.cause instanceof TeacherProfileError || error instanceof TeacherProfileError) {
    return <EmptyState icon={UserX} title="Profil enseignant introuvable" description={error.message} />;
  }
  return <ErrorState error={error} onRetry={onRetry} />;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const load = useCallback(() => loadTeacherWorkspace(user?.email), [user?.email]);
  const { data, loading, error, reload } = useApi(load);
  const classes = data?.classes || [];
  const today = todayDayName();
  const todaySlots = classes
    .flatMap((c) => c.schedules.filter((s) => s.day_of_week === today).map((s) => ({ ...s, offering: c })))
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
  const studentCount = new Set((data?.roster || []).map((r) => r.student_id)).size;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Espace enseignant"
        title={`Bonjour ${user?.full_name?.split(" ")[0] || ""}`.trim()}
        description={data?.teacher?.speciality ? `Spécialité : ${data.teacher.speciality}` : "Vos classes, séances et évaluations."}
      />
      {error ? (
        <Card><TeacherProfileFallback error={error} onRetry={reload} /></Card>
      ) : (
        <>
          <div className="grid grid--stats">
            <StatCard label="Classes" icon={BookOpen} value={classes.length} loading={loading} />
            <StatCard label="Étudiants" icon={Users} tone="teal" value={studentCount} loading={loading} />
            <StatCard label="Séances aujourd'hui" icon={CalendarClock} tone="violet" value={todaySlots.length} loading={loading} />
            <StatCard label="Évaluations" icon={ClipboardCheck} tone="amber" value={data?.exams?.length ?? 0} loading={loading} />
          </div>
          <div className="grid grid--2">
            <Card title="Aujourd'hui" subtitle={dayLabel(today)}>
              <AsyncContent loading={loading} isEmpty={!todaySlots.length} empty={<EmptyState compact icon={CalendarClock} title="Aucune séance aujourd'hui" />}>
                <ul className="timeline">
                  {todaySlots.map((slot) => (
                    <li key={slot.schedule_id}>
                      <span className="timeline__time"><strong>{formatTime(slot.start_time)}</strong><small>{formatTime(slot.end_time)}</small></span>
                      <div>
                        <strong>{slot.offering.course?.title || slot.offering.name}</strong>
                        <small className="muted">Salle {slot.room?.room_name || slot.room?.room_number || "—"} · {slot.offering.students.length} étudiants</small>
                      </div>
                    </li>
                  ))}
                </ul>
              </AsyncContent>
            </Card>
            <Card title="Mes classes">
              <AsyncContent loading={loading} isEmpty={!classes.length} empty={<EmptyState compact icon={BookOpen} title="Aucune classe affectée" />}>
                <ul className="list">
                  {classes.map((c) => (
                    <li key={c.course_offering_id} className="list__item">
                      <div className="grow">
                        <strong>{c.course?.title || c.name}</strong>
                        <small className="muted">{c.course?.code} · {c.semester?.term_name || "—"} · {c.students.length} étudiants</small>
                        <div className="progress" aria-label={`Avancement ${c.progress}%`}><span style={{ width: `${c.progress}%` }} /></div>
                      </div>
                      <Badge tone="neutral">{c.sessionsCompleted}/{c.sessionsTotal} séances</Badge>
                    </li>
                  ))}
                </ul>
              </AsyncContent>
            </Card>
          </div>
        </>
      )}
      <QuickLinks
        links={[
          { to: "/teaching", label: "Faire l'appel / saisir des notes", description: "Par classe", icon: ClipboardCheck },
          { to: "/academic/students", label: "Étudiants", description: "Annuaire académique", icon: GraduationCap },
          { to: "/calendar", label: "Calendrier", description: "Examens et séances", icon: CalendarClock },
        ]}
      />
    </div>
  );
}
