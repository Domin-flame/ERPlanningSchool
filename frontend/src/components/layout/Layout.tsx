import { ReactNode, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  ClipboardList,
  CreditCard,
  DollarSign,
  GraduationCap,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  MoreVertical,
  Settings,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Mascot } from '@/components/ui/Mascot'
import { SearchBar, type SearchResult } from '@/components/ui/SearchBar'
import { useAuthStore } from '@/store/authStore'
import { cn, getInitials } from '@/lib/utils'

interface LayoutProps {
  children: ReactNode
}

interface NavItem {
  icon: React.ElementType
  label: string
  path: string
  roles: string[]
  section?: string
}

const searchIndex: SearchResult[] = [
  { id: 'dashboard', label: 'Tableau de bord', description: 'Vue d ensemble', path: '/dashboard', icon: <Home className="h-4 w-4" /> },
  { id: 'academic', label: 'Academique', description: 'Cours, notes, examens', path: '/academic', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'finance', label: 'Finance', description: 'Factures, paiements', path: '/finance', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'hr', label: 'RH', description: 'Employes, conges, paie', path: '/hr', icon: <Users className="h-4 w-4" /> },
  { id: 'calendar', label: 'Calendrier', description: 'Planning et evenements', path: '/calendar', icon: <Calendar className="h-4 w-4" /> },
  { id: 'messages', label: 'Messages', description: 'Chat et commentaires', path: '/messages', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'courses', label: 'Cours', description: 'Gestion des cours', path: '/academic/courses', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'students', label: 'Etudiants', description: 'Dossiers etudiants', path: '/students', icon: <GraduationCap className="h-4 w-4" /> },
  { id: 'employees', label: 'Employes', description: 'Gestion RH', path: '/employees', icon: <Users className="h-4 w-4" /> },
  { id: 'reports', label: 'Rapports', description: 'Analytics et exports', path: '/reports', icon: <BarChart3 className="h-4 w-4" /> },
]

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: 'Accueil', path: '/dashboard', roles: ['all'], section: 'Principal' },
  { icon: BookOpen, label: 'Academique', path: '/academic', roles: ['all'], section: 'Modules' },
  { icon: DollarSign, label: 'Finance', path: '/finance', roles: ['Super Admin', 'Admin', 'Staff', 'Student'], section: 'Modules' },
  { icon: Users, label: 'RH', path: '/hr', roles: ['Super Admin', 'Admin', 'Staff'], section: 'Modules' },
  { icon: Calendar, label: 'Calendrier', path: '/calendar', roles: ['all'], section: 'Modules' },
  { icon: MessageSquare, label: 'Messages', path: '/messages', roles: ['all'], section: 'Modules' },
  { icon: GraduationCap, label: 'Etudiants', path: '/students', roles: ['Super Admin', 'Admin', 'Staff'], section: 'Gestion' },
  { icon: UserCog, label: 'Employes', path: '/employees', roles: ['Super Admin', 'Admin', 'Staff'], section: 'Gestion' },
  { icon: BarChart3, label: 'Rapports', path: '/reports', roles: ['Super Admin', 'Admin', 'Staff'], section: 'Gestion' },
  { icon: CreditCard, label: 'Finance MGMT', path: '/finance-management', roles: ['Super Admin', 'Admin', 'Staff'], section: 'Gestion' },
  { icon: ClipboardList, label: 'Showcases', path: '/showcases', roles: ['all'], section: 'Design' },
  { icon: ClipboardList, label: 'Diagnostics API', path: '/diagnostics', roles: ['Super Admin', 'Admin'], section: 'Systeme' },
  { icon: Settings, label: 'Parametres', path: '/settings', roles: ['all'], section: 'Systeme' },
]

