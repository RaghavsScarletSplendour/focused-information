'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import LensCanvas from './LensCanvas'

export default function HeroAnimation() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isRevealed, setIsRevealed] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [showStaticCard, setShowStaticCard] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoAnimationRef = useRef<number>()

  // Detect touch device and reduced motion preference
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setIsTouchDevice(isTouch)

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    if (mediaQuery.matches) {
      setShowStaticCard(true)
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
      if (e.matches) {
        setShowStaticCard(true)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Auto-animation for touch devices
  useEffect(() => {
    if (!isTouchDevice || prefersReducedMotion) return

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    let angle = 0
    let radius = 100
    let expanding = true

    const autoAnimate = () => {
      // Create a spiral motion toward center
      angle += 0.03
      if (expanding) {
        radius -= 0.5
        if (radius <= 0) {
          setIsRevealed(true)
          return
        }
      }

      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      setMousePos({ x, y })
      autoAnimationRef.current = requestAnimationFrame(autoAnimate)
    }

    // Start auto-animation after a short delay
    const timeout = setTimeout(() => {
      autoAnimationRef.current = requestAnimationFrame(autoAnimate)
    }, 1000)

    return () => {
      clearTimeout(timeout)
      if (autoAnimationRef.current) {
        cancelAnimationFrame(autoAnimationRef.current)
      }
    }
  }, [isTouchDevice, prefersReducedMotion])

  // Mouse tracking for desktop
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isTouchDevice || isRevealed) return

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [isTouchDevice, isRevealed])

  // Handle tap to skip on mobile
  const handleTap = useCallback(() => {
    if (isTouchDevice && !isRevealed) {
      if (autoAnimationRef.current) {
        cancelAnimationFrame(autoAnimationRef.current)
      }
      setIsRevealed(true)
    }
  }, [isTouchDevice, isRevealed])

  // Show static card for reduced motion
  if (prefersReducedMotion || showStaticCard) {
    return (
      <section className="relative min-h-screen flex flex-col items-center justify-center p-8 bg-paper">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h1 className="font-mono text-4xl md:text-5xl font-bold text-ink leading-tight">
            Cut through the noise.
            <br />
            Learn one thing at a time.
          </h1>

          <p className="font-sans text-lg text-faded max-w-xl mx-auto">
            Focus First transforms overwhelming AI news into a single, digestible
            learning card. Paste any link, and we'll distill it to what matters.
          </p>

          {/* Static card preview */}
          <div className="border-2 border-ink bg-paper rounded-lg p-6 shadow-card max-w-md mx-auto font-mono text-left">
            <div className="text-xs text-faded mb-4">complexity: beginner</div>
            <h3 className="text-lg font-semibold mb-2">Learn AI Concepts</h3>
            <p className="text-sm text-faded mb-4">
              Understand how large language models work...
            </p>
            <div className="btn-process text-center">Mark as Learned</div>
          </div>

          <Link
            href="/app"
            className="btn-process inline-block"
          >
            Get Started
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={containerRef}
      className={`relative min-h-screen bg-paper overflow-hidden ${!isTouchDevice ? 'lens-cursor' : ''}`}
      onMouseMove={handleMouseMove}
      onClick={handleTap}
    >
      <LensCanvas
        mouseX={mousePos.x}
        mouseY={mousePos.y}
        isRevealed={isRevealed}
        lensRadius={150}
        onRevealComplete={() => setShowStaticCard(true)}
      />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <AnimatePresence>
          {!isRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center space-y-4 px-4"
            >
              <h1 className="font-mono text-2xl md:text-3xl font-bold text-ink">
                {isTouchDevice ? 'Tap to reveal clarity' : 'Move to reveal clarity'}
              </h1>
              <p className="font-sans text-sm text-faded">
                {isTouchDevice
                  ? 'Watch as chaos becomes understanding'
                  : 'Hover over the noise to find focus'
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center space-y-8 pointer-events-auto px-4"
            >
              <div className="space-y-4">
                <h1 className="font-mono text-3xl md:text-4xl font-bold text-ink">
                  Focus First
                </h1>
                <p className="font-sans text-lg text-faded max-w-md mx-auto">
                  Cut through the AI hype. Learn one thing at a time.
                </p>
              </div>

              <Link
                href="/app"
                className="btn-process inline-block"
              >
                Get Started
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom cursor indicator for desktop */}
      {!isTouchDevice && !isRevealed && mousePos.x > 0 && (
        <motion.div
          className="fixed w-4 h-4 rounded-full border-2 border-ink pointer-events-none z-50"
          style={{
            left: mousePos.x - 8,
            top: mousePos.y - 8,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isRevealed ? 1 : 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-faded">
          <span className="text-xs font-mono">Scroll to learn more</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 border-2 border-faded rounded-full flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-faded rounded-full" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
