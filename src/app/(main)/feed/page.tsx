import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import PostCard from '@/components/PostCard'
import AppSidebar from '@/components/AppSidebar'

export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser?.email) redirect('/login')

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  if (!user) redirect('/login')

  const subscriptions = await prisma.subscription.findMany({
    where: { subscriberId: user.id, status: 'ACTIVE' },
    select: { creatorId: true },
  })

  const creatorIds = subscriptions.map((s: { creatorId: string }) => s.creatorId)

  const posts = creatorIds.length
    ? await prisma.post.findMany({
        where: { creatorId: { in: creatorIds } },
        include: {
          creator: { select: { username: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })
    : []

  // Get unlocked post ids for current user
  const unlocks = await prisma.postUnlock.findMany({
    where: { userId: user.id, post: { creatorId: { in: creatorIds } } },
    select: { postId: true },
  })
  const unlockedPostIds = new Set(unlocks.map((u: { postId: string }) => u.postId))

  const postsWithAccess = (posts as Array<{
    id: string
    title: string | null
    content: string
    mediaUrls: string[]
    isLocked: boolean
    price: { toNumber?: () => number } | null
    likesCount: number
    createdAt: Date
    creator: { username: string; displayName: string; avatarUrl: string | null }
  }>).map((post) => ({
    ...post,
    price: post.price ? Number(post.price) : null,
    createdAt: post.createdAt.toISOString(),
    isUnlocked: !post.isLocked || unlockedPostIds.has(post.id),
    creator: {
      username: post.creator.username,
      displayName: post.creator.displayName,
      avatarUrl: post.creator.avatarUrl,
    },
  }))

  return (
    <div className="flex h-screen bg-[#0d0d0f] text-white overflow-hidden">
      <AppSidebar
        user={{
          displayName: user.displayName,
          username: user.username,
          role: user.role,
        }}
        activePath="/feed"
      />

      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Your Feed</h1>

          {postsWithAccess.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-[#2a2a30] rounded-2xl">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))' }}
              >
                🏠
              </div>
              <p className="text-white font-semibold mb-2">Your feed is empty</p>
              <p className="text-[#8888a0] text-sm mb-6">
                Follow some creators to see their posts here
              </p>
              <Link
                href="/explore"
                className="inline-block px-6 py-2.5 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity text-sm"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              >
                Explore Creators
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {postsWithAccess.map((post: typeof postsWithAccess[number]) => (
                <PostCard key={post.id} post={post} isUnlocked={post.isUnlocked} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
