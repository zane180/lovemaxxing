'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

const CODE_LENGTH = 6
const RESEND_COOLDOWN = 60

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()

  const email = searchParams.get('email') || ''
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.max(2, b.length)) + c)

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const submitCode = async (code: string) => {
    if (code.length < CODE_LENGTH) return
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/verify-code', { email, code })
      setToken(res.data.token)
      setUser(res.data.user)
      router.push('/onboarding')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Incorrect code. Please try again.')
      setDigits(Array(CODE_LENGTH).fill(''))
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError('')

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    const code = next.join('')
    if (code.length === CODE_LENGTH && !next.includes('')) {
      submitCode(code)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]
        next[index] = ''
        setDigits(next)
        setError('')
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return
    const next = Array(CODE_LENGTH).fill('')
    pasted.split('').forEach((d, i) => { next[i] = d })
    setDigits(next)
    setError('')
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()
    if (pasted.length === CODE_LENGTH) {
      submitCode(pasted)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || !email) return
    setResendSuccess(false)
    try {
      await api.post('/auth/resend-code', { email })
      setCooldown(RESEND_COOLDOWN)
      setResendSuccess(true)
      setDigits(Array(CODE_LENGTH).fill(''))
      setError('')
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } catch (err: any) {
      if (err.response?.status === 429) {
        setCooldown(RESEND_COOLDOWN)
      }
    }
  }

  return (
    <div className="text-center">
      <p className="text-burgundy-800/70 mb-1 text-sm">Code sent to</p>
      <p className="font-semibold text-burgundy-950 mb-8 text-sm">{maskedEmail || 'your email'}</p>

      <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            className={[
              'w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all',
              'bg-cream-50 text-burgundy-950',
              error
                ? 'border-red-400 bg-red-50'
                : d
                  ? 'border-burgundy-700 bg-burgundy-50/30'
                  : 'border-burgundy-200 focus:border-burgundy-700',
              loading ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4"
        >
          {error}
        </motion.p>
      )}

      {resendSuccess && !error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-4"
        >
          New code sent! Check your inbox.
        </motion.p>
      )}

      {loading && (
        <div className="flex justify-center mb-4">
          <div className="w-6 h-6 border-2 border-burgundy-200 border-t-burgundy-700 rounded-full animate-spin" />
        </div>
      )}

      <button
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0 || loading}
        className="flex items-center gap-2 mx-auto text-sm text-burgundy-700 hover:text-burgundy-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
      </button>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Heart className="w-8 h-8 text-burgundy-900 fill-burgundy-900 mx-auto mb-4" />
          <h1 className="font-serif text-3xl font-bold text-burgundy-950 mb-2">Check your email</h1>
          <p className="text-burgundy-800/60">Enter the 6-digit code we sent you</p>
        </div>

        <div className="card-luxury py-10">
          <Suspense fallback={
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-cream-300 border-t-burgundy-900 rounded-full animate-spin mx-auto" />
            </div>
          }>
            <VerifyContent />
          </Suspense>
        </div>
      </motion.div>
    </div>
  )
}
