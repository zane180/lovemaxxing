'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const { setUser, user } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link.')
      return
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success')
        if (user) setUser({ ...user, email_verified: true })
        setTimeout(() => router.push('/discover'), 2000)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.response?.data?.detail || 'Verification failed. The link may have expired.')
      })
  }, [token])

  return (
    <div className="text-center">
      {status === 'loading' && (
        <>
          <div className="w-12 h-12 border-2 border-cream-300 border-t-burgundy-900 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-burgundy-800/60">Verifying your email...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-burgundy-950 mb-2">Email verified!</h2>
          <p className="text-burgundy-800/60 mb-6">Redirecting you to discover...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-burgundy-950 mb-2">Verification failed</h2>
          <p className="text-burgundy-800/60 mb-6">{message}</p>
          <div className="flex flex-col gap-3">
            <Link href="/discover" className="btn-primary inline-block">
              Go to App
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Heart className="w-8 h-8 text-burgundy-900 fill-burgundy-900 mx-auto mb-4" />
          <h1 className="font-serif text-3xl font-bold text-burgundy-950">Lovemaxxing</h1>
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
