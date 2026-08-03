import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  BookOpen,
  DollarSign,
  Users,
  Megaphone,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  History,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn, getInitials } from '@/lib/utils'

export function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showHistoryMenu, setShowHistoryMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

const navItems = [
    { icon: Home, label: 'Accueil', path: '/dashboard', roles: ['all'] },
    {
      icon: BookOpen,
      label: 'Académique',
      path: '/academic',
      roles: ['Super Admin', 'Admin', 'Staff', 'Student'],
    },
    {
      icon: DollarSign,
      label: 'Finance',
      path: '/finance',
      roles: ['Super Admin', 'Admin', 'Staff'],
    },
    {
      icon: Users,
      label: 'RH',
      path: '/hr',
      roles: ['Super Admin', 'Admin', 'Staff'],
    },
    {
      icon: Megaphone,
      label: 'Marketing',
      path: '/marketing',
      roles: ['Super Admin', 'Admin', 'Staff'],
    },
  ]

  const visibleItems = navItems.filter(
    (item) => item.roles.includes('all') || item.roles.includes(user?.role || '')
  )

  const isActivePath = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-marine-200 shadow-lg z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-marine-300">
              {visibleItems.map((item) => {
                const active = isActivePath(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200',
                      'text-sm font-medium whitespace-nowrap',
                      active
                        ? 'bg-marine-50 text-marine-900 shadow-sm'
                        : 'text-marine-600 hover:text-marine-900 hover:bg-marine-50'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5',
                        active ? 'text-marine-600' : 'text-marine-500'
                      )}
                    />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistoryMenu(!showHistoryMenu)}
                className={cn(
                  'p-2.5 rounded-xl transition-all duration-200',
                  'text-marine-600 hover:text-marine-900 hover:bg-marine-50'
                )}
              >
                <History className="h-5 w-5" />
              </button>

              <button
                className={cn(
                  'relative p-2.5 rounded-xl transition-all duration-200',
                  'text-marine-600 hover:text-marine-900 hover:bg-marine-50'
                )}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-salmon-500 rounded-full" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200',
                    'text-marine-700 hover:bg-marine-50'
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-seafoam-500 to-marine-500 flex items-center justify-center text-white font-bell font-bold text-sm shadow-sm">
                    {getInitials(user?.full_name || 'User')}
                  </div>
                  <span className="hidden lg:inline text-sm font-medium">
                    {user?.full_name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-marine-400" />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-marine-200 overflow-hidden"
                    >
                      <div className="p-4 border-b border-marine-100">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-seafoam-500 to-marine-500 flex items-center justify-center text-white font-bell font-bold">
                            {getInitials(user?.full_name || 'User')}
                          </div>
                          <div>
                            <p className="font-semibold text-marine-900">
                              {user?.full_name}
                            </p>
                            <p className="text-sm text-marine-500">{user?.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-marine-100 text-marine-700">
                              {user?.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-marine-50 transition-colors text-marine-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="h-4 w-4 text-marine-600" />
                          <span className="text-sm">Mon profil</span>
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-marine-50 transition-colors text-marine-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="h-4 w-4 text-marine-600" />
                          <span className="text-sm">Paramètres</span>
                        </Link>
                        <hr className="my-2 border-marine-100" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-salmon-50 transition-colors text-salmon-600"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="text-sm font-medium">Déconnexion</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 right-0 w-64 bg-white shadow-2xl border-l border-marine-200 z-50 md:hidden"
          >
            <div className="h-full flex flex-col pt-12">
              <div className="px-4 pb-4 border-b border-marine-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-seafoam-500 to-marine-500 flex items-center justify-center text-white font-bell font-bold">
                    {getInitials(user?.full_name || 'User')}
                  </div>
                  <div>
                    <p className="font-semibold text-marine-900">{user?.full_name}</p>
                    <p className="text-sm text-marine-500">{user?.role}</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 py-2">
                {visibleItems.map((item) => {
                  const active = isActivePath(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 mx-4 px-3 py-2.5 rounded-lg transition-all text-sm font-medium',
                        active
                          ? 'bg-marine-50 text-marine-900'
                          : 'text-marine-600 hover:text-marine-900 hover:bg-marine-50'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="p-4 border-t border-marine-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-salmon-600 hover:bg-salmon-50 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Déconnexion</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-marine-900/20 backdrop-blur-sm z-40 md:hidden"
        />
      )}
    </>
  )
}
