'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import PaymentMethodModal from './PaymentMethodModal'

const StripeModal = dynamic(() => import('./StripeModal'), { ssr: false })

interface UnlockButtonProps {
  postId: string
  price: number
  onUnlock?: (postId: string) => void
}

export default function UnlockButton({ postId, price, onUnlock }: UnlockButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleWalletPay = async () => {
    setShowPaymentModal(false)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, paymentMethod: 'wallet' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Wallet payment failed')
      if (onUnlock) onUnlock(postId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally { setLoading(false) }
  }

  const handleCardPay = async () => {
    setShowPaymentModal(false)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to initiate unlock')
      setClientSecret(data.clientSecret)
      setPaymentIntentId(data.clientSecret.split('_secret_')[0])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally { setLoading(false) }
  }

  const handleStripeSuccess = async () => {
    if (paymentIntentId) {
      try {
        await fetch('/api/payments/confirm-unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, paymentIntentId }),
        })
      } catch (e) { console.error('confirm-unlock failed', e) }
    }
    setClientSecret(null)
    if (onUnlock) onUnlock(postId)
  }

  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!

  return (
    <>
      <button
        onClick={() => setShowPaymentModal(true)}
        disabled={loading}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
        style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
      >
        {loading ? 'Processing…' : `Unlock for $${price.toFixed(2)}`}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        price={price}
        title={`Unlock post · $${price.toFixed(2)}`}
        onSelectWallet={handleWalletPay}
        onSelectCard={handleCardPay}
      />

      {clientSecret && (
        <StripeModal
          isOpen={true}
          onClose={() => setClientSecret(null)}
          onSuccess={handleStripeSuccess}
          title="Unlock Post"
          description={`$${price.toFixed(2)} one-time`}
          clientSecret={clientSecret}
          stripePublishableKey={stripeKey}
        />
      )}
    </>
  )
}
