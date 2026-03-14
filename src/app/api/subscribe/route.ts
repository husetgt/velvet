import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const contentType = req.headers.get('content-type') || ''
    let creatorId: string | null = null
    if (contentType.includes('application/json')) {
      const body = await req.json()
      creatorId = body?.creatorId ?? null
    } else {
      const formData = await req.formData()
      creatorId = formData.get('creatorId') as string | null
    }

    if (!creatorId) return NextResponse.json({ error: 'Missing creatorId' }, { status: 400 })

    const [subscriber, creator] = await Promise.all([
      prisma.user.findUnique({ where: { email: authUser.email } }),
      prisma.user.findUnique({ where: { id: creatorId as string } }),
    ])

    if (!subscriber) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!creator || !creator.isCreator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    if (subscriber.id === creator.id) return NextResponse.json({ error: 'Cannot subscribe to yourself' }, { status: 400 })

    const price = creator.subscriptionPrice ? Number(creator.subscriptionPrice) : 9.99
    const priceInCents = Math.round(price * 100)

    if (subscriber.creditBalance < priceInCents) {
      return NextResponse.json({ error: 'Insufficient credits. Please add more credits.' }, { status: 402 })
    }

    // Check existing subscription
    const existing = await prisma.subscription.findUnique({
      where: { subscriberId_creatorId: { subscriberId: subscriber.id, creatorId: creator.id } },
    })

    if (existing?.status === 'ACTIVE') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409 })
    }

    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    await prisma.$transaction([
      existing
        ? prisma.subscription.update({
            where: { id: existing.id },
            data: { status: 'ACTIVE', currentPeriodEnd: periodEnd },
          })
        : prisma.subscription.create({
            data: {
              subscriberId: subscriber.id,
              creatorId: creator.id,
              status: 'ACTIVE',
              currentPeriodEnd: periodEnd,
            },
          }),
      prisma.user.update({
        where: { id: subscriber.id },
        data: { creditBalance: { decrement: priceInCents } },
      }),
      prisma.user.update({
        where: { id: creator.id },
        data: { creditBalance: { increment: Math.round(priceInCents * 0.8) } },
      }),
      prisma.creditTransaction.create({
        data: {
          userId: subscriber.id,
          amount: -priceInCents,
          type: 'SUBSCRIPTION',
          description: `Subscription to @${creator.username}`,
        },
      }),
    ])

    // Redirect back to creator profile if it was a form POST
    const referer = req.headers.get('referer') || `/${creator.username}`
    return NextResponse.redirect(new URL(referer, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  } catch (err: any) {
    console.error('subscribe error', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
