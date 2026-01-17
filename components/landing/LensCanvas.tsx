'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Particle {
  x: number
  y: number
  targetX: number
  targetY: number
  char: string
  opacity: number
  velocity: { x: number; y: number }
  fontSize: number
}

interface LensCanvasProps {
  mouseX: number
  mouseY: number
  isRevealed: boolean
  lensRadius?: number
  onRevealComplete?: () => void
}

const ASCII_WORDS = [
  'url', 'link', 'data', 'feed', 'api', 'rss', 'xml', 'json',
  'http', 'www', 'news', 'post', 'info', 'byte', 'code', 'hash',
  'sync', 'ping', 'load', 'read', 'send', 'port', 'node', 'loop',
  '0101', '1010', '0x7F', '>>>', '<<<', '&&&', '|||', '...',
]

const CARD_ASCII = [
  '┌────────────────────────────┐',
  '│  complexity: beginner      │',
  '├────────────────────────────┤',
  '│                            │',
  '│  Learn AI Concepts         │',
  '│                            │',
  '│  Understand how large      │',
  '│  language models work...   │',
  '│                            │',
  '│  [Mark as Learned]         │',
  '└────────────────────────────┘',
]

export default function LensCanvas({
  mouseX,
  mouseY,
  isRevealed,
  lensRadius = 150,
  onRevealComplete,
}: LensCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const revealProgressRef = useRef(0)

  // Initialize particles
  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    const isMobile = width < 768
    const particleCount = isMobile ? 100 : 300

    // Calculate card position (center of canvas)
    const cardWidth = 30 * 10 // Approximate character width * chars
    const cardHeight = CARD_ASCII.length * 20 // Line height * lines
    const cardStartX = (width - cardWidth) / 2
    const cardStartY = (height - cardHeight) / 2

    // Create particles for card characters
    let cardParticleIndex = 0
    CARD_ASCII.forEach((line, lineIndex) => {
      const chars = line.split('')
      chars.forEach((char, charIndex) => {
        if (char !== ' ') {
          const targetX = cardStartX + charIndex * 10
          const targetY = cardStartY + lineIndex * 20

          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            targetX,
            targetY,
            char,
            opacity: 0.15 + Math.random() * 0.15,
            velocity: {
              x: (Math.random() - 0.5) * 2,
              y: (Math.random() - 0.5) * 2,
            },
            fontSize: 14,
          })
          cardParticleIndex++
        }
      })
    })

    // Add extra floating particles for atmosphere
    const extraParticles = Math.max(0, particleCount - particles.length)
    for (let i = 0; i < extraParticles; i++) {
      const word = ASCII_WORDS[Math.floor(Math.random() * ASCII_WORDS.length)]
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        targetX: Math.random() * width,
        targetY: Math.random() * height,
        char: word,
        opacity: 0.1 + Math.random() * 0.1,
        velocity: {
          x: (Math.random() - 0.5) * 1.5,
          y: (Math.random() - 0.5) * 1.5,
        },
        fontSize: 10 + Math.random() * 4,
      })
    }

    particlesRef.current = particles
  }, [])

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = '#F3F0E9'
    ctx.fillRect(0, 0, width, height)

    // Update reveal progress
    if (isRevealed && revealProgressRef.current < 1) {
      revealProgressRef.current = Math.min(1, revealProgressRef.current + 0.02)
      if (revealProgressRef.current >= 1 && onRevealComplete) {
        onRevealComplete()
      }
    }

    // Draw and update particles
    ctx.font = '14px "IBM Plex Mono", monospace'
    ctx.textBaseline = 'middle'

    particlesRef.current.forEach((particle, index) => {
      // Calculate distance from cursor/lens center
      const dx = particle.x - mouseX
      const dy = particle.y - mouseY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Check if this is a card particle (first ~200 particles)
      const isCardParticle = index < 200

      if (isRevealed) {
        // Full reveal: all card particles snap to target
        if (isCardParticle) {
          const progress = revealProgressRef.current
          particle.x += (particle.targetX - particle.x) * 0.1 * progress
          particle.y += (particle.targetY - particle.y) * 0.1 * progress
          particle.opacity += (1 - particle.opacity) * 0.1 * progress
        } else {
          // Atmosphere particles fade out
          particle.opacity *= 0.98
        }
      } else if (distance < lensRadius) {
        // Inside lens: snap toward target position
        const influence = 1 - distance / lensRadius
        const snapStrength = influence * 0.15

        if (isCardParticle) {
          particle.x += (particle.targetX - particle.x) * snapStrength
          particle.y += (particle.targetY - particle.y) * snapStrength
          particle.opacity += (0.8 + influence * 0.2 - particle.opacity) * 0.1
        }
      } else {
        // Outside lens: continue drifting
        particle.x += particle.velocity.x
        particle.y += particle.velocity.y

        // Bounce off edges
        if (particle.x < 0 || particle.x > width) {
          particle.velocity.x *= -1
          particle.x = Math.max(0, Math.min(width, particle.x))
        }
        if (particle.y < 0 || particle.y > height) {
          particle.velocity.y *= -1
          particle.y = Math.max(0, Math.min(height, particle.y))
        }

        // Fade back to low opacity when outside lens
        if (isCardParticle) {
          particle.opacity += (0.2 - particle.opacity) * 0.05
        }
      }

      // Draw particle
      if (particle.opacity > 0.01) {
        ctx.fillStyle = `rgba(26, 26, 26, ${particle.opacity})`
        ctx.font = `${particle.fontSize}px "IBM Plex Mono", monospace`
        ctx.fillText(particle.char, particle.x, particle.y)
      }
    })

    // Draw lens outline when not revealed
    if (!isRevealed && mouseX > 0 && mouseY > 0) {
      ctx.beginPath()
      ctx.arc(mouseX, mouseY, lensRadius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(26, 26, 26, 0.1)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [mouseX, mouseY, isRevealed, lensRadius, onRevealComplete])

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      initParticles(rect.width, rect.height)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [initParticles])

  // Start animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animate])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  )
}
