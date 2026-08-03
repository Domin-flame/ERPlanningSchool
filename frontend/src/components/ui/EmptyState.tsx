import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Mascot, type MascotVariant } from '@/components/ui/Mascot'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
  variant?: MascotVariant
  showMascot?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  variant = 'empty',
  showMascot = true,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        'bg-white rounded-xl border border-gray-200 shadow-card',
        className
      )}
    >
      {showMascot ? (
        <Mascot variant={variant} size="lg" />
      ) : icon ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-4 text-gray-300"
        >
          {icon}
        </motion.div>
      ) : null}

      <h3 className="text-lg font-semibold text-navy-800 mb-2 mt-4">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAction}
          className="px-5 py-2.5 bg-orange-500 text-white rounded-lg font-medium
                     hover:bg-orange-600 transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                     flex items-center gap-2 shadow-sm text-sm"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  )
}

