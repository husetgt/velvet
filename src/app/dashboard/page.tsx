import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser?.email) redirect('/login')

  let user = await prisma.user.findUnique({
    where: { email: authUser.email },
    include: {
      posts: { orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { subscribers: true } },
    },
  })

  // If auth user exists but DB user doesn't, create it
  if (!user) {
    const username = authUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') + Math.floor(Math.random() * 1000)
    const created = await prisma.user.create({
      data: {
        email: authUser.email,
        username,
        displayName: authUser.user_metadata?.full_name || username,
        role: 'FAN',
        isCreator: false,
      },
    })
    user = await prisma.user.findUnique({
      where: { id: created.id },
      include: {
        posts: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { subscribers: true } },
      },
    })
  }

  if (!user) redirect('/login')

  return (
    <DashboardClient
      user={{
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl,
        subscriberCount: user._count.subscribers,
      }}
    />
  )
}
