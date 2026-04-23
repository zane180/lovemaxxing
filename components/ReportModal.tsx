'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flag, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

interface ReportModalProps {
  userId: string
  userName: string
  onClose: () => void
  onBlocked?: () => void
}

const REPORT_REASONS = [
  { value: 'fake', label: 'Fake profile or catfish' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'harassment', label: 'Harassment or threats' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'underage', label: 'Appears to be underage' },
  { value: 'other', label: 'Other' },
]

export default function ReportModal({ userId, userName, onClose, onBlocked }: ReportModalProps) {
  const [view, setView] = useState<'menu' | 'report'>('menu')
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBlock = async () => {
    setLoading(true)
    try {
      await api.post('/safety/block', { blocked_id: userId })
      toast.success(`${userName} has been blocked`)
      onBlocked?.()
      onClose()
    } catch {
      toast.error('Failed to block. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReport = async () => {
    if (!reason) {
      toast.error('Please select a reason')
      return
    }
    setLoading(true)
    try {
      await api.post('/safety/report', { reported_id: userId, reason, details: details || undefined })
      toast.success('Report submitted. We\'ll review it within 24 hours.')
      onBlocked?.()
      onClose()
    } catch {
      toast.error('Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center px-4 pb-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl w-full max-w-sm shadow-luxury overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {view === 'menu' ? (
            <>
              <div className="px-6 pt-6 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-serif text-lg font-bold text-burgundy-950">{userName}</h3>
                  <button onClick={onClose} className="text-burgundy-800/40 hover:text-burgundy-900 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-4 pb-6 space-y-2">
                <button
                  onClick={() => setView('report')}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left hover:bg-cream-100 transition-colors"
                >
                  <Flag className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-burgundy-950 text-sm">Report {userName}</p>
                    <p className="text-xs text-burgundy-800/50">Let us know if something's wrong</p>
                  </div>
                </button>

                <button
                  onClick={handleBlock}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Ban className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-600 text-sm">Block {userName}</p>
                    <p className="text-xs text-burgundy-800/50">They won't be able to see or contact you</p>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-6 pt-6 pb-2 flex items-center gap-3">
                <button onClick={() => setView('menu')} className="text-burgundy-800/40 hover:text-burgundy-900">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="font-serif text-lg font-bold text-burgundy-950">Report {userName}</h3>
              </div>

              <div className="px-6 pb-6 space-y-4">
                <p className="text-sm text-burgundy-800/60">Why are you reporting this profile?</p>

                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium transition-all border-2 ${
                        reason === r.value
                          ? 'bg-burgundy-900 text-cream-100 border-burgundy-900'
                          : 'bg-cream-50 text-burgundy-950 border-cream-300 hover:border-burgundy-900/40'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {reason && (
                  <div>
                    <label className="text-xs font-medium text-burgundy-800/60 mb-1 block">
                      Additional details (optional)
                    </label>
                    <textarea
                      className="input-field resize-none h-20 text-sm"
                      placeholder="Tell us more..."
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      maxLength={500}
                    />
                  </div>
                )}

                <button
                  onClick={handleReport}
                  disabled={loading || !reason}
                  className="btn-primary w-full disabled:opacity-40"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
                <p className="text-xs text-burgundy-800/40 text-center">
                  Reporting also blocks this user from contacting you.
                </p>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
