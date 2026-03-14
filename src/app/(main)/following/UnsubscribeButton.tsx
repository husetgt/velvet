'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UnsubscribeButton({ subscriptionId, creatorName }: { subscriptionId: string; creatorName: string }) {
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  const handleUnsubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-[#8888a0]">Sure?</span>
        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all disabled:opacity-50"
        >
          {loading ? '…' : 'Yes'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#8888a0] border border-[#2a2a30] hover:text-white transition-all"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8888a0] border border-[#2a2a30] hover:text-red-400 hover:border-red-500/30 transition-all"
    >
      Unsubscribe
    </button>
  )
}
