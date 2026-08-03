import { cn } from '@/lib/utils'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function Toggle({ checked, onChange, label, description, disabled, size = 'md', className }: ToggleProps) {
  const sizes = {
    sm: { track: 'w-8 h-4.5', knob: 'w-3.5 h-3.5', translate: 'translate-x-3.5' },
    md: { track: 'w-10 h-5.5', knob: 'w-4.5 h-4.5', translate: 'translate-x-4.5' },
  }

  return (
    <label className={cn('flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200',
          sizes[size].track,
          checked ? 'bg-orange-500' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'inline-block transform rounded-full bg-white shadow transition-transform duration-200',
            sizes[size].knob,
            checked ? sizes[size].translate : 'translate-x-0.5'
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-navy-800">{label}</span>}
          {description && <span className="text-xs text-gray-500">{description}</span>}
        </div>
      )}
    </label>
  )
}
