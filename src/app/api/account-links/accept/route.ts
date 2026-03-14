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

    const { linkId } = await req.json()
    if (!linkId) return NextResponse.json({ error: 'linkId required' }, { status: 400 })

    const link = await prisma.accountLink.findUnique({ where: { id: linkId } })
    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    if (link.targetId !== user.id) return NextResponse.json({ error: 'Not authorized to accept this link' }, { status: 403 })
    if (link.status !== 'PENDING') return NextResponse.json({ error: 'Link is not pending' }, { status: 400 })

    const updated = await prisma.accountLink.update({
      where: { id: linkId },
      data: { status: 'ACCEPTED' },
    })

    return NextResponse.json({ link: updated })
  } catch (err: unknown) {
    console.error('account-links accept error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
