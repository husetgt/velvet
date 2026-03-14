import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DiscoverClient from './DiscoverClient'

export const dynamic = 'force-dynamic'

export default async function ExplorePage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')

  const [creators, userSubscriptions] = await Promise.all([
    prisma.user.findMany({
      where: { isCreator: true },
      select: {
        id: true,
        displayName: true,
        username: true,
        bio: true,
        coverUrl: true,
        avatarUrl: true,
        introVideoUrl: true,
        subscriptionPrice: true,
        _count: { select: { subscribers: true, posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.subscription.findMany({
      where: { subscriberId: currentUser.id, status: 'ACTIVE' },
      select: { creatorId: true },
    }),
  ])

  const subscribedIds = new Set(userSubscriptions.map((s: { creatorId: string }) => s.creatorId))

  const creatorsData = creators.map(c => ({
    id: c.id,
    displayName: c.displayName,
    username: c.username,
    bio: c.bio,
    coverUrl: c.coverUrl,
    avatarUrl: c.avatarUrl,
    introVideoUrl: (c as typeof c & { introVideoUrl?: string | null }).introVideoUrl ?? null,
    subscriptionPrice: c.subscriptionPrice ? Number(c.subscriptionPrice) : null,
    subscriberCount: c._count.subscribers,
    postCount: c._count.posts,
    isSubscribed: subscribedIds.has(c.id),
  }))

  return (
    <DiscoverClient
      creators={creatorsData}
      currentUserId={currentUser.id}
    />
  )
}
