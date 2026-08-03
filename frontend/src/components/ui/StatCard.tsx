import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export type StatColor = 'orange' | 'navy' | 'success' | 'warning' | 'info'

const colorVariants: Record<StatColor, { bg: string; text: string; border: string }> = {
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-100',
  },
  navy: {
    bg: 'bg-navy-50',
    text: 'text-navy-700',
    border: 'border-navy-100',
  },
  success: {
    bg: 'bg-success-50',
    text: 'text-success-600',
    border: 'border-success-100',
  },
  warning: {
    bg: 'bg-warning-50',
    text: 'text-warning-600',
    border: 'border-warning-100',
  },
  info: {
    bg: 'bg-info-50',
    text: 'text-info-600',
    border: 'border-info-100',
  },
}

export interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  color?: StatColor
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  subtitle?: string
  delay?: number
  onClick?: () => void
}

export function StatCard({
  icon: Icon,
  label,
  value,
  color = 'orange',
  trend,
  trendValue,
  subtitle,
  delay = 0,
  onClick,
}: StatCardProps) {
  const colors = colorVariants[color]
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-gray-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div
        className={cn(
          'card rounded-xl bg-white border border-gray-200 shadow-card p-4 sm:p-5 h-full',
          'transition-all duration-200',
          onClick && 'cursor-pointer hover:shadow-card-hover hover:border-gray-300'
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={cn('p-2.5 sm:p-3 rounded-xl border', colors.bg, colors.text, colors.border)}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          {trend && trendValue && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
              <TrendIcon className={cn('h-3.5 w-3.5', trendColor)} />
              <span className={cn('text-xs font-semibold', trendColor)}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="kpi-value mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function StatGrid({
  children,
  cols = 'auto',
}: {
  children: ReactNode
  cols?: 'auto' | 2 | 3 | 4
}) {
  const colClasses = {
    auto: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }

  return (
    <motion.div
      className={cn('grid gap-3 sm:gap-4 mb-6 sm:mb-8', colClasses[cols])}
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.08, delayChildren: 0.1 },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
