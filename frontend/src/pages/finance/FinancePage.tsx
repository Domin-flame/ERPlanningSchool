import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  CreditCard,
  Receipt,
  Plus,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Invoice {
  id: number
  invoice_number: string
  student_id: number
  total_amount: number
  status: string
  issue_date: string
  due_date?: string
}

export function FinancePage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const pageSize = 10

  const [newInvoice, setNewInvoice] = useState({
    student_email: '',
    amount: 250000,
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  })

  const [paymentData, setPaymentData] = useState({
    method: 'Mobile Money',
    reference: '',
    amount: 0,
  })

  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ['finance-invoices'],
    queryFn: () => api.get('/finance/invoices'),
    enabled: user?.role !== 'Student',
  })

  const createInvoiceMutation = useMutation({
    mutationFn: (data: typeof newInvoice) => api.post('/finance/invoices', data),
    onSuccess: () => {
      toast.success('Facture émise', 'La facture a bien été enregistrée.')
      setIsInvoiceModalOpen(false)
      setNewInvoice({
        student_email: '',
        amount: 250000,
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      })
      queryClient.invalidateQueries({ queryKey: ['finance-invoices'] })
    },
    onError: (err: Error) => {
      toast.error("Erreur d'émission", err.message)
    },
  })

  const makePaymentMutation = useMutation({
    mutationFn: (data: { invoice_id: number; amount: number; method: string; reference: string }) =>
      api.post('/finance/payments', data),
    onSuccess: () => {
      toast.success('Paiement réussi !', 'Votre reçu de paiement a été généré.')
      setIsPaymentModalOpen(false)
      setSelectedInvoice(null)
      queryClient.invalidateQueries({ queryKey: ['finance-invoices'] })
    },
    onError: (err: Error) => {
      toast.error('Échec du paiement', err.message)
    },
  })

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setPaymentData({
      method: 'Mobile Money',
      reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: inv.total_amount,
    })
    setIsPaymentModalOpen(true)
  }

  const isAdminOrStaff = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Staff'

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices
    const q = searchQuery.toLowerCase()
    return invoices.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.total_amount.toString().includes(q) ||
        inv.status.toLowerCase().includes(q)
    )
  }, [invoices, searchQuery])

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredInvoices.slice(start, start + pageSize)
  }, [filteredInvoices, currentPage, pageSize])

  const totalPages = Math.ceil(filteredInvoices.length / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-800 flex items-center gap-3">
            <DollarSign className="h-7 w-7 text-success-600" />
            Gestion Financière
          </h1>
          <p className="text-gray-500 mt-1">
            Suivi des factures de scolarité, paiements et comptabilité.
          </p>
        </div>

        {isAdminOrStaff && (
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsInvoiceModalOpen(true)}
            variant="secondary"
          >
            Émettre une Facture
          </Button>
        )}
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="finance">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-success-600" /> Scolarité Totale Encaissée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-navy-800">45,250,000 FCFA</p>
            <span className="text-xs text-success-600 font-semibold mt-1 inline-block">
              +12% vs mois dernier
            </span>
          </CardContent>
        </Card>

        <Card variant="finance">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="h-4 w-4 text-danger-500" /> Factures en Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-navy-800">
              {isAdminOrStaff ? invoices.filter((i) => i.status === 'Pending').length : 1}
            </p>
            <span className="text-xs text-danger-500 font-medium mt-1 inline-block">
              Échéance imminente
            </span>
          </CardContent>
        </Card>

        <Card variant="finance">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-navy-600" /> Reçus Délivrés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-navy-800">142</p>
            <span className="text-xs text-gray-400 mt-1 inline-block">
              Année Académique 2026
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Section */}
      {isAdminOrStaff ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-navy-800">
              Factures de l'Établissement
            </h2>

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500
                           placeholder:text-gray-400 w-full sm:w-64 bg-white"
                />
              </div>
              <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {isLoadingInvoices ? (
            <SkeletonList count={3} />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-12 w-12" />}
              title="Aucune facture enregistrée"
              description="Il n'y a pas encore de factures dans le système. Créez-en une pour commencer."
              actionLabel="Émettre une facture"
              onAction={() => setIsInvoiceModalOpen(true)}
            />
          ) : paginatedInvoices.length === 0 ? (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="Aucun résultat"
              description="Aucune facture ne correspond à votre recherche."
            />
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
                <table className="w-full text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide">
                        Numéro
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide">
                        Montant (FCFA)
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-navy-800 text-xs uppercase tracking-wide">
                        Date d'échéance
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-navy-800 text-xs uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedInvoices.map((inv, idx) => (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`hover:bg-orange-50/40 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                      >
                        <td className="px-4 py-3 font-medium text-navy-800">
                          {inv.invoice_number}
                        </td>
                        <td className="px-4 py-3 font-semibold text-navy-800">
                          {inv.total_amount.toLocaleString()} FCFA
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={
                              inv.status === 'Paid'
                                ? 'paid'
                                : inv.status === 'Pending'
                                ? 'pending'
                                : 'overdue'
                            }
                            label={
                              inv.status === 'Paid'
                                ? 'Payé'
                                : inv.status === 'Pending'
                                ? 'En attente'
                                : 'En retard'
                            }
                            size="sm"
                            dot
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {inv.due_date
                            ? new Date(inv.due_date).toLocaleDateString('fr-FR')
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {inv.status !== 'Paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPayment(inv)}
                            >
                              Payer
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredInvoices.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                showPageSize
              />
            </>
          )}
        </div>
      ) : (
        /* Student view */
        <Card variant="finance">
          <CardHeader>
            <CardTitle>Votre Relevé de Scolarité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">
                  Facture Tranche 2 - 2026
                </p>
                <h4 className="text-lg font-bold text-navy-800 mt-0.5">
                  Frais d'Études S2
                </h4>
                <p className="text-sm text-gray-500">
                  Montant: <span className="font-bold text-navy-800">250 000 FCFA</span>
                </p>
              </div>
              <Button
                variant="primary"
                leftIcon={<CreditCard className="h-4 w-4" />}
                onClick={() =>
                  handleOpenPayment({
                    id: 99,
                    invoice_number: 'INV-2026-STUDENT',
                    student_id: user?.id || 1,
                    total_amount: 250000,
                    status: 'Pending',
                    issue_date: new Date().toISOString(),
                  })
                }
              >
                Payer maintenant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Émettre Facture */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Créer une Facture de Scolarité"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createInvoiceMutation.mutate(newInvoice)
          }}
          className="space-y-4"
        >
          <Input
            label="Email de l'étudiant"
            required
            type="email"
            placeholder="student@campus.local"
            value={newInvoice.student_email}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, student_email: e.target.value })
            }
          />
          <Input
            label="Montant (FCFA)"
            required
            type="number"
            value={newInvoice.amount}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })
            }
          />
          <Input
            label="Date d'échéance"
            type="date"
            required
            value={newInvoice.due_date}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, due_date: e.target.value })
            }
          />
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createInvoiceMutation.isPending}>
              Générer la facture
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Modal Paiement */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Paiement de Scolarité"
        description={
          selectedInvoice ? `Facture ${selectedInvoice.invoice_number}` : ''
        }
      >
        {selectedInvoice && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              makePaymentMutation.mutate({
                invoice_id: selectedInvoice.id,
                amount: paymentData.amount,
                method: paymentData.method,
                reference: paymentData.reference,
              })
            }}
            className="space-y-4"
          >
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Montant à régler</p>
              <p className="text-2xl font-bold text-navy-800">
                {paymentData.amount.toLocaleString()} FCFA
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">
                Moyen de paiement
              </label>
              <select
                className="input"
                value={paymentData.method}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, method: e.target.value })
                }
              >
                <option value="Mobile Money">Orange / MTN Mobile Money</option>
                <option value="Carte Bancaire">Carte Bancaire (Visa/Mastercard)</option>
                <option value="Virement">Virement Bancaire</option>
              </select>
            </div>

            <Input
              label="Numéro de Référence / Transaction"
              required
              value={paymentData.reference}
              onChange={(e) =>
                setPaymentData({ ...paymentData, reference: e.target.value })
              }
            />

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                isLoading={makePaymentMutation.isPending}
                leftIcon={<CheckCircle className="h-4 w-4" />}
              >
                Confirmer le Règlement
              </Button>
            </ModalFooter>
          </form>
        )}
      </Modal>
    </div>
  )
}
