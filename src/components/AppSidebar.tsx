'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AppSidebarProps {
  user: {
    displayName: string
    username: string
    role: string
    avatarUrl?: string | null
  }
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/wallet/balance')
      .then((r) => r.json())
      .then((d) => { if (typeof d.balance === 'number') setWalletBalance(d.balance) })
      .catch(() => {})
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const initials = user.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const balanceDollars = walletBalance !== null ? (walletBalance / 100).toFixed(0) : null

  type NavItem = {
    href: string
    label: string
    badge?: string | null
    icon: React.ReactNode
  }

  const NAV_ITEMS: NavItem[] = [
    {
      href: '/feed',
      label: 'Home',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      href: '/explore',
      label: 'Discover',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
        </svg>
      ),
    },
    {
      href: '/notifications',
      label: 'Notifications',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
    },
    {
      href: '/messages',
      label: 'Chats',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      href: '/following',
      label: 'Following',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      href: '/wallet',
      label: 'Wallet',
      badge: balanceDollars,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
          <path d="M20 12V22H4V12"/>
          <path d="M22 7H2v5h20V7z"/>
          <path d="M12 22V7"/>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>
      ),
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ]

  const BOTTOM_ITEMS = [
    {
      href: '/settings',
      label: 'Settings',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
    },
  ]

  return (
    <aside
      className="relative flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-200"
      style={{
        width: collapsed ? '64px' : '240px',
        background: '#111113',
      }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[#8888a0] hover:text-white transition-colors"
        style={{ background: '#1e1e21', border: '1px solid #2a2a30' }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3 h-3 transition-transform duration-200"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      {/* User profile */}
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center px-0' : ''}`}>
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
          >
            {initials}
          </div>
        )}
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <div className="text-[14px] font-bold text-white truncate leading-tight">{user.displayName}</div>
            <div className="text-[12px] text-[#8888a0] truncate mt-0.5">@{user.username}</div>
          </div>
        )}
      </div>

      <div className="mx-4 h-px bg-[#2a2a30] mb-2" />

      {/* Main nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon, label, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-lg transition-all ${
                collapsed ? 'justify-center px-0 py-3 mx-auto w-10 h-10' : 'px-4 py-3'
              } ${isActive ? 'text-[#e040fb]' : 'text-[#8888a0] hover:text-white'}`}
              style={isActive ? { background: 'rgba(224,64,251,0.12)' } : undefined}
            >
              <span style={isActive ? { color: '#e040fb' } : undefined}>{icon}</span>
              {!collapsed && (
                <span
                  className="text-sm font-medium flex-1"
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, #e040fb, #7c4dff)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }
                      : undefined
                  }
                >
                  {label}
                </span>
              )}
              {!collapsed && badge !== null && badge !== undefined && (
                <span
                  className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))',
                    border: '1px solid rgba(224,64,251,0.3)',
                    color: '#e040fb',
                  }}
                >
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Settings + Log out */}
      <div className="px-2 pb-4 space-y-0.5">
        {BOTTOM_ITEMS.map(({ href, icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-lg transition-all ${
                collapsed ? 'justify-center px-0 py-3 mx-auto w-10 h-10' : 'px-4 py-3'
              } ${isActive ? 'text-[#e040fb]' : 'text-[#8888a0] hover:text-white'}`}
              style={isActive ? { background: 'rgba(224,64,251,0.12)' } : undefined}
            >
              <span style={isActive ? { color: '#e040fb' } : undefined}>{icon}</span>
              {!collapsed && (
                <span
                  className="text-sm font-medium"
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, #e040fb, #7c4dff)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }
                      : undefined
                  }
                >
                  {label}
                </span>
              )}
            </Link>
          )
        })}

        <button
          onClick={handleSignOut}
          title={collapsed ? 'Log out' : undefined}
          className={`flex items-center gap-3 rounded-lg transition-all text-[#8888a0] hover:text-white ${
            collapsed ? 'justify-center px-0 py-3 mx-auto w-10 h-10' : 'w-full px-4 py-3'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span className="text-sm font-medium">Log out</span>}
        </button>
      </div>
    </aside>
  )
}
