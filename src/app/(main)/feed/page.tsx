import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import PostCard from '@/components/PostCard'

export const dynamic = 'force-dynamic'

// ─── Skeleton ───────────────────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-[#2a2a30]" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-[#2a2a30] rounded w-32" />
          <div className="h-2.5 bg-[#2a2a30] rounded w-20" />
        </div>
      </div>
      <div className="aspect-[4/3] bg-[#2a2a30]" />
      <div className="px-4 py-3 space-y-1.5">
        <div className="h-3 bg-[#2a2a30] rounded w-3/4" />
        <div className="h-3 bg-[#2a2a30] rounded w-1/2" />
      </div>
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map(i => <PostSkeleton key={i} />)}
    </div>
  )
}

// ─── Async data component (streamed) ────────────────────────────────────────
async function FeedContent() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [subscriptions, follows, unlocks, recommendedCreators] = await Promise.all([
    prisma.subscription.findMany({
      where: { subscriberId: user.id, status: 'ACTIVE' },
      select: { creatorId: true },
    }),
    (prisma as typeof prisma & { follow: { findMany: (args: unknown) => Promise<{ creatorId: string }[]> } }).follow.findMany({
      where: { followerId: user.id },
      select: { creatorId: true },
    }),
    prisma.postUnlock.findMany({
      where: { userId: user.id },
      select: { postId: true },
    }),
    prisma.user.findMany({
      where: { isCreator: true },
      include: { _count: { select: { subscribers: true, posts: true } } },
      orderBy: { subscribers: { _count: 'desc' } },
      take: 6,
    }),
  ])

  const subscribedCreatorIds = new Set(subscriptions.map((s: { creatorId: string }) => s.creatorId))
  const followedCreatorIds = new Set(follows.map((f: { creatorId: string }) => f.creatorId))
  const allCreatorIds = [...new Set([...subscribedCreatorIds, ...followedCreatorIds])]
  const unlockedPostIds = new Set(unlocks.map((u: { postId: string }) => u.postId))

  const now = new Date()
  const posts = allCreatorIds.length
    ? await prisma.post.findMany({
        where: {
          // Filter out future-scheduled posts
          OR: [
            { scheduledAt: null },
            { scheduledAt: { lte: now } },
          ],
          AND: [
            {
              OR: [
                // All posts from subscribed creators
                { creatorId: { in: [...subscribedCreatorIds] } },
                // Only free posts from followed-only creators
                { creatorId: { in: [...followedCreatorIds].filter(id => !subscribedCreatorIds.has(id)) }, isLocked: false, price: null },
              ],
            },
          ],
        },
        include: { creator: { select: { username: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })
    : []
  
  const creatorIds = allCreatorIds

  type RawPost = {
    id: string; creatorId: string; title: string | null; content: string; mediaUrls: string[]
    isLocked: boolean; price: { toNumber?: () => number } | null
    likesCount: number; createdAt: Date
    creator: { username: string; displayName: string; avatarUrl: string | null }
  }

  const postsWithAccess = (posts as RawPost[]).map(post => ({
    ...post,
    price: post.price ? Number(post.price) : null,
    createdAt: post.createdAt.toISOString(),
    isUnlocked: !post.isLocked || subscribedCreatorIds.has(post.creatorId) || unlockedPostIds.has(post.id),
  }))

  type RawCreator = {
    id: string; displayName: string; username: string
    coverUrl: string | null; avatarUrl: string | null
    subscriptionPrice: { toNumber?: () => number } | null
    _count: { subscribers: number; posts: number }
  }

  const recommended = (recommendedCreators as RawCreator[]).filter(
    c => !creatorIds.includes(c.id as string)
  ).slice(0, 6)

  if (postsWithAccess.length === 0) {
    return (
      <div>
        <div className="flex flex-col items-center text-center mb-8">
          <h2 className="text-lg font-bold text-white mb-1">Your feed is empty</h2>
          <p className="text-[#8888a0] text-sm max-w-xs leading-relaxed">
            Subscribe to creators to see their content here
          </p>
        </div>
        {recommended.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Recommended creators</h3>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none">
              {recommended.map(creator => (
                <Link
                  key={creator.id}
                  href={`/${creator.username}`}
                  prefetch
                  className="rounded-2xl overflow-hidden border border-[#2a2a30] bg-[#161618] hover:border-[#e040fb44] hover:shadow-[0_8px_32px_rgba(224,64,251,0.12)] flex flex-col shrink-0 transition-all"
                  style={{ width: 180 }}
                >
                  <div className="h-16 w-full relative" style={creator.coverUrl ? { background: `url(${creator.coverUrl}) center/cover` } : { background: 'linear-gradient(135deg, rgba(224,64,251,0.35), rgba(124,77,255,0.35))' }}>
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  <div className="px-3 pb-3 pt-0 flex flex-col flex-1">
                    <div className="relative -mt-5 mb-1.5">
                      {creator.avatarUrl
                        ? <img src={creator.avatarUrl} alt={creator.displayName} className="w-10 h-10 rounded-full object-cover border-4 border-[#161618] shadow-xl" /> // eslint-disable-line @next/next/no-img-element
                        : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white border-4 border-[#161618]" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>{creator.displayName.charAt(0).toUpperCase()}</div>
                      }
                    </div>
                    <div className="font-bold text-white text-xs leading-tight truncate">{creator.displayName}</div>
                    <div className="text-[10px] text-[#8888a0] mt-0.5 mb-2">@{creator.username}</div>
                    <div className="mt-auto text-center py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
                      Subscribe{creator.subscriptionPrice ? ` · $${Number(creator.subscriptionPrice).toFixed(2)}/mo` : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {postsWithAccess.map(post => (
        <PostCard key={post.id} post={post} isUnlocked={post.isUnlocked} />
      ))}
    </div>
  )
}

// ─── Page shell (renders instantly) ─────────────────────────────────────────
export default function FeedPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Home</h1>
          <Link
            href="/explore"
            prefetch
            className="px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-[#b0b0c8] border border-[#2a2a30] hover:border-[#e040fb44] hover:text-white transition-all min-h-[36px] flex items-center"
          >
            Discover
          </Link>
        </div>
        <div className="flex items-center border-b border-[#2a2a30] mb-5 sm:mb-6">
          <div className="relative pb-3 mr-6">
            <span className="font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Feed</span>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }} />
          </div>
        </div>
        <Suspense fallback={<FeedSkeleton />}>
          <FeedContent />
        </Suspense>
      </div>
    </div>
  )
}
