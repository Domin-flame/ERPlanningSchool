import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type MascotVariant = 
  | 'default'       // Default friendly fox
  | 'teaching'      // Fox with chalkboard
  | 'studying'      // Fox with laptop
  | 'admin'         // Fox with documents
  | 'graduated'     // Fox with graduation cap
  | 'support'       // Fox with headset
  | 'searching'     // Fox with magnifying glass
  | 'finance'       // Fox with calculator
  | 'download'      // Fox with download folder
  | 'announce'      // Fox with megaphone
  | 'calendar'      // Fox with calendar
  | 'message'       // Fox with envelope
  | 'security'      // Fox with shield
  | 'access'        // Fox with key
  | 'badge'         // Fox with ID card
  | 'lost'          // Sad fox for 404
  | 'empty'         // Calm fox for empty states
  | 'celebrating'   // Celebrating fox for success
  | 'waving'        // Waving fox for login

interface MascotProps {
  variant?: MascotVariant
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animate?: boolean
}

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40',
}

export function Mascot({ variant = 'default', size = 'md', className, animate = true }: MascotProps) {
  const Wrapper = animate ? motion.div : 'div'
  const motionProps = animate ? {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.5, ease: 'easeOut' }
  } : {}

  return (
    <Wrapper
      className={cn('relative inline-flex items-center justify-center', sizeMap[size], className)}
      {...motionProps}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
        {/* Shadow */}
        <ellipse cx="100" cy="170" rx="50" ry="10" fill="#000" opacity="0.06" />
        
        {/* Tail */}
        <path d="M155 130 C175 120 185 95 175 75 C168 62 155 60 148 68 C145 72 145 80 150 85 C158 92 165 105 160 115 C155 125 150 130 150 130 Z" fill="#FF6B00" />
        
        {/* Ears */}
        <path d="M50 65 L75 28 L85 65 Z" fill="#FF6B00" />
        <path d="M55 62 L75 35 L82 62 Z" fill="#0F2742" />
        <path d="M150 65 L125 28 L115 65 Z" fill="#FF6B00" />
        <path d="M145 62 L125 35 L118 62 Z" fill="#0F2742" />
        
        {/* Body */}
        <path d="M100 45 C72 45 55 70 55 98 C55 135 75 155 100 155 C125 155 145 135 145 98 C145 70 128 45 100 45 Z" fill="#FF6B00" />
        
        {/* Belly/face cream area */}
        <path d="M100 68 C90 68 78 78 78 90 C78 105 86 112 100 112 C114 112 122 105 122 90 C122 78 110 68 100 68 Z" fill="#FFF3E8" />
        
        {/* Eyes */}
        <circle cx="88" cy="85" r="4.5" fill="#0F2742" />
        <circle cx="112" cy="85" r="4.5" fill="#0F2742" />
        
        {/* Eye shine */}
        <circle cx="89.5" cy="83.5" r="1.5" fill="#fff" opacity="0.8" />
        <circle cx="113.5" cy="83.5" r="1.5" fill="#fff" opacity="0.8" />
        
        {/* Nose */}
        <ellipse cx="100" cy="100" rx="5" ry="3.5" fill="#0F2742" />
        
        {/* Mouth */}
        <path d="M94 108 Q100 115 106 108" stroke="#0F2742" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />

{/* Variant-specific elements */}
        {variant === 'waving' && (
          <g>
            <path d="M155 55 C165 45 175 50 172 60 C170 67 162 70 158 65" stroke="#FF6B00" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M158 65 L155 75" stroke="#FF6B00" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        )}
        
        {variant === 'graduated' && (
          <g>
            <path d="M100 30 L100 48" stroke="#0F2742" strokeWidth="2" />
            <path d="M82 36 L100 28 L118 36 L100 44 Z" fill="#0F2742" />
            <rect x="92" y="24" width="16" height="4" rx="2" fill="#FF6B00" />
          </g>
        )}

        {variant === 'searching' && (
          <g>
            <circle cx="155" cy="55" r="12" fill="none" stroke="#64748B" strokeWidth="2.5" />
            <line x1="163" y1="63" x2="172" y2="72" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {variant === 'finance' && (
          <g>
            <rect x="148" y="55" width="28" height="20" rx="3" fill="#FFF3E8" stroke="#FF6B00" strokeWidth="1.5" />
            <text x="158" y="69" fontSize="10" fontWeight="bold" fill="#FF6B00" fontFamily="monospace">+$</text>
          </g>
        )}

        {variant === 'message' && (
          <g>
            <rect x="148" y="50" width="28" height="20" rx="4" fill="#FFF3E8" stroke="#3B82F6" strokeWidth="1.5" />
            <path d="M148 70 L158 60 L168 70" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
          </g>
        )}

        {variant === 'calendar' && (
          <g>
            <rect x="148" y="48" width="24" height="22" rx="3" fill="#FFF3E8" stroke="#3B82F6" strokeWidth="1.5" />
            <rect x="148" y="52" width="24" height="6" rx="1" fill="#3B82F6" />
            <text x="153" y="65" fontSize="8" fontWeight="bold" fill="#0F2742">17</text>
          </g>
        )}

        {variant === 'announce' && (
          <g>
            <path d="M148 55 L168 48 L168 72 L148 65 Z" fill="#FFF3E8" stroke="#FF6B00" strokeWidth="1.5" />
            <path d="M168 55 L178 50 L178 70 L168 65" fill="none" stroke="#FF6B00" strokeWidth="1.5" />
            <path d="M148 55 L148 65" stroke="#FF6B00" strokeWidth="2" />
          </g>
        )}

        {variant === 'celebrating' && (
          <g>
            <text x="130" y="40" fontSize="18">⭐</text>
            <text x="155" y="55" fontSize="14">🎉</text>
            <text x="40" y="45" fontSize="14">✨</text>
          </g>
        )}

        {variant === 'lost' && (
          <g>
            <circle cx="82" cy="82" r="3" fill="#64748B" />
            <circle cx="118" cy="82" r="3" fill="#64748B" />
            <path d="M92 118 Q100 112 108 118" stroke="#64748B" strokeWidth="1.5" fill="none" />
            <path d="M55 35 L65 25 L75 35" stroke="#64748B" strokeWidth="1.5" fill="none" opacity="0.4" />
            <path d="M145 25 L155 15 L165 25" stroke="#64748B" strokeWidth="1.5" fill="none" opacity="0.4" />
          </g>
        )}

        {variant === 'security' && (
          <g>
            <path d="M148 50 L160 42 L172 50 L172 68 L160 76 L148 68 Z" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.5" />
            <text x="155" y="63" fontSize="10" fill="#3B82F6">✓</text>
          </g>
        )}

        {variant === 'download' && (
          <g>
            <rect x="148" y="48" width="24" height="20" rx="2" fill="#FFF3E8" stroke="#22C55E" strokeWidth="1.5" />
            <path d="M160 52 L160 62" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
            <path d="M155 58 L160 64 L165 58" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {variant === 'studying' && (
          <g>
            <rect x="148" y="48" width="24" height="16" rx="2" fill="#FFF3E8" stroke="#64748B" strokeWidth="1.5" />
            <rect x="150" y="50" width="20" height="12" rx="1" fill="#EFF6FF" />
            <text x="155" y="59" fontSize="7" fill="#0F2742">Code</text>
          </g>
        )}
      </svg>
    </Wrapper>
  )
}

// Helper component for empty states with mascot
export function MascotEmptyState({
  variant = 'empty',
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  variant?: MascotVariant
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}) {
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
      <Mascot variant={variant} size="lg" />
      <h3 className="text-lg font-semibold text-navy-800 mt-6 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-orange-500 text-white rounded-lg font-medium
                     hover:bg-orange-600 transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                     shadow-sm text-sm"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  )
}
