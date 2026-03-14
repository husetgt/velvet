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
    const { creatorId } = await req.json()
    if (!creatorId) return NextResponse.json({ error: 'creatorId required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const fan = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!fan) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const creator = await prisma.user.findUnique({ where: { id: creatorId } })
    if (!creator || !creator.isCreator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

    if (fan.id === creatorId) return NextResponse.json({ error: 'Cannot subscribe to yourself' }, { status: 400 })

    const priceInDollars = creator.subscriptionPrice ? Number(creator.subscriptionPrice) : 9.99

    // Get or create Stripe Price for this creator
    let stripePriceId = creator.stripePriceId
    if (!stripePriceId) {
      const product = await stripe.products.create({
        name: `Subscription to ${creator.displayName}`,
        metadata: { creatorId: creator.id },
      })
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(priceInDollars * 100),
        currency: 'usd',
        recurring: { interval: 'month' },
      })
      stripePriceId = price.id
      await prisma.user.update({ where: { id: creatorId }, data: { stripePriceId } })
    }

    const customerId = await getOrCreateStripeCustomer(fan.id, fan.email)

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: stripePriceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: { fanId: fan.id, creatorId },
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent }
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
    })
  } catch (err: any) {
    console.error('Subscribe error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
