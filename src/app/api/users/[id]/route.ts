import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isCreator: true,
      },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ user })
  } catch (err) {
    console.error('users/[id] GET error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
