import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.stripeCustomerId) return user.stripeCustomerId

  const customer = await stripe.customers.create({ email, metadata: { userId } })
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } })
  return customer.id
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { postId, paymentMethod } = body as { postId?: string; paymentMethod?: string }
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const fan = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!fan) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (!post.price) return NextResponse.json({ error: 'Post is not priced for individual unlock' }, { status: 400 })

    // Check not already unlocked
    const existing = await prisma.postUnlock.findUnique({
      where: { userId_postId: { userId: fan.id, postId } },
    })
    if (existing) return NextResponse.json({ error: 'Already unlocked' }, { status: 400 })

    const amountCents = Math.round(Number(post.price) * 100)

    // Force wallet payment if explicitly requested
    if (paymentMethod === 'wallet') {
      if (fan.walletBalance < amountCents) {
        return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 402 })
      }
      await prisma.$transaction([
        prisma.user.update({ where: { id: fan.id }, data: { walletBalance: { decrement: amountCents } } }),
        prisma.postUnlock.create({ data: { userId: fan.id, postId, paidPrice: post.price } }),
      ])
      return NextResponse.json({ success: true, method: 'wallet' })
    }

    // Auto wallet if sufficient
    if (fan.walletBalance >= amountCents) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: fan.id },
          data: { walletBalance: { decrement: amountCents } },
        }),
        prisma.postUnlock.create({
          data: { userId: fan.id, postId, paidPrice: post.price },
        }),
      ])
      return NextResponse.json({ success: true, method: 'wallet' })
    }

    // Fall back to Stripe PaymentIntent
    const customerId = await getOrCreateStripeCustomer(fan.id, fan.email)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: customerId,
      metadata: { type: 'unlock', postId, userId: fan.id },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, method: 'stripe' })
  } catch (err: unknown) {
    console.error('Unlock error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
