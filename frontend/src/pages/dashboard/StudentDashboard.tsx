import { motion } from 'framer-motion'
import {
  BookOpen,
  Calendar,
  TrendingUp,
  FileText,
  Clock,
  Award,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { StatCard, StatGrid } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function StudentDashboard() {
  const { user } = useAuthStore()

  const { isLoading } = useQuery({
    queryKey: ['student-courses'],
    queryFn: () => api.get('/academic/courses'),
  })

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--cw-navy)' }}>
          Tableau de bord étudiant
        </h1>
        <SkeletonDashboard />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--cw-navy)' }}>
            Bienvenue, {user?.full_name} 👋
          </h1>
          <p className="mt-1" style={{ color: 'var(--cw-text-secondary)' }}>
            Voici un aperçu de votre parcours académique
          </p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            style={{
              backgroundColor: 'var(--cw-orange-pale)',
              color: 'var(--cw-orange)',
              border: `1px solid var(--cw-orange)`
            }}
          >
            <Calendar className="h-4 w-4" />
            Calendrier
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <StatGrid cols={3}>
        <StatCard
          icon={BookOpen}
          label="Cours suivis"
          value="6"
          color="orange"
          trend="up"
          trendValue="+2 ce semestre"
          delay={0.1}
        />
        <StatCard
          icon={TrendingUp}
          label="Moyenne générale"
          value="14.5/20"
          color="success"
          trend="up"
          trendValue="+0.8"
          delay={0.2}
        />
        <StatCard
          icon={Award}
          label="Crédits ECTS"
          value="45/60"
          color="info"
          trend="neutral"
          trendValue="15 restants"
          delay={0.3}
        />
      </StatGrid>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Courses */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--cw-orange)' }}>
                <BookOpen className="h-6 w-6" />
                Mes cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    name: 'Large System Environment',
                    code: 'SEN4121',
                    progress: 75,
                    status: 'in-progress',
                  },
                  {
                    name: 'Software Engineering Foundations',
                    code: 'SEN101',
                    progress: 90,
                    status: 'completed',
                  },
                  {
                    name: 'Database Systems',
                    code: 'SEN201',
                    progress: 60,
                    status: 'in-progress',
                  },
                ].map((course) => (
                  <CourseItem key={course.code} {...course} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--cw-orange)' }}>
                <FileText className="h-6 w-6" />
                Devoirs à rendre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    title: 'Projet ERP - Phase 3',
                    course: 'SEN4121',
                    dueDate: '2 jours',
                    urgent: true,
                  },
                  {
                    title: 'TP Microservices',
                    course: 'SEN4121',
                    dueDate: '5 jours',
                    urgent: false,
                  },
                ].map((assignment, i) => (
                  <AssignmentItem key={i} {...assignment} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Schedule & Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--cw-info)' }}>
                <Calendar className="h-6 w-6" />
                Aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: '08:00', course: 'Large System', room: 'A201' },
                  { time: '10:00', course: 'Database Systems', room: 'B105' },
                  { time: '14:00', course: 'Software Eng.', room: 'A201' },
                ].map((schedule, i) => (
                  <ScheduleItem key={i} {...schedule} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Situation financière
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--cw-text-secondary)' }}>
                    Scolarité 2026
                  </span>
                  <StatusBadge status="paid" label="Payé" size="sm" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--cw-text-secondary)' }}>Prochain paiement</span>
                  <span className="font-semibold" style={{ color: 'var(--cw-navy)' }}>
                    250,000 FCFA
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'var(--cw-text-muted)' }}>
                  Échéance: 15 février 2026
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CourseItem({
  name,
  code,
  progress,
  status,
}: {
  name: string
  code: string
  progress: number
  status: string
}) {
  const statusConfig = {
    'in-progress': { label: 'En cours', badge: 'in-progress' as const },
    'completed': { label: 'Terminé', badge: 'completed' as const },
    'pending': { label: 'En attente', badge: 'pending' as const },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['pending']

  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="p-4 rounded-xl border transition-all duration-200 group"
      style={{
        borderColor: 'var(--cw-border-default)',
        backgroundColor: 'var(--cw-bg-card)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--cw-border-hover)';
        e.currentTarget.style.backgroundColor = 'var(--cw-gray-50)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--cw-border-default)';
        e.currentTarget.style.backgroundColor = 'var(--cw-bg-card)';
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold group-hover:opacity-80 transition-opacity" style={{ color: 'var(--cw-navy)' }}>
            {name}
          </h4>
          <p className="text-sm" style={{ color: 'var(--cw-text-secondary)' }}>{code}</p>
        </div>
        <StatusBadge status={config.badge} label={config.label} size="sm" />
      </div>
      <div className="w-full rounded-full h-2.5 mb-2" style={{ backgroundColor: 'var(--cw-gray-200)' }}>
        <motion.div
          className="h-2.5 rounded-full"
          style={{ backgroundColor: 'var(--cw-orange)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between items-center text-xs" style={{ color: 'var(--cw-text-secondary)' }}>
        <span>{progress}% terminé</span>
        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  )
}

function AssignmentItem({
  title,
  course,
  dueDate,
  urgent,
}: {
  title: string
  course: string
  dueDate: string
  urgent: boolean
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="p-4 rounded-xl border transition-all duration-200"
      style={{
        backgroundColor: urgent ? 'var(--cw-danger-light)' : 'var(--cw-bg-card)',
        borderColor: urgent ? 'var(--cw-danger)' : 'var(--cw-border-default)'
      }}
    >
      <div className="flex items-start gap-3">
        <Clock
          className="h-5 w-5 mt-0.5"
          style={{
            color: urgent ? 'var(--cw-danger)' : 'var(--cw-text-muted)'
          }}
        />
        <div className="flex-1">
          <h4 className="font-medium" style={{ color: 'var(--cw-navy)' }}>{title}</h4>
          <p className="text-sm" style={{ color: 'var(--cw-text-secondary)' }}>{course}</p>
          <p
            className="text-xs mt-1 font-medium"
            style={{
              color: urgent ? 'var(--cw-danger)' : 'var(--cw-text-secondary)'
            }}
          >
            À rendre dans {dueDate}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function ScheduleItem({
  time,
  course,
  room,
}: {
  time: string
  course: string
  room: string
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group"
      style={{ backgroundColor: 'transparent' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--cw-gray-50)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div className="text-center min-w-[60px]">
        <p className="text-sm font-semibold" style={{ color: 'var(--cw-navy)' }}>{time}</p>
        <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ backgroundColor: 'var(--cw-orange)' }} />
      </div>
      <div className="flex-1">
        <p className="font-medium group-hover:opacity-80 transition-opacity" style={{ color: 'var(--cw-navy)' }}>
          {course}
        </p>
        <p className="text-sm" style={{ color: 'var(--cw-text-secondary)' }}>Salle {room}</p>
      </div>
    </motion.div>
  )
}
