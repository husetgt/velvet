'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface Props {
  username: string
  introVideoUrl: string | null
  isOwnProfile: boolean
  coverUrl: string | null
}

export default function ProfileIntroPanel({ username, introVideoUrl, isOwnProfile, coverUrl }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [localVideoUrl, setLocalVideoUrl] = useState(introVideoUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/intro', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      const url = data.url
      setLocalVideoUrl(url)
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ introVideoUrl: url }),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <aside className="hidden xl:flex flex-col w-[300px] shrink-0 bg-[#0a0a0c] border-l border-[#1e1e21] sticky top-0 h-screen overflow-hidden">
      {/* 3-dot menu */}
      <div className="absolute top-3 right-3 z-10">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 w-44 rounded-xl border border-[#2a2a30] overflow-hidden shadow-2xl z-20" style={{ background: '#1a1a1d' }}>
              {isOwnProfile && (
                <button
                  onClick={() => { setMenuOpen(false); fileInputRef.current?.click() }}
                  className="w-full text-left px-4 py-2.5 text-xs text-[#8888a0] hover:text-white hover:bg-[#2a2a30] transition-colors"
                >
                  {localVideoUrl ? 'Replace intro video' : 'Upload intro video'}
                </button>
              )}
              {isOwnProfile && localVideoUrl && (
                <button
                  onClick={async () => {
                    setMenuOpen(false)
                    setLocalVideoUrl(null)
                    await fetch('/api/settings', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ introVideoUrl: null }),
                    })
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-[#2a2a30] transition-colors"
                >
                  Remove video
                </button>
              )}
              <Link
                href={`/${username}`}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-xs text-[#8888a0] hover:text-white hover:bg-[#2a2a30] transition-colors"
              >
                View profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Video / cover */}
      <div className="relative flex-1 bg-black overflow-hidden">
        {localVideoUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={localVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #2a0a2e, #1a0a3a, #0d0d0f)' }} />
        )}

        {/* Dark gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Placeholder CTA for creator with no video */}
        {!localVideoUrl && isOwnProfile && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-dashed border-[#e040fb44] hover:border-[#e040fb88] transition-all"
              style={{ background: 'rgba(224,64,251,0.06)' }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                )}
              </div>
              <div className="text-center">
                <p className="text-white text-sm font-semibold">{uploading ? 'Uploading…' : 'Add intro video'}</p>
                <p className="text-[#8888a0] text-xs mt-0.5">Short clip, max 60s</p>
              </div>
            </button>
          </div>
        )}

        {/* Watermark */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <p className="text-center text-white/60 text-xs font-medium">
            velvetfan.com/@{username}
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleUpload}
      />
    </aside>
  )
}
