'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LinkedAccount {
  id: string
  displayName: string
  username: string
  avatarUrl?: string | null
}

interface AppSidebarProps {
  user: {
    displayName: string
    username: string
    role: string
    avatarUrl?: string | null
  }
  onNewPost?: () => void
}

export default function AppSidebar({ user, onNewPost }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  // Mobile: sidebar hidden by default, toggle with hamburger
  const [mobileOpen, setMobileOpen] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [accountDropOpen, setAccountDropOpen] = useState(false)
  const accountDropRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const isCreator = user.role === 'CREATOR'

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    fetch('/api/wallet/balance')
      .then((r) => r.json())
      .then((d) => { if (typeof d.balance === 'number') setWalletBalance(d.balance) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isCreator) {
      fetch('/api/account-links')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d.links)) setLinkedAccounts(d.links) })
        .catch(() => {})
    }
  }, [isCreator])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountDropRef.current && !accountDropRef.current.contains(e.target as Node)) {
        setAccountDropOpen(false)
      }
    }
    if (accountDropOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [accountDropOpen])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleSwitchAccount = (username: string) => {
    setAccountDropOpen(false)
    window.location.href = `/login?switchTo=${encodeURIComponent(username)}`
  }

  const initials = user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const balanceDollars = walletBalance !== null ? (walletBalance / 100).toFixed(0) : null

  type NavItem = { href: string; label: string; badge?: string | null; icon: React.ReactNode }

  const CREATOR_NAV_ITEMS: NavItem[] = [
    { href: '/dashboard', label: 'Home', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { href: '/dashboard?tab=content', label: 'Posts', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M3 9h18"/></svg> },
    { href: '/messages', label: 'Messages', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { href: '/notifications', label: 'Notifications', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
    { href: '/wallet', label: 'Wallet', badge: balanceDollars, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
    { href: `/${user.username}`, label: 'Profile', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ]

  const FAN_NAV_ITEMS: NavItem[] = [
    { href: '/feed', label: 'Home', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { href: '/explore', label: 'Discover', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg> },
    { href: '/notifications', label: 'Notifications', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
    { href: '/messages', label: 'Chats', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { href: '/following', label: 'Following', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { href: '/wallet', label: 'Wallet', badge: balanceDollars, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
    { href: '/profile', label: 'Profile', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ]

  const NAV_ITEMS = isCreator ? CREATOR_NAV_ITEMS : FAN_NAV_ITEMS

  const BOTTOM_ITEMS = [
    { href: '/settings', label: 'Settings', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ]

  const isNavActive = (href: string) => {
    if (href.includes('?')) {
      return pathname === href.split('?')[0]
    }
    return pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
  }

  // ─── Shared sidebar content ─────────────────────────────────────────────
  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full" style={{ background: '#111113' }}>
      {/* User profile */}
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed && !isMobile ? 'justify-center px-0' : ''}`} ref={accountDropRef}>
        <div className="relative shrink-0">
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full object-cover" /> // eslint-disable-line @next/next/no-img-element
            : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>{initials}</div>
          }
        </div>
        {(!collapsed || isMobile) && (
          <div className="min-w-0 overflow-hidden flex-1">
            <div className="text-[14px] font-bold text-white truncate leading-tight">{user.displayName}</div>
            <div className="text-[12px] text-[#8888a0] truncate mt-0.5">@{user.username}</div>
          </div>
        )}
        {(!collapsed || isMobile) && isCreator && linkedAccounts.length > 0 && (
          <div className="relative shrink-0">
            <button onClick={() => setAccountDropOpen(v => !v)} className="p-1 rounded-md text-[#8888a0] hover:text-white hover:bg-[#2a2a30] transition-all" title="Switch account">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {accountDropOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 rounded-xl border border-[#2a2a30] overflow-hidden shadow-2xl z-50" style={{ background: '#1a1a1d' }}>
                <div className="px-3 py-2 border-b border-[#2a2a30]">
                  <p className="text-[10px] text-[#8888a0] uppercase tracking-wider font-semibold">Switch account</p>
                </div>
                {linkedAccounts.map(acc => {
                  const accInitials = acc.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  return (
                    <button key={acc.id} onClick={() => handleSwitchAccount(acc.username)} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#2a2a30] transition-colors text-left">
                      {acc.avatarUrl
                        ? <img src={acc.avatarUrl} alt={acc.displayName} className="w-7 h-7 rounded-full object-cover shrink-0" /> // eslint-disable-line @next/next/no-img-element
                        : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>{accInitials}</div>
                      }
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{acc.displayName}</div>
                        <div className="text-[10px] text-[#8888a0]">@{acc.username}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mx-4 h-px bg-[#2a2a30] mb-2" />

      {/* New Post button */}
      {isCreator && (!collapsed || isMobile) && onNewPost && (
        <div className="px-3 pb-2">
          <button onClick={onNewPost} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Post
          </button>
        </div>
      )}
      {isCreator && collapsed && !isMobile && onNewPost && (
        <div className="px-2 pb-2">
          <button onClick={onNewPost} title="New Post" className="w-10 h-10 mx-auto flex items-center justify-center rounded-full text-white hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon, label, badge }) => {
          const isActive = isNavActive(href)
          return (
            <Link
              key={href}
              href={href}
              prefetch
              title={collapsed && !isMobile ? label : undefined}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg transition-all min-h-[44px] ${
                collapsed && !isMobile ? 'justify-center px-0 py-3 mx-auto w-10' : 'px-4 py-3'
              } ${isActive ? 'text-[#e040fb]' : 'text-[#8888a0] hover:text-white'}`}
              style={isActive ? { background: 'rgba(224,64,251,0.12)' } : undefined}
            >
              <span style={isActive ? { color: '#e040fb' } : undefined}>{icon}</span>
              {(!collapsed || isMobile) && (
                <span className="text-sm font-medium flex-1" style={isActive ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } : undefined}>
                  {label}
                </span>
              )}
              {(!collapsed || isMobile) && badge != null && (
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))', border: '1px solid rgba(224,64,251,0.3)', color: '#e040fb' }}>
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
              prefetch
              title={collapsed && !isMobile ? label : undefined}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg transition-all min-h-[44px] ${
                collapsed && !isMobile ? 'justify-center px-0 py-3 mx-auto w-10' : 'px-4 py-3'
              } ${isActive ? 'text-[#e040fb]' : 'text-[#8888a0] hover:text-white'}`}
              style={isActive ? { background: 'rgba(224,64,251,0.12)' } : undefined}
            >
              <span style={isActive ? { color: '#e040fb' } : undefined}>{icon}</span>
              {(!collapsed || isMobile) && (
                <span className="text-sm font-medium" style={isActive ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } : undefined}>
                  {label}
                </span>
              )}
            </Link>
          )
        })}
        <button
          onClick={handleSignOut}
          title={collapsed && !isMobile ? 'Log out' : undefined}
          className={`flex items-center gap-3 rounded-lg transition-all text-[#8888a0] hover:text-white min-h-[44px] ${
            collapsed && !isMobile ? 'justify-center px-0 py-3 mx-auto w-10' : 'w-full px-4 py-3'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {(!collapsed || isMobile) && <span className="text-sm font-medium">Log out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ─── Hamburger button (mobile only, fixed top-left) ─────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
        style={{ background: '#111113', border: '1px solid #2a2a30' }}
        aria-label="Open navigation"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* ─── Mobile overlay + drawer ─────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Dark overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-72 h-full overflow-hidden shadow-2xl" style={{ zIndex: 51 }}>
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-[#8888a0] hover:text-white hover:bg-[#2a2a30] transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            {sidebarContent(true)}
          </div>
        </div>
      )}

      {/* ─── Desktop sidebar (hidden on mobile) ─────────────────────────── */}
      <aside
        className="relative hidden lg:flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-200"
        style={{ width: collapsed ? '64px' : '240px', background: '#111113' }}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[#8888a0] hover:text-white transition-colors"
          style={{ background: '#1e1e21', border: '1px solid #2a2a30' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 transition-transform duration-200" style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        {sidebarContent(false)}
      </aside>
    </>
  )
}
