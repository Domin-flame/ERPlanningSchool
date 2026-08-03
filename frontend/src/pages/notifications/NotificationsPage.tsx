import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell, CheckCircle, AlertCircle, InfoIcon, Trash2, Mail,
  BookOpen, DollarSign, Users, Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toast } from '@/components/ui/Toast'

interface Notification {
  id: number
  title: string
  message: string
  timestamp: string
  type: 'success' | 'warning' | 'error' | 'info'
  read: boolean
  icon: React.ReactNode
  category: 'academic' | 'finance' | 'hr' | 'system'
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    title: 'Note publiée',
    message: "Votre note pour l'examen de Large System Environment a été publiée: 18/20",
    timestamp: '5 min',
    type: 'success',
    read: false,
    icon: <BookOpen className="h-5 w-5" />,
    category: 'academic',
  },
  {
    id: 2,
    title: 'Facture générée',
    message: 'Une nouvelle facture de 250 000 FCFA a été générée pour le semestre 2',
    timestamp: '1 heure',
    type: 'warning',
    read: false,
    icon: <DollarSign className="h-5 w-5" />,
    category: 'finance',
  },
  {
    id: 3,
    title: 'Congé approuvé',
    message: 'Votre demande de congé du 10-15 septembre a été approuvée',
    timestamp: '3 heures',
    type: 'success',
    read: true,
    icon: <CheckCircle className="h-5 w-5" />,
    category: 'hr',
  },
  {
    id: 4,
    title: 'Absence détectée',
    message: 'Vous avez été absent(e) au cours de SEN4121 du 05 août à 08h00',
    timestamp: '1 jour',
    type: 'error',
    read: true,
    icon: <AlertCircle className="h-5 w-5" />,
    category: 'academic',
  },
  {
    id: 5,
    title: 'Maintenance système',
    message: 'CampusWorkflow sera en maintenance le 15 août de 22h à 23h',
    timestamp: '2 jours',
    type: 'info',
    read: true,
    icon: <InfoIcon className="h-5 w-5" />,
    category: 'system',
  },
  {
    id: 6,
    title: 'Nouveau cours disponible',
    message: "Le cours \"Advanced Microservices\" est maintenant disponible à l'inscription",
    timestamp: '3 jours',
    type: 'info',
    read: true,
    icon: <BookOpen className="h-5 w-5" />,
    category: 'academic',
  },
]

const typeConfig = {
  success: { bg: 'bg-success-50', border: 'border-l-success-500', iconBg: 'bg-success-100 text-success-600', badge: 'success' as const, label: 'Succès' },
  warning: { bg: 'bg-warning-50', border: 'border-l-warning-500', iconBg: 'bg-warning-100 text-warning-600', badge: 'warning' as const, label: 'Attention' },
  error:   { bg: 'bg-danger-50',  border: 'border-l-danger-500',  iconBg: 'bg-danger-100 text-danger-600',  badge: 'error' as const,   label: 'Erreur' },
  info:    { bg: 'bg-info-50',    border: 'border-l-info-500',    iconBg: 'bg-info-100 text-info-600',      badge: 'info' as const,    label: 'Info' },
}

const categories = [
  { id: 'all',      label: 'Tous',       icon: <Bell className="h-4 w-4" /> },
  { id: 'academic', label: 'Académique', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'finance',  label: 'Finance',    icon: <DollarSign className="h-4 w-4" /> },
  { id: 'hr',       label: 'RH',         icon: <Users className="h-4 w-4" /> },
  { id: 'system',   label: 'Système',    icon: <Clock className="h-4 w-4" /> },
] as const

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'academic' | 'finance' | 'hr' | 'system'>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const filteredNotifications = notifications.filter((n) => {
    if (selectedCategory !== 'all' && n.category !== selectedCategory) return false
    if (showUnreadOnly && n.read) return false
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: number) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    toast.success('Supprimée', 'La notification a été supprimée')
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success('Marqué comme lu', 'Toutes les notifications ont été marquées comme lues')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-navy-800 flex items-center gap-3">
              <Bell className="h-8 w-8 text-orange-500" />
              Notifications
            </h1>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-danger-500 text-white rounded-full text-sm font-bold"
              >
                {unreadCount}
              </motion.span>
            )}
          </div>
          <p className="text-gray-500 mt-1">Restez informé(e) de tous les événements importants</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            Tout marquer comme lu
          </Button>
        )}
      </motion.div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.icon}
            {cat.label}
          </motion.button>
        ))}
      </div>

      {/* Unread filter */}
      <button
        onClick={() => setShowUnreadOnly(!showUnreadOnly)}
        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
          showUnreadOnly
            ? 'border-orange-500 bg-orange-50 text-orange-700'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        }`}
      >
        {showUnreadOnly ? '✓ Non lues uniquement' : 'Afficher toutes'}
      </button>

      {/* Notifications list */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-16 w-16 text-gray-200 mb-4" />
              <p className="text-navy-800 text-lg font-medium">Aucune notification</p>
              <p className="text-gray-400 text-sm mt-1">
                {showUnreadOnly
                  ? 'Vous êtes à jour ! Aucune notification non lue.'
                  : 'Aucune notification pour cette catégorie.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notif, idx) => {
            const cfg = typeConfig[notif.type]
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <div
                  className={`rounded-xl border-l-4 border border-gray-200 ${cfg.bg} ${
                    !notif.read ? 'ring-1 ring-orange-400/50' : ''
                  } p-4 flex gap-4 items-start transition-all`}
                >
                  <div className={`p-2.5 rounded-lg flex-shrink-0 ${cfg.iconBg}`}>
                    {notif.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h3 className="font-semibold text-navy-800">{notif.title}</h3>
                      <StatusBadge status={cfg.badge} label={cfg.label} size="sm" />
                      {!notif.read && (
                        <span className="w-2 h-2 bg-orange-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{notif.message}</p>
                    <p className="text-xs text-gray-400">{notif.timestamp}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Marquer comme lu"
                      >
                        <Mail className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="p-2 rounded-lg hover:bg-danger-100 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4 text-danger-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Non lues',      value: unreadCount,                                              bg: 'bg-danger-50',  text: 'text-danger-600' },
          { label: 'Succès',        value: notifications.filter((n) => n.type === 'success').length, bg: 'bg-success-50', text: 'text-success-600' },
          { label: 'Avertissements',value: notifications.filter((n) => n.type === 'warning').length, bg: 'bg-warning-50', text: 'text-warning-600' },
          { label: 'Erreurs',       value: notifications.filter((n) => n.type === 'error').length,   bg: 'bg-danger-50',  text: 'text-danger-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`${stat.bg} rounded-xl p-4 text-center`}
          >
            <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
