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
    if (!user.isCreator) return NextResponse.json({ error: 'Only creators can post' }, { status: 403 })

    const { title, content, mediaUrls, isLocked, price } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

    const post = await prisma.post.create({
      data: {
        creatorId: user.id,
        title: title?.trim() || null,
        content: content.trim(),
        mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
        isLocked: Boolean(isLocked),
        price: isLocked && price ? price : null,
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (err: any) {
    console.error('create post error', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
