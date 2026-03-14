import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import SubscribeButton from '@/components/SubscribeButton'
import TipButton from '@/components/TipButton'
import EditProfileInline from '@/components/EditProfileInline'
import ProfileTabs from '@/components/ProfileTabs'
import CoverUpload from '@/components/CoverUpload'
import ProfileIntroPanel from '@/components/ProfileIntroPanel'
import FollowButton from '@/components/FollowButton'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params

  const currentUser = await getCurrentUser()

  const profileUser = await prisma.user.findUnique({
    where: { username },
    include: {
      posts: { orderBy: { createdAt: 'desc' }, take: 50 },
      _count: { select: { subscribers: true, posts: true } },
    },
  })

  if (!profileUser) notFound()

  const isOwnProfile = currentUser?.username === username

  // ─── Fan profile (unchanged simple layout) ──────────────────────────────
  if (!profileUser.isCreator) {
    const fanInitials = profileUser.displayName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return (
      <div className="min-h-screen bg-[#0d0d0f] text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center text-center">
          <div className="mb-4">
            {profileUser.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileUser.avatarUrl} alt={profileUser.displayName} className="w-28 h-28 rounded-full object-cover border-4 border-[#2a2a30] shadow-2xl" />
            ) : (
              <div className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 border-[#2a2a30] shadow-2xl" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
                {fanInitials}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{profileUser.displayName}</h1>
          <p className="text-[#8888a0] text-sm mb-3">@{profileUser.username}</p>
          {profileUser.bio && <p className="text-[#b0b0c8] text-sm leading-relaxed max-w-sm mb-4">{profileUser.bio}</p>}
          {isOwnProfile && (
            <div className="w-full max-w-md mt-4">
              <EditProfileInline displayName={profileUser.displayName} bio={profileUser.bio ?? ''} avatarUrl={profileUser.avatarUrl ?? ''} />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Creator profile ─────────────────────────────────────────────────────
  let isSubscribed = false
  let isFollowing = false
  let unlockedPostIds: string[] = []

  if (currentUser) {
    const [sub, follow, unlocks] = await Promise.all([
      prisma.subscription.findUnique({
        where: { subscriberId_creatorId: { subscriberId: currentUser.id, creatorId: profileUser.id } },
      }),
      (prisma as typeof prisma & { follow: { findUnique: (args: unknown) => Promise<{ id: string } | null> } }).follow.findUnique({
        where: { followerId_creatorId: { followerId: currentUser.id, creatorId: profileUser.id } },
      }),
      prisma.postUnlock.findMany({
        where: { userId: currentUser.id, post: { creatorId: profileUser.id } },
        select: { postId: true },
      }),
    ])
    isSubscribed = sub?.status === 'ACTIVE'
    isFollowing = !!follow
    unlockedPostIds = unlocks.map((u: { postId: string }) => u.postId)
  }

  // Filter scheduled posts
  const now = new Date()
  const visiblePosts = isOwnProfile
    ? profileUser.posts
    : profileUser.posts.filter((p: typeof profileUser.posts[number]) => {
        return !p.scheduledAt || p.scheduledAt <= now
      }).slice(0, 30)

  const postsWithAccess = visiblePosts.map((post: typeof profileUser.posts[number]) => ({
    ...post,
    isUnlocked: !post.isLocked || isSubscribed || unlockedPostIds.includes(post.id),
    price: post.price ? Number(post.price) : null,
    createdAt: post.createdAt.toISOString(),
    creator: {
      username: profileUser.username,
      displayName: profileUser.displayName,
      avatarUrl: profileUser.avatarUrl,
    },
  }))

  const subPrice = profileUser.subscriptionPrice ? Number(profileUser.subscriptionPrice) : 9.99

  const photoPosts = visiblePosts.filter((p: typeof profileUser.posts[number]) =>
    p.mediaUrls.length > 0 && !p.mediaUrls[0].match(/\.(mp4|mov|webm|ogg)/i)
  ).length
  const videoPosts = visiblePosts.filter((p: typeof profileUser.posts[number]) =>
    p.mediaUrls.length > 0 && !!p.mediaUrls[0].match(/\.(mp4|mov|webm|ogg)/i)
  ).length

  const introVideoUrl = (profileUser as typeof profileUser & { introVideoUrl?: string | null }).introVideoUrl ?? null

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Profile Card ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] overflow-hidden mb-6">

          {/* Cover Banner */}
          <div
            className="relative h-40 sm:h-48 w-full"
            style={
              profileUser.coverUrl
                ? { background: `url(${profileUser.coverUrl}) center/cover no-repeat` }
                : { background: 'linear-gradient(135deg, #2a0a2e 0%, #1a0a3a 50%, #0d0d0f 100%)' }
            }
          >
            {currentUser && (
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                <Link
                  href="/explore"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/80 bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors min-h-[36px]"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back
                </Link>
              </div>
            )}
            {isOwnProfile && <CoverUpload />}
          </div>

          {/* Avatar row — overlaps banner */}
          <div className="relative -mt-12 px-6 pb-0 flex items-end justify-between">
            {/* Avatar */}
            <div className="shrink-0">
              {profileUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileUser.avatarUrl}
                  alt={profileUser.displayName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#161618] shadow-2xl"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-[#161618] shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                >
                  {profileUser.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Action buttons (top-right of avatar row) */}
            <div className="flex items-center gap-2 pb-2">
              {isOwnProfile ? (
                <Link
                  href="/settings"
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white border border-[#3a3a44] hover:border-[#e040fb44] transition-all min-h-[38px] flex items-center"
                >
                  Edit profile
                </Link>
              ) : currentUser ? (
                <>
                  <FollowButton creatorId={profileUser.id} initialIsFollowing={isFollowing} />
                  {isSubscribed ? (
                    <>
                      <Link
                        href={`/messages?with=${profileUser.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-[#3a3a44] text-white hover:border-[#e040fb44] hover:bg-[#1e1e21] transition-all min-h-[38px]"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Message
                      </Link>
                      <TipButton creatorId={profileUser.id} creatorName={profileUser.displayName} />
                    </>
                  ) : (
                    <button
                      disabled
                      title="Subscribe to message"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-[#3a3a44] text-[#555568] cursor-not-allowed min-h-[38px] opacity-60"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Message
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Profile info */}
          <div className="px-6 pb-6 pt-3">
            {/* Name + online dot */}
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="font-bold text-white leading-tight text-xl">{profileUser.displayName}</h1>
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" title="Online" />
            </div>
            <p className="text-[#8888a0] text-sm mb-3">@{profileUser.username}</p>

            {/* Stats row */}
            <div className="flex items-center gap-5 mb-4 text-sm flex-wrap">
              <div className="flex items-center gap-1.5 text-[#8888a0]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="font-bold text-white">{photoPosts}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#8888a0]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                  <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <span className="font-bold text-white">{videoPosts}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#8888a0]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span className="font-bold text-white">{profileUser._count.subscribers.toLocaleString()}</span>
              </div>
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <p className="text-[#b0b0c8] text-sm leading-relaxed mb-5 max-w-lg line-clamp-2">{profileUser.bio}</p>
            )}

            {/* Subscribed badge */}
            {isSubscribed && !isOwnProfile && (
              <div
                className="mb-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold text-sm border"
                style={{ background: 'rgba(224,64,251,0.08)', borderColor: 'rgba(224,64,251,0.3)', color: '#e040fb' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Subscribed · ${subPrice.toFixed(2)}/mo
              </div>
            )}

            {/* Subscribe CTA for non-subscribed visitors */}
            {!isSubscribed && !isOwnProfile && currentUser && (
              <div id="subscribe-section" className="mb-2">
                <SubscribeButton creatorId={profileUser.id} creatorName={profileUser.displayName} price={subPrice} fullWidth />
              </div>
            )}

            {/* Not logged in CTA */}
            {!currentUser && (
              <div className="mb-2">
                <Link
                  href="/signup"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-white text-sm hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                >
                  Subscribe · ${subPrice.toFixed(2)}/mo
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Own profile: intro video panel */}
        {isOwnProfile && profileUser.isCreator && (
          <div className="mb-6">
            <ProfileIntroPanel
              username={profileUser.username}
              introVideoUrl={introVideoUrl}
              isOwnProfile={isOwnProfile}
              coverUrl={profileUser.coverUrl ?? null}
            />
          </div>
        )}

        {/* Posts feed */}
        <ProfileTabs posts={postsWithAccess} isOwnProfile={isOwnProfile} />
      </div>

      {/* Sticky subscribe bar — mobile */}
      {!isSubscribed && !isOwnProfile && currentUser && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 bg-gradient-to-t from-[#0d0d0f] to-transparent pointer-events-none z-30">
          <div className="pointer-events-auto">
            <SubscribeButton creatorId={profileUser.id} creatorName={profileUser.displayName} price={subPrice} fullWidth />
          </div>
        </div>
      )}
    </div>
  )
}
