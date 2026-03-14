import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'
import { Suspense } from 'react'

async function fetchDashboardStats(creatorId: string, subscriptionPrice: number) {
  try {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    const [allTips, allUnlocks, allSubscriptions, activeSubs] = await Promise.all([
      prisma.tip.findMany({
        where: { creatorId },
        select: { amount: true, createdAt: true, tipperId: true, message: true,
          tipper: { select: { displayName: true, username: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.postUnlock.findMany({
        where: { post: { creatorId } },
        select: { paidPrice: true, createdAt: true, userId: true,
          user: { select: { displayName: true, username: true, avatarUrl: true } },
          post: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.findMany({
        where: { creatorId },
        select: { createdAt: true, subscriberId: true,
          subscriber: { select: { displayName: true, username: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.count({ where: { creatorId, status: 'ACTIVE' } }),
    ])

    const subPricePerMonth = subscriptionPrice
    const totalTips = allTips.reduce((s, t) => s + Number(t.amount), 0)
    const totalUnlocks = allUnlocks.reduce((s, u) => s + Number(u.paidPrice), 0)
    const totalSubEarnings = activeSubs * subPricePerMonth
    const totalEarnings = totalTips + totalUnlocks + totalSubEarnings

    const thisMonthTips = allTips.filter(t => t.createdAt >= thisMonthStart).reduce((s, t) => s + Number(t.amount), 0)
    const thisMonthUnlocks = allUnlocks.filter(u => u.createdAt >= thisMonthStart).reduce((s, u) => s + Number(u.paidPrice), 0)
    const thisMonthEarnings = thisMonthTips + thisMonthUnlocks + subPricePerMonth * activeSubs

    const lastMonthTips = allTips.filter(t => t.createdAt >= lastMonthStart && t.createdAt <= lastMonthEnd).reduce((s, t) => s + Number(t.amount), 0)
    const lastMonthUnlocks = allUnlocks.filter(u => u.createdAt >= lastMonthStart && u.createdAt <= lastMonthEnd).reduce((s, u) => s + Number(u.paidPrice), 0)
    const lastMonthEarnings = lastMonthTips + lastMonthUnlocks

    const monthlyChart: { month: string; earnings: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      const label = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const mTips = allTips.filter(t => t.createdAt >= start && t.createdAt <= end).reduce((s, t) => s + Number(t.amount), 0)
      const mUnlocks = allUnlocks.filter(u => u.createdAt >= start && u.createdAt <= end).reduce((s, u) => s + Number(u.paidPrice), 0)
      monthlyChart.push({ month: label, earnings: mTips + mUnlocks })
    }

    const spenderMap = new Map<string, { displayName: string; username: string; avatarUrl: string | null; total: number }>()
    for (const t of allTips) {
      const existing = spenderMap.get(t.tipperId)
      if (existing) { existing.total += Number(t.amount) }
      else spenderMap.set(t.tipperId, { ...t.tipper, total: Number(t.amount) })
    }
    for (const u of allUnlocks) {
      const existing = spenderMap.get(u.userId)
      if (existing) { existing.total += Number(u.paidPrice) }
      else spenderMap.set(u.userId, { ...u.user, total: Number(u.paidPrice) })
    }
    const topSpenders = Array.from(spenderMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([id, v]) => ({ id, ...v }))

    type TxItem = { id: string; type: 'tip' | 'unlock' | 'subscription'; user: { displayName: string; username: string; avatarUrl: string | null }; amount: number; description: string; createdAt: string }
    const recentTransactions: TxItem[] = [
      ...allTips.slice(0, 20).map(t => ({
        id: `tip-${t.createdAt.getTime()}-${t.tipperId}`,
        type: 'tip' as const,
        user: t.tipper,
        amount: Number(t.amount),
        description: t.message ? `"${t.message}"` : 'Tip received',
        createdAt: t.createdAt.toISOString(),
      })),
      ...allUnlocks.slice(0, 20).map(u => ({
        id: `unlock-${u.createdAt.getTime()}-${u.userId}`,
        type: 'unlock' as const,
        user: u.user,
        amount: Number(u.paidPrice),
        description: `Unlocked${u.post?.title ? ` "${u.post.title}"` : ' a post'}`,
        createdAt: u.createdAt.toISOString(),
      })),
      ...allSubscriptions.slice(0, 20).map(s => ({
        id: `sub-${s.createdAt.getTime()}-${s.subscriberId}`,
        type: 'subscription' as const,
        user: s.subscriber,
        amount: subPricePerMonth,
        description: 'New subscriber',
        createdAt: s.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)

    return {
      totalEarnings, thisMonthEarnings, lastMonthEarnings,
      subEarnings: totalSubEarnings, messageEarnings: 0,
      postEarnings: totalUnlocks, tipEarnings: totalTips,
      activeSubs, totalSubs: allSubscriptions.length,
      topSpenders, recentTransactions, monthlyChart,
    }
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser?.email) redirect('/login')

  let user = await prisma.user.findUnique({
    where: { email: authUser.email },
    include: {
      posts: { orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { subscribers: true } },
    },
  })

  // If auth user exists but DB user doesn't, create it
  if (!user) {
    const username = authUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') + Math.floor(Math.random() * 1000)
    const created = await prisma.user.create({
      data: {
        email: authUser.email,
        username,
        displayName: authUser.user_metadata?.full_name || username,
        role: 'FAN',
        isCreator: false,
      },
    })
    user = await prisma.user.findUnique({
      where: { id: created.id },
      include: {
        posts: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { subscribers: true } },
      },
    })
  }

  if (!user) redirect('/login')

  // Pre-fetch stats server-side for instant render
  const initialStats = user.isCreator
    ? await fetchDashboardStats(user.id, user.subscriptionPrice ? Number(user.subscriptionPrice) : 0)
    : null

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#0d0d0f]"><div className="w-8 h-8 rounded-full border-2 border-[#e040fb] border-t-transparent animate-spin" /></div>}>
      <DashboardClient
        user={{
          id: user.id,
          displayName: user.displayName,
          username: user.username,
          role: user.role,
          avatarUrl: user.avatarUrl,
          subscriberCount: user._count.subscribers,
        }}
        initialStats={initialStats}
      />
    </Suspense>
  )
}
