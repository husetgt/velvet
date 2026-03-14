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

    // Get all accepted links where user is requester or target
    const links = await prisma.accountLink.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: user.id },
          { targetId: user.id },
        ],
      },
      include: {
        requester: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        target: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      },
    })

    // Return the "other" account in each link
    const linkedAccounts = links.map(link => {
      const other = link.requesterId === user.id ? link.target : link.requester
      return other
    })

    return NextResponse.json({ links: linkedAccounts })
  } catch (err: unknown) {
    console.error('account-links GET error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
