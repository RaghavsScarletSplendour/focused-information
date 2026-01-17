'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface Feature {
  title: string
  description: string
  icon: string
}

const features: Feature[] = [
  {
    title: 'AI Summarization',
    description: 'GPT-4o-mini distills any article into a focused learning card with key insights.',
    icon: '>>',
  },
  {
    title: 'Curriculum Architect',
    description: 'Our AI reorders your queue based on complexity and topic dependencies.',
    icon: '[]',
  },
  {
    title: 'Queue-Based Learning',
    description: 'One card at a time. No distractions. Mark learned and move forward.',
    icon: '::',
  },
  {
    title: 'Archive & Revisit',
    description: 'Everything you learn is saved. Requeue items when you need a refresher.',
    icon: '<>',
  },
  {
    title: 'Cross-Device Sync',
    description: 'Sign in to sync your learning queue across all your devices.',
    icon: '~~',
  },
  {
    title: 'Pro Features',
    description: 'Unlimited summarizations and advanced curriculum optimization with Pro.',
    icon: '**',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
}

export default function FeaturesGrid() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section
      ref={ref}
      className="py-24 px-6 md:px-12 bg-ink"
    >
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="font-mono text-3xl md:text-4xl font-bold text-paper mb-16 text-center"
        >
          Built for focused learning
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="border-2 border-paper bg-ink p-6 rounded-lg hover:bg-accent transition-colors duration-200"
            >
              <div className="font-mono text-2xl text-paper mb-4 opacity-60">
                {feature.icon}
              </div>
              <h3 className="font-mono text-lg font-semibold text-paper mb-2">
                {feature.title}
              </h3>
              <p className="font-sans text-sm text-paper/70 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
