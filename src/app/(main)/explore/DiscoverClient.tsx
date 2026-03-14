'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Creator {
  id: string
  displayName: string
  username: string
  bio: string | null
  coverUrl: string | null
  avatarUrl: string | null
  introVideoUrl: string | null
  subscriptionPrice: number | null
  subscriberCount: number
  postCount: number
  isSubscribed: boolean
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface DiscoverClientProps {
  creators: Creator[]
  currentUserId: string
}

export default function DiscoverClient({ creators: initialCreators, currentUserId }: DiscoverClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'discover' | 'search'>('discover')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [creators, setCreators] = useState(initialCreators)
  const [searchQuery, setSearchQuery] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number | null>(null)

  void currentUserId

  const filteredCreators = searchQuery.trim()
    ? creators.filter(c =>
        c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : creators

  const current = creators[currentIndex] ?? null

  const goTo = useCallback((idx: number) => {
    if (transitioning || creators.length === 0) return
    setTransitioning(true)
    const next = ((idx % creators.length) + creators.length) % creators.length
    setTimeout(() => {
      setCurrentIndex(next)
      setTransitioning(false)
    }, 350)
  }, [transitioning, creators.length])

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo])
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (activeTab !== 'discover') return
      if (e.key === 'ArrowDown') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowUp') { e.preventDefault(); goPrev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, activeTab])

  // Wheel scroll
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let lastWheel = 0
    const handler = (e: WheelEvent) => {
      if (activeTab !== 'discover') return
      e.preventDefault()
      const now = Date.now()
      if (now - lastWheel < 600) return
      lastWheel = now
      if (e.deltaY > 0) goNext()
      else goPrev()
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [goNext, goPrev, activeTab])

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return
    const dy = touchStartY.current - e.changedTouches[0].clientY
    if (Math.abs(dy) > 60) {
      if (dy > 0) goNext(); else goPrev()
    }
    touchStartY.current = null
  }

  // Auto-play video when current changes
  useEffect(() => {
    if (!videoRef.current) return
    videoRef.current.load()
    videoRef.current.play().catch(() => {})
  }, [currentIndex])

  const handleSubscribe = async (creator: Creator) => {
    router.push(`/${creator.username}`)
  }

  if (creators.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0d0d0f]">
        <p className="text-white font-semibold mb-2">No creators yet</p>
        <p className="text-[#8888a0] text-sm">Check back soon!</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden" style={{ height: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0 z-10" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-1 rounded-xl overflow-hidden border border-[#2a2a30]" style={{ background: '#111113' }}>
          {(['discover', 'search'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'text-white' : 'text-[#8888a0] hover:text-white'}`}
              style={activeTab === tab ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)' } : {}}
            >
              {tab === 'discover' ? 'Discover' : 'Search'}
            </button>
          ))}
        </div>
        {activeTab === 'discover' && creators.length > 0 && (
          <span className="text-[#8888a0] text-xs">{currentIndex + 1} / {creators.length}</span>
        )}
      </div>

      {/* ── Discover tab ──────────────────────────────────────────────────── */}
      {activeTab === 'discover' && current && (
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-black flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Centered 9:16 card — all overlays are inside this */}
          <div
            className={`relative h-full aspect-[9/16] max-w-full overflow-hidden transition-opacity duration-350 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
            style={{ transition: 'opacity 0.35s ease' }}
          >
            {/* Media */}
            {current.introVideoUrl ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                ref={videoRef}
                key={current.id}
                src={current.introVideoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : current.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.coverUrl}
                alt={current.displayName}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, #2a0a2e 0%, #1a0a3a 50%, #0d0d0f 100%)' }}
              />
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

            {/* Right side actions */}
            <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20">
              <button onClick={() => handleSubscribe(current)} className="flex flex-col items-center gap-1">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={current.isSubscribed
                    ? { background: 'linear-gradient(135deg, rgba(224,64,251,0.3), rgba(124,77,255,0.3))', border: '2px solid #e040fb' }
                    : { background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)' }
                  }
                >
                  {current.isSubscribed ? (
                    <svg className="w-5 h-5 text-[#e040fb]" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                  )}
                </div>
                <span className="text-white text-[10px] font-semibold">{current.isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
              </button>
              {current.isSubscribed && (
                <Link href={`/messages?with=${current.id}`} className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)' }}>
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <span className="text-white text-[10px] font-semibold">Message</span>
                </Link>
              )}
            </div>

            {/* Bottom overlay: creator info */}
            <div className="absolute bottom-0 left-0 right-16 p-5 z-10">
              <Link href={`/${current.username}`} className="flex items-center gap-3 mb-3 group">
                {current.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={current.avatarUrl} alt={current.displayName} className="w-12 h-12 rounded-full object-cover border-2 border-white/40 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-white/40 shrink-0" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
                    {getInitials(current.displayName)}
                  </div>
                )}
                <div>
                  <div className="text-white font-bold text-base group-hover:text-[#e040fb] transition-colors">{current.displayName}</div>
                  <div className="text-white/70 text-xs">@{current.username}</div>
                </div>
              </Link>
              <div className="flex items-center gap-3 text-white/70 text-xs mb-2">
                <span><span className="text-white font-bold">{current.subscriberCount.toLocaleString()}</span> fans</span>
                <span><span className="text-white font-bold">{current.postCount}</span> posts</span>
                {current.subscriptionPrice && (
                  <span className="text-[#e040fb] font-bold">${current.subscriptionPrice.toFixed(2)}/mo</span>
                )}
              </div>
              {current.bio && (
                <p className="text-white/80 text-xs line-clamp-2 max-w-xs">{current.bio}</p>
              )}
            </div>

            {/* Navigation arrows */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
              <button onClick={goPrev} className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
              </button>
              <button onClick={goNext} className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search tab ────────────────────────────────────────────────────── */}
      {activeTab === 'search' && (
        <div className="flex-1 overflow-auto bg-[#0d0d0f]">
          <div className="max-w-2xl mx-auto px-4 py-5">
            {/* Search input */}
            <div className="relative mb-6">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8888a0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search creators…"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#161618] border border-[#2a2a30] text-white placeholder-[#8888a0] focus:outline-none focus:border-[#e040fb44] transition-all text-sm"
              />
            </div>

            {filteredCreators.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#555568] text-sm">{searchQuery ? 'No creators found' : 'Start typing to search'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredCreators.map(creator => (
                  <Link
                    key={creator.id}
                    href={`/${creator.username}`}
                    className="group rounded-2xl overflow-hidden border border-[#2a2a30] bg-[#161618] transition-all hover:-translate-y-0.5 hover:border-[#e040fb44]"
                  >
                    {/* Cover */}
                    <div
                      className="h-20 w-full relative"
                      style={creator.coverUrl
                        ? { background: `url(${creator.coverUrl}) center/cover` }
                        : { background: 'linear-gradient(135deg, rgba(224,64,251,0.3), rgba(124,77,255,0.3))' }
                      }
                    >
                      <div className="absolute inset-0 bg-black/20" />
                    </div>
                    <div className="px-3 pb-3 pt-0">
                      <div className="relative -mt-5 mb-1.5">
                        {creator.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={creator.avatarUrl} alt={creator.displayName} className="w-10 h-10 rounded-full object-cover border-3 border-[#161618] shadow" />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-[#161618]" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
                            {getInitials(creator.displayName)}
                          </div>
                        )}
                      </div>
                      <div className="text-white text-xs font-bold truncate">{creator.displayName}</div>
                      <div className="text-[#8888a0] text-[10px] truncate">@{creator.username}</div>
                      <div className="mt-1.5 text-[10px] text-[#8888a0]">
                        <span className="text-white font-semibold">{creator.subscriberCount}</span> fans
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
