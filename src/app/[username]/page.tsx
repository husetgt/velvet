import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import SubscribeButton from '@/components/SubscribeButton'
import TipButton from '@/components/TipButton'
import PostCard from '@/components/PostCard'

interface Props {
  params: Promise<{ username: string }>
}

export default async function CreatorProfilePage({ params }: Props) {
  const { username } = await params

  const creator = await prisma.user.findUnique({
    where: { username },
    include: {
      posts: { orderBy: { createdAt: 'desc' }, take: 30 },
      _count: { select: { subscribers: true, posts: true } },
    },
  })

  if (!creator || !creator.isCreator) notFound()

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let currentUser = null
  let isSubscribed = false
  let unlockedPostIds: string[] = []

  if (authUser?.email) {
    currentUser = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (currentUser) {
      const sub = await prisma.subscription.findUnique({
        where: {
          subscriberId_creatorId: { subscriberId: currentUser.id, creatorId: creator.id },
        },
      })
      isSubscribed = sub?.status === 'ACTIVE'
      const unlocks = await prisma.postUnlock.findMany({
        where: { userId: currentUser.id, post: { creatorId: creator.id } },
        select: { postId: true },
      })
      unlockedPostIds = unlocks.map((u: { postId: string }) => u.postId)
    }
  }

  const isOwnProfile = currentUser?.id === creator.id

  const postsWithAccess = creator.posts.map((post: typeof creator.posts[number]) => ({
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

  const subPrice = creator.subscriptionPrice ? Number(creator.subscriptionPrice) : 9.99

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      {/* Cover banner — full width */}
      <div
        className="relative w-full h-52 sm:h-64"
        style={
          creator.coverUrl
            ? { background: `url(${creator.coverUrl}) center/cover no-repeat` }
            : { background: 'linear-gradient(135deg, #2a0a2e 0%, #1a0a3a 50%, #0d0d0f 100%)' }
        }
      >
        {/* Gradient overlay for depth */}
        <div
          className="absolute inset-0"
          style={{
            background: creator.coverUrl
              ? 'linear-gradient(to bottom, transparent 40%, rgba(13,13,15,0.8) 100%)'
              : 'linear-gradient(135deg, rgba(224,64,251,0.25), rgba(124,77,255,0.25), rgba(13,13,15,0.4))',
          }}
        />
        {/* Back button */}
        {currentUser && (
          <div className="absolute top-4 left-4">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/80 bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </Link>
          </div>
        )}
      </div>

      {/* Profile section */}
      <div className="max-w-3xl mx-auto px-4">
        {/* Avatar + actions row */}
        <div className="flex items-end justify-between gap-4 -mt-10 sm:-mt-12 mb-4 relative z-10">
          {/* Avatar */}
          <div className="shrink-0">
            {creator.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-[#0d0d0f] shadow-2xl"
              />
            ) : (
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-[#0d0d0f] shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              >
                {creator.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!isOwnProfile && currentUser && (
            <div className="flex items-center gap-2 pb-1">
              {/* Message button */}
              <Link
                href="/messages"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-[#2a2a30] text-white hover:border-[#e040fb44] hover:bg-[#161618] transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Message
              </Link>

              <TipButton creatorId={creator.id} creatorName={creator.displayName} />

              {!isSubscribed ? (
                <SubscribeButton
                  creatorId={creator.id}
                  creatorName={creator.displayName}
                  price={subPrice}
                />
              ) : (
                <div
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, rgba(224,64,251,0.12), rgba(124,77,255,0.12))',
                    border: '1px solid rgba(224,64,251,0.3)',
                    color: '#e040fb',
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Subscribed
                </div>
              )}
            </div>
          )}
        </div>

        {/* Name + bio */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white leading-tight">{creator.displayName}</h1>
          <p className="text-[#555568] text-sm mt-0.5">@{creator.username}</p>

          {creator.bio && (
            <p className="text-[#b0b0c8] text-sm leading-relaxed mt-3 max-w-lg">{creator.bio}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-5 mt-4 text-sm">
            <div>
              <span className="font-bold text-white">{creator._count.subscribers.toLocaleString()}</span>
              <span className="text-[#555568] ml-1">subscribers</span>
            </div>
            <div>
              <span className="font-bold text-white">{creator._count.posts}</span>
              <span className="text-[#555568] ml-1">posts</span>
            </div>
            {creator.subscriptionPrice && (
              <div
                className="px-3 py-1 rounded-lg text-xs font-bold ml-auto"
                style={{
                  background: 'linear-gradient(135deg, rgba(224,64,251,0.12), rgba(124,77,255,0.12))',
                  border: '1px solid rgba(224,64,251,0.25)',
                  color: '#e040fb',
                }}
              >
                ${Number(creator.subscriptionPrice).toFixed(2)}/month
              </div>
            )}
          </div>
        </div>

        {/* Subscribe CTA — shown to non-subscribers */}
        {!isSubscribed && !isOwnProfile && currentUser && (
          <div
            className="rounded-2xl p-5 mb-6 flex items-center justify-between gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(224,64,251,0.08), rgba(124,77,255,0.08))',
              border: '1px solid rgba(224,64,251,0.2)',
            }}
          >
            <div>
              <p className="text-white font-semibold text-sm">Subscribe to unlock all content</p>
              <p className="text-[#8888a0] text-xs mt-0.5">
                Get full access to all posts and messages
              </p>
            </div>
            <SubscribeButton
              creatorId={creator.id}
              creatorName={creator.displayName}
              price={subPrice}
            />
          </div>
        )}

        {/* Not logged in CTA */}
        {!currentUser && (
          <div
            className="rounded-2xl p-5 mb-6 flex items-center justify-between gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(224,64,251,0.08), rgba(124,77,255,0.08))',
              border: '1px solid rgba(224,64,251,0.2)',
            }}
          >
            <div>
              <p className="text-white font-semibold text-sm">Join Velvet to subscribe</p>
              <p className="text-[#8888a0] text-xs mt-0.5">Create a free account to unlock content</p>
            </div>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition-opacity shrink-0"
              style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
            >
              Join Free
            </Link>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-[#2a2a30] mb-6" />

        {/* Posts */}
        {postsWithAccess.length === 0 ? (
          <div className="text-center py-20 text-[#8888a0] text-sm">
            No posts yet — check back soon.
          </div>
        ) : (
          /* Grid for media-heavy posts, list for text */
          <div className="space-y-5 pb-16">
            {postsWithAccess.map((post: (typeof postsWithAccess)[number]) => (
              <PostCard key={post.id} post={post} isUnlocked={post.isUnlocked} />
            ))}
          </div>
        )}
      </div>

      {/* Sticky subscribe bar — mobile, shown to non-subscribers */}
      {!isSubscribed && !isOwnProfile && currentUser && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 px-4 pb-safe pb-4 pt-3 bg-gradient-to-t from-[#0d0d0f] to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <SubscribeButton
              creatorId={creator.id}
              creatorName={creator.displayName}
              price={subPrice}
              fullWidth
            />
          </div>
        </div>
      )}
    </div>
  )
}
