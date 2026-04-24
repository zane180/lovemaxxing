'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Heart, Camera, Check, ArrowRight, ArrowLeft, Sparkles, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { INTEREST_CATEGORIES, FACE_FEATURES, VIBE_OPTIONS } from '@/lib/constants'

const STEPS = ['interests', 'vibe', 'photos', 'face-type', 'bio'] as const
type Step = typeof STEPS[number]

export default function OnboardingPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [step, setStep] = useState<Step>('interests')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [faceFeatures, setFaceFeatures] = useState<Record<string, string>>({})
  const [typePreferences, setTypePreferences] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [analyzedFeatures, setAnalyzedFeatures] = useState<string[]>([])
  const [faceAnalysisDone, setFaceAnalysisDone] = useState(false)

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  // --- Interest selection ---
  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  // --- Vibe selection ---
  const toggleVibe = (vibe: string) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    )
  }

  // --- Photo upload ---
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.slice(0, 6 - photos.length)
    setPhotos((prev) => [...prev, ...newFiles])
    newFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreviews((prev) => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }, [photos])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 6,
    disabled: photos.length >= 6,
  })

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // --- Face analysis ---
  const analyzeFace = async () => {
    if (photos.length === 0) {
      toast.error('Please upload at least one photo first')
      return
    }
    setAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('photo', photos[0])
      const res = await api.post('/profiles/analyze-face', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const features = res.data.features || []
      setAnalyzedFeatures(features)
      setFaceAnalysisDone(true)
      if (features.length > 0) {
        toast.success('Face analysis complete!')
      } else {
        toast.error('No face detected. Try a clearer photo.')
        setFaceAnalysisDone(false)
      }
    } catch {
      toast.error('Analysis failed. Try a clearer photo or skip and continue.')
    } finally {
      setAnalyzing(false)
    }
  }

  // --- Toggle type preference ---
  const toggleTypePreference = (pref: string) => {
    setTypePreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    )
  }

  // --- Submit ---
  const handleFinish = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      photos.forEach((photo) => formData.append('photos', photo))
      formData.append('interests', JSON.stringify(selectedInterests))
      formData.append('vibes', JSON.stringify(selectedVibes))
      formData.append('type_preferences', JSON.stringify(typePreferences))
      formData.append('bio', bio)
      formData.append('analyzed_features', JSON.stringify(analyzedFeatures))

      const res = await api.post('/profiles/complete-onboarding', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUser(res.data)
      toast.success('Profile complete! Finding your matches...')
      router.push('/discover')
    } catch {
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canNext = () => {
    if (step === 'interests') return selectedInterests.length >= 3
    if (step === 'vibe') return selectedVibes.length >= 1
    if (step === 'photos') return photos.length >= 1
    if (step === 'face-type') return typePreferences.length >= 1
    if (step === 'bio') return bio.trim().length >= 20
    return false
  }

  const goNext = () => {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
    else handleFinish()
  }

  const goBack = () => {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream-100/90 backdrop-blur-sm border-b border-cream-300 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-burgundy-900 fill-burgundy-900" />
            <span className="font-serif font-bold text-burgundy-950">Lovemaxxing</span>
          </div>
          <span className="text-sm text-burgundy-800/60">{stepIndex + 1} of {STEPS.length}</span>
        </div>
        {/* Progress bar */}
        <div className="max-w-xl mx-auto mt-3">
          <div className="h-1 bg-cream-300 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-burgundy-900 rounded-full"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-6 py-8">
        <AnimatePresence mode="wait">
          {/* STEP 1: Interests */}
          {step === 'interests' && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-serif text-3xl font-bold text-burgundy-950 mb-2">What's your vibe?</h2>
              <p className="text-burgundy-800/60 mb-8">Pick at least 3 interests. These shape who we show you.</p>
              <div className="space-y-6">
                {INTEREST_CATEGORIES.map((cat) => (
                  <div key={cat.label}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-burgundy-800/40 mb-3">{cat.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map((item) => (
                        <button
                          key={item}
                          onClick={() => toggleInterest(item)}
                          className={`tag ${selectedInterests.includes(item) ? 'tag-active' : 'tag-inactive'}`}
                        >
                          {selectedInterests.includes(item) && <Check className="w-3 h-3 inline mr-1" />}
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-burgundy-800/40">
                {selectedInterests.length} selected {selectedInterests.length < 3 && `(need ${3 - selectedInterests.length} more)`}
              </p>
            </motion.div>
          )}

          {/* STEP 2: Vibe / Humor */}
          {step === 'vibe' && (
            <motion.div
              key="vibe"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-serif text-3xl font-bold text-burgundy-950 mb-2">Your humor & energy</h2>
              <p className="text-burgundy-800/60 mb-8">How would you describe yourself? Pick all that apply.</p>
              <div className="grid grid-cols-2 gap-3">
                {VIBE_OPTIONS.map((vibe) => (
                  <button
                    key={vibe.label}
                    onClick={() => toggleVibe(vibe.label)}
                    className={`p-4 rounded-2xl text-left transition-all duration-200 border-2 ${
                      selectedVibes.includes(vibe.label)
                        ? 'bg-burgundy-900 border-burgundy-900 text-cream-100'
                        : 'bg-white border-cream-300 text-burgundy-950 hover:border-burgundy-900/40'
                    }`}
                  >
                    <div className="text-2xl mb-2">{vibe.emoji}</div>
                    <div className="font-semibold text-sm">{vibe.label}</div>
                    <div className={`text-xs mt-1 ${selectedVibes.includes(vibe.label) ? 'text-cream-300' : 'text-burgundy-800/50'}`}>
                      {vibe.desc}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Photos */}
          {step === 'photos' && (
            <motion.div
              key="photos"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-serif text-3xl font-bold text-burgundy-950 mb-2">Add your photos</h2>
              <p className="text-burgundy-800/60 mb-8">
                Your first photo is your main photo. Add up to 6. Clear face photos get better matches.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-cream-300">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute top-2 left-2 bg-burgundy-900 text-cream-100 text-xs px-2 py-1 rounded-full">
                        Main
                      </div>
                    )}
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 6 && (
                  <div
                    {...getRootProps()}
                    className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                      isDragActive
                        ? 'border-burgundy-900 bg-burgundy-900/5'
                        : 'border-cream-400 hover:border-burgundy-900 hover:bg-cream-200'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-6 h-6 text-burgundy-800/40 mb-1" />
                    <span className="text-xs text-burgundy-800/40 text-center px-2">
                      {isDragActive ? 'Drop here' : 'Add photo'}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-burgundy-900/5 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-burgundy-900 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-burgundy-950 mb-1">Photo tips for better matches</p>
                    <ul className="text-xs text-burgundy-800/60 space-y-1">
                      <li>• Clear face shot as your first photo</li>
                      <li>• Good lighting — natural light works best</li>
                      <li>• Show your personality in other shots</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Face type preferences */}
          {step === 'face-type' && (
            <motion.div
              key="face-type"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-serif text-3xl font-bold text-burgundy-950 mb-2">What's your type?</h2>
              <p className="text-burgundy-800/60 mb-6">
                Our AI reads facial features. Tell us what you're genuinely attracted to so we can match smarter.
              </p>

              {!faceAnalysisDone ? (
                <div className="card-luxury mb-6 text-center">
                  <Sparkles className="w-8 h-8 text-gold-500 mx-auto mb-3" />
                  <h3 className="font-serif text-lg font-semibold text-burgundy-950 mb-2">Analyze Your Photo</h3>
                  <p className="text-sm text-burgundy-800/60 mb-4">
                    We'll detect your facial features so others who prefer your look get matched with you.
                  </p>
                  <button
                    onClick={analyzeFace}
                    disabled={analyzing || photos.length === 0}
                    className="btn-primary flex items-center gap-2 mx-auto"
                  >
                    {analyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-cream-100/30 border-t-cream-100 rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze My Photo
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="card-luxury mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-burgundy-950">Your features detected:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analyzedFeatures.map((f) => (
                      <span key={f} className="tag tag-active text-xs">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm font-medium text-burgundy-950 mb-4">
                Features you're attracted to: <span className="text-burgundy-800/50">(select all that apply)</span>
              </p>
              <div className="space-y-4">
                {FACE_FEATURES.map((category) => (
                  <div key={category.label}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-burgundy-800/40 mb-2">{category.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {category.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => toggleTypePreference(opt)}
                          className={`tag text-sm ${typePreferences.includes(opt) ? 'tag-active' : 'tag-inactive'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 5: Bio */}
          {step === 'bio' && (
            <motion.div
              key="bio"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-serif text-3xl font-bold text-burgundy-950 mb-2">Tell your story</h2>
              <p className="text-burgundy-800/60 mb-8">
                Write something real. Skip the clichés — this is what makes you stand out.
              </p>
              <textarea
                className="input-field resize-none min-h-[160px] text-base leading-relaxed"
                placeholder="I'm the person who..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={400}
              />
              <div className="flex justify-between mt-2">
                <p className="text-xs text-burgundy-800/40">Min 20 characters</p>
                <p className="text-xs text-burgundy-800/40">{bio.length}/400</p>
              </div>

              <div className="mt-6 p-4 bg-gold-500/10 rounded-2xl border border-gold-500/20">
                <p className="text-sm text-burgundy-950 font-medium mb-2">Prompts to inspire you:</p>
                <ul className="text-sm text-burgundy-800/60 space-y-1">
                  <li>• The most niche thing I love is...</li>
                  <li>• I'll know we're compatible if you...</li>
                  <li>• My love language is...</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-cream-300">
          <button
            onClick={goBack}
            disabled={stepIndex === 0}
            className="flex items-center gap-2 text-burgundy-800/60 hover:text-burgundy-900 transition-colors disabled:opacity-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={goNext}
            disabled={!canNext() || loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-cream-100/30 border-t-cream-100 rounded-full animate-spin" />
            ) : (
              <>
                {step === 'bio' ? 'Finish & Find Matches' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
