import { cn } from '@/lib/utils'

export type StatusType = 
  | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'pending'
  | 'active' | 'completed' | 'in-progress' | 'cancelled' | 'overdue'
  | 'draft' | 'approved' | 'rejected' | 'paid' | 'unpaid' | 'partially-paid'

const statusStyles: Record<StatusType, string> = {
  success: 'status-success',
  warning: 'status-warning',
  error: 'status-error',
  info: 'status-info',
  neutral: 'status-neutral',
  pending: 'status-pending',
  active: 'status-active',
  completed: 'status-completed',
  'in-progress': 'status-in-progress',
  cancelled: 'status-cancelled',
  overdue: 'status-overdue',
  draft: 'status-draft',
  approved: 'status-approved',
  rejected: 'status-rejected',
  paid: 'status-paid',
  unpaid: 'status-unpaid',
  'partially-paid': 'status-warning',
}

export interface StatusBadgeProps {
  status: StatusType
  label: string
  icon?: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
  dot?: boolean
}

export function StatusBadge({
  status,
  label,
  icon,
  size = 'sm',
  className,
  dot,
}: StatusBadgeProps) {
  const dotColors: Record<StatusType, string> = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-danger-500',
    info: 'bg-info-500',
    neutral: 'bg-gray-400',
    pending: 'bg-warning-500',
    active: 'bg-success-500',
    completed: 'bg-success-500',
    'in-progress': 'bg-info-500',
    cancelled: 'bg-danger-500',
    overdue: 'bg-danger-500',
    draft: 'bg-gray-400',
    approved: 'bg-success-500',
    rejected: 'bg-danger-500',
    paid: 'bg-success-500',
    unpaid: 'bg-danger-500',
    'partially-paid': 'bg-warning-500',
  }

  return (
    <span
      className={cn(
        'badge',
        statusStyles[status],
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

export function StatusDot({ status }: { status: StatusType }) {
  const dotColors: Record<StatusType, string> = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-danger-500',
    info: 'bg-info-500',
    neutral: 'bg-gray-400',
    pending: 'bg-warning-500',
    active: 'bg-success-500',
    completed: 'bg-success-500',
    'in-progress': 'bg-info-500',
    cancelled: 'bg-danger-500',
    overdue: 'bg-danger-500',
    draft: 'bg-gray-400',
    approved: 'bg-success-500',
    rejected: 'bg-danger-500',
    paid: 'bg-success-500',
    unpaid: 'bg-danger-500',
    'partially-paid': 'bg-warning-500',
  }

  return (
    <span
      className={cn('inline-block w-2 h-2 rounded-full', dotColors[status])}
    />
  )
}
