import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))

// Helper function to show toasts
export const toast = {
  success: (title: string, message?: string, duration = 5000) => {
    useToastStore.getState().addToast({ type: 'success', title, message, duration })
  },
  error: (title: string, message?: string, duration = 5000) => {
    useToastStore.getState().addToast({ type: 'error', title, message, duration })
  },
  warning: (title: string, message?: string, duration = 5000) => {
    useToastStore.getState().addToast({ type: 'warning', title, message, duration })
  },
  info: (title: string, message?: string, duration = 5000) => {
    useToastStore.getState().addToast({ type: 'info', title, message, duration })
  },
}

function ToastItem({ toast: t }: { toast: Toast }) {
  const { removeToast } = useToastStore()

  useEffect(() => {
    const duration = t.duration || 5000
    const timer = setTimeout(() => {
      removeToast(t.id)
    }, duration)

    return () => clearTimeout(timer)
  }, [t.id, t.duration, removeToast])

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  }

  const styles = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  }

  const textStyles = {
    success: 'text-green-900',
    error: 'text-red-900',
    warning: 'text-amber-900',
    info: 'text-blue-900',
  }

  const subtextStyles = {
    success: 'text-green-700',
    error: 'text-red-700',
    warning: 'text-amber-700',
    info: 'text-blue-700',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        max-w-md w-full ${styles[t.type]}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[t.type]}</div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${textStyles[t.type]}`}>{t.title}</p>
        {t.message && (
          <p className={`mt-1 text-sm ${subtextStyles[t.type]}`}>{t.message}</p>
        )}
      </div>
      
      <button
        onClick={() => removeToast(t.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  )
}
