import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export async function POST(req: NextRequest) {
  try {
    const { postId, paymentIntentId } = await req.json()
    if (!postId || !paymentIntentId) {
      return NextResponse.json({ error: 'postId and paymentIntentId required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const fan = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!fan) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Verify payment succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Verify the payment belongs to this user
    if (paymentIntent.metadata.userId !== fan.id || paymentIntent.metadata.postId !== postId) {
      return NextResponse.json({ error: 'Payment mismatch' }, { status: 400 })
    }

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    // Create PostUnlock (upsert to be idempotent)
    await prisma.postUnlock.upsert({
      where: { userId_postId: { userId: fan.id, postId } },
      create: {
        userId: fan.id,
        postId,
        paidPrice: post.price ?? 0,
      },
      update: {},
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Confirm unlock error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
