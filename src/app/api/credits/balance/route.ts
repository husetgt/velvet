import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Credits system removed' }, { status: 404 })
}
