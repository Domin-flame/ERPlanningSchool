import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone,
  Target,
  TrendingUp,
  Users,
  Plus,
  BarChart3,
  Calendar,
  DollarSign,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatCard, StatGrid } from '@/components/ui/StatCard'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Campaign {
  id: number
  name: string
  channel: string
  start_date: string
  end_date: string
  budget: number
}

export function MarketingPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    channel: 'Email',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    budget: 500000,
  })

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['marketing-campaigns'],
    queryFn: () => api.get('/marketing/campaigns'),
  })

  const createCampaignMutation = useMutation({
    mutationFn: (data: typeof newCampaign) => api.post('/marketing/campaigns', data),
    onSuccess: () => {
      toast.success('Campagne créée', 'La campagne marketing a été lancée avec succès.')
      setIsCampaignModalOpen(false)
      setNewCampaign({
        name: '',
        channel: 'Email',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        budget: 500000,
      })
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
    },
    onError: (err: Error) => {
      toast.error('Erreur', err.message)
    },
  })

  const isAdminOrStaff = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Staff'

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bell font-bold text-marine-900 flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-marine-600" />
            Marketing & Communication
          </h1>
          <p className="text-marine-600 mt-1">
            Campagnes de recrutement, communication institutionnelle et relations publiques.
          </p>
        </div>

        {isAdminOrStaff && (
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCampaignModalOpen(true)}
          >
            Nouvelle Campagne
          </Button>
        )}
      </motion.div>

      {/* Stats */}
      <StatGrid cols={3}>
        <StatCard
          icon={Target}
          label="Campagnes actives"
          value={campaigns.length}
          color="navy"
          trend="up"
          trendValue="En cours"
          delay={0.1}
        />
        <StatCard
          icon={TrendingUp}
          label="Taux d'engagement"
          value="68%"
          color="success"
          trend="up"
          trendValue="+5% vs mois dernier"
          delay={0.2}
        />
        <StatCard
          icon={Users}
          label="Nouveaux leads"
          value="45"
          color="warning"
          trend="up"
          trendValue="+12 cette semaine"
          delay={0.3}
        />
      </StatGrid>

      {/* Campaigns List */}
      <div>
        <h2 className="text-xl font-bell font-semibold text-marine-900 mb-4">
          Campagnes en cours
        </h2>

        {isLoading ? (
          <SkeletonList count={3} />
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="h-12 w-12" />}
            title="Aucune campagne"
            description="Lancez votre première campagne marketing pour attirer de nouveaux étudiants."
            actionLabel="Créer une campagne"
            onAction={() => setIsCampaignModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign, idx) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card hoverable>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <StatusBadge
                        status={new Date(campaign.end_date) > new Date() ? 'success' : 'neutral'}
                        label={new Date(campaign.end_date) > new Date() ? 'Active' : 'Terminée'}
                        size="sm"
                      />
                      <div className="p-2 bg-marine-50 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-marine-600" />
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-lg text-marine-900">
                      {campaign.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-marine-600">
                      <Megaphone className="h-4 w-4 text-marine-400" />
                      <span>Canal: <strong>{campaign.channel}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-marine-600">
                      <Calendar className="h-4 w-4 text-marine-400" />
                      <span>
                        {new Date(campaign.start_date).toLocaleDateString('fr-FR')} - {new Date(campaign.end_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-marine-600">
                      <DollarSign className="h-4 w-4 text-seafoam-600" />
                      <span>Budget: <strong className="text-seafoam-700">{campaign.budget.toLocaleString()} FCFA</strong></span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nouvelle Campagne */}
      <Modal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        title="Lancer une Campagne"
        description="Définissez les paramètres de votre campagne marketing."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createCampaignMutation.mutate(newCampaign)
          }}
          className="space-y-4"
        >
          <Input
            label="Nom de la campagne"
            required
            placeholder="ex: Recrutement Licence 2026"
            value={newCampaign.name}
            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-marine-700 mb-1.5">
              Canal de communication
            </label>
            <select
              className="input"
              value={newCampaign.channel}
              onChange={(e) => setNewCampaign({ ...newCampaign, channel: e.target.value })}
            >
              <option value="Email">Email</option>
              <option value="Réseaux sociaux">Réseaux sociaux</option>
              <option value="SMS">SMS</option>
              <option value="Radio/TV">Radio/TV</option>
              <option value="Panafricain">Panafricain</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date de début"
              type="date"
              required
              value={newCampaign.start_date}
              onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
            />
            <Input
              label="Date de fin"
              type="date"
              required
              value={newCampaign.end_date}
              onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
            />
          </div>

          <Input
            label="Budget (FCFA)"
            type="number"
            required
            value={newCampaign.budget}
            onChange={(e) => setNewCampaign({ ...newCampaign, budget: Number(e.target.value) })}
          />

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setIsCampaignModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createCampaignMutation.isPending}>
              Lancer la Campagne
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
