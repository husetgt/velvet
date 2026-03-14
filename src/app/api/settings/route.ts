import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const current = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!current) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const { displayName, bio, avatarUrl, coverUrl, subscriptionPrice } = body

    if (displayName !== undefined && typeof displayName !== 'string') {
      return NextResponse.json({ error: 'Invalid displayName' }, { status: 400 })
    }
    if (displayName !== undefined && displayName.trim().length === 0) {
      return NextResponse.json({ error: 'Display name cannot be empty' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    if (displayName !== undefined) updateData.displayName = displayName.trim()
    if (bio !== undefined) updateData.bio = bio ? bio.trim() : null
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl || null

    if (subscriptionPrice !== undefined && current.isCreator) {
      const price = parseFloat(subscriptionPrice)
      if (!isNaN(price) && price > 0) {
        updateData.subscriptionPrice = price
      }
    }

    const updated = await prisma.user.update({
      where: { id: current.id },
      data: updateData,
      select: {
        id: true,
        displayName: true,
        username: true,
        bio: true,
        avatarUrl: true,
        role: true,
        isCreator: true,
        subscriptionPrice: true,
      },
    })

    return NextResponse.json({
      user: {
        ...updated,
        subscriptionPrice: updated.subscriptionPrice ? Number(updated.subscriptionPrice) : null,
      },
    })
  } catch (err: unknown) {
    console.error('settings PATCH error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
