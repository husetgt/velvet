'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CoverUpload() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes = await fetch('/api/upload/cover', { method: 'POST', body: fd })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')

      // Save URL to DB via settings PATCH
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverUrl: uploadData.url }),
      })
      router.refresh()
    } catch (err) {
      console.error('Cover upload error', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all disabled:opacity-60"
        title="Change cover photo"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        {uploading ? 'Uploading…' : 'Change cover'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </>
  )
}
