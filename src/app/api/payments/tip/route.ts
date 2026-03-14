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
    const { creatorId, amount, message } = await req.json()
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

    const customerId = await getOrCreateStripeCustomer(tipper.id, tipper.email)
    const amountCents = Math.round(Number(amount) * 100)

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

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err: any) {
    console.error('Tip error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
