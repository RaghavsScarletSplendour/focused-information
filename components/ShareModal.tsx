'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ShareData, shareToTwitter, buildTweetText } from '@/lib/share'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  shareData: ShareData | null
}

export default function ShareModal({ isOpen, onClose, shareData }: ShareModalProps) {
  if (!shareData) return null

  const handleShare = () => {
    shareToTwitter(shareData)
    onClose()
  }

  const previewText = buildTweetText(shareData)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-ink/20 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-paper border-2 border-ink rounded-lg p-6 w-full max-w-sm">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Share your win?</h2>
                <button
                  onClick={onClose}
                  className="text-faded hover:text-ink transition-colors text-xl leading-none"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              {/* Preview */}
              <div className="mb-6 p-3 border border-faded rounded-lg bg-paper">
                <p className="text-sm text-faded whitespace-pre-line leading-relaxed font-mono">
                  {previewText}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm text-faded hover:text-ink transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleShare}
                  className="btn-process flex-1"
                >
                  Share on X
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
