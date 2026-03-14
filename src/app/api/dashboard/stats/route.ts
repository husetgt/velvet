import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const creator = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!creator || !creator.isCreator) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    // All-time earnings breakdowns
    const [allTips, allUnlocks, allSubscriptions] = await Promise.all([
      prisma.tip.findMany({
        where: { creatorId: creator.id },
        select: { amount: true, createdAt: true, tipperId: true, message: true,
          tipper: { select: { displayName: true, username: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.postUnlock.findMany({
        where: { post: { creatorId: creator.id } },
        select: { paidPrice: true, createdAt: true, userId: true,
          user: { select: { displayName: true, username: true, avatarUrl: true } },
          post: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.findMany({
        where: { creatorId: creator.id },
        select: { createdAt: true, subscriberId: true,
          subscriber: { select: { displayName: true, username: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const subPricePerMonth = creator.subscriptionPrice ? Number(creator.subscriptionPrice) : 0

    const totalTips = allTips.reduce((s, t) => s + Number(t.amount), 0)
    const totalUnlocks = allUnlocks.reduce((s, u) => s + Number(u.paidPrice), 0)
    // Estimate sub earnings: active subs * price (simplified)
    const activeSubs = await prisma.subscription.count({ where: { creatorId: creator.id, status: 'ACTIVE' } })
    const totalSubEarnings = activeSubs * subPricePerMonth

    const totalEarnings = totalTips + totalUnlocks + totalSubEarnings

    // This month
    const thisMonthTips = allTips.filter(t => t.createdAt >= thisMonthStart).reduce((s, t) => s + Number(t.amount), 0)
    const thisMonthUnlocks = allUnlocks.filter(u => u.createdAt >= thisMonthStart).reduce((s, u) => s + Number(u.paidPrice), 0)
    const thisMonthEarnings = thisMonthTips + thisMonthUnlocks + subPricePerMonth * activeSubs

    // Last month
    const lastMonthTips = allTips.filter(t => t.createdAt >= lastMonthStart && t.createdAt <= lastMonthEnd).reduce((s, t) => s + Number(t.amount), 0)
    const lastMonthUnlocks = allUnlocks.filter(u => u.createdAt >= lastMonthStart && u.createdAt <= lastMonthEnd).reduce((s, u) => s + Number(u.paidPrice), 0)
    const lastMonthEarnings = lastMonthTips + lastMonthUnlocks

    // Monthly chart — last 12 months
    const monthlyChart: { month: string; earnings: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      const label = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const mTips = allTips.filter(t => t.createdAt >= start && t.createdAt <= end).reduce((s, t) => s + Number(t.amount), 0)
      const mUnlocks = allUnlocks.filter(u => u.createdAt >= start && u.createdAt <= end).reduce((s, u) => s + Number(u.paidPrice), 0)
      monthlyChart.push({ month: label, earnings: mTips + mUnlocks })
    }

    // Top spenders (by total amount across tips + unlocks)
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

    // Recent transactions feed
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

    return NextResponse.json({
      totalEarnings,
      thisMonthEarnings,
      lastMonthEarnings,
      subEarnings: totalSubEarnings,
      messageEarnings: 0,
      postEarnings: totalUnlocks,
      tipEarnings: totalTips,
      activeSubs,
      totalSubs: allSubscriptions.length,
      topSpenders,
      recentTransactions,
      monthlyChart,
    })
  } catch (err) {
    console.error('dashboard/stats error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
