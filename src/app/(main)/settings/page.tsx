'use client'

import { useState, useEffect } from 'react'
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
  creditBalance: number
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
    subscriptionPrice: '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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
            subscriptionPrice: data.user.subscriptionPrice
              ? String(data.user.subscriptionPrice)
              : '',
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

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0d0d0f] text-white items-center justify-center">
        <div className="text-[#8888a0]">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-[#0d0d0f] text-white items-center justify-center">
        <div className="text-[#8888a0]">Please sign in to access settings.</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0d0d0f] text-white overflow-hidden">
      <AppSidebar
        user={{
          displayName: user.displayName,
          username: user.username,
          creditBalance: user.creditBalance,
          role: user.role,
        }}
        activePath="/settings"
      />

      <main className="flex-1 overflow-auto">
        <div className="max-w-xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] p-6">
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                Settings saved successfully!
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              {/* Display name */}
              <div>
                <label className="block text-sm font-medium text-[#8888a0] mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="Your display name"
                  className="w-full rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb33] transition-all px-4 py-2.5"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Bio</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell people a bit about yourself..."
                  className="w-full rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb33] transition-all px-4 py-2.5 resize-none"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-sm font-medium text-[#8888a0] mb-1.5">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={form.avatarUrl}
                  onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb33] transition-all px-4 py-2.5"
                />
                {form.avatarUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.avatarUrl}
                      alt="Avatar preview"
                      className="w-10 h-10 rounded-full object-cover border border-[#2a2a30]"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <span className="text-xs text-[#8888a0]">Preview</span>
                  </div>
                )}
              </div>

              {/* Subscription price (creator only) */}
              {user.isCreator && (
                <div>
                  <label className="block text-sm font-medium text-[#8888a0] mb-1.5">
                    Subscription Price ($/month)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8888a0] text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min="0.99"
                      step="0.01"
                      value={form.subscriptionPrice}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, subscriptionPrice: e.target.value }))
                      }
                      placeholder="9.99"
                      className="w-full rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb33] transition-all pl-8 pr-4 py-2.5"
                    />
                  </div>
                </div>
              )}

              {/* Read-only info */}
              <div className="pt-2 border-t border-[#2a2a30]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#8888a0]">Username</span>
                  <span className="text-[#555568]">@{user.username}</span>
                </div>
                <p className="text-xs text-[#555568] mt-1">Username cannot be changed.</p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
