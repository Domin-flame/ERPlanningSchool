import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Rocket } from 'lucide-react'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100)
      setShowText(true)
    }, 800)

    const completeTimer = setTimeout(() => {
      onComplete()
    }, 2800)

    return () => {
      clearTimeout(timer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-800"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0, rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="p-6 rounded-2xl bg-orange-500/20 text-orange-400 drop-shadow-2xl"
          >
            <Rocket className="w-16 h-16" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-2xl font-bold text-white tracking-tight"
          >
            Campus<span className="text-orange-500">Workflow</span>
          </motion.h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: progress === 100 ? 240 : 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-1 bg-white/10 rounded-full mt-8 overflow-hidden"
          >
            <motion.div
              className="h-full bg-orange-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {showText && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 text-white/60 text-lg"
            >
              Bienvenue sur CampusWorkflow
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

