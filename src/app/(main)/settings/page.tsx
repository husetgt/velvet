'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '@/components/AppSidebar'

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
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ displayName: '', bio: '', avatarUrl: '', subscriptionPrice: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

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
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

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
      <div className="flex min-h-screen bg-[#0d0d0f]">
        <div className="w-60 shrink-0 bg-[#111113]" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-[#8888a0] text-sm">Loading…</div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-[#0d0d0f] text-white items-center justify-center">
        <div className="text-[#8888a0] text-sm">Please sign in to access settings.</div>
      </div>
    )
  }

  const inputCls = 'w-full rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#8888a0] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb22] transition-all px-4 py-2.5 text-sm'

  return (
    <div className="flex min-h-screen bg-[#0d0d0f] text-white">
      <AppSidebar
        user={{ displayName: user.displayName, username: user.username, role: user.role, avatarUrl: user.avatarUrl }}
        activePath="/settings"
      />

      <main className="flex-1 overflow-auto">
        <div className="max-w-xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-8">Settings</h1>

          <div className="space-y-5">
            {/* Profile section */}
            <Section title="Profile">
              {/* Avatar preview */}
              <div className="flex items-center gap-4 mb-6">
                <div className="shrink-0">
                  {form.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.avatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#2a2a30]"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                    >
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-white font-semibold">{user.displayName}</div>
                  <div className="text-[#8888a0] text-sm">@{user.username}</div>
                  <div className="text-[#8888a0] text-xs mt-0.5 capitalize">{user.role.toLowerCase()}</div>
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

                <div>
                  <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-wider mb-1.5">Avatar URL</label>
                  <input
                    type="url"
                    value={form.avatarUrl}
                    onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                    placeholder="https://example.com/avatar.jpg"
                    className={inputCls}
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
      </main>
    </div>
  )
}
