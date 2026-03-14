import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const { email, username, displayName, password, role, subscriptionPrice } = await req.json()

    if (!email || !username || !displayName || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Check username availability
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })
    if (existing) {
      return NextResponse.json(
        { error: existing.email === email ? 'Email already in use' : 'Username already taken' },
        { status: 409 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!data.user) return NextResponse.json({ error: 'Signup failed' }, { status: 500 })

    const isCreator = role === 'CREATOR'
    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName,
        role: isCreator ? 'CREATOR' : 'FAN',
        isCreator,
        subscriptionPrice: isCreator && subscriptionPrice ? parseFloat(subscriptionPrice) : undefined,
      },
    })

    // Fire-and-forget welcome email
    sendWelcomeEmail(email, displayName).catch(() => {})

    return NextResponse.json({ user: { id: user.id, username: user.username } }, { status: 201 })
  } catch (err: any) {
    console.error('signup error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
