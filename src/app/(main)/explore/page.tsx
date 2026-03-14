import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AppSidebar from '@/components/AppSidebar'

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
    <div className="flex h-screen bg-[#0d0d0f] text-white overflow-hidden">
      <AppSidebar
        user={{
          displayName: user.displayName,
          username: user.username,
          role: user.role,
        }}
        activePath="/explore"
      />

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Explore Creators</h1>
            <p className="text-[#8888a0] text-sm mt-1">Discover amazing creators to follow</p>
          </div>

          {creators.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-[#2a2a30] rounded-2xl">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))' }}
              >
                🔍
              </div>
              <p className="text-white font-semibold mb-2">No creators yet</p>
              <p className="text-[#8888a0] text-sm">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(creators as Array<{
                id: string
                displayName: string
                username: string
                bio: string | null
                subscriptionPrice: { toNumber?: () => number } | null
                _count: { subscribers: number; posts: number }
              }>).map((creator) => (
                <div
                  key={creator.id}
                  className="rounded-2xl border border-[#2a2a30] bg-[#161618] p-5 hover:border-[#e040fb33] transition-all group"
                >
                  {/* Avatar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                    >
                      {creator.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{creator.displayName}</div>
                      <div className="text-xs text-[#8888a0]">@{creator.username}</div>
                    </div>
                  </div>

                  {/* Bio */}
                  {creator.bio && (
                    <p className="text-[#8888a0] text-sm leading-relaxed mb-4 line-clamp-2">
                      {creator.bio}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-[#555568] mb-4">
                    <span>
                      <span className="text-white font-medium">
                        {creator._count.subscribers.toLocaleString()}
                      </span>{' '}
                      subscribers
                    </span>
                    <span>
                      <span className="text-white font-medium">{creator._count.posts}</span> posts
                    </span>
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between gap-2">
                    {creator.subscriptionPrice && (
                      <div className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#e040fb] border border-[#e040fb33]">
                        ${Number(creator.subscriptionPrice).toFixed(2)}/mo
                      </div>
                    )}
                    <Link
                      href={`/${creator.username}`}
                      className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                      style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
