import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toast } from '@/components/ui/Toast'

interface CalendarEvent {
  id: number
  title: string
  date: string
  time: string
  endTime: string
  location: string
  type: 'course' | 'exam' | 'meeting' | 'deadline'
  color: string
  participants?: number
  description?: string
}

const mockEvents: CalendarEvent[] = [
  {
    id: 1,
    title: 'Cours: Large System Environment',
    date: '2026-08-05',
    time: '08:00',
    endTime: '10:00',
    location: 'Salle A201',
    type: 'course',
    color: 'bg-marine-500',
    participants: 45,
  },
  {
    id: 2,
    title: 'Examen: Database Systems',
    date: '2026-08-05',
    time: '14:00',
    endTime: '16:00',
    location: 'Amphithéâtre B',
    type: 'exam',
    color: 'bg-salmon-500',
    participants: 120,
  },
  {
    id: 3,
    title: 'Réunion projet SEN4121',
    date: '2026-08-06',
    time: '15:30',
    endTime: '16:30',
    location: 'Salle de réunion 3',
    type: 'meeting',
    color: 'bg-seafoam-500',
    participants: 5,
  },
  {
    id: 4,
    title: 'Rendu: Rapport Final',
    date: '2026-08-08',
    time: '23:59',
    endTime: '23:59',
    location: 'Plateforme en ligne',
    type: 'deadline',
    color: 'bg-orange-500',
  },
]

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)) // August 2026
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isNewEventOpen, setIsNewEventOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    type: 'course' as const,
  })

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const monthDays = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = Array.from({ length: monthDays }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `2026-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return mockEvents.filter(e => e.date === dateStr)
  }

  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const eventTypeConfig = {
    course: { badge: 'info', label: 'Cours' },
    exam: { badge: 'error', label: 'Examen' },
    meeting: { badge: 'success', label: 'Réunion' },
    deadline: { badge: 'warning', label: 'Échéance' },
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
          <h1 className="text-3xl font-bell font-bold text-marine-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-marine-600" />
            Calendrier Académique
          </h1>
          <p className="text-marine-600 mt-1">
            Consultez vos cours, examens et événements
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsNewEventOpen(true)}
        >
          Ajouter un événement
        </Button>
      </motion.div>

      {/* Main Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-marine-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-marine-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-marine-600" />
                </button>
                <h2 className="text-xl font-bell font-bold text-marine-900 capitalize">
                  {monthName}
                </h2>
                <button
                  onClick={goToNextMonth}
                  className="p-2 hover:bg-marine-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-marine-600" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                  <div key={day} className="text-center font-bold text-marine-600 text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty days */}
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Days with events */}
                {days.map(day => {
                  const events = getEventsForDate(day)
                  const dateStr = `2026-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const isToday = dateStr === new Date().toISOString().split('T')[0]

                  return (
                    <motion.button
                      key={day}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`aspect-square p-2 rounded-lg border-2 transition-all ${
                        selectedDate === dateStr
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-marine-200 hover:border-marine-300'
                      } ${isToday ? 'bg-marine-50' : 'bg-white'}`}
                    >
                      <div className="h-full flex flex-col">
                        <span className={`text-sm font-bold ${isToday ? 'text-orange-600' : 'text-marine-900'}`}>
                          {day}
                        </span>
                        {events.length > 0 && (
                          <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                            {events.slice(0, 2).map(event => (
                              <div
                                key={event.id}
                                className={`${event.color} rounded px-1 py-0.5 text-white text-xs truncate`}
                              />
                            ))}
                            {events.length > 2 && (
                              <div className="text-xs text-marine-600 font-semibold">
                                +{events.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Selected Date Events */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="border-b border-marine-200">
              <CardTitle>
                {selectedDate
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'Sélectionnez une date'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDate ? (
                getEventsForDate(parseInt(selectedDate.split('-')[2])).length > 0 ? (
                  getEventsForDate(parseInt(selectedDate.split('-')[2])).map((event, idx) => (
                    <motion.button
                      key={event.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => {
                        setSelectedEvent(event)
                        setIsEventModalOpen(true)
                      }}
                      className="w-full p-3 rounded-lg bg-marine-50 hover:bg-marine-100 transition-all text-left border border-marine-200"
                    >
                      <div className="flex gap-2 items-start">
                        <div className={`${event.color} rounded px-2 py-1 text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                          {event.time.slice(0, 5)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-marine-900 truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-marine-600">{event.location}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <p className="text-sm text-marine-600">Aucun événement ce jour</p>
                  </motion.div>
                )
              ) : (
                <p className="text-sm text-marine-600 text-center py-8">Sélectionnez une date pour voir les événements</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Modal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          title={selectedEvent.title}
        >
          <div className="space-y-6">
            <div>
              <StatusBadge
                status={eventTypeConfig[selectedEvent.type].badge as any}
                label={eventTypeConfig[selectedEvent.type].label}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-marine-600" />
                <div>
                  <p className="text-sm text-marine-600">Horaire</p>
                  <p className="font-semibold text-marine-900">
                    {selectedEvent.time} - {selectedEvent.endTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-marine-600" />
                <div>
                  <p className="text-sm text-marine-600">Localisation</p>
                  <p className="font-semibold text-marine-900">{selectedEvent.location}</p>
                </div>
              </div>

              {selectedEvent.participants && (
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-marine-600" />
                  <div>
                    <p className="text-sm text-marine-600">Participants</p>
                    <p className="font-semibold text-marine-900">
                      {selectedEvent.participants} personnes
                    </p>
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-marine-600 mb-2">Description</p>
                  <p className="text-marine-900">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEventModalOpen(false)}
              >
                Fermer
              </Button>
              <Button>Ajouter au calendrier</Button>
            </ModalFooter>
          </div>
        </Modal>
      )}

      {/* New Event Modal */}
      <Modal
        isOpen={isNewEventOpen}
        onClose={() => setIsNewEventOpen(false)}
        title="Ajouter un événement"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setIsNewEventOpen(false)
            toast.success('Événement créé', 'Votre événement a été ajouté au calendrier.')
          }}
          className="space-y-4"
        >
          <Input
            label="Titre"
            required
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              required
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            />
            <Input
              label="Heure"
              type="time"
              required
              value={newEvent.time}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
            />
          </div>

          <Input
            label="Localisation"
            value={newEvent.location}
            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-marine-700 mb-1.5">
              Type d'événement
            </label>
            <select
              value={newEvent.type}
              onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
              className="input"
            >
              <option value="course">Cours</option>
              <option value="exam">Examen</option>
              <option value="meeting">Réunion</option>
              <option value="deadline">Échéance</option>
            </select>
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setIsNewEventOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer l'événement</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
