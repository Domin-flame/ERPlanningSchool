import { useState, useRef, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 200,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [actualPlacement, setActualPlacement] = useState(placement)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setVisible(true), delay)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  useEffect(() => {
    if (visible && triggerRef.current && tooltipRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()

      if (placement === 'top' || placement === 'bottom') {
        if (rect.left + tooltipRect.width / 2 > window.innerWidth - 16) {
          setActualPlacement(placement === 'top' ? 'left' : 'right')
        }
      }
    }
  }, [visible, placement])

  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-transparent border-b-[6px] border-b-white dark:border-b-gray-800',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-b-transparent border-t-[6px] border-t-white dark:border-t-gray-800',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 border-r-transparent border-l-[6px] border-l-white dark:border-l-gray-800',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 border-l-transparent border-r-[6px] border-r-white dark:border-r-gray-800',
  }

  return (
    <div
      ref={triggerRef}
      className="relative inline-block cursor-pointer"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 px-2.5 py-1.5 text-xs font-medium',
              'bg-marine-900 text-white rounded-md shadow-lg',
              'pointer-events-none whitespace-nowrap',
              placementClasses[actualPlacement]
            )}
          >
            {content}
            <span
              className={cn(
                'absolute w-0 h-0 border-[6px] border-solid',
                arrowClasses[actualPlacement]
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function TooltipTrigger({
  content,
  children,
  placement = 'top',
}: {
  content: string
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <Tooltip placement={placement} content={content}>
      {children}
    </Tooltip>
  )
}