const SECTIONS = ['Principal', 'Modules', 'Gestion', 'Design', 'Systeme']

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    setDrawerOpen(false)
    setShowUserMenu(false)
  }, [location.pathname])

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles.includes('all') || item.roles.includes(user?.role || '')
  )

  const isActivePath = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const bottomItems = visibleItems
    .filter((item) => ['/dashboard', '/academic', '/finance', '/hr', '/calendar', '/messages'].includes(item.path))
    .slice(0, 5)

  return (
    <div className="cw-app-shell">
      <div
        className={cn('cw-drawer-backdrop', drawerOpen && 'cw-drawer-backdrop-visible')}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside className={cn('cw-drawer', drawerOpen && 'cw-drawer-open')}>
        <div className="cw-drawer-panel">
          <div className="cw-drawer-brand">
            <Mascot size="sm" className="h-8 w-8" />
            <span>CampusWorkflow</span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="cw-icon-button cw-drawer-close ml-auto"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="cw-drawer-profile">
            <div className="cw-avatar cw-avatar-lg">
              {getInitials(user?.full_name || 'User')}
            </div>
            <div className="min-w-0">
              <p className="cw-drawer-name">{user?.full_name || 'Utilisateur'}</p>
              <p className="cw-drawer-email">{user?.email}</p>
            </div>
          </div>

          <nav className="cw-drawer-nav" aria-label="Menu secondaire">
            {SECTIONS.map((section) => {
              const items = visibleItems.filter((item) => item.section === section)
              if (items.length === 0) return null

              return (
                <div key={section} className="cw-drawer-section">
                  <p className="cw-drawer-section-title">{section}</p>
                  <div className="cw-drawer-section-list">
                    {items.map((item) => {
                      const active = isActivePath(item.path)
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn('cw-drawer-item', active && 'cw-drawer-item-active')}
                          title={item.label}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </nav>

          <div className="cw-drawer-footer">
            <button className="cw-drawer-item">
              <HelpCircle className="h-5 w-5" />
              <span>Centre d'aide</span>
            </button>
            <button onClick={handleLogout} className="cw-drawer-item cw-drawer-item-danger">
              <LogOut className="h-5 w-5" />
              <span>Deconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      <header className="cw-topbar">
        <button
          onClick={() => setDrawerOpen(true)}
          className="cw-icon-button"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="cw-brand-mobile">
          <Mascot size="sm" className="h-8 w-8" />
          <span>CampusWorkflow</span>
        </div>

        <div className="cw-breadcrumb-slot">
          <Breadcrumb />
        </div>

        <div className="cw-topbar-actions">
          <SearchBar
            placeholder="Rechercher..."
            results={searchIndex}
            onResultClick={(result) => result.path && navigate(result.path)}
            className="cw-search"
          />

          <button className="cw-icon-button relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="cw-notification-dot" />
          </button>

          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="cw-icon-button cw-overflow-trigger"
            aria-label="Menu utilisateur"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="cw-user-chip"
            >
              <div className="cw-avatar">{getInitials(user?.full_name || 'User')}</div>
              <div className="cw-user-chip-text">
                <p>{user?.full_name}</p>
                <span>{user?.role}</span>
              </div>
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  className="cw-user-menu"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="cw-user-menu-header">
                    <p>{user?.full_name}</p>
                    <span>{user?.email}</span>
                    <small>{user?.role}</small>
                  </div>
                  <div className="cw-user-menu-list">
                    <Link to="/profile" className="cw-user-menu-item">
                      <UserCog className="h-4 w-4" /> Mon profil
                    </Link>
                    <Link to="/settings" className="cw-user-menu-item">
                      <Settings className="h-4 w-4" /> Parametres
                    </Link>
                    <button onClick={handleLogout} className="cw-user-menu-item cw-user-menu-danger">
                      <LogOut className="h-4 w-4" /> Deconnexion
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <motion.main
        key={location.pathname}
        className="cw-main"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <div className="cw-main-content">{children}</div>
      </motion.main>

      <nav className="cw-bottom-nav" aria-label="Navigation principale">
        {bottomItems.map((item) => {
          const active = isActivePath(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn('cw-bottom-nav-item', active && 'cw-bottom-nav-item-active')}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default Layout
