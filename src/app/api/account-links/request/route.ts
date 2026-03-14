import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (user.role !== 'CREATOR') return NextResponse.json({ error: 'Only creators can link accounts' }, { status: 403 })

    const { targetUsername } = await req.json()
    if (!targetUsername?.trim()) return NextResponse.json({ error: 'Target username required' }, { status: 400 })

    const target = await prisma.user.findUnique({ where: { username: targetUsername.trim() } })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (target.id === user.id) return NextResponse.json({ error: 'Cannot link to yourself' }, { status: 400 })
    if (target.role !== 'CREATOR') return NextResponse.json({ error: 'Target must be a creator' }, { status: 400 })

    // Check if link already exists (either direction)
    const existing = await prisma.accountLink.findFirst({
      where: {
        OR: [
          { requesterId: user.id, targetId: target.id },
          { requesterId: target.id, targetId: user.id },
        ],
      },
    })
    if (existing) {
      if (existing.status === 'ACCEPTED') return NextResponse.json({ error: 'Already linked' }, { status: 409 })
      if (existing.status === 'PENDING') return NextResponse.json({ error: 'Request already pending' }, { status: 409 })
    }

    const link = await prisma.accountLink.create({
      data: { requesterId: user.id, targetId: target.id, status: 'PENDING' },
    })

    return NextResponse.json({ link }, { status: 201 })
  } catch (err: unknown) {
    console.error('account-links request error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
