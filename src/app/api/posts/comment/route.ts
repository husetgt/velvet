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

    const { postId, content } = await req.json()
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
    if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

    const comment = await prisma.comment.create({
      data: { userId: user.id, postId, content: content.trim() },
      include: {
        user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      },
    })

    return NextResponse.json({
      comment: {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
      },
    }, { status: 201 })
  } catch (err) {
    console.error('comment error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
