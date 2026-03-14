import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Credits system removed' }, { status: 404 })
}
