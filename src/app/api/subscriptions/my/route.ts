import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
            subscriptionPrice: true,
          },
        },
      },
    })

    const serialized = subscriptions.map(s => ({
      id: s.id,
      creatorId: s.creatorId,
      status: s.status,
      currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      creator: {
        id: s.creator.id,
        displayName: s.creator.displayName,
        username: s.creator.username,
        avatarUrl: s.creator.avatarUrl,
        subscriptionPrice: s.creator.subscriptionPrice ? Number(s.creator.subscriptionPrice) : null,
      },
    }))

    return NextResponse.json({ subscriptions: serialized })
  } catch (err) {
    console.error('subscriptions/my GET error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
