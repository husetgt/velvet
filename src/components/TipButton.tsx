'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const StripeModal = dynamic(() => import('./StripeModal'), { ssr: false })

interface TipButtonProps {
  creatorId: string
  creatorName: string
}

export default function TipButton({ creatorId, creatorName }: TipButtonProps) {
  const [showAmountPicker, setShowAmountPicker] = useState(false)
  const [amount, setAmount] = useState('5')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInitiateTip = async () => {
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid tip amount')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, amount: amountNum, message: message || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to initiate tip')
      setClientSecret(data.clientSecret)
      setPaymentIntentId(data.clientSecret.split('_secret_')[0])
      setShowAmountPicker(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = async () => {
    const amountNum = parseFloat(amount)
    if (paymentIntentId) {
      try {
        await fetch('/api/payments/confirm-tip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorId,
            amount: amountNum,
            message: message || undefined,
            paymentIntentId,
          }),
        })
      } catch (e) {
        console.error('confirm-tip failed', e)
      }
    }
    setClientSecret(null)
    setAmount('5')
    setMessage('')
  }

  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!

  return (
    <>
      {!showAmountPicker ? (
        <button
          onClick={() => setShowAmountPicker(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium border border-[#2a2a30] text-[#8888a0] hover:text-white hover:border-[#3a3a40] transition-all"
        >
          💰 Send Tip
        </button>
      ) : (
        <div className="flex flex-col gap-2 p-4 rounded-xl border border-[#2a2a30] bg-[#161618]">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#8888a0]">$</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5.00"
              className="w-24 px-3 py-1.5 rounded-lg bg-[#1e1e21] border border-[#2a2a30] text-white text-sm focus:outline-none focus:border-[#e040fb] transition-all"
            />
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message..."
            className="w-full px-3 py-1.5 rounded-lg bg-[#1e1e21] border border-[#2a2a30] text-white text-sm placeholder-[#555568] focus:outline-none focus:border-[#e040fb] transition-all"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAmountPicker(false); setError(null) }}
              className="flex-1 py-1.5 rounded-lg text-xs text-[#8888a0] border border-[#2a2a30] hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleInitiateTip}
              disabled={loading}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
            >
              {loading ? '...' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {clientSecret && (
        <StripeModal
          isOpen={true}
          onClose={() => setClientSecret(null)}
          onSuccess={handleSuccess}
          title={`Tip ${creatorName}`}
          description={`$${parseFloat(amount).toFixed(2)} tip`}
          clientSecret={clientSecret}
          stripePublishableKey={stripeKey}
        />
      )}
    </>
  )
}
