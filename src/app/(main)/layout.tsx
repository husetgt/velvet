import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AppSidebar from '@/components/AppSidebar'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
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
        user={{
          displayName: user.displayName,
          username: user.username,
          role: user.role,
          avatarUrl: user.avatarUrl,
        }}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
