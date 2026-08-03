import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Send,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Phone,
  Video,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Mascot } from '@/components/ui/Mascot'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'

interface Conversation {
  id: number
  name: string
  avatar: string
  lastMessage: string
  timestamp: string
  unread: number
  online: boolean
  role: string
}

interface Message {
  id: number
  sender: string
  content: string
  timestamp: string
  isOwn: boolean
  avatar: string
}

const mockConversations: Conversation[] = [
  {
    id: 1,
    name: 'Prof. Jean Dupont',
    avatar: 'JD',
    lastMessage: 'Vérifiez bien votre dernier travail...',
    timestamp: '2 min',
    unread: 2,
    online: true,
    role: 'Professeur'
  },
  {
    id: 2,
    name: 'Groupe Projet SEN4121',
    avatar: 'GP',
    lastMessage: 'Vous: On commence demain ?',
    timestamp: '1 heure',
    unread: 0,
    online: true,
    role: 'Groupe'
  },
  {
    id: 3,
    name: 'Service Financier',
    avatar: 'SF',
    lastMessage: 'Votre facture a été générée',
    timestamp: '5 heures',
    unread: 0,
    online: false,
    role: 'Support'
  },
  {
    id: 4,
    name: 'Marie Ndzana',
    avatar: 'MN',
    lastMessage: 'Tu as fini les exercices ?',
    timestamp: '1 jour',
    unread: 0,
    online: false,
    role: 'Camarade'
  },
]

const mockMessages: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      sender: 'Prof. Jean Dupont',
      content: 'Bonjour! Comment allez-vous ?',
      timestamp: '10:30',
      isOwn: false,
      avatar: 'JD'
    },
    {
      id: 2,
      sender: 'You',
      content: 'Bonjour Professeur! Je vais bien, merci.',
      timestamp: '10:32',
      isOwn: true,
      avatar: 'US'
    },
    {
      id: 3,
      sender: 'Prof. Jean Dupont',
      content: 'Vérifiez bien votre dernier travail...',
      timestamp: '10:35',
      isOwn: false,
      avatar: 'JD'
    },
  ],
  2: [
    {
      id: 1,
      sender: 'Group',
      content: '@everyone Le projet avance bien ?',
      timestamp: '14:00',
      isOwn: false,
      avatar: 'GP'
    },
    {
      id: 2,
      sender: 'You',
      content: 'Oui on progresse bien ! On a fait 50% du travail.',
      timestamp: '14:05',
      isOwn: true,
      avatar: 'US'
    },
  ]
}

export function ChatPage() {
  const { user } = useAuthStore()
  const [conversations] = useState<Conversation[]>(mockConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0])
  const [messages, setMessages] = useState<Message[]>(mockMessages[mockConversations[0].id])
  const [newMessage, setNewMessage] = useState('')
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: messages.length + 1,
      sender: 'You',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      avatar: user?.full_name?.slice(0, 2).toUpperCase() || 'US'
    }

    setMessages([...messages, message])
    setNewMessage('')
    
    // Simulate response
    setTimeout(() => {
      const response: Message = {
        id: messages.length + 2,
        sender: selectedConversation.name,
        content: 'Message reçu! Merci pour votre message.',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isOwn: false,
        avatar: selectedConversation.avatar
      }
      setMessages(prev => [...prev, response])
    }, 500)
  }

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    setMessages(mockMessages[conv.id] || [])
  }

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <MessageSquare className="h-7 w-7 text-orange-500" />
            Messagerie
          </h1>
          <p className="text-gray-500 mt-1">
            Communiquez avec votre communauté universitaire
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsNewChatOpen(true)}
        >
          Nouvelle conversation
        </Button>
      </motion.div>

      {/* Main Chat Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4 overflow-y-auto">
              {/* Search */}
              <div className="sticky top-0 bg-white pt-2">
                <Input
                  leftIcon={<Search className="h-4 w-4" />}
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Conversations */}
              <div className="space-y-2">
                {filteredConversations.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Mascot variant="searching" size="md" />
                    <p className="text-sm text-gray-500 mt-3">Aucune conversation trouvée</p>
                  </motion.div>
                ) : (
                  filteredConversations.map((conv, idx) => (
                    <motion.button
                      key={conv.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        selectedConversation?.id === conv.id
                          ? 'bg-orange-50 border border-orange-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            conv.online ? 'bg-success-500' : 'bg-gray-400'
                          }`}>
                            {conv.avatar}
                          </div>
                          {conv.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline gap-2">
                            <h4 className="font-semibold text-sm text-navy-800 truncate">
                              {conv.name}
                            </h4>
                            <span className="text-xs text-gray-400 flex-shrink-0">{conv.timestamp}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                        </div>
                        {conv.unread > 0 && (
                          <div className="px-2 py-0.5 bg-orange-500 text-white rounded-full text-xs font-bold">
                            {conv.unread}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      selectedConversation.online ? 'bg-success-500' : 'bg-gray-400'
                    }`}>
                      {selectedConversation.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-800">{selectedConversation.name}</h3>
                      <p className={`text-xs font-medium ${selectedConversation.online ? 'text-success-600' : 'text-gray-400'}`}>
                        {selectedConversation.online ? '● En ligne' : '● Hors ligne'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" leftIcon={<Phone className="h-4 w-4" />}>
                      Appel
                    </Button>
                    <Button size="sm" variant="outline" leftIcon={<Video className="h-4 w-4" />}>
                      Vidéo
                    </Button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center py-12"
                  >
                    <Mascot variant="message" size="lg" />
                    <p className="text-gray-500 mt-4 text-sm">Pas encore de messages. Commencez la conversation!</p>
                  </motion.div>
                ) : (
                  messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex gap-3 ${msg.isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full ${
                        msg.isOwn ? 'bg-orange-500' : 'bg-marine-400'
                      } flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {msg.avatar}
                      </div>
                      <div className={msg.isOwn ? 'items-end' : 'items-start'}>
                        <div className={`px-4 py-2 rounded-lg max-w-xs ${
                          msg.isOwn
                            ? 'bg-orange-500 text-white rounded-br-none'
                            : 'bg-marine-100 text-marine-900 rounded-bl-none'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <p className="text-xs text-marine-500 mt-1">{msg.timestamp}</p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Area */}
              <div className="border-t border-marine-200 p-4 space-y-3">
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-marine-100 rounded-lg text-marine-600">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Écrivez votre message..."
                    className="flex-1 px-4 py-2 border border-marine-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button className="p-2 hover:bg-marine-100 rounded-lg text-marine-600">
                    <Smile className="h-5 w-5" />
                  </button>
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    leftIcon={<Send className="h-4 w-4" />}
                  >
                    Envoyer
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <Mascot variant="message" size="xl" />
                <p className="text-marine-600 mt-4">Sélectionnez une conversation pour commencer</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        title="Nouvelle conversation"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setIsNewChatOpen(false)
            toast.success('Conversation créée', 'La conversation a été initiée avec succès.')
          }}
          className="space-y-4"
        >
          <Input
            label="Rechercher un utilisateur ou un groupe"
            placeholder="Tapez un nom..."
          />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-marine-900">Suggestions</p>
            {['Prof. Marie Kuete', 'Groupe Projet SEN', 'Service Académique'].map((name) => (
              <button
                key={name}
                className="w-full p-3 text-left rounded-lg hover:bg-marine-50 border border-marine-100 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setIsNewChatOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Créer
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
