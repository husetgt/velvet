import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const me = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const otherUserId = searchParams.get('userId')
    if (!otherUserId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    // Get spending of the OTHER user on ME (if I'm a creator) or vice versa
    const [tipsGiven, unlocksGiven, subscription] = await Promise.all([
      prisma.tip.findMany({
        where: { tipperId: otherUserId, creatorId: me.id },
        select: { amount: true },
      }),
      prisma.postUnlock.findMany({
        where: { userId: otherUserId, post: { creatorId: me.id } },
        select: { paidPrice: true },
      }),
      prisma.subscription.findFirst({
        where: {
          OR: [
            { subscriberId: otherUserId, creatorId: me.id },
            { subscriberId: me.id, creatorId: otherUserId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const tipsTotal = tipsGiven.reduce((s, t) => s + Number(t.amount), 0)
    const ppvTotal = unlocksGiven.reduce((s, u) => s + Number(u.paidPrice), 0)

    let subPrice: number | null = null
    if (subscription) {
      const creator = await prisma.user.findUnique({
        where: { id: subscription.creatorId },
        select: { subscriptionPrice: true },
      })
      subPrice = creator?.subscriptionPrice ? Number(creator.subscriptionPrice) : null
    }

    return NextResponse.json({
      totalSpent: tipsTotal + ppvTotal,
      ppvSpent: ppvTotal,
      tipsGiven: tipsTotal,
      subStatus: subscription?.status ?? 'NONE',
      subPrice,
      subSince: subscription?.createdAt.toISOString() ?? null,
    })
  } catch (err) {
    console.error('messages/spending error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
