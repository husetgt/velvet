import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let dbUser = null
  if (user?.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { displayName: true, username: true, role: true },
    }).catch(() => null)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#2a2a30]" style={{background: 'rgba(13,13,15,0.85)', backdropFilter: 'blur(12px)'}}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="velvet-gradient-text text-2xl font-bold tracking-tight">
          Velvet
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-[#8888a0]">
          <Link href="/" className="hover:text-white transition-colors">Explore</Link>
          {dbUser && (
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          )}

        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {dbUser ? (
            <>
              {/* User avatar / link */}
              <Link
                href={dbUser.role === 'CREATOR' ? `/dashboard` : `/`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e1e21] border border-[#2a2a30] text-sm hover:border-[#e040fb44] transition-all"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}>
                  {dbUser.displayName?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <span className="hidden sm:block text-white">{dbUser.displayName}</span>
              </Link>

              {/* Logout */}
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-xs text-[#555568] hover:text-[#8888a0] transition-colors px-2 py-1">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-[#8888a0] hover:text-white transition-colors">Sign in</Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
