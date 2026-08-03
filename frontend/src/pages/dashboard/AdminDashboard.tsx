import { motion } from 'framer-motion'
import { Users, BookOpen, DollarSign, TrendingUp, AlertCircle, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatCard, StatGrid } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function AdminDashboard() {
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
            Tableau de bord administrateur 🎯
          </h1>
          <p className="text-gray-500 mt-1">
            Vue d'ensemble de l'établissement
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Activity className="h-4 w-4 text-success-500" />
          <span>Dernière synchronisation: il y a 5 min</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <StatGrid cols={4}>
        <StatCard
          icon={Users}
          label="Étudiants actifs"
          value="1,234"
          color="navy"
          trend="up"
          trendValue="+45 cette semaine"
          delay={0.1}
        />
        <StatCard
          icon={BookOpen}
          label="Cours actifs"
          value="89"
          color="success"
          trend="neutral"
          trendValue="4 départements"
          delay={0.2}
        />
        <StatCard
          icon={DollarSign}
          label="Revenus (FCFA)"
          value="45M"
          color="orange"
          trend="up"
          trendValue="+12% vs mois dernier"
          delay={0.3}
        />
        <StatCard
          icon={TrendingUp}
          label="Taux de réussite"
          value="87%"
          color="info"
          trend="up"
          trendValue="+3.2%"
          delay={0.4}
        />
      </StatGrid>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="academic" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Alertes récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { message: '12 étudiants en échec académique', severity: 'high', status: 'error' },
                { message: '5 paiements en retard', severity: 'medium', status: 'warning' },
                { message: '3 demandes de congé en attente', severity: 'low', status: 'info' },
              ].map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-all duration-200 ${
                    alert.severity === 'high'
                      ? 'border-danger-200 bg-danger-50'
                      : alert.severity === 'medium'
                      ? 'border-warning-200 bg-warning-50'
                      : 'border-info-100 bg-info-50'
                  }`}
                >
                  <AlertCircle
                    className={`h-5 w-5 mt-0.5 ${
                      alert.severity === 'high'
                        ? 'text-danger-600'
                        : alert.severity === 'medium'
                        ? 'text-warning-600'
                        : 'text-info-600'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy-800">
                      {alert.message}
                    </p>
                  </div>
                  <StatusBadge
                    status={alert.status as any}
                    label={alert.severity === 'high' ? 'Urgent' : alert.severity === 'medium' ? 'Moyen' : 'Info'}
                    size="sm"
                  />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="finance">
          <CardHeader>
            <CardTitle>Activités récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              {[
                { msg: 'Nouveau cours créé: "Advanced Microservices"', time: 'Il y a 2h', icon: '📚' },
                { msg: '45 nouvelles inscriptions cette semaine', time: 'Il y a 1j', icon: '👥' },
                { msg: 'Paie du mois générée avec succès', time: 'Il y a 3j', icon: '💰' },
                { msg: '3 nouveaux employés ajoutés', time: 'Il y a 5j', icon: '👤' },
              ].map((activity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg">{activity.icon}</span>
                  <div>
                    <p className="text-navy-800">{activity.msg}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
