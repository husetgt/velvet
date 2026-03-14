import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import SubscribeButton from '@/components/SubscribeButton'
import TipButton from '@/components/TipButton'
import PostCard from '@/components/PostCard'
import AppNavbar from '@/components/AppNavbar'

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
  let unreadMessages = 0

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
      unreadMessages = await prisma.message.count({
        where: { receiverId: currentUser.id, isRead: false },
      })
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

  // Count photo vs video posts (simple detection by mediaUrls)
  const photoPosts = creator.posts.filter((p: typeof creator.posts[number]) =>
    p.mediaUrls.length > 0 && !p.mediaUrls[0].match(/\.(mp4|mov|webm|ogg)/i)
  ).length
  const videoPosts = creator.posts.filter((p: typeof creator.posts[number]) =>
    p.mediaUrls.length > 0 && !!p.mediaUrls[0].match(/\.(mp4|mov|webm|ogg)/i)
  ).length

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      <AppNavbar
        user={currentUser ? { displayName: currentUser.displayName, username: currentUser.username, role: currentUser.role, avatarUrl: currentUser.avatarUrl } : null}
        unreadMessages={unreadMessages}
        unreadNotifications={0}
      />

      {/* Top spacing for navbar */}
      <div className="pt-[60px]">
        {/* Banner */}
        <div
          className="relative w-full h-48"
          style={
            creator.coverUrl
              ? { background: `url(${creator.coverUrl}) center/cover no-repeat` }
              : { background: 'linear-gradient(135deg, #2a0a2e 0%, #1a0a3a 50%, #0d0d0f 100%)' }
          }
        >
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
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </Link>
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto px-4">
          {/* Avatar overlapping banner */}
          <div className="relative -mt-12 mb-4 flex items-end justify-between">
            <div className="shrink-0">
              {creator.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#0d0d0f] shadow-2xl"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-[#0d0d0f] shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                >
                  {creator.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Action buttons */}
            {!isOwnProfile && currentUser && (
              <div className="flex items-center gap-2 pb-1">
                <Link
                  href="/messages"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-[#2a2a30] text-white hover:border-[#e040fb44] hover:bg-[#161618] transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Message
                </Link>
                <TipButton creatorId={creator.id} creatorName={creator.displayName} />
              </div>
            )}
          </div>

          {/* Name + username + online dot */}
          <div className="mb-1 flex items-center gap-2">
            <h1 className="font-bold text-white leading-tight" style={{ fontSize: '22px' }}>{creator.displayName}</h1>
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" title="Online" />
          </div>
          <p className="text-[#8888a0] text-sm mb-3">@{creator.username}</p>

          {/* Stats row */}
          <div className="flex items-center gap-5 mb-4 text-sm">
            <div className="flex items-center gap-1.5 text-[#8888a0]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="font-bold text-white">{photoPosts}</span>
              <span>photos</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#8888a0]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <span className="font-bold text-white">{videoPosts}</span>
              <span>videos</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#8888a0]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="font-bold text-white">{creator._count.subscribers.toLocaleString()}</span>
              <span>subscribers</span>
            </div>
          </div>

          {/* Bio */}
          {creator.bio && (
            <p className="text-[#b0b0c8] text-sm leading-relaxed mb-5 max-w-lg">{creator.bio}</p>
          )}

          {/* Full-width Subscribe button */}
          {!isSubscribed && !isOwnProfile && currentUser && (
            <div className="mb-5">
              <SubscribeButton
                creatorId={creator.id}
                creatorName={creator.displayName}
                price={subPrice}
                fullWidth
              />
            </div>
          )}

          {/* Subscribed badge */}
          {isSubscribed && !isOwnProfile && (
            <div
              className="mb-5 w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(224,64,251,0.12), rgba(124,77,255,0.12))',
                border: '1px solid rgba(224,64,251,0.3)',
                color: '#e040fb',
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Subscribed · ${subPrice.toFixed(2)}/mo
            </div>
          )}

          {/* Not logged in CTA */}
          {!currentUser && (
            <div className="mb-5">
              <Link
                href="/signup"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              >
                Subscribe · ${subPrice.toFixed(2)}/mo
              </Link>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center border-b border-[#2a2a30] mb-6">
            <div className="relative pb-3 mr-6">
              <span className="velvet-gradient-text font-semibold text-sm">Posts</span>
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              />
            </div>
            <div className="relative pb-3 mr-6">
              <span className="text-[#8888a0] font-medium text-sm">Media</span>
            </div>
          </div>

          {/* Posts */}
          {postsWithAccess.length === 0 ? (
            <div className="text-center py-20 text-[#8888a0] text-sm">
              No posts yet — check back soon.
            </div>
          ) : (
            <div className="space-y-5 pb-16">
              {postsWithAccess.map((post: (typeof postsWithAccess)[number]) => (
                <PostCard key={post.id} post={post} isUnlocked={post.isUnlocked} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky subscribe bar — mobile */}
      {!isSubscribed && !isOwnProfile && currentUser && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 bg-gradient-to-t from-[#0d0d0f] to-transparent pointer-events-none">
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
