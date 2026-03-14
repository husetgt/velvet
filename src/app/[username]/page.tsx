import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/PostCard'

interface Props {
  params: Promise<{ username: string }>
}

export default async function CreatorProfilePage({ params }: Props) {
  const { username } = await params

  const creator = await prisma.user.findUnique({
    where: { username },
    include: {
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: { select: { subscribers: true } },
    },
  })

  if (!creator || !creator.isCreator) notFound()

  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let currentUser = null
  let isSubscribed = false
  let unlockedPostIds: string[] = []

  if (authUser?.email) {
    currentUser = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (currentUser) {
      const sub = await prisma.subscription.findUnique({
        where: { subscriberId_creatorId: { subscriberId: currentUser.id, creatorId: creator.id } },
      })
      isSubscribed = sub?.status === 'ACTIVE'

      const unlocks = await prisma.postUnlock.findMany({
        where: { userId: currentUser.id, post: { creatorId: creator.id } },
        select: { postId: true },
      })
      unlockedPostIds = unlocks.map(u => u.postId)
    }
  }

  const postsWithAccess = creator.posts.map(post => ({
    ...post,
    isUnlocked: !post.isLocked || isSubscribed || unlockedPostIds.includes(post.id),
    price: post.price ? Number(post.price) : null,
    createdAt: post.createdAt.toISOString(),
    creator: {
      username: creator.username,
      displayName: creator.displayName,
      avatarUrl: creator.avatarUrl,
    },
  }))

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto pt-24 pb-16 px-4">
        {/* Banner */}
        <div className="relative h-40 rounded-2xl overflow-hidden mb-0" style={{background: creator.coverUrl ? `url(${creator.coverUrl}) center/cover` : 'linear-gradient(135deg, rgba(224,64,251,0.4), rgba(124,77,255,0.4))'}}>
          {!creator.coverUrl && (
            <div className="absolute inset-0" style={{background: 'linear-gradient(135deg, rgba(224,64,251,0.3), rgba(124,77,255,0.3))'}} />
          )}
        </div>

        {/* Profile header */}
        <div className="relative px-4 pb-6 border-b border-[#2a2a30]">
          {/* Avatar */}
          <div className="absolute -top-8 left-4 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white border-4 border-[#0d0d0f]"
            style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}>
            {creator.displayName.charAt(0).toUpperCase()}
          </div>

          <div className="pt-10 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-white">{creator.displayName}</h1>
              <p className="text-[#8888a0] text-sm">@{creator.username}</p>
              <p className="text-[#8888a0] text-sm mt-1">{creator._count.subscribers.toLocaleString()} subscribers</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              {!isSubscribed && currentUser?.id !== creator.id && (
                <form action="/api/subscribe" method="POST">
                  <input type="hidden" name="creatorId" value={creator.id} />
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition-opacity"
                    style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}
                  >
                    Subscribe · ${creator.subscriptionPrice ? Number(creator.subscriptionPrice).toFixed(2) : '9.99'}/mo
                  </button>
                </form>
              )}
              {isSubscribed && (
                <span className="px-4 py-2 rounded-xl text-sm font-medium text-[#e040fb] border border-[#e040fb33]">
                  ✓ Subscribed
                </span>
              )}
            </div>
          </div>

          {creator.bio && (
            <p className="mt-4 text-[#ccccdd] text-sm leading-relaxed">{creator.bio}</p>
          )}
        </div>

        {/* Posts feed */}
        <div className="mt-6 space-y-4">
          {postsWithAccess.length === 0 ? (
            <div className="text-center py-12 text-[#8888a0]">No posts yet.</div>
          ) : (
            postsWithAccess.map(post => (
              <PostCard
                key={post.id}
                post={post}
                isUnlocked={post.isUnlocked}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
