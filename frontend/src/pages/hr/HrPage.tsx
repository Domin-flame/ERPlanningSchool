import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  Briefcase,
  Plus,
  Shield,
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

interface Employee {
  id: number
  employee_number: string
  department: string
  hire_date: string
}

interface Asset {
  id: number
  name: string
  category: string
  serial_number: string
  status: string
}

interface Payroll {
  id: number
  period: string
  gross_salary: number
  net_salary: number
  cnps_contribution: number
}

export function HrPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'employees' | 'leaves' | 'assets' | 'payrolls'>('employees')
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  const [leaveData, setLeaveData] = useState({
    employee_id: 1,
    leave_type: 'Paid Leave',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  })

  const [newEmployee, setNewEmployee] = useState({
    user_email: '',
    employee_number: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    department: 'Informatique',
    hire_date: new Date().toISOString().split('T')[0],
  })

  const { data: employees = [], isLoading: isLoadingEmp } = useQuery<Employee[]>({
    queryKey: ['hr-employees'],
    queryFn: () => api.get('/hr/employees'),
  })

  const { data: assets = [], isLoading: isLoadingAssets } = useQuery<Asset[]>({
    queryKey: ['hr-assets'],
    queryFn: () => api.get('/hr/assets'),
  })

  const { data: payrolls = [], isLoading: isLoadingPayrolls } = useQuery<Payroll[]>({
    queryKey: ['hr-payrolls'],
    queryFn: () => api.get('/hr/payrolls'),
  })

  const createLeaveMutation = useMutation({
    mutationFn: (data: typeof leaveData) => api.post('/hr/leaves', data),
    onSuccess: () => {
      toast.success('Demande envoyée', 'Votre demande de congé a été enregistrée.')
      setIsLeaveModalOpen(false)
    },
    onError: (err: Error) => {
      toast.error('Erreur', err.message)
    },
  })

  const createEmployeeMutation = useMutation({
    mutationFn: (data: typeof newEmployee) => api.post('/hr/employees', data),
    onSuccess: () => {
      toast.success('Employé enregistré')
      setIsEmployeeModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] })
    },
    onError: (err: Error) => {
      toast.error('Erreur', err.message)
    },
  })

  const isAdminOrStaff = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Staff'

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return employees.slice(start, start + pageSize)
  }, [employees, currentPage, pageSize])

  const totalPages = Math.ceil(employees.length / pageSize)

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
            <Users className="h-7 w-7 text-orange-500" />
            Ressources Humaines & Personnel
          </h1>
          <p className="text-gray-500 mt-1">
            Gestion du personnel, contrats, fiches de paie et demandes de congés.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            leftIcon={<Calendar className="h-4 w-4" />}
            variant="outline"
            onClick={() => setIsLeaveModalOpen(true)}
          >
            Demande de Congé
          </Button>

          {isAdminOrStaff && (
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsEmployeeModalOpen(true)}
            >
              Ajouter Employé
            </Button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="tab-list">
        {[
          { id: 'employees', label: 'Employés', count: employees.length },
          { id: 'assets', label: 'Équipements & Matériel', count: assets.length },
          { id: 'payrolls', label: 'Bulletins de Paie', count: payrolls.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any)
              setCurrentPage(1)
            }}
            className={`tab-trigger ${
              activeTab === tab.id ? 'tab-trigger-active' : ''
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'employees' && (
        <div>
          {isLoadingEmp ? (
            <SkeletonList count={3} />
          ) : employees.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Aucun employé répertorié"
              description="Il n'y a pas encore d'employés dans le système."
              actionLabel="Ajouter un employé"
              onAction={() => setIsEmployeeModalOpen(true)}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedEmployees.map((emp, idx) => (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card variant="hr" hoverable>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-navy-100 text-navy-800">
                            {emp.employee_number}
                          </span>
                          <Briefcase className="h-5 w-5 text-gray-400" />
                        </div>
                        <CardTitle className="mt-2 text-lg text-navy-800">
                          {emp.department}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-500">
                        <p>
                          Date d'embauche:{' '}
                          <span className="font-semibold text-navy-800">
                            {new Date(emp.hire_date).toLocaleDateString('fr-FR')}
                          </span>
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={employees.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                showPageSize
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'assets' && (
        <div>
          {isLoadingAssets ? (
            <SkeletonList count={2} />
          ) : assets.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-12 w-12" />}
              title="Aucun équipement enregistré"
              description="Il n'y a pas encore d'équipements dans le système."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset, idx) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card hoverable>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg text-navy-800">
                          {asset.name}
                        </CardTitle>
                        <StatusBadge
                          status={
                            asset.status === 'Available'
                              ? 'active'
                              : asset.status === 'In Use'
                              ? 'in-progress'
                              : 'pending'
                          }
                          label={asset.status}
                          size="sm"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-500 space-y-1">
                      <p>
                        Catégorie: <span className="font-medium text-navy-800">{asset.category}</span>
                      </p>
                      <p>
                        Matricule / N° Série:{' '}
                        <span className="font-mono text-xs text-gray-600">{asset.serial_number}</span>
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'payrolls' && (
        <div>
          {isLoadingPayrolls ? (
            <SkeletonList count={2} />
          ) : payrolls.length === 0 ? (
            <EmptyState
              icon={<Shield className="h-12 w-12" />}
              title="Aucun bulletin de paie généré"
              description="Il n'y a pas encore de bulletins de paie dans le système."
            />
          ) : (
            <div className="space-y-3">
              {payrolls.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card variant="hr">
                    <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4">
                      <div>
                        <h4 className="font-semibold text-navy-800">
                          Période : {p.period}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Cotisation CNPS: {p.cnps_contribution.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Salaire Net</p>
                        <p className="text-xl font-bold text-success-600">
                          {p.net_salary.toLocaleString()} FCFA
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Demande de Congé */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Demande de Congé"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createLeaveMutation.mutate(leaveData)
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">
              Type de congé
            </label>
            <select
              className="input"
              value={leaveData.leave_type}
              onChange={(e) =>
                setLeaveData({ ...leaveData, leave_type: e.target.value })
              }
            >
              <option value="Paid Leave">Congé Payé</option>
              <option value="Sick Leave">Congé Maladie</option>
              <option value="Unpaid Leave">Congé sans solde</option>
            </select>
          </div>

          <Input
            label="Date de début"
            type="date"
            required
            value={leaveData.start_date}
            onChange={(e) =>
              setLeaveData({ ...leaveData, start_date: e.target.value })
            }
          />

          <Input
            label="Date de fin"
            type="date"
            required
            value={leaveData.end_date}
            onChange={(e) =>
              setLeaveData({ ...leaveData, end_date: e.target.value })
            }
          />

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setIsLeaveModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createLeaveMutation.isPending}>
              Soumettre la demande
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Modal Ajouter Employé */}
      <Modal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title="Ajouter un Employé"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createEmployeeMutation.mutate(newEmployee)
          }}
          className="space-y-4"
        >
          <Input
            label="Email de l'utilisateur"
            type="email"
            required
            placeholder="staff@campus.local"
            value={newEmployee.user_email}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, user_email: e.target.value })
            }
          />
          <Input
            label="Département"
            required
            value={newEmployee.department}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, department: e.target.value })
            }
          />
          <Input
            label="Matricule Employé"
            required
            value={newEmployee.employee_number}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, employee_number: e.target.value })
            }
          />

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setIsEmployeeModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createEmployeeMutation.isPending}>
              Créer la fiche employé
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
