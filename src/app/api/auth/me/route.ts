import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser?.email) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: {
        id: true,
        displayName: true,
        username: true,
        bio: true,
        avatarUrl: true,
        role: true,
        isCreator: true,
        subscriptionPrice: true,
      },
    })

    if (!user) return NextResponse.json({ user: null }, { status: 200 })

    // Count unread messages and notifications
    const [unreadMessages] = await Promise.all([
      prisma.message.count({ where: { receiverId: user.id, isRead: false } }),
    ])

    return NextResponse.json({
      user: {
        ...user,
        subscriptionPrice: user.subscriptionPrice ? Number(user.subscriptionPrice) : null,
      },
      unreadMessages,
      unreadNotifications: 0,
    })
  } catch (err: unknown) {
    console.error('auth/me GET error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
