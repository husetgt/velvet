'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CreatorLoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    email: '', username: '', displayName: '', password: '', subscriptionPrice: '9.99', accessCode: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword(loginForm)
      if (error) throw error
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (registerForm.accessCode !== 'Hello123') {
      setError('Invalid access code')
      setLoading(false)
      return
    }
    try {
      const { accessCode: _code, ...signupData } = registerForm
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...signupData, role: 'CREATOR' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setSuccess('Creator account created! Please sign in.')
      setTab('login')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] blur-[120px] rounded-full" style={{background: 'linear-gradient(135deg, rgba(124,77,255,0.2), rgba(224,64,251,0.1))'}} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="velvet-gradient-text text-3xl font-bold">Velvet</Link>
          <p className="text-[#8888a0] mt-2">Creator Hub</p>
        </div>

        <div className="rounded-2xl p-8 border border-[#2a2a30] bg-[#161618]">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-[#1e1e21] rounded-xl mb-6">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? 'text-white'
                    : 'text-[#8888a0] hover:text-white'
                }`}
                style={tab === t ? {background: 'linear-gradient(135deg, #e040fb, #7c4dff)'} : {}}
              >
                {t === 'login' ? 'Sign In' : 'Join as Creator'}
              </button>
            ))}
          </div>

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Email</label>
                <input type="email" required value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="creator@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#7c4dff] focus:ring-1 focus:ring-[#7c4dff33] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Password</label>
                <input type="password" required value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#7c4dff] focus:ring-1 focus:ring-[#7c4dff33] transition-all"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity mt-2"
                style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}>
                {loading ? 'Signing in...' : 'Sign In to Creator Hub'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Display Name</label>
                <input type="text" required value={registerForm.displayName}
                  onChange={e => setRegisterForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="Your creator name"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#7c4dff] focus:ring-1 focus:ring-[#7c4dff33] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Username</label>
                <input type="text" required value={registerForm.username}
                  onChange={e => setRegisterForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  placeholder="yourhandle"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#7c4dff] focus:ring-1 focus:ring-[#7c4dff33] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Email</label>
                <input type="email" required value={registerForm.email}
                  onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#7c4dff] focus:ring-1 focus:ring-[#7c4dff33] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Password</label>
                <input type="password" required minLength={8} value={registerForm.password}
                  onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#7c4dff] focus:ring-1 focus:ring-[#7c4dff33] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Monthly Subscription Price (USD)</label>
                <input type="number" min="1" step="0.01" value={registerForm.subscriptionPrice}
                  onChange={e => setRegisterForm(f => ({ ...f, subscriptionPrice: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#7c4dff] focus:ring-1 focus:ring-[#7c4dff33] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8888a0] mb-1.5">Creator Access Code</label>
                <input type="password" required value={registerForm.accessCode}
                  onChange={e => setRegisterForm(f => ({ ...f, accessCode: e.target.value }))}
                  placeholder="Enter your access code"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1e1e21] border border-[#2a2a30] text-white placeholder-[#555568] focus:outline-none focus:border-[#7c4dff] focus:ring-1 focus:ring-[#7c4dff33] transition-all"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity mt-2"
                style={{background: 'linear-gradient(135deg, #e040fb, #7c4dff)'}}>
                {loading ? 'Creating account...' : 'Join as Creator'}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-[#555568] mt-6">
            <Link href="/login" className="hover:text-[#8888a0] transition-colors">Fan login →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
