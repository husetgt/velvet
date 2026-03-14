import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import NotificationsClient from './NotificationsClient'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.email) redirect('/login')

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  if (!user) redirect('/login')

  // Fetch real notification data: subs received (for creators), tips received, unlocks received
  const [subsReceived, tipsReceived, unlocksReceived] = await Promise.all([
    user.isCreator
      ? prisma.subscription.findMany({
          where: { creatorId: user.id },
          include: { subscriber: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
      : Promise.resolve([]),
    user.isCreator
      ? prisma.tip.findMany({
          where: { creatorId: user.id },
          include: { tipper: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
      : Promise.resolve([]),
    user.isCreator
      ? prisma.postUnlock.findMany({
          where: { post: { creatorId: user.id } },
          include: {
            user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
            post: { select: { title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
      : Promise.resolve([]),
  ])

  type NotifItem = {
    id: string
    type: 'subscription' | 'tip' | 'unlock'
    user: { id: string; displayName: string; username: string; avatarUrl: string | null }
    amount?: number
    description: string
    createdAt: string
  }

  const notifications: NotifItem[] = [
    ...(subsReceived as Awaited<typeof subsReceived>).map(s => ({
      id: `sub-${s.id}`,
      type: 'subscription' as const,
      user: s.subscriber,
      description: 'subscribed to your page',
      createdAt: s.createdAt.toISOString(),
    })),
    ...(tipsReceived as Awaited<typeof tipsReceived>).map(t => ({
      id: `tip-${t.id}`,
      type: 'tip' as const,
      user: t.tipper,
      amount: Number(t.amount),
      description: `tipped you $${Number(t.amount).toFixed(2)}${t.message ? ` — "${t.message}"` : ''}`,
      createdAt: t.createdAt.toISOString(),
    })),
    ...(unlocksReceived as Awaited<typeof unlocksReceived>).map(u => ({
      id: `unlock-${u.id}`,
      type: 'unlock' as const,
      user: u.user,
      amount: Number(u.paidPrice),
      description: `purchased${u.post?.title ? ` "${u.post.title}"` : ' your post'}`,
      createdAt: u.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return <NotificationsClient notifications={notifications} isCreator={user.isCreator} />
}
