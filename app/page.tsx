'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import HeroAnimation from '@/components/landing/HeroAnimation'
import MotivationSection from '@/components/landing/MotivationSection'
import FeaturesGrid from '@/components/landing/FeaturesGrid'
import TechStackTerminal from '@/components/landing/TechStackTerminal'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Hero Section with Lens Animation */}
      <HeroAnimation />

      {/* Motivation / Why Section */}
      <MotivationSection />

      {/* Features Grid */}
      <FeaturesGrid />

      {/* Tech Stack Terminal */}
      <TechStackTerminal />

      {/* Final CTA Section */}
      <section className="py-24 px-6 md:px-12 bg-paper border-t-2 border-ink">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-mono text-3xl md:text-4xl font-bold text-ink"
          >
            Ready to focus?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-sans text-lg text-faded"
          >
            Start learning one thing at a time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/auth"
              className="btn-process inline-block"
            >
              Get Started
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="font-mono text-xs text-faded"
          >
            Free tier: 5 summarizations/day
          </motion.p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-ink">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono text-sm text-paper/60">
            Focus First — Built for learning
          </div>
          <div className="flex items-center gap-6 font-mono text-xs text-paper/40">
            <Link href="/auth" className="hover:text-paper/80 transition-colors">
              App
            </Link>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
