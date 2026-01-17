'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'

const techLines = [
  { text: '$ cat stack.json', delay: 0 },
  { text: '{', delay: 0.5 },
  { text: '  "framework": "Next.js 14",', delay: 0.8 },
  { text: '  "ai": "OpenAI GPT-4o-mini",', delay: 1.1 },
  { text: '  "database": "Supabase",', delay: 1.4 },
  { text: '  "payments": "Razorpay",', delay: 1.7 },
  { text: '  "styling": "Tailwind CSS",', delay: 2.0 },
  { text: '  "animations": "Framer Motion"', delay: 2.3 },
  { text: '}', delay: 2.6 },
  { text: '$ _', delay: 2.9, cursor: true },
]

export default function TechStackTerminal() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    if (!isInView) return

    const timeouts: NodeJS.Timeout[] = []

    techLines.forEach((line, index) => {
      const timeout = setTimeout(() => {
        setVisibleLines(index + 1)
      }, line.delay * 1000)
      timeouts.push(timeout)
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [isInView])

  return (
    <section
      ref={ref}
      className="py-24 px-6 md:px-12 bg-paper"
    >
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="font-mono text-3xl md:text-4xl font-bold text-ink mb-12 text-center"
        >
          Built with modern tools
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="border-2 border-ink rounded-lg overflow-hidden shadow-card"
        >
          {/* Terminal header */}
          <div className="bg-ink px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-4 font-mono text-xs text-paper/60">
              terminal — focus-first
            </span>
          </div>

          {/* Terminal content */}
          <div className="bg-ink/95 p-6 min-h-[300px]">
            <div className="font-mono text-sm space-y-1">
              {techLines.slice(0, visibleLines).map((line, index) => (
                <div
                  key={index}
                  className={`${
                    line.text.startsWith('$')
                      ? 'text-green-400'
                      : line.text.includes(':')
                      ? 'text-paper/90'
                      : 'text-paper/70'
                  }`}
                >
                  {line.text.includes(':') ? (
                    <>
                      <span className="text-blue-400">
                        {line.text.split(':')[0]}:
                      </span>
                      <span className="text-yellow-300">
                        {line.text.split(':').slice(1).join(':')}
                      </span>
                    </>
                  ) : (
                    line.text
                  )}
                  {line.cursor && (
                    <span className="inline-block w-2 h-4 bg-green-400 ml-1 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
