'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import PaymentMethodModal from './PaymentMethodModal'

const StripeModal = dynamic(() => import('./StripeModal'), { ssr: false })

const PRESETS = [3, 5, 10, 25, 50]

interface TipButtonProps {
  creatorId: string
  creatorName: string
}

export default function TipButton({ creatorId, creatorName }: TipButtonProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<number | null>(5)
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Payment method modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Stripe
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)

  const amount = customAmount !== '' ? parseFloat(customAmount) : (selectedPreset ?? 0)

  const handleContinue = () => {
    if (!amount || amount <= 0) { setError('Please select or enter a tip amount'); return }
    setError(null)
    setShowPaymentModal(true)
  }

  const handleWalletPay = async () => {
    setShowPaymentModal(false)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, amount, message: message || undefined, paymentMethod: 'wallet' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Wallet payment failed')
      setShowPicker(false)
      setMessage('')
      setCustomAmount('')
      setSelectedPreset(5)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally { setLoading(false) }
  }

  const handleCardPay = async () => {
    setShowPaymentModal(false)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, amount, message: message || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to initiate tip')
      setClientSecret(data.clientSecret)
      setPaymentIntentId(data.clientSecret.split('_secret_')[0])
      setShowPicker(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to initiate tip')
    } finally { setLoading(false) }
  }

  const handleStripeSuccess = async () => {
    if (paymentIntentId) {
      try {
        await fetch('/api/payments/confirm-tip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorId, amount, message: message || undefined, paymentIntentId }),
        })
      } catch (e) { console.error('confirm-tip failed', e) }
    }
    setClientSecret(null)
    setCustomAmount('')
    setSelectedPreset(5)
    setMessage('')
  }

  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!

  return (
    <>
      {!showPicker ? (
        <button
          onClick={() => setShowPicker(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium border border-[#2a2a30] text-[#8888a0] hover:text-white hover:border-[#3a3a40] transition-all"
        >
          💰 Send Tip
        </button>
      ) : (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-[#2a2a30] bg-[#161618] min-w-[260px]">
          <p className="text-white text-sm font-semibold">Tip {creatorName}</p>

          {/* Preset amounts */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => { setSelectedPreset(preset); setCustomAmount('') }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={
                  selectedPreset === preset && customAmount === ''
                    ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)', color: '#fff' }
                    : { background: '#1e1e21', border: '1px solid #2a2a30', color: '#8888a0' }
                }
              >
                ${preset}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888a0] text-sm">$</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={customAmount}
              onChange={e => { setCustomAmount(e.target.value); setSelectedPreset(null) }}
              placeholder="Custom amount"
              className="w-full pl-7 pr-3 py-2 rounded-lg bg-[#1e1e21] border border-[#2a2a30] text-white text-sm placeholder-[#555568] focus:outline-none focus:border-[#e040fb] transition-all"
            />
          </div>

          {/* Optional message */}
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Optional message…"
            className="w-full px-3 py-2 rounded-lg bg-[#1e1e21] border border-[#2a2a30] text-white text-sm placeholder-[#555568] focus:outline-none focus:border-[#e040fb] transition-all"
          />

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => { setShowPicker(false); setError(null) }}
              className="flex-1 py-2 rounded-lg text-xs text-[#8888a0] border border-[#2a2a30] hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={loading || !amount || amount <= 0}
              className="flex-1 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
            >
              {loading ? '…' : `Send $${amount > 0 ? amount.toFixed(2) : '0.00'}`}
            </button>
          </div>
        </div>
      )}

      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        price={amount}
        title={`Tip ${creatorName}`}
        onSelectWallet={handleWalletPay}
        onSelectCard={handleCardPay}
      />

      {clientSecret && (
        <StripeModal
          isOpen={true}
          onClose={() => setClientSecret(null)}
          onSuccess={handleStripeSuccess}
          title={`Tip ${creatorName}`}
          description={`$${amount.toFixed(2)} tip`}
          clientSecret={clientSecret}
          stripePublishableKey={stripeKey}
        />
      )}
    </>
  )
}
