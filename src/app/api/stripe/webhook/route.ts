import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature verification failed', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const { userId, creditAmount, type } = session.metadata ?? {}

      if (type === 'DEPOSIT' && userId && creditAmount) {
        const amount = parseInt(creditAmount)
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { creditBalance: { increment: amount } },
          }),
          prisma.creditTransaction.create({
            data: {
              userId,
              amount,
              type: 'DEPOSIT',
              description: `Credits deposit via Stripe`,
              stripePaymentIntentId: session.payment_intent as string,
            },
          }),
        ])
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: 'CANCELLED' },
      })
    }
  } catch (err) {
    console.error('Webhook handler error', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

export const config = { api: { bodyParser: false } }
