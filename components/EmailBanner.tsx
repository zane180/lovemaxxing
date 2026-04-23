'use client'

import { useState } from 'react'
import { Mail, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/api'

export default function EmailBanner() {
  const { user } = useAuthStore()
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)

  if (!user || user.email_verified || dismissed) return null

  const resend = async () => {
    setSending(true)
    try {
      await api.post('/auth/resend-verification')
      toast.success('Verification email sent!')
      setTimeout(() => toast('Also check your spam folder', { icon: '📬' }), 800)
      setDismissed(true)
    } catch {
      toast.error('Failed to send. Try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3">
      <Mail className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <p className="text-xs text-amber-800 flex-1">
        Verify your email to secure your account.{' '}
        <button
          onClick={resend}
          disabled={sending}
          className="font-semibold underline hover:no-underline disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Resend email'}
        </button>
      </p>
      <button onClick={() => setDismissed(true)} className="text-amber-600 hover:text-amber-800 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
