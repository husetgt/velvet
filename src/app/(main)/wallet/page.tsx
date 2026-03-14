'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const PRESET_AMOUNTS = [5, 10, 25, 50, 100]

type Transaction = {
  id: string
  type: 'deposit' | 'unlock' | 'tip'
  amountCents: number
  description: string
  createdAt: string
}

export default function WalletPage() {
  const searchParams = useSearchParams()
  const depositStatus = searchParams.get('deposit')

  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [loadingTx, setLoadingTx] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [depositing, setDepositing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/wallet/balance')
      .then((r) => r.json())
      .then((d) => { if (typeof d.balance === 'number') setBalance(d.balance) })
      .finally(() => setLoadingBalance(false))

    fetch('/api/wallet/transactions')
      .then((r) => r.json())
      .then((d) => { if (d.transactions) setTransactions(d.transactions) })
      .finally(() => setLoadingTx(false))
  }, [])

  const effectiveAmount = selectedPreset ?? (customAmount ? parseFloat(customAmount) : null)
  const effectiveAmountCents = effectiveAmount ? Math.round(effectiveAmount * 100) : 0

  const handleDeposit = async () => {
    if (!effectiveAmountCents || effectiveAmountCents < 100) {
      setError('Minimum deposit is $1.00')
      return
    }
    setDepositing(true)
    setError('')
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: effectiveAmountCents }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session')
      if (data.url) window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setDepositing(false)
    }
  }

  const balanceDollars = balance !== null ? (balance / 100).toFixed(2) : null

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">Wallet</h1>
        <p className="text-[#8888a0] text-sm mb-8">Add funds to tip creators and unlock exclusive content.</p>

        {/* Deposit success/cancel banner */}
        {depositStatus === 'success' && (
          <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
            ✓ Deposit successful! Your balance has been updated.
          </div>
        )}
        {depositStatus === 'cancelled' && (
          <div className="mb-6 p-4 rounded-2xl bg-[#2a2a30] border border-[#3a3a44] text-[#8888a0] text-sm">
            Deposit cancelled.
          </div>
        )}

        {/* Balance card */}
        <div
          className="rounded-2xl p-6 mb-6 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(224,64,251,0.12), rgba(124,77,255,0.12))',
            border: '1px solid rgba(224,64,251,0.25)',
          }}
        >
          <p className="text-[#8888a0] text-sm mb-1">Available Balance</p>
          {loadingBalance ? (
            <div className="h-12 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#e040fb] border-t-transparent animate-spin" />
            </div>
          ) : (
            <p
              className="text-5xl font-black"
              style={{
                background: 'linear-gradient(135deg, #e040fb, #7c4dff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ${balanceDollars ?? '0.00'}
            </p>
          )}
          <p className="text-[#8888a0] text-xs mt-2">Use for PPV unlocks &amp; tips only</p>
        </div>

        {/* Add funds */}
        <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-[#2a2a30]">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">Add Funds</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Preset amounts */}
            <div className="grid grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setSelectedPreset(amt); setCustomAmount('') }}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    selectedPreset === amt
                      ? 'text-white border-transparent'
                      : 'text-[#8888a0] border-[#2a2a30] hover:border-[#e040fb44] hover:text-white'
                  }`}
                  style={
                    selectedPreset === amt
                      ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)', border: 'none' }
                      : { background: '#1e1e21', border: '1px solid #2a2a30' }
                  }
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8888a0] text-sm">$</span>
              <input
                type="number"
                min="1"
                step="1"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelectedPreset(null) }}
                placeholder="Custom amount"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#8888a0] focus:outline-none focus:border-[#e040fb] focus:ring-1 focus:ring-[#e040fb22] transition-all text-sm"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleDeposit}
              disabled={depositing || effectiveAmountCents < 100}
              className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-40 hover:opacity-90 transition-opacity text-sm"
              style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
            >
              {depositing
                ? 'Redirecting to checkout…'
                : effectiveAmount
                ? `Add $${effectiveAmount.toFixed(2)}`
                : 'Select an amount'}
            </button>

            <p className="text-[#8888a0] text-xs text-center">
              Secure checkout via Stripe. Funds are non-refundable.
            </p>
          </div>
        </div>

        {/* Transaction history */}
        <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2a2a30]">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider">Transaction History</h2>
          </div>
          {loadingTx ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-[#e040fb] border-t-transparent animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(224,64,251,0.1), rgba(124,77,255,0.1))',
                  border: '1px solid rgba(224,64,251,0.2)',
                }}
              >
                <svg className="w-5 h-5 text-[#e040fb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                </svg>
              </div>
              <p className="text-white text-sm font-medium">No transactions yet</p>
              <p className="text-[#8888a0] text-xs mt-1">Deposits and spending will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1e1e21]">
              {transactions.map((tx) => {
                const isPositive = tx.amountCents > 0
                const absAmount = Math.abs(tx.amountCents) / 100
                return (
                  <div key={tx.id} className="flex items-start gap-3 px-6 py-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: isPositive
                          ? 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.15))'
                          : 'linear-gradient(135deg, rgba(224,64,251,0.1), rgba(124,77,255,0.1))',
                      }}
                    >
                      {isPositive ? (
                        <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 5 5 12"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-[#e040fb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 19 19 12"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{tx.description}</p>
                      <p className="text-[#8888a0] text-xs mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span
                      className="text-sm font-bold shrink-0"
                      style={{ color: isPositive ? '#4ade80' : '#e040fb' }}
                    >
                      {isPositive ? '+' : '-'}${absAmount.toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
