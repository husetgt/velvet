import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AppSidebar from '@/components/AppSidebar'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser?.email) redirect('/login')

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-[#0d0d0f] text-white">
      <AppSidebar
        user={{ displayName: user.displayName, username: user.username, role: user.role, avatarUrl: user.avatarUrl }}
        activePath="/notifications"
      />

      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
          </div>

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))',
                border: '1px solid rgba(224,64,251,0.2)',
              }}
            >
              <svg
                className="w-11 h-11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#notif-grad)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <defs>
                  <linearGradient id="notif-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e040fb" />
                    <stop offset="100%" stopColor="#7c4dff" />
                  </linearGradient>
                </defs>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">You&apos;re all caught up</h2>
            <p className="text-[#8888a0] text-sm text-center max-w-xs leading-relaxed">
              New subscribers, tips, and messages will appear here when they arrive.
            </p>

            <div
              className="mt-6 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'linear-gradient(135deg, rgba(224,64,251,0.1), rgba(124,77,255,0.1))',
                border: '1px solid rgba(224,64,251,0.2)',
                color: '#e040fb',
              }}
            >
              Real-time notifications coming soon
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
