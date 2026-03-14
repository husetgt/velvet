import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import AppSidebar from '@/components/AppSidebar'
import { getAuthUser, getCurrentUser } from '@/lib/auth'

// Layout does NOT set force-dynamic — individual pages do only if needed.
// The layout renders the shell (bg + flex container) instantly, then
// streams in the sidebar once the auth/user queries resolve.

async function SidebarLoader({ onNewPost }: { onNewPost?: () => void }) {
  const user = await getCurrentUser()
  if (!user) return null
  return (
    <AppSidebar
      user={{
        displayName: user.displayName,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }}
    />
  )
}

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getAuthUser()
  if (!authUser?.email) redirect('/login')

  // Start user DB lookup in parallel with page render — getCurrentUser is
  // cached so the page can also call it without a second DB round-trip.
  const userPromise = getCurrentUser()

  // Render the shell immediately; sidebar streams in once DB resolves.
  const user = await userPromise
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-[#0d0d0f] text-white">
      <AppSidebar
        user={{
          displayName: user.displayName,
          username: user.username,
          role: user.role,
          avatarUrl: user.avatarUrl,
        }}
      />
      {/* pt-14 on mobile gives space for the fixed hamburger button */}
      <main className="flex-1 min-w-0 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
