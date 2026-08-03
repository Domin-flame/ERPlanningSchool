import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, GraduationCap, CheckCircle, AlertCircle, Eye, EyeOff, AlertTriangle, Sparkles, ShieldCheck, BookOpen, Users } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Mascot } from '@/components/ui/Mascot'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import logoUrl from '@/assets/campusworkflow.png'

export function Register() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Student',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.full_name.trim()) newErrors.full_name = 'Le nom complet est requis'
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.password) newErrors.password = 'Le mot de passe est requis'
    else if (formData.password.length < 8) newErrors.password = 'Minimum 8 caractères'
    else if (!/[A-Z]/.test(formData.password)) newErrors.password = 'Doit contenir une majuscule'
    else if (!/[0-9]/.test(formData.password)) newErrors.password = 'Doit contenir un chiffre'
    else if (!/[!@#$%^&*]/.test(formData.password)) newErrors.password = 'Doit contenir un caractère spécial'
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return

    setIsLoading(true)
    try {
      // Register the user
      await api.register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })
      
      toast.success('Inscription réussie !', 'Connexion automatique en cours...')
      
      // Auto-login after registration
      try {
        await login(formData.email, formData.password)
        navigate('/onboarding')
      } catch (loginErr: any) {
        // If auto-login fails, redirect to login page
        toast.info('Inscription réussie', 'Veuillez vous connecter')
        navigate('/login')
      }
    } catch (err: any) {
      setIsLoading(false)
      const errorMessage = err.message || 'Une erreur s\'est produite lors de l\'inscription'
      
      // Handle specific error messages from backend
      if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('déjà')) {
        setErrors({ 
          email: 'Cet email est déjà associé à un compte existant' 
        })
        toast.error('Email déjà utilisé', 'Veuillez utiliser une autre adresse email')
      } else if (errorMessage.toLowerCase().includes('password')) {
        setErrors({ 
          password: 'Le mot de passe ne respecte pas les critères de sécurité' 
        })
        toast.error('Mot de passe faible', 'Veuillez respecter les critères affichés')
      } else if (errorMessage.toLowerCase().includes('réseau') || errorMessage.toLowerCase().includes('connexion')) {
        toast.error('Erreur de connexion', 'Vérifiez votre connexion internet')
      } else {
        toast.error('Erreur d\'inscription', errorMessage)
      }
      
      console.error('Registration error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const highlights = [
    { icon: ShieldCheck, label: 'Données sécurisées' },
    { icon: BookOpen, label: 'Portail académique' },
    { icon: Users, label: 'Communauté active' },
  ]

  return (
    <div
      className="min-h-screen relative overflow-hidden flex"
      style={{ background: 'var(--cw-navy-dark)' }}
    >
      {/* Decorative gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="absolute -top-1/3 -right-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ backgroundColor: 'var(--cw-orange)' }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.08, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="absolute -bottom-1/3 -left-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ backgroundColor: 'var(--cw-info)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(var(--cw-white) 1px, transparent 1px), linear-gradient(90deg, var(--cw-white) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Asymmetric "L" layout — consistent with the Login wireframe */}
      <div className="relative z-10 min-h-screen w-full flex flex-col px-4 sm:px-8 lg:px-12 py-8">
        {/* ─── Top bar: real logo + brand ─── */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="flex items-center justify-between max-w-[1400px] w-full mx-auto"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={logoUrl}
                alt="Logo CampusWorkflow"
                className="h-12 w-12 sm:h-14 sm:w-14 object-contain rounded-xl bg-white/10 p-1.5 ring-1 ring-white/20"
              />
              <motion.span
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, delay: 1 }}
                className="absolute -top-1 -right-1 text-orange-400"
              >
                <Sparkles className="h-4 w-4" />
              </motion.span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                Campus<span style={{ color: 'var(--cw-orange)' }}>Workflow</span>
              </h1>
              <p className="text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Plateforme de gestion universitaire
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-white/10"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            Déjà inscrit ?
            <ArrowRight className="h-4 w-4" style={{ color: 'var(--cw-orange)' }} />
          </Link>
        </motion.header>

        {/* ─── Main asymmetric body ─── */}
        <div className="flex-1 flex items-center max-w-[1400px] w-full mx-auto">
          {/* Left decorative column (top part of the L) */}
          <div className="hidden lg:flex flex-col justify-between flex-1 min-h-[520px] pr-8">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="mt-10 max-w-lg"
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-semibold uppercase tracking-wider"
                style={{ backgroundColor: 'rgba(255, 107, 0, 0.15)', color: 'var(--cw-orange)' }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Rejoignez la communauté CampusWorkflow
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight">
                Créez votre compte
                <br />
                <span style={{ color: 'var(--cw-orange)' }}>et commencez dès maintenant</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Étudiants, enseignants, personnel administratif — tous les acteurs du campus
                sur une seule et même plateforme.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                {highlights.map((h, i) => (
                  <motion.div
                    key={h.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.1 }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                  >
                    <h.icon className="h-4 w-4" style={{ color: 'var(--cw-orange)' }} />
                    <span className="text-sm font-medium text-white">{h.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ─── Registration card (offset diagonally → bottom arm of the L) ─── */}
          <div className="w-full max-w-xl mx-auto lg:mx-0 lg:ml-auto pb-10 lg:pb-16">
            {/* Big mascot — graduated fox for registration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="flex justify-center -mb-4 lg:-mb-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                >
                  <Mascot variant="graduated" size="xl" className="w-36 h-36 sm:w-44 sm:h-44 drop-shadow-2xl" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'var(--cw-orange)', color: 'white' }}
                >
                  Bienvenue ! 🎓
                </motion.span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl p-7 sm:p-10 border-t-4 border-orange-500 overflow-hidden"
            >
              {/* Header gradient strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: 'linear-gradient(to right, var(--cw-orange), var(--cw-info), var(--cw-navy))',
                }}
              />

              {/* Mobile-only logo */}
              <div className="flex items-center gap-3 lg:hidden mb-6">
                <img
                  src={logoUrl}
                  alt="Logo CampusWorkflow"
                  className="h-10 w-10 object-contain rounded-lg bg-orange-50 p-1"
                />
                <h1 className="text-lg font-bold" style={{ color: 'var(--cw-navy)' }}>
                  Campus<span style={{ color: 'var(--cw-orange)' }}>Workflow</span>
                </h1>
              </div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-8"
              >
                <div className="hidden sm:inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg text-white" style={{
                  background: 'linear-gradient(to bottom right, var(--cw-orange), var(--cw-orange-light))',
                }}>
                  <GraduationCap className="h-8 w-8" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--cw-navy)' }}>
                  Créer un compte
                </h1>
                <p className="mt-2 text-sm" style={{ color: 'var(--cw-text-secondary)' }}>
                  Rejoignez CampusWorkflow et gérez votre campus
                </p>
              </motion.div>

              {/* Steps indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <motion.div
                  animate={{ scale: step >= 1 ? 1.05 : 1 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all text-white shadow-lg"
                  style={{
                    backgroundColor: step >= 1 ? 'var(--cw-orange)' : 'var(--cw-gray-200)',
                    color: step >= 1 ? 'white' : 'var(--cw-text-secondary)',
                  }}
                >
                  1
                </motion.div>
                <div className="h-1 w-12 rounded transition-all" style={{
                  backgroundColor: step >= 2 ? 'var(--cw-orange)' : 'var(--cw-gray-200)',
                }} />
                <motion.div
                  animate={{ scale: step >= 2 ? 1.05 : 1 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all text-white shadow-lg"
                  style={{
                    backgroundColor: step >= 2 ? 'var(--cw-orange)' : 'var(--cw-gray-200)',
                    color: step >= 2 ? 'white' : 'var(--cw-text-secondary)',
                  }}
                >
                  2
                </motion.div>
              </div>

              <form onSubmit={handleRegister}>
                {/* Global error alert */}
                <AnimatePresence>
                  {Object.keys(errors).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 p-4 rounded-xl flex items-start gap-3"
                      style={{
                        backgroundColor: 'var(--cw-danger-light)',
                        borderColor: 'var(--cw-danger)',
                        borderWidth: '1px',
                      }}
                    >
                      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--cw-danger)' }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--cw-danger)' }}>
                          Erreurs de formulaire
                        </p>
                        <ul className="mt-2 space-y-1">
                          {Object.entries(errors).map(([key, value]) => (
                            <li key={key} className="text-sm" style={{ color: 'var(--cw-danger)' }}>
                              • {value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <Input
                        label="Nom complet"
                        placeholder="Jean Dupont"
                        leftIcon={<User className="h-4 w-4" />}
                        value={formData.full_name}
                        onChange={(e) => {
                          setFormData({ ...formData, full_name: e.target.value })
                          if (errors.full_name) setErrors({ ...errors, full_name: '' })
                        }}
                        error={errors.full_name}
                        required
                      />

                      <Input
                        label="Adresse email"
                        type="email"
                        placeholder="name@universite.edu"
                        leftIcon={<Mail className="h-4 w-4" />}
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value })
                          if (errors.email) setErrors({ ...errors, email: '' })
                        }}
                        error={errors.email}
                        required
                      />

                      <Select
                        label="Type de compte"
                        id="role"
                        value={formData.role}
                        onChange={(e) => {
                          setFormData({ ...formData, role: e.target.value })
                          if (errors.role) setErrors({ ...errors, role: '' })
                        }}
                        error={errors.role}
                        options={[
                          { value: 'Student', label: 'Étudiant' },
                          { value: 'Admin', label: 'Administrateur' },
                          { value: 'Staff', label: 'Enseignant' },
                          { value: 'Finance', label: 'Finance' },
                          { value: 'Marketing', label: 'Marketing' },
                          { value: 'HR', label: 'Ressources Humaines' },
                        ]}
                        required
                      />

                      <div className="pt-2">
                        <Button
                          type="button"
                          className="w-full"
                          onClick={() => {
                            if (validateStep1()) setStep(2)
                          }}
                          rightIcon={<ArrowRight className="h-4 w-4" />}
                        >
                          Continuer
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="relative">
                        <Input
                          label="Mot de passe"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          leftIcon={<Lock className="h-4 w-4" />}
                          rightIcon={
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-gray-400 hover:text-navy-600 transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          }
                          value={formData.password}
                          onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value })
                            if (errors.password) setErrors({ ...errors, password: '' })
                          }}
                          error={errors.password}
                          required
                        />
                      </div>

                      <div className="relative">
                        <Input
                          label="Confirmer le mot de passe"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          leftIcon={<Lock className="h-4 w-4" />}
                          rightIcon={
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="text-gray-400 hover:text-navy-600 transition-colors"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          }
                          value={formData.confirmPassword}
                          onChange={(e) => {
                            setFormData({ ...formData, confirmPassword: e.target.value })
                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' })
                          }}
                          error={errors.confirmPassword}
                          required
                        />
                      </div>

                      {/* Password requirements */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl border space-y-2"
                        style={{
                          backgroundColor: 'var(--cw-orange-pale)',
                          borderColor: 'var(--cw-orange)',
                        }}
                      >
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--cw-navy)' }}>
                          Critères du mot de passe :
                        </p>
                        {[
                          { label: 'Minimum 8 caractères', met: formData.password.length >= 8 },
                          { label: 'Une lettre majuscule', met: /[A-Z]/.test(formData.password) },
                          { label: 'Un chiffre', met: /[0-9]/.test(formData.password) },
                          { label: 'Un caractère spécial (!@#$%^&*)', met: /[!@#$%^&*]/.test(formData.password) },
                        ].map((req, i) => (
                          <motion.div key={i} animate={{ x: req.met ? 0 : 0 }} className="flex items-center gap-2">
                            <div
                              className="p-0.5 rounded-full transition-all"
                              style={{
                                backgroundColor: req.met ? 'var(--cw-success)' : 'var(--cw-gray-300)',
                                color: 'white',
                              }}
                            >
                              {req.met ? (
                                <CheckCircle className="h-3.5 w-3.5" />
                              ) : (
                                <AlertCircle className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <span
                              className="text-xs font-medium transition-colors"
                              style={{
                                color: req.met ? 'var(--cw-success)' : 'var(--cw-text-secondary)',
                              }}
                            >
                              {req.label}
                            </span>
                          </motion.div>
                        ))}
                      </motion.div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setStep(1)
                            setErrors({})
                          }}
                        >
                          Retour
                        </Button>
                        <Button type="submit" className="flex-1" isLoading={isLoading}>
                          {isLoading ? 'Création...' : 'Créer mon compte'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              {/* Login link */}
              <p className="text-center text-sm mt-6" style={{ color: 'var(--cw-text-secondary)' }}>
                Déjà un compte ?{' '}
                <Link
                  to="/login"
                  className="font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--cw-orange)' }}
                >
                  Se connecter
                </Link>
              </p>
            </motion.div>

            {/* Mini trust badges */}
            <div className="flex items-center justify-center gap-4 mt-6 lg:mt-8">
              {['Gratuit', 'Rapide', 'Sécurisé'].map((label) => (
                <span
                  key={label}
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ color: 'rgba(255, 255, 255, 0.7)', backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
                >
                  ✓ {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="max-w-[1400px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 pb-2 text-xs"
          style={{ color: 'rgba(255, 255, 255, 0.45)' }}
        >
          <span>© {new Date().getFullYear()} CampusWorkflow — ERP Universitaire</span>
          <span>Votre plateforme complète de gestion universitaire</span>
        </motion.footer>
      </div>
    </div>
  )
}

