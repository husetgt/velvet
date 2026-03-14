import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { creatorId, amount, message, postId } = await req.json()

    if (!creatorId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
    }

    const [tipper, creator] = await Promise.all([
      prisma.user.findUnique({ where: { email: authUser.email } }),
      prisma.user.findUnique({ where: { id: creatorId } }),
    ])

    if (!tipper) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    if (tipper.id === creator.id) return NextResponse.json({ error: 'Cannot tip yourself' }, { status: 400 })

    const amountInCents = Math.round(amount * 100)
    if (tipper.creditBalance < amountInCents) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    await prisma.$transaction([
      prisma.tip.create({
        data: {
          tipperId: tipper.id,
          creatorId: creator.id,
          postId: postId || null,
          amount,
          message: message || null,
        },
      }),
      prisma.user.update({
        where: { id: tipper.id },
        data: { creditBalance: { decrement: amountInCents } },
      }),
      prisma.user.update({
        where: { id: creator.id },
        data: { creditBalance: { increment: Math.round(amountInCents * 0.9) } },
      }),
      prisma.creditTransaction.create({
        data: {
          userId: tipper.id,
          amount: -amountInCents,
          type: 'TIP',
          description: `Tip to @${creator.username}`,
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('tip error', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
