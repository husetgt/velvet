import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export async function POST(req: NextRequest) {
  try {
    const { creatorId, amount, message, paymentIntentId } = await req.json()
    if (!creatorId || !amount || !paymentIntentId) {
      return NextResponse.json({ error: 'creatorId, amount and paymentIntentId required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tipper = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!tipper) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Verify payment succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Verify the payment belongs to this tipper
    if (paymentIntent.metadata.tipperId !== tipper.id) {
      return NextResponse.json({ error: 'Payment mismatch' }, { status: 400 })
    }

    // Create Tip record
    await prisma.tip.create({
      data: {
        tipperId: tipper.id,
        creatorId,
        amount,
        message: message ?? null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Confirm tip error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
