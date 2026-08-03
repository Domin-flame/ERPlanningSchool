import { motion } from 'framer-motion'
import { Calendar, FileText, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatCard, StatGrid } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuthStore } from '@/store/authStore'

export function StaffDashboard() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-navy-800">
            Espace Personnel 💼
          </h1>
          <p className="text-gray-500 mt-1">
            Bienvenue, {user?.full_name}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <StatGrid cols={4}>
        <StatCard
          icon={Calendar}
          label="Congés restants"
          value="12 jours"
          color="success"
          trend="down"
          trendValue="-3 pris"
          delay={0.1}
        />
        <StatCard
          icon={FileText}
          label="Documents"
          value="8 nouveaux"
          color="navy"
          trend="up"
          trendValue="+2 cette semaine"
          delay={0.2}
        />
        <StatCard
          icon={Users}
          label="Équipe"
          value="24 membres"
          color="orange"
          trend="neutral"
          trendValue="3 nouveaux"
          delay={0.3}
        />
        <StatCard
          icon={Clock}
          label="Heures ce mois"
          value="160h"
          color="info"
          trend="up"
          trendValue="+8h vs mois dernier"
          delay={0.4}
        />
      </StatGrid>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="hr" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-navy-600" />
              Mes tâches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { task: 'Valider les demandes de congé', status: 'pending', urgent: true },
                { task: 'Préparer le rapport mensuel', status: 'pending', urgent: false },
                { task: "Réunion d'équipe - Vendredi 14h", status: 'info', urgent: false },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 4 }}
                  className="p-4 rounded-xl border border-gray-200 hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-200 flex items-center gap-3"
                >
                  <AlertCircle
                    className={`h-5 w-5 ${item.urgent ? 'text-danger-500' : 'text-gray-400'}`}
                  />
                  <span className="flex-1 text-sm text-navy-800">
                    {item.task}
                  </span>
                  <StatusBadge
                    status={item.urgent ? 'warning' : 'info'}
                    label={item.urgent ? 'Urgent' : 'Normal'}
                    size="sm"
                  />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-success-600" />
              Prochains événements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              {[
                { day: 'Lundi', time: '10h', event: 'Formation sécurité' },
                { day: 'Mercredi', time: '15h', event: 'Entretien annuel' },
                { day: 'Vendredi', time: '14h', event: "Réunion d'équipe" },
              ].map((evt, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg border-l-4 border-success-500 bg-success-50/50"
                >
                  <p className="font-medium text-navy-800">{evt.event}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {evt.day} {evt.time}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
