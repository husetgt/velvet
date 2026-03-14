'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  displayName: string
  username: string
  role: string
  avatarUrl?: string | null
  subscriberCount: number
}

interface Stats {
  totalEarnings: number
  thisMonthEarnings: number
  lastMonthEarnings: number
  subEarnings: number
  messageEarnings: number
  postEarnings: number
  tipEarnings: number
  activeSubs: number
  totalSubs: number
  topSpenders: { id: string; displayName: string; username: string; avatarUrl: string | null; total: number }[]
  recentTransactions: { id: string; type: 'tip' | 'unlock' | 'subscription'; user: { displayName: string; username: string; avatarUrl: string | null }; amount: number; description: string; createdAt: string }[]
  monthlyChart: { month: string; earnings: number }[]
}

type FilterTab = 'earnings' | 'monthly' | 'subscribers' | 'content'

function Sparkline({ data, color = '#e040fb' }: { data: number[]; color?: string }) {
  if (!data.length) return null
  const max = Math.max(...data, 0.01)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 120, h = 36, pad = 2
  const pts = data.map((v, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })
  const d = `M ${pts.join(' L ')}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EarningsChart({ data }: { data: { month: string; earnings: number }[] }) {
  const [gross, setGross] = useState(true)
  const max = Math.max(...data.map(d => d.earnings), 0.01)
  const chartH = 180
  const chartW = 100 // percentage-based
  const padY = 20

  return (
    <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white text-sm">Earnings over time</h3>
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: '#1e1e21', border: '1px solid #2a2a30' }}>
          {(['Net', 'Gross'] as const).map(label => (
            <button
              key={label}
              onClick={() => setGross(label === 'Gross')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                (label === 'Gross') === gross ? 'text-white' : 'text-[#8888a0] hover:text-white'
              }`}
              style={(label === 'Gross') === gross ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)' } : {}}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG chart */}
      <div className="relative" style={{ height: chartH }}>
        <svg width="100%" height={chartH} viewBox={`0 0 800 ${chartH}`} preserveAspectRatio="none" className="absolute inset-0">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e040fb" />
              <stop offset="100%" stopColor="#7c4dff" />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e040fb" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#7c4dff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const y = padY + (1 - t) * (chartH - padY * 2)
            return <line key={t} x1="0" y1={y} x2="800" y2={y} stroke="#2a2a30" strokeWidth="1" />
          })}
          {data.length > 1 && (() => {
            const pts = data.map((d, i) => {
              const x = (i / (data.length - 1)) * 800
              const y = padY + (1 - d.earnings / max) * (chartH - padY * 2)
              return { x, y }
            })
            const line = pts.map(p => `${p.x},${p.y}`).join(' L ')
            const area = `M ${pts[0].x},${chartH - padY} L ${pts.map(p => `${p.x},${p.y}`).join(' L ')} L ${pts[pts.length - 1].x},${chartH - padY} Z`
            return (
              <>
                <path d={area} fill="url(#areaGrad)" />
                <path d={`M ${line}`} stroke="url(#chartGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="3" fill="#e040fb" />
                ))}
              </>
            )
          })()}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-[#8888a0]">{d.month}</span>
        ))}
      </div>

      {/* Breakdown table */}
      <div className="mt-6 border-t border-[#2a2a30] pt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#8888a0] text-xs uppercase tracking-wider">
              <th className="text-left pb-2 font-semibold">Source</th>
              <th className="text-right pb-2 font-semibold">All time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e21]">
            <tr>
              <td className="py-2.5 text-white font-semibold">Total</td>
              <td className="py-2.5 text-right font-bold" style={{ color: '#e040fb' }}>
                ${(data.reduce((s, d) => s + d.earnings, 0)).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UserAvatar({ name, avatarUrl, size = 8 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const cls = `w-${size} h-${size} rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white`
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name} className={`w-${size} h-${size} rounded-full object-cover shrink-0`} />
  }
  return (
    <div className={cls} style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)', minWidth: `${size * 4}px`, minHeight: `${size * 4}px` }}>
      {initials}
    </div>
  )
}

