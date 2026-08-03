import { cn } from '@/lib/utils'

export interface ProgressBarProps {
  value: number // 0-100
  color?: string
  label?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProgressBar({ value, color = 'bg-orange-500', label, showLabel = true, size = 'md', className }: ProgressBarProps) {
  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-navy-800">{label}</span>
          {showLabel && (
            <span className="text-sm font-semibold text-gray-500">{value}%</span>
          )}
        </div>
      )}
      <div className={cn('progress-track', heights[size])}>
        <div
          className={cn('progress-fill', color)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}
