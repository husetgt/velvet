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

    const { postId } = await req.json()
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    // Check if already liked
    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    })

    let liked: boolean
    if (existing) {
      await prisma.postLike.delete({
        where: { userId_postId: { userId: user.id, postId } },
      })
      liked = false
    } else {
      await prisma.postLike.create({
        data: { userId: user.id, postId },
      })
      liked = true
    }

    const count = await prisma.postLike.count({ where: { postId } })

    return NextResponse.json({ liked, count })
  } catch (err) {
    console.error('like error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
