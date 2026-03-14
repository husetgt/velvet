import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { postId } = await req.json()
    if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 })

    const [user, post] = await Promise.all([
      prisma.user.findUnique({ where: { email: authUser.email } }),
      prisma.post.findUnique({ where: { id: postId }, include: { creator: true } }),
    ])

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (!post.isLocked) return NextResponse.json({ error: 'Post is not locked' }, { status: 400 })
    if (!post.price) return NextResponse.json({ error: 'Post has no price set' }, { status: 400 })

    // Check already unlocked
    const alreadyUnlocked = await prisma.postUnlock.findUnique({
      where: { userId_postId: { userId: user.id, postId: post.id } },
    })
    if (alreadyUnlocked) return NextResponse.json({ error: 'Already unlocked' }, { status: 409 })

    const priceInCents = Math.round(Number(post.price) * 100)
    if (user.creditBalance < priceInCents) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    await prisma.$transaction([
      prisma.postUnlock.create({
        data: { userId: user.id, postId: post.id, paidPrice: post.price },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { creditBalance: { decrement: priceInCents } },
      }),
      prisma.user.update({
        where: { id: post.creatorId },
        data: { creditBalance: { increment: Math.round(priceInCents * 0.8) } },
      }),
      prisma.creditTransaction.create({
        data: {
          userId: user.id,
          amount: -priceInCents,
          type: 'UNLOCK',
          description: `Unlocked post "${post.title || post.id}"`,
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('unlock error', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
