'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const PRESET_AMOUNTS = [5, 10, 25, 50, 100]

export default function CreditsPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const [selected, setSelected] = useState(25)
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/credits/balance')
      .then(r => r.json())
      .then(d => setBalance(d.balance ?? 0))
      .catch(() => {})
  }, [])

  const amount = custom ? parseFloat(custom) : selected

  const handleDeposit = async () => {
    if (!amount || amount < 1) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/credits/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(amount * 100) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create payment')

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[250px] blur-[80px] rounded-full" style={{background: 'linear-gradient(135deg, rgba(224,64,251,0.12), rgba(124,77,255,0.12))'}} />
      </div>

      <div className="relative max-w-lg mx-auto pt-24 pb-16 px-4">
        <div className="text-center mb-10">
          <Link href="/" className="velvet-gradient-text text-2xl font-bold">Velvet</Link>
          <h1 className="text-3xl font-bold mt-6 mb-2">Add Credits</h1>
          {balance !== null && (
            <p className="text-[#8888a0]">
              Current balance: <span className="velvet-gradient-text font-semibold">${(balance / 100).toFixed(2)}</span>
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] p-8">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <p className="text-sm font-medium text-[#8888a0] mb-4">Select amount</p>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {PRESET_AMOUNTS.map(a => (
              <button
                key={a}
                onClick={() => { setSelected(a); setCustom('') }}
                className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                  selected === a && !custom
                    ? 'text-white'
                    : 'bg-[#1e1e21] text-[#8888a0] border border-[#2a2a30] hover:border-[#e040fb44]'
                }`}
                style={selected === a && !custom ? {background: 'linear-gradient(135deg, #e040fb, #7c4dff)'} : {}}
              >
                ${a}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm text-[#8888a0] mb-1.5">Or enter custom amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8888a0]">$</span>
              <input
                type="number"
                min="1"
                step="1"
                value={custom}
                onChange={e => { setCustom(e.target.value); setSelected(0) }}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb33] transition-all"
              />
            </div>
          </div>

          <div className="border-t border-[#2a2a30] pt-6 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#8888a0]">Credits to add</span>
              <span className="text-white font-semibold">${(amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8888a0]">New balance</span>
              <span className="velvet-gradient-text font-semibold">
                ${(((balance ?? 0) + (amount || 0) * 100) / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={loading || !amount || amount < 1}
            className="w-full py-3.5 rounded-xl font-semibold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}
          >
            {loading ? 'Redirecting to payment...' : `Add $${(amount || 0).toFixed(2)} in Credits`}
          </button>

          <p className="text-center text-xs text-[#555568] mt-4">
            Secured by Stripe. Credits are non-refundable.
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-[#555568]">
          <Link href="/dashboard" className="hover:text-[#8888a0] transition-colors">← Back to Dashboard</Link>
        </p>
      </div>
    </div>
  )
}
