import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Creators list cached for 60 s — doesn't change often
const getCachedCreators = unstable_cache(
  async () =>
    prisma.user.findMany({
      where: { isCreator: true },
      select: {
        id: true,
        displayName: true,
        username: true,
        bio: true,
        coverUrl: true,
        avatarUrl: true,
        subscriptionPrice: true,
        _count: { select: { subscribers: true, posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ['creators-list'],
  { revalidate: 60 }
)

// ─── Skeleton ───────────────────────────────────────────────────────────────
function CreatorSkeleton() {
  return (
    <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] overflow-hidden animate-pulse">
      <div className="h-28 bg-[#2a2a30]" />
      <div className="px-4 pb-4 pt-0">
        <div className="relative -mt-7 mb-2">
          <div className="w-14 h-14 rounded-full bg-[#3a3a40] border-4 border-[#161618]" />
        </div>
        <div className="h-3 bg-[#2a2a30] rounded w-28 mb-1.5" />
        <div className="h-2.5 bg-[#2a2a30] rounded w-20 mb-4" />
        <div className="flex justify-between">
          <div className="h-6 bg-[#2a2a30] rounded w-24" />
          <div className="h-6 bg-[#2a2a30] rounded w-20" />
        </div>
      </div>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {[0,1,2,3,4,5].map(i => <CreatorSkeleton key={i} />)}
    </div>
  )
}

// ─── Async grid (streamed) ───────────────────────────────────────────────────
async function CreatorsGrid() {
  const [user, creators] = await Promise.all([
    getCurrentUser(),
    getCachedCreators(),
  ])
  if (!user) redirect('/login')

  const userSubscriptions = await prisma.subscription.findMany({
    where: { subscriberId: user.id, status: 'ACTIVE' },
    select: { creatorId: true },
  })
  const subscribedIds = new Set(userSubscriptions.map((s: { creatorId: string }) => s.creatorId))

  type Creator = typeof creators[number]

  if (creators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 sm:py-32 border border-dashed border-[#2a2a30] rounded-2xl">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))' }}>
          <svg className="w-7 h-7 text-[#e040fb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <p className="text-white font-semibold mb-1">No creators yet</p>
        <p className="text-[#8888a0] text-sm">Check back soon!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {creators.map((creator: Creator) => {
        const isSubscribed = subscribedIds.has(creator.id)
        return (
          <Link
            key={creator.id}
            href={`/${creator.username}`}
            prefetch
            className="group relative rounded-2xl overflow-hidden border border-[#2a2a30] bg-[#161618] transition-all duration-200 hover:-translate-y-1 hover:border-[#e040fb44] hover:shadow-[0_8px_32px_rgba(224,64,251,0.12)] flex flex-col"
          >
            {/* Banner */}
            <div
              className="h-24 sm:h-28 w-full relative shrink-0"
              style={creator.coverUrl ? { background: `url(${creator.coverUrl}) center/cover` } : { background: 'linear-gradient(135deg, rgba(224,64,251,0.35), rgba(124,77,255,0.35))' }}
            >
              <div className="absolute inset-0 bg-black/20" />
            </div>

            <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 flex flex-col flex-1">
              <div className="relative -mt-7 mb-2">
                {creator.avatarUrl
                  ? <img src={creator.avatarUrl} alt={creator.displayName} className="w-14 h-14 rounded-full object-cover border-4 border-[#161618] shadow-xl" /> // eslint-disable-line @next/next/no-img-element
                  : <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white border-4 border-[#161618] shadow-xl" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>{creator.displayName.charAt(0).toUpperCase()}</div>
                }
              </div>

              <div className="mb-2">
                <div className="font-bold text-white text-sm leading-tight truncate">{creator.displayName}</div>
                <div className="text-xs text-[#8888a0] mt-0.5">@{creator.username}</div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#8888a0] mt-auto mb-3">
                <span><span className="text-white font-semibold">{creator._count.subscribers.toLocaleString()}</span> fans</span>
                <span className="text-[#2a2a30]">•</span>
                <span><span className="text-white font-semibold">{creator._count.posts}</span> posts</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                {creator.subscriptionPrice ? (
                  <div className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.12), rgba(124,77,255,0.12))', border: '1px solid rgba(224,64,251,0.25)', color: '#e040fb' }}>
                    From ${Number(creator.subscriptionPrice).toFixed(2)}/mo
                  </div>
                ) : (
                  <div className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#8888a0] border border-[#2a2a30]">Free</div>
                )}
                {isSubscribed ? (
                  <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1" style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.12), rgba(124,77,255,0.12))', border: '1px solid rgba(224,64,251,0.35)', color: '#e040fb' }}>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    Subscribed
                  </div>
                ) : (
                  <div className="px-4 py-1.5 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
                    Subscribe
                  </div>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// ─── Page shell ──────────────────────────────────────────────────────────────
export default function ExplorePage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="relative max-w-xl">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#8888a0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search creators..."
              readOnly
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#161618] border border-[#2a2a30] text-white placeholder-[#8888a0] focus:outline-none cursor-default text-sm min-h-[44px]"
            />
          </div>
        </div>
        <Suspense fallback={<GridSkeleton />}>
          <CreatorsGrid />
        </Suspense>
      </div>
    </div>
  )
}
