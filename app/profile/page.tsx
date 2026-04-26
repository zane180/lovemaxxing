'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Camera, Edit3, Settings, LogOut, Star, Heart, Sparkles, Check, X } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { INTEREST_CATEGORIES } from '@/lib/constants'
import PageWrapper from '@/components/PageWrapper'

export default function ProfilePage() {
  const router = useRouter()
  const { user, setUser, clearAuth } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState(user?.bio || '')
  const [saving, setSaving] = useState(false)
  const [editingInterests, setEditingInterests] = useState(false)
  const [interests, setInterests] = useState<string[]>(user?.interests || [])
  const [stats, setStats] = useState(user?.stats ?? null)

  useEffect(() => {
    if (user?.interests) setInterests(user.interests)
    if (user?.bio !== undefined) setBio(user.bio || '')
  }, [user?.interests?.join(','), user?.bio])

  useEffect(() => {
    api.get('/profiles/me/stats').then((res) => {
      setStats(res.data)
      if (user) setUser({ ...user, stats: res.data })
    }).catch(() => {})
  }, [])

  const age = user?.birthdate
    ? new Date().getFullYear() - new Date(user.birthdate).getFullYear()
    : null

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await api.post('/profiles/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUser({ ...user!, photos: res.data.photos })
      toast.success('Photo updated!')
    } catch {
      toast.error('Failed to upload photo')
    }
  }, [user, setUser])

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 1 })

  const saveBio = async () => {
    setSaving(true)
    try {
      await api.patch('/profiles/me', { bio })
      setUser({ ...user!, bio })
      setEditing(false)
      toast.success('Bio updated')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveInterests = async () => {
    try {
      await api.patch('/profiles/me', { interests })
      setUser({ ...user!, interests })
      setEditingInterests(false)
      toast.success('Interests updated')
    } catch {
      toast.error('Failed to save')
    }
  }

  const toggleInterest = (item: string) => {
    setInterests((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item])
  }

  const handleLogout = () => {
    clearAuth()
    router.push('/')
    toast.success('Signed out')
  }

  return (
    <PageWrapper>
    <div className="min-h-screen pb-32">
      {/* Header cover */}
      <div className="h-40 bg-gradient-luxury relative">
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => router.push('/settings')} className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-cream-100 hover:bg-white/30 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-cream-100 hover:bg-white/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-6 -mt-16 relative z-10">
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-cream-100 dark:border-[#120608] overflow-hidden bg-gradient-luxury shadow-luxury">
            {user?.photos?.[0] ? (
              <img src={user.photos[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl font-serif font-bold text-cream-100/60">
                  {user?.name?.[0] ?? '?'}
                </span>
              </div>
            )}
          </div>
          <div {...getRootProps()} className="absolute bottom-1 right-1 w-9 h-9 bg-burgundy-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-burgundy-950 transition-colors shadow-card">
            <input {...getInputProps()} />
            <Camera className="w-4 h-4 text-cream-100" />
          </div>
        </div>

        {/* Name & info */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-burgundy-950 dark:text-cream-100">
            {user?.name}{age ? `, ${age}` : ''}
          </h1>
          {user?.city && <p className="text-burgundy-800/60 text-sm mt-1">{user.city}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Matches', value: stats?.matches, icon: Heart },
            { label: 'Likes', value: stats?.likes, icon: Star },
            { label: 'Score', value: stats != null ? `${stats.avg_score}%` : undefined, icon: Sparkles },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="card text-center py-4">
                <Icon className="w-5 h-5 text-burgundy-900 mx-auto mb-1" />
                {stat.value != null ? (
                  <p className="font-bold text-burgundy-950 dark:text-cream-100 text-lg">{stat.value}</p>
                ) : (
                  <div className="h-7 w-10 bg-burgundy-100 dark:bg-burgundy-900/30 rounded-md animate-pulse mx-auto mb-0.5" />
                )}
                <p className="text-xs text-burgundy-800/50">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Bio */}
        <div className="card-luxury mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-semibold text-burgundy-950">About me</h3>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-burgundy-800/60 hover:text-burgundy-900 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setBio(user?.bio || '') }}>
                  <X className="w-4 h-4 text-burgundy-800/60" />
                </button>
                <button onClick={saveBio} disabled={saving}>
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-burgundy-900/30 border-t-burgundy-900 rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-burgundy-900" />
                  )}
                </button>
              </div>
            )}
          </div>
          {editing ? (
            <textarea
              className="input-field resize-none min-h-[100px] text-sm"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={400}
              placeholder="Tell people about yourself..."
            />
          ) : (
            <p className="text-burgundy-800/70 text-sm leading-relaxed">
              {bio || 'Add a bio to attract better matches.'}
            </p>
          )}
        </div>

        {/* Interests */}
        <div className="card-luxury">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-semibold text-burgundy-950">Interests</h3>
            {!editingInterests ? (
              <button
                onClick={() => setEditingInterests(true)}
                className="text-burgundy-800/60 hover:text-burgundy-900 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setEditingInterests(false); setInterests(user?.interests || []) }}>
                  <X className="w-4 h-4 text-burgundy-800/60" />
                </button>
                <button onClick={saveInterests}>
                  <Check className="w-4 h-4 text-burgundy-900" />
                </button>
              </div>
            )}
          </div>

          {editingInterests ? (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {INTEREST_CATEGORIES.map((cat) => (
                <div key={cat.label}>
                  <p className="text-xs uppercase tracking-widest text-burgundy-800/40 mb-2">{cat.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map((item) => (
                      <button
                        key={item}
                        onClick={() => toggleInterest(item)}
                        className={`tag text-sm ${interests.includes(item) ? 'tag-active' : 'tag-inactive'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(user?.interests || []).map((interest) => (
                <span key={interest} className="tag tag-active text-sm">{interest}</span>
              ))}
              {(user?.interests || []).length === 0 && (
                <p className="text-sm text-burgundy-800/50">No interests added yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
    </PageWrapper>
  )
}
