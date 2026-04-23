'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ArrowLeft, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
      <div className="absolute top-6 left-6">
        <Link href="/login" className="flex items-center gap-2 text-burgundy-900/60 hover:text-burgundy-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Sign In</span>
        </Link>
      </div>

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-burgundy-900 fill-burgundy-900" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-burgundy-950 mb-2">Forgot password?</h1>
          <p className="text-burgundy-800/60">No worries — we'll send you a reset link.</p>
        </div>

        <div className="card-luxury">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-burgundy-900/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-burgundy-900" />
              </div>
              <h3 className="font-serif text-xl font-bold text-burgundy-950 mb-2">Check your inbox</h3>
              <p className="text-burgundy-800/60 text-sm leading-relaxed mb-6">
                If an account exists for <strong>{email}</strong>, we've sent a password reset link.
                Check your spam folder if you don't see it.
              </p>
              <Link href="/login" className="btn-primary inline-block">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-burgundy-950 mb-2">Email address</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-cream-100/30 border-t-cream-100 rounded-full animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
