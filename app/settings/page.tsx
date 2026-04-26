'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, ChevronRight, Trash2, Shield, Search, LogOut, Moon } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import NavBar from '@/components/NavBar'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/api'
import { useDarkMode } from '@/lib/useDarkMode'
import PageWrapper from '@/components/PageWrapper'

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser, clearAuth } = useAuthStore()
  const { dark, toggle: toggleDark } = useDarkMode()

  // Discovery prefs
  const [minAge, setMinAge] = useState(user?.min_age ?? 18)
  const [maxAge, setMaxAge] = useState(user?.max_age ?? 45)
  const [interestedIn, setInterestedIn] = useState(user?.interested_in ?? 'everyone')
  const [showMe, setShowMe] = useState(user?.show_me ?? true)
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Change password
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  // Delete account
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const saveDiscoveryPrefs = async () => {
    if (minAge >= maxAge) {
      toast.error('Minimum age must be less than maximum')
      return
    }
    setSavingPrefs(true)
    try {
      const res = await api.patch('/profiles/me', {
        min_age: minAge,
        max_age: maxAge,
        interested_in: interestedIn,
        show_me: showMe,
      })
      setUser({ ...user!, ...res.data })
      toast.success('Discovery preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSavingPrefs(false)
    }
  }

  const savePassword = async () => {
    if (newPw.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    setSavingPw(true)
    try {
      await api.post('/auth/change-password', { current_password: currentPw, new_password: newPw })
      toast.success('Password updated')
      setCurrentPw('')
      setNewPw('')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update password')
    } finally {
      setSavingPw(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm')
      return
    }
    setDeleting(true)
    try {
      await api.delete('/profiles/me')
      clearAuth()
      router.push('/')
      toast.success('Account deleted')
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  const resendVerification = async () => {
    try {
      await api.post('/auth/resend-verification')
      toast.success('Verification email sent!')
      setTimeout(() => toast('Also check your spam folder', { icon: '📬' }), 800)
    } catch {
      toast.error('Failed to send email')
    }
  }

  const handleLogout = () => {
    clearAuth()
    router.push('/')
    toast.success('Signed out')
  }

  return (
    <PageWrapper slide>
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/60 dark:bg-[#120608]/80 backdrop-blur-2xl border-b border-white/50 dark:border-[#3D1E24]/60 px-6 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-burgundy-800/60 dark:text-cream-300/50 hover:text-burgundy-900 dark:hover:text-cream-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-xl font-bold text-burgundy-950 dark:text-cream-100">Settings</h1>
      </div>

      <div className="max-w-xl mx-auto px-6 py-6 space-y-6">

        {/* Email verification banner */}
        {user && !user.email_verified && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">Email not verified</p>
              <p className="text-xs text-amber-700 mt-0.5">{user.email}</p>
            </div>
            <button onClick={resendVerification} className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors whitespace-nowrap">
              Resend
            </button>
          </div>
        )}

        {/* Appearance */}
        <section className="card-luxury">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-burgundy-900 dark:text-gold-400" />
              <div>
                <p className="text-sm font-medium text-burgundy-950 dark:text-cream-100">Dark Mode</p>
                <p className="text-xs text-burgundy-800/50 dark:text-cream-300/50">Easy on the eyes at night</p>
              </div>
            </div>
            <button
              onClick={toggleDark}
              className={`w-12 h-6 p-0 rounded-full transition-colors duration-300 relative overflow-hidden ${dark ? 'bg-burgundy-900' : 'bg-cream-400'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${dark ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </section>

        {/* Discovery Preferences */}
        <section className="card-luxury space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-5 h-5 text-burgundy-900 dark:text-gold-400" />
            <h2 className="font-serif font-semibold text-burgundy-950 dark:text-cream-100">Discovery</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-burgundy-950 dark:text-cream-100 mb-2">Show Me</label>
            <select
              className="input-field"
              value={interestedIn}
              onChange={(e) => setInterestedIn(e.target.value)}
            >
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="everyone">Everyone</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-burgundy-950 dark:text-cream-100 mb-3">
              Age Range: <span className="text-burgundy-900 dark:text-gold-400 font-bold">{minAge} – {maxAge}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-burgundy-800/60 dark:text-cream-300/50 mb-1 block">Min age</label>
                <input
                  type="number"
                  min={18}
                  max={maxAge - 1}
                  className="input-field"
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-burgundy-800/60 dark:text-cream-300/50 mb-1 block">Max age</label>
                <input
                  type="number"
                  min={minAge + 1}
                  max={99}
                  className="input-field"
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-burgundy-950 dark:text-cream-100">Show my profile</p>
              <p className="text-xs text-burgundy-800/50 dark:text-cream-300/40">When off, you won't appear in Discover</p>
            </div>
            <button
              onClick={() => setShowMe((v) => !v)}
              className={`w-12 h-6 p-0 rounded-full transition-colors duration-300 relative overflow-hidden ${showMe ? 'bg-burgundy-900' : 'bg-cream-400'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${showMe ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <button onClick={saveDiscoveryPrefs} disabled={savingPrefs} className="btn-primary w-full">
            {savingPrefs ? 'Saving...' : 'Save Preferences'}
          </button>
        </section>

        {/* Change Password */}
        <section className="card-luxury space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-burgundy-900 dark:text-gold-400" />
            <h2 className="font-serif font-semibold text-burgundy-950 dark:text-cream-100">Change Password</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-burgundy-950 dark:text-cream-100 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input-field pr-12"
                placeholder="••••••••"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-burgundy-800/40 dark:text-cream-300/30 hover:text-burgundy-900 dark:hover:text-cream-100"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-burgundy-950 dark:text-cream-100 mb-2">New Password</label>
            <input
              type={showPw ? 'text' : 'password'}
              className="input-field"
              placeholder="Min 8 characters"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
          </div>

          <button onClick={savePassword} disabled={savingPw || !currentPw || !newPw} className="btn-primary w-full disabled:opacity-40">
            {savingPw ? 'Updating...' : 'Update Password'}
          </button>
        </section>

        {/* Legal */}
        <section className="card-luxury">
          <h2 className="font-serif font-semibold text-burgundy-950 dark:text-cream-100 mb-4">Legal</h2>
          <div className="space-y-1">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between py-3 text-sm text-burgundy-950 dark:text-cream-100 hover:text-burgundy-900 dark:hover:text-cream-300 border-b border-cream-200 dark:border-white/[0.08] last:border-0"
              >
                {label}
                <ChevronRight className="w-4 h-4 text-burgundy-800/40 dark:text-cream-300/30" />
              </Link>
            ))}
          </div>
        </section>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 text-burgundy-900 dark:text-cream-200 font-medium hover:bg-burgundy-900/5 dark:hover:bg-white/[0.06] rounded-2xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

        {/* Delete Account */}
        <section className="card-luxury border-red-100">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-5 h-5 text-red-400" />
            <h2 className="font-serif font-semibold text-red-700">Delete Account</h2>
          </div>
          <p className="text-sm text-burgundy-800/60 dark:text-cream-300/50 mb-4">
            Permanently deletes your profile, photos, matches, and messages. This cannot be undone.
          </p>

          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="w-full py-3 border-2 border-red-300 text-red-600 rounded-2xl font-medium hover:bg-red-50 transition-colors"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-700">Type <strong>DELETE</strong> to confirm:</p>
              <input
                type="text"
                className="input-field border-red-300 focus:ring-red-400"
                placeholder="DELETE"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                  className="flex-1 py-3 border border-cream-400 dark:border-white/10 rounded-2xl text-sm font-medium text-burgundy-800/60 dark:text-cream-300/50 hover:bg-cream-200 dark:hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirm !== 'DELETE'}
                  className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-40"
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <NavBar active="profile" />
    </div>
    </PageWrapper>
  )
}
