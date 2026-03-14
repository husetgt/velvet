'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface AppSidebarProps {
  user: {
    displayName: string
    username: string
    role: string
  }
  activePath: string
}

const NAV_LINKS = [
  { href: '/feed', emoji: '🏠', label: 'Feed' },
  { href: '/explore', emoji: '🔍', label: 'Explore' },
  { href: '/messages', emoji: '💬', label: 'Messages' },
  { href: '/notifications', emoji: '🔔', label: 'Notifications' },
  { href: '/profile', emoji: '👤', label: 'Profile' },
  { href: '/settings', emoji: '⚙️', label: 'Settings' },
]

export default function AppSidebar({ user, activePath }: AppSidebarProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 border-r border-[#2a2a30] bg-[#161618] flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-[#2a2a30]">
        <Link href="/" className="velvet-gradient-text text-xl font-bold">
          Velvet
        </Link>
      </div>

      {/* Account info */}
      <div className="p-4 border-b border-[#2a2a30]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
          >
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user.displayName}</div>
            <div className="text-xs text-[#8888a0] truncate">@{user.username}</div>
          </div>
        </div>

      </div>

      {/* Nav links */}
      <nav className="p-3 flex-1 overflow-y-auto">
        {NAV_LINKS.map(({ href, emoji, label }) => {
          const isActive = activePath === href || activePath.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-all ${
                isActive
                  ? 'text-[#e040fb]'
                  : 'text-[#8888a0] hover:text-white hover:bg-[#1e1e21]'
              }`}
              style={
                isActive
                  ? {
                      background:
                        'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))',
                    }
                  : {}
              }
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-[#2a2a30]">
        <button
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#555568] hover:text-[#8888a0] transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
