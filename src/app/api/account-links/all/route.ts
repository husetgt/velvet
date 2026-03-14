import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const include = {
      requester: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      target: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
    }

    const [sent, received, accepted] = await Promise.all([
      // Sent pending requests
      prisma.accountLink.findMany({
        where: { requesterId: user.id, status: 'PENDING' },
        include,
      }),
      // Received pending requests
      prisma.accountLink.findMany({
        where: { targetId: user.id, status: 'PENDING' },
        include,
      }),
      // Accepted links (both directions)
      prisma.accountLink.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: user.id }, { targetId: user.id }],
        },
        include,
      }),
    ])

    return NextResponse.json({ sent, received, accepted })
  } catch (err: unknown) {
    console.error('account-links all error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
