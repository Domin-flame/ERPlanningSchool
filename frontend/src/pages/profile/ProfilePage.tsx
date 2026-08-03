import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Shield, Phone, Building, Key, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { getInitials } from '@/lib/utils'

export function ProfilePage() {
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '+237 600 00 00 00',
    department: user?.department || 'Informatique & Génie Logiciel',
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success('Profil mis à jour', 'Vos informations ont été enregistrées avec succès.')
    }, 600)
  }

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { status: any; label: string }> = {
      'Super Admin': { status: 'info', label: 'Super Admin' },
      'Admin': { status: 'success', label: 'Administrateur' },
      'Staff': { status: 'warning', label: 'Personnel' },
      'Student': { status: 'neutral', label: 'Étudiant' },
    }
    return roleMap[role] || { status: 'neutral', label: role }
  }

  const roleInfo = getRoleBadge(user?.role || 'Student')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-navy-800">
            Mon Profil Utilisateur
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez vos informations personnelles et identifiants de sécurité.
          </p>
        </div>
        <StatusBadge status={roleInfo.status} label={roleInfo.label} icon={<Shield className="h-3.5 w-3.5" />} />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1 text-center">
          <CardContent className="pt-6 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-500 to-navy-800 flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-4"
            >
              {getInitials(user?.full_name || 'User')}
            </motion.div>
            <h3 className="text-xl font-bold text-navy-800">{user?.full_name}</h3>
            <p className="text-sm text-gray-500 mb-3">{user?.email}</p>
            <StatusBadge status={roleInfo.status} label={user?.role || 'Student'} />
          </CardContent>
        </Card>

        {/* Profile Details Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-500" /> Informations Personnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nom complet"
                leftIcon={<User className="h-4 w-4" />}
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />

              <Input
                label="Adresse Email"
                disabled
                leftIcon={<Mail className="h-4 w-4" />}
                value={formData.email}
                helperText="L'adresse email ne peut pas être modifiée."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Téléphone"
                  leftIcon={<Phone className="h-4 w-4" />}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  label="Département"
                  leftIcon={<Building className="h-4 w-4" />}
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  isLoading={isSaving}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-navy-600" /> Sécurité du Compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-navy-50 rounded-xl border border-navy-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-navy-100 rounded-lg">
                <Key className="h-5 w-5 text-navy-700" />
              </div>
              <div>
                <p className="font-semibold text-navy-800 text-sm">Mot de passe</p>
                <p className="text-xs text-gray-500">Dernière modification il y a 30 jours</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info('Réinitialisation', 'Un lien de réinitialisation vous a été envoyé par email.')
              }
            >
              Modifier
            </Button>
          </div>

          <div className="flex justify-between items-center p-4 bg-success-50 rounded-xl border border-success-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-100 rounded-lg">
                <Shield className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="font-semibold text-navy-800 text-sm">Authentification à 2 facteurs</p>
                <p className="text-xs text-gray-500">Protégez votre compte avec 2FA</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Activer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
