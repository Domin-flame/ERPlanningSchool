import { HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  variant?: 'default' | 'academic' | 'finance' | 'hr' | 'kpi'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = true, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'border-gray-200',
      academic: 'border-orange-100 hover:border-orange-200',
      finance: 'border-success-100 hover:border-success-200',
      hr: 'border-info-100 hover:border-info-200',
      kpi: 'border-gray-200 bg-white',
    }

    const { onDrag, ...restProps } = props as any

    return (
      <motion.div
        ref={ref}
        className={cn(
          'card rounded-xl bg-white border shadow-card transition-all duration-200',
          variants[variant],
          hoverable && 'cursor-pointer hover:shadow-card-hover',
          className
        )}
        whileHover={hoverable ? { y: -3 } : {}}
        transition={{ duration: 0.2 }}
        {...restProps}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-navy-800', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

