import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import NotificationsClient from './NotificationsClient'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (user.isCreator) {
    // ── Creator notifications: subs received, tips, unlocks ───────────────
    const [subsReceived, tipsReceived, unlocksReceived] = await Promise.all([
      prisma.subscription.findMany({
        where: { creatorId: user.id },
        include: { subscriber: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.tip.findMany({
        where: { creatorId: user.id },
        include: { tipper: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.postUnlock.findMany({
        where: { post: { creatorId: user.id } },
        include: {
          user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
          post: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ])

    type CreatorNotifItem = {
      id: string
      type: 'subscription' | 'tip' | 'unlock'
      user: { id: string; displayName: string; username: string; avatarUrl: string | null }
      amount?: number
      description: string
      createdAt: string
    }

    const notifications: CreatorNotifItem[] = [
      ...subsReceived.map(s => ({
        id: `sub-${s.id}`,
        type: 'subscription' as const,
        user: s.subscriber,
        description: 'subscribed to your page',
        createdAt: s.createdAt.toISOString(),
      })),
      ...tipsReceived.map(t => ({
        id: `tip-${t.id}`,
        type: 'tip' as const,
        user: t.tipper,
        amount: Number(t.amount),
        description: `tipped you $${Number(t.amount).toFixed(2)}${t.message ? ` — "${t.message}"` : ''}`,
        createdAt: t.createdAt.toISOString(),
      })),
      ...unlocksReceived.map(u => ({
        id: `unlock-${u.id}`,
        type: 'unlock' as const,
        user: u.user,
        amount: Number(u.paidPrice),
        description: `purchased${u.post?.title ? ` "${u.post.title}"` : ' your post'}`,
        createdAt: u.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return <NotificationsClient notifications={notifications} isCreator={true} fanNotifications={null} />
  } else {
    // ── Fan notifications: new posts from followed/subscribed creators, messages, renewals ──
    const [follows, subscriptions, messages, renewals] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: user.id },
        select: { creatorId: true },
      }),
      prisma.subscription.findMany({
        where: { subscriberId: user.id, status: 'ACTIVE' },
        select: { creatorId: true, createdAt: true },
      }),
      prisma.message.findMany({
        where: {
          receiverId: user.id,
          sender: { isCreator: true },
        },
        include: {
          sender: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.subscription.findMany({
        where: { subscriberId: user.id },
        include: {
          creator: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
    ])

    const followedIds = new Set(follows.map(f => f.creatorId))
    const subscribedIds = new Set(subscriptions.map(s => s.creatorId))
    const allCreatorIds = [...new Set([...followedIds, ...subscribedIds])]

    const newPosts = allCreatorIds.length > 0
      ? await prisma.post.findMany({
          where: { creatorId: { in: allCreatorIds } },
          include: {
            creator: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
      : []

    type FanNotifItem = {
      id: string
      type: 'newpost' | 'message' | 'renewal'
      user: { id: string; displayName: string; username: string; avatarUrl: string | null }
      description: string
      createdAt: string
    }

    const fanNotifications: FanNotifItem[] = [
      ...newPosts.map(p => ({
        id: `post-${p.id}`,
        type: 'newpost' as const,
        user: p.creator,
        description: p.title ? `posted "${p.title}"` : 'published a new post',
        createdAt: p.createdAt.toISOString(),
      })),
      ...messages.map(m => ({
        id: `msg-${m.id}`,
        type: 'message' as const,
        user: m.sender,
        description: 'sent you a message',
        createdAt: m.createdAt.toISOString(),
      })),
      ...renewals.map(r => ({
        id: `renewal-${r.id}`,
        type: 'renewal' as const,
        user: r.creator,
        description: `subscription renewed`,
        createdAt: r.updatedAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return <NotificationsClient notifications={[]} isCreator={false} fanNotifications={fanNotifications} />
  }
}
