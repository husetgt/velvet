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

    // Gather unlocks (spends) and tips (spends) paid from wallet
    const [unlocks, tips] = await Promise.all([
      prisma.postUnlock.findMany({
        where: { userId: user.id },
        include: { post: { select: { title: true, creator: { select: { displayName: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.tip.findMany({
        where: { tipperId: user.id },
        include: { creator: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ])

    type Transaction = {
      id: string
      type: 'deposit' | 'unlock' | 'tip'
      amountCents: number
      description: string
      createdAt: string
    }

    const transactions: Transaction[] = [
      ...unlocks.map((u) => ({
        id: u.id,
        type: 'unlock' as const,
        amountCents: -Math.round(Number(u.paidPrice) * 100),
        description: `Unlocked post${u.post?.title ? ` "${u.post.title}"` : ''} by ${u.post?.creator?.displayName ?? 'creator'}`,
        createdAt: u.createdAt.toISOString(),
      })),
      ...tips.map((t) => ({
        id: t.id,
        type: 'tip' as const,
        amountCents: -Math.round(Number(t.amount) * 100),
        description: `Tipped ${t.creator?.displayName ?? 'creator'}${t.message ? ` — "${t.message}"` : ''}`,
        createdAt: t.createdAt.toISOString(),
      })),
    ]

    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ transactions: transactions.slice(0, 50) })
  } catch (err) {
    console.error('wallet/transactions error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
