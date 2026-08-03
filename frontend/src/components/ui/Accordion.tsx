import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AccordionItem {
  id: string
  title: string
  content: React.ReactNode
  badge?: string
  badgeColor?: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  disabled?: boolean
}

export interface AccordionProps {
  items: AccordionItem[]
  type?: 'single' | 'multiple'
  defaultOpen?: string[]
  className?: string
  bordered?: boolean
}

export function Accordion({ items, type = 'single', defaultOpen = [], className, bordered = true }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen)

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      if (type === 'single') {
        return prev.includes(id) ? [] : [id]
      }
      return prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    })
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => {
        const isOpen = openItems.includes(item.id)
        return (
          <div
            key={item.id}
            className={cn(
              'rounded-xl transition-all duration-200',
              bordered ? 'border border-gray-200 bg-white overflow-hidden' : '',
              item.disabled && 'opacity-50 pointer-events-none'
            )}
          >
            <button
              onClick={() => toggle(item.id)}
              className={cn(
                'w-full flex items-center justify-between gap-4 px-5 py-4 text-left',
                'hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                isOpen && 'bg-orange-50/50'
              )}
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <div>
                  <span className="font-medium text-navy-800 text-sm">{item.title}</span>
                  {item.badge && (
                    <span className={cn('ml-2 px-2 py-0.5 text-xs font-semibold rounded-full', item.badgeColor || 'bg-orange-100 text-orange-700')}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown
                className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-4 pt-1 text-sm text-gray-600 leading-relaxed animate-slide-down">
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
