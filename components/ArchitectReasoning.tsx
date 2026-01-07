'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ArchitectReasoningProps {
  reasoning: string | null
  isAnalyzing: boolean
}

export default function ArchitectReasoning({
  reasoning,
  isAnalyzing
}: ArchitectReasoningProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (reasoning) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
      }, 4000) // Hide after 4 seconds
      return () => clearTimeout(timer)
    }
  }, [reasoning])

  if (!isAnalyzing && !visible) return null

  return (
    <AnimatePresence mode="wait">
      {isAnalyzing ? (
        <motion.div
          key="analyzing"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="text-center py-2"
        >
          <p className="text-sm text-faded animate-pulse">
            Optimizing learning order...
          </p>
        </motion.div>
      ) : visible && reasoning ? (
        <motion.div
          key="reasoning"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-center py-2"
        >
          <p className="text-xs text-faded italic">
            {reasoning}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
