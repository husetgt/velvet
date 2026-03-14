import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { amountCents } = await req.json()
    if (!amountCents || amountCents < 100) {
      return NextResponse.json({ error: 'Minimum deposit is $1.00' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: 'Velvet Wallet Top-up',
              description: `Add $${(amountCents / 100).toFixed(2)} to your Velvet wallet`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'wallet_deposit',
        userId: user.id,
        amountCents: String(amountCents),
      },
      success_url: `${baseUrl}/wallet?deposit=success`,
      cancel_url: `${baseUrl}/wallet?deposit=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('wallet/deposit error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
