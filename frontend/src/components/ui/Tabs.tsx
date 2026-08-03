import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
  badge?: number
  disabled?: boolean
}

export interface TabsProps {
  items: TabItem[]
  activeId: string
  onChange: (id: string) => void
  className?: string
  variant?: 'underline' | 'pills' | 'cards'
}

export function Tabs({ items, activeId, onChange, className, variant = 'underline' }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className={cn('inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl', className)}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && onChange(item.id)}
            disabled={item.disabled}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2',
              activeId === item.id
                ? 'bg-white text-navy-800 shadow-sm'
                : 'text-gray-500 hover:text-navy-800',
              item.disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {item.icon}
            {item.label}
            {typeof item.badge === 'number' && (
              <span className="px-1.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'cards') {
    return (
      <div className={cn('grid gap-3', className)} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && onChange(item.id)}
            disabled={item.disabled}
            className={cn(
              'px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all duration-200 flex items-center gap-2 justify-center',
              activeId === item.id
                ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
              item.disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    )
  }

  // underline (default)
  return (
    <div className={cn('tab-list', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => !item.disabled && onChange(item.id)}
          disabled={item.disabled}
          className={cn(
            'tab-trigger',
            activeId === item.id && 'tab-trigger-active',
            item.disabled && 'opacity-40 cursor-not-allowed'
          )}
        >
          {item.icon && <span className="inline-flex mr-1.5 align-middle">{item.icon}</span>}
          {item.label}
          {typeof item.badge === 'number' && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
