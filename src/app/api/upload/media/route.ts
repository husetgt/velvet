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
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Ensure the bucket exists
    const { data: buckets } = await serviceSupabase.storage.listBuckets()
    if (!buckets?.find((b) => b.name === 'media')) {
      await serviceSupabase.storage.createBucket('media', { public: true })
    }

    const urls: string[] = []

    for (const file of files) {
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const path = `${authUser.id}/${timestamp}-${safeName}`

      const fileBuffer = Buffer.from(await file.arrayBuffer())

      const { error } = await serviceSupabase.storage
        .from('media')
        .upload(path, fileBuffer, { contentType: file.type, upsert: false })

      if (error) {
        console.error('Media upload error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const {
        data: { publicUrl },
      } = serviceSupabase.storage.from('media').getPublicUrl(path)

      urls.push(publicUrl)
    }

    return NextResponse.json({ urls })
  } catch (err: unknown) {
    console.error('Media upload handler error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
