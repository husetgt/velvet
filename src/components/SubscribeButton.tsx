'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const StripeModal = dynamic(() => import('./StripeModal'), { ssr: false })

interface SubscribeButtonProps {
  creatorId: string
  creatorName: string
  price: number
}

export default function SubscribeButton({ creatorId, creatorName, price }: SubscribeButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to initiate subscription')
      setClientSecret(data.clientSecret)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    setClientSecret(null)
    router.refresh()
  }

  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
      >
        {loading ? 'Loading...' : `Subscribe · $${price.toFixed(2)}/mo`}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

      {clientSecret && (
        <StripeModal
          isOpen={true}
          onClose={() => setClientSecret(null)}
          onSuccess={handleSuccess}
          title={`Subscribe to ${creatorName}`}
          description={`$${price.toFixed(2)}/month`}
          clientSecret={clientSecret}
          stripePublishableKey={stripeKey}
        />
      )}
    </>
  )
}
