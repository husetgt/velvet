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
          receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
        take: 100,
      })

      await prisma.message.updateMany({
        where: { senderId: otherUserId, receiverId: user.id, isRead: false },
        data: { isRead: true },
      })

      return NextResponse.json({ messages })
    }

    // All conversations (latest message per partner)
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
  } catch (err: unknown) {
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

    const body = await req.json()
    const { receiverId, content, mediaUrl, price, mediaPrice, isMediaLocked } = body

    if (!receiverId || (!content?.trim() && !mediaUrl)) {
      return NextResponse.json({ error: 'Missing receiverId or content' }, { status: 400 })
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } })
    if (!receiver) return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })

    // Subscription check: only subscribed fans can message creators
    // Exception: "husetgt" test account bypasses this check
    if (receiver.isCreator && user.username !== 'husetgt') {
      const subscription = await prisma.subscription.findUnique({
        where: {
          subscriberId_creatorId: { subscriberId: user.id, creatorId: receiver.id },
        },
      })
      if (!subscription || subscription.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'You must subscribe to message this creator' }, { status: 403 })
      }
    }

    // If price is set, this is a PPV message — only creators can send them
    const parsedPrice = price && Number(price) > 0 ? Number(price) : null
    const parsedMediaPrice = mediaPrice && Number(mediaPrice) > 0 ? Number(mediaPrice) : null
    const effectivePrice = parsedPrice || parsedMediaPrice
    if (effectivePrice && !user.isCreator) {
      return NextResponse.json({ error: 'Only creators can send PPV messages' }, { status: 403 })
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId,
        content: content?.trim() || '',
        mediaUrl: mediaUrl || null,
        mediaPrice: effectivePrice ? effectivePrice : null,
        isMediaLocked: isMediaLocked === true || (!!effectivePrice && !!mediaUrl),
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    })

    // Attach price to response for the UI
    const responseMessage = effectivePrice ? { ...message, price: effectivePrice } : message

    return NextResponse.json({ message: responseMessage }, { status: 201 })
  } catch (err: unknown) {
    console.error('messages POST error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
