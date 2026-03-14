import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    let currentUserId: string | null = null
    if (authUser?.email) {
      const user = await prisma.user.findUnique({ where: { email: authUser.email }, select: { id: true } })
      currentUserId = user?.id ?? null
    }

    const count = await prisma.postLike.count({ where: { postId } })

    let liked = false
    if (currentUserId) {
      const existing = await prisma.postLike.findUnique({
        where: { userId_postId: { userId: currentUserId, postId } },
      })
      liked = !!existing
    }

    return NextResponse.json({ count, liked })
  } catch (err) {
    console.error('get likes error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
