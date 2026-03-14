'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Post {
  id: string
  title: string | null
  content: string
  isLocked: boolean
  price: number | null
  likesCount: number
  createdAt: string
}

interface User {
  id: string
  displayName: string
  username: string
  role: string
  creditBalance: number
  subscriberCount: number
  posts: Post[]
}

export default function DashboardClient({ user }: { user: User }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'posts' | 'create' | 'stats'>('posts')
  const [form, setForm] = useState({
    title: '', content: '', mediaUrls: '', isLocked: false, price: '',
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState(false)

  const isCreator = user.role === 'CREATOR'

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    setCreateSuccess(false)
    try {
      const mediaUrls = form.mediaUrls
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean)

      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title || undefined,
          content: form.content,
          mediaUrls,
          isLocked: form.isLocked,
          price: form.price ? parseFloat(form.price) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create post')
      setCreateSuccess(true)
      setForm({ title: '', content: '', mediaUrls: '', isLocked: false, price: '' })
      router.refresh()
    } catch (err: any) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const tabs = [
    { id: 'posts', label: 'Posts' },
    ...(isCreator ? [{ id: 'create', label: 'Create Post' }] : []),
    { id: 'stats', label: 'Stats' },
  ] as const

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      {/* Sidebar layout */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-60 border-r border-[#2a2a30] bg-[#161618] flex flex-col shrink-0">
          <div className="p-6 border-b border-[#2a2a30]">
            <Link href="/" className="velvet-gradient-text text-xl font-bold">Velvet</Link>
          </div>

          {/* Account info */}
          <div className="p-4 border-b border-[#2a2a30]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}>
                {user.displayName.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{user.displayName}</div>
                <div className="text-xs text-[#8888a0]">@{user.username}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1e1e21]">
              <span className="w-1.5 h-1.5 rounded-full" style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}} />
              <span className="text-xs velvet-gradient-text font-semibold">
                ${(user.creditBalance / 100).toFixed(2)} credits
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="p-3 flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-all ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-[#8888a0] hover:text-white hover:bg-[#1e1e21]'
                }`}
                style={activeTab === tab.id ? {background: 'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))', color: '#e040fb'} : {}}
              >
                {tab.label}
              </button>
            ))}

            <Link
              href="/credits"
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[#8888a0] hover:text-white hover:bg-[#1e1e21] transition-all block mt-1"
            >
              Add Credits
            </Link>

            {isCreator && (
              <Link
                href={`/${user.username}`}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[#8888a0] hover:text-white hover:bg-[#1e1e21] transition-all block mt-1"
              >
                View Profile →
              </Link>
            )}
          </nav>

          {/* Sign out */}
          <div className="p-4 border-t border-[#2a2a30]">
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#555568] hover:text-[#8888a0] transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">
                {activeTab === 'create' ? 'Create Post' : activeTab === 'stats' ? 'Analytics' : 'Your Posts'}
              </h1>
            </div>

            {/* Posts tab */}
            {activeTab === 'posts' && (
              <div className="space-y-3">
                {user.posts.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-[#2a2a30] rounded-2xl">
                    <p className="text-[#8888a0] mb-4">No posts yet</p>
                    {isCreator && (
                      <button
                        onClick={() => setActiveTab('create')}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                        style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}
                      >
                        Create your first post
                      </button>
                    )}
                  </div>
                ) : (
                  user.posts.map(post => (
                    <div key={post.id} className="p-4 rounded-xl border border-[#2a2a30] bg-[#161618] hover:border-[#e040fb22] transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {post.title && <div className="font-semibold text-white text-sm mb-1">{post.title}</div>}
                          <p className="text-[#8888a0] text-sm truncate">{post.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-[#555568]">
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            <span>♥ {post.likesCount}</span>
                            {post.isLocked && <span className="text-[#e040fb]">Premium{post.price ? ` · $${post.price.toFixed(2)}` : ''}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Create post tab */}
            {activeTab === 'create' && isCreator && (
              <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] p-6">
                {createSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    Post created successfully!
                  </div>
                )}
                {createError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {createError}
                  </div>
                )}

                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Title (optional)</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Post title"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb33] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Content *</label>
                    <textarea
                      required
                      rows={5}
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      placeholder="Share something with your fans..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb33] transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Media URLs (one per line)</label>
                    <textarea
                      rows={2}
                      value={form.mediaUrls}
                      onChange={e => setForm(f => ({ ...f, mediaUrls: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb33] transition-all resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-4 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isLocked}
                        onChange={e => setForm(f => ({ ...f, isLocked: e.target.checked }))}
                        className="w-4 h-4 rounded border-[#2a2a30] bg-[#1e1e21] accent-[#e040fb]"
                      />
                      <span className="text-sm text-[#8888a0]">Premium / Locked</span>
                    </label>

                    {form.isLocked && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#8888a0]">Price $</span>
                        <input
                          type="number"
                          min="0.99"
                          step="0.01"
                          value={form.price}
                          onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                          placeholder="4.99"
                          className="w-24 px-3 py-2 rounded-lg bg-[#1e1e21] border border-[#2a2a30] text-white text-sm placeholder-[#555568] focus:outline-none focus:border-[#e040fb] transition-all"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                    style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}
                  >
                    {creating ? 'Publishing...' : 'Publish Post'}
                  </button>
                </form>
              </div>
            )}

            {/* Stats tab */}
            {activeTab === 'stats' && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Subscribers', value: user.subscriberCount.toLocaleString() },
                  { label: 'Total Posts', value: user.posts.length.toString() },
                  { label: 'Credit Balance', value: `$${(user.creditBalance / 100).toFixed(2)}` },
                  { label: 'Locked Posts', value: user.posts.filter(p => p.isLocked).length.toString() },
                ].map(stat => (
                  <div key={stat.label} className="p-6 rounded-2xl border border-[#2a2a30] bg-[#161618]">
                    <div className="text-3xl font-bold velvet-gradient-text mb-1">{stat.value}</div>
                    <div className="text-sm text-[#8888a0]">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
