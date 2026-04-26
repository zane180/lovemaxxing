'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search } from 'lucide-react'

const GIPHY_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'dc6zaTOxFJmzC'

interface GifItem {
  id: string
  url: string
  preview: string
  title: string
}

interface Props {
  onSelect: (url: string) => void
  onClose: () => void
}

export default function GifPicker({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<GifItem[]>([])
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchGifs = async (q: string) => {
    setLoading(true)
    try {
      const endpoint = q
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=24&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=g`
      const res = await fetch(endpoint)
      const data = await res.json()
      setGifs(
        (data.data || []).map((g: any) => ({
          id: g.id,
          url: g.images.original.url,
          preview: g.images.fixed_height_small.url,
          title: g.title,
        }))
      )
    } catch {
      setGifs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGifs('')
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    debounceRef.current && clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchGifs(value), 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white dark:bg-[#1E0C10] rounded-t-3xl flex flex-col max-h-[72vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-cream-300 dark:bg-[#3D1E24]" />
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 pb-3">
          <button onClick={onClose} className="text-burgundy-800/50 hover:text-burgundy-900 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-burgundy-800/40" />
            <input
              type="text"
              placeholder="Search GIFs…"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 bg-cream-100 dark:bg-[#120608] rounded-full text-sm outline-none text-burgundy-950 dark:text-cream-100 placeholder:text-burgundy-800/40"
            />
          </div>
          <span className="text-[10px] text-burgundy-800/25 flex-shrink-0">Powered by GIPHY</span>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto flex-1 px-2 pb-safe pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-cream-300 border-t-burgundy-900 rounded-full animate-spin" />
            </div>
          ) : gifs.length === 0 ? (
            <p className="text-center text-sm text-burgundy-800/40 py-16">No GIFs found</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => onSelect(gif.url)}
                  className="aspect-square overflow-hidden rounded-xl active:opacity-60 transition-opacity"
                >
                  <img
                    src={gif.preview}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
