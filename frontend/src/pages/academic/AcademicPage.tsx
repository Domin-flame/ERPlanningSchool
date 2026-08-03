import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, GraduationCap, Plus, CheckCircle, UserCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface CourseItem {
  id: number
  title: string
  code: string
  description?: string
  teacher_name?: string
  credits: number
  program_id?: number
}

interface ProgramItem {
  id: number
  name: string
  level: string
  duration_years: number
}

export function AcademicPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'courses' | 'my-courses' | 'programs'>('courses')
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false)

  const [newCourse, setNewCourse] = useState({
    title: '',
    code: '',
    description: '',
    teacher_name: user?.full_name || '',
    credits: 3,
  })

  const { data: courses = [], isLoading: isLoadingCourses } = useQuery<CourseItem[]>({
    queryKey: ['academic-courses'],
    queryFn: () => api.get('/academic/courses'),
  })

  const { data: myCourses = [], isLoading: isLoadingMyCourses } = useQuery<CourseItem[]>({
    queryKey: ['my-courses'],
    queryFn: () => api.get('/academic/me/enrollments'),
    enabled: user?.role === 'Student',
  })

  const { data: programs = [], isLoading: isLoadingPrograms } = useQuery<ProgramItem[]>({
    queryKey: ['academic-programs'],
    queryFn: () => api.get('/academic/programs'),
  })

  const enrollMutation = useMutation({
    mutationFn: (courseId: number) => api.post(`/academic/courses/${courseId}/enroll`, {}),
    onSuccess: () => {
      toast.success('Inscription réussie', 'Vous êtes maintenant inscrit à ce cours.')
      queryClient.invalidateQueries({ queryKey: ['my-courses'] })
    },
    onError: (err: Error) => {
      toast.error("Erreur d'inscription", err.message || 'Impossible de vous inscrire.')
    },
  })

  const createCourseMutation = useMutation({
    mutationFn: (courseData: typeof newCourse) => api.post('/academic/courses', courseData),
    onSuccess: () => {
      toast.success('Cours créé avec succès')
      setIsAddCourseModalOpen(false)
      setNewCourse({
        title: '',
        code: '',
        description: '',
        teacher_name: user?.full_name || '',
        credits: 3,
      })
      queryClient.invalidateQueries({ queryKey: ['academic-courses'] })
    },
    onError: (err: Error) => {
      toast.error('Erreur lors de la création', err.message)
    },
  })

  const isAdminOrStaff = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Staff'
  const isEnrolled = (courseId: number) => myCourses.some((c) => c.id === courseId)

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
            <BookOpen className="h-7 w-7 text-orange-500" />
            Gestion Académique
          </h1>
          <p className="text-gray-500 mt-1">
            Explorez les offres de formation, cours disponibles et devoirs.
          </p>
        </div>

        {isAdminOrStaff && (
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddCourseModalOpen(true)}
          >
            Nouveau Cours
          </Button>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="tab-list">
        <button
          onClick={() => setActiveTab('courses')}
          className={`tab-trigger ${activeTab === 'courses' ? 'tab-trigger-active' : ''}`}
        >
          Tous les cours ({courses.length})
        </button>

        {user?.role === 'Student' && (
          <button
            onClick={() => setActiveTab('my-courses')}
            className={`tab-trigger ${activeTab === 'my-courses' ? 'tab-trigger-active' : ''}`}
          >
            Mes Inscriptions ({myCourses.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('programs')}
          className={`tab-trigger ${activeTab === 'programs' ? 'tab-trigger-active' : ''}`}
        >
          Programmes & Filières ({programs.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'courses' && (
        <div>
          {isLoadingCourses ? (
            <SkeletonList count={3} />
          ) : courses.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-12 w-12" />}
              title="Aucun cours trouvé"
              description="Il n'y a pas encore de cours disponibles. Revenez plus tard ou contactez l'administration."
              actionLabel="Actualiser"
              onAction={() => queryClient.invalidateQueries({ queryKey: ['academic-courses'] })}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    variant="academic"
                    className="h-full flex flex-col justify-between"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-navy-100 text-navy-800">
                          {course.code}
                        </span>
                        <span className="text-xs font-medium text-success-600 bg-success-50 px-2 py-0.5 rounded-full border border-success-100">
                          {course.credits} ECTS
                        </span>
                      </div>
                      <CardTitle className="mt-2 text-lg text-navy-800">
                        {course.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                      <p className="text-sm text-gray-500 line-clamp-2 flex-1">
                        {course.description || 'Description non renseignée.'}
                      </p>
                      {course.teacher_name && (
                        <p className="text-xs text-gray-400 flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-orange-500" />
                          Enseignant: <span className="font-medium text-navy-800">{course.teacher_name}</span>
                        </p>
                      )}

                      {user?.role === 'Student' && (
                        <div className="pt-2 border-t border-gray-100 mt-auto">
                          {isEnrolled(course.id) ? (
                            <div className="flex items-center gap-1.5 text-sm font-medium text-success-600 bg-success-50 px-3 py-1.5 rounded-lg justify-center border border-success-100">
                              <CheckCircle className="h-4 w-4" /> Inscrit
                            </div>
                          ) : (
                            <Button
                              className="w-full"
                              size="sm"
                              variant="primary"
                              isLoading={enrollMutation.isPending}
                              onClick={() => enrollMutation.mutate(course.id)}
                            >
                              S'inscrire
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-courses' && (
        <div>
          {isLoadingMyCourses ? (
            <SkeletonList count={2} />
          ) : myCourses.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-12 w-12" />}
              title="Aucun cours inscrit"
              description="Vous n'êtes inscrit à aucun cours pour l'instant. Découvrez le catalogue pour vous inscrire."
              actionLabel="Découvrir le catalogue"
              onAction={() => setActiveTab('courses')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCourses.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card variant="academic">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-navy-100 text-navy-800">
                          {course.code}
                        </span>
                        <StatusBadge status="in-progress" label="En cours" size="sm" />
                      </div>
                      <CardTitle className="mt-2 text-navy-800">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-500">{course.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-100">
                        <span>{course.credits} Crédits</span>
                        <span className="text-success-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> En cours
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'programs' && (
        <div>
          {isLoadingPrograms ? (
            <SkeletonList count={2} />
          ) : programs.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="h-12 w-12" />}
              title="Aucun programme disponible"
              description="Il n'y a pas encore de programmes académiques."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {programs.map((program, idx) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card hoverable>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <GraduationCap className="h-6 w-6 text-orange-500" />
                        <span className="text-xs bg-navy-50 text-navy-700 px-2.5 py-1 rounded-full font-medium border border-navy-100">
                          {program.level}
                        </span>
                      </div>
                      <CardTitle className="mt-3 text-xl text-navy-800">{program.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Durée d'études</span>
                        <span className="font-semibold text-navy-800">{program.duration_years} ans</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Ajout de Cours */}
      <Modal
        isOpen={isAddCourseModalOpen}
        onClose={() => setIsAddCourseModalOpen(false)}
        title="Créer un nouveau cours"
        description="Remplissez les détails du cours pour l'ajouter au catalogue."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createCourseMutation.mutate(newCourse)
          }}
          className="space-y-4"
        >
          <Input
            label="Intitulé du cours"
            required
            value={newCourse.title}
            onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
            placeholder="ex: Advanced Microservices Architecture"
          />
          <Input
            label="Code du cours"
            required
            value={newCourse.code}
            onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
            placeholder="ex: SEN4120"
          />
          <Input
            label="Enseignant responsable"
            value={newCourse.teacher_name}
            onChange={(e) => setNewCourse({ ...newCourse, teacher_name: e.target.value })}
          />
          <Input
            label="Crédits (ECTS)"
            type="number"
            required
            value={newCourse.credits}
            onChange={(e) => setNewCourse({ ...newCourse, credits: Number(e.target.value) })}
          />
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">
              Description
            </label>
            <textarea
              className="input min-h-[80px]"
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              placeholder="Brève résumé des objectifs du cours..."
            />
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddCourseModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={createCourseMutation.isPending}
            >
              Enregistrer
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
