import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, CalendarDays, UserPlus, Banknote, ArrowRight, MoreHorizontal, Briefcase, TrendingUp } from 'lucide-react'
import { StatCard, StatGrid } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { employees } from '@/lib/mockData'

const statusMap: Record<string, 'active' | 'pending' | 'in-progress' | 'overdue'> = {
  'Active': 'active',
  'On Leave': 'pending',
  'Onboarding': 'in-progress',
  'Inactive': 'overdue',
}

export function HrDashboard() {
  const navigate = useNavigate()
  const activeEmployees = employees.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-800">
            Dashboard RH
          </h1>
          <p className="text-gray-500 mt-1">
            Gestion du personnel, congés et paie
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<CalendarDays className="h-4 w-4" />}>
            Congés
          </Button>
          <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => navigate('/employees')}>
            Nouvel employé
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <StatGrid cols={4}>
        <StatCard icon={Users} label="Employés actifs" value="256" color="navy" trend="up" trendValue="+8" subtitle="Ce trimestre" delay={0.05} />
        <StatCard icon={CalendarDays} label="Congés en attente" value="18" color="warning" trend="up" trendValue="+3" subtitle="À valider" delay={0.1} />
        <StatCard icon={UserPlus} label="Nouveaux recrutements" value="7" color="info" trend="up" trendValue="+2" subtitle="Depuis janvier" delay={0.15} />
        <StatCard icon={Banknote} label="Masse salariale" value="245 680K" color="success" trend="neutral" trendValue="Budget OK" subtitle="FCFA / mois" delay={0.2} />
      </StatGrid>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employees table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 card rounded-xl bg-white border border-gray-200 shadow-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-navy-800">Employés récents</h2>
              <p className="text-xs text-gray-500 mt-0.5">Les dernières fiches créées</p>
            </div>
            <button
              onClick={() => navigate('/employees')}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
            >
              Tout voir <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide">Employé</th>
                  <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide hidden md:table-cell">Département</th>
                  <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide">Statut</th>
                  <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide hidden lg:table-cell">Salaire</th>
                  <th className="px-6 py-3 text-right font-semibold text-navy-800 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeEmployees.map((emp) => (
                  <tr key={emp.id} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-semibold">
                          {emp.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-navy-800">{emp.name}</p>
                          <p className="text-xs text-gray-500 md:hidden">{emp.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{emp.department}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={statusMap[emp.status]} label={emp.status} size="sm" dot />
                    </td>
                    <td className="px-6 py-4 text-gray-600 hidden lg:table-cell">{emp.salary.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-6 py-4 text-right">
                      <button className="btn-icon" onClick={() => navigate('/employees')}>
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card rounded-xl bg-white border border-gray-200 shadow-card p-6"
          >
            <h3 className="font-semibold text-navy-800 mb-4">Actions rapides</h3>
            <div className="space-y-2">
              {[
                { label: 'Nouvelle demande de congé', icon: CalendarDays, path: '/hr', color: 'text-orange-600 bg-orange-50' },
                { label: 'Ajouter un employé', icon: UserPlus, path: '/employees', color: 'text-navy-600 bg-navy-50' },
                { label: 'Générer la paie', icon: Banknote, path: '/hr', color: 'text-success-600 bg-success-50' },
                { label: 'Gérer les équipements', icon: Briefcase, path: '/hr', color: 'text-info-600 bg-info-50' },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`p-2 rounded-lg ${a.color}`}>
                    <a.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-navy-800">{a.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Congés récents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card rounded-xl bg-white border border-gray-200 shadow-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy-800">Congés récents</h3>
              <span className="text-xs text-gray-400">Cette semaine</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Prof. Marie Ngo', type: 'Congé annuel', days: '5 jours', color: 'bg-warning-500' },
                { name: 'Prof. Anne Bibi', type: 'Congé maladie', days: '2 jours', color: 'bg-danger-500' },
                { name: 'Dr. Jean Pierre', type: 'Mission', days: '3 jours', color: 'bg-info-500' },
              ].map((leave, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${leave.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy-800">{leave.name}</p>
                    <p className="text-xs text-gray-500">{leave.type} · {leave.days}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Attendance / Performance strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="card rounded-xl bg-white border border-gray-200 shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-navy-800">Présence par département</h3>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <TrendingUp className="h-3.5 w-3.5 text-success-500" />
            95.2% présence moyenne
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Informatique', rate: 96, staff: 48 },
            { name: 'Mathématiques', rate: 93, staff: 32 },
            { name: 'Droit', rate: 91, staff: 27 },
            { name: 'Finance', rate: 94, staff: 35 },
          ].map((d) => (
            <div key={d.name} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-navy-800">{d.name}</span>
                <span className="text-sm font-semibold text-navy-800">{d.rate}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400" style={{ width: `${d.rate}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">{d.staff} employés</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
