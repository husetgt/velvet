import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!user.isCreator) return NextResponse.json({ error: 'Only creators can set nicknames' }, { status: 403 })

    const { targetUserId, nickname } = await req.json()
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400 })

    const meta = await prisma.conversationMeta.upsert({
      where: { creatorId_fanId: { creatorId: user.id, fanId: targetUserId } },
      create: { creatorId: user.id, fanId: targetUserId, nickname: nickname || null },
      update: { nickname: nickname || null },
    })

    return NextResponse.json({ meta })
  } catch (err) {
    console.error('nickname PATCH error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!user || !user.isCreator) return NextResponse.json({ meta: null })

    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get('targetUserId')
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400 })

    const meta = await prisma.conversationMeta.findUnique({
      where: { creatorId_fanId: { creatorId: user.id, fanId: targetUserId } },
    })

    return NextResponse.json({ meta })
  } catch (err) {
    console.error('nickname GET error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
