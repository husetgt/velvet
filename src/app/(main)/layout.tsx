import { redirect } from 'next/navigation'
import { getAuthUser, getCurrentUser } from '@/lib/auth'
import MainLayoutClient from '@/components/MainLayoutClient'

// Layout does NOT set force-dynamic — individual pages do only if needed.

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getAuthUser()
  if (!authUser?.email) redirect('/login')

  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <MainLayoutClient
      user={{
        displayName: user.displayName,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl ?? null,
      }}
    >
      {children}
    </MainLayoutClient>
  )
}
