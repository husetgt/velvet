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
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-[#2a2a30]"
      style={{ background: 'rgba(13,13,15,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="velvet-gradient-text text-2xl font-bold tracking-tight select-none">
          Velvet
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link
            href="/explore"
            className="text-[#8888a0] hover:text-white transition-colors font-medium tracking-wide"
          >
            Explore
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {dbUser ? (
            <>
              <Link
                href="/feed"
                className="text-sm text-[#8888a0] hover:text-white transition-colors font-medium"
              >
                My Feed
              </Link>
              <Link
                href={`/${dbUser.username}`}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-sm hover:border-[#e040fb55] transition-all"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                >
                  {dbUser.displayName?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <span className="hidden sm:block text-white font-medium">{dbUser.displayName}</span>
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="text-xs text-[#555568] hover:text-[#8888a0] transition-colors px-2 py-1"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-[#8888a0] hover:text-white transition-colors font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-lg shadow-purple-900/20"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              >
                Join Free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
