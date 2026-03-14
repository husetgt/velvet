import { NextResponse } from 'next/server'

// Replaced by /api/payments/subscribe
export async function POST() {
  return NextResponse.json({ error: 'Use /api/payments/subscribe' }, { status: 410 })
}
