'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  /** Price in dollars */
  price: number
  title: string
  onSelectWallet: () => void
  onSelectCard: () => void
}

export default function PaymentMethodModal({
  isOpen,
  onClose,
  price,
  title,
  onSelectWallet,
  onSelectCard,
}: PaymentMethodModalProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    setLoadingBalance(true)
    fetch('/api/wallet/balance')
      .then(r => r.json())
      .then(d => { if (typeof d.balance === 'number') setBalance(d.balance) })
      .catch(() => {})
      .finally(() => setLoadingBalance(false))
  }, [isOpen])

  if (!isOpen) return null

  // balance is in cents
  const balanceDollars = balance !== null ? balance / 100 : null
  const canPayWithWallet = balanceDollars !== null && balanceDollars >= price

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#18181b', border: '1px solid #2a2a30' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">How would you like to pay?</h2>
            <p className="text-[#8888a0] text-sm mt-0.5">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8888a0] hover:text-white hover:bg-[#2a2a30] transition-all ml-3 shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-3">
          {/* Option A: Wallet */}
          <div
            className={`rounded-xl p-4 border transition-all ${canPayWithWallet ? 'border-[#2a2a30] hover:border-[#e040fb44]' : 'border-[#1e1e21] opacity-60'}`}
            style={{ background: '#111113' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(224,64,251,0.15), rgba(124,77,255,0.15))' }}
              >
                <svg className="w-4 h-4 text-[#e040fb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-semibold">Wallet Balance</div>
                <div className="text-[#8888a0] text-xs">
                  {loadingBalance ? 'Loading…' : balanceDollars !== null ? `$${balanceDollars.toFixed(2)} available` : 'Unavailable'}
                </div>
              </div>
              {!canPayWithWallet && !loadingBalance && (
                <span className="text-[10px] text-[#555568] font-medium shrink-0">Insufficient</span>
              )}
            </div>

            {canPayWithWallet ? (
              <button
                onClick={onSelectWallet}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
              >
                Pay with Wallet (${price.toFixed(2)})
              </button>
            ) : (
              <Link
                href="/wallet"
                className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold border border-[#2a2a30] text-[#8888a0] hover:text-white transition-colors"
              >
                Insufficient balance — Add funds
              </Link>
            )}
          </div>

          {/* Option B: Card */}
          <div
            className="rounded-xl p-4 border border-[#2a2a30] hover:border-[#e040fb44] transition-all"
            style={{ background: '#111113' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(124,77,255,0.15), rgba(224,64,251,0.15))' }}
              >
                <svg className="w-4 h-4 text-[#7c4dff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-semibold">Pay with Card</div>
                <div className="text-[#8888a0] text-xs">Visa, Mastercard, Amex</div>
              </div>
            </div>
            <button
              onClick={onSelectCard}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #7c4dff, #e040fb)' }}
            >
              Pay with Card (${price.toFixed(2)})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
