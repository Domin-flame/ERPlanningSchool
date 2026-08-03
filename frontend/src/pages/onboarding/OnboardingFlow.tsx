import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, BookOpen, CreditCard, Users, Megaphone, ArrowRight } from 'lucide-react'
import { Mascot } from '@/components/ui/Mascot'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'

type OnboardingStep = 1 | 2 | 3 | 4

interface PortalFeature {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

export function OnboardingFlow() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1)

  const handleNext = () => {
    setTimeout(() => {
      if (currentStep < 4) {
        setCurrentStep((currentStep + 1) as OnboardingStep)
      } else {
        // Onboarding complete
        sessionStorage.setItem('onboarding-complete', 'true')
        navigate('/dashboard')
      }
    }, 300)
  }

  const handleSkip = () => {
    sessionStorage.setItem('onboarding-complete', 'true')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center px-4">
      {/* Decorative orbs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-1/3 -left-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-1/3 -right-1/4 w-96 h-96 bg-success-500 rounded-full blur-3xl"
        />
      </motion.div>

      {/* Main container */}
      <div className="relative z-10 w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <Step1 key="step1" onNext={handleNext} onSkip={handleSkip} />
          )}
          {currentStep === 2 && (
            <Step2 key="step2" onNext={handleNext} onSkip={handleSkip} />
          )}
          {currentStep === 3 && (
            <Step3 key="step3" onNext={handleNext} onSkip={handleSkip} />
          )}
          {currentStep === 4 && (
            <Step4 key="step4" onNext={handleNext} onSkip={handleSkip} />
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <motion.div className="mt-12 flex gap-2 justify-center">
          {[1, 2, 3, 4].map((step) => (
            <motion.div
              key={step}
              initial={{ width: 8 }}
              animate={{ width: currentStep === step ? 32 : 8 }}
              className={`h-2 rounded-full transition-colors ${
                currentStep >= step ? 'bg-orange-500' : 'bg-white/20'
              }`}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// ============================================================================
// STEP 1: Welcome Screen
// ============================================================================
function Step1({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mb-8 flex justify-center"
      >
        <Mascot variant="waving" size="xl" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
      >
        Bienvenue sur <span className="text-orange-500">CampusWorkflow</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-navy-200 mb-12 max-w-md mx-auto"
      >
        Votre plateforme complète de gestion universitaire. Explorons ensemble les fonctionnalités qui faciliteront votre parcours.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-4 justify-center flex-col sm:flex-row"
      >
        <Button
          onClick={onNext}
          variant="primary"
          size="lg"
          rightIcon={<ArrowRight className="h-5 w-5" />}
        >
          Démarrer la visite
        </Button>
        <Button
          onClick={onSkip}
          variant="outline"
          size="lg"
          className="text-white border-white/30 hover:bg-white/10"
        >
          Ignorer
        </Button>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// STEP 2: Portal Overview
// ============================================================================
function Step2({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const portals: PortalFeature[] = [
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: 'Portail Académique',
      description: 'Gérez vos cours, notes, emploi du temps et inscriptions',
      color: 'from-marine-500 to-seafoam-500'
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: 'Gestion Financière',
      description: 'Consultez vos factures et effectuez vos paiements',
      color: 'from-seafoam-500 to-green-500'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Ressources Humaines',
      description: 'Demandes de congés et gestion du personnel',
      color: 'from-salmon-500 to-orange-500'
    },
    {
      icon: <Megaphone className="h-8 w-8" />,
      title: 'Marketing & Communication',
      description: 'Suivez les campagnes et les opportunités',
      color: 'from-orange-500 to-salmon-500'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Les quatre piliers de CampusWorkflow
        </h2>
        <p className="text-navy-200 text-lg">
          Chaque portail offre des outils spécialisés pour vos besoins
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {portals.map((portal, idx) => (
          <motion.div
            key={portal.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
            className={`p-6 rounded-2xl bg-gradient-to-br ${portal.color} text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
          >
            <div className="mb-4 p-3 bg-white/20 rounded-lg w-fit">
              {portal.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{portal.title}</h3>
            <p className="text-sm opacity-90">{portal.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-4 justify-center flex-col sm:flex-row"
      >
        <Button
          onClick={onNext}
          variant="primary"
          size="lg"
          rightIcon={<ChevronRight className="h-5 w-5" />}
        >
          Continuer
        </Button>
        <Button
          onClick={onSkip}
          variant="outline"
          size="lg"
          className="text-white border-white/30 hover:bg-white/10"
        >
          Ignorer
        </Button>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// STEP 3: Key Features
// ============================================================================
function Step3({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const features = [
    {
      icon: '📊',
      title: 'Tableaux de bord',
      description: 'Vue d\'ensemble personnalisée de vos données'
    },
    {
      icon: '🔔',
      title: 'Notifications',
      description: 'Restez informé de tous les événements importants'
    },
    {
      icon: '💬',
      title: 'Communication',
      description: 'Échangez avec votre université'
    },
    {
      icon: '⚙️',
      title: 'Paramètres',
      description: 'Personnalisez votre expérience'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Fonctionnalités principales
        </h2>
        <p className="text-navy-200 text-lg">
          Découvrez ce qui rend CampusWorkflow unique
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
            className="p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all"
          >
            <div className="text-4xl mb-3">{feature.icon}</div>
            <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
            <p className="text-sm text-navy-200">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-4 justify-center flex-col sm:flex-row"
      >
        <Button
          onClick={onNext}
          variant="primary"
          size="lg"
          rightIcon={<ChevronRight className="h-5 w-5" />}
        >
          Continuer
        </Button>
        <Button
          onClick={onSkip}
          variant="outline"
          size="lg"
          className="text-white border-white/30 hover:bg-white/10"
        >
          Ignorer
        </Button>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// STEP 4: Ready to Go
// ============================================================================
function Step4({ onNext }: { onNext: () => void; onSkip: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mb-8 flex justify-center"
      >
        <Mascot variant="celebrating" size="xl" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl md:text-5xl font-bold text-white mb-4"
      >
        Vous êtes prêt !
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-navy-200 mb-12 max-w-md mx-auto"
      >
        Vous avez maintenant tous les outils pour réussir. Explorez CampusWorkflow et découvrez toutes les possibilités !
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <p className="text-sm text-navy-300 flex items-center justify-center gap-2">
          <span className="text-2xl">✓</span> Bienvenue sur CampusWorkflow
        </p>
        <p className="text-sm text-navy-300 flex items-center justify-center gap-2">
          <span className="text-2xl">✓</span> Accédez à tous vos portails
        </p>
        <p className="text-sm text-navy-300 flex items-center justify-center gap-2">
          <span className="text-2xl">✓</span> Simplifiez votre gestion universitaire
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-12"
      >
        <Button
          onClick={onNext}
          variant="primary"
          size="lg"
          className="w-full md:w-auto"
          rightIcon={<ArrowRight className="h-5 w-5" />}
        >
          Accéder au tableau de bord
        </Button>
      </motion.div>
    </motion.div>
  )
}
