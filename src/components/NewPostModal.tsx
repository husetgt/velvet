'use client'

import { useState, useRef, useCallback } from 'react'

interface NewPostModalProps {
  onClose: () => void
  onPosted?: () => void
}

export default function NewPostModal({ onClose, onPosted }: NewPostModalProps) {
  const [caption, setCaption] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [audience, setAudience] = useState<'subscribers' | 'everyone' | 'followers'>('subscribers')
  const [ppvEnabled, setPpvEnabled] = useState(false)
  const [ppvPrice, setPpvPrice] = useState('5')
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles)
    setFiles(prev => {
      const combined = [...prev, ...arr]
      // Generate previews
      arr.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviews(p => [...p, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })
      return combined
    })
  }, [])

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  const handleSubmit = async () => {
    if (!caption.trim() && files.length === 0) return
    setPosting(true)
    setError('')
    try {
      let mediaUrls: string[] = []

      // Upload media files first
      if (files.length > 0) {
        setUploading(true)
        const formData = new FormData()
        files.forEach(f => formData.append('files', f))
        const uploadRes = await fetch('/api/upload/media', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')
        mediaUrls = uploadData.urls
        setUploading(false)
      }

      const lines = caption.trim().split('\n')
      const title = lines[0]?.slice(0, 120) || null

      const body: Record<string, unknown> = {
        title,
        content: caption.trim(),
        mediaUrls,
        isLocked: ppvEnabled,
        price: ppvEnabled ? parseFloat(ppvPrice) : null,
        audience,
      }

      if (scheduleEnabled && scheduleDate && scheduleTime) {
        body.scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      }

      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post')

      onPosted?.()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPosting(false)
      setUploading(false)
    }
  }

  const canPost = caption.trim().length > 0 || files.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-2xl rounded-none sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#161618', maxHeight: '100dvh', height: '100dvh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a30] shrink-0">
          <h2 className="text-lg font-bold text-white">New Post</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8888a0] hover:text-white hover:bg-[#2a2a30] transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          {/* Section 1 — Media upload */}
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center py-10 gap-3"
              style={{
                borderColor: dragOver ? '#e040fb' : '#2a2a30',
                background: dragOver ? 'rgba(224,64,251,0.05)' : 'rgba(255,255,255,0.02)',
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(224,64,251,0.12)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#e040fb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-white text-sm font-semibold">Drag and drop or click to upload</p>
                <p className="text-[#8888a0] text-xs mt-0.5">Images and videos supported</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files) addFiles(e.target.files) }}
              />
            </div>

            {/* Previews */}
            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    {files[i]?.type.startsWith('video/') ? (
                      <video src={src} className="w-full h-full object-cover" muted />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-3 h-3">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload from vault */}
            <button
              disabled
              className="mt-2 text-xs text-[#555568] border border-[#2a2a30] rounded-lg px-3 py-1.5 cursor-not-allowed opacity-50"
            >
              Upload from vault (coming soon)
            </button>
          </div>

          {/* Section 2 — Caption */}
          <div>
            <div className="relative">
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                className="w-full rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb22] transition-all px-4 py-3 text-sm resize-none"
                maxLength={2000}
              />
              <span className="absolute bottom-3 right-3 text-[10px] text-[#555568]">{caption.length}/2000</span>
            </div>
          </div>

          {/* Section 3 — Audience */}
          <div>
            <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-wider mb-2">Who can see this?</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as typeof audience)}
              className="w-full rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb22] transition-all px-4 py-2.5 text-sm"
            >
              <option value="subscribers">My subscribers</option>
              <option value="everyone">Everyone</option>
              <option value="followers">Followers only</option>
            </select>
          </div>

          {/* Section 4 — PPV */}
          <div className="rounded-xl border border-[#2a2a30] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-semibold">Pay to view</p>
                <p className="text-[#8888a0] text-xs mt-0.5">Fans pay to unlock this post</p>
              </div>
              <button
                onClick={() => setPpvEnabled(v => !v)}
                className="relative w-11 h-6 rounded-full transition-all"
                style={{ background: ppvEnabled ? 'linear-gradient(135deg, #e040fb, #7c4dff)' : '#2a2a30' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                  style={{ transform: ppvEnabled ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>
            {ppvEnabled && (
              <div className="mt-3 flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888a0] text-sm font-semibold">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={ppvPrice}
                    onChange={(e) => setPpvPrice(e.target.value)}
                    className="w-full rounded-xl bg-[#1a1a1d] border border-[#2a2a30] text-white focus:outline-none focus:border-[#e040fb] px-4 py-2 text-sm pl-7"
                  />
                </div>
                <span className="text-[#8888a0] text-xs">Fans pay this to unlock the post</span>
              </div>
            )}
          </div>

          {/* Section 5 — Schedule */}
          <div className="rounded-xl border border-[#2a2a30] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-semibold">Schedule post</p>
                <p className="text-[#8888a0] text-xs mt-0.5">Publish at a specific date &amp; time</p>
              </div>
              <button
                onClick={() => setScheduleEnabled(v => !v)}
                className="relative w-11 h-6 rounded-full transition-all"
                style={{ background: scheduleEnabled ? 'linear-gradient(135deg, #e040fb, #7c4dff)' : '#2a2a30' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                  style={{ transform: scheduleEnabled ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>
            {scheduleEnabled && (
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="flex-1 rounded-xl bg-[#1a1a1d] border border-[#2a2a30] text-white focus:outline-none focus:border-[#e040fb] px-4 py-2 text-sm"
                />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="flex-1 rounded-xl bg-[#1a1a1d] border border-[#2a2a30] text-white focus:outline-none focus:border-[#e040fb] px-4 py-2 text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer — submit */}
        <div className="px-6 py-4 border-t border-[#2a2a30] shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!canPost || posting}
            className="w-full py-3 rounded-2xl font-bold text-white text-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
          >
            {posting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {uploading ? 'Uploading media…' : 'Posting…'}
              </>
            ) : scheduleEnabled && scheduleDate ? 'Schedule Post' : 'Post Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
