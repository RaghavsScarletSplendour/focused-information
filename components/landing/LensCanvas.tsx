'use client'

import { useEffect, useRef, useCallback, type RefObject } from 'react'

interface Particle {
  x: number
  y: number
  baseX: number
  baseY: number
  char: string
  opacity: number
  velocity: { x: number; y: number }
  fontSize: number
}

interface LensCanvasProps {
  mousePosRef: RefObject<{ x: number; y: number }>
  lensRadius?: number
}

const ASCII_WORDS = [
  'url', 'link', 'data', 'feed', 'api', 'rss', 'xml', 'json',
  'http', 'www', 'news', 'post', 'info', 'byte', 'code', 'hash',
  'sync', 'ping', 'load', 'read', 'send', 'port', 'node', 'loop',
  '0101', '1010', '0x7F', '>>>', '<<<', '&&&', '|||', '...',
  'npm', 'git', 'ssh', 'tcp', 'udp', 'dns', 'ssl', 'cdn',
  'dom', 'css', 'html', 'jsx', 'tsx', 'vue', 'svn', 'sql',
]

export default function LensCanvas({
  mousePosRef,
  lensRadius = 150,
}: LensCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()

  // Initialize particles - dense cloud of floating text
  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    const isMobile = width < 768
    const particleCount = isMobile ? 150 : 400

    for (let i = 0; i < particleCount; i++) {
      const word = ASCII_WORDS[Math.floor(Math.random() * ASCII_WORDS.length)]
      const x = Math.random() * width
      const y = Math.random() * height

      particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        char: word,
        opacity: 0.15 + Math.random() * 0.2,
        velocity: {
          x: (Math.random() - 0.5) * 0.8,
          y: (Math.random() - 0.5) * 0.8,
        },
        fontSize: 12 + Math.random() * 2,
      })
    }

    particlesRef.current = particles
  }, [])

  // Animation loop - reads from ref for zero-latency updates
  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    // Read mouse position from ref (updated directly in parent, no React render needed)
    const mouseX = mousePosRef.current?.x ?? 0
    const mouseY = mousePosRef.current?.y ?? 0

    // Clear canvas with transparency
    ctx.clearRect(0, 0, width, height)

    ctx.textBaseline = 'middle'

    particlesRef.current.forEach((particle) => {
      // Calculate distance from cursor
      const dx = particle.x - mouseX
      const dy = particle.y - mouseY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < lensRadius && mouseX > 0 && mouseY > 0) {
        // Inside lens radius: repel to the edge of the circle
        const angle = Math.atan2(dy, dx)
        const targetX = mouseX + Math.cos(angle) * (lensRadius + 5)
        const targetY = mouseY + Math.sin(angle) * (lensRadius + 5)

        // Smooth interpolation to edge
        particle.x += (targetX - particle.x) * 0.15
        particle.y += (targetY - particle.y) * 0.15
      } else {
        // Outside lens: gentle drift with return to base
        particle.x += particle.velocity.x
        particle.y += particle.velocity.y

        // Slowly drift back toward base position
        particle.x += (particle.baseX - particle.x) * 0.002
        particle.y += (particle.baseY - particle.y) * 0.002

        // Randomly flip velocity direction to prevent equilibrium
        // ~0.8% chance per frame = direction change every ~2 seconds at 60fps
        if (Math.random() < 0.008) {
          if (Math.random() < 0.5) particle.velocity.x *= -1
          if (Math.random() < 0.5) particle.velocity.y *= -1
        }

        // Bounce off edges
        if (particle.x < 0 || particle.x > width) {
          particle.velocity.x *= -1
          particle.x = Math.max(0, Math.min(width, particle.x))
        }
        if (particle.y < 0 || particle.y > height) {
          particle.velocity.y *= -1
          particle.y = Math.max(0, Math.min(height, particle.y))
        }
      }

      // Draw particle
      ctx.fillStyle = `rgba(26, 26, 26, ${particle.opacity})`
      ctx.font = `${particle.fontSize}px "IBM Plex Mono", monospace`
      ctx.fillText(particle.char, particle.x, particle.y)
    })

    // Draw subtle lens outline
    if (mouseX > 0 && mouseY > 0) {
      ctx.beginPath()
      ctx.arc(mouseX, mouseY, lensRadius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(26, 26, 26, 0.08)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [mousePosRef, lensRadius])

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
      className="absolute inset-0 w-full h-full z-10"
      style={{ touchAction: 'none' }}
    />
  )
}
