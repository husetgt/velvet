import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      comments: comments.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
    })
  } catch (err) {
    console.error('get comments error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
