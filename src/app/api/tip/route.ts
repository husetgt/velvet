import { NextResponse } from 'next/server'

// Replaced by /api/payments/tip
export async function POST() {
  return NextResponse.json({ error: 'Use /api/payments/tip' }, { status: 410 })
}
