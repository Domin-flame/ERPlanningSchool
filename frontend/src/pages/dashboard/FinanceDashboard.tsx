import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { DollarSign, TrendingUp, AlertTriangle, Receipt, ArrowRight, Download, Plus, MoreHorizontal } from 'lucide-react'
import { StatCard, StatGrid } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { invoices } from '@/lib/mockData'

const statusMap: Record<string, 'paid' | 'pending' | 'overdue' | 'partially-paid' | 'draft'> = {
  'Paid': 'paid',
  'Pending': 'pending',
  'Overdue': 'overdue',
  'Partially Paid': 'partially-paid',
  'Draft': 'draft',
}

export function FinanceDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')

  const filtered = activeTab === 'all'
    ? invoices
    : invoices.filter((i) => i.status === activeTab)

  const totals = {
    revenue: '245 680 000',
    pending: invoices.filter((i) => i.status === 'Pending' || i.status === 'Overdue').length,
    invoices: invoices.length,
    recovery: '87.6%',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-800">
            Dashboard Finance
          </h1>
          <p className="text-gray-500 mt-1">
            Vue d'ensemble des finances de l'établissement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Exporter
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/finance-management')}>
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <StatGrid cols={4}>
        <StatCard icon={DollarSign} label="Revenus encaissés" value="245,7M FCFA" color="success" trend="up" trendValue="+12%" subtitle="vs mois dernier" delay={0.05} />
        <StatCard icon={Receipt} label="Factures en attente" value={totals.pending} color="warning" trend="down" trendValue="-3" subtitle="À relancer" delay={0.1} />
        <StatCard icon={TrendingUp} label="Taux de recouvrement" value={totals.recovery} color="navy" trend="up" trendValue="+4.1%" subtitle="Semestre en cours" delay={0.15} />
        <StatCard icon={AlertTriangle} label="Dépenses du mois" value="42,8M FCFA" color="info" trend="neutral" trendValue="Budget OK" subtitle="Sous contrôle" delay={0.2} />
      </StatGrid>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card rounded-xl bg-white border border-gray-200 shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-navy-800">Revenus 2025-2026</h3>
            <p className="text-xs text-gray-500 mt-0.5">Encaissements par mois (en millions FCFA)</p>
          </div>
          <div className="flex gap-2">
            <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-600">Mensuel</span>
            <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-orange-50 text-orange-600">Trimestriel</span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-48">
          {[420, 480, 510, 465, 550, 590, 640, 610, 680, 720, 690, 750].map((value, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <div
                className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-orange-500 to-orange-400 group-hover:from-orange-600 group-hover:to-orange-500 transition-all duration-300"
                style={{ height: `${(value / 750) * 160}px` }}
              />
              <span className="text-[10px] text-gray-400">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="card rounded-xl bg-white border border-gray-200 shadow-card overflow-hidden"
      >
        <div className="px-6 pt-4">
          <Tabs
            items={[
              { id: 'all', label: 'Toutes', badge: invoices.length },
              { id: 'Paid', label: 'Payées', badge: invoices.filter((i) => i.status === 'Paid').length },
              { id: 'Pending', label: 'En attente', badge: invoices.filter((i) => i.status === 'Pending').length },
              { id: 'Overdue', label: 'En retard', badge: invoices.filter((i) => i.status === 'Overdue').length },
              { id: 'Draft', label: 'Brouillons', badge: invoices.filter((i) => i.status === 'Draft').length },
            ]}
            activeId={activeTab}
            onChange={setActiveTab}
          />
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="table">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide">N° Facture</th>
                <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide">Étudiant</th>
                <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide">Montant</th>
                <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide hidden md:table-cell">Échéance</th>
                <th className="px-6 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide">Statut</th>
                <th className="px-6 py-3 text-right font-semibold text-navy-800 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="table-row">
                  <td className="px-6 py-4">
                    <span className="font-medium text-navy-800">{inv.number}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{inv.student}</td>
                  <td className="px-6 py-4 font-semibold text-navy-800">{inv.amount.toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-6 py-4 text-gray-600 hidden md:table-cell">
                    {new Date(inv.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={statusMap[inv.status]} label={inv.status} size="sm" dot />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="btn-icon" onClick={() => navigate('/finance-management')}>
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-400">{filtered.length} factures affichées</p>
          <button
            onClick={() => navigate('/finance-management')}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
          >
            Voir toutes les factures <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
