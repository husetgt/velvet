import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import UnsubscribeButton from './UnsubscribeButton'

export default async function FollowingPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.email) redirect('/login')

  const user = await prisma.user.findUnique({ where: { email: authUser.email } })
  if (!user) redirect('/login')

  const subscriptions = await prisma.subscription.findMany({
    where: { subscriberId: user.id, status: 'ACTIVE' },
    include: {
      creator: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatarUrl: true,
          bio: true,
          subscriptionPrice: true,
          _count: { select: { subscribers: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  type SubWithCreator = typeof subscriptions[number]

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Following</h1>
          <span className="text-sm text-[#8888a0]">{subscriptions.length} creator{subscriptions.length !== 1 ? 's' : ''}</span>
        </div>

        {subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{
                background: 'linear-gradient(135deg, rgba(224,64,251,0.1), rgba(124,77,255,0.1))',
                border: '1px solid rgba(224,64,251,0.2)',
              }}
            >
              <svg className="w-9 h-9 text-[#e040fb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Not following anyone yet</h2>
            <p className="text-[#8888a0] text-sm max-w-xs leading-relaxed mb-8">
              Subscribe to creators to see them here.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Discover creators
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(subscriptions as SubWithCreator[]).map(sub => {
              const creator = sub.creator
              const price = creator.subscriptionPrice ? Number(creator.subscriptionPrice) : null
              const initials = creator.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
              return (
                <div
                  key={sub.id}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-[#2a2a30] bg-[#161618] hover:border-[#e040fb22] transition-all"
                >
                  {/* Avatar */}
                  <div className="shrink-0">
                    {creator.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={creator.avatarUrl} alt={creator.displayName} className="w-14 h-14 rounded-full object-cover border-2 border-[#2a2a30]" />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-white text-sm truncate">{creator.displayName}</span>
                      {price && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, rgba(224,64,251,0.1), rgba(124,77,255,0.1))',
                            border: '1px solid rgba(224,64,251,0.2)',
                            color: '#e040fb',
                          }}
                        >
                          ${price.toFixed(2)}/mo
                        </span>
                      )}
                    </div>
                    <p className="text-[#8888a0] text-xs">@{creator.username}</p>
                    {creator.bio && (
                      <p className="text-[#8888a0] text-xs mt-1 truncate">{creator.bio}</p>
                    )}
                    <p className="text-[#555568] text-[10px] mt-1">
                      {creator._count.subscribers.toLocaleString()} subscribers
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/${creator.username}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8888a0] border border-[#2a2a30] hover:text-white hover:border-[#e040fb44] transition-all"
                    >
                      View
                    </Link>
                    <UnsubscribeButton subscriptionId={sub.id} creatorName={creator.displayName} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
