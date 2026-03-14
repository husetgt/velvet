import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const otherUserId = searchParams.get('with')

    if (otherUserId) {
      // Get conversation with specific user
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: user.id },
          ],
        },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
        take: 100,
      })

      // Mark received messages as read
      await prisma.message.updateMany({
        where: { senderId: otherUserId, receiverId: user.id, isRead: false },
        data: { isRead: true },
      })

      return NextResponse.json({ messages })
    }

    // Get all conversations (latest message per conversation partner)
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
      take: 50,
    })

    return NextResponse.json({ messages })
  } catch (err: any) {
    console.error('messages GET error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { receiverId, content, mediaUrl } = await req.json()
    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing receiverId or content' }, { status: 400 })
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } })
    if (!receiver) return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId,
        content: content.trim(),
        mediaUrl: mediaUrl || null,
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true } },
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (err: any) {
    console.error('messages POST error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
