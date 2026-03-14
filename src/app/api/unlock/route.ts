import { NextResponse } from 'next/server'

// Replaced by /api/payments/unlock
export async function POST() {
  return NextResponse.json({ error: 'Use /api/payments/unlock' }, { status: 410 })
}
