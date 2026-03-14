import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import PostCard from '@/components/PostCard'
import AppNavbar from '@/components/AppNavbar'

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

  const unlocks = await prisma.postUnlock.findMany({
    where: { userId: user.id, post: { creatorId: { in: creatorIds } } },
    select: { postId: true },
  })
  const unlockedPostIds = new Set(unlocks.map((u: { postId: string }) => u.postId))

  // Count unread messages
  const unreadMessages = await prisma.message.count({
    where: { receiverId: user.id, isRead: false },
  })

  const postsWithAccess = (
    posts as Array<{
      id: string
      title: string | null
      content: string
      mediaUrls: string[]
      isLocked: boolean
      price: { toNumber?: () => number } | null
      likesCount: number
      createdAt: Date
      creator: { username: string; displayName: string; avatarUrl: string | null }
    }>
  ).map((post) => ({
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
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      <AppNavbar
        user={{ displayName: user.displayName, username: user.username, role: user.role, avatarUrl: user.avatarUrl }}
        unreadMessages={unreadMessages}
        unreadNotifications={0}
      />

      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Page header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Home</h1>
            <Link
              href="/explore"
              className="px-4 py-1.5 rounded-full text-sm font-semibold text-[#b0b0c8] border border-[#2a2a30] hover:border-[#e040fb44] hover:text-white transition-all"
            >
              Discover
            </Link>
          </div>

          {/* Feed tab */}
          <div className="flex items-center border-b border-[#2a2a30] mb-6">
            <div className="relative pb-3 mr-6">
              <span className="velvet-gradient-text font-semibold text-sm">Feed</span>
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              />
            </div>
          </div>

          {postsWithAccess.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))',
                  border: '1px solid rgba(224,64,251,0.2)',
                }}
              >
                <svg
                  className="w-9 h-9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="url(#feed-empty-grad)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <defs>
                    <linearGradient id="feed-empty-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e040fb" />
                      <stop offset="100%" stopColor="#7c4dff" />
                    </linearGradient>
                  </defs>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Your feed is empty</h2>
              <p className="text-[#8888a0] text-sm text-center max-w-xs leading-relaxed mb-8">
                Subscribe to creators to see their content here
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity shadow-lg"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Explore Creators
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {postsWithAccess.map((post: (typeof postsWithAccess)[number]) => (
                <PostCard key={post.id} post={post} isUnlocked={post.isUnlocked} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
