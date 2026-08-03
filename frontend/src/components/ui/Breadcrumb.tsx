import { ChevronRight, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  path?: string
  icon?: React.ElementType
}

const routeLabels: Record<string, string> = {
  '/dashboard': 'Accueil',
  '/academic': 'Académique',
  '/finance': 'Finance',
  '/hr': 'Ressources Humaines',
  '/profile': 'Profil',
  '/settings': 'Paramètres',
}

export function Breadcrumb() {
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)

  const items: BreadcrumbItem[] = [{ label: 'Accueil', path: '/dashboard', icon: Home }]

  let accumulatedPath = ''
  pathSegments.forEach((segment) => {
    accumulatedPath += `/${segment}`
    const label = routeLabels[accumulatedPath] || routeLabels[`/${segment}`] || segment.charAt(0).toUpperCase() + segment.slice(1)
    items.push({ label, path: accumulatedPath })
  })

  return (
    <nav className="flex items-center gap-2 text-sm text-marine-600">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="h-4 w-4 text-marine-400" />}
          {item.path && index < items.length - 1 ? (
            <Link
              to={item.path}
              className="hover:text-marine-900 transition-colors flex items-center gap-1"
            >
              {item.icon && index === 0 && <item.icon className="h-3.5 w-3.5" />}
              {item.label}
            </Link>
          ) : (
            <span className="text-marine-900 font-medium flex items-center gap-1">
              {item.icon && index === 0 && <item.icon className="h-3.5 w-3.5" />}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

export function BreadcrumbSimple({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-marine-600">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="h-4 w-4 text-marine-400" />}
          {item.path && index < items.length - 1 ? (
            <Link
              to={item.path}
              className={cn(
                'hover:text-marine-900 transition-colors',
                'text-marine-500 hover:text-marine-700'
              )}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-marine-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
