import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Bell, Palette, Globe, Save, Shield, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toast } from '@/components/ui/Toast'

export function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
  const [language, setLanguage] = useState('fr')

  const handleSave = () => {
    toast.success('Paramètres sauvegardés', 'Vos préférences ont été appliquées.')
  }

  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean
    onChange: (v: boolean) => void
  }) => (
    <label className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`inline-block h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-orange-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </label>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-navy-800 flex items-center gap-3">
            <Settings className="h-8 w-8 text-orange-500" /> Paramètres du Système
          </h1>
          <p className="text-gray-500 mt-1">
            Personnalisez votre expérience et vos préférences d'affichage.
          </p>
        </div>
        <StatusBadge status="info" label="Compte Actif" icon={<Shield className="h-3.5 w-3.5" />} />
      </motion.div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <div className="flex justify-between items-center py-4">
            <div>
              <p className="font-semibold text-navy-800 text-sm">Notifications par Email</p>
              <p className="text-xs text-gray-500 mt-0.5">Recevoir des résumés sur l'état des cours et devoirs</p>
            </div>
            <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
          </div>

          <div className="flex justify-between items-center py-4">
            <div>
              <p className="font-semibold text-navy-800 text-sm">Alertes SMS (Urgent)</p>
              <p className="text-xs text-gray-500 mt-0.5">Recevoir les rappels de paiement et convocations par SMS</p>
            </div>
            <Toggle checked={smsNotifications} onChange={setSmsNotifications} />
          </div>

          <div className="flex justify-between items-center py-4">
            <div>
              <p className="font-semibold text-navy-800 text-sm">Notifications Push</p>
              <p className="text-xs text-gray-500 mt-0.5">Notifications en temps réel dans l'application</p>
            </div>
            <Toggle checked={pushNotifications} onChange={setPushNotifications} />
          </div>
        </CardContent>
      </Card>

      {/* Appearance & Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-orange-500" /> Apparence & Langue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-navy-800 mb-3">
              Thème d'affichage
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'light', name: '☀️ Clair' },
                { id: 'dark', name: '🌙 Sombre' },
                { id: 'system', name: '💻 Système' },
              ].map((t) => (
                <motion.button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id as any)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl border text-sm font-medium text-center transition-all ${
                    theme === t.id
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t.name}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-800 mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4 text-orange-500" /> Langue de l'interface
            </label>
            <select
              className="input max-w-xs"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="fr">Français (France)</option>
              <option value="en">English (US)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-navy-700" /> Sécurité du Compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-navy-50 rounded-xl border border-navy-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-navy-100 rounded-lg">
                <Shield className="h-5 w-5 text-navy-700" />
              </div>
              <div>
                <p className="font-semibold text-navy-800 text-sm">Changement de mot de passe</p>
                <p className="text-xs text-gray-500">Dernière modification il y a 30 jours</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Réinitialisation', 'Un lien a été envoyé à votre email.')}
            >
              Modifier
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} leftIcon={<Save className="h-4 w-4" />}>
          Sauvegarder les préférences
        </Button>
      </div>
    </div>
  )
}
