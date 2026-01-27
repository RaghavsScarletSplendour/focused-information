'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user, isLoading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()

  // Redirect to /app if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/app')
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    try {
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email, password)
        if (error) {
          setError(error.message)
        } else {
          router.push('/app')
        }
      } else {
        const { error } = await signUpWithEmail(email, password)
        if (error) {
          setError(error.message)
        } else {
          setMessage('Check your email for a confirmation link!')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
    }
    // Google OAuth will redirect automatically on success
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setMessage(null)
  }

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    resetForm()
  }

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-faded text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  // Don't render form if already authenticated (will redirect)
  if (user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-faded text-sm animate-pulse">Redirecting...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="font-mono text-sm text-faded hover:text-ink transition-colors">
            &larr; Back to home
          </Link>
          <h1 className="mt-6 text-2xl font-bold uppercase tracking-wider">
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </h1>
          <p className="mt-2 text-sm text-faded">
            {mode === 'signin'
              ? 'Welcome back. Focus awaits.'
              : 'Create an account to start learning.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-paper border-2 border-ink rounded-lg p-8">
          {/* Error/Message Display */}
          {error && (
            <div className="mb-4 p-3 border border-ink bg-paper text-sm text-ink rounded-lg">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 border border-faded bg-paper text-sm text-faded rounded-lg">
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-faded mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border-2 border-ink p-3 font-mono text-ink rounded-lg focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-faded mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-transparent border-2 border-ink p-3 font-mono text-ink rounded-lg focus:outline-none"
                placeholder="Min 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-process w-full"
            >
              {isSubmitting ? (
                <span className="animate-pulse">
                  {mode === 'signin' ? 'Signing in...' : 'Signing up...'}
                </span>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-faded"></div>
            <span className="px-3 text-xs text-faded">or</span>
            <div className="flex-1 border-t border-faded"></div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="btn-learned w-full"
          >
            Continue with Google
          </button>

          {/* Switch Mode */}
          <p className="mt-6 text-center text-sm text-faded">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={switchMode}
                  className="underline hover:text-ink transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={switchMode}
                  className="underline hover:text-ink transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-faded">
          Free tier: 5 summarizations/day
        </p>
      </motion.div>
    </div>
  )
}
