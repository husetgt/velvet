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
    const { creatorId, amount, message, paymentMethod } = body as { creatorId?: string; amount?: number; message?: string; paymentMethod?: string }
    if (!creatorId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'creatorId and a positive amount are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tipper = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!tipper) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const creator = await prisma.user.findUnique({ where: { id: creatorId } })
    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

    const amountCents = Math.round(Number(amount) * 100)

    // Force wallet payment if explicitly requested
    if (paymentMethod === 'wallet') {
      if (tipper.walletBalance < amountCents) {
        return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 402 })
      }
      await prisma.$transaction([
        prisma.user.update({ where: { id: tipper.id }, data: { walletBalance: { decrement: amountCents } } }),
        prisma.tip.create({ data: { tipperId: tipper.id, creatorId, amount: Number(amount), message: message ?? null } }),
      ])
      return NextResponse.json({ success: true, method: 'wallet' })
    }

    // Auto wallet if sufficient
    if (tipper.walletBalance >= amountCents) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: tipper.id },
          data: { walletBalance: { decrement: amountCents } },
        }),
        prisma.tip.create({
          data: {
            tipperId: tipper.id,
            creatorId,
            amount: Number(amount),
            message: message ?? null,
          },
        }),
      ])
      return NextResponse.json({ success: true, method: 'wallet' })
    }

    // Fall back to Stripe PaymentIntent
    const customerId = await getOrCreateStripeCustomer(tipper.id, tipper.email)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: customerId,
      metadata: {
        type: 'tip',
        creatorId,
        tipperId: tipper.id,
        message: message ?? '',
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, method: 'stripe' })
  } catch (err: unknown) {
    console.error('Tip error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
  }
}
