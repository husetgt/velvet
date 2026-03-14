'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface UserInfo {
  id: string
  displayName: string
  username: string
  bio?: string | null
  avatarUrl?: string | null
  role: string
  isCreator: boolean
  subscriptionPrice?: number | null
}

interface AccountLinkRecord {
  id: string
  requesterId: string
  targetId: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  requester: { id: string; displayName: string; username: string; avatarUrl: string | null }
  target: { id: string; displayName: string; username: string; avatarUrl: string | null }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#2a2a30]">
        <h2 className="font-bold text-white text-sm uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const introVideoInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ displayName: '', bio: '', avatarUrl: '', subscriptionPrice: '' })
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null)
  const [uploadingIntro, setUploadingIntro] = useState(false)
  const [introError, setIntroError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  // Account linker state
  const [linkUsername, setLinkUsername] = useState('')
  const [linkSending, setLinkSending] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')
  const [sentLinks, setSentLinks] = useState<AccountLinkRecord[]>([])
  const [receivedLinks, setReceivedLinks] = useState<AccountLinkRecord[]>([])
  const [acceptedLinks, setAcceptedLinks] = useState<AccountLinkRecord[]>([])

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
          setForm({
            displayName: data.user.displayName ?? '',
            bio: data.user.bio ?? '',
            avatarUrl: data.user.avatarUrl ?? '',
            subscriptionPrice: data.user.subscriptionPrice ? String(data.user.subscriptionPrice) : '',
          })
          if (data.user.introVideoUrl) setIntroVideoUrl(data.user.introVideoUrl)
          if (data.user.role === 'CREATOR') {
            fetchLinks()
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const fetchLinks = () => {
    fetch('/api/account-links/all')
      .then(r => r.json())
      .then(d => {
        if (d.sent) setSentLinks(d.sent)
        if (d.received) setReceivedLinks(d.received)
        if (d.accepted) setAcceptedLinks(d.accepted)
      })
      .catch(() => {})
  }

  const handleLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkUsername.trim()) return
    setLinkSending(true)
    setLinkError('')
    setLinkSuccess('')
    try {
      const res = await fetch('/api/account-links/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername: linkUsername.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send request')
      setLinkSuccess(`Request sent to @${linkUsername.trim()}`)
      setLinkUsername('')
      fetchLinks()
    } catch (err: unknown) {
      setLinkError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLinkSending(false)
    }
  }

  const handleAcceptLink = async (linkId: string) => {
    try {
      const res = await fetch('/api/account-links/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId }),
      })
      if (res.ok) fetchLinks()
    } catch (_) {}
  }

  const handleRejectLink = async (linkId: string) => {
    try {
      const res = await fetch('/api/account-links/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId }),
      })
      if (res.ok) fetchLinks()
    } catch (_) {}
  }

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      const newAvatarUrl = data.url
      setForm((f) => ({ ...f, avatarUrl: newAvatarUrl }))
      // Save immediately to DB
      const saveRes = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: newAvatarUrl }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok) throw new Error(saveData.error || 'Failed to save avatar')
      setUser((u) => (u ? { ...u, avatarUrl: newAvatarUrl } : u))
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleIntroVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIntro(true)
    setIntroError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/intro', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      const url = data.url
      setIntroVideoUrl(url)
      // Save to DB
      const saveRes = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ introVideoUrl: url }),
      })
      if (!saveRes.ok) {
        const sd = await saveRes.json()
        throw new Error(sd.error || 'Failed to save')
      }
    } catch (err: unknown) {
      setIntroError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingIntro(false)
      if (introVideoInputRef.current) introVideoInputRef.current.value = ''
    }
  }

  const handleRemoveIntroVideo = async () => {
    setIntroVideoUrl(null)
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ introVideoUrl: null }),
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const body: Record<string, unknown> = {
        displayName: form.displayName,
        bio: form.bio || null,
        avatarUrl: form.avatarUrl || null,
      }
      if (user?.isCreator && form.subscriptionPrice) {
        body.subscriptionPrice = parseFloat(form.subscriptionPrice)
      }
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save settings')
      setSuccess(true)
      setUser((u) => (u ? { ...u, ...data.user } : u))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[#8888a0] text-sm">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center text-white">
        <div className="text-[#8888a0] text-sm">Please sign in to access settings.</div>
      </div>
    )
  }

  const initials = user.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const inputCls = 'w-full rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#8888a0] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb22] transition-all px-4 py-2.5 text-sm'

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        <div className="space-y-5">
          {/* Profile section */}
          <Section title="Profile">
            {/* Avatar file upload */}
            <div className="flex items-center gap-5 mb-6">
              <div className="relative shrink-0 group">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="relative w-20 h-20 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#e040fb] focus:ring-offset-2 focus:ring-offset-[#161618]"
                  title="Change photo"
                >
                  {form.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.avatarUrl}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#2a2a30]"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                    >
                      {initials}
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? (
                      <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    )}
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </div>
              <div>
                <div className="text-white font-semibold">{user.displayName}</div>
                <div className="text-[#8888a0] text-sm">@{user.username}</div>
                <div className="text-[#8888a0] text-xs mt-0.5 capitalize">{user.role.toLowerCase()}</div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-1.5 text-xs text-[#e040fb] hover:text-[#c030e0] transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : 'Change photo'}
                </button>
              </div>
            </div>

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                ✓ Settings saved
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-wider mb-1.5">Display Name</label>
                <input
                  type="text"
                  required
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="Your display name"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-wider mb-1.5">Bio</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell people about yourself…"
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Read-only username */}
              <div>
                <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-wider mb-1.5">Username</label>
                <div className="flex items-center px-4 py-2.5 rounded-xl bg-[#1a1a1d] border border-[#2a2a30] text-[#8888a0] text-sm cursor-not-allowed">
                  @{user.username}
                  <span className="ml-auto text-[10px] text-[#3a3a44]">cannot be changed</span>
                </div>
              </div>

              {user.isCreator && (
                <div>
                  <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-wider mb-1.5">Subscription Price (USD/month)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8888a0] text-sm">$</span>
                    <input
                      type="number"
                      min="0.99"
                      step="0.01"
                      value={form.subscriptionPrice}
                      onChange={(e) => setForm((f) => ({ ...f, subscriptionPrice: e.target.value }))}
                      placeholder="9.99"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity text-sm"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </Section>

          {/* Linked Accounts (Creator only) */}
          {user.isCreator && (
            <Section title="Linked Accounts">
              <p className="text-[#8888a0] text-sm mb-4">Link your creator accounts to quickly switch between them from the sidebar.</p>

              {/* Send request */}
              <form onSubmit={handleLinkRequest} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={linkUsername}
                  onChange={e => setLinkUsername(e.target.value)}
                  placeholder="Enter username to link…"
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="submit"
                  disabled={linkSending || !linkUsername.trim()}
                  className="px-4 py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50 hover:opacity-90 transition-opacity shrink-0"
                  style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                >
                  {linkSending ? '…' : 'Send Request'}
                </button>
              </form>
              {linkSuccess && <p className="text-green-400 text-xs mb-3">{linkSuccess}</p>}
              {linkError && <p className="text-red-400 text-xs mb-3">{linkError}</p>}

              {/* Pending received */}
              {receivedLinks.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-[#8888a0] uppercase tracking-wider mb-2">Pending Requests</h4>
                  <div className="space-y-2">
                    {receivedLinks.map(link => (
                      <div key={link.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a1d] border border-[#2a2a30]">
                        <div>
                          <span className="text-white text-sm font-semibold">{link.requester.displayName}</span>
                          <span className="text-[#8888a0] text-xs ml-1.5">@{link.requester.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptLink(link.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectLink(link.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-[#8888a0] border border-[#2a2a30] hover:text-red-400 hover:border-red-500/40 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending sent */}
              {sentLinks.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-[#8888a0] uppercase tracking-wider mb-2">Sent Requests</h4>
                  <div className="space-y-2">
                    {sentLinks.map(link => (
                      <div key={link.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a1d] border border-[#2a2a30]">
                        <div>
                          <span className="text-white text-sm font-semibold">{link.target.displayName}</span>
                          <span className="text-[#8888a0] text-xs ml-1.5">@{link.target.username}</span>
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Pending</span>
                        </div>
                        <button
                          onClick={() => handleRejectLink(link.id)}
                          className="text-xs text-[#8888a0] hover:text-red-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted */}
              {acceptedLinks.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#8888a0] uppercase tracking-wider mb-2">Linked Accounts</h4>
                  <div className="space-y-2">
                    {acceptedLinks.map(link => {
                      const other = link.requesterId === user.id ? link.target : link.requester
                      const otherInitials = other.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                      return (
                        <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a1d] border border-[#2a2a30]">
                          {other.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={other.avatarUrl} alt={other.displayName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
                              {otherInitials}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-white text-sm font-semibold">{other.displayName}</span>
                            <span className="text-[#8888a0] text-xs ml-1.5">@{other.username}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Linked</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {sentLinks.length === 0 && receivedLinks.length === 0 && acceptedLinks.length === 0 && (
                <p className="text-[#555568] text-xs text-center py-4">No linked accounts yet</p>
              )}
            </Section>
          )}

          {/* Intro Video (Creator only) */}
          {user.isCreator && (
            <Section title="Intro Video">
              <p className="text-[#8888a0] text-sm mb-4">
                Upload a short intro video (max 60s) that appears on your profile and in the Discover feed.
              </p>
              {introError && (
                <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{introError}</div>
              )}
              {introVideoUrl ? (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-w-sm">
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                      src={introVideoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => introVideoInputRef.current?.click()}
                      disabled={uploadingIntro}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white border border-[#2a2a30] hover:border-[#e040fb44] transition-all disabled:opacity-50"
                    >
                      {uploadingIntro ? 'Uploading…' : 'Replace video'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveIntroVideo}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-[#8888a0] hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => introVideoInputRef.current?.click()}
                  disabled={uploadingIntro}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity text-sm"
                  style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  {uploadingIntro ? 'Uploading…' : 'Upload intro video'}
                </button>
              )}
              <input
                ref={introVideoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleIntroVideoChange}
              />
            </Section>
          )}

          {/* Account section */}
          <Section title="Account">
            <div className="space-y-3">
              <p className="text-[#8888a0] text-sm">Manage your account access.</p>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[#8888a0] border border-[#2a2a30] hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
