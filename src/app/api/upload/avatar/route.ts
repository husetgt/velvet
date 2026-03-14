import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseServer } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${authUser.id}/avatar.${ext}`

    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const { error } = await serviceSupabase.storage
      .from('avatars')
      .upload(path, fileBuffer, { contentType: file.type, upsert: true })

    if (error) {
      console.error('Avatar upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = serviceSupabase.storage.from('avatars').getPublicUrl(path)

    return NextResponse.json({ url: publicUrl })
  } catch (err: unknown) {
    console.error('Avatar upload handler error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
