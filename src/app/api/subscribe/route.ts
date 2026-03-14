import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// Replaced by /api/payments/subscribe
export async function POST() {
  return NextResponse.json({ error: 'Use /api/payments/subscribe' }, { status: 410 })
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { subscriptionId } = await req.json()
    if (!subscriptionId) return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 })

    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } })
    if (!sub || sub.subscriberId !== user.id) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Unsubscribe error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
