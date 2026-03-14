'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const StripeModal = dynamic(() => import('./StripeModal'), { ssr: false })

interface UnlockButtonProps {
  postId: string
  price: number
  onUnlock?: (postId: string) => void
}

export default function UnlockButton({ postId, price, onUnlock }: UnlockButtonProps) {
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
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
      // Extract paymentIntentId from clientSecret (format: pi_xxx_secret_yyy)
      setPaymentIntentId(data.clientSecret.split('_secret_')[0])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = async () => {
    if (paymentIntentId) {
      try {
        await fetch('/api/payments/confirm-unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, paymentIntentId }),
        })
      } catch (e) {
        console.error('confirm-unlock failed', e)
      }
    }
    setClientSecret(null)
    if (onUnlock) onUnlock(postId)
  }

  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
        style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
      >
        {loading ? 'Loading...' : `Unlock for $${price.toFixed(2)}`}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

      {clientSecret && (
        <StripeModal
          isOpen={true}
          onClose={() => setClientSecret(null)}
          onSuccess={handleSuccess}
          title="Unlock Post"
          description={`$${price.toFixed(2)} one-time`}
          clientSecret={clientSecret}
          stripePublishableKey={stripeKey}
        />
      )}
    </>
  )
}
