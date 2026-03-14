'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── Creator notifications ─────────────────────────────────────────────────
type CreatorNotifType = 'subscription' | 'tip' | 'unlock'

type CreatorNotifItem = {
  id: string
  type: CreatorNotifType
  user: { id: string; displayName: string; username: string; avatarUrl: string | null }
  amount?: number
  description: string
  createdAt: string
}

// ── Fan notifications ─────────────────────────────────────────────────────
type FanNotifType = 'newpost' | 'message' | 'renewal'

type FanNotifItem = {
  id: string
  type: FanNotifType
  user: { id: string; displayName: string; username: string; avatarUrl: string | null }
  description: string
  createdAt: string
}

type CreatorFilterTab = 'all' | CreatorNotifType
type FanFilterTab = 'all' | FanNotifType

const CREATOR_FILTER_TABS: { id: CreatorFilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'subscription', label: 'Subscriptions' },
  { id: 'tip', label: 'Tips' },
  { id: 'unlock', label: 'Purchases' },
]

const FAN_FILTER_TABS: { id: FanFilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'newpost', label: 'New Posts' },
  { id: 'message', label: 'Messages' },
  { id: 'renewal', label: 'Renewals' },
]

const CREATOR_TYPE_COLORS: Record<CreatorNotifType, string> = {
  subscription: '#4ade80',
  tip: '#e040fb',
  unlock: '#7c4dff',
}

const FAN_TYPE_COLORS: Record<FanNotifType, string> = {
  newpost: '#e040fb',
  message: '#4ade80',
  renewal: '#7c4dff',
}

const CREATOR_TYPE_ICONS: Record<CreatorNotifType, React.ReactNode> = {
  subscription: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  tip: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  unlock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  ),
}

const FAN_TYPE_ICONS: Record<FanNotifType, React.ReactNode> = {
  newpost: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  renewal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function NotifRow({ user, color, icon, description, amount, createdAt, linkHref }: {
  user: { displayName: string; avatarUrl: string | null }
  color: string
  icon: React.ReactNode
  description: string
  amount?: number
  createdAt: string
  linkHref?: string
}) {
  const initials = getInitials(user.displayName)
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-[#161618] transition-colors group">
      <div className="relative shrink-0">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt={user.displayName} className="w-11 h-11 rounded-full object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${color}66, ${color}33)`, border: `1px solid ${color}44` }}>
            {initials}
          </div>
        )}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0d0d0f]" style={{ background: color, color: 'white' }}>
          <div style={{ transform: 'scale(0.7)' }}>{icon}</div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white leading-snug">
          <span className="font-bold">{user.displayName}</span>
          {' '}
          <span className="text-[#b0b0c8]">{description}</span>
        </p>
        <p className="text-[#555568] text-xs mt-0.5">{formatRelative(createdAt)}</p>
      </div>
      {amount !== undefined && (
        <span className="text-sm font-bold shrink-0" style={{ color }}>
          +${amount.toFixed(2)}
        </span>
      )}
      {linkHref && (
        <Link
          href={linkHref}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#555568] hover:text-white hover:bg-[#2a2a30] transition-all opacity-0 group-hover:opacity-100 shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </Link>
      )}
    </div>
  )
}

interface Props {
  notifications: CreatorNotifItem[]
  isCreator: boolean
  fanNotifications: FanNotifItem[] | null
}

export default function NotificationsClient({ notifications, isCreator, fanNotifications }: Props) {
  const [activeCreatorFilter, setActiveCreatorFilter] = useState<CreatorFilterTab>('all')
  const [activeFanFilter, setActiveFanFilter] = useState<FanFilterTab>('all')

  if (isCreator) {
    const filtered = activeCreatorFilter === 'all' ? notifications : notifications.filter(n => n.type === activeCreatorFilter)

    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
          </div>

          <div className="flex items-center gap-1 mb-6 flex-wrap">
            {CREATOR_FILTER_TABS.map(tab => {
              const count = tab.id === 'all' ? notifications.length : notifications.filter(n => n.type === tab.id).length
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCreatorFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${activeCreatorFilter === tab.id ? 'text-white' : 'text-[#8888a0] border border-[#2a2a30] hover:text-white hover:border-[#e040fb44]'}`}
                  style={activeCreatorFilter === tab.id ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)', border: 'none' } : {}}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeCreatorFilter === tab.id ? 'bg-white/20' : 'bg-[#2a2a30]'}`}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.1), rgba(124,77,255,0.1))', border: '1px solid rgba(224,64,251,0.2)' }}>
                <svg className="w-9 h-9 text-[#e040fb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{activeCreatorFilter === 'all' ? "You're all caught up" : `No ${activeCreatorFilter} notifications`}</h2>
              <p className="text-[#8888a0] text-sm max-w-xs leading-relaxed">New subscribers, tips, and post purchases will appear here.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(notif => (
                <NotifRow
                  key={notif.id}
                  user={notif.user}
                  color={CREATOR_TYPE_COLORS[notif.type]}
                  icon={CREATOR_TYPE_ICONS[notif.type]}
                  description={notif.description}
                  amount={notif.amount}
                  createdAt={notif.createdAt}
                  linkHref="/messages"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Fan view ───────────────────────────────────────────────────────────
  const fanNotifs = fanNotifications ?? []
  const filteredFan = activeFanFilter === 'all' ? fanNotifs : fanNotifs.filter(n => n.type === activeFanFilter)

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
        </div>

        <div className="flex items-center gap-1 mb-6 flex-wrap">
          {FAN_FILTER_TABS.map(tab => {
            const count = tab.id === 'all' ? fanNotifs.length : fanNotifs.filter(n => n.type === tab.id).length
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFanFilter(tab.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${activeFanFilter === tab.id ? 'text-white' : 'text-[#8888a0] border border-[#2a2a30] hover:text-white hover:border-[#e040fb44]'}`}
                style={activeFanFilter === tab.id ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)', border: 'none' } : {}}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeFanFilter === tab.id ? 'bg-white/20' : 'bg-[#2a2a30]'}`}>{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {filteredFan.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.1), rgba(124,77,255,0.1))', border: '1px solid rgba(224,64,251,0.2)' }}>
              <svg className="w-9 h-9 text-[#e040fb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{activeFanFilter === 'all' ? "You're all caught up" : `No ${activeFanFilter === 'newpost' ? 'new post' : activeFanFilter} notifications`}</h2>
            <p className="text-[#8888a0] text-sm max-w-xs leading-relaxed">Activity from creators you follow or subscribe to will appear here.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredFan.map(notif => (
              <NotifRow
                key={notif.id}
                user={notif.user}
                color={FAN_TYPE_COLORS[notif.type]}
                icon={FAN_TYPE_ICONS[notif.type]}
                description={notif.description}
                createdAt={notif.createdAt}
                linkHref={notif.type === 'message' ? '/messages' : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
