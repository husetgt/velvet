import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

interface NoteEntry {
  id: string
  text: string
  createdAt: string
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: authUser.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!user.isCreator) return NextResponse.json({ error: 'Only creators can manage notes' }, { status: 403 })

    const { targetUserId, note, action, noteId } = await req.json()
    if (!targetUserId || !action) return NextResponse.json({ error: 'targetUserId and action required' }, { status: 400 })

    const existing = await prisma.conversationMeta.findUnique({
      where: { creatorId_fanId: { creatorId: user.id, fanId: targetUserId } },
    })

    let notes: NoteEntry[] = []
    if (existing?.notes) {
      notes = (existing.notes as unknown) as NoteEntry[]
    }

    if (action === 'add') {
      if (!note?.trim()) return NextResponse.json({ error: 'note text required' }, { status: 400 })
      notes.push({ id: `note_${Date.now()}`, text: note.trim(), createdAt: new Date().toISOString() })
    } else if (action === 'edit') {
      if (!noteId || !note?.trim()) return NextResponse.json({ error: 'noteId and note required' }, { status: 400 })
      notes = notes.map((n) => n.id === noteId ? { ...n, text: note.trim() } : n)
    } else if (action === 'delete') {
      if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 })
      notes = notes.filter((n) => n.id !== noteId)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const notesJson = notes as unknown as import('@prisma/client').Prisma.InputJsonValue
    const meta = await prisma.conversationMeta.upsert({
      where: { creatorId_fanId: { creatorId: user.id, fanId: targetUserId } },
      create: { creatorId: user.id, fanId: targetUserId, notes: notesJson },
      update: { notes: notesJson },
    })

    return NextResponse.json({ meta, notes })
  } catch (err) {
    console.error('notes PATCH error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
