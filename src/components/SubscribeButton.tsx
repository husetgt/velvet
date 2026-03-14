'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const StripeModal = dynamic(() => import('./StripeModal'), { ssr: false })

interface SubscribeButtonProps {
  creatorId: string
  creatorName: string
  price: number
  fullWidth?: boolean
}

export default function SubscribeButton({ creatorId, creatorName, price, fullWidth }: SubscribeButtonProps) {
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
      // alreadyActive removed — payment always required now
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
        className={`${fullWidth ? 'w-full' : ''} px-6 py-3 rounded-full font-semibold text-white text-sm transition-all duration-200 disabled:opacity-50 cursor-pointer select-none
          hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(224,64,251,0.5)] active:scale-[0.98]`}
        style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Loading...
          </span>
        ) : `Subscribe · $${price.toFixed(2)}/mo`}
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
