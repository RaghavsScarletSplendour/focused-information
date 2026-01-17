'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function MotivationSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      ref={ref}
      className="py-24 px-6 md:px-12 bg-paper"
    >
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="space-y-8"
        >
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-ink leading-tight">
            Information overload is the enemy of understanding.
          </h2>

          <div className="space-y-6 font-sans text-lg text-faded leading-relaxed">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Every day, hundreds of AI articles, research papers, and hot takes
              compete for your attention. The result? Anxiety, FOMO, and superficial
              understanding of everything but deep knowledge of nothing.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Focus First takes a different approach. Instead of adding to the noise,
              we help you process it. Paste any link, and our AI distills it into a
              single learning card. One concept. One action. One step forward.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="font-mono text-ink font-semibold"
            >
              Because real learning happens one insight at a time.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
