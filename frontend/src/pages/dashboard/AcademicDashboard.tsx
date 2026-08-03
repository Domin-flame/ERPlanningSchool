import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, BookOpen, FileText, Award, ArrowRight, TrendingUp, Clock, Plus, MoreHorizontal } from 'lucide-react'
import { StatCard, StatGrid } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { courses } from '@/lib/mockData'

const statusMap: Record<string, 'active' | 'in-progress' | 'pending' | 'completed' | 'cancelled'> = {
  'Active': 'active',
  'In Progress': 'in-progress',
  'Pending': 'pending',
  'Completed': 'completed',
  'Cancelled': 'cancelled',
}

export function AcademicDashboard() {
  const navigate = useNavigate()
  const recentCourses = courses.slice(0, 5)

  const actions = [
    { label: 'Cours & Programmes', desc: 'Gérer les offres de formation', path: '/academic', icon: BookOpen, color: 'bg-orange-50 text-orange-600 border-orange-100' },
    { label: 'Inscriptions', desc: 'Nouvelles inscriptions', path: '/academic/courses', icon: Users, color: 'bg-navy-50 text-navy-600 border-navy-100' },
    { label: 'Examens', desc: 'Planning des évaluations', path: '/calendar', icon: FileText, color: 'bg-danger-50 text-danger-600 border-danger-100' },
    { label: 'Notes & Résultats', desc: 'Saisie et consultation', path: '/students', icon: Award, color: 'bg-success-50 text-success-600 border-success-100' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-800">
            Dashboard Académique
          </h1>
          <p className="text-gray-500 mt-1">
            Vue d'ensemble de l'activité académique
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Clock className="h-4 w-4" />}>
            Semestre 1 · 2025-2026
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/academic/courses')}>
            Nouveau cours
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <StatGrid cols={4}>
        <StatCard icon={Users} label="Étudiants actifs" value="1 248" color="orange" trend="up" trendValue="+5.2%" subtitle="+45 cette semaine" delay={0.05} />
        <StatCard icon={BookOpen} label="Cours en cours" value="56" color="navy" trend="neutral" trendValue="12 programmes" subtitle="4 départements" delay={0.1} />
        <StatCard icon={FileText} label="Examens à venir" value="18" color="warning" trend="up" trendValue="+3" subtitle="Sous 30 jours" delay={0.15} />
        <StatCard icon={Award} label="Taux de réussite" value="87.6%" color="success" trend="up" trendValue="+3.2%" subtitle="Semestre dernier" delay={0.2} />
      </StatGrid>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {actions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.07 }}
            onClick={() => navigate(action.path)}
            className="group text-left card rounded-xl bg-white border border-gray-200 shadow-card p-5 hover:shadow-card-hover hover:border-orange-200 transition-all duration-200"
          >
            <div className={`p-3 rounded-xl border ${action.color} w-fit mb-4 group-hover:scale-105 transition-transform`}>
              <action.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-navy-800 text-sm">{action.label}</h3>
            <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
            <div className="flex items-center gap-1 text-orange-600 text-xs font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Accéder <ArrowRight className="h-3 w-3" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Courses Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card rounded-xl bg-white border border-gray-200 shadow-card overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-navy-800">Cours récents</h2>
            <p className="text-xs text-gray-500 mt-0.5">Les derniers cours ajoutés au catalogue</p>
          </div>
          <button
            onClick={() => navigate('/academic/courses')}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
          >
            Tout voir <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide">Code</th>
                <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide">Cours</th>
                <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide hidden md:table-cell">Enseignant</th>
                <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide hidden lg:table-cell">Horaire</th>
                <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide">Statut</th>
                <th className="px-6 py-3 text-right font-semibold text-navy-800 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentCourses.map((course) => (
                <tr key={course.id} className="table-row">
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-gray-100 text-navy-800">{course.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-navy-800">{course.title}</p>
                    <p className="text-xs text-gray-500 md:hidden">{course.teacher}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{course.teacher}</td>
                  <td className="px-6 py-4 text-gray-600 hidden lg:table-cell">{course.schedule}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={statusMap[course.status]} label={course.status} size="sm" dot />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="btn-icon" onClick={() => navigate(`/academic/courses/${course.id}`)}>
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card rounded-xl bg-white border border-gray-200 shadow-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy-800">Performance par programme</h3>
            <span className="text-xs text-gray-400">Semestre 1</span>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Informatique', value: 92, students: 320, color: 'bg-orange-500' },
              { name: 'Finance', value: 85, students: 245, color: 'bg-navy-500' },
              { name: 'Droit', value: 78, students: 180, color: 'bg-info-500' },
              { name: 'Médecine', value: 88, students: 150, color: 'bg-success-500' },
            ].map((p) => (
              <div key={p.name}>
                <div className="flex justify-between items-center mb-1.5 text-sm">
                  <span className="font-medium text-navy-800">{p.name}</span>
                  <span className="text-gray-500">{p.value}% · {p.students} étudiants</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.color} transition-all duration-700`} style={{ width: `${p.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card rounded-xl bg-white border border-gray-200 shadow-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy-800">Activité récente</h3>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[
              { msg: '45 nouvelles inscriptions en Licence', time: 'Il y a 2h', color: 'bg-success-500' },
              { msg: 'Cours SEN4120 publié', time: 'Il y a 5h', color: 'bg-orange-500' },
              { msg: 'Notes de MAT301 publiées', time: 'Il y a 1j', color: 'bg-info-500' },
              { msg: 'Planning des examens validé', time: 'Il y a 2j', color: 'bg-warning-500' },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${a.color}`} />
                <div className="flex-1">
                  <p className="text-sm text-navy-800">{a.msg}</p>
                  <p className="text-xs text-gray-400">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

