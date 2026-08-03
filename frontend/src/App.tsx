import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from './store/authStore'
import { ToastContainer } from './components/ui/Toast'
import { SplashScreen } from './components/ui/SplashScreen'
import { Layout } from './components/layout/Layout'
import { Mascot } from './components/ui/Mascot'

import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { OnboardingFlow } from './pages/onboarding/OnboardingFlow'
import { StudentDashboard } from './pages/dashboard/StudentDashboard'
import { AdminDashboard } from './pages/dashboard/AdminDashboard'
import { StaffDashboard } from './pages/dashboard/StaffDashboard'
import { MarketingPage } from './pages/marketing/MarketingPage'
import { AcademicPage } from './pages/academic/AcademicPage'
import { FinancePage } from './pages/finance/FinancePage'
import { HrPage } from './pages/hr/HrPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { ChatPage } from './pages/messaging/ChatPage'
import { CalendarPage } from './pages/calendar/CalendarPage'
import { NotificationsPage } from './pages/notifications/NotificationsPage'
import { DiagnosticsPage } from './pages/diagnostics/DiagnosticsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const [showSplash, setShowSplash] = useState(false)
  const [isAppReady, setIsAppReady] = useState(false)
  const { loadUser } = useAuthStore()

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('cw-visited')
    if (!hasVisited) {
      setShowSplash(true)
    } else {
      // Restore session from stored token if available
      loadUser().finally(() => setIsAppReady(true))
    }
  }, [])

  const handleSplashComplete = () => {
    sessionStorage.setItem('cw-visited', 'true')
    setShowSplash(false)
    // Restore session after splash
    loadUser().finally(() => setTimeout(() => setIsAppReady(true), 300))
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastContainer />
        <AnimatedRoutes isReady={isAppReady} />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function AnimatedRoutes({ isReady }: { isReady: boolean }) {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes key={location.pathname} location={location}>
        <Route
          path="/login"
          element={isReady ? <Login /> : <div />}
        />

        <Route
          path="/register"
          element={isReady ? <Register /> : <div />}
        />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingFlow />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />

        <Route
          path="/academic/*"
          element={
            <ProtectedRoute>
              <Layout>
                <AcademicPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/finance/*"
          element={
            <ProtectedRoute roles={['Super Admin', 'Admin', 'Staff', 'Student']}>
              <Layout>
                <FinancePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hr/*"
          element={
            <ProtectedRoute roles={['Super Admin', 'Admin', 'Staff']}>
              <Layout>
                <HrPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/marketing/*"
          element={
            <ProtectedRoute roles={['Super Admin', 'Admin', 'Staff']}>
              <Layout>
                <MarketingPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/messaging"
          element={
            <ProtectedRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <CalendarPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Layout>
                <NotificationsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/diagnostics"
          element={
            <ProtectedRoute roles={['Super Admin', 'Admin']}>
              <Layout>
                <DiagnosticsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <RootRedirect isReady={isReady} />
          }
        />

        <Route
          path="*"
          element={
            <Layout>
              <NotFoundPage />
            </Layout>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

function RootRedirect({ isReady }: { isReady: boolean }) {
  const { isAuthenticated } = useAuthStore()
  if (!isReady) return null
  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  )
}

function DashboardRouter() {
  const { user } = useAuthStore()

  const dashboards: Record<string, React.ReactNode> = {
    Student: <StudentDashboard />,
    Staff: <StaffDashboard />,
    Admin: <AdminDashboard />,
    'Super Admin': <AdminDashboard />,
    Finance: <AdminDashboard />,
    Marketing: <AdminDashboard />,
    HR: <AdminDashboard />,
  }

  const Dashboard = dashboards[user?.role as string] || <StudentDashboard />

  return <Layout>{Dashboard}</Layout>
}

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: string[]
}) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-danger-50 border border-danger-100 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-navy-800 mb-2">Accès refusé</h2>
          <p className="text-gray-500 max-w-sm">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </Layout>
    )
  }

  return <>{children}</>
}

export default App

function NotFoundPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 py-16"
    >
      {/* Fox mascot */}
      <Mascot variant="lost" size="xl" className="mb-6" />

      {/* 404 badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-orange-50 border border-orange-100">
        <span className="text-xs font-semibold text-orange-600 tracking-widest uppercase">Erreur 404</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-navy-800 mb-3">
        Page introuvable
      </h1>
      <p className="text-gray-500 max-w-sm mb-8 text-sm leading-relaxed">
        La page que vous recherchez a peut-être été déplacée, supprimée ou est temporairement indisponible.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          to="/dashboard"
          className="btn btn-primary px-5 py-2.5 text-sm"
        >
          Retour au tableau de bord
        </Link>
        <Link
          to="/settings"
          className="btn btn-outline px-5 py-2.5 text-sm"
        >
          Contacter le support
        </Link>
      </div>
    </motion.div>
  )
}
