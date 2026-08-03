import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeStatus = 
  | 'active' | 'completed' | 'in-progress' | 'pending' | 'cancelled' | 'overdue'
  | 'draft' | 'approved' | 'rejected' | 'paid' | 'unpaid' | 'partially-paid'
  | 'high-priority' | 'medium-priority' | 'low-priority' | 'online' | 'offline' | 'neutral'

const badgeStyles: Record<BadgeStatus, string> = {
  'active': 'status-active',
  'completed': 'status-completed',
  'in-progress': 'status-in-progress',
  'pending': 'status-pending',
  'cancelled': 'status-cancelled',
  'overdue': 'status-overdue',
  'draft': 'status-draft',
  'approved': 'status-approved',
  'rejected': 'status-rejected',
  'paid': 'status-paid',
  'unpaid': 'status-unpaid',
  'partially-paid': 'status-partially-paid',
  'high-priority': 'bg-danger-50 text-danger-700 border-danger-200',
  'medium-priority': 'bg-warning-50 text-warning-700 border-warning-200',
  'low-priority': 'bg-gray-100 text-gray-600 border-gray-200',
  'online': 'status-active',
  'offline': 'status-neutral',
  'neutral': 'status-neutral',
}

export interface BadgeProps {
  status?: BadgeStatus
  label: string
  icon?: ReactNode
  size?: 'sm' | 'md'
  className?: string
  dot?: boolean
}

export function Badge({ status = 'neutral', label, icon, size = 'sm', className, dot }: BadgeProps) {
  const dotColors: Record<BadgeStatus, string> = {
    'active': 'bg-success-500',
    'completed': 'bg-success-500',
    'in-progress': 'bg-info-500',
    'pending': 'bg-warning-500',
    'cancelled': 'bg-danger-500',
    'overdue': 'bg-danger-500',
    'draft': 'bg-gray-400',
    'approved': 'bg-success-500',
    'rejected': 'bg-danger-500',
    'paid': 'bg-success-500',
    'unpaid': 'bg-danger-500',
    'partially-paid': 'bg-warning-500',
    'high-priority': 'bg-danger-500',
    'medium-priority': 'bg-warning-500',
    'low-priority': 'bg-gray-400',
    'online': 'bg-success-500',
    'offline': 'bg-gray-400',
    'neutral': 'bg-gray-400',
  }

  return (
    <span
      className={cn(
        'badge',
        badgeStyles[status],
        size === 'sm' ? 'badge-sm' : 'badge-md',
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[status])} />}
      {icon}
      {label}
    </span>
  )
}

// Closable tag
export interface TagProps {
  label: string
  onRemove?: () => void
  className?: string
  disabled?: boolean
}

export function Tag({ label, onRemove, className, disabled }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full',
        'bg-gray-100 text-navy-800 border border-gray-200',
        'transition-all duration-200',
        !disabled && onRemove && 'hover:bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {label}
      {onRemove && !disabled && (
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-danger-500 transition-colors focus:outline-none"
          aria-label={`Remove ${label}`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  )
}
