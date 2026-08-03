import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mascot } from '@/components/ui/Mascot'
import { toast } from '@/components/ui/Toast'
import logoUrl from '@/assets/campusworkflow.png'
import campusImg from '@/assets/campus-ia1.jpg'

const DEMO_ACCOUNTS = [
  { role: 'Super Admin', email: 'super@campus.local', password: 'Super123!' },
  { role: 'Admin', email: 'admin@campus.local', password: 'Admin123!' },
  { role: 'Staff', email: 'staff@campus.local', password: 'Staff123!' },
  { role: 'Student', email: 'student@campus.local', password: 'Student123!' },
]

export function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuthStore()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await login(formData.email, formData.password)
      toast.success('Connexion réussie', 'Bienvenue !')
      navigate('/dashboard')
    } catch (err) {
      toast.error('Erreur de connexion', error || 'Vérifiez vos identifiants')
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2" style={{ backgroundColor: 'var(--cw-bg-primary)' }}>
      {/* ═══════════ LEFT PANEL — Immersive branding ═══════════ */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden min-h-screen p-12">
        {/* Background image */}
        <img
          src={campusImg}
          alt="Campus universitaire"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlays */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(7,24,39,0.94) 0%, rgba(15,39,66,0.82) 45%, rgba(255,107,0,0.55) 100%)',
          }}
        />

        {/* Decorative orbs */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(255,107,0,0.35)' }} />
        <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(59,130,246,0.2)' }} />

        {/* Top: brand */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 flex items-center gap-3"
        >
          <img
            src={logoUrl}
            alt="Logo CampusWorkflow"
            className="h-12 w-12 object-contain rounded-xl bg-white/15 backdrop-blur p-1.5 ring-1 ring-white/30"
          />
          <div>
            <p className="text-xl font-bold text-white leading-tight">
              Campus<span style={{ color: 'var(--cw-orange)' }}>Workflow</span>
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
              ERP Universitaire Intégré
            </p>
          </div>
        </motion.div>

        {/* Middle: headline + mascot */}
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-8"
          >
            <Mascot variant="waving" size="lg" className="w-28 h-28" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-4xl xl:text-[44px] font-bold text-white leading-[1.15] tracking-tight"
          >
            Toute la gestion de votre campus,{' '}
            <span style={{ color: 'var(--cw-orange)' }}>réunie au même endroit.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-5 text-lg leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            Académique, finance, ressources humaines et communication —
            une seule plateforme, une expérience chaleureuse.
          </motion.p>
        </div>

        {/* Bottom: trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="relative z-10 flex items-center gap-6"
        >
          {[
            { icon: ShieldCheck, label: 'Données sécurisées' },
            { icon: Sparkles, label: 'Interface moderne' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
              <item.icon className="h-4 w-4" style={{ color: 'var(--cw-orange)' }} />
              {item.label}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ═══════════ RIGHT PANEL — Form ═══════════ */}
      <div className="flex flex-col min-h-screen">
        {/* Mobile brand (only visible on small screens) */}
        <div className="lg:hidden flex items-center justify-between p-6">
          <div className="flex items-center gap-2.5">
            <img
              src={logoUrl}
              alt="Logo CampusWorkflow"
              className="h-10 w-10 object-contain rounded-lg"
            />
            <span className="text-lg font-bold" style={{ color: 'var(--cw-navy)' }}>
              Campus<span style={{ color: 'var(--cw-orange)' }}>Workflow</span>
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10">
          {/* ─── Login card (offset diagonally → the "L" bottom arm) ─── */}
          <div className="w-full max-w-xl mx-auto lg:mx-0 lg:ml-auto pb-10 lg:pb-16">
            {/* Big waving mascot — the face of the login screen */}
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
                  <Mascot variant="waving" size="xl" className="w-36 h-36 sm:w-44 sm:h-44 drop-shadow-2xl" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'var(--cw-orange)', color: 'white' }}
                >
                  Bonjour ! 👋
                </motion.span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl p-7 sm:p-10 border-t-4 border-orange-500"
            >
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

              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--cw-navy)' }}>
                  Connexion
                </h2>
                <p style={{ color: 'var(--cw-text-secondary)' }}>
                  Accédez à votre espace personnel
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-lg flex items-start gap-3"
                  style={{
                    backgroundColor: 'var(--cw-danger-light)',
                    borderColor: 'var(--cw-danger)',
                    borderWidth: '1px',
                  }}
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--cw-danger)' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--cw-danger)' }}>
                      Erreur de connexion
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--cw-danger)' }}>{error}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  id="email"
                  type="email"
                  label="Adresse email"
                  placeholder="name@university.edu.cm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  leftIcon={<Mail className="h-5 w-5" style={{ color: 'var(--cw-text-muted)' }} />}
                  required
                  autoComplete="email"
                />

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    label="Mot de passe"
                    placeholder="********"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="transition-colors"
                        style={{ color: 'var(--cw-text-muted)', cursor: 'pointer' }}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      style={{
                        borderColor: 'var(--cw-border-default)',
                        accentColor: 'var(--cw-orange)',
                      }}
                    />
                    <span style={{ color: 'var(--cw-text-secondary)' }}>Se souvenir de moi</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="font-medium hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--cw-orange)' }}
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-base py-3"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Se connecter
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm" style={{ color: 'var(--cw-text-secondary)' }}>
                  Pas encore de compte ?{' '}
                  <Link
                    to="/register"
                    className="font-semibold hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--cw-orange)' }}
                  >
                    Créer un compte
                  </Link>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--cw-border-default)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3 text-center" style={{ color: 'var(--cw-text-muted)' }}>
                  Comptes de démonstration
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => setFormData({ email: account.email, password: account.password })}
                      className="flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors hover:border-orange-300 hover:bg-orange-50"
                      style={{ borderColor: 'var(--cw-border-default)' }}
                    >
                      <span className="text-xs font-semibold" style={{ color: 'var(--cw-navy)' }}>{account.role}</span>
                      <span className="text-[11px]" style={{ color: 'var(--cw-text-muted)' }}>{account.email}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-center mt-2" style={{ color: 'var(--cw-text-muted)' }}>
                  Cliquez pour pré-remplir le formulaire (les comptes doivent avoir été créés via <code>scripts/seed-test-data.sh</code>).
                </p>
              </div>
            </motion.div>

            {/* Small mascot mini-facts */}
            <div className="flex items-center justify-center gap-4 mt-6 lg:mt-8">
              {['Sécurisé', 'Intuitif', 'Rapide'].map((label) => (
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
          <span>Fait avec ❤️ pour les campus camerounais</span>
        </motion.footer>
      </div>
    </div>
  )
}

