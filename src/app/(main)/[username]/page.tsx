import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import SubscribeButton from '@/components/SubscribeButton'
import TipButton from '@/components/TipButton'
import EditProfileInline from '@/components/EditProfileInline'
import ProfileTabs from '@/components/ProfileTabs'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let currentUser = null
  if (authUser?.email) {
    currentUser = await prisma.user.findUnique({ where: { email: authUser.email } })
  }

  const profileUser = await prisma.user.findUnique({
    where: { username },
    include: {
      posts: { orderBy: { createdAt: 'desc' }, take: 30 },
      _count: { select: { subscribers: true, posts: true } },
    },
  })

  if (!profileUser) notFound()

  const isOwnProfile = currentUser?.username === username

  // Fan profile view
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
          {/* Avatar */}
          <div className="mb-4">
            {profileUser.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileUser.avatarUrl}
                alt={profileUser.displayName}
                className="w-28 h-28 rounded-full object-cover border-4 border-[#2a2a30] shadow-2xl"
              />
            ) : (
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 border-[#2a2a30] shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              >
                {fanInitials}
              </div>
            )}
          </div>
          {/* Name + username */}
          <h1 className="text-2xl font-bold text-white mb-1">{profileUser.displayName}</h1>
          <p className="text-[#8888a0] text-sm mb-3">@{profileUser.username}</p>
          {/* Bio */}
          {profileUser.bio && (
            <p className="text-[#b0b0c8] text-sm leading-relaxed max-w-sm mb-4">{profileUser.bio}</p>
          )}
          {/* Edit profile section if own profile */}
          {isOwnProfile && (
            <div className="w-full max-w-md mt-4">
              <EditProfileInline
                displayName={profileUser.displayName}
                bio={profileUser.bio ?? ''}
                avatarUrl={profileUser.avatarUrl ?? ''}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Creator profile view
  let isSubscribed = false
  let unlockedPostIds: string[] = []
  let unreadMessages = 0

  if (currentUser) {
    const sub = await prisma.subscription.findUnique({
      where: {
        subscriberId_creatorId: { subscriberId: currentUser.id, creatorId: profileUser.id },
      },
    })
    isSubscribed = sub?.status === 'ACTIVE'
    const unlocks = await prisma.postUnlock.findMany({
      where: { userId: currentUser.id, post: { creatorId: profileUser.id } },
      select: { postId: true },
    })
    unlockedPostIds = unlocks.map((u: { postId: string }) => u.postId)
    unreadMessages = await prisma.message.count({
      where: { receiverId: currentUser.id, isRead: false },
    })
  }

  const postsWithAccess = profileUser.posts.map((post: typeof profileUser.posts[number]) => ({
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

  const photoPosts = profileUser.posts.filter((p: typeof profileUser.posts[number]) =>
    p.mediaUrls.length > 0 && !p.mediaUrls[0].match(/\.(mp4|mov|webm|ogg)/i)
  ).length
  const videoPosts = profileUser.posts.filter((p: typeof profileUser.posts[number]) =>
    p.mediaUrls.length > 0 && !!p.mediaUrls[0].match(/\.(mp4|mov|webm|ogg)/i)
  ).length

  void unreadMessages // used in layout

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      {/* Banner */}
      <div
        className="relative w-full h-48"
        style={
          profileUser.coverUrl
            ? { background: `url(${profileUser.coverUrl}) center/cover no-repeat` }
            : { background: 'linear-gradient(135deg, #2a0a2e 0%, #1a0a3a 50%, #0d0d0f 100%)' }
        }
      >
        <div
          className="absolute inset-0"
          style={{
            background: profileUser.coverUrl
              ? 'linear-gradient(to bottom, transparent 40%, rgba(13,13,15,0.8) 100%)'
              : 'linear-gradient(135deg, rgba(224,64,251,0.25), rgba(124,77,255,0.25), rgba(13,13,15,0.4))',
          }}
        />
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
            {profileUser.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileUser.avatarUrl}
                alt={profileUser.displayName}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#0d0d0f] shadow-2xl"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-[#0d0d0f] shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              >
                {profileUser.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!isOwnProfile && currentUser && (
            <div className="flex items-center gap-2 pb-1">
              <Link
                href={`/messages?with=${profileUser.id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-[#2a2a30] text-white hover:border-[#e040fb44] hover:bg-[#161618] transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Message
              </Link>
              <TipButton creatorId={profileUser.id} creatorName={profileUser.displayName} />
            </div>
          )}
        </div>

        {/* Name + username */}
        <div className="mb-1 flex items-center gap-2">
          <h1 className="font-bold text-white leading-tight" style={{ fontSize: '22px' }}>{profileUser.displayName}</h1>
          <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" title="Online" />
        </div>
        <p className="text-[#8888a0] text-sm mb-3">@{profileUser.username}</p>

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
            <span className="font-bold text-white">{profileUser._count.subscribers.toLocaleString()}</span>
            <span>subscribers</span>
          </div>
        </div>

        {/* Bio */}
        {profileUser.bio && (
          <p className="text-[#b0b0c8] text-sm leading-relaxed mb-5 max-w-lg">{profileUser.bio}</p>
        )}

        {/* Own profile edit */}
        {isOwnProfile && (
          <div className="mb-6">
            <EditProfileInline
              displayName={profileUser.displayName}
              bio={profileUser.bio ?? ''}
              avatarUrl={profileUser.avatarUrl ?? ''}
            />
          </div>
        )}

        {/* Subscribe button */}
        {!isSubscribed && !isOwnProfile && currentUser && (
          <div className="mb-5">
            <SubscribeButton
              creatorId={profileUser.id}
              creatorName={profileUser.displayName}
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

        <ProfileTabs posts={postsWithAccess} isOwnProfile={isOwnProfile} />
      </div>

      {/* Sticky subscribe bar — mobile */}
      {!isSubscribed && !isOwnProfile && currentUser && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 bg-gradient-to-t from-[#0d0d0f] to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <SubscribeButton
              creatorId={profileUser.id}
              creatorName={profileUser.displayName}
              price={subPrice}
              fullWidth
            />
          </div>
        </div>
      )}
    </div>
  )
}
