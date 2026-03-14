import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

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
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null }
        const stripeSubscriptionId = invoice.subscription as string | null
        if (!stripeSubscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId) as unknown as Stripe.Subscription & { current_period_end: number }
        const fanId = subscription.metadata?.fanId
        const creatorId = subscription.metadata?.creatorId
        if (!fanId || !creatorId) break

        const periodEnd = new Date(subscription.current_period_end * 1000)

        await prisma.subscription.upsert({
          where: { subscriberId_creatorId: { subscriberId: fanId, creatorId } },
          create: {
            subscriberId: fanId,
            creatorId,
            status: 'ACTIVE',
            stripeSubscriptionId,
            currentPeriodEnd: periodEnd,
          },
          update: {
            status: 'ACTIVE',
            stripeSubscriptionId,
            currentPeriodEnd: periodEnd,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'CANCELLED' },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null }
        const stripeSubscriptionId = invoice.subscription as string | null
        if (!stripeSubscriptionId) break

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId },
          data: { status: 'EXPIRED' },
        })
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.type === 'wallet_deposit') {
          const userId = session.metadata.userId
          const amountCents = parseInt(session.metadata.amountCents || '0', 10)
          if (userId && amountCents > 0) {
            await prisma.user.update({
              where: { id: userId },
              data: { walletBalance: { increment: amountCents } },
            })
          }
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { type, postId, userId, creatorId, tipperId, message } = paymentIntent.metadata

        if (type === 'unlock' && postId && userId) {
          const post = await prisma.post.findUnique({ where: { id: postId } })
          if (post) {
            await prisma.postUnlock.upsert({
              where: { userId_postId: { userId, postId } },
              create: { userId, postId, paidPrice: post.price ?? 0 },
              update: {},
            })
          }
        }

        if (type === 'tip' && creatorId && tipperId) {
          const amountDollars = paymentIntent.amount / 100
          // Idempotency: check if tip already exists for this paymentIntentId not available on Tip model,
          // so we just create; the confirm-tip endpoint is the primary path.
          // This webhook serves as a fallback.
          const existingTips = await prisma.tip.findMany({
            where: {
              tipperId,
              creatorId,
              amount: amountDollars,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          })
          // Only create if no recent tip (within 30s) to avoid duplicates
          const recentCutoff = new Date(Date.now() - 30000)
          if (!existingTips.length || existingTips[0].createdAt < recentCutoff) {
            await prisma.tip.create({
              data: {
                tipperId,
                creatorId,
                amount: amountDollars,
                message: message || null,
              },
            })
          }
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Webhook handler error', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}


