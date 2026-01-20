'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import LensCanvas from './LensCanvas'
import RevealCard from './RevealCard'

export default function HeroAnimation() {
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [showStaticCard, setShowStaticCard] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const clipContainerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const mousePosRef = useRef({ x: 0, y: 0 })
  const [hasMouseMoved, setHasMouseMoved] = useState(false)
  const autoAnimationRef = useRef<number>()

  const lensRadius = 79

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

  // Auto-animation for touch devices - smooth circular motion
  useEffect(() => {
    if (!isTouchDevice || prefersReducedMotion) return

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    let angle = 0
    const radius = 80

    const autoAnimate = () => {
      angle += 0.02

      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      // Update ref (for LensCanvas)
      mousePosRef.current = { x, y }

      // Update CSS variables directly (for clip-path)
      if (clipContainerRef.current) {
        clipContainerRef.current.style.setProperty('--mx', `${x}px`)
        clipContainerRef.current.style.setProperty('--my', `${y}px`)
      }

      autoAnimationRef.current = requestAnimationFrame(autoAnimate)
    }

    // Start auto-animation after a short delay
    const timeout = setTimeout(() => {
      // Set initial position to center
      mousePosRef.current = { x: centerX, y: centerY }
      if (clipContainerRef.current) {
        clipContainerRef.current.style.setProperty('--mx', `${centerX}px`)
        clipContainerRef.current.style.setProperty('--my', `${centerY}px`)
      }
      autoAnimationRef.current = requestAnimationFrame(autoAnimate)
    }, 500)

    return () => {
      clearTimeout(timeout)
      if (autoAnimationRef.current) {
        cancelAnimationFrame(autoAnimationRef.current)
      }
    }
  }, [isTouchDevice, prefersReducedMotion])

  // Mouse tracking for desktop
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isTouchDevice) return

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Update ref (for LensCanvas)
    mousePosRef.current = { x, y }

    // Update CSS variables directly (for clip-path) - no React render needed
    if (clipContainerRef.current) {
      clipContainerRef.current.style.setProperty('--mx', `${x}px`)
      clipContainerRef.current.style.setProperty('--my', `${y}px`)
    }

    // Update cursor position directly
    if (cursorRef.current) {
      cursorRef.current.style.left = `${x - 8}px`
      cursorRef.current.style.top = `${y - 8}px`
    }

    // Show cursor on first movement (only state update needed once)
    if (!hasMouseMoved) {
      setHasMouseMoved(true)
    }
  }, [isTouchDevice, hasMouseMoved])

  // Handle tap to skip animation on mobile
  const handleTap = useCallback(() => {
    if (isTouchDevice) {
      setShowStaticCard(true)
    }
  }, [isTouchDevice])

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
            learning card. Paste any link, and we&apos;ll distill it to what matters.
          </p>

          {/* Static card preview */}
          <div className="flex justify-center">
            <RevealCard />
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
      {/* Layer 1: Hidden Card revealed via clip-path (z-0) */}
      <div
        ref={clipContainerRef}
        className="absolute inset-0 flex items-center justify-center z-0 px-4"
        style={{
          '--mx': '50%',
          '--my': '50%',
          clipPath: `circle(${lensRadius}px at var(--mx) var(--my))`,
        } as React.CSSProperties}
      >
        <RevealCard />
      </div>

      {/* Layer 2: Noise Canvas (z-10) */}
      <LensCanvas
        mousePosRef={mousePosRef}
        lensRadius={lensRadius}
      />

      {/* Custom cursor indicator for desktop */}
      {!isTouchDevice && hasMouseMoved && (
        <motion.div
          ref={cursorRef}
          className="absolute w-4 h-4 rounded-full border-2 border-ink pointer-events-none z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Instruction hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="flex flex-col items-center gap-2 text-faded">
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
