import React from "react";
import { Award, BookOpen, CalendarClock, FileText, Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { AsyncContent, Badge, Card, EmptyState, PageHeader, StatCard, StatusBadge } from "../../components/ui";
import { academicApi } from "../../api/academic.js";
import { financeApi } from "../../api/finance.js";
import { useApiAll } from "../../hooks/useApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { dayLabel, formatDate, formatMoney, formatNumber, formatTime, sumBy } from "../../utils/format.js";
import { INVOICE_STATUS } from "../../utils/status.js";
import QuickLinks from "../dashboard/QuickLinks.jsx";
import StudentProfileGate from "./StudentProfileMissing.jsx";

const SOURCES = {
  overview: () => academicApi.studentOverview(),
  invoices: financeApi.myInvoices,
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, errors, loading, reload } = useApiAll(SOURCES);
  const overview = data.overview;
  const summary = overview?.summary || {};
  const invoices = data.invoices || [];
  const due = sumBy(invoices.filter((i) => !["PAYEE", "ANNULEE"].includes(i.statut)), (i) => i.montant_total);
  const delta = summary.average_delta;

  return (
    <div className="page">
      <PageHeader
        eyebrow={overview?.student ? `${overview.student.program} · ${overview.student.level}` : "Espace étudiant"}
        title={`Bonjour ${user?.full_name?.split(" ")[0] || ""}`.trim()}
        description={overview?.semester?.name ? `${overview.semester.name} — ${overview.semester.academic_year}` : "Suivez vos cours, vos notes et vos paiements."}
      >
        {overview?.student && (
          <div className="row">
            <Badge tone="brand">Matricule {overview.student.matricule}</Badge>
            <Badge tone="neutral">{overview.student.faculty}</Badge>
          </div>
        )}
      </PageHeader>

      {errors.overview && !loading ? (
        <Card><StudentProfileGate error={errors.overview} onRetry={reload} /></Card>
      ) : (
        <>
          <div className="grid grid--stats">
            <StatCard
              label="Moyenne du semestre"
              icon={delta != null && delta < 0 ? TrendingDown : TrendingUp}
              value={summary.average != null ? `${formatNumber(summary.average, 2)} / 20` : "—"}
              hint={delta != null ? `${delta >= 0 ? "+" : ""}${formatNumber(delta, 2)} vs semestre précédent` : "Pas encore de note"}
              loading={loading}
            />
            <StatCard label="Crédits validés" icon={Award} tone="teal" value={formatNumber(summary.validated_credits)} loading={loading} />
            <StatCard label="Cours suivis" icon={BookOpen} tone="violet" value={formatNumber(summary.course_count)} loading={loading} />
            <StatCard label="Reste à payer" icon={Wallet} tone="amber" value={formatMoney(due)} hint={`${invoices.length} facture(s)`} loading={loading} unavailable={!!errors.invoices} />
          </div>

          <div className="grid grid--2">
            <Card title="Mes cours du semestre">
              <AsyncContent loading={loading} isEmpty={!overview?.courses?.length}
                empty={<EmptyState compact icon={BookOpen} title="Aucun cours ce semestre" description="Inscrivez-vous depuis le catalogue des cours." />}>
                <ul className="list">
                  {(overview?.courses || []).map((course) => (
                    <li key={course.enrollment_id} className="list__item">
                      <div className="grow">
                        <strong>{course.title}</strong>
                        <small className="muted">{course.code} · {course.credits} crédits{course.module_title ? ` · ${course.module_title}` : ""}</small>
                        <div className="progress" aria-label={`Progression ${course.progress}%`}>
                          <span style={{ width: `${Math.min(100, course.progress || 0)}%` }} />
                        </div>
                      </div>
                      <Badge tone={course.average == null ? "neutral" : course.average >= 10 ? "success" : "danger"}>
                        {course.average == null ? "—" : `${formatNumber(course.average, 2)}/20`}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </AsyncContent>
            </Card>
            <Card title="Cette semaine" subtitle="Séances planifiées">
              <AsyncContent loading={loading} isEmpty={!overview?.schedule?.length}
                empty={<EmptyState compact icon={CalendarClock} title="Aucune séance cette semaine" />}>
                <ul className="timeline">
                  {(overview?.schedule || []).map((s) => (
                    <li key={s.session_id}>
                      <span className="timeline__time">
                        <strong>{dayLabel(s.day_of_week)}</strong>
                        <small>{formatTime(s.start_time)}–{formatTime(s.end_time)}</small>
                      </span>
                      <div>
                        <strong>{s.title}</strong>
                        <small className="muted">{s.code} · Salle {s.room} · {formatDate(s.date, { day: "2-digit", month: "short" })}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              </AsyncContent>
            </Card>
          </div>
        </>
      )}

      <div className="grid grid--2">
        <Card title="Dernières factures">
          <AsyncContent loading={loading} error={errors.invoices} onRetry={reload} isEmpty={!invoices.length}
            empty={<EmptyState compact icon={Receipt} title="Aucune facture" />}>
            <ul className="list">
              {invoices.slice(0, 4).map((i) => (
                <li key={i.id_invoice} className="list__item">
                  <div className="grow">
                    <strong>{i.numero_facture}</strong>
                    <small className="muted">Échéance {formatDate(i.date_echeance)}</small>
                  </div>
                  <span className="num">{formatMoney(i.montant_total)}</span>
                  <StatusBadge map={INVOICE_STATUS} value={i.statut} />
                </li>
              ))}
            </ul>
          </AsyncContent>
        </Card>
        <QuickLinks
          links={[
            { to: "/student/courses", label: "S'inscrire à un cours", description: "Offres du semestre", icon: BookOpen },
            { to: "/student/grades", label: "Relevé de notes", description: "Détail des évaluations", icon: FileText },
            { to: "/student/invoices", label: "Mes factures", description: "Suivi des paiements", icon: Receipt },
          ]}
        />
      </div>
    </div>
  );
}
