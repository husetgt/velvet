'use client'

import { useState, useEffect } from 'react'

interface Subscription {
  id: string
  creatorId: string
  status: string
  currentPeriodEnd: string | null
  createdAt: string
  creator: {
    id: string
    displayName: string
    username: string
    avatarUrl: string | null
    subscriptionPrice: number | null
  }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function MembershipPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  // Cancel flow state: null | 'confirm1' | 'confirm2' | 'done'
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null)
  const [cancelStep, setCancelStep] = useState<'confirm1' | 'confirm2' | 'done' | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  useEffect(() => {
    fetch('/api/subscriptions/my')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.subscriptions)) setSubscriptions(d.subscriptions) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const startCancel = (sub: Subscription) => {
    setCancelTarget(sub)
    setCancelStep('confirm1')
    setCancelError('')
  }

  const handleCancelConfirm1 = () => setCancelStep('confirm2')

  const handleCancelConfirm2 = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    setCancelError('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: cancelTarget.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setCancelStep('done')
        setSubscriptions(prev => prev.map(s => s.id === cancelTarget.id ? { ...s, status: 'CANCELLED' } : s))
      } else {
        setCancelError(data.error || 'Failed to cancel')
      }
    } catch {
      setCancelError('An error occurred')
    } finally {
      setCancelling(false)
    }
  }

  const closeModal = () => {
    setCancelTarget(null)
    setCancelStep(null)
    setCancelError('')
  }

  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE')
  const inactiveSubs = subscriptions.filter(s => s.status !== 'ACTIVE')

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#e040fb] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-black text-white mb-6">Membership</h1>

      {/* Active subscriptions */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-[#8888a0] uppercase tracking-wider mb-3">Active Subscriptions</h2>
        {activeSubs.length === 0 ? (
          <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] p-8 text-center">
            <p className="text-[#555568] text-sm">No active subscriptions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSubs.map(sub => (
              <div key={sub.id} className="rounded-2xl border border-[#2a2a30] bg-[#161618] p-5">
                <div className="flex items-center gap-3 mb-3">
                  {sub.creator.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sub.creator.avatarUrl} alt={sub.creator.displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
                      {getInitials(sub.creator.displayName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">{sub.creator.displayName}</div>
                    <div className="text-xs text-[#8888a0]">@{sub.creator.username}</div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-green-400" style={{ background: 'rgba(74,222,128,0.1)' }}>
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#8888a0] mb-3">
                  <span>
                    {sub.creator.subscriptionPrice != null
                      ? `$${Number(sub.creator.subscriptionPrice).toFixed(2)}/mo`
                      : 'Free'}
                  </span>
                  {sub.currentPeriodEnd && (
                    <span>Next billing: {new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  )}
                </div>
                <button
                  onClick={() => startCancel(sub)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
                >
                  Cancel subscription
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past subscriptions */}
      {inactiveSubs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-[#8888a0] uppercase tracking-wider mb-3">Past Subscriptions</h2>
          <div className="space-y-3">
            {inactiveSubs.map(sub => (
              <div key={sub.id} className="rounded-2xl border border-[#2a2a30] bg-[#161618] p-5 opacity-60">
                <div className="flex items-center gap-3">
                  {sub.creator.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sub.creator.avatarUrl} alt={sub.creator.displayName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
                      {getInitials(sub.creator.displayName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{sub.creator.displayName}</div>
                    <div className="text-xs text-[#8888a0]">@{sub.creator.username}</div>
                  </div>
                  <span className="text-xs text-[#555568] capitalize">{sub.status.toLowerCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Payment methods */}
      <section>
        <h2 className="text-xs font-bold text-[#8888a0] uppercase tracking-wider mb-3">Payment Methods</h2>
        <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(224,64,251,0.1)', border: '1px solid rgba(224,64,251,0.2)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#e040fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Manage payment methods via Stripe</div>
              <div className="text-xs text-[#8888a0] mt-0.5">Cards and billing managed securely through Stripe</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cancel modal */}
      {cancelTarget && cancelStep && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#2a2a30] bg-[#161618] p-6">
            {cancelStep === 'confirm1' && (
              <>
                <h3 className="text-lg font-bold text-white mb-2">Cancel subscription?</h3>
                <p className="text-[#8888a0] text-sm mb-6">
                  Are you sure you want to cancel your subscription to <span className="text-white font-semibold">@{cancelTarget.creator.username}</span>?
                </p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-[#2a2a30] text-[#8888a0] hover:text-white text-sm font-medium transition-colors">
                    Keep subscription
                  </button>
                  <button onClick={handleCancelConfirm1} className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
                    Yes, cancel
                  </button>
                </div>
              </>
            )}
            {cancelStep === 'confirm2' && (
              <>
                <h3 className="text-lg font-bold text-white mb-2">Are you sure?</h3>
                <p className="text-red-400 text-sm mb-6">
                  You will lose access immediately. This cannot be undone.
                </p>
                {cancelError && <p className="text-red-400 text-xs mb-3">{cancelError}</p>}
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-[#2a2a30] text-[#8888a0] hover:text-white text-sm font-medium transition-colors">
                    Go back
                  </button>
                  <button
                    onClick={handleCancelConfirm2}
                    disabled={cancelling}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling…' : 'Confirm cancellation'}
                  </button>
                </div>
              </>
            )}
            {cancelStep === 'done' && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Subscription cancelled</h3>
                </div>
                <p className="text-[#8888a0] text-sm mb-5">
                  Your subscription to @{cancelTarget.creator.username} has been cancelled.
                </p>
                <button onClick={closeModal} className="w-full py-2.5 rounded-xl border border-[#2a2a30] text-white text-sm font-medium hover:bg-[#1e1e21] transition-colors">
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
