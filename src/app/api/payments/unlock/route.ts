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
    const { postId } = await req.json()
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

    const customerId = await getOrCreateStripeCustomer(fan.id, fan.email)
    const amountCents = Math.round(Number(post.price) * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: customerId,
      metadata: { type: 'unlock', postId, userId: fan.id },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err: any) {
    console.error('Unlock error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
