'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

interface StripeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  title: string
  description: string
  clientSecret: string
  stripePublishableKey: string
}

const cardElementOptions = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      '::placeholder': { color: '#8888a0' },
      backgroundColor: 'transparent',
    },
    invalid: { color: '#ef4444' },
  },
}

function PaymentForm({
  onClose,
  onSuccess,
  clientSecret,
}: {
  onClose: () => void
  onSuccess: () => void
  clientSecret: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setLoading(false)
      return
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed')
      setLoading(false)
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess()
    } else {
      setError('Payment was not completed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div
        className="p-4 rounded-xl border border-[#2a2a30]"
        style={{ background: '#1e1e21' }}
      >
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#8888a0] border border-[#2a2a30] hover:text-white hover:border-[#3a3a40] transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !stripe}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
        >
          {loading ? 'Processing...' : 'Pay'}
        </button>
      </div>
    </form>
  )
}

export default function StripeModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  clientSecret,
  stripePublishableKey,
}: StripeModalProps) {
  if (!isOpen) return null

  const stripePromise = loadStripe(stripePublishableKey)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-[#2a2a30] p-5 sm:p-6 shadow-2xl"
        style={{ background: '#161618' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-sm text-[#8888a0] mt-0.5">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#555568] hover:text-white transition-colors ml-4 shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Secure badge */}
        <div className="flex items-center gap-2 mb-5 text-xs text-[#8888a0]">
          <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Secured by Stripe. We never store your card details.</span>
        </div>

        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            onClose={onClose}
            onSuccess={onSuccess}
            clientSecret={clientSecret}
          />
        </Elements>
      </div>
    </div>
  )
}
