import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function ExplorePage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser?.email) redirect('/login')

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  if (!user) redirect('/login')

  const creators = await prisma.user.findMany({
    where: { isCreator: true },
    include: {
      _count: { select: { subscribers: true, posts: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Search bar */}
          <div className="mb-8">
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
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#161618] border border-[#2a2a30] text-white placeholder-[#8888a0] focus:outline-none cursor-default text-sm"
              />
            </div>
          </div>

          {creators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-[#2a2a30] rounded-2xl">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))' }}
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="url(#explore-empty)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="explore-empty" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e040fb" /><stop offset="100%" stopColor="#7c4dff" />
                    </linearGradient>
                  </defs>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-1">No creators yet</p>
              <p className="text-[#8888a0] text-sm">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {(
                creators as Array<{
                  id: string
                  displayName: string
                  username: string
                  bio: string | null
                  coverUrl: string | null
                  avatarUrl: string | null
                  subscriptionPrice: { toNumber?: () => number } | null
                  _count: { subscribers: number; posts: number }
                }>
              ).map((creator) => (
                <Link
                  key={creator.id}
                  href={`/${creator.username}`}
                  className="group relative rounded-2xl overflow-hidden border border-[#2a2a30] bg-[#161618] transition-all duration-200 hover:-translate-y-1 hover:border-[#e040fb44] hover:shadow-[0_8px_32px_rgba(224,64,251,0.12)] flex flex-col"
                >
                  {/* Banner */}
                  <div
                    className="h-28 w-full relative shrink-0"
                    style={
                      creator.coverUrl
                        ? { background: `url(${creator.coverUrl}) center/cover` }
                        : { background: 'linear-gradient(135deg, rgba(224,64,251,0.35), rgba(124,77,255,0.35))' }
                    }
                  >
                    <div className="absolute inset-0 bg-black/20" />
                  </div>

                  {/* Card body */}
                  <div className="px-4 pb-4 pt-0 flex flex-col flex-1">
                    {/* Avatar overlapping banner */}
                    <div className="relative -mt-7 mb-2">
                      {creator.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={creator.avatarUrl}
                          alt={creator.displayName}
                          className="w-14 h-14 rounded-full object-cover border-4 border-[#161618] shadow-xl"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white border-4 border-[#161618] shadow-xl"
                          style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                        >
                          {creator.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name + handle */}
                    <div className="mb-2">
                      <div className="font-bold text-white text-sm leading-tight truncate">{creator.displayName}</div>
                      <div className="text-xs text-[#8888a0] mt-0.5">@{creator.username}</div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-2 text-xs text-[#8888a0] mt-auto mb-3">
                      <span>
                        <span className="text-white font-semibold">{creator._count.subscribers.toLocaleString()}</span>{' '}
                        fans
                      </span>
                      <span className="text-[#2a2a30]">•</span>
                      <span>
                        <span className="text-white font-semibold">{creator._count.posts}</span>{' '}
                        posts
                      </span>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between gap-2">
                      {creator.subscriptionPrice ? (
                        <div
                          className="px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{
                            background: 'linear-gradient(135deg, rgba(224,64,251,0.12), rgba(124,77,255,0.12))',
                            border: '1px solid rgba(224,64,251,0.25)',
                            color: '#e040fb',
                          }}
                        >
                          From ${Number(creator.subscriptionPrice).toFixed(2)}/mo
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#8888a0] border border-[#2a2a30]">
                          Free
                        </div>
                      )}
                      <div
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity"
                        style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                      >
                        Subscribe
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
    </div>
  )
}