export default function DashboardClient({ user }: { user: User }) {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<FilterTab>('earnings')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      const data = await res.json()
      if (res.ok) setStats(data)
    } catch (_) {}
    finally {
      setLoadingStats(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStats()
  }

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const initials = user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const monthDiff = stats ? stats.thisMonthEarnings - stats.lastMonthEarnings : 0
  const monthDiffSign = monthDiff >= 0 ? '+' : '-'
  const monthDiffAbs = Math.abs(monthDiff)

  const SIDEBAR_NAV = [
    { href: '/feed', label: 'Home', icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>, icon2: <polyline points="9 22 9 12 15 12 15 22"/> },
    { href: '/explore', label: 'Discover', icon: <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></> },
    { href: '/notifications', label: 'Notifications', icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></> },
    { href: '/messages', label: 'Chats', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
    { href: '/dashboard', label: 'Earnings & Payouts', active: true, icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
    { href: '/wallet', label: 'Wallet', icon: <><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/></> },
    { href: '/settings', label: 'Settings', icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></> },
  ]

  const FILTER_TABS: { id: FilterTab; label: string }[] = [
    { id: 'earnings', label: 'Earnings' },
    { id: 'monthly', label: 'Monthly Earnings' },
    { id: 'subscribers', label: 'Subscribers' },
    { id: 'content', label: 'Content' },
  ]

  return (
    <div className="flex h-screen bg-[#0d0d0f] text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className="relative flex flex-col h-full shrink-0 transition-all duration-200 border-r border-[#1e1e21]"
        style={{ width: sidebarCollapsed ? '64px' : '240px', background: '#111113' }}
      >
        <button
          onClick={() => setSidebarCollapsed(c => !c)}
          className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[#8888a0] hover:text-white transition-colors"
          style={{ background: '#1e1e21', border: '1px solid #2a2a30' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Logo */}
        {!sidebarCollapsed && (
          <div className="px-5 py-4 border-b border-[#1e1e21]">
            <span className="text-xl font-black" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>velvet</span>
          </div>
        )}

        {/* User */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-[#1e1e21] ${sidebarCollapsed ? 'justify-center' : ''}`}>
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}>
              {initials}
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">{user.displayName}</div>
              <div className="text-xs text-[#8888a0]">@{user.username}</div>
              {stats && (
                <div className="text-[10px] text-[#555568] mt-0.5">
                  {stats.activeSubs} fans · {stats.totalSubs} subscribers
                </div>
              )}
            </div>
          )}
        </div>

        {/* New Post button */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3">
            <Link
              href={`/${user.username}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #e040fb, #7c4dff)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Post
            </Link>
          </div>
        )}

        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {SIDEBAR_NAV.map(({ href, label, icon, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${sidebarCollapsed ? 'justify-center' : ''} ${active ? 'text-[#e040fb]' : 'text-[#8888a0] hover:text-white'}`}
              style={active ? { background: 'rgba(224,64,251,0.12)' } : undefined}
              title={sidebarCollapsed ? label : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
                {icon}
              </svg>
              {!sidebarCollapsed && <span className="text-sm font-medium">{label}</span>}
            </Link>
          ))}
        </nav>

        <div className="px-2 pb-4">
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 w-full text-[#8888a0] hover:text-white transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
            title={sidebarCollapsed ? 'Log out' : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!sidebarCollapsed && <span className="text-sm font-medium">Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-black text-white">Insights</h1>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#8888a0]">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#8888a0] hover:text-white border border-[#2a2a30] hover:border-[#e040fb44] transition-all disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}>
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Filter tabs + time range */}
            <div className="flex items-center justify-between mb-6 border-b border-[#2a2a30] pb-4">
              <div className="flex items-center gap-1">
                {FILTER_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activeFilter === tab.id
                        ? 'text-white'
                        : 'text-[#8888a0] hover:text-white'
                    }`}
                    style={activeFilter === tab.id ? { background: 'linear-gradient(135deg, #e040fb, #7c4dff)' } : {}}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8888a0]">
                <button className="px-3 py-1.5 rounded-lg border border-[#2a2a30] hover:border-[#e040fb44] transition-colors flex items-center gap-1.5">
                  All time
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </div>

            {loadingStats ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 rounded-full border-2 border-[#e040fb] border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Total earnings */}
                  <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[#8888a0] text-xs font-semibold uppercase tracking-wider mb-1">Earnings</p>
                        <p className="text-3xl font-black text-white">${stats?.totalEarnings.toFixed(2) ?? '0.00'}</p>
                        <p className="text-[#8888a0] text-xs mt-1">All time</p>
                      </div>
                      <Sparkline data={stats?.monthlyChart.map(m => m.earnings) ?? []} />
                    </div>
                  </div>

                  {/* This month */}
                  <div className="rounded-2xl border border-[#2a2a30] bg-[#161618] p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[#8888a0] text-xs font-semibold uppercase tracking-wider mb-1">This Month</p>
                        <p className="text-3xl font-black text-white">${stats?.thisMonthEarnings.toFixed(2) ?? '0.00'}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: monthDiff >= 0 ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)',
                              color: monthDiff >= 0 ? '#4ade80' : '#f87171',
                            }}
                          >
                            {monthDiffSign}${monthDiffAbs.toFixed(2)} vs last month
                          </span>
                        </div>
                      </div>
                      <Sparkline
                        data={stats?.monthlyChart.slice(-6).map(m => m.earnings) ?? []}
                        color={monthDiff >= 0 ? '#4ade80' : '#f87171'}
                      />
                    </div>
                  </div>
                </div>

                {/* Earnings over time chart */}
                {stats && <EarningsChart data={stats.monthlyChart} />}

                {/* Breakdown table */}
                <div className="mt-4 rounded-2xl border border-[#2a2a30] bg-[#161618] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#2a2a30]">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">Earnings Breakdown</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1e1e21]">
                        {['Source', 'All Time', 'This Month'].map(h => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-[#8888a0] uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1e21]">
                      {[
                        { label: 'Subscriptions', total: stats?.subEarnings ?? 0, month: 0 },
                        { label: 'Post Unlocks', total: stats?.postEarnings ?? 0, month: 0 },
                        { label: 'Tips', total: stats?.tipEarnings ?? 0, month: 0 },
                        { label: 'Messages', total: stats?.messageEarnings ?? 0, month: 0 },
                      ].map(row => (
                        <tr key={row.label} className="hover:bg-[#1a1a1d] transition-colors">
                          <td className="px-6 py-3.5 text-white font-medium">{row.label}</td>
                          <td className="px-6 py-3.5 font-bold text-white">${row.total.toFixed(2)}</td>
                          <td className="px-6 py-3.5 text-[#8888a0]">${row.month.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#1a1a1d]">
                        <td className="px-6 py-3.5 font-black text-white">Total</td>
                        <td className="px-6 py-3.5 font-black" style={{ color: '#e040fb' }}>${stats?.totalEarnings.toFixed(2) ?? '0.00'}</td>
                        <td className="px-6 py-3.5 font-bold text-white">${stats?.thisMonthEarnings.toFixed(2) ?? '0.00'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </main>

        {/* Right panel */}
        <aside className="w-72 border-l border-[#1e1e21] bg-[#111113] overflow-auto shrink-0 p-4 space-y-6">
          {/* Top spenders */}
          <div>
            <h3 className="text-xs font-bold text-[#8888a0] uppercase tracking-wider mb-3">Top Spenders</h3>
            {!stats || stats.topSpenders.length === 0 ? (
              <p className="text-[#555568] text-xs text-center py-4">No spenders yet</p>
            ) : (
              <div className="space-y-2.5">
                {stats.topSpenders.slice(0, 8).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2.5">
                    <span className="text-[10px] text-[#555568] w-4 shrink-0">{i + 1}</span>
                    <UserAvatar name={s.displayName} avatarUrl={s.avatarUrl} size={7} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{s.displayName}</p>
                      <p className="text-[#8888a0] text-[10px]">@{s.username}</p>
                    </div>
                    <span className="text-xs font-bold text-[#e040fb] shrink-0">${s.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-[#1e1e21]" />

          {/* Recent transactions */}
          <div>
            <h3 className="text-xs font-bold text-[#8888a0] uppercase tracking-wider mb-3">Recent Activity</h3>
            {!stats || stats.recentTransactions.length === 0 ? (
              <p className="text-[#555568] text-xs text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentTransactions.map(tx => {
                  const colors = { tip: '#e040fb', unlock: '#7c4dff', subscription: '#4ade80' } as const
                  const icons = {
                    tip: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
                    unlock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
                    subscription: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
                  }
                  return (
                    <div key={tx.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${colors[tx.type]}18` }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke={colors[tx.type]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          {icons[tx.type]}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{tx.user.displayName}</p>
                        <p className="text-[#8888a0] text-[10px] truncate">{tx.description}</p>
                        <p className="text-[#555568] text-[10px]">{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                      <span className="text-xs font-bold shrink-0" style={{ color: colors[tx.type] }}>+${tx.amount.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
