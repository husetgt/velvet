'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface AppNavbarProps {
  user?: {
    displayName: string
    username: string
    role: string
    avatarUrl?: string | null
  } | null
  unreadMessages?: number
  unreadNotifications?: number
}

export default function AppNavbar({ user, unreadMessages = 0, unreadNotifications = 0 }: AppNavbarProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const initials = user
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : ''

  const isCreator = user?.role === 'CREATOR' || user?.role === 'creator'

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6"
      style={{
        height: '60px',
        background: 'rgba(13,13,15,0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #2a2a30',
      }}
    >
      {/* Left: Logo */}
      <Link href="/feed">
        <span className="velvet-gradient-text text-xl font-bold tracking-tight">Velvet</span>
      </Link>

      {/* Right: Icons + Avatar */}
      <div className="flex items-center gap-2">
        {user ? (
          <>
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative flex items-center justify-center w-9 h-9 rounded-xl text-[#8888a0] hover:text-white hover:bg-[#1e1e21] transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotifications > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                >
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>

            {/* Create button (creators only) */}
            {isCreator && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create
              </Link>
            )}

            {/* Messages */}
            <Link
              href="/messages"
              className="relative flex items-center justify-center w-9 h-9 rounded-xl text-[#8888a0] hover:text-white hover:bg-[#1e1e21] transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {unreadMessages > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                >
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>

            {/* User avatar dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center justify-center w-9 h-9 rounded-full font-bold text-white text-sm hover:opacity-90 transition-opacity focus:outline-none overflow-hidden"
                style={!user.avatarUrl ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)' } : {}}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={user.displayName} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  initials
                )}
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 top-12 w-52 rounded-xl overflow-hidden shadow-2xl z-50"
                  style={{ background: '#161618', border: '1px solid #2a2a30' }}
                >
                  <div className="px-4 py-3 border-b border-[#2a2a30]">
                    <div className="text-white text-sm font-semibold truncate">{user.displayName}</div>
                    <div className="text-[#8888a0] text-xs truncate">@{user.username}</div>
                  </div>
                  <div className="py-1">
                    <Link
                      href={`/${user.username}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#b0b0c8] hover:text-white hover:bg-[#1e1e21] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#b0b0c8] hover:text-white hover:bg-[#1e1e21] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#b0b0c8] hover:text-red-400 hover:bg-[#1e1e21] transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-xl text-sm font-semibold text-[#b0b0c8] border border-[#2a2a30] hover:text-white hover:border-[#4a4a50] transition-all"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
            >
              Join free
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
