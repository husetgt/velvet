'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface CreatorInfo {
  id: string
  displayName: string
  username: string
  avatarUrl: string | null
  bio: string | null
  subscriptionPrice: number | null
}

interface FollowEntry {
  id: string
  creatorId: string
  createdAt: string
  creator: CreatorInfo
}

interface SubscriptionEntry {
  id: string
  creatorId: string
  status: string
  createdAt: string
  creator: CreatorInfo & { _count?: { subscribers: number } }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function CreatorCard({ creator, badge, actions }: {
  creator: CreatorInfo & { _count?: { subscribers: number } }
  badge?: React.ReactNode
  actions: React.ReactNode
}) {
  const initials = getInitials(creator.displayName)
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-[#2a2a30] bg-[#161618] hover:border-[#e040fb22] transition-all">
      <div className="shrink-0">
        {creator.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creator.avatarUrl} alt={creator.displayName} className="w-14 h-14 rounded-full object-cover border-2 border-[#2a2a30]" />
        ) : (
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
            {initials}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-white text-sm truncate">{creator.displayName}</span>
          {badge}
        </div>
        <p className="text-[#8888a0] text-xs">@{creator.username}</p>
        {creator.bio && <p className="text-[#8888a0] text-xs mt-1 truncate">{creator.bio}</p>}
        {creator._count && (
          <p className="text-[#555568] text-[10px] mt-1">{creator._count.subscribers.toLocaleString()} subscribers</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
      </div>
    </div>
  )
}

export default function FollowingPage() {
  const [activeTab, setActiveTab] = useState<'following' | 'subscriptions'>('following')
  const [follows, setFollows] = useState<FollowEntry[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [unfollowingIds, setUnfollowingIds] = useState<Set<string>>(new Set())

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [followsRes, subsRes] = await Promise.all([
        fetch('/api/follow'),
        fetch('/api/subscriptions/my'),
      ])
      const followsData = await followsRes.json()
      const subsData = await subsRes.json()
      if (followsData.follows) setFollows(followsData.follows)
      if (subsData.subscriptions) setSubscriptions(subsData.subscriptions)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleUnfollow = async (creatorId: string) => {
    setUnfollowingIds(prev => new Set([...prev, creatorId]))
    try {
      await fetch('/api/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId }),
      })
      setFollows(prev => prev.filter(f => f.creatorId !== creatorId))
    } finally {
      setUnfollowingIds(prev => { const s = new Set(prev); s.delete(creatorId); return s })
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Following</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-[#2a2a30]">
          {([
            { id: 'following', label: 'Following', count: follows.length },
            { id: 'subscriptions', label: 'Subscriptions', count: subscriptions.length },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold transition-all relative flex items-center gap-2 ${
                activeTab === tab.id ? 'text-white' : 'text-[#8888a0] hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'text-white' : 'text-[#8888a0]'}`} style={activeTab === tab.id ? { background: 'linear-gradient(135deg, rgba(224,64,251,0.3), rgba(124,77,255,0.3))' } : { background: '#2a2a30' }}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }} />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-[#e040fb] border-t-transparent animate-spin" />
          </div>
        ) : activeTab === 'following' ? (
          follows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.1), rgba(124,77,255,0.1))', border: '1px solid rgba(224,64,251,0.2)' }}>
                <svg className="w-9 h-9 text-[#e040fb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Not following anyone yet</h2>
              <p className="text-[#8888a0] text-sm max-w-xs leading-relaxed mb-8">Follow creators to see their free posts in your feed.</p>
              <Link href="/explore" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Discover creators
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {follows.map(follow => (
                <CreatorCard
                  key={follow.id}
                  creator={follow.creator}
                  actions={
                    <>
                      <Link href={`/${follow.creator.username}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8888a0] border border-[#2a2a30] hover:text-white hover:border-[#e040fb44] transition-all">
                        View
                      </Link>
                      <button
                        onClick={() => handleUnfollow(follow.creatorId)}
                        disabled={unfollowingIds.has(follow.creatorId)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8888a0] border border-[#2a2a30] hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-50"
                      >
                        {unfollowingIds.has(follow.creatorId) ? '…' : 'Unfollow'}
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          )
        ) : (
          subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.1), rgba(124,77,255,0.1))', border: '1px solid rgba(224,64,251,0.2)' }}>
                <svg className="w-9 h-9 text-[#e040fb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No active subscriptions</h2>
              <p className="text-[#8888a0] text-sm max-w-xs leading-relaxed mb-8">Subscribe to creators to unlock exclusive content.</p>
              <Link href="/explore" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
                Discover creators
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map(sub => {
                const price = sub.creator.subscriptionPrice ? Number(sub.creator.subscriptionPrice) : null
                return (
                  <CreatorCard
                    key={sub.id}
                    creator={sub.creator}
                    badge={price ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.1), rgba(124,77,255,0.1))', border: '1px solid rgba(224,64,251,0.2)', color: '#e040fb' }}>
                        ${price.toFixed(2)}/mo
                      </span>
                    ) : undefined}
                    actions={
                      <Link href={`/${sub.creator.username}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8888a0] border border-[#2a2a30] hover:text-white hover:border-[#e040fb44] transition-all">
                        View
                      </Link>
                    }
                  />
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
